import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  BACKER_EQUALITY_POLICY,
  eligibleForCapitalConversation
} from "../../lib/ghost-fleet/backer-equality.ts";
import type { GhostMember } from "../../lib/ghost-fleet/types.ts";

function member(overrides: Partial<GhostMember> = {}): GhostMember {
  return {
    id: "ghost_backer", synthetic: true, displayName: "Casey", city: "Decatur", region: "AL",
    lane: "Backer", roleLabel: "Peer backer", skills: [], offers: [], seeks: [],
    capitalPosture: "can_back", openToPartner: true, statedNeed: "",
    alreadyTried: "", timeCost: "", stuckDecision: "", successTwelveMonths: "",
    proofGaps: [], workshopHeadline: "", workshopRows: [], introEligibility: "open",
    handeyeSeat: "Bean", faceAsset: "", faceStatus: "placeholder", ...overrides
  };
}

assert.deepEqual(BACKER_EQUALITY_POLICY.postureValues, ["can_back", "not_qualified"]);
assert.equal(eligibleForCapitalConversation(member()), true);
assert.equal(eligibleForCapitalConversation(member({ capitalPosture: "not_qualified" })), false);
assert.equal(eligibleForCapitalConversation(member({ lane: "Operator" })), false);
assert.ok(Object.isFrozen(BACKER_EQUALITY_POLICY));
assert.ok(Object.isFrozen(BACKER_EQUALITY_POLICY.forbiddenUses));

const matcher = readFileSync("lib/ghost-fleet/match.ts", "utf8");
assert.doesNotMatch(matcher, /capitalPosture/);
assert.doesNotMatch(matcher, /Capital posture fits|Both chasing the same money/);

const matchingSources = [
  readFileSync("lib/ghost-fleet/match.ts", "utf8"),
  readFileSync("lib/ghost-fleet/types.ts", "utf8")
].join("\n");
for (const forbidden of ["netWorth", "wealthBand", "excessAboveThreshold", "fundsProof", "accountBalance"] ) {
  assert.equal(matchingSources.includes(forbidden), false, `${forbidden} must not enter matching`);
}

console.log("Ghost Backer equality contract: PASS");
