import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const visualPause = read("components/bellows/bellows-visual-pause.tsx");
const lessonContent = read("components/bellows/bellows-lesson-content.tsx");
const publicBellows = read("app/bellows/library/page.tsx");
const personalBellows = read("app/bellows/personal/page.tsx");
const bellowsLanding = read("app/bellows/page.tsx");
const formation = read("components/werkle/formation-workbench.tsx");

for (const asset of [
  "public/assets/draft/people-v1/people-partners-cafe.png",
  "public/assets/draft/industry-breadth/werkles-space-just-leased.png",
  "public/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d03-tool-at-rest.png"
]) {
  assert.ok(existsSync(asset), `Missing visual-pause asset: ${asset}`);
}

assert.match(visualPause, /"people" \| "workspace" \| "tools"/);
assert.match(visualPause, /Good tools reduce effort\. They do not add another assignment\./);
assert.equal((publicBellows.match(/<BellowsVisualPause/g) ?? []).length, 2);
assert.match(personalBellows, /<BellowsVisualPause variant="workspace" \/>/);
assert.match(lessonContent, /<BellowsVisualPause variant=\{visualVariant\} \/>/);

const memberCopy = [publicBellows, personalBellows, bellowsLanding, formation].join("\n");
assert.doesNotMatch(
  memberCopy,
  /operator library|concierge intake|recommendation types|After Foundry|proof act|operator math|guru fog|practice records|generated practice answer/i
);
assert.match(memberCopy, /Browse the Public Bellows/);
assert.match(memberCopy, /You answer for you/);
assert.match(memberCopy, /Comes from:/);

console.log("Bellows human rhythm and plain-language boundary: PASS");
