import assert from "node:assert/strict";
import fs from "node:fs";

import { recommendationSolutionPath } from "../../lib/squibb/recommendation-solution-path.ts";
import { RECOMMENDATION_KIND_LABELS, type RecommendationKind } from "../../lib/squibb/recommendations.ts";

const kinds = Object.keys(RECOMMENDATION_KIND_LABELS) as RecommendationKind[];
assert.equal(kinds.length, 12);
assert.equal(new Set(kinds.map((kind) => recommendationSolutionPath(kind).artifact.title)).size, 12);

for (const kind of kinds) {
  const path = recommendationSolutionPath(kind);
  assert.equal(path.playbook.length, 3, `${kind} needs a three-step playbook`);
  assert.equal(path.artifact.fields.length, 3, `${kind} needs a three-field artifact`);
  assert.ok(path.outcome.length > 30);
  assert.match(path.bellows.href, /^\/bellows\/library\/[a-z0-9-]+$/);
  assert.ok(path.comparison.criteria.length >= 4);
  assert.match(path.comparison.disclosure, /No provider is ranked here yet/);
  assert.match(path.comparison.disclosure, /whether Werkles is paid/);
  assert.ok(Object.isFrozen(path));
}

assert.equal(RECOMMENDATION_KIND_LABELS.verify_proof, "Strengthen Your Evidence");
assert.equal(RECOMMENDATION_KIND_LABELS.translate_need, "Choose the Next Decision");
assert.doesNotMatch(JSON.stringify(kinds.map(recommendationSolutionPath)), /Strengthen your case/);

const component = fs.readFileSync("components/squibb/recommendation-work-path.tsx", "utf8");
assert.match(component, /Save in this browser/);
assert.match(component, /Saved only in this browser profile/);
assert.match(component, /another browser or device will not have it/);
assert.match(component, /recommendationDraftStorageKey\(kind\)/);
assert.match(component, /Copy Draft to Clipboard/);
assert.match(component, /It does not save, send, or attach anything/);
assert.match(component, /Clear this draft/);
assert.match(component, /localStorage\.removeItem/);
assert.match(component, /Member-authored and not independently verified/);
assert.match(component, /Not legal, tax, accounting, lending, investment/);
assert.match(component, /Open My Bellows Lesson/);
assert.match(component, /Open Public Version/);
assert.match(component, /Open the general playbook: \{title\}/);
assert.match(component, /Werkles&apos;s first move/);
assert.match(component, /Done when:/);
assert.match(component, /intakeFacts/);
assert.doesNotMatch(component, /best provider/i);

console.log("Recommendation solution path: PASS");
