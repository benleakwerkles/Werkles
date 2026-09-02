import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const surface = fs.readFileSync(
  path.join(root, "components/squibb/recommendation-surface.tsx"),
  "utf8"
);
const summary = fs.readFileSync(
  path.join(root, "lib/squibb/member-facing-recommendation-summary.ts"),
  "utf8"
);

const required = [
  "How this connects to your Snapshot",
  "What connected it to your answers",
  "Boundary",
  "Do now",
  "memberFacingRecommendationSummary(selected, selectedAnswerExcerpts)",
  "selectedSummary.why",
  "selectedSummary.caution",
  "selectedSummary.nextAction",
  "<RecommendationWorkPath"
];

for (const marker of required) {
  if (!surface.includes(marker)) {
    throw new Error(`Missing reviewed recommendation summary contract: ${marker}`);
  }
}

for (const marker of [
  "This option is worth comparing with the evidence and limits shown below.",
  "This is a starting option to compare, not a promise that it will work.",
  "Review the evidence below and compare this option before deciding.",
  "INTERNAL_LANGUAGE",
  "RAW_INTERNAL_LANGUAGE",
  "pattern.test(rawScreened)",
  "screeningCopy(candidate)",
  ".replace(/[\\p{Pd}_]+/gu, \" \")",
  ".replace(/\\s+/g, \" \")",
  "(?:human|operator|policy|verification|release)\\s+gates?",
  "gate\\s+\\d+",
  "firstMemberFacing(recommendation.reasoning.rationale)",
  "recommendation.reasoning.nextSteps ?? []"
]) {
  if (!summary.includes(marker)) {
    throw new Error(`Missing hostile-review repair contract: ${marker}`);
  }
}

if (surface.includes('<h3 id="selectedNextStepsTitle">Try this next</h3>')) {
  throw new Error("The old three-step block still duplicates the pithy selected-option summary.");
}

for (const banned of ["Support band", "A person checks this first", "account custody"]) {
  if (surface.includes(banned)) {
    throw new Error(`Banned member-facing recommendation copy returned: ${banned}`);
  }
}

console.log("Recommendation specificity Pleasant University pilot: PASS");
