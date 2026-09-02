import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  checkGhostPhoneCode,
  GHOST_PROVIDER_BOUNDARY,
  GHOST_TWILIO_CODE,
  nextGhostFundsState,
  nextGhostIdentityState,
  showGhostPhoneCode
} from "../../lib/ghost-provider-walkthrough.ts";

assert.equal(nextGhostIdentityState("idle", "start"), "reviewing");
assert.equal(nextGhostIdentityState("reviewing", "complete"), "completed_not_saved");
assert.equal(nextGhostIdentityState("completed_not_saved", "start"), "completed_not_saved");
assert.equal(nextGhostIdentityState("completed_not_saved", "reset"), "idle");

assert.equal(showGhostPhoneCode(), "code_visible");
assert.equal(checkGhostPhoneCode("code_visible", "000000"), "incorrect");
assert.equal(checkGhostPhoneCode("incorrect", ` ${GHOST_TWILIO_CODE} `), "completed_not_saved");
assert.equal(checkGhostPhoneCode("idle", GHOST_TWILIO_CODE), "idle");
assert.match(GHOST_PROVIDER_BOUNDARY.identity, /Stripe is not contacted and nothing is saved/);
assert.match(GHOST_PROVIDER_BOUNDARY.phone, /Twilio sends no text/);
assert.match(GHOST_PROVIDER_BOUNDARY.funds, /Plaid is not contacted/);
assert.equal(nextGhostFundsState("idle", "select_scope"), "scope_selected");
assert.equal(nextGhostFundsState("scope_selected", "complete"), "completed_not_saved");
assert.equal(nextGhostFundsState("completed_not_saved", "reset"), "idle");

const component = readFileSync("components/crucible/ghost-provider-walkthrough.tsx", "utf8");
const panel = readFileSync("components/crucible/crucible-panel.tsx", "utf8");
assert.match(component, /Try the shape of a check without running one/);
assert.match(component, /cannot\s+change anyone&apos;s profile/);
assert.match(component, /A synthetic completion is not verification/);
assert.match(component, /Practice choosing a funds claim/);
assert.match(component, /The narrow result and date—not account numbers or balances/);
assert.doesNotMatch(component, /fetch\(|localStorage|sessionStorage|\/api\/|getSupabase|phoneNumber|documentUpload/);
assert.match(panel, /showGhostPractice \? <GhostProviderWalkthrough \/> : null/);

console.log("Ghost Stripe + Twilio + Plaid walkthrough: PASS");
