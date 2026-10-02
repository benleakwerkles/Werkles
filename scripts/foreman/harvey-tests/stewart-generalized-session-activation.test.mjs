import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  STEWART_GENERALIZED_SESSION_RELEASE,
  compileStewartGeneralizedSessionActivation,
  verifyStewartGeneralizedSessionRollback,
} from "../../../lib/harvey/stewart-generalized-session-activation.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (character) => character.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const packageBody = {
  schema: "pookakind.stewart-generalized-package-observation/v1",
  extension_bundle_sha256: h("a"),
  file_count: 9,
  launcher_sha256: h("b"),
  native_manifest_sha256: h("c"),
  resolver_sha256: h("d"),
  runtime_manifest_sha256: h("e"),
};
const packageObservation = { ...packageBody, package_sha256: digest(packageBody) };
const baseline = {
  schema: "pookakind.stewart-generalized-session-state/v1",
  chrome_profile_state: "NOT_CREATED",
  extension_id: null,
  extension_state: "ABSENT",
  extension_trust_state: "NOT_LOADED",
  native_manifest_sha256: packageObservation.native_manifest_sha256,
  observed_at: "2026-08-22T23:00:00.000Z",
  package_sha256: packageObservation.package_sha256,
  package_state: "STAGED_HASH_VERIFIED",
  registry_manifest_sha256: null,
  registry_state: "ABSENT",
  synthetic_proof_state: "NOT_RUN",
};
const intended = {
  schema: "pookakind.stewart-generalized-session-intent/v1",
  activation_mode: "ONE_SHOT_SESSION_ONLY",
  auto_start: false,
  background_service: false,
  extension_bundle_sha256: packageObservation.extension_bundle_sha256,
  extension_id: "dlkekkfjpgfghllndmdjffnfnpencdge",
  machine: "DOSS",
  max_operations: 1,
  native_manifest_sha256: packageObservation.native_manifest_sha256,
  package_sha256: packageObservation.package_sha256,
  persistent_chrome_profile: false,
  recurring_operation: false,
  registry_key: "HKCU/Software/Google/Chrome/NativeMessagingHosts/com.werkles.pookakind.stewart_generalized/(Default)",
  rollback_required: true,
};
const input = (patch = {}) => ({
  schema: "pookakind.stewart-generalized-session-activation-input/v1",
  source_release: STEWART_GENERALIZED_SESSION_RELEASE,
  package: packageObservation,
  current_state: baseline,
  intended_state: intended,
  requested_claim: "PREPARE_ONLY",
  ...patch,
});
test("pins every generalized package source and sanitized provider-selection receipt to current bytes", async () => {
  for (const artifact of [...STEWART_GENERALIZED_SESSION_RELEASE.source_files, ...STEWART_GENERALIZED_SESSION_RELEASE.sanitized_provider_receipts]) {
    const bytes = await readFile(artifact.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256, artifact.path);
  }
});

test("compiles one inactive session-only transaction with exact rollback and a sanitized first provider", () => {
  const transaction = compileStewartGeneralizedSessionActivation(input());
  assert.equal(transaction.state, "PREPARED_NOT_ACTIVATED");
  assert.equal(transaction.max_operations, 1);
  assert.equal(transaction.installs_anything, false);
  assert.equal(transaction.activates_anything, false);
  assert.equal(transaction.live_callable, false);
  assert.equal(transaction.recurring_operation_created, false);
  assert.deepEqual(transaction.ordered_steps.slice(-3), ["RESTORE_EXACT_REGISTRY_BASELINE", "REMOVE_EXACT_EPHEMERAL_PROFILE", "VERIFY_COMPLETE_ROLLBACK"]);
  assert.deepEqual(transaction.first_provider_transaction_after_activation, {
    provider: "Disney MyDisney",
    operation_kind: "EMAIL_OTP_SUBMIT",
    required_surface: "FRESH_PROVIDER_OWNED_SIX_FIELD_EMAIL_OTP",
    required_private_custody: "AUTHENTICATED_INBOX_OPAQUE_OTP_HANDLE",
    transaction_state: "SELECTED_NOT_STARTED",
    conversion_credit: false,
  });
  assert.equal(Object.isFrozen(transaction), true);
  assert.equal(Object.isFrozen(transaction.package), true);
});

test("fails closed on source, package, registry, extension, trust, and recurrence drift", () => {
  assert.throws(() => compileStewartGeneralizedSessionActivation(input({ source_release: { ...STEWART_GENERALIZED_SESSION_RELEASE, schema: "wrong" } })), /SOURCE_RELEASE_MISMATCH/);
  assert.throws(() => compileStewartGeneralizedSessionActivation(input({ package: { ...packageObservation, launcher_sha256: h("f") } })), /PACKAGE_DIGEST_MISMATCH/);
  for (const current_state of [
    { ...baseline, registry_state: "OTHER_PRESENT" },
    { ...baseline, extension_state: "OTHER_PRESENT" },
    { ...baseline, extension_trust_state: "UNPROVEN" },
  ]) assert.equal(compileStewartGeneralizedSessionActivation(input({ current_state })).state, "BLOCKED");
  assert.throws(() => compileStewartGeneralizedSessionActivation(input({ intended_state: { ...intended, recurring_operation: true } })), /INTENT_INVALID/);
  assert.throws(() => compileStewartGeneralizedSessionActivation(input({ intended_state: { ...intended, auto_start: true } })), /INTENT_INVALID/);
});

