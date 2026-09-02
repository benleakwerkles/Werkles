import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { rankGhostsForSignals } from "../../lib/ghost-fleet/match.ts";
import type { GhostMember } from "../../lib/ghost-fleet/types.ts";
import { runLayer0 } from "../../lib/matching/layer0.ts";
import { evaluateNotMatch } from "../../lib/matching/not-match.ts";
import { scorePaths } from "../../lib/matching/score-paths.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";

const base = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Take a working product to ATDC and find funding for a paid pilot.",
  business_stage: "Testing it",
  time_cost: "I need to prove that customers will pay before I apply.",
  stuck_decision: "Whether to sell a pilot first or look for financing now.",
  success_twelve_months: "Ten paying customers and enough runway to hire carefully.",
  resources_on_hand: "A working prototype, three customers, product design skills, and a garage workspace.",
  what_you_offer: "Product design, customer interviews, and user research.",
  constraints: "I cannot move away from Atlanta or risk more than $2,000."
};

const signals = signalsFromConcierge("intake_dual_purpose", base);
assert.equal(signals.capitalSeeking, true, "funding/financing inflections must be recognized");
assert.deepEqual(signals.assets.sort(), ["Customers", "Idea", "Place", "Skills"].sort());
assert.deepEqual(signals.starterProfile, {
  version: "v1",
  source: "self_reported_intake",
  project: base.heaviest_lift,
  stage: base.business_stage,
  goal: base.success_twelve_months,
  resources: ["A working prototype", "three customers", "product design skills", "and a garage workspace."],
  offers: ["Product design", "customer interviews", "and user research."],
  seeks: [base.time_cost, base.stuck_decision],
  constraints: [base.constraints],
  missing: []
});

const layer0 = runLayer0(signals);
const ranked = scorePaths(signals, layer0, evaluateNotMatch(signals, layer0));
assert.ok(ranked.some((path) => path.kind === "verify_proof"));
assert.ok(ranked.some((path) => path.kind === "find_credit_union"));
assert.equal(ranked.some((path) => path.kind === "find_better_job"), false);
assert.equal(ranked.some((path) => path.kind === "get_training"), false);
assert.equal(ranked.some((path) => path.kind === "relocate"), false);

const bakerySignals = signalsFromConcierge("intake_bakery_capacity", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Open a small neighborhood bakery with dependable weekday sales.",
  business_stage: "Testing it",
  time_cost: "Customers or sales; Tools, equipment, or space",
  stuck_decision: "Choose whether to validate preorder demand before leasing kitchen space.",
  resources_on_hand: "An idea or prototype; Skills or credentials"
});
const bakeryLayer0 = runLayer0(bakerySignals);
const bakeryRanked = scorePaths(bakerySignals, bakeryLayer0, evaluateNotMatch(bakerySignals, bakeryLayer0));
assert.deepEqual(
  bakeryRanked.slice(0, 3).map((path) => path.kind),
  ["verify_proof", "find_equipment", "translate_need"],
  "the saved bakery intake must yield three distinct ranked ways forward"
);
assert.match(bakeryRanked[0]?.rationale.join(" ") ?? "", /paid-demand test should lead/i);

const attemptsOnly = signalsFromConcierge("intake_attempts", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Open a neighborhood bakery.",
  already_tried: "I tried a loan and asked a partner; neither helped.",
  time_cost: "Finding repeat customers.",
  success_twelve_months: "A steady bakery with repeat orders."
});
assert.equal(attemptsOnly.capitalSeeking, false, "a past loan attempt is not a current funding request");
assert.equal(attemptsOnly.partnerSeeking, false, "a past partner attempt is not a current partner request");

const negated = signalsFromConcierge("intake_negated", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Grow my repair shop. I do not want funding and I am not looking for a partner.",
  time_cost: "Scheduling jobs consistently."
});
assert.equal(negated.capitalSeeking, false);
assert.equal(negated.partnerSeeking, false);

const ghost: GhostMember = {
  id: "ghost_profile_test",
  synthetic: true,
  displayName: "Synthetic Builder",
  city: "Atlanta",
  region: "Georgia",
  lane: "Builder",
  roleLabel: "Research builder",
  skills: ["product design", "user research"],
  offers: ["customer interviews", "user research"],
  seeks: ["product design", "user research"],
  capitalPosture: "not_qualified",
  openToPartner: false,
  statedNeed: "Need product design and user research.",
  alreadyTried: "Asked locally.",
  timeCost: "Research planning.",
  stuckDecision: "Which research path to use.",
  successTwelveMonths: "A tested product.",
  proofGaps: ["Synthetic test member"],
  workshopHeadline: "Test only",
  workshopRows: [],
  introEligibility: "open",
  handeyeSeat: "Bean",
  faceAsset: "/ghost.svg",
  faceStatus: "placeholder"
};
const withOffer = rankGhostsForSignals(signals, [ghost]);
assert.ok(withOffer.candidates[0]?.reasons.some((reason) => reason.label === "Two-way, not extractive"));

const withoutOffer = rankGhostsForSignals(
  signalsFromConcierge("intake_no_offer", { ...base, what_you_offer: "" }),
  [ghost]
);
assert.equal(
  withoutOffer.candidates[0]?.reasons.some((reason) => reason.label === "Two-way, not extractive") ?? false,
  false,
  "a goal must never be laundered into an offer"
);

const formSource = readFileSync("components/squibb/concierge-intake-form.tsx", "utf8");
const routeSource = readFileSync("app/api/bellows/intake/route.ts", "utf8");
const converterSource = readFileSync("lib/matching/shadow-to-recommendations.ts", "utf8");
const profilePanelSource = readFileSync("components/squibb/source-document-panel.tsx", "utf8");
assert.match(formSource, /filter\(\(q\) => q\.required\)\.every/);
assert.match(formSource, /Show me what might help/);
assert.match(routeSource, /question\.required && answers\[question\.id\]\.length === 0/);
assert.match(converterSource, /starterProfile: run\.signals\.starterProfile/);
assert.match(converterSource, /catalog: loadSquibbRecommendationSession\(\)\.catalog/);
assert.match(profilePanelSource, /Starter profile — private draft/);
assert.match(profilePanelSource, /Nothing here is published or sent/);

console.log("Dual-purpose Intake → solutions + starter profile: PASS");
