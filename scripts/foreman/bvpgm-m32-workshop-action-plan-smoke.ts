import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createWorkshopActionPlan,
  workshopActionPlanDigest,
  workshopActionPlanFrom
} from "../../lib/workshop/action-plan-device";

const input = {
  nextOutcome: "Five customers finish the same core job without coaching.",
  firstTest: "Run five uncoached sessions with one product and one audience.",
  resultRule: "Continue if four finish; revise if the same failure repeats twice; stop if nobody reaches the core result.",
  owner: "Ben",
  reviewDate: "2026-09-01",
  contextNote: "The plan still fits: first product test is ready."
};
const saved = createWorkshopActionPlan(input, "2026-08-24T12:00:00.000Z");
assert.deepEqual(workshopActionPlanFrom(JSON.parse(JSON.stringify(saved))), saved);
assert.equal(workshopActionPlanFrom({ ...saved, version: 2 }), null);
assert.equal(workshopActionPlanFrom({ ...saved, nextOutcome: "" }), null);
assert.equal(workshopActionPlanFrom({ ...saved, owner: "x".repeat(121) }), null);
assert.equal(workshopActionPlanFrom({ ...saved, reviewDate: "tomorrow" }), null);
const digest = workshopActionPlanDigest(saved);
for (const marker of ["Target outcome", "Immediate test", "Result that counts", "Owner", "Review date", "Not an agreement"]) {
  assert.match(digest, new RegExp(marker));
}

const component = readFileSync("components/workshop/workshop-action-board.tsx", "utf8");
assert.match(component, /Use This as Context/);
assert.match(component, /fills only the context field/);
assert.match(component, /Nothing was shared or added to your account/);
assert.match(component, /Action Plan Digest/);
assert.doesNotMatch(component, /fetch\(|getSupabase|\/api\//);

const page = readFileSync("app/dashboard/blueprints/page.tsx", "utf8");
assert.ok(page.indexOf("<WorkshopActionBoard />") < page.indexOf('<div id="current-workshop">'));
assert.match(page, /people-stepladder-lamp\.jpg[\s\S]*priority/);

const css = readFileSync("app/globals.css", "utf8");
assert.match(css, /\.workshop-action-board h2,[\s\S]*color: #fff8e9 !important/);
assert.match(css, /\.workshop-formation \.workshop-section-heading h2[\s\S]*color: #241d18 !important/);
assert.match(css, /\.workshop-wayfinding h2,[\s\S]*color: #fff8e9 !important/);

console.log("PASS BVPGM M32 Workshop Action Plan: validated device artifact, deliberate Bellows context, digest, function-first placement, contrast boundaries, and eager human image");
