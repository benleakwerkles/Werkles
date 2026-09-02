import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const component = readFileSync(resolve(root, "components/ghost-fleet/account-aware-intros-readout.tsx"), "utf8");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
const asset = resolve(root, "public/assets/draft/people-v1/people-shared-possibility-v1.png");

assert.equal(existsSync(asset), true, "The Intros grounding image must exist in the project.");
assert.ok(statSync(asset).size > 100_000, "The Intros grounding image must not be an empty placeholder.");
assert.match(component, /className="recview__possibility"/);
assert.match(component, /A shortlist is a beginning, not a verdict\./);
assert.match(component, /Look for the person who helps you see—and build—the next part differently\./);
assert.match(component, /alt="Two people considering materials and possibilities in a shared workshop and kitchen"/);
assert.doesNotMatch(component, /dream office|stock photo|perfect match|ideal partner/i);
assert.match(css, /\.recview__possibility img[\s\S]*?object-fit: cover/);
assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.recview__possibility/);

console.log("PASS: Intros uses a responsive, human-grounding visual without making a match promise.");
