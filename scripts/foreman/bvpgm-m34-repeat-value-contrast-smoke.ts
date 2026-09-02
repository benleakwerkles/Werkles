import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  MATCH_REVIEW_SHELF_DEVICE_KEY,
  MATCH_REVIEW_SHELF_LIMIT,
  matchReviewShelfFrom,
  toggleMatchReviewShelf
} from "../../lib/ghost-fleet/match-review-shelf";

const root = path.resolve(import.meta.dirname, "../..");
const component = fs.readFileSync(
  path.join(root, "components/ghost-fleet/ghost-member-interaction-lab.tsx"),
  "utf8"
);
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");

assert.equal(MATCH_REVIEW_SHELF_DEVICE_KEY, "werkles:match-deck:review-shelf:v1");
assert.equal(MATCH_REVIEW_SHELF_LIMIT, 3);
assert.deepEqual(matchReviewShelfFrom(null, ["a"]), []);
assert.deepEqual(matchReviewShelfFrom({ a: true }, ["a"]), []);
assert.deepEqual(matchReviewShelfFrom(["a", "a", "x", 4, "b", "c", "d"], ["a", "b", "c", "d"]), ["a", "b", "c"]);
assert.deepEqual(toggleMatchReviewShelf(["a", "b"], "a"), ["b"]);
assert.deepEqual(toggleMatchReviewShelf(["a", "b", "c"], "d"), ["b", "c", "d"]);

assert.match(component, /Save for Comparison/);
assert.match(component, /device-only working list/);
assert.match(component, /does not change Werkles[\s\S]{0,80}order, notify anyone, or become an introduction/);
assert.match(component, /matchReviewShelfFrom\(raw \? JSON\.parse\(raw\) : \[\]/);
assert.doesNotMatch(component, /fetch\([^)]*MATCH_REVIEW_SHELF_DEVICE_KEY/);

assert.match(css, /\.bellows-plan-check-in__heading > p,[\s\S]*color: #fff8e9 !important/);
assert.match(css, /\.crucible-tech-journey__roadmap li p,[\s\S]*color: #efe4d1 !important/);
assert.match(css, /\.ghost-member-lab__comparison p,[\s\S]*color: #fff8e9 !important/);
assert.match(css, /\.crucible-tech-journey__stages > li > details > summary p,[\s\S]*color: #efe4d1 !important/);
assert.match(css, /\.ghost-member-lab__review-shelf \{[\s\S]*background: linear-gradient/);
assert.match(css, /\.ghost-member-lab__review-shelf-grid \{[\s\S]*repeat\(3/);

console.log("BVPGM M34 repeat-value and contrast smoke: PASS");
