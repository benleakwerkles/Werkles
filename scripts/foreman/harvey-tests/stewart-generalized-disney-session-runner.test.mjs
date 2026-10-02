import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  STEWART_GENERALIZED_DISNEY_SESSION_PINS,
  compileStewartGeneralizedDisneySession,
  createStewartGeneralizedDisneySessionDurableStore,
  runStewartGeneralizedDisneySession,
  verifyStewartGeneralizedDisneySessionActivation,
} from "../../../lib/harvey/stewart-generalized-disney-session-runner.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const h = (character) => character.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const operator = generateIdentity();
const attacker = generateIdentity();
const operatorAuthority = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const now = Date.parse("2026-08-23T01:01:00.000Z");
const packageObservation = {
  schema: "pookakind.stewart-generalized-installable-package-observation/v1",
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  file_count: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.length,
  files: structuredClone(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files),
  extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
  native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
  launcher_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[5].sha256,
  resolver_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[7].sha256,
  runtime_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[8].sha256,
  native_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[0].sha256,
  extension_bundle_sha256: "cc78466b24c3edfbddb8c472c19a7d0b374b85dc71a4fa645ef7269cd78feecb",
};
const activationPayload = {
  schema: "pookakind.stewart-generalized-disney-session-activation-authority/v1",
  decision: "APPROVED",
  approved_at: "2026-08-23T01:00:00.000Z",
  issued_at: "2026-08-23T01:00:00.000Z",
  expires_at: "2026-08-23T01:05:00.000Z",
  machine: "DOSS",
  operation_id_sha256: h("9"),
  account_ref_sha256: h("8"),
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  source_release_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.source_release_sha256,
  gate_artifact_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256,
  approval_phrase_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.approval_phrase_sha256,
  approval_log_entry_sha256: h("a"),
  extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
  native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
  registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key,
  activation_mode: "ONE_SHOT_SESSION_ONLY",
  synthetic_required: true,
  allowed_provider: "Disney MyDisney",
  provider_id: "DISNEY_MYDISNEY",
  allowed_operation: "FULL_PASSWORD_CONVERSION",
  action: "SYNTHETIC_THEN_ONE_DISNEY_FULL_PASSWORD_CONVERSION",
  recurrence: false,
  max_provider_transactions: 1,
  complete_rollback_required: true,
  exclusions_sha256: digest(STEWART_GENERALIZED_DISNEY_SESSION_PINS.exclusions),
};
const signActivation = (identity = operator, patch = {}) => signDurableRecord(identity.private_key_pem, { ...activationPayload, ...patch }, {
  issuer: STEWART_GENERALIZED_DISNEY_SESSION_PINS.activation_issuer,
  audience: STEWART_GENERALIZED_DISNEY_SESSION_PINS.activation_audience,
});
const input = (patch = {}) => ({
  schema: "pookakind.stewart-generalized-disney-session-input/v1",
  package: packageObservation,
  operator_authority: operatorAuthority,
  activation_record: signActivation(),
  requested_mode: "SYNTHETIC_ONLY",
  disney_transaction_sha256: null,
  recovery_record: null,
  ...patch,
});
const preflight = {
  schema: "pookakind.stewart-generalized-session-preflight/v1",
  observed_at: "2026-08-23T01:01:00.000Z",
  package_state: "EXACT_HASH_VERIFIED",
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  native_manifest_sha256: packageObservation.native_manifest_sha256,
  gate_artifact_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256,
  approval_log_entry_sha256: activationPayload.approval_log_entry_sha256,
  registry_state: "ABSENT",
  policy_state: "ABSENT",
  service_state: "ABSENT",
  scheduler_state: "ABSENT",
  startup_state: "ABSENT",
  watcher_state: "ABSENT",
  extension_state: "ABSENT",
  extension_trust_state: "NOT_LOADED",
  profile_state: "NOT_CREATED",
  profile_owner_process_count: 0,
  imported_disney_session_state: "ABSENT",
  imported_cookie_count: 0,
  imported_storage_state: "ABSENT",
};
const synthetic = {
  schema: "pookakind.stewart-generalized-session-synthetic-receipt/v1",
  state: "PASS",
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
  native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
  provider_contacted: false,
  secret_material_used: false,
  input_devices_touched: false,
  foreground_changed: false,
};
const residual = {
  schema: "pookakind.stewart-generalized-session-residual-state/v1",
  registry_state: "ABSENT", policy_state: "ABSENT", service_state: "ABSENT", scheduler_state: "ABSENT",
  startup_state: "ABSENT", watcher_state: "ABSENT", extension_state: "ABSENT", profile_state: "NOT_CREATED",
  profile_owner_process_count: 0, generalized_process_count: 0, imported_disney_session_state: "ABSENT",
  imported_cookie_count: 0, imported_storage_state: "ABSENT", unrelated_state_touched: false,
};
const conversionReceipt = (transactionSha256) => ({
  schema: "pookakind.disney-mydisney-password-conversion/v1",
  state: "CONVERSION_VERIFIED",
  provider: "Disney MyDisney",
  transaction_sha256: transactionSha256,
  provider_accepted: true,
  fresh_independent_sign_in: true,
  exact_nonduplicate_vault_reconciliation: true,
  fixed: true,
  password_conversion: true,
  secret_material_returned: false,
});

