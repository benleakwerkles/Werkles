import { canonicalJson } from "./station-crypto-core.mjs";
import { verifyStewartWindowsSecurityUiAccessSigningInstallTransaction, STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release } from "./stewart-windows-security-uiaccess-signing-install.mjs";

const HASH = /^[a-f0-9]{64}$/;
const THUMBPRINT = /^[A-F0-9]{40,128}$/;
const INPUT_FIELDS = ["creation_intent", "observation", "transaction"];
const INTENT_FIELDS = ["activation_record_sha256", "certificate_profile", "issued_at", "operation_id_sha256", "package_sha256", "schema", "session_nonce_sha256"];
const PROFILE_FIELDS = ["eku_oid", "hash_algorithm", "key_algorithm", "key_export_policy", "key_length", "not_after_minutes", "subject"];
const OBSERVATION_FIELDS = ["install_root_present", "local_machine_my_candidates", "owned_process_count", "root_trust_count", "trusted_publisher_count"];
const CANDIDATE_FIELDS = ["eku_oid", "has_private_key", "key_algorithm", "key_length", "not_after", "not_before", "subject", "thumbprint"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  const actual = Reflect.ownKeys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => typeof key !== "string" || key !== expected[index])) fail(code);
  for (const key of expected) { const descriptor = Object.getOwnPropertyDescriptor(value, key); if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.get || descriptor.set) fail(code); }
}
function dense(value, maximum, code) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximum || Object.getOwnPropertySymbols(value).length) fail(code);
  const expected = Array.from({ length: value.length }, (_, index) => String(index)); const keys = Reflect.ownKeys(value);
  if (keys.length !== expected.length + 1 || keys.some((key) => typeof key !== "string" || (key !== "length" && !expected.includes(key)))) fail(code);
  for (const key of expected) { const descriptor = Object.getOwnPropertyDescriptor(value, key); if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.get || descriptor.set) fail(code); }
}

export function compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(input) {
  exact(input, INPUT_FIELDS, "STEWART_WINDOWS_SECURITY_ORPHAN_INPUT_INVALID");
  const approvedAt = Date.parse(input.transaction?.activation_record?.payload?.approved_at);
  if (!Number.isFinite(approvedAt)) fail("STEWART_WINDOWS_SECURITY_ORPHAN_TRANSACTION_INVALID");
  verifyStewartWindowsSecurityUiAccessSigningInstallTransaction(input.transaction, approvedAt + 1);
  exact(input.creation_intent, INTENT_FIELDS, "STEWART_WINDOWS_SECURITY_ORPHAN_INTENT_INVALID");
  exact(input.creation_intent.certificate_profile, PROFILE_FIELDS, "STEWART_WINDOWS_SECURITY_ORPHAN_INTENT_INVALID");
  if (input.creation_intent.schema !== "pookakind.stewart-windows-security-uiaccess-certificate-creation-intent/v1"
    || input.creation_intent.operation_id_sha256 !== input.transaction.operation_id_sha256
    || input.creation_intent.activation_record_sha256 !== input.transaction.activation_record_sha256
    || input.creation_intent.package_sha256 !== release.package_sha256
    || !HASH.test(input.creation_intent.session_nonce_sha256 ?? "")
    || canonicalJson(input.creation_intent.certificate_profile) !== canonicalJson(release.certificate_profile)) fail("STEWART_WINDOWS_SECURITY_ORPHAN_INTENT_CONFLICT");
  const issuedAt = Date.parse(input.creation_intent.issued_at);
  if (!Number.isFinite(issuedAt)) fail("STEWART_WINDOWS_SECURITY_ORPHAN_INTENT_INVALID");
  exact(input.observation, OBSERVATION_FIELDS, "STEWART_WINDOWS_SECURITY_ORPHAN_OBSERVATION_INVALID");
  if (input.observation.install_root_present !== false || input.observation.root_trust_count !== 0 || input.observation.trusted_publisher_count !== 0 || input.observation.owned_process_count !== 0) fail("STEWART_WINDOWS_SECURITY_ORPHAN_SCOPE_EXCEEDED");
  dense(input.observation.local_machine_my_candidates, 1, "STEWART_WINDOWS_SECURITY_ORPHAN_CANDIDATES_INVALID");
  if (input.observation.local_machine_my_candidates.length !== 1) fail("STEWART_WINDOWS_SECURITY_ORPHAN_CANDIDATE_AMBIGUOUS");
  const candidate = input.observation.local_machine_my_candidates[0]; exact(candidate, CANDIDATE_FIELDS, "STEWART_WINDOWS_SECURITY_ORPHAN_CANDIDATE_INVALID");
  const notBefore = Date.parse(candidate.not_before); const notAfter = Date.parse(candidate.not_after);
  if (!THUMBPRINT.test(candidate.thumbprint ?? "") || candidate.subject !== release.certificate_profile.subject || candidate.has_private_key !== true
    || candidate.key_algorithm !== release.certificate_profile.key_algorithm || candidate.key_length !== release.certificate_profile.key_length || candidate.eku_oid !== release.certificate_profile.eku_oid
    || !Number.isFinite(notBefore) || !Number.isFinite(notAfter) || notBefore < issuedAt - 5_000 || notBefore > issuedAt + 120_000
    || notAfter <= notBefore || notAfter > notBefore + (release.certificate_profile.not_after_minutes + 1) * 60_000) fail("STEWART_WINDOWS_SECURITY_ORPHAN_CANDIDATE_CONFLICT");
  return Object.freeze({ schema: "pookakind.stewart-windows-security-uiaccess-orphan-signer-recovery-plan/v1", state: "EXACT_ORPHAN_SIGNER_DELETE_ADMITTED", operation_id_sha256: input.transaction.operation_id_sha256, certificate_thumbprint: candidate.thumbprint, store: "LOCAL_MACHINE_MY", delete_private_key: true, trust_delete_count: 0, install_file_delete_count: 0, deletes_unrelated_state: false, secret_accessed: false, windows_security_opened: false });
}
