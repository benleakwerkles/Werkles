import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/dashboard/crucible/page.tsx", "utf8");
const panel = fs.readFileSync("components/crucible/crucible-panel.tsx", "utf8");
const card = fs.readFileSync("components/crucible/verification-card.tsx", "utf8");
const copy = fs.readFileSync("lib/copy.ts", "utf8");

assert.match(page, /showGhostPractice=\{fleetOn\}/);
assert.doesNotMatch(page, /walkthroughReadOnly=\{fleetOn\}/);
assert.match(panel, /getClientAccessToken/);
assert.match(panel, /token !== "dev-preview-token"/);
assert.match(panel, /providerAccess !== "connected"/);
assert.match(panel, /showGhostPractice \? <GhostProviderWalkthrough \/> : null/);
assert.doesNotMatch(panel, /Ghost Fleet walkthrough is read-only/);
assert.doesNotMatch(panel, /<InfraPreviewBanner/);
assert.doesNotMatch(panel, /copy\.crucible\.workflowStates\.map/);
assert.doesNotMatch(panel, /copy\.uiPass\.draftBadge/);
assert.match(card, /Connected test account required/);
assert.doesNotMatch(copy, /Proof and Crucible surfaces are preview placeholders/);

console.log("Crucible signed-member/provider-practice boundary: PASS");
