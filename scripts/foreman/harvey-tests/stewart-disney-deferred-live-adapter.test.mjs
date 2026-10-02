import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartDisneyLiveAdapterCapability, compileStewartDisneyLiveStageResult, createStewartDisneyDeferredLiveStages, STEWART_DISNEY_LIVE_STAGE_NAMES } from "../../../lib/harvey/stewart-disney-deferred-live-adapter.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (character) => character.repeat(64);
const states = {
  observeRoute: ["ROUTE_BOUND", 0, "READ_ONLY_ROUTE_OBSERVATION"], bindIdentity: ["IDENTITY_BOUND", 0, "OPAQUE_IDENTITY_HANDLE_BOUND"],
  requestRecovery: ["RECOVERY_REQUEST_ACCEPTED", 1, "PROVIDER_RECOVERY_REQUEST_ACCEPTED"], captureChallenge: ["CHALLENGE_CAPTURED_OPAQUE", 0, "OPAQUE_EMAIL_CHALLENGE_CAPTURED"],
  submitChallenge: ["CHALLENGE_ACCEPTED", 1, "PROVIDER_EMAIL_CHALLENGE_ACCEPTED"],
  executeChange: ["PASSWORD_CHANGE_ACCEPTED", 1, "PROVIDER_PASSWORD_CHANGE_ACCEPTED"], clearSession: ["SIGNED_OUT_STATE_CLEARED", 0, "OWNED_PROVIDER_SESSION_CLEARED"],
  beginFreshSignIn: ["FRESH_SIGN_IN_IDENTITY_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_IDENTITY_ACCEPTED"],
  verifyFreshSignIn: ["FRESH_SIGNED_OUT_SIGN_IN_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_ACCEPTED"], reconcileVault: ["EXACT_ONE_VAULT_VERIFIED_CURRENT", 1, "ONEPASSWORD_EXACT_ONE_VERIFIED_CURRENT"],
};
const request = { schema: "pookakind.password-provider-stage-request/v1", operation_sha256: h("a"), binding_sha256: h("b"), plan_sha256: h("c"), prior_receipt_sha256: {} };
const rehearsalBody = { schema: "pookakind.password-provider-deferred-terminal/v1", operation: h("1"), binding: h("2"), state: "VERIFIED_CONVERSION", counted: true, proofs: [h("3"), h("4"), h("5"), h("6"), h("7"), h("8"), h("9"), h("a")], failure: null, secret_material_output: false, automatic_retry: false };
const rehearsal = { ...rehearsalBody, receipt_sha256: createHash("sha256").update(canonicalJson(rehearsalBody)).digest("hex") };
function driver(events = []) {
  const output = {};
  for (const [index, name] of STEWART_DISNEY_LIVE_STAGE_NAMES.entries()) {
    const [state, count, effect] = states[name];
    output[name] = ({ operation_sha256, binding_sha256, plan_sha256, ...rest }) => {
      events.push([name, Object.keys(rest.prior_receipt_sha256).length]);
      return compileStewartDisneyLiveStageResult({ stage: name, request: { operation_sha256, binding_sha256, plan_sha256 }, state, provider_action_count: count, effect_type: effect, effect_sha256: createHash("sha256").update(`${index}:${name}`).digest("hex") });
    };
  }
  return output;
}

test("pins ten distinct live implementations and converts their exact effects into deferred receipts", async () => {
  const events = []; const implementation = driver(events);
  const capability = compileStewartDisneyLiveAdapterCapability({ package_sha256: h("e"), source_release_sha256: h("f"), rehearsal_terminal: rehearsal, driver: implementation });
  assert.equal(capability.stage_count, 10); assert.equal(capability.provider_actions_per_conversion, 6);
  const stages = createStewartDisneyDeferredLiveStages({ capability, package_sha256: h("e"), source_release_sha256: h("f"), driver: implementation });
  for (let index = 0; index < STEWART_DISNEY_LIVE_STAGE_NAMES.length; index++) {
    const name = STEWART_DISNEY_LIVE_STAGE_NAMES[index];
    const receipt = await stages[name]({ ...request, prior_receipt_sha256: Object.fromEntries(STEWART_DISNEY_LIVE_STAGE_NAMES.slice(0, index).map((prior) => [prior, h("1")])) });
    assert.equal(receipt.state, states[name][0]);
  }
  assert.deepEqual(events.map(([name]) => name), STEWART_DISNEY_LIVE_STAGE_NAMES);
});

test("rejects implementation reuse, code drift, package drift, synthetic effects, secret output, and desktop input", async () => {
  const reused = driver(); reused.bindIdentity = reused.observeRoute;
  assert.throws(() => compileStewartDisneyLiveAdapterCapability({ package_sha256: h("e"), source_release_sha256: h("f"), rehearsal_terminal: rehearsal, driver: reused }), /REUSE_FORBIDDEN/);
  const original = driver(); const capability = compileStewartDisneyLiveAdapterCapability({ package_sha256: h("e"), source_release_sha256: h("f"), rehearsal_terminal: rehearsal, driver: original });
  const drift = { ...original, executeChange: async () => ({}) };
  assert.throws(() => createStewartDisneyDeferredLiveStages({ capability, package_sha256: h("e"), source_release_sha256: h("f"), driver: drift }), /IMPLEMENTATION_DRIFT/);
  assert.throws(() => createStewartDisneyDeferredLiveStages({ capability, package_sha256: h("1"), source_release_sha256: h("f"), driver: original }), /CAPABILITY_INVALID/);
  for (const patch of [{ secret_material_output: true }, { foreground_changed: true }, { input_devices_touched: true }, { provider_action_count: 0 }]) {
    const hostile = driver();
    hostile.executeChange = function executeChange(req) { return { ...compileStewartDisneyLiveStageResult({ stage: "executeChange", request: req, state: "PASSWORD_CHANGE_ACCEPTED", provider_action_count: 1, effect_type: "PROVIDER_PASSWORD_CHANGE_ACCEPTED", effect_sha256: h("9") }), ...patch }; };
    const hostileCapability = compileStewartDisneyLiveAdapterCapability({ package_sha256: h("e"), source_release_sha256: h("f"), rehearsal_terminal: rehearsal, driver: hostile });
    const stages = createStewartDisneyDeferredLiveStages({ capability: hostileCapability, package_sha256: h("e"), source_release_sha256: h("f"), driver: hostile });
    await assert.rejects(() => stages.executeChange(request), /STAGE_RESULT_INVALID|PRIVATE_DATA/);
  }
});

test("rejects a test-only rehearsal that did not reach a counted conversion", () => {
  assert.throws(() => compileStewartDisneyLiveAdapterCapability({ package_sha256: h("e"), source_release_sha256: h("f"), rehearsal_terminal: { ...rehearsal, counted: false }, driver: driver() }), /CAPABILITY_INPUT_INVALID/);
});