function dependencies(events, patch = {}) {
  return {
    now: () => now,
    inspectPreflight: async () => { events.push("preflight"); return preflight; },
    claimSession: async ({ claim_sha256 }) => { events.push("claim"); return { state: "CLAIMED", claim_sha256 }; },
    appendTerminalReceipt: async ({ receipt }) => { events.push("append"); return { state: "APPENDED", receipt_sha256: receipt.receipt_sha256 }; },
    registerNativeHost: async () => { events.push("register"); return { state: "EXACT_HKCU_HOST_REGISTERED", registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key, native_manifest_sha256: packageObservation.native_manifest_sha256, immediate_readback_state: "EXACT_MATCH", unrelated_state_touched: false }; },
    launchEphemeralChrome: async () => { events.push("launch"); return { state: "EXACT_EPHEMERAL_SESSION_ACTIVE", session_ref_sha256: h("b"), extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, persistent_profile: false, imported_cookie_count: 0, imported_storage_state: "ABSENT", imported_disney_session_state: "ABSENT", foreground_changed: false, input_devices_touched: false }; },
    runSyntheticProof: async () => { events.push("synthetic"); return synthetic; },
    runDisneyTransaction: async ({ transaction_sha256 }) => { events.push("disney"); return conversionReceipt(transaction_sha256); },
    terminateSession: async () => { events.push("terminate"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    removeRegistry: async () => { events.push("unregister"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    removeEphemeralProfile: async () => { events.push("remove-profile"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    inspectResidualState: async () => { events.push("residual"); return residual; },
    ...patch,
  };
}

test("compiles only the exact pinned package with separately signed activation authority", () => {
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  assert.equal(transaction.state, "PREPARED_NOT_ACTIVATED");
  assert.equal(transaction.max_provider_transactions, 0);
  assert.equal(transaction.password_conversion_claimed, false);
  assert.equal(transaction.activation.approval_log_entry_sha256, h("a"));
  assert.equal(Object.isFrozen(transaction), true);
});

test("preflights exact activation authority before any private dependency may be touched", () => {
  const verified = verifyStewartGeneralizedDisneySessionActivation({
    schema: "pookakind.stewart-generalized-disney-session-activation-preflight-input/v1",
    package: packageObservation,
    operator_authority: operatorAuthority,
    activation_record: signActivation(),
  }, now);
  assert.equal(verified.state, "ACTIVATION_AUTHORITY_VERIFIED_NOT_EXECUTED");
  assert.equal(verified.provider_contacted, false);
  assert.equal(verified.secret_material_used, false);
  assert.equal(verified.claim_sha256, compileStewartGeneralizedDisneySession(input(), now).claim_sha256);
  assert.throws(() => verifyStewartGeneralizedDisneySessionActivation({
    schema: "pookakind.stewart-generalized-disney-session-activation-preflight-input/v1",
    package: packageObservation,
    operator_authority: operatorAuthority,
    activation_record: signActivation(attacker),
  }, now), /ACTIVATION_AUTHORITY_INVALID/);
});

test("refuses missing, attacker-signed, tampered, and scope-substituted activation records", () => {
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: null }), now), /ACTIVATION_AUTHORITY_INVALID/);
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: signActivation(attacker) }), now), /ACTIVATION_AUTHORITY_INVALID/);
  const tampered = signActivation(); tampered.payload.machine = "OTHER";
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: tampered }), now), /ACTIVATION_AUTHORITY_INVALID/);
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: signActivation(operator, { allowed_provider: "OTHER" }) }), now), /ACTIVATION_SCOPE_INVALID/);
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: signActivation(operator, { source_release_sha256: h("f") }) }), now), /ACTIVATION_SCOPE_INVALID/);
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ activation_record: signActivation(operator, { approval_log_entry_sha256: "bad" }) }), now), /ACTIVATION_SCOPE_INVALID/);
});

