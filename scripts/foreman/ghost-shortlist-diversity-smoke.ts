import assert from "node:assert/strict";

import { rankGhostsForSignals } from "../../lib/ghost-fleet/match.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";
import type { GhostMember, GhostLane } from "../../lib/ghost-fleet/types.ts";

function ghost(id: string, lane: GhostLane, roleLabel: string, training = false): GhostMember {
  return {
    id,
    synthetic: true,
    displayName: `Person ${id}`,
    city: "Cleveland",
    region: "OH",
    lane,
    roleLabel,
    skills: [],
    offers: training ? ["Training", "Licensing guidance"] : ["Capital introductions"],
    seeks: ["Operators worth backing"],
    capitalPosture: lane === "Backer" ? "can_back" : "not_qualified",
    openToPartner: true,
    statedNeed: "A useful collaboration",
    alreadyTried: "One conversation",
    timeCost: "A few hours",
    stuckDecision: "Which person fits",
    successTwelveMonths: "Useful work together",
    proofGaps: ["Identity not checked"],
    workshopHeadline: "Practice profile",
    workshopRows: [],
    introEligibility: "open",
    handeyeSeat: "Bean",
    faceAsset: "",
    faceStatus: "placeholder"
  };
}

const signals = signalsFromConcierge("intake_diversity", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "I need money, a partner, and training to move this business forward.",
  business_stage: "Working prototype",
  time_cost: "Finding the right help",
  stuck_decision: "Whether to find funding or experienced help first",
  success_twelve_months: "A launched business",
  resources_on_hand: "A prototype and time",
  what_you_offer: "Product experience",
  constraints: "Stay in Ohio"
});

const result = rankGhostsForSignals(signals, [
  ghost("backer_a", "Backer", "Retired contractor"),
  ghost("backer_b", "Backer", "Retired contractor"),
  ghost("connector_a", "Connector", "Licensing coach", true),
  ghost("operator_a", "Operator", "Operations trainer", true)
], 3);

assert.equal(result.candidates.length, 3);
assert.equal(result.candidates[0].lane, "Connector", "relevant stated coverage—not financial posture—must lead");
assert.notEqual(result.candidates[0].lane, "Backer", "can_back must not create rank");
assert.equal(new Set(result.candidates.map((candidate) => candidate.lane)).size, 3);
assert.equal(new Set(result.candidates.map((candidate) => candidate.ghostId)).size, 3);

const repeatedArchetypes = rankGhostsForSignals(signals, [
  ghost("backer_a", "Backer", "Retired contractor"),
  ghost("backer_b", "Backer", "Retired contractor"),
  ghost("backer_c", "Backer", "Retired contractor"),
  ghost("operator_a", "Operator", "Operations trainer", true)
], 3);
assert.equal(repeatedArchetypes.candidates.length, 2, "a third cloned archetype must not pad the shortlist");
assert.deepEqual(repeatedArchetypes.candidates.map((candidate) => candidate.ghostId), ["operator_a", "backer_a"]);

console.log("Ghost shortlist diversity contract: PASS");
