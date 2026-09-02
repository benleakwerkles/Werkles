import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { scorePaths } from "../../lib/matching/score-paths.ts";
import { runLayer0 } from "../../lib/matching/layer0.ts";
import { evaluateNotMatch } from "../../lib/matching/not-match.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { buildMemberRecommendationPlan } from "../../lib/squibb/member-recommendation-plan.ts";
import { memberRecommendationPresentation } from "../../lib/squibb/member-recommendation-insight.ts";

const longDecision =
  "Whether or not I have built enough of either of my sites/apps to show to mentors and investors to start seeking investment/funding, or start finishing up and getting customer ready. I'm not a programmer, so this is my first try creating code or building a real, functional website. And I'm building two at the same time.";

const answers = {
  heaviest_lift: "Werkles and PookaKind",
  business_stage: "Testing it",
  already_tried: "Considering — Loan or funding; Considering — Partner or co-owner",
  time_cost: "Money or runway; Customers or sales",
  stuck_decision: longDecision,
  success_twelve_months: "Funded, a few customers, one or two employees.",
  resources_on_hand: "An idea or prototype; Time to work on it; Money or credit; An existing company or documents",
  what_you_offer: "Ideas, workflow, management experience, and experience starting small businesses.",
  constraints: "I cannot move; I need to get Werkles.com and PookaKind.com running."
} as const;

const facts = Object.entries(answers).map(([id, text]) => ({ id: `intake-${id}`, label: id, text }));
const signals = signalsFromConcierge("insight-smoke", answers);
const layer0 = runLayer0(signals);
const scored = scorePaths(signals, layer0, evaluateNotMatch(signals, layer0)).filter((path) => !path.disqualified);

assert.deepEqual(scored.slice(0, 3).map((path) => path.kind), [
  "verify_proof",
  "translate_need",
  "find_credit_union"
]);

const plans = scored.slice(0, 3).map((path) => buildMemberRecommendationPlan(path.kind, facts));
for (const plan of plans) {
  const prominent = [plan.title, plan.verdict, ...plan.reasons, ...plan.sprint.flatMap((step) => [step.title, step.action])].join(" ");
  assert.equal(prominent.includes(longDecision), false, "member paragraph must not become prominent output");
  assert.equal(plan.tailored, true);
  assert.ok(plan.reasons.length >= 3);
  assert.equal(plan.sprint.length, 3);
}

assert.equal(new Set(plans.map((plan) => plan.title)).size, 3, "top plans need distinct jobs");
assert.match(plans[0].verdict, /Customers.*mentors.*investors/i);
assert.match(plans[0].sprint[1].action, /five people/i);
assert.match(plans[0].finishLine, /customer, mentor, or funder/i);
assert.match(plans[1].title, /ready for whom/i);
assert.match(plans[1].artifactDraft.decision, /which product and audience/i);
assert.match(plans[2].title, /not borrow/i);
assert.match(plans[2].verdict, /later move—not the next one/i);

const presentation = memberRecommendationPresentation("verify_proof", signals, {
  title: "Fallback",
  headline: "Fallback"
});
assert.equal(presentation.title, "Test One Product with One Audience");
assert.match(presentation.headline, /outside behavior/i);

const surfaceSource = readFileSync("components/squibb/recommendation-surface.tsx", "utf8");
assert.match(surfaceSource, /visibleIntakes/);
assert.match(surfaceSource, /candidate\.intakeId === row\.intakeId/);
assert.doesNotMatch(surfaceSource, /key=\{intake\.intakeId\}/);

console.log("Recommendation insight-not-echo contract: PASS");
