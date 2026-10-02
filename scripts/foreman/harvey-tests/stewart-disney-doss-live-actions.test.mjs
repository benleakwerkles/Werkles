import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartDisneyDossLiveActions } from "../../../lib/harvey/stewart-disney-doss-live-actions.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const request = (prior = {}) => ({ schema: "pookakind.password-provider-stage-request/v1", operation_sha256: h("operation"), binding_sha256: h("binding"), plan_sha256: h("plan"), prior_receipt_sha256: prior });
function organs(calls, patch = {}) {
  const result = (name) => async () => { calls.push(name); return { schema: "safe", state: name }; };
  return {
    routeSensor: { observeIdentityRoute: result("observe") },
    identityCustody: { bindOpaqueIdentity: result("bind") },
    recovery: { submitRecoveryIdentity: result("recovery") },
    inbox: { captureEmailChallenge: result("capture") },
    challenge: { submitEmailChallenge: result("challenge") },
    passwordChange: { submitPasswordChange: result("change") },
    session: { clearOwnedSession: result("clear") },
    freshSignIn: { submitFreshIdentity: result("fresh-identity"), submitFreshSignIn: result("fresh-password") },
    vault: { reconcileExactOneVault: result("vault") },
    ...patch,
  };
}

test("binds ten exact production organs in one-shot stage order", async () => {
  const calls = []; const actions = createStewartDisneyDossLiveActions(organs(calls)); const prior = {};
  const sequence = [["observeIdentityRoute", "observeRoute"], ["bindOpaqueIdentity", "bindIdentity"], ["submitRecoveryIdentity", "requestRecovery"], ["captureEmailChallenge", "captureChallenge"], ["submitEmailChallenge", "submitChallenge"], ["submitPasswordChange", "executeChange"], ["clearOwnedSession", "clearSession"], ["submitFreshIdentity", "beginFreshSignIn"], ["submitFreshSignIn", "verifyFreshSignIn"], ["reconcileExactOneVault", "reconcileVault"]];
  for (const [action, stage] of sequence) {
    await actions[action](request(prior)); prior[stage] = h(stage);
  }
  assert.deepEqual(calls, ["observe", "bind", "recovery", "capture", "challenge", "change", "clear", "fresh-identity", "fresh-password", "vault"]);
  await assert.rejects(actions.observeIdentityRoute(request()), /STAGE_ORDER_INVALID/);
});

test("fails closed on missing organs, skipped stages, and private output", async () => {
  assert.throws(() => createStewartDisneyDossLiveActions({}), /ORGAN_MISSING/);
  const calls = []; const skipped = createStewartDisneyDossLiveActions(organs(calls));
  await assert.rejects(skipped.bindOpaqueIdentity(request()), /STAGE_ORDER_INVALID/);
  const leaking = createStewartDisneyDossLiveActions(organs([], { routeSensor: { observeIdentityRoute: async () => ({ password: "forbidden" }) } }));
  await assert.rejects(leaking.observeIdentityRoute(request()), /PRIVATE_OUTPUT_FORBIDDEN/);
});
