import assert from "node:assert/strict";
import fs from "node:fs";

const library = fs.readFileSync("lib/bellows/operator-library.ts", "utf8");
const route = fs.readFileSync("app/bellows/library/[slug]/page.tsx", "utf8");
const lessonContent = fs.readFileSync("components/bellows/bellows-lesson-content.tsx", "utf8");
const builder = fs.readFileSync("components/bellows/evidence-brief-builder.tsx", "utf8");
const solutions = fs.readFileSync("lib/squibb/recommendation-solution-path.ts", "utf8");

for (const slug of ["pitch-is-not-the-plan", "company-starter-floor", "proof-before-reliance", "partnership-alignment", "assumption-test-design", "supplier-comparison"]) {
  assert.match(library, new RegExp(`slug: "${slug}"`));
  assert.match(solutions, new RegExp(`/bellows/library/${slug}`));
}

assert.doesNotMatch(solutions, /\/bellows\/library#/);
assert.match(route, /generateStaticParams/);
assert.match(route, /notFound\(\)/);
assert.match(route, /<BellowsLessonContent/);
assert.match(lessonContent, /Worked example/);
assert.match(lessonContent, /Hostile example/);

for (const boundary of [
  "Exact claim",
  "Why the claim matters",
  "Sources and dates",
  "Directly supported",
  "Inference—not yet established",
  "Contradiction or unresolved gap",
  "What would change confidence",
  "Next bounded check or Human Gate"
]) {
  assert.match(builder, new RegExp(boundary));
}

assert.match(builder, /Unknown \/ not filled yet/);
assert.match(builder, /not saved to your Werkles account or shared/i);
assert.match(builder, /window\.localStorage/);
assert.doesNotMatch(builder, /window\.sessionStorage/);
assert.match(builder, /Save on This Device/);
assert.match(builder, /Werkles bridge/);
assert.doesNotMatch(builder, /verified badge|professional conclusion|confidence percentage/i);

console.log("Bellows lesson route and Evidence Brief contract: PASS");
