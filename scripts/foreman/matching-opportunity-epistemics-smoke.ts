import assert from "node:assert/strict";

import { buildOpportunityCaseFromSignals } from "../../lib/matching/opportunity-case.ts";
import {
  buildOpportunityCaseEpistemics,
  OPPORTUNITY_TRUTH_CLASSES
} from "../../lib/matching/opportunity-case-epistemics.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";

const observedAt = "2026-08-20T20:00:00.000Z";
const answers = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Make a mobile repair service steadier.",
  business_stage: "Serving repeat customers now.",
  already_tried: "Considering — Employee or contractor",
  time_cost: "Scheduling and parts ordering interrupt paid work.",
  stuck_decision: "Choose software, help, or a supplier change first.",
  success_twelve_months: "Shorter turnaround and two evenings back.",
  resources_on_hand: "A service truck, tools, and repeat customers.",
  what_you_offer: "Repair experience and local introductions.",
  constraints: "I cannot move or risk more than $3,000."
};

const opportunity = buildOpportunityCaseFromSignals(signalsFromConcierge("intake_epistemics", answers));
const appendix = buildOpportunityCaseEpistemics(opportunity, observedAt);

assert.deepEqual(OPPORTUNITY_TRUTH_CLASSES, [
  "SELF_REPORTED_FACT", "VERIFIED_EVIDENCE", "RULE_DERIVED_INFERENCE",
  "MODEL_HYPOTHESIS", "EXTERNAL_RESEARCH", "UNKNOWN", "DECISION"
]);
assert.equal(appendix.caseRevisionId, "case:intake_epistemics:revision:1");
assert.equal(appendix.readiness.diagnostic.state, "ready_for_options");
assert.equal(appendix.readiness.matching.state, "test_required");
assert.equal(appendix.claims.some((claim) => claim.truthClass === "VERIFIED_EVIDENCE"), false);
assert.equal(appendix.claims.some((claim) => claim.truthClass === "SELF_REPORTED_FACT"), true);
assert.equal(appendix.claims.some((claim) => claim.truthClass === "RULE_DERIVED_INFERENCE"), true);
assert.equal(appendix.claims.some((claim) => claim.truthClass === "DECISION"), true);
assert.equal(appendix.decisions[0]?.state, "considering");
assert.equal(appendix.decisions[0]?.reversible, true);
assert.equal(
  appendix.claims.find((claim) => claim.claimId === appendix.decisions[0]?.sourceClaimIds[0])?.truthClass,
  "DECISION"
);
assert.ok(appendix.claims.filter((claim) => claim.truthClass === "RULE_DERIVED_INFERENCE")
  .every((claim) => claim.evidenceRequired.length > 0 || claim.falsifiers.length > 0));
assert.ok(Object.isFrozen(appendix));
assert.ok(Object.isFrozen(appendix.claims));
assert.ok(Object.isFrozen(appendix.readiness));

const thin = buildOpportunityCaseEpistemics(
  buildOpportunityCaseFromSignals(signalsFromConcierge("thin", {
    ...EMPTY_INTAKE_ANSWERS,
    heaviest_lift: "Help"
  })),
  observedAt
);
assert.equal(thin.readiness.diagnostic.state, "insufficient_input");
assert.equal(thin.readiness.matching.state, "not_eligible");

assert.throws(
  () => buildOpportunityCaseEpistemics(opportunity, "2026-02-31T20:00:00.000Z"),
  /canonical UTC/
);

console.log("Matching opportunity epistemics: PASS");
