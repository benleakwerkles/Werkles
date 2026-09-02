import assert from "node:assert/strict";

import { runLayer0 } from "../../lib/matching/layer0.ts";
import { evaluateNotMatch } from "../../lib/matching/not-match.ts";
import {
  IntakePathStateContractError,
  parseStructuredPathStatuses
} from "../../lib/matching/path-state.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";

const base = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Open a repair shop using the customers and tools I already have.",
  business_stage: "Testing it",
  time_cost: "Scheduling is taking too much time.",
  stuck_decision: "Choose which workflow to repair first.",
  success_twelve_months: "A steady shop with shorter turnaround.",
  resources_on_hand: "Customers, tools, and repair experience.",
  what_you_offer: "Repair experience and local customer introductions.",
  constraints: "I cannot move this year."
};

const triedLoan = signalsFromConcierge("tried_loan", {
  ...base,
  already_tried: "Tried — Loan or funding"
});
assert.equal(triedLoan.capitalSeeking, false);
assert.equal(triedLoan.intakeTextBlob.includes("Loan or funding"), false);
assert.equal(triedLoan.historicalAttemptText, "Tried — Loan or funding");
assert.deepEqual(triedLoan.triedKinds, ["raise_capital", "find_banker", "find_credit_union"]);

const negativePartner = signalsFromConcierge("negative_partner", {
  ...base,
  heaviest_lift: "A partner is not an option. I need a clearer operating plan."
});
assert.equal(negativePartner.partnerSeeking, false);

const consideringWorker = signalsFromConcierge("considering_worker", {
  ...base,
  already_tried: "Considering — Employee or contractor"
});
assert.deepEqual(consideringWorker.consideringKinds, ["stage_intro_candidate"]);

const thinRuledOut = signalsFromConcierge("thin_ruled_out", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Help",
  already_tried: "Ruled out — Tool or system"
});
const thinNotMatch = evaluateNotMatch(thinRuledOut, runLayer0(thinRuledOut));
assert.equal(thinNotMatch.outcome, "pause");
assert.ok(thinNotMatch.disqualified.some((item) => item.kind === "find_equipment"));
assert.ok(thinNotMatch.disqualified.some((item) => item.reason.includes("You marked")));

assert.throws(
  () => parseStructuredPathStatuses("Considering — Mystery path"),
  IntakePathStateContractError
);
assert.throws(
  () => parseStructuredPathStatuses("Considering — Tool or system\nRuled out — Tool or system"),
  IntakePathStateContractError
);

console.log("Matching current-intent/history boundary: PASS");
