import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const library = readFileSync("lib/bellows/operator-library.ts", "utf8");
const paths = readFileSync("lib/squibb/recommendation-solution-path.ts", "utf8");
const component = readFileSync("components/bellows/supplier-comparison-card.tsx", "utf8");
const lessonContent = readFileSync("components/bellows/bellows-lesson-content.tsx", "utf8");
const css = readFileSync("app/bellows/library/bellows-library.css", "utf8");

assert.match(library, /slug: "supplier-comparison"/);
assert.match(library, /first-year cost/);
assert.match(library, /Werkles compensation or sponsorship is hidden/);
assert.match(library, /Scams and Your Small Business/);
assert.match(paths, /find_equipment:[\s\S]*href: "\/bellows\/library\/supplier-comparison"/);
assert.match(component, /money\(row\.monthly\) \* 12/);
assert.match(component, /A zero means not entered—not free/);
assert.match(component, /Save on This Device/);
assert.match(component, /Saved on this device\. It is not account-saved or shared/);
assert.match(component, /Clear Device Draft/);
assert.match(component, /Still check: exact scope, exclusions, condition, warranty/);
assert.match(component, /localStorage\.setItem\(STORAGE_KEY/);
assert.match(component, /localStorage\.getItem\(STORAGE_KEY/);
assert.match(component, /savedComparison/);
assert.match(component, /Object\.keys\(record\)\.length !== 2/);
assert.match(component, /Object\.keys\(record\)\.length !== fields\.length/);
assert.match(component, /MAX_REQUIREMENT = 500/);
assert.match(component, /MAX_NAME = 160/);
assert.match(component, /MAX_NUMBER = 40/);
assert.match(component, /invalid and was not restored/);
assert.doesNotMatch(component, /fetch\(|sessionStorage/);
assert.match(lessonContent, /lesson\.slug === "supplier-comparison" \? <SupplierComparisonCard \/>/);
assert.match(css, /\.supplier-comparison__grid/);
assert.match(css, /@media \(max-width: 820px\)/);

console.log("Supplier Comparison Bellows contract: PASS");
