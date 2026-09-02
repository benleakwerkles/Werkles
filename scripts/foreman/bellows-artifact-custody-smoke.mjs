import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const assumption = fs.readFileSync(path.join(root, "components/bellows/assumption-test-card.tsx"), "utf8");
const evidence = fs.readFileSync(path.join(root, "components/bellows/evidence-brief-builder.tsx"), "utf8");

for (const source of [assumption, evidence]) {
  assert.match(source, /Save on This Device/);
  assert.match(source, /localStorage\.getItem/);
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /localStorage\.removeItem/);
  assert.match(source, /not account-saved or shared/);
  assert.match(source, /Object\.keys\(/);
  assert.match(source, /MAX_TEXT = 600/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /sessionStorage/);
}

assert.match(assumption, /Clear Device Test/);
assert.match(assumption, /restoredValues/);
assert.match(evidence, /restoredBrief/);
assert.match(evidence, /topKeys = \["values", "freshness", "contradiction", "professionalReview"\]/);
assert.match(evidence, /The saved device brief was invalid and was not restored/);

console.log("PASS Bellows artifact device-custody normalization contract");
