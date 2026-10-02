import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";
import { compileStewartWindowsSecurityUiAccessSingleElevationInstall, deriveStewartWindowsSecurityUiAccessApprovalScope } from "../../../lib/harvey/stewart-windows-security-uiaccess-single-elevation-signing-install.mjs";
import { compileStewartWindowsSecurityRollbackEvidence } from "../../../lib/harvey/stewart-windows-security-uiaccess-rollback-evidence.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const identity = generateIdentity();
const approved = Date.parse("2026-08-24T12:00:00.000Z");
const payloadWithoutScope = { schema: "pookakind.stewart-windows-security-uiaccess-single-elevation-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: h("operation"), package_sha256: h("package"), activation_driver_sha256: h("driver"), production_executable_sha256: h("production"), certificate_profile: { subject: "CN=PookaKind Stewart Windows Security UIAccess Doss", key_algorithm: "RSA", key_length: 3072, hash_algorithm: "SHA256", eku_oid: "1.3.6.1.5.5.7.3.3", key_export_policy: "NON_EXPORTABLE", not_after_minutes: 60 }, install_root: "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess", approved_at: new Date(approved).toISOString(), expires_at: new Date(approved + 600_000).toISOString(), max_uses: 1, max_uac_prompts: 1, recurrence: false, complete_rollback_required: true };
const payload = { ...payloadWithoutScope, approval_scope_sha256: deriveStewartWindowsSecurityUiAccessApprovalScope(payloadWithoutScope) };
const record = signDurableRecord(identity.private_key_pem, payload, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-single-elevation:DOSS:${payload.operation_id_sha256}` });
const transaction = compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, activation_record: record, now: approved });
const scope = transaction.approval_scope_sha256;
const terminal = () => ({ schema: "pookakind.stewart-windows-security-uiaccess-elevated-lifecycle-terminal/v1", state: "FAILED_ROLLED_BACK", approval_scope_sha256: scope, operation_id_sha256: transaction.operation_id_sha256, package_sha256: transaction.package_sha256, activation_driver_sha256: transaction.activation_driver_sha256, synthetic_state: null, rollback_verified: true, installed: false, residual_owned_certificate_count: 0, residual_owned_process_count: 0, live_callable: false, windows_security_opened: false, secret_accessed: false, recurrence_created: false, failure: "STEWART_WINDOWS_SECURITY_INSTALL_ROOT_CONFLICT" });
const rollback = () => ({ schema: "pookakind.stewart-windows-security-uiaccess-rollback/v2", state: "CLEAN_ABSENT_VERIFIED", approval_scope_sha256: scope, operation_id_sha256: transaction.operation_id_sha256, package_sha256: transaction.package_sha256, activation_record_sha256: transaction.activation_record_sha256, session_nonce_sha256: h("nonce"), install_root_present: false, owned_certificate_count: 0, owned_process_count: 0, secret_accessed: false, windows_security_opened: false, recurrence_created: false });
const claim = (now) => ({ schema: "pookakind.stewart-windows-security-uiaccess-claim-observation/v1", approval_claim_present: true, approval_terminal_present: false, observed_at: new Date(now).toISOString() });

test("verifies exact cleanup evidence without manufacturing retry authority", () => {
  const now = approved + 700_000;
  const result = compileStewartWindowsSecurityRollbackEvidence({ transaction, lifecycle_terminal: terminal(), rollback_receipt: rollback(), claim_observation: claim(now), now });
  assert.equal(result.state, "RECOVERY_EVIDENCE_VERIFIED__RETRY_NOT_AUTHORIZED");
  assert.equal(result.cleanup_proved, true);
  assert.equal(result.retry_authorized, false);
  assert.equal(result.new_authority_required, true);
  assert.equal(result.mutation_performed, false);
  assert.equal(result.secret_accessed, false);
});

test("fails closed on binding, residue, claim, schema, and effect substitution", () => {
  const now = approved + 700_000;
  const cases = [
    { lifecycle_terminal: { ...terminal(), package_sha256: h("wrong") }, rollback_receipt: rollback(), claim_observation: claim(now) },
    { lifecycle_terminal: { ...terminal(), installed: true }, rollback_receipt: rollback(), claim_observation: claim(now) },
    { lifecycle_terminal: terminal(), rollback_receipt: { ...rollback(), owned_certificate_count: 1 }, claim_observation: claim(now) },
    { lifecycle_terminal: terminal(), rollback_receipt: { ...rollback(), retry_authorized: true }, claim_observation: claim(now) },
    { lifecycle_terminal: terminal(), rollback_receipt: rollback(), claim_observation: { ...claim(now), approval_terminal_present: true } },
    { lifecycle_terminal: terminal(), rollback_receipt: rollback(), claim_observation: { ...claim(now), observed_at: new Date(now - 31_000).toISOString() } },
  ];
  for (const value of cases) assert.throws(() => compileStewartWindowsSecurityRollbackEvidence({ transaction, ...value, now }));
});
