import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessOperation, createStewartWindowsSecuritySealedOperationStore } from "../../../lib/harvey/stewart-windows-security-uiaccess-operation.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const exec = promisify(execFile); const h = (c) => c.repeat(64); const now = Date.parse("2026-08-24T12:00:10.000Z");
const identity = generateIdentity(); const attacker = generateIdentity();
const authority = { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 };
const payload = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-operation/v1", action: "SUBMIT_OPAQUE_BLIND_PIN_ONCE", operation_id_sha256: h("a"), machine_sha256: h("b"), broker_sid_sha256: h("c"), route_epoch_sha256: h("d"), process_id: 4242, hwnd: "987654", window_class: "Credential Dialog Xaml Host", field_name_sha256: h("e"), final_name_sha256: h("f"), provider_scope_sha256: h("6"), provider_response_contract_sha256: h("7"), secret_handle_ref_sha256: h("1"), receipt_root_sha256: h("2"), issued_at: "2026-08-24T12:00:00.000Z", expires_at: "2026-08-24T12:00:20.000Z", max_uses: 1, ...overrides });
const record = (body = payload(), signer = identity) => signDurableRecord(signer.private_key_pem, body, { issuer: "pookakind-access-steward", audience: `stewart-windows-security:${body.machine_sha256}:${body.operation_id_sha256}` });

test("pinned signed operation compiles one sealed non-foreground command", () => {
  const command = compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(), expected_machine_sha256: h("b"), now });
  assert.equal(command.max_uses, 1); assert.equal(command.cms_signing_required, true); assert.equal(command.required_signer_binding, "MATCH_UIACCESS_EXECUTABLE_AUTHENTICODE_CERTIFICATE"); assert.equal(command.secret_material_output_allowed, false); assert.equal(command.foreground_change_allowed, false); assert.equal(Object.isFrozen(command), true);
});

test("sealed command storage is exclusive, byte-stable on replay, and rejects changed bytes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stewart-ws-sealed-"));
  try {
    const command = compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(), expected_machine_sha256: h("b"), now });
    const store = createStewartWindowsSecuritySealedOperationStore({ root: dir }); const first = store.seal_once(command); const replay = store.seal_once(command);
    assert.equal(first.state, "SEALED_ONCE"); assert.equal(replay.state, "EXACT_REPLAY"); assert.equal(first.path, replay.path);
    assert.throws(() => store.seal_once({ ...command, process_id: 9 }), /SEALED_REPLAY_CONFLICT/);
    const cms = Buffer.from("synthetic-cms-envelope"); assert.equal(store.write_signed_once({ operation_id_sha256: command.operation_id_sha256, cms_bytes: cms }).state, "SIGNED_ENVELOPE_STORED_ONCE"); assert.equal(store.write_signed_once({ operation_id_sha256: command.operation_id_sha256, cms_bytes: cms }).state, "EXACT_REPLAY"); assert.throws(() => store.write_signed_once({ operation_id_sha256: command.operation_id_sha256, cms_bytes: Buffer.from("changed") }), /CMS_REPLAY_CONFLICT/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("unsigned, attacker, tampered, stale, and scope-substituted authority fail closed", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: { payload: payload() }, expected_machine_sha256: h("b"), now }), /AUTHORITY_RECORD_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(payload(), attacker), expected_machine_sha256: h("b"), now }), /AUTHORITY_RECORD_INVALID/);
  const signed = record(); assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: { ...signed, payload: { ...signed.payload, process_id: 9 } }, expected_machine_sha256: h("b"), now }), /AUTHORITY_RECORD_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(payload({ expires_at: "2026-08-24T12:01:00.000Z" })), expected_machine_sha256: h("b"), now }), /OPERATION_STALE/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(payload({ window_class: "Other" })), expected_machine_sha256: h("b"), now }), /OPERATION_SCOPE_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(payload({ process_id: 0 })), expected_machine_sha256: h("b"), now }), /OPERATION_SCOPE_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record(payload({ hwnd: "0" })), expected_machine_sha256: h("b"), now }), /OPERATION_SCOPE_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record: record({ ...payload(), injected_secret: "forbidden" }), expected_machine_sha256: h("b"), now }), /OPERATION_FIELDS_INVALID/);
});

