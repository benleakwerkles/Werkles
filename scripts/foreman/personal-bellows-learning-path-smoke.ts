import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildPersonalBellowsLearningPath } from "../../lib/bellows/personal-learning-path.ts";
import { loadSquibbRecommendationSession } from "../../lib/squibb/recommendations.ts";

const demo = loadSquibbRecommendationSession();
assert.deepEqual(buildPersonalBellowsLearningPath(demo), []);

const rawGoal = "Open a repair shop on Jefferson Avenue for antique motorcycles.";
const rawBlocker = "I cannot choose between renting a garage and working mobile.";
const ranked = [
  demo.catalog.find((item) => item.kind === "translate_need")!,
  demo.catalog.find((item) => item.kind === "verify_proof")!,
  demo.catalog.find((item) => item.kind === "find_equipment")!,
  demo.catalog.find((item) => item.kind === "find_partner")!
];
const personal = {
  ...demo,
  ranked,
  source: {
    mode: "latest_intake" as const,
    label: "Current Intake",
    detail: "Private test fixture",
    fedDocument: {
      id: "intake-private",
      title: "Current Intake",
      kind: "member_intake" as const,
      summary: "Private test fixture",
      body: "Private test fixture",
      excerpts: [
        { id: "intake-heaviest_lift", label: "Goal", text: rawGoal, feeds: ranked.map((item) => item.kind) },
        { id: "intake-time_cost", label: "Blocker", text: rawBlocker, feeds: ranked.map((item) => item.kind) }
      ]
    }
  }
};

const path = buildPersonalBellowsLearningPath(personal);
assert.equal(path.length, 3);
assert.equal(new Set(path.map((step) => step.lesson.href)).size, path.length);
assert.deepEqual(path.map((step) => step.rank), [1, 2, 3]);
assert.equal(new Set(path.map((step) => step.workingRead)).size, path.length);
assert.equal(new Set(path.map((step) => step.finishLine)).size, path.length);
assert.equal(new Set(path.map((step) => step.exercises.map((exercise) => exercise.title).join("|"))).size, path.length);
for (const step of path) {
  assert.ok(step.workingRead.length > 30);
  assert.equal(step.exercises.length, 3);
  assert.ok(step.exercises.every((exercise) => exercise.action.length > 30));
  assert.ok(step.exercises.every((exercise) => exercise.output.length > 5));
  assert.ok(step.finishLine.length > 20);
  assert.match(step.lesson.href, /^\/bellows\/library\//);
  assert.equal(Object.isFrozen(step), true);
  assert.equal(Object.isFrozen(step.exercises), true);
}

assert.match(path[0].workingRead, /decision/i);
assert.match(path[1].workingRead, /evidence brief/i);
assert.match(path[2].workingRead, /equipment requirement/i);

const rendered = JSON.stringify(path);
assert.doesNotMatch(rendered, new RegExp(rawGoal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
assert.doesNotMatch(rendered, new RegExp(rawBlocker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

const personalSurface = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");
assert.match(personalSurface, /A lesson is not the finish line/);
assert.match(personalSurface, /Use It in My Workshop/);
assert.match(personalSurface, /Compare My Matches/);
assert.match(personalSurface, /Update My Situation/);

console.log("Personal Bellows useful learning path: PASS");
