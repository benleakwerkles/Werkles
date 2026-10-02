import { createHash } from "node:crypto";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const THUMBPRINT = /^[A-F0-9]{40,128}$/;
const PACKAGE_SHA256 = "5c43daea0d26b0b6e3f55e82e34c15d8ab6e72f60b10d29de4e8f1dc3b91fed3";
const EXECUTABLE_SHA256 = "b15ae4ef078e2493043072257fac7eea1af4a172e0c992791a56562b8d8c059d";
const MANIFEST_SHA256 = "84448085b68760758889de10c8164a038d1c3c6ea78eb1b05e1b24c8a217234a";
const SELF_TEST_SHA256 = "ebfcc06e893984c1479365576882e8a9230975a3b89768d52c9ef1b1e15d2c26";
const FIXTURE_SHA256 = "7df89df54df160d374a6744b47f0ad91e2a9015a341829d3c7c00f990f75891f";
const FIXTURE_MANIFEST_SHA256 = "7e8af10c737845d3aedf42a181b742a05ceda096ee86ee660d20fdf4bb274bd8";
const INSTALL_ROOT = "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess";
// SHA-256 of the exact APPROVAL_LOG.md entry that grants one synthetic V2 bootstrap.
// Consumption is keyed to the approval, not to a caller-selectable operation id.
const APPROVAL_SCOPE_SHA256 = "271b682b6766856b31a771659e501c9f2755ef893e0689716c05463fae40c8ce";
const FIELDS = ["approved_at", "certificate_profile", "complete_rollback_required", "decision", "expires_at", "install_root", "machine", "max_uses", "operation_id_sha256", "package_sha256", "production_executable_sha256", "recurrence", "schema"];
const CERTIFICATE_PROFILE_FIELDS = ["eku_oid", "hash_algorithm", "key_algorithm", "key_export_policy", "key_length", "not_after_minutes", "subject"];
const CERTIFICATE_PROFILE = Object.freeze({ subject: "CN=PookaKind Stewart Windows Security UIAccess Doss", key_algorithm: "RSA", key_length: 3072, hash_algorithm: "SHA256", eku_oid: "1.3.6.1.5.5.7.3.3", key_export_policy: "NON_EXPORTABLE", not_after_minutes: 60 });

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code); const keys = Reflect.ownKeys(value); const expected = [...fields].sort(); if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code); const actual = keys.map(String).sort(); for (let i = 0; i < actual.length; i += 1) { const d = Object.getOwnPropertyDescriptor(value, actual[i]); if (actual[i] !== expected[i] || !d?.enumerable || !("value" in d)) fail(code); } }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

export const STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE = Object.freeze({ approval_scope_sha256: APPROVAL_SCOPE_SHA256, package_sha256: PACKAGE_SHA256, production_executable_sha256: EXECUTABLE_SHA256, embedded_manifest_sha256: MANIFEST_SHA256, self_test_executable_sha256: SELF_TEST_SHA256, synthetic_fixture_executable_sha256: FIXTURE_SHA256, synthetic_fixture_manifest_sha256: FIXTURE_MANIFEST_SHA256, certificate_profile: CERTIFICATE_PROFILE, install_root: INSTALL_ROOT });