test("refuses package file, tree, extension, and native-host drift", () => {
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ package: { ...packageObservation, package_sha256: h("f") } }), now), /PACKAGE_MISMATCH/);
  const files = structuredClone(packageObservation.files); files[0].sha256 = h("f");
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ package: { ...packageObservation, files } }), now), /PACKAGE_FILE_DRIFT/);
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ package: { ...packageObservation, extension_id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" } }), now), /PACKAGE_MISMATCH/);
});

test("dry-run performs exact preflight and no claim, registration, Chrome launch, or rollback", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input({ requested_mode: "DRY_RUN" }), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events) });
  assert.equal(receipt.state, "DRY_RUN_READY");
  assert.deepEqual(events, ["preflight"]);
});

test("synthetic session runs once in order and always completes exact rollback", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events) });
  assert.equal(receipt.state, "SESSION_COMPLETE_ROLLED_BACK");
  assert.equal(receipt.synthetic_state, "PASS");
  assert.equal(receipt.password_conversion, false);
  assert.deepEqual(events, ["preflight", "claim", "register", "launch", "synthetic", "terminate", "unregister", "remove-profile", "residual", "append"]);
});

test("synthetic failure blocks Disney and still rolls back every exact target", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input({ requested_mode: "LIVE_ONE_DISNEY", disney_transaction_sha256: h("d") }), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, { runSyntheticProof: async () => { events.push("synthetic"); throw new Error("SYNTHETIC_FAILURE"); } }) });
  assert.equal(receipt.state, "FAILED_ROLLED_BACK");
  assert.equal(receipt.failure, "SYNTHETIC_FAILURE");
  assert.equal(events.includes("disney"), false);
  assert.deepEqual(events.slice(-5), ["terminate", "unregister", "remove-profile", "residual", "append"]);
});

test("live Disney credits conversion only after the full provider, fresh sign-in, and exact-one vault receipt", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input({ requested_mode: "LIVE_ONE_DISNEY", disney_transaction_sha256: h("d") }), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events) });
  assert.equal(receipt.state, "SESSION_COMPLETE_ROLLED_BACK");
  assert.equal(receipt.disney_state, "CONVERSION_VERIFIED");
  assert.equal(receipt.password_conversion, true);
  assert.equal(events.indexOf("synthetic") < events.indexOf("disney"), true);
  assert.equal(events.filter((event) => event === "disney").length, 1);
});

test("rejects OTP-only acceptance and incomplete conversion receipts", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input({ requested_mode: "LIVE_ONE_DISNEY", disney_transaction_sha256: h("d") }), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, { runDisneyTransaction: async ({ transaction_sha256 }) => ({ schema: "pookakind.disney-mydisney-email-otp-receipt/v1", provider: "Disney MyDisney", transaction_sha256, state: "SUBMISSION_ACCEPTED", password_conversion: false, secret_material_returned: false }) }) });
  assert.equal(receipt.state, "FAILED_ROLLED_BACK");
  assert.equal(receipt.failure, "STEWART_DISNEY_SESSION_PROVIDER_RECEIPT_INVALID");
});

test("stranded claim blocks all machine and provider controls pending explicit recovery evidence", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, { claimSession: async ({ claim_sha256 }) => { events.push("claim"); return { state: "STRANDED", claim_sha256 }; } }) });
  assert.equal(receipt.state, "CRASH_STRANDED_CLAIM");
  assert.equal(receipt.recovery_evidence_required, true);
  assert.deepEqual(events, ["preflight", "claim"]);
});