test("rejects live-callable claims and secret-shaped, smuggled, accessor, and symbol inputs", () => {
  assert.throws(() => compileStewartGeneralizedSessionActivation(input({ requested_claim: "LIVE_CALLABLE" })), /LIVE_CALLABLE_CLAIM_FORBIDDEN/);
  assert.throws(() => compileStewartGeneralizedSessionActivation({ ...input(), password: "not-a-real-secret" }), /PRIVATE_FIELD_FORBIDDEN/);
  assert.throws(() => compileStewartGeneralizedSessionActivation({ ...input(), note: "password=not-a-real-secret" }), /SECRET_SHAPED_DATA_FORBIDDEN/);
  const accessor = input(); Object.defineProperty(accessor, "schema", { enumerable: true, get: () => input().schema });
  assert.throws(() => compileStewartGeneralizedSessionActivation(accessor), /INPUT_NOT_PLAIN/);
  const symbol = input(); symbol[Symbol("smuggle")] = true;
  assert.throws(() => compileStewartGeneralizedSessionActivation(symbol), /INPUT_NOT_PLAIN/);
});

test("verifies complete rollback after one synthetic session and never calls it installed or live", () => {
  const transaction = compileStewartGeneralizedSessionActivation(input());
  const activationReceipt = {
    schema: "pookakind.stewart-generalized-session-activation-receipt/v1",
    extension_loaded: true,
    live_callable_claimed: false,
    operations_consumed: 1,
    package_sha256: packageObservation.package_sha256,
    provider_contacted: false,
    registry_written: true,
    rollback_attempted: true,
    secret_material_used: false,
    session_process_terminated: true,
    state: "SESSION_SYNTHETIC_PROOF_COMPLETE",
    synthetic_proof_passed: true,
    transaction_sha256: transaction.transaction_sha256,
  };
  const after = { ...baseline, observed_at: "2026-08-22T23:01:00.000Z", synthetic_proof_state: "PASSED" };
  const result = verifyStewartGeneralizedSessionRollback({ schema: "pookakind.stewart-generalized-session-rollback-input/v1", transaction, activation_receipt: activationReceipt, after_state: after });
  assert.equal(result.state, "ROLLBACK_VERIFIED");
  assert.equal(result.live_callable, false);
  assert.equal(result.installed, false);
  assert.equal(result.password_conversion_claimed, false);
});

test("rollback verifier rejects replay substitutions, live claims, secrets, and incomplete restoration", () => {
  const transaction = compileStewartGeneralizedSessionActivation(input());
  const receipt = {
    schema: "pookakind.stewart-generalized-session-activation-receipt/v1",
    extension_loaded: true, live_callable_claimed: false, operations_consumed: 1,
    package_sha256: packageObservation.package_sha256, provider_contacted: false,
    registry_written: true, rollback_attempted: true, secret_material_used: false,
    session_process_terminated: true, state: "SESSION_SYNTHETIC_PROOF_COMPLETE",
    synthetic_proof_passed: true, transaction_sha256: transaction.transaction_sha256,
  };
  const after = { ...baseline, observed_at: "2026-08-22T23:01:00.000Z", synthetic_proof_state: "PASSED" };
  const wrap = (activation_receipt = receipt, after_state = after) => ({ schema: "pookakind.stewart-generalized-session-rollback-input/v1", transaction, activation_receipt, after_state });
  assert.throws(() => verifyStewartGeneralizedSessionRollback(wrap({ ...receipt, live_callable_claimed: true })), /ACTIVATION_RECEIPT_INVALID/);
  assert.throws(() => verifyStewartGeneralizedSessionRollback(wrap({ ...receipt, transaction_sha256: h("f") })), /ACTIVATION_RECEIPT_INVALID/);
  assert.throws(() => verifyStewartGeneralizedSessionRollback(wrap(receipt, { ...after, registry_state: "EXACT_INTENDED", registry_manifest_sha256: packageObservation.native_manifest_sha256 })), /ROLLBACK_INCOMPLETE/);
  assert.throws(() => verifyStewartGeneralizedSessionRollback(wrap(receipt, { ...after, extension_state: "EXACT_SESSION_ACTIVE", extension_id: intended.extension_id, extension_trust_state: "FIXED_ID_UNPACKED_SESSION" })), /ROLLBACK_INCOMPLETE/);
});
