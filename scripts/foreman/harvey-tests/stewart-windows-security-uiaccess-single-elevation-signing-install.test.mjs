import assert from "node:assert/strict";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessSingleElevationInstall, deriveStewartWindowsSecurityUiAccessApprovalScope, verifyStewartWindowsSecurityUiAccessSingleElevationInstallTransaction } from "../../../lib/harvey/stewart-windows-security-uiaccess-single-elevation-signing-install.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (character) => character.repeat(64);
const identity = generateIdentity();
const attacker = generateIdentity();
const pin = { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 };
const now = Date.parse("2026-08-24T12:00:10Z");
const certificate = { subject: "CN=PookaKind Stewart Windows Security UIAccess Doss", key_algorithm: "RSA", key_length: 3072, hash_algorithm: "SHA256", eku_oid: "1.3.6.1.5.5.7.3.3", key_export_policy: "NON_EXPORTABLE", not_after_minutes: 60 };
const payload = (overrides = {}) => { const body = { schema: "pookakind.stewart-windows-security-uiaccess-single-elevation-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: hash("a"), package_sha256: hash("b"), activation_driver_sha256: hash("c"), production_executable_sha256: hash("d"), certificate_profile: structuredClone(certificate), install_root: "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess", approved_at: "2026-08-24T12:00:00Z", expires_at: "2026-08-24T12:10:00Z", max_uses: 1, max_uac_prompts: 1, recurrence: false, complete_rollback_required: true, ...overrides }; return { ...body, approval_scope_sha256: overrides.approval_scope_sha256 ?? deriveStewartWindowsSecurityUiAccessApprovalScope(body) }; };
const signed = (body = payload(), signer = identity) => signDurableRecord(signer.private_key_pem, body, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-single-elevation:DOSS:${body.operation_id_sha256}` });

test("V3 transaction preserves exact package, driver, one-UAC, expiry, rollback, and no-secret boundaries", () => {
  const transaction = compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: pin, activation_record: signed(), now });
  assert.equal(transaction.package_sha256, hash("b"));
  assert.equal(transaction.approval_scope_sha256, deriveStewartWindowsSecurityUiAccessApprovalScope(payload()));
  assert.equal(transaction.activation_driver_sha256, hash("c"));
  assert.equal(transaction.max_uses, 1);
  assert.equal(transaction.max_uac_prompts, 1);
  assert.equal(transaction.recurrence, false);
  assert.equal(transaction.secret_access_allowed, false);
  assert.equal(transaction.windows_security_allowed, false);
  assert.equal(transaction.provider_action_allowed, false);
  assert.match(transaction.ordered_steps.join("|"), /ONE_UAC_ELEVATED_LIFECYCLE/);
  assert.match(transaction.ordered_steps.join("|"), /ROLLBACK_EXACT_OWNED_STATE_IN_FINALLY/);
  assert.equal(verifyStewartWindowsSecurityUiAccessSingleElevationInstallTransaction(transaction, now), true);
});

test("each signed operation receives a distinct internally derived one-shot claim scope", () => {
  const first = payload();
  const second = payload({ operation_id_sha256: hash("e") });
  assert.notEqual(first.approval_scope_sha256, second.approval_scope_sha256);
  assert.equal(first.approval_scope_sha256, deriveStewartWindowsSecurityUiAccessApprovalScope(first));
  assert.equal(second.approval_scope_sha256, deriveStewartWindowsSecurityUiAccessApprovalScope(second));
});

test("V3 verifier rejects unsigned, attacker, tamper, second UAC, recurrence, stale, and scope drift", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: pin, activation_record: { payload: payload() }, now }), /ACTIVATION_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: pin, activation_record: signed(payload(), attacker), now }), /ACTIVATION_INVALID/);
  const record = signed();
  assert.throws(() => compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: pin, activation_record: { ...record, payload: { ...record.payload, package_sha256: hash("f") } }, now }), /ACTIVATION_INVALID/);
  for (const change of [{ approval_scope_sha256: hash("f") }, { max_uac_prompts: 2 }, { max_uses: 2 }, { recurrence: true }, { install_root: "C:\\Temp" }, { certificate_profile: { ...certificate, key_export_policy: "EXPORTABLE" } }, { expires_at: "2026-08-24T12:20:00Z" }]) {
    assert.throws(() => compileStewartWindowsSecurityUiAccessSingleElevationInstall({ operator_authority: pin, activation_record: signed(payload(change)), now }), /SCOPE_INVALID|AUTHORITY_STALE/);
  }
});