test("explicit signed clean-absent recovery evidence permits exactly one stranded-claim recovery", async () => {
  const first = compileStewartGeneralizedDisneySession(input(), now);
  const recoveryPayload = {
    schema: "pookakind.stewart-generalized-disney-session-recovery-evidence/v1",
    decision: "RECOVER_STRANDED_CLAIM",
    operation_id_sha256: activationPayload.operation_id_sha256,
    claim_sha256: first.claim_sha256,
    package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
    machine: "DOSS",
    provider_id: "DISNEY_MYDISNEY",
    account_ref_sha256: activationPayload.account_ref_sha256,
    reason: "PROVED_NO_LIVE_SESSION_AND_CLEAN_ABSENT",
    observed_at: "2026-08-23T01:00:30.000Z",
    registry_state: "ABSENT",
    extension_state: "ABSENT",
    profile_state: "NOT_CREATED",
    session_process_count: 0,
    unrelated_state_touched: false,
  };
  const recoveryRecord = signDurableRecord(operator.private_key_pem, recoveryPayload, {
    issuer: STEWART_GENERALIZED_DISNEY_SESSION_PINS.activation_issuer,
    audience: `stewart-generalized-disney-session-recovery/v1:${activationPayload.operation_id_sha256}:${first.claim_sha256}`,
  });
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input({ recovery_record: recoveryRecord }), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, {
    claimSession: async ({ claim_sha256, recovery_evidence }) => {
      events.push("claim"); assert.equal(recovery_evidence.decision, "RECOVER_STRANDED_CLAIM");
      return { state: "CLAIMED_WITH_RECOVERY", claim_sha256 };
    },
  }) });
  assert.equal(receipt.state, "SESSION_COMPLETE_ROLLED_BACK");
  const wrongRecovery = structuredClone(recoveryRecord); wrongRecovery.payload.session_process_count = 1;
  assert.throws(() => compileStewartGeneralizedDisneySession(input({ recovery_record: wrongRecovery }), now), /RECOVERY_EVIDENCE_INVALID/);
});

test("claim atomically binds operation, package, Doss, extension, host, Disney, opaque account, action, expiry, and recurrence false", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, {
    claimSession: async (claim) => {
      events.push("claim");
      assert.deepEqual(claim, {
        claim_sha256: transaction.claim_sha256,
        transaction_sha256: transaction.transaction_sha256,
        operation_id_sha256: activationPayload.operation_id_sha256,
        package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
        machine: "DOSS",
        extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
        native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
        provider_id: "DISNEY_MYDISNEY",
        account_ref_sha256: activationPayload.account_ref_sha256,
        action: activationPayload.action,
        expires_at: activationPayload.expires_at,
        recurrence: false,
        recovery_evidence: null,
      });
      return { state: "CLAIMED", claim_sha256: claim.claim_sha256 };
    },
  }) });
});

test("exact replay returns the byte-identical append-once terminal receipt and invokes no controls", async () => {
  const firstEvents = []; let terminal;
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const first = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(firstEvents, {
    appendTerminalReceipt: async ({ receipt }) => { firstEvents.push("append"); terminal = structuredClone(receipt); return { state: "APPENDED", receipt_sha256: receipt.receipt_sha256 }; },
  }) });
  const replayEvents = [];
  const replay = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(replayEvents, {
    claimSession: async ({ claim_sha256 }) => { replayEvents.push("claim"); return { state: "TERMINAL_REPLAY", claim_sha256, terminal_receipt: terminal }; },
  }) });
  assert.equal(canonicalJson(replay), canonicalJson(first));
  assert.deepEqual(replayEvents, ["preflight", "claim"]);
});

test("activation expiry and inherited Disney cookies, storage, session, policy, and process ownership fail closed", async () => {
  assert.throws(() => compileStewartGeneralizedDisneySession(input(), Date.parse("2026-08-23T01:05:00.001Z")), /ACTIVATION_SCOPE_INVALID/);
  for (const drift of [
    { imported_cookie_count: 1 }, { imported_storage_state: "PRESENT" }, { imported_disney_session_state: "PRESENT" },
    { policy_state: "PRESENT" }, { service_state: "PRESENT" }, { scheduler_state: "PRESENT" },
    { startup_state: "PRESENT" }, { watcher_state: "PRESENT" }, { profile_owner_process_count: 1 },
  ]) {
    const transaction = compileStewartGeneralizedDisneySession(input(), now);
    await assert.rejects(runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies([], { inspectPreflight: async () => ({ ...preflight, ...drift }) }) }), /PREFLIGHT_NOT_CLEAN/);
  }
});

test("registry write without exact immediate readback rolls back before Chrome or Disney", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, {
    registerNativeHost: async () => { events.push("register"); return { state: "EXACT_HKCU_HOST_REGISTERED", registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key, native_manifest_sha256: packageObservation.native_manifest_sha256, immediate_readback_state: "MISMATCH", unrelated_state_touched: false }; },
  }) });
  assert.equal(receipt.state, "FAILED_ROLLED_BACK");
  assert.equal(events.includes("launch"), false);
  assert.equal(events.includes("disney"), false);
  assert.deepEqual(events.slice(-5), ["terminate", "unregister", "remove-profile", "residual", "append"]);
});

