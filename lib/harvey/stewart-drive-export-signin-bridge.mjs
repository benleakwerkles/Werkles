import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const HANDLE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const FILE_ID = /^[A-Za-z0-9_-]{20,100}$/;
const SHEET = "Personal";
const ROW = 7;
const TITLE = "Disney / Hulu / ESPN";
const REAL_SOURCE_FILE_ID = "1yGg4HJQOJxyBkxqly3I4kk3YCeP3oNLDD0JlhCOkqNk";
const MAX_EXPORT_BYTES = 2_000_000;

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== [...fields].sort().join(",")) fail(code);
}

/** The source ref includes the authenticated Drive ID and the exact exported bytes. */
export function disneyDriveExportSourceRef({ file_id, export_sha256 }) {
  if (!FILE_ID.test(file_id ?? "") || !HASH.test(export_sha256 ?? "")) fail("STEWART_DRIVE_SOURCE_REF_INVALID");
  return digest(["pookakind.disney-drive-export-source/v1", file_id, SHEET, ROW, TITLE, export_sha256]);
}

/**
 * Disabled for live use: a connector URL or whole-workbook bytes visible to
 * this process are not an isolated credential ingress. Synthetic tests use
 * bindDisneyDriveExportToStewartSignIn with a non-live source ID.
 */
export async function bindDisneyDriveFileUriToStewartSignIn({ file_uri, ...options }, dependencies = {}) {
  void file_uri; void options; void dependencies;
  fail("STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED");
}

/**
 * Exact authenticated export -> two local DPAPI handles. The caller receives
 * only sealed hashes and opaque references, never plaintext or a decryptor.
 * The caller must acquire the Drive export without passing cell values through
 * chat, command arguments, logs, or the returned receipt.
 */
export function bindDisneyDriveExportToStewartSignIn({
  export_bytes, export_sha256, source_file_id, python_executable, extractor_path,
  resolver_executable, local_app_data, operation_sha256, account_ref_sha256,
  identity_handle_name, password_handle_name,
  run_extract = spawnSync,
}) {
  if (!Buffer.isBuffer(export_bytes) || ![export_sha256, operation_sha256, account_ref_sha256].every((value) => HASH.test(value ?? ""))
    || !FILE_ID.test(source_file_id ?? "") || !HANDLE_NAME.test(identity_handle_name ?? "")
    || !HANDLE_NAME.test(password_handle_name ?? "") || identity_handle_name === password_handle_name
    || typeof local_app_data !== "string" || !local_app_data
    || typeof run_extract !== "function") fail("STEWART_DRIVE_BRIDGE_INPUT_INVALID");
  if (source_file_id === REAL_SOURCE_FILE_ID) fail("STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED");
  const source_ref_sha256 = disneyDriveExportSourceRef({ file_id: source_file_id, export_sha256 });

  let output;
  const names = [identity_handle_name, password_handle_name];
  const allowed_root = resolve(local_app_data, "PookaKind", "Stewart", "SecretHandles");
  let sealedByThisInvocation = false;
  try {
    const extractorPath = realpathSync(resolve(extractor_path));
    const pythonPath = realpathSync(resolve(python_executable));
    const resolverPath = realpathSync(resolve(resolver_executable));
    if (export_bytes.length < 1 || export_bytes.length > MAX_EXPORT_BYTES || sha(export_bytes) !== export_sha256) fail("STEWART_DRIVE_EXPORT_CUSTODY_INVALID");
    mkdirSync(allowed_root, { recursive: true });
    const extracted = run_extract(pythonPath, [extractorPath, "--seal-stdin", SHEET, String(ROW), TITLE,
      resolverPath, allowed_root, ...names, "json"], {
      input: export_bytes, windowsHide: true, encoding: null, maxBuffer: 16 * 1024,
    });
    output = extracted?.stdout;
    if (extracted?.status !== 0 || !Buffer.isBuffer(output) || output.length > 512
      || (extracted?.stderr?.length ?? 0) !== 0) fail("STEWART_DRIVE_PRIVATE_SEAL_FAILED");
    let sealed;
    try { sealed = JSON.parse(output.toString("utf8")); } catch { fail("STEWART_DRIVE_PRIVATE_SEAL_FAILED"); }
    exact(sealed, ["state", "sealed_sha256"], "STEWART_DRIVE_PRIVATE_SEAL_FAILED");
    if (sealed.state !== "STEWART_DRIVE_SEALED_IN_PRIVATE_PROCESS"
      || !Array.isArray(sealed.sealed_sha256) || sealed.sealed_sha256.length !== 2
      || !sealed.sealed_sha256.every((value) => HASH.test(value))) fail("STEWART_DRIVE_PRIVATE_SEAL_FAILED");
    sealedByThisInvocation = true;
    const bindings = names.map((handle_name, index) => ({
      ref_sha256: digest(["pookakind.disney-drive-sign-in-handle/v1", operation_sha256, account_ref_sha256,
        source_ref_sha256, index === 0 ? "IDENTITY" : "CURRENT_PASSWORD"]),
      handle_name, dpapi_path: resolve(allowed_root, `${handle_name}.dpapi`), sealed_sha256: sealed.sealed_sha256[index],
    }));
    for (const binding of bindings) {
      const path = realpathSync(binding.dpapi_path);
      if (path !== binding.dpapi_path || sha(readFileSync(path)) !== binding.sealed_sha256) fail("STEWART_DRIVE_SEALED_CUSTODY_INVALID");
    }
    return Object.freeze({
      handles: Object.freeze(bindings.map(({ ref_sha256 }) => Object.freeze({
        schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256,
      }))),
      receipt: Object.freeze({ schema: "pookakind.disney-drive-stewart-sign-in-bridge/v1",
        state: "EXACT_DPAPI_SIGN_IN_HANDLES_BOUND_NOT_USED", provider_id: "DISNEY_MYDISNEY",
        operation_sha256, account_ref_sha256, source_ref_sha256, export_sha256,
        handle_refs_sha256: bindings.map(({ ref_sha256 }) => ref_sha256),
        sealed_sha256: bindings.map(({ sealed_sha256 }) => sealed_sha256),
        provider_contacted: false, secret_material_output: false, plaintext_to_orchestrator: false }),
    });
  } catch (error) {
    if (sealedByThisInvocation) {
      let rollbackClean = true;
      for (const name of names) {
        try { unlinkSync(resolve(allowed_root, `${name}.dpapi`)); } catch { rollbackClean = false; }
      }
      if (!rollbackClean) fail("STEWART_DRIVE_ROLLBACK_NOT_CLEAN");
    }
    if (error?.code?.startsWith("STEWART_") || error?.code?.startsWith("STEWART_DRIVE_")) throw error;
    fail("STEWART_DRIVE_BRIDGE_FAILED_CLOSED");
  } finally {
    if (Buffer.isBuffer(output)) output.fill(0);
  }
}
