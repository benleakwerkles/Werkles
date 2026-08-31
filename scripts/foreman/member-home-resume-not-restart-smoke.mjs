import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/dashboard/page.tsx", "utf8");
const client = fs.readFileSync("app/dashboard/member-dashboard-client.tsx", "utf8");

for (const marker of ["loadOwnerSurfaceState", "readBellowsOwnerIdFromCookies", "initialHasIntake={ownerState.hasIntake}"]) assert.ok(page.includes(marker), marker);
for (const marker of ["Your Intake is here. Keep moving.", "Open Recommendations", "Open My Bellows", "Open Match Deck", "Review Intake", "Start with one real piece of work."]) assert.ok(client.includes(marker), marker);
for (const marker of ["WERKLE_OPERATING_BRIEF_DEVICE_KEY", "storedWerkleOperatingBriefFrom", "firstSharedStepFromOperatingBrief", "Continue This Werkle", "Saved on this device, not to your Werkles account", "people-partners-clipboard.png"]) assert.ok(client.includes(marker), marker);
assert.ok(!client.includes("Saved Intake, Workshop, and Recommendations"));
for (const stale of ["demo + saved intake", "concierge walkthrough", "Secondary: what Werkles is", "Walk through an example"]) assert.ok(!client.includes(stale), stale);

const membership = fs.readFileSync("app/membership/page.tsx", "utf8");
assert.match(membership, /href="\/dashboard\/blueprints"[\s\S]*Visit the member Workshop/);

console.log("Member home resume-not-restart source contract: PASS");
