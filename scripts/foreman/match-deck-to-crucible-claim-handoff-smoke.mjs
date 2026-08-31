import assert from "node:assert/strict";
import fs from "node:fs";

const deck = fs.readFileSync("components/ghost-fleet/ghost-member-interaction-lab.tsx", "utf8");
const context = fs.readFileSync("components/crucible/match-check-context.tsx", "utf8");
const page = fs.readFileSync("app/dashboard/crucible/page.tsx", "utf8");
const panel = fs.readFileSync("components/crucible/crucible-panel.tsx", "utf8");

for (const marker of ["Decide What Needs Checking", "/dashboard/crucible#match-check-context", "/bellows/personal/partnership-alignment"]) assert.ok(deck.includes(marker), marker);
for (const marker of ["partnershipPreparationContextFrom", "What would you actually need to know about", "Ask directly first.", "Use one narrow check only if needed.", "A completed check never proves broad trust", "Nothing is saved or sent."]) assert.ok(context.includes(marker), marker);
assert.ok(!context.includes("fetch("));
assert.ok(!context.includes("localStorage.setItem"));
assert.match(panel, /<MatchCheckContext showEmpty=\{showGhostPractice\} \/>/);
assert.doesNotMatch(page, /ghosts\.map/);

console.log("Match Deck → Crucible claim-first handoff source contract: PASS");
