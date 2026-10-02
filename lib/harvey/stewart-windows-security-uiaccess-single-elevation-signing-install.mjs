import { createHash } from "node:crypto";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const INSTALL_ROOT = "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess";
const FIELDS = ["activation_driver_sha256", "approval_scope_sha256", "approved_at", "certificate_profile", "complete_rollback_required", "decision", "expires_at", "install_root", "machine", "max_uac_prompts", "max_uses", "operation_id_sha256", "package_sha256", "production_executable_sha256", "recurrence", "schema"];
const CERTIFICATE_PROFILE_FIELDS = ["eku_oid", "hash_algorithm", "key_algorithm", "key_export_policy", "key_length", "not_after_minutes", "subject"];
const CERTIFICATE_PROFILE = Object.freeze({ subject: "CN=PookaKind Stewart Windows Security UIAccess Doss", key_algorithm: "RSA", key_length: 3072, hash_algorithm: "SHA256", eku_oid: "1.3.6.1.5.5.7.3.3", key_export_policy: "NON_EXPORTABLE", not_after_minutes: 60 });

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code); const keys = Reflect.ownKeys(value); const expected = [...fields].sort(); if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code); const actual = keys.map(String).sort(); for (let index = 0; index < actual.length; index += 1) { const descriptor = Object.getOwnPropertyDescriptor(value, actual[index]); if (actual[index] !== expected[index] || !descriptor?.enumerable || !("value" in descriptor)) fail(code); } }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

export function deriveStewartWindowsSecurityUiAccessApprovalScope(payload) {
  return digest({ domain: "pookakind.stewart-windows-security-uiaccess-single-elevation-approval-scope/v2", machine: payload.machine, operation_id_sha256: payload.operation_id_sha256, package_sha256: payload.package_sha256, activation_driver_sha256: payload.activation_driver_sha256, production_executable_sha256: payload.production_executable_sha256, certificate_profile: payload.certificate_profile, install_root: payload.install_root, approved_at: payload.approved_at, expires_at: payload.expires_at, max_uses: payload.max_uses, max_uac_prompts: payload.max_uac_prompts, recurrence: payload.recurrence, complete_rollback_required: payload.complete_rollback_required });
}

export function compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority, activation_record, now = Date.now() }) {
  exact(operator_authority, ["public_key_pem", "public_key_sha256"], "STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_INVALID");
  if (!HASH.test(operator_authority.public_key_sha256 ?? "") || keyFingerprint(operator_authority.public_key_pem) !== operator_authority.public_key_sha256) fail("STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_INVALID");
  if (!activation_record?.payload) fail("STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID");
  const untrusted = activation_record.payload; exact(untrusted, FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID");
  let payload; try { payload = verifyDurableRecord(operator_authority.public_key_pem, activation_record, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-single-elevation:DOSS:${untrusted.operation_id_sha256}` }); } catch { fail("STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID"); }
  exact(payload, FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID"); exact(payload.certificate_profile, CERTIFICATE_PROFILE_FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_CERTIFICATE_PROFILE_INVALID");
  const approved = Date.parse(payload.approved_at); const expires = Date.parse(payload.expires_at);
  const approvalScope = deriveStewartWindowsSecurityUiAccessApprovalScope(payload);
  if (payload.schema !== "pookakind.stewart-windows-security-uiaccess-single-elevation-authority/v1" || payload.decision !== "APPROVED" || payload.machine !== "DOSS" || payload.approval_scope_sha256 !== approvalScope || !HASH.test(payload.operation_id_sha256 ?? "") || !HASH.test(payload.package_sha256 ?? "") || !HASH.test(payload.activation_driver_sha256 ?? "") || !HASH.test(payload.production_executable_sha256 ?? "") || payload.install_root !== INSTALL_ROOT || canonicalJson(payload.certificate_profile) !== canonicalJson(CERTIFICATE_PROFILE) || payload.max_uses !== 1 || payload.max_uac_prompts !== 1 || payload.recurrence !== false || payload.complete_rollback_required !== true) fail("STEWART_WINDOWS_SECURITY_INSTALL_SCOPE_INVALID");
  if (!Number.isFinite(approved) || !Number.isFinite(expires) || approved > now || expires <= approved || expires - approved > 15 * 60_000 || expires < now) fail("STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_STALE");
  const APPROVAL_SCOPE_SHA256 = approvalScope;
  return freeze({ schema: "pookakind.stewart-windows-security-uiaccess-single-elevation-transaction/v1", state: "PREPARED_EXACT_AUTHORITY_REQUIRED_AT_EXECUTION", approval_scope_sha256: APPROVAL_SCOPE_SHA256, operation_id_sha256: payload.operation_id_sha256, package_sha256: payload.package_sha256, activation_driver_sha256: payload.activation_driver_sha256, production_executable_sha256: payload.production_executable_sha256, machine: "DOSS", certificate_profile: structuredClone(CERTIFICATE_PROFILE), install_root: INSTALL_ROOT, activation_record_sha256: digest(activation_record), operator_authority: structuredClone(operator_authority), activation_record: structuredClone(activation_record), max_uses: 1, max_uac_prompts: 1, recurrence: false, ordered_steps: ["REQUIRE_CLEAN_ABSENT", "CLAIM_APPROVAL_SCOPE_ONCE", "ONE_UAC_ELEVATED_LIFECYCLE", "CREATE_EXACT_NONEXPORTABLE_SIGNER", "TRUST_EXACT_PUBLIC_CERTIFICATE", "SIGN_PINNED_PE_AND_FIXTURE", "VERIFY_AUTHENTICODE_AND_EMBEDDED_UIACCESS", "INSTALL_ADMIN_ONLY", "VERIFY_UIACCESS_TOKEN_SYNTHETIC_EVENT_DRIVEN", "ROLLBACK_EXACT_OWNED_STATE_IN_FINALLY", "APPEND_TERMINAL"], rollback_steps: ["STOP_OWNED_SYNTHETIC_PROCESS_IF_ANY", "REMOVE_EXACT_INSTALLED_FILES", "REMOVE_EXACT_CREATED_LOCAL_MACHINE_PRIVATE_KEY_CERT", "REMOVE_EXACT_ROOT_TRUST_RECORD", "REMOVE_EXACT_TRUSTED_PUBLISHER_RECORD", "VERIFY_CLEAN_ABSENT"], secret_access_allowed: false, windows_security_allowed: false, provider_action_allowed: false });
}

export function verifyStewartWindowsSecurityUiAccessSingleElevationInstallTransaction(transaction, now = Date.now()) {
  if (!transaction || typeof transaction !== "object") fail("STEWART_WINDOWS_SECURITY_INSTALL_TRANSACTION_INVALID");
  const rebuilt = compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: transaction.operator_authority, activation_record: transaction.activation_record, now });
  if (canonicalJson(rebuilt) !== canonicalJson(transaction)) fail("STEWART_WINDOWS_SECURITY_INSTALL_TRANSACTION_INVALID");
  return true;
}