test("terminal receipt must append exactly once after complete rollback", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  await assert.rejects(runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, {
    appendTerminalReceipt: async () => { events.push("append"); return { state: "CONFLICT", receipt_sha256: h("f") }; },
  }) }), /TERMINAL_APPEND_FAILED/);
  assert.deepEqual(events.slice(-5), ["terminate", "unregister", "remove-profile", "residual", "append"]);
});

test("durable store strands crashes, permits one explicit recovery, appends once, and replays exact terminal bytes", async () => {
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const root = mkdtempSync(join(tmpdir(), "stewart-disney-session-store-"));
  const store = createStewartGeneralizedDisneySessionDurableStore({ root });
  const claim = {
    claim_sha256: transaction.claim_sha256,
    transaction_sha256: transaction.transaction_sha256,
    operation_id_sha256: transaction.activation.operation_id_sha256,
    package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
    machine: "DOSS",
    extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
    native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
    provider_id: "DISNEY_MYDISNEY",
    account_ref_sha256: transaction.activation.account_ref_sha256,
    action: transaction.activation.action,
    expires_at: transaction.activation.expires_at,
    recurrence: false,
    recovery_evidence: null,
  };
  assert.equal((await store.claimSession(claim)).state, "CLAIMED");
  assert.equal((await store.claimSession(claim)).state, "STRANDED");
  const recovery = { decision: "RECOVER_STRANDED_CLAIM", claim_sha256: transaction.claim_sha256 };
  assert.equal((await store.claimSession({ ...claim, recovery_evidence: recovery })).state, "CLAIMED_WITH_RECOVERY");
  assert.equal((await store.claimSession({ ...claim, recovery_evidence: recovery })).state, "STRANDED");

  const completedRoot = mkdtempSync(join(tmpdir(), "stewart-disney-session-complete-"));
  const completedStore = createStewartGeneralizedDisneySessionDurableStore({ root: completedRoot });
  const events = [];
  const deps = dependencies(events, { claimSession: completedStore.claimSession, appendTerminalReceipt: completedStore.appendTerminalReceipt });
  const first = await runStewartGeneralizedDisneySession({ transaction, dependencies: deps });
  const replay = await runStewartGeneralizedDisneySession({ transaction, dependencies: deps });
  assert.equal(canonicalJson(replay), canonicalJson(first));
  assert.equal(first.receipt_sha256, replay.receipt_sha256);
});

test("preflight authority-log mismatch stops before claim or mutation", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  await assert.rejects(runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, { inspectPreflight: async () => ({ ...preflight, approval_log_entry_sha256: h("f") }) }) }), /PREFLIGHT_NOT_CLEAN/);
  assert.deepEqual(events, []);
});

test("residual drift is terminal even after every rollback action reports success", async () => {
  const events = [];
  const transaction = compileStewartGeneralizedDisneySession(input(), now);
  const receipt = await runStewartGeneralizedDisneySession({ transaction, dependencies: dependencies(events, { inspectResidualState: async () => ({ ...residual, registry_state: "PRESENT" }) }) });
  assert.equal(receipt.state, "FAILED_RESIDUAL_STATE");
  assert.equal(receipt.residual_state, "NOT_CLEAN");
});

test("malformed, accessor, symbol, and secret-shaped inputs fail closed", () => {
  assert.throws(() => compileStewartGeneralizedDisneySession({ ...input(), password: "not-a-real-secret" }, now), /PRIVATE_FIELD_FORBIDDEN/);
  assert.throws(() => compileStewartGeneralizedDisneySession({ ...input(), note: "password=not-a-real-secret" }, now), /SECRET_SHAPED_DATA_FORBIDDEN/);
  const accessor = input(); Object.defineProperty(accessor, "schema", { enumerable: true, get: () => input().schema });
  assert.throws(() => compileStewartGeneralizedDisneySession(accessor, now), /INPUT_NOT_PLAIN/);
  const symbol = input(); symbol[Symbol("smuggle")] = true;
  assert.throws(() => compileStewartGeneralizedDisneySession(symbol, now), /INPUT_NOT_PLAIN/);
});
