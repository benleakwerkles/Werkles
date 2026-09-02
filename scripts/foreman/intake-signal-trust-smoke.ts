import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { runLayer0 } from "../../lib/matching/layer0.ts";
import { evaluateNotMatch } from "../../lib/matching/not-match.ts";
import { scorePaths } from "../../lib/matching/score-paths.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import {
  buildSpeakerIntakePacket,
  EMPTY_INTAKE_ANSWERS
} from "../../lib/squibb/concierge-intake-v0.ts";

function rankedFor(answers: typeof EMPTY_INTAKE_ANSWERS) {
  const signals = signalsFromConcierge("intake-trust", answers);
  const layer0 = runLayer0(signals);
  return { signals, ranked: scorePaths(signals, layer0, evaluateNotMatch(signals, layer0)) };
}

const base = {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "Turn my weekend bakery into a dependable business.",
  business_stage: "First customers or users",
  time_cost: "Customers or sales"
};

const rejectedFunding = rankedFor({
  ...base,
  already_tried: "Ruled out — Loan or funding"
});
assert.equal(rejectedFunding.signals.capitalSeeking, false);
assert.equal(
  rejectedFunding.ranked.some((path) => path.kind === "find_credit_union" || path.kind === "raise_capital"),
  false,
  "a ruled-out funding path must not become current funding intent"
);

const currentFunding = rankedFor({
  ...base,
  time_cost: "Money or runway"
});
assert.equal(currentFunding.signals.capitalSeeking, true);
assert.ok(
  currentFunding.ranked.some((path) => path.kind === "find_credit_union"),
  "a current money blocker should change the ranked options"
);

const unknownProfile = rankedFor(base).signals.starterProfile;
assert.equal(unknownProfile.stage, "First customers or users");
assert.deepEqual(unknownProfile.resources, []);
assert.deepEqual(unknownProfile.offers, []);
assert.ok(unknownProfile.missing.includes("what you already have"));
assert.ok(unknownProfile.missing.includes("what you can offer another member"));

const packet = buildSpeakerIntakePacket(base, "2026-08-16T00:00:00.000Z");
assert.equal(packet.symptoms.find((field) => field.id === "business_stage")?.answer, "First customers or users");

const form = readFileSync("components/squibb/concierge-intake-form.tsx", "utf8");
assert.match(form, /What you are working on/);
assert.match(form, /What is in the way/);
assert.match(form, /What you already have/);
assert.match(form, /Your working brief/);
assert.match(form, /Past attempts stay past attempts/);

const surface = readFileSync("components/squibb/recommendation-surface.tsx", "utf8");
assert.match(surface, /Recommended \(\{session\.ranked\.length\}\)/);
assert.match(surface, /Why this appeared/);
assert.match(surface, /Your answers can move, add, or remove options when you submit them again/);

const sourcePanel = readFileSync("components/squibb/source-document-panel.tsx", "utf8");
assert.match(sourcePanel, /key=\{`\$\{excerpt\.id\}-\$\{index\}`\}/);

console.log("Intake signal trust and recommendation causality: PASS");
