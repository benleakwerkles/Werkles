import assert from "node:assert/strict";

import {
  memberFacingRecommendationSummary,
  selectMemberFacingCausalFact
} from "../../lib/squibb/member-facing-recommendation-summary";
import type { SquibbRecommendation } from "../../lib/squibb/recommendations";

const base: SquibbRecommendation = {
  id: "candidate-1",
  kind: "translate_need",
  rank: 1,
  title: "Clarify the first move",
  headline: "Clarify the first move",
  squibbNote: "",
  reasoning: {
    statedNeed: "Open a neighborhood bakery",
    rationale: ["Your first decision is still unclear."],
    nextSteps: ["Write down the first decision and the date it must be made."]
  },
  confidence: { score: 50, label: "medium", why: "" },
  evidence: [],
  humanGates: [],
  suggestedAgent: "",
  keepOriginalPathLabel: ""
};

const useful = memberFacingRecommendationSummary(base);
assert.equal(useful.why, "Your first decision is still unclear.");
assert.equal(useful.nextAction, "Write down the first decision and the date it must be made.");
assert.ok(Object.isFrozen(useful));

const causalFacts = [
  { label: "What are you trying to make real?", text: "Open a neighborhood bakery" },
  { label: "Where is it today?", text: "Testing it" },
  {
    label: "What is getting in the way right now?",
    text: "Customers or sales; Tools, equipment, or space"
  },
  {
    label: "What decision do you need to make next?",
    text: "Validate preorder demand before leasing kitchen space"
  }
] as const;

assert.deepEqual(selectMemberFacingCausalFact(causalFacts), causalFacts[2]);

const causal = memberFacingRecommendationSummary(
  {
    ...base,
    title: "Strengthen your case",
    reasoning: {
      ...base.reasoning,
      translatedNeed:
        "Make the case concrete before asking a lender, partner, customer, or reviewer to believe it."
    }
  },
  causalFacts
);

assert.equal(
  causal.why,
  "Strengthening your case helps by putting this step first: making the case concrete before asking a lender, partner, customer, or reviewer to believe it."
);

const noGoalRepeat = selectMemberFacingCausalFact([
  causalFacts[0],
  { label: "Where is it today?", text: "Testing it" }
]);
assert.deepEqual(noGoalRepeat, { label: "Where is it today?", text: "Testing it" });

assert.equal(
  selectMemberFacingCausalFact([causalFacts[0]]),
  null,
  "A goal alone must not masquerade as causal evidence for a recommendation."
);

const goalOnly = memberFacingRecommendationSummary(base, [causalFacts[0]]);
assert.equal(
  goalOnly.why,
  "Your first decision is still unclear.",
  "Goal-only input must fall back to the recommendation's reviewed rationale."
);

const hostile = memberFacingRecommendationSummary({
  ...base,
  headline: "",
  reasoning: {
    ...base.reasoning,
    rationale: [" ", "Provider routing status code sandbox_pending"],
    counterpoint: "Account custody implementation diagnostic failed",
    nextSteps: ["POST /api/internal before the verification gate"]
  },
  humanGates: [
    {
      id: "gate-1",
      label: "Internal",
      kind: "operator_approval",
      severity: "warning",
      reason: "Governance routing requires a provider status code",
      benMustApprove: false
    }
  ]
});

assert.equal(hostile.why, "This option is worth comparing with the evidence and limits shown below.");
assert.equal(hostile.caution, "This is a starting option to compare, not a promise that it will work.");
assert.equal(hostile.nextAction, "Review the evidence below and compare this option before deciding.");
assert.ok(hostile.why.trim());
assert.ok(hostile.caution.trim());
assert.ok(hostile.nextAction.trim());

const isolatedGateBypasses = [
  "Gate 05 must pass before this option can proceed.",
  "Release gate is still pending.",
  "Human gates remain.",
  "Verification-gate pending.",
  "Support-band",
  "Support   band",
  "Support\nband",
  "sandbox_pending"
];

for (const bypass of isolatedGateBypasses) {
  const screened = memberFacingRecommendationSummary({
    ...base,
    reasoning: {
      ...base.reasoning,
      rationale: [bypass],
      counterpoint: bypass,
      nextSteps: [bypass]
    }
  });

  assert.equal(
    screened.why,
    "This option is worth comparing with the evidence and limits shown below.",
    `why leaked isolated internal copy: ${JSON.stringify(bypass)}`
  );
  assert.equal(
    screened.caution,
    "This is a starting option to compare, not a promise that it will work.",
    `caution leaked isolated internal copy: ${JSON.stringify(bypass)}`
  );
  assert.equal(
    screened.nextAction,
    "Review the evidence below and compare this option before deciding.",
    `next action leaked isolated internal copy: ${JSON.stringify(bypass)}`
  );
}

console.log("Recommendation member-facing summary hostile contract: PASS");