export function compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority, activation_record, now = Date.now() }) {
  exact(operator_authority, ["public_key_pem", "public_key_sha256"], "STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_INVALID");
  if (!HASH.test(operator_authority.public_key_sha256 ?? "") || keyFingerprint(operator_authority.public_key_pem) !== operator_authority.public_key_sha256) fail("STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_INVALID");
  if (!activation_record?.payload) fail("STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID"); const untrusted = activation_record.payload;
  exact(untrusted, FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID");
  let payload; try { payload = verifyDurableRecord(operator_authority.public_key_pem, activation_record, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-install:DOSS:${untrusted.operation_id_sha256}` }); } catch { fail("STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID"); }
  exact(payload, FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_ACTIVATION_INVALID");
  exact(payload.certificate_profile, CERTIFICATE_PROFILE_FIELDS, "STEWART_WINDOWS_SECURITY_INSTALL_CERTIFICATE_PROFILE_INVALID");
  const approved = Date.parse(payload.approved_at); const expires = Date.parse(payload.expires_at);
  if (payload.schema !== "pookakind.stewart-windows-security-uiaccess-install-authority/v1" || payload.decision !== "APPROVED" || payload.machine !== "DOSS" || !HASH.test(payload.operation_id_sha256 ?? "") || payload.package_sha256 !== PACKAGE_SHA256 || payload.production_executable_sha256 !== EXECUTABLE_SHA256 || payload.install_root !== INSTALL_ROOT || canonicalJson(payload.certificate_profile) !== canonicalJson(CERTIFICATE_PROFILE) || payload.max_uses !== 1 || payload.recurrence !== false || payload.complete_rollback_required !== true) fail("STEWART_WINDOWS_SECURITY_INSTALL_SCOPE_INVALID");
  if (!Number.isFinite(approved) || !Number.isFinite(expires) || approved > now || expires <= approved || expires - approved > 15 * 60_000 || expires < now) fail("STEWART_WINDOWS_SECURITY_INSTALL_AUTHORITY_STALE");
  return freeze({ schema: "pookakind.stewart-windows-security-uiaccess-install-transaction/v1", state: "PREPARED_EXACT_AUTHORITY_REQUIRED_AT_EXECUTION", operation_id_sha256: payload.operation_id_sha256, package_sha256: PACKAGE_SHA256, production_executable_sha256: EXECUTABLE_SHA256, machine: "DOSS", certificate_profile: structuredClone(CERTIFICATE_PROFILE), install_root: INSTALL_ROOT, activation_record_sha256: digest(activation_record), operator_authority: structuredClone(operator_authority), activation_record: structuredClone(activation_record), max_uses: 1, recurrence: false, ordered_steps: ["REQUIRE_CLEAN_ABSENT", "CLAIM_ONCE", "CREATE_EXACT_NONEXPORTABLE_SIGNER", "TRUST_EXACT_PUBLIC_CERTIFICATE", "SIGN_PINNED_PE_AND_FIXTURE", "VERIFY_AUTHENTICODE_AND_EMBEDDED_UIACCESS", "INSTALL_ADMIN_ONLY", "VERIFY_UIACCESS_TOKEN_SYNTHETIC", "ROLLBACK_EXACT_OWNED_STATE", "APPEND_TERMINAL"], rollback_steps: ["STOP_OWNED_SYNTHETIC_PROCESS_IF_ANY", "REMOVE_EXACT_INSTALLED_FILES", "REMOVE_EXACT_CREATED_LOCAL_MACHINE_PRIVATE_KEY_CERT", "REMOVE_EXACT_ROOT_TRUST_RECORD", "REMOVE_EXACT_TRUSTED_PUBLISHER_RECORD", "VERIFY_CLEAN_ABSENT"], secret_access_allowed: false, windows_security_allowed: false });
}

export function verifyStewartWindowsSecurityUiAccessSigningInstallTransaction(transaction, now = Date.now()) {
  if (!transaction || typeof transaction !== "object") fail("STEWART_WINDOWS_SECURITY_INSTALL_TRANSACTION_INVALID");
  const rebuilt = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: transaction.operator_authority, activation_record: transaction.activation_record, now });
  if (canonicalJson(rebuilt) !== canonicalJson(transaction)) fail("STEWART_WINDOWS_SECURITY_INSTALL_TRANSACTION_INVALID");
  return true;
}

export async function runStewartWindowsSecurityUiAccessSigningInstall({ transaction, store, adapter, now = Date.now() }) {
  verifyStewartWindowsSecurityUiAccessSigningInstallTransaction(transaction, now);
  if (store?.kind !== "DURABLE_APPEND_ONCE_V1" || typeof store.claim_once !== "function" || typeof store.read_terminal !== "function" || typeof store.append_terminal_once !== "function") fail("STEWART_WINDOWS_SECURITY_INSTALL_STORE_INVALID");
  const prior = await store.read_terminal(APPROVAL_SCOPE_SHA256); if (prior) return freeze(prior);
  if (!await store.claim_once(APPROVAL_SCOPE_SHA256)) return freeze({ schema: "pookakind.stewart-windows-security-uiaccess-install-receipt/v1", state: "CRASH_STRANDED_CLAIM", operation_id_sha256: transaction.operation_id_sha256, installed: false, live_callable: false, rollback_verified: false, secret_accessed: false });
  let installed = false; let failure = null; let rollbackVerified = false; let signed = null; let syntheticPassed = false;
  try {
    const baseline = await adapter.inspect(); if (baseline?.state !== "CLEAN_ABSENT") fail("STEWART_WINDOWS_SECURITY_INSTALL_BASELINE_NOT_CLEAN");
    signed = await adapter.sign_once(transaction); if (signed?.state !== "SIGNED_EXACT_PE" || !THUMBPRINT.test(signed.certificate_thumbprint ?? "") || signed.certificate_profile_sha256 !== digest(transaction.certificate_profile)) fail("STEWART_WINDOWS_SECURITY_INSTALL_SIGNING_FAILED");
    const result = await adapter.install_once(transaction); if (result?.state !== "INSTALLED_ADMIN_ONLY") fail("STEWART_WINDOWS_SECURITY_INSTALL_FAILED"); installed = true;
    const proof = await adapter.synthetic_proof_once(transaction); if (proof?.state !== "UIACCESS_BACKGROUND_SYNTHETIC_PASS" || proof.foreground_changed !== false || proof.secret_accessed !== false) fail("STEWART_WINDOWS_SECURITY_INSTALL_SYNTHETIC_FAILED"); syntheticPassed = true;
  } catch (error) { failure = error?.code ?? "STEWART_WINDOWS_SECURITY_INSTALL_FAILED_CLOSED"; }
  try { const rollback = await adapter.rollback_once(transaction); rollbackVerified = rollback?.state === "CLEAN_ABSENT_VERIFIED"; installed = !rollbackVerified; }
  catch { rollbackVerified = false; installed = true; }
  if (!rollbackVerified && !failure) failure = "STEWART_WINDOWS_SECURITY_INSTALL_ROLLBACK_RESIDUE";
  const receipt = freeze({ schema: "pookakind.stewart-windows-security-uiaccess-install-receipt/v1", state: failure ? (rollbackVerified ? "FAILED_ROLLED_BACK" : "FAILED_RESIDUAL_STATE") : (syntheticPassed ? "SYNTHETIC_PROVED_ROLLED_BACK" : "FAILED_ROLLED_BACK"), operation_id_sha256: transaction.operation_id_sha256, generated_certificate_thumbprint: signed?.certificate_thumbprint ?? null, installed, live_callable: false, rollback_verified: rollbackVerified, failure, secret_accessed: false });
  return freeze(await store.append_terminal_once(APPROVAL_SCOPE_SHA256, receipt));
}
