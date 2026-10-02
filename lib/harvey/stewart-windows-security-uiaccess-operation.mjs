import { createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ISSUER = "pookakind-access-steward";
const PAYLOAD_FIELDS = [
  "action", "broker_sid_sha256", "expires_at", "field_name_sha256", "final_name_sha256",
  "hwnd", "issued_at", "machine_sha256", "max_uses", "operation_id_sha256",
  "process_id", "provider_response_contract_sha256", "provider_scope_sha256", "receipt_root_sha256", "route_epoch_sha256", "schema",
  "secret_handle_ref_sha256", "window_class",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code);
  const keys = Reflect.ownKeys(value); const expected = [...fields].sort();
  if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code);
  const actual = keys.map(String).sort();
  for (let index = 0; index < actual.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, actual[index]);
    if (actual[index] !== expected[index] || !descriptor?.enumerable || !("value" in descriptor)) fail(code);
  }
}
function sha(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function frozen(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) frozen(child); return Object.freeze(value); }
function audience(payload) { return `stewart-windows-security:${payload.machine_sha256}:${payload.operation_id_sha256}`; }
function exactChild(root, name) { const child = resolve(root, name); const rel = relative(root, child); if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail("STEWART_WINDOWS_SECURITY_SEALED_PATH_INVALID"); return child; }
function exclusive(path, bytes) { const fd = openSync(path, "wx", 0o600); try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); } }

export function compileStewartWindowsSecurityUiAccessOperation({ authority, authority_record, expected_machine_sha256, now = Date.now() }) {
  exact(authority, ["public_key_pem", "public_key_sha256"], "STEWART_WINDOWS_SECURITY_AUTHORITY_PIN_INVALID");
  if (!HASH.test(authority.public_key_sha256 ?? "") || keyFingerprint(authority.public_key_pem) !== authority.public_key_sha256) fail("STEWART_WINDOWS_SECURITY_AUTHORITY_PIN_INVALID");
  if (!authority_record || typeof authority_record !== "object" || !authority_record.payload) fail("STEWART_WINDOWS_SECURITY_AUTHORITY_RECORD_INVALID");
  const untrusted = authority_record.payload;
  exact(untrusted, PAYLOAD_FIELDS, "STEWART_WINDOWS_SECURITY_OPERATION_FIELDS_INVALID");
  if (!HASH.test(expected_machine_sha256 ?? "") || untrusted.machine_sha256 !== expected_machine_sha256) fail("STEWART_WINDOWS_SECURITY_MACHINE_MISMATCH");
  let payload;
  try { payload = verifyDurableRecord(authority.public_key_pem, authority_record, { issuer: ISSUER, audience: audience(untrusted) }); }
  catch { fail("STEWART_WINDOWS_SECURITY_AUTHORITY_RECORD_INVALID"); }
  exact(payload, PAYLOAD_FIELDS, "STEWART_WINDOWS_SECURITY_OPERATION_FIELDS_INVALID");
  for (const field of ["broker_sid_sha256", "field_name_sha256", "final_name_sha256", "machine_sha256", "operation_id_sha256", "provider_response_contract_sha256", "provider_scope_sha256", "receipt_root_sha256", "route_epoch_sha256", "secret_handle_ref_sha256"]) if (!HASH.test(payload[field] ?? "")) fail("STEWART_WINDOWS_SECURITY_OPERATION_HASH_INVALID");
  if (payload.schema !== "pookakind.stewart-windows-security-operation/v1"
    || payload.action !== "SUBMIT_OPAQUE_BLIND_PIN_ONCE"
    || payload.max_uses !== 1
    || !Number.isSafeInteger(payload.process_id) || payload.process_id < 1
    || typeof payload.hwnd !== "string" || !/^[1-9][0-9]{0,19}$/.test(payload.hwnd)
    || payload.window_class !== "Credential Dialog Xaml Host") fail("STEWART_WINDOWS_SECURITY_OPERATION_SCOPE_INVALID");
  const issued = Date.parse(payload.issued_at); const expires = Date.parse(payload.expires_at);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > now || expires <= issued || expires - issued > 30_000 || expires < now) fail("STEWART_WINDOWS_SECURITY_OPERATION_STALE");
  const signedRecordSha256 = sha(authority_record);
  return frozen({
    schema: "pookakind.stewart-windows-security-sealed-command/v1",
    operation_id_sha256: payload.operation_id_sha256,
    signed_record_sha256: signedRecordSha256,
    machine_sha256: payload.machine_sha256,
    broker_sid_sha256: payload.broker_sid_sha256,
    route_epoch_sha256: payload.route_epoch_sha256,
    process_id: payload.process_id,
    hwnd: payload.hwnd,
    window_class: payload.window_class,
    field_name_sha256: payload.field_name_sha256,
    final_name_sha256: payload.final_name_sha256,
    provider_scope_sha256: payload.provider_scope_sha256,
    provider_response_contract_sha256: payload.provider_response_contract_sha256,
    secret_handle_ref_sha256: payload.secret_handle_ref_sha256,
    receipt_root_sha256: payload.receipt_root_sha256,
    issued_at: payload.issued_at,
    expires_at: payload.expires_at,
    max_uses: 1,
    cms_signing_required: true,
    required_signer_binding: "MATCH_UIACCESS_EXECUTABLE_AUTHENTICODE_CERTIFICATE",
    secret_material_output_allowed: false,
    foreground_change_allowed: false,
  });
}

