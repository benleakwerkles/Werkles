import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const intake = readFileSync(resolve(root, "components/squibb/concierge-intake-form.tsx"), "utf8");
const workshop = readFileSync(resolve(root, "app/dashboard/blueprints/page.tsx"), "utf8");
const intakeCss = readFileSync(resolve(root, "app/bellows/intake/concierge-intake.css"), "utf8");
const globalCss = readFileSync(resolve(root, "app/globals.css"), "utf8");

for (const path of [
  "public/assets/draft/people-v1/people-spark-idea-moment.jpg",
  "public/assets/draft/people-v1/people-stepladder-lamp.jpg"
]) {
  assert.equal(existsSync(resolve(root, path)), true, `Missing visual rhythm asset: ${path}`);
}

assert.match(intake, /concierge-intake__breather/);
assert.match(intake, /Different problems need different answers\./);
assert.match(intake, /People, tools, money, and places are not interchangeable\./);
assert.match(workshop, /workshop-human-break/);
assert.match(workshop, /Plans become places, products, and shared work\./);
assert.doesNotMatch(`${intake}\n${workshop}`, /perfect match|guaranteed outcome|dream office/i);
assert.match(intakeCss, /\.concierge-intake__breather img[\s\S]*?object-fit: cover/);
assert.match(globalCss, /\.workshop-human-break img[\s\S]*?object-fit: cover/);

console.log("PASS: long Intake and Workshop text runs have responsive, non-promissory visual breathers.");
