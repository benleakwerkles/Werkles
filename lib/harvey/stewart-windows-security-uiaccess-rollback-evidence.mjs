import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { verifyStewartWindowsSecurityUiAccessSingleElevationInstallTransaction } from "./stewart-windows-security-uiaccess-single-elevation-signing-install.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ROLLBACK_FIELDS = ["activation_record_sha256", "approval_scope_sha256", "install_root_present", "operation_id_sha256", "owned_certificate_count", "owned_process_count", "package_sha256", "recurrence_created", "schema", "secret_accessed", "session_nonce_sha256", "state", "windows_security_opened"];
const TERMINAL_FIELDS = ["activation_driver_sha256", "approval_scope_sha256", "failure", "installed", "live_callable", "operation_id_sha256", "package_sha256", "recurrence_created", "residual_owned_certificate_count", "residual_owned_process_count", "rollback_verified", "schema", "secret_accessed", "state", "synthetic_state", "windows_security_opened"];
const CLAIM_FIELDS = ["approval_claim_present", "approval_terminal_present", "observed_at", "schema"];

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
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function frozen(value) { return Object.freeze(value); }

export function compileStewartWindowsSecurityRollbackEvidence({ transaction, lifecycle_terminal, rollback_receipt, claim_observation, now = Date.now() }) {
  const approvedAt = Date.parse(transaction?.activation_record?.payload?.approved_at ?? "");
  if (!Number.isFinite(approvedAt)) fail("STEWART_WINDOWS_SECURITY_RECOVERY_TRANSACTION_INVALID");
  try { verifyStewartWindowsSecurityUiAccessSingleElevationInstallTransaction(transaction, approvedAt); } catch { fail("STEWART_WINDOWS_SECURITY_RECOVERY_TRANSACTION_INVALID"); }

  exact(lifecycle_terminal, TERMINAL_FIELDS, "STEWART_WINDOWS_SECURITY_RECOVERY_TERMINAL_INVALID");
  exact(rollback_receipt, ROLLBACK_FIELDS, "STEWART_WINDOWS_SECURITY_RECOVERY_ROLLBACK_INVALID");
  exact(claim_observation, CLAIM_FIELDS, "STEWART_WINDOWS_SECURITY_RECOVERY_CLAIM_INVALID");
  const observed = Date.parse(claim_observation.observed_at);
  if (claim_observation.schema !== "pookakind.stewart-windows-security-uiaccess-claim-observation/v1"
    || claim_observation.approval_claim_present !== true || claim_observation.approval_terminal_present !== false
    || !Number.isFinite(observed) || observed > now + 2_000 || now - observed > 30_000) fail("STEWART_WINDOWS_SECURITY_RECOVERY_CLAIM_INVALID");

  if (lifecycle_terminal.schema !== "pookakind.stewart-windows-security-uiaccess-elevated-lifecycle-terminal/v1"
    || lifecycle_terminal.state !== "FAILED_ROLLED_BACK" || lifecycle_terminal.rollback_verified !== true
    || lifecycle_terminal.installed !== false || lifecycle_terminal.live_callable !== false
    || lifecycle_terminal.residual_owned_certificate_count !== 0 || lifecycle_terminal.residual_owned_process_count !== 0
    || lifecycle_terminal.secret_accessed !== false || lifecycle_terminal.windows_security_opened !== false || lifecycle_terminal.recurrence_created !== false
    || typeof lifecycle_terminal.failure !== "string" || lifecycle_terminal.failure.length === 0 || lifecycle_terminal.failure.length > 160
    || lifecycle_terminal.synthetic_state !== null) fail("STEWART_WINDOWS_SECURITY_RECOVERY_TERMINAL_INVALID");

  if (rollback_receipt.schema !== "pookakind.stewart-windows-security-uiaccess-rollback/v2"
    || rollback_receipt.state !== "CLEAN_ABSENT_VERIFIED" || rollback_receipt.install_root_present !== false
    || rollback_receipt.owned_certificate_count !== 0 || rollback_receipt.owned_process_count !== 0
    || rollback_receipt.secret_accessed !== false || rollback_receipt.windows_security_opened !== false || rollback_receipt.recurrence_created !== false
    || !HASH.test(rollback_receipt.session_nonce_sha256 ?? "")) fail("STEWART_WINDOWS_SECURITY_RECOVERY_ROLLBACK_INVALID");

  for (const field of ["approval_scope_sha256", "operation_id_sha256", "package_sha256"]) {
    if (lifecycle_terminal[field] !== transaction[field] || rollback_receipt[field] !== transaction[field]) fail("STEWART_WINDOWS_SECURITY_RECOVERY_BINDING_CONFLICT");
  }
  if (lifecycle_terminal.activation_driver_sha256 !== transaction.activation_driver_sha256
    || rollback_receipt.activation_record_sha256 !== transaction.activation_record_sha256) fail("STEWART_WINDOWS_SECURITY_RECOVERY_BINDING_CONFLICT");

  return frozen({
    schema: "pookakind.stewart-windows-security-uiaccess-recovery-evidence/v1",
    state: "RECOVERY_EVIDENCE_VERIFIED__RETRY_NOT_AUTHORIZED",
    approval_scope_sha256: transaction.approval_scope_sha256,
    operation_id_sha256: transaction.operation_id_sha256,
    package_sha256: transaction.package_sha256,
    lifecycle_terminal_sha256: digest(lifecycle_terminal),
    rollback_receipt_sha256: digest(rollback_receipt),
    cleanup_proved: true,
    retry_authorized: false,
    new_authority_required: true,
    mutation_performed: false,
    secret_accessed: false,
  });
}
