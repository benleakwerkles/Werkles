"""Extract one pinned sign-in row from a local authenticated XLSX export.

Only a length-prefixed binary frame is written to stdout. Errors are fixed codes.
"""

import io
import hashlib
import json
import os
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
MAX_EXPORT = 2_000_000
MAX_UNPACKED = 10_000_000


def reject(code):
    raise ValueError(code)


def cell_text(cell, shared):
    if cell.find(f"{{{MAIN}}}f") is not None:
        reject("STEWART_DRIVE_FORMULA_REJECTED")
    kind = cell.get("t")
    if kind == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{MAIN}}}t"))
    value = cell.find(f"{{{MAIN}}}v")
    if value is None or value.text is None:
        return ""
    if kind == "s":
        try:
            return shared[int(value.text)]
        except (ValueError, IndexError):
            reject("STEWART_DRIVE_SHARED_STRING_INVALID")
    if kind in (None, "str"):
        return value.text
    reject("STEWART_DRIVE_CELL_TYPE_INVALID")


def row_values(sheet, row_number, shared):
    rows = sheet.findall(f".//{{{MAIN}}}sheetData/{{{MAIN}}}row")
    matches = [row for row in rows if row.get("r") == str(row_number)]
    if len(matches) != 1:
        reject("STEWART_DRIVE_ROW_NOT_EXACT_ONE")
    result = {}
    for cell in matches[0].findall(f"{{{MAIN}}}c"):
        ref = cell.get("r", "")
        column = "".join(char for char in ref if char.isalpha())
        if not column or column in result:
            reject("STEWART_DRIVE_ROW_INVALID")
        result[column] = cell_text(cell, shared)
    return result


def extract(data, sheet_name, row_number, title):
    if not (0 < len(data) <= MAX_EXPORT and sheet_name == "Personal"
            and row_number == 7 and title == "Disney / Hulu / ESPN"):
        reject("STEWART_DRIVE_SOURCE_SCOPE_INVALID")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) > 200 or sum(item.file_size for item in entries) > MAX_UNPACKED:
            reject("STEWART_DRIVE_EXPORT_TOO_LARGE")
        if len({item.filename for item in entries}) != len(entries):
            reject("STEWART_DRIVE_EXPORT_STRUCTURE_INVALID")
        def read(name):
            if name not in archive.namelist():
                reject("STEWART_DRIVE_EXPORT_STRUCTURE_INVALID")
            return archive.read(name)

        workbook = ET.fromstring(read("xl/workbook.xml"))
        sheets = [item for item in workbook.findall(f".//{{{MAIN}}}sheet") if item.get("name") == sheet_name]
        if len(sheets) != 1:
            reject("STEWART_DRIVE_SHEET_NOT_EXACT_ONE")
        relation_id = sheets[0].get(f"{{{DOC_REL}}}id")
        relations = ET.fromstring(read("xl/_rels/workbook.xml.rels"))
        targets = [item.get("Target") for item in relations.findall(f"{{{PKG_REL}}}Relationship")
                   if item.get("Id") == relation_id]
        if len(targets) != 1 or not targets[0]:
            reject("STEWART_DRIVE_SHEET_RELATION_INVALID")
        target = targets[0].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        if ".." in target.split("/") or not target.startswith("xl/worksheets/"):
            reject("STEWART_DRIVE_SHEET_RELATION_INVALID")
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ET.fromstring(read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{{{MAIN}}}t"))
                      for item in strings.findall(f"{{{MAIN}}}si")]
        sheet = ET.fromstring(read(target))
        header_row = row_values(sheet, 1, shared)
        normalized = [value.strip().lower() for value in header_row.values()]
        if len(normalized) != len(set(normalized)):
            reject("STEWART_DRIVE_HEADERS_INVALID")
        headers = {value.strip().lower(): column for column, value in header_row.items()}
        if not all(key in headers for key in ("title", "username", "password")):
            reject("STEWART_DRIVE_HEADERS_INVALID")
        row = row_values(sheet, row_number, shared)
        if row.get(headers["title"]) != title:
            reject("STEWART_DRIVE_TITLE_MISMATCH")
        identity = row.get(headers["username"], "")
        password = row.get(headers["password"], "")
        if not identity or not password:
            reject("STEWART_DRIVE_CREDENTIAL_ABSENT")
        encoded = [part.encode("utf-8") for part in (identity, password)]
        if any(len(part) > 4096 or any(byte < 32 or byte == 127 for byte in part) for part in encoded):
            reject("STEWART_DRIVE_CREDENTIAL_INVALID")
        return b"".join(struct.pack("<I", len(part)) + part for part in encoded)


