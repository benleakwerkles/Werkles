import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = fs.readFileSync(path.join(root, "components/bellows/company-starter-floor-board.tsx"), "utf8");
const lessonContent = fs.readFileSync(path.join(root, "components/bellows/bellows-lesson-content.tsx"), "utf8");

assert.match(lessonContent, /lesson\.slug === "company-starter-floor"/);
assert.match(lessonContent, /<CompanyStarterFloorBoard \/>/);
assert.equal((component.match(/Object\.freeze\(\{ id:/g) ?? []).length, 6);
assert.match(component, /LLC and S corporation answer different questions/);
assert.match(component, /formed under state law/);
assert.match(component, /federal tax election/);
assert.match(component, /sba\.gov\/business-guide\/launch-your-business\/choose-business-structure/);
assert.match(component, /irs\.gov\/faqs\/small-business-self-employed-other-business\/entities\/entities-3/);
assert.match(component, /irs\.gov\/businesses\/small-businesses-self-employed\/s-corporations/);
assert.match(component, /Save on This Device/);
assert.match(component, /not account-saved or shared/);
assert.match(component, /localStorage\.setItem/);
assert.match(component, /localStorage\.getItem/);
assert.match(component, /localStorage\.removeItem/);
assert.doesNotMatch(component, /\bfetch\s*\(/);
assert.doesNotMatch(component, /sessionStorage/);

console.log("PASS Company Starter Floor source and custody contract");
