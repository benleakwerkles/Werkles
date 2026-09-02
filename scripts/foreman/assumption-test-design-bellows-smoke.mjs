import assert from "node:assert/strict";
import fs from "node:fs";

const library = fs.readFileSync("lib/bellows/operator-library.ts", "utf8");
const page = fs.readFileSync("app/bellows/library/page.tsx", "utf8");
const lessonContent = fs.readFileSync("components/bellows/bellows-lesson-content.tsx", "utf8");
const card = fs.readFileSync("components/bellows/assumption-test-card.tsx", "utf8");
const paths = fs.readFileSync("lib/squibb/recommendation-solution-path.ts", "utf8");

assert.match(library, /slug: "assumption-test-design"/);
assert.match(library, /pass, pause, or stop rule/i);
assert.match(library, /does not guarantee demand, price, margin, delivery, safety, legality, financing, or future success/i);
assert.match(library, /Market research and competitive analysis/);
assert.match(page, /\{bellowsLessons\.length\} lessons/);
assert.doesNotMatch(page, /Four lessons|Four doors|Four short lessons/);
assert.match(lessonContent, /isAssumptionLesson/);
assert.match(lessonContent, /Worked example/);
assert.match(lessonContent, /Hostile example/);
assert.match(lessonContent, /<AssumptionTestCard \/>/);

for (const label of [
  "Decision this test should change",
  "Riskiest assumption",
  "Why it could be wrong",
  "Who or what can challenge it",
  "Smallest honest test",
  "Pass, revise, or stop rule",
  "Deadline and cost cap",
  "What a pass still will not prove"
]) assert.match(card, new RegExp(label));

assert.match(card, /Nothing is saved or sent from this public tool/);
assert.match(card, /Save on This Device/);
assert.match(card, /Copy the Test Card/);
assert.match(card, /Clear Device Test/);
assert.match(card, /restoredValues/);
assert.match(card, /localStorage\.getItem/);
assert.match(card, /localStorage\.setItem/);
assert.match(card, /localStorage\.removeItem/);
assert.doesNotMatch(card, /sessionStorage|fetch\(|verified|guaranteed result/i);
assert.match(paths, /\/bellows\/library\/assumption-test-design/);

console.log("Assumption Test Design Bellows contract: PASS");
