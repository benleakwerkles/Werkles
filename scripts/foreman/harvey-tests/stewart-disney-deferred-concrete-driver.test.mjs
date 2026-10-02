import assert from "node:assert/strict";
import test from "node:test";

import { createStewartDisneyConcreteDeferredDriver } from "../../../lib/harvey/stewart-disney-deferred-concrete-driver.mjs";
import { compileStewartDisneyLiveAdapterCapability, createStewartDisneyDeferredLiveStages, STEWART_DISNEY_LIVE_STAGE_NAMES } from "../../../lib/harvey/stewart-disney-deferred-live-adapter.mjs";
import { runPasswordProviderDeferredExecution } from "../../../lib/harvey/password-provider-deferred-execution.mjs";
import { compilePasswordProviderFlowPlan } from "../../../lib/harvey/password-provider-flow-plan.mjs";
import { createHash } from "node:crypto";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (character) => character.repeat(64);
const request = { operation_sha256: h("a"), binding_sha256: h("b"), plan_sha256: h("c") };
const providerReceipt = (state, resolve_calls = 1) => ({ schema: "pookakind.stewart-background-credential-receipt/v1", state, consume_calls: 1, resolve_calls, execution_calls: 1, provider_state_sha256: h("d"), fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
function actions(overrides = {}) {
  return {
    observeIdentityRoute: async () => ({ schema: "pookakind.stewart-disney-live-surface-probe/v1", provider_id: "DISNEY_MYDISNEY", classification: "IDENTITY_LOOKUP_READY", origin_sha256: h("1"), pathname_sha256: h("2"), route_epoch_sha256: h("3"), form_sha256: h("4"), identity_field_role_sha256: h("5"), continue_control_sha256: h("6"), identity_field_count: 1, password_field_count: 0, continue_control_count: 1, unexpected_field_count: 0, live_execution_ready: true, live_action_performed: false, secret_material_present: false }),
    bindOpaqueIdentity: async () => ({ handle: { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("7") }, receipt: { state: "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED", secret_material_output: false } }),
    submitRecoveryIdentity: async () => providerReceipt("FACTOR_EMAIL"),
    captureEmailChallenge: async () => ({ handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("8") }, receipt: { state: "CREATED", secret_material_returned: false } }),
    submitEmailChallenge: async () => providerReceipt("SUBMISSION_ACCEPTED"),
    submitPasswordChange: async () => providerReceipt("SUBMISSION_ACCEPTED"),
    clearOwnedSession: async () => ({ state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256: h("9"), provider_cookie_count: 0, provider_storage_count: 0, unrelated_state_touched: false }),
    submitFreshIdentity: async () => providerReceipt("FACTOR_PASSWORD"),
    submitFreshSignIn: async () => providerReceipt("SUBMISSION_ACCEPTED", 2),
    reconcileExactOneVault: async () => ({ state: "VERIFIED_CURRENT", exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", readback_sha256: h("e") }),
    ...overrides,
  };
}

test("concrete driver requires the real route, opaque custody, provider acceptance, clean sign-out and exact-one vault proof", async () => {
  const driver = createStewartDisneyConcreteDeferredDriver(actions());
  const results = [];
  for (const name of STEWART_DISNEY_LIVE_STAGE_NAMES) results.push(await driver[name](request));
  assert.deepEqual(results.map(({ stage }) => stage), STEWART_DISNEY_LIVE_STAGE_NAMES);
  assert.equal(results.reduce((sum, receipt) => sum + receipt.provider_action_count, 0), 6);
  assert.equal(results.every(({ foreground_changed, input_devices_touched, secret_material_output }) => !foreground_changed && !input_devices_touched && !secret_material_output), true);
});

test("wrong factor, reset, sign-in, residual session, duplicate vault and value-bearing identity fail closed", async () => {
  const cases = [
    ["requestRecovery", { submitRecoveryIdentity: async () => providerReceipt("SUBMISSION_ACCEPTED") }, /RECOVERY_RECEIPT/],
    ["submitChallenge", { submitEmailChallenge: async () => providerReceipt("SUBMISSION_REJECTED") }, /CHALLENGE_SUBMISSION/],
    ["executeChange", { submitPasswordChange: async () => providerReceipt("SUBMISSION_REJECTED") }, /PASSWORD_CHANGE_RECEIPT/],
    ["verifyFreshSignIn", { submitFreshSignIn: async () => providerReceipt("OUTCOME_UNKNOWN") }, /FRESH_SIGN_IN_RECEIPT/],
    ["clearSession", { clearOwnedSession: async () => ({ state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256: h("9"), provider_cookie_count: 1, provider_storage_count: 0, unrelated_state_touched: false }) }, /SESSION_CLEAR/],
    ["beginFreshSignIn", { submitFreshIdentity: async () => providerReceipt("SUBMISSION_ACCEPTED") }, /FRESH_IDENTITY_RECEIPT/],
    ["reconcileVault", { reconcileExactOneVault: async () => ({ state: "VERIFIED_CURRENT", exact_match_count: 2, duplicate_count: 1, credential_status: "VERIFIED_CURRENT", readback_sha256: h("e") }) }, /VAULT_RECEIPT/],
    ["bindIdentity", { bindOpaqueIdentity: async () => ({ handle: { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("7") }, receipt: { state: "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED", secret_material_output: true } }) }, /IDENTITY_BINDING/],
  ];
  for (const [method, patch, error] of cases) await assert.rejects(() => createStewartDisneyConcreteDeferredDriver(actions(patch))[method](request), error);
});

test("provider-neutral rehearsal traverses the concrete adapter and earns one exact conversion terminal", async () => {
  const driver = createStewartDisneyConcreteDeferredDriver(actions());
  const rehearsalBody = { schema: "pookakind.password-provider-deferred-terminal/v1", operation: h("1"), binding: h("2"), state: "VERIFIED_CONVERSION", counted: true, proofs: [h("3"), h("4"), h("5"), h("6"), h("7"), h("8"), h("9"), h("a")], failure: null, secret_material_output: false, automatic_retry: false };
  const rehearsal = { ...rehearsalBody, receipt_sha256: createHash("sha256").update(canonicalJson(rehearsalBody)).digest("hex") };
  const capability = compileStewartDisneyLiveAdapterCapability({ package_sha256: h("a"), source_release_sha256: h("b"), rehearsal_terminal: rehearsal, driver });
  const stages = createStewartDisneyDeferredLiveStages({ capability, package_sha256: h("a"), source_release_sha256: h("b"), driver });
  const plan = compilePasswordProviderFlowPlan({ schema: "pookakind.password-provider-flow-input/v1", provider_id: "DISNEY_MYDISNEY", target: { account: h("d"), adapter: h("9"), class: "WEB_EMAIL_RESET", provider: "Disney MyDisney", source: "https://login.disney.com/security" }, entry_mode: "IDENTITY_FIRST", recovery_mode: "RESET_EMAIL", challenges: ["EMAIL_OTP"] });
  let terminal = null;
  const result = await runPasswordProviderDeferredExecution({
    plan,
    operation_sha256: h("e"), binding_sha256: h("f"),
    dependencies: { ...stages, claimOperation: async () => ({ state: "CLAIMED" }), appendTerminal: async ({ terminal: value }) => { terminal = value; return { state: "APPENDED", receipt_sha256: value.receipt_sha256 }; } },
  });
  assert.equal(result.state, "VERIFIED_CONVERSION"); assert.equal(result.counted, true); assert.equal(result.proofs.length, 8); assert.deepEqual(result, terminal);
});
