import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = fs.readFileSync(path.join(root, "components/bellows/constraint-map-card.tsx"), "utf8");
const lessonContent = fs.readFileSync(path.join(root, "components/bellows/bellows-lesson-content.tsx"), "utf8");

assert.match(lessonContent, /lesson\.slug === "pitch-is-not-the-plan"/);
assert.match(lessonContent, /<ConstraintMapCard \/>/);
assert.match(component, /Name the stop\. Keep three causes alive/);
assert.match(component, /A cause is an explanation to test—not/);
assert.match(component, /causes: \[blankCause\(\), blankCause\(\), blankCause\(\)\]/);
assert.match(component, /Evidence for it/);
assert.match(component, /Evidence against it/);
assert.match(component, /Cheapest honest check/);
assert.match(component, /Do not crown a winner from this worksheet/);
assert.match(component, /Save on This Device/);
assert.match(component, /not account-saved or shared/);
assert.match(component, /localStorage\.setItem/);
assert.match(component, /localStorage\.getItem/);
assert.match(component, /localStorage\.removeItem/);
assert.doesNotMatch(component, /\bfetch\s*\(/);

console.log("PASS Constraint Map Bellows source and custody contract");