export function createStewartWindowsSecuritySealedOperationStore({ root, owner_id = "Stewart@Doss" }) {
  if (typeof root !== "string" || !root || typeof owner_id !== "string" || !/^[A-Za-z0-9@._-]{1,96}$/.test(owner_id)) fail("STEWART_WINDOWS_SECURITY_SEALED_ROOT_INVALID");
  const requested = resolve(root); mkdirSync(requested, { recursive: true, mode: 0o700 }); const owned = realpathSync(requested);
  const markerPath = exactChild(owned, ".stewart-windows-security-owner.json"); const markerBytes = `${canonicalJson({ schema: "pookakind.stewart-windows-security-sealed-root/v1", owner_id })}\n`;
  if (!existsSync(markerPath)) { try { exclusive(markerPath, markerBytes); } catch (error) { if (error?.code !== "EEXIST") throw error; } }
  if (readFileSync(markerPath, "utf8") !== markerBytes) fail("STEWART_WINDOWS_SECURITY_SEALED_ROOT_OWNERSHIP_CONFLICT");
  return Object.freeze({
    seal_once(command) {
      exact(command, ["broker_sid_sha256", "cms_signing_required", "expires_at", "field_name_sha256", "final_name_sha256", "foreground_change_allowed", "hwnd", "issued_at", "machine_sha256", "max_uses", "operation_id_sha256", "process_id", "provider_response_contract_sha256", "provider_scope_sha256", "receipt_root_sha256", "required_signer_binding", "route_epoch_sha256", "schema", "secret_handle_ref_sha256", "secret_material_output_allowed", "signed_record_sha256", "window_class"], "STEWART_WINDOWS_SECURITY_SEALED_COMMAND_INVALID");
      const path = exactChild(owned, `${command.operation_id_sha256}.signing-draft.json`); const bytes = `${canonicalJson(command)}\n`;
      try { exclusive(path, bytes); return Object.freeze({ state: "SEALED_ONCE", path }); }
      catch (error) { if (error?.code !== "EEXIST") throw error; if (readFileSync(path, "utf8") !== bytes) fail("STEWART_WINDOWS_SECURITY_SEALED_REPLAY_CONFLICT"); return Object.freeze({ state: "EXACT_REPLAY", path }); }
    },
    write_signed_once({ operation_id_sha256, cms_bytes }) {
      if (!HASH.test(operation_id_sha256 ?? "") || !Buffer.isBuffer(cms_bytes) || cms_bytes.length < 1 || cms_bytes.length > 64 * 1024) fail("STEWART_WINDOWS_SECURITY_CMS_ENVELOPE_INVALID");
      const path = exactChild(owned, `${operation_id_sha256}.p7m`);
      try { exclusive(path, cms_bytes); return Object.freeze({ state: "SIGNED_ENVELOPE_STORED_ONCE", path }); }
      catch (error) { if (error?.code !== "EEXIST") throw error; const prior = readFileSync(path); if (!prior.equals(cms_bytes)) fail("STEWART_WINDOWS_SECURITY_CMS_REPLAY_CONFLICT"); return Object.freeze({ state: "EXACT_REPLAY", path }); }
    },
  });
}
