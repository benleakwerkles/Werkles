import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const home = read("app/page.tsx");
const intakePage = read("app/bellows/intake/page.tsx");
const intakeForm = read("components/squibb/concierge-intake-form.tsx");
const recommendation = read("components/squibb/recommendation-surface.tsx");
const sourcePanel = read("components/squibb/source-document-panel.tsx");
const matchLab = read("components/ghost-fleet/ghost-member-interaction-lab.tsx");
const matcher = read("lib/ghost-fleet/match.ts");

for (const [surface, source] of Object.entries({ home, intakePage, intakeForm, sourcePanel, matchLab })) {
  assert.match(source, /working Snapshot/i, `${surface} must use the shared working Snapshot language`);
}

assert.match(sourcePanel, /not independently verified or shared automatically/i);
assert.match(matchLab, /self-reported Intake details · not independently verified/i);
assert.doesNotMatch(matchLab, /<span>\{selected\.snapshotNeed\}<\/span>/);
assert.match(recommendation, /Why this came first/);
assert.match(recommendation, /<section className="squibb-rec-detail__next-steps"/);
assert.doesNotMatch(recommendation, /<summary id="selectedOptionSummaryTitle"/);
assert.ok(
  recommendation.indexOf("Why this came first") < recommendation.indexOf("<RecommendationWorkPath"),
  "Recommendations must explain the causal connection before asking the member to do more work"
);
assert.match(matcher, /No reasons means no honest introduction — drop rather than pad the list/);
assert.match(matcher, /\.filter\(\(row\) => row\.score > 0/);
assert.match(matcher, /"partner", "partners", "company", "companies", "business", "businesses"/);
assert.match(matcher, /"whatever", "idea", "ideas", "building", "build", "work", "working"/);
assert.doesNotMatch(matchLab, /verified ownership|verified funds/i);

console.log("THREE_SURFACE_MEMBER_VALUE_SMOKE_OK");