def synthetic_workbook():
    workbook = (f'<workbook xmlns="{MAIN}" xmlns:r="{DOC_REL}">'
                '<sheets><sheet name="Personal" sheetId="1" r:id="rId1"/></sheets></workbook>')
    relations = (f'<Relationships xmlns="{PKG_REL}">'
                 '<Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
    sheet = (f'<worksheet xmlns="{MAIN}"><sheetData>'
             '<row r="1"><c r="A1" t="inlineStr"><is><t>title</t></is></c>'
             '<c r="B1" t="inlineStr"><is><t>username</t></is></c>'
             '<c r="C1" t="inlineStr"><is><t>password</t></is></c></row>'
             '<row r="7"><c r="A7" t="inlineStr"><is><t>Disney / Hulu / ESPN</t></is></c>'
             '<c r="B7" t="inlineStr"><is><t>synthetic@example.invalid</t></is></c>'
             '<c r="C7" t="inlineStr"><is><t>synthetic-only</t></is></c></row>'
             '</sheetData></worksheet>')
    memory = io.BytesIO()
    with zipfile.ZipFile(memory, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", relations)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
    return memory.getvalue()


def self_test():
    expected = (struct.pack("<I", 25) + b"synthetic@example.invalid"
                + struct.pack("<I", 14) + b"synthetic-only")
    if extract(synthetic_workbook(), SHEET_NAME, ROW_NUMBER, EXPECTED_TITLE) != expected:
        reject("STEWART_DRIVE_SELF_TEST_FAILED")
    print("STEWART_DRIVE_PRIVATE_EXTRACTOR_SELF_TEST_PASS")


def seal_once(data, resolver_path, root, identity_name, password_name):
    names = (identity_name, password_name)
    if (not all(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", name) for name in names)
            or identity_name == password_name or not os.path.isfile(resolver_path)
            or not os.path.isdir(root)):
        reject("STEWART_DRIVE_SEAL_INPUT_INVALID")
    paths = [os.path.join(root, name + ".dpapi") for name in names]
    if any(os.path.exists(path) for path in paths):
        reject("STEWART_DRIVE_SEAL_DESTINATION_NOT_CLEAN")
    private_frame = bytearray(extract(data, SHEET_NAME, ROW_NUMBER, EXPECTED_TITLE))
    completed = []
    attempted = None
    try:
        offset = 0
        for name, path in zip(names, paths):
            length = struct.unpack_from("<I", private_frame, offset)[0]
            end = offset + 4 + length
            if length < 1 or length > 4096 or end > len(private_frame):
                reject("STEWART_DRIVE_PRIVATE_FRAME_INVALID")
            frame = bytearray(private_frame[offset:end])
            attempted = path
            try:
                result = subprocess.run([resolver_path, "--protect-stdin", "--handle", name,
                                         "--path", path], input=frame, capture_output=True,
                                        timeout=15, check=False, creationflags=subprocess.CREATE_NO_WINDOW)
            finally:
                frame[:] = b"\x00" * len(frame)
            if result.returncode != 0:
                reject("STEWART_DRIVE_NATIVE_SEAL_FAILED")
            if result.stdout.strip() != b"STEWART_HANDLE_PROTECTED_ONCE" or result.stderr:
                reject("STEWART_DRIVE_NATIVE_SEAL_RECEIPT_INVALID")
            completed.append(path)
            attempted = None
            offset = end
        if offset != len(private_frame):
            reject("STEWART_DRIVE_PRIVATE_FRAME_INVALID")
        sealed = []
        for path in paths:
            with open(path, "rb") as handle:
                value = handle.read(8193)
            if not 32 <= len(value) <= 8192:
                reject("STEWART_DRIVE_SEAL_OUTPUT_INVALID")
            sealed.append(hashlib.sha256(value).hexdigest())
        return {"state": "STEWART_DRIVE_SEALED_IN_PRIVATE_PROCESS", "sealed_sha256": sealed}
    except Exception:
        for path in completed + ([attempted] if attempted and os.path.exists(attempted) else []):
            try:
                os.remove(path)
            except OSError:
                reject("STEWART_DRIVE_SEAL_ROLLBACK_NOT_CLEAN")
        raise
    finally:
        private_frame[:] = b"\x00" * len(private_frame)


SHEET_NAME = "Personal"
ROW_NUMBER = 7
EXPECTED_TITLE = "Disney / Hulu / ESPN"


def main():
    if sys.argv[1:] == ["--self-test"]:
        self_test()
        return
    if sys.argv[1:] == ["--synthetic-export"]:
        sys.stdout.buffer.write(synthetic_workbook())
        return
    if len(sys.argv) != 10 or sys.argv[1] != "--seal-stdin":
        reject("STEWART_DRIVE_ARGUMENT_INVALID")
    _, sheet_name, row_string, title, resolver_path, root, identity_name, password_name, output_format = sys.argv[1:]
    if row_string != "7":
        reject("STEWART_DRIVE_SOURCE_SCOPE_INVALID")
    if output_format != "json" or sheet_name != SHEET_NAME or title != EXPECTED_TITLE:
        reject("STEWART_DRIVE_ARGUMENT_INVALID")
    data = bytearray(sys.stdin.buffer.read(MAX_EXPORT + 1))
    try:
        result = seal_once(data, resolver_path, root, identity_name, password_name)
        print(json.dumps(result, separators=(",", ":")))
    finally:
        data[:] = b"\x00" * len(data)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        code = str(error)
        if not code.startswith("STEWART_DRIVE_"):
            code = "STEWART_DRIVE_EXTRACTION_FAILED"
        print(code, file=sys.stderr)
        sys.exit(1)