test("native adapter mechanically enforces exact surface, one-use, UIAccess, secure root, secrecy, and no foreground APIs", async () => {
  const source = await readFile(new URL("../native/PookaKindWindowsSecurityUiAccessAdapter.cs", import.meta.url), "utf8");
  assert.match(source, /SignedCms/); assert.match(source, /CheckSignature\(false\)/); assert.match(source, /operationSigner\.Thumbprint, executableSigner\.Thumbprint/); assert.match(source, /1\.3\.6\.1\.5\.5\.7\.3\.3/); assert.match(source, /Path\.GetExtension\(full\) != "\.p7m"/);
  assert.match(source, /TokenUIAccess/); assert.match(source, /enabled != 1/); assert.match(source, /FileMode\.CreateNew/); assert.match(source, /CRASH_STRANDED_OR_REPLAYED_CLAIM/);
  assert.match(source, /pid != command\.process_id/); assert.match(source, /className\.ToString\(\) != ExpectedClass/); assert.match(source, /writable\.Count != 1 \|\| invokable\.Count != 1/);
  assert.match(source, /command\.broker_sid_sha256 != Hash\(sid\.Value\)/); assert.match(source, /command\.receipt_root_sha256 != receiptRoot/); assert.match(source, /command\.secret_handle_ref_sha256 != handleRef/);
  assert.match(source, /command\.provider_scope_sha256/); assert.match(source, /command\.provider_response_contract_sha256/);
  assert.match(source, /device-pin\.dpapi\.txt/); assert.match(source, /Encoding\.ASCII\.GetString/); assert.match(source, /new UnicodeEncoding/);
  assert.match(source, /ProtectedData\.Unprotect/); assert.match(source, /Array\.Clear\(plainBytes/); assert.match(source, /Array\.Clear\(encoded/); assert.match(source, /ZeroString\(secret\)/); assert.match(source, /secret_material_exposed\\\":false/);
  assert.match(source, /ProgramFiles/); assert.match(source, /SECURE_INSTALL_ACL_REQUIRED/); assert.doesNotMatch(source, /SetForegroundWindow|PostMessage|SendInput|SendKeys|Clipboard|mouse_event|keybd_event|SetCursorPos/);
  assert.doesNotMatch(source, /Console\.(?:Write|WriteLine)\(secret|Console\.Error\.WriteLine\(error\.(?:ToString|StackTrace|Message)/);
  assert.match(source, /--synthetic-higher-integrity-proof/); assert.match(source, /SYNTHETIC_HIGHER_INTEGRITY_UIA_PASS/); assert.match(source, /SyntheticMarker/);
  assert.match(source, /IsElevated\(Process\.GetCurrentProcess\(\)\)/); assert.match(source, /targetElevated = IsElevated\(target\)/);
  assert.match(source, /RequireAuthenticodeSigner/); assert.match(source, /AUTHENTICODE_SIGNER_REQUIRED/); assert.match(source, /AUTHENTICODE_SIGNER_INVALID/);
  assert.match(source, /token_uiaccess\\\":true/); assert.match(source, /authenticode_signer_thumbprint/); assert.match(source, /secure_program_files_path\\\":true/);
  assert.match(source, /adapter_elevated/); assert.match(source, /target_elevated/); assert.match(source, /uia_marker_count\\\":1/);
  assert.ok(source.indexOf("--synthetic-higher-integrity-proof") < source.indexOf("--sealed-operation"), "synthetic proof must remain distinct from secret execution");
  assert.ok(source.indexOf("FileMode.CreateNew") < source.indexOf("ProtectedData.Unprotect"), "claim must burn before DPAPI resolution");
  assert.ok(source.indexOf("if (File.Exists(receipt))") < source.indexOf("FileMode.CreateNew"), "exact terminal replay must avoid a second claim/control path");
});

test("build embeds and extracts uiAccess manifest while self-test uses a separate inactive PE", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stewart-ws-uiaccess-test-"));
  try {
    const script = new URL("../Build-PookaKindWindowsSecurityUiAccessPackage.ps1", import.meta.url).pathname.slice(1);
    const { stdout } = await exec("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-OutputDirectory", dir], { maxBuffer: 1024 * 1024 });
    const receipt = JSON.parse(stdout.trim()); assert.equal(receipt.state, "SOURCE_READY_FOR_SIGNING__UNSIGNED_INACTIVE"); assert.equal(receipt.embedded_uiaccess_verified, true); assert.equal(receipt.provider_neutral_higher_integrity_synthetic_present, true); assert.equal(receipt.file_count, 5); assert.equal(receipt.authenticode_status, "NOTSIGNED"); assert.equal(receipt.installed, false); assert.equal(receipt.secret_accessed, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
