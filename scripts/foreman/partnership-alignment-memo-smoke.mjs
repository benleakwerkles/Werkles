import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = fs.readFileSync(path.join(root, "components/bellows/partnership-alignment-memo.tsx"), "utf8");
const lessonContent = fs.readFileSync(path.join(root, "components/bellows/bellows-lesson-content.tsx"), "utf8");
const library = fs.readFileSync(path.join(root, "lib/bellows/operator-library.ts"), "utf8");

assert.match(library, /export const partnershipAlignmentTopics = \[/);
const topicBlock = library.match(/export const partnershipAlignmentTopics = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
assert.equal((topicBlock.match(/^  \["/gm) ?? []).length, 10, "expected the ten canonical topic tuples");
assert.match(lessonContent, /lesson\.slug === "partnership-alignment"/);
assert.match(lessonContent, /<PartnershipAlignmentMemo \/>/);
assert.match(component, /partnershipAlignmentTopics\.map/);
assert.match(component, /werkles:bellows:partnership-alignment:v1/);
assert.match(component, /localStorage\.setItem/);
assert.match(component, /localStorage\.getItem/);
assert.match(component, /localStorage\.removeItem/);
assert.match(component, /Save on This Device/);
assert.match(component, /Copy Preparation Memo/);
assert.match(component, /not an agreement/i);
assert.match(component, /not account-saved or shared/i);
assert.doesNotMatch(component, /\bfetch\s*\(/);
assert.doesNotMatch(component, /sessionStorage/);

console.log("PASS partnership alignment memo source contract");
