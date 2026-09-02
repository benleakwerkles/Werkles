import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildMatchingReadout } from "../../lib/matching/deliver.ts";
import { runLayer0 } from "../../lib/matching/layer0.ts";
import { evaluateNotMatch } from "../../lib/matching/not-match.ts";
import {
  buildOpportunityCase,
  buildOpportunityCaseFromSignals
} from "../../lib/matching/opportunity-case.ts";
import { scorePaths } from "../../lib/matching/score-paths.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";

function opportunityFromAnswers(intakeId: string, values: typeof answers) {
  const signals = signalsFromConcierge(intakeId, values);
  const layer0 = runLayer0(signals);
  const notMatch = evaluateNotMatch(signals, layer0);
  const scoredPaths = scorePaths(signals, layer0, notMatch);
  const readout = buildMatchingReadout(signals, layer0, notMatch, scoredPaths);
  return buildOpportunityCase({ intakeId, signals, layer0, notMatch, readout });
}

const answers = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Grow a mobile repair business without giving up the customers I already serve.",
  business_stage: "Running, want it steadier",
  already_tried: "Ruled out — Partner or co-owner",
  time_cost: "Scheduling and parts ordering keep me from finishing profitable repair work.",
  stuck_decision: "Decide whether software, a dispatcher, or a better parts supplier solves the delay first.",
  success_twelve_months: "Steady weekly work, shorter turnaround, and two evenings back.",
  resources_on_hand: "A service truck, diagnostic tools, repeat customers, and fifteen years of repair experience.",
  what_you_offer: "I can diagnose engines, train apprentices, and introduce local fleet customers.",
  constraints: "I cannot move or risk more than $3,000 before the change proves itself."
};

const opportunity = opportunityFromAnswers("intake_opportunity_case", answers);
const directOpportunity = buildOpportunityCaseFromSignals(
  signalsFromConcierge("intake_opportunity_case_direct", answers)
);

const legacySignals = signalsFromConcierge("intake_opportunity_case_legacy", answers);
const legacyRunSignals = { ...legacySignals } as Partial<typeof legacySignals>;
delete legacyRunSignals.consideringKinds;
delete legacyRunSignals.starterProfile;
const legacyLayer0 = runLayer0(legacyRunSignals as typeof legacySignals);
const legacyNotMatch = evaluateNotMatch(legacyRunSignals as typeof legacySignals, legacyLayer0);
const legacyScoredPaths = scorePaths(legacyRunSignals as typeof legacySignals, legacyLayer0, legacyNotMatch);
const legacyReadout = buildMatchingReadout(
  legacyRunSignals as typeof legacySignals,
  legacyLayer0,
  legacyNotMatch,
  legacyScoredPaths
);
const legacyOpportunity = buildOpportunityCase({
  intakeId: "intake_opportunity_case_legacy",
  signals: legacyRunSignals as typeof legacySignals,
  layer0: legacyLayer0,
  notMatch: legacyNotMatch,
  readout: legacyReadout
});

assert.equal(opportunity.profileContribution.project, answers.heaviest_lift);
assert.deepEqual(opportunity.profileContribution.offers, [
  "I can diagnose engines",
  "train apprentices",
  "and introduce local fleet customers."
]);
assert.equal(opportunity.facts.find((fact) => fact.id === "offer")?.provenance, "self_reported");
assert.equal(opportunity.hypotheses[0]?.provenance, "rule_derived");
assert.ok(opportunity.hypotheses[0]?.evidenceFor.some((line) => line.includes("mobile repair business")));
assert.ok(opportunity.paths.every((path) => path.support !== undefined));
assert.ok(Object.isFrozen(opportunity));
assert.ok(Object.isFrozen(opportunity.facts));
assert.ok(Object.isFrozen(opportunity.profileContribution.offers));
assert.equal(directOpportunity.version, "v1");
assert.equal(directOpportunity.profileContribution.project, answers.heaviest_lift);
assert.equal(legacyOpportunity.version, "v1");
assert.equal(legacyOpportunity.profileContribution.project, answers.heaviest_lift);
assert.equal(legacyOpportunity.profileContribution.stage, "");
assert.deepEqual(legacyOpportunity.profileContribution.offers, []);
assert.deepEqual(opportunity.memberPathStatuses, [
  { pathId: "partner_or_co_owner", pathLabel: "Partner or co-owner", status: "ruled_out" }
]);
assert.equal(
  opportunity.notMatch.suppressedPaths.some((path) => path.kind === "find_partner"),
  true
);
assert.equal(
  opportunity.paths.find((path) => path.kind === "translate_need")?.support,
  "directly_supported"
);

const noOfferAnswers = {
  ...answers,
  what_you_offer: ""
};
const noOfferCase = opportunityFromAnswers("intake_no_offer", noOfferAnswers);

assert.deepEqual(noOfferCase.profileContribution.offers, []);
assert.equal(noOfferCase.facts.find((fact) => fact.id === "offer")?.provenance, "missing");
assert.ok(noOfferCase.profileContribution.missing.includes("what you can offer another member"));

const thinAnswers = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Help"
};
const thinCase = opportunityFromAnswers("intake_thin", thinAnswers);

assert.equal(thinCase.notMatch.outcome, "pause");
assert.ok(thinCase.notMatch.suppressedPaths.length > 0);
assert.ok(thinCase.paths.filter((path) => path.kind === "find_partner").every((path) => path.support === "excluded_by_rules"));

const recommendationSurface = readFileSync("components/squibb/recommendation-surface.tsx", "utf8");
assert.match(recommendationSurface, /source\.opportunityCase\?\.paths/);
assert.match(recommendationSurface, /How strongly your answers support it/);
assert.match(recommendationSurface, /What held it down/);

console.log("Matching opportunity case contract: PASS");
