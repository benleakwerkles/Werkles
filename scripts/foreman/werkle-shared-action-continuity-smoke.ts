import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createWerkleFirstSharedAction,
  isWerkleFirstSharedActionCurrent,
  werkleFirstSharedActionFrom
} from "../../lib/werkle/first-shared-action.ts";

const step = Object.freeze({ topicId: "purpose" as const, label: "Purpose", text: "Test one repair offer together.", sourceTrail: Object.freeze(["Your Workshop", "Their Workshop"]), revision: 2 });
const action = createWerkleFirstSharedAction("formation-1", step, {
  action: "Call five repair customers and record the jobs they decline.",
  volunteer: "Ben",
  checkIn: "2026-09-01",
  doneWhen: "Five conversations are logged with a clear yes, no, or reason."
}, "2026-08-22T20:00:00.000Z");

assert.equal(werkleFirstSharedActionFrom(JSON.parse(JSON.stringify(action)))?.formationId, "formation-1");
assert.equal(isWerkleFirstSharedActionCurrent(action, "formation-1", step), true);
assert.equal(isWerkleFirstSharedActionCurrent(action, "formation-1", { ...step, revision: 3 }), false);
assert.equal(werkleFirstSharedActionFrom({ ...action, unexpected: true }), null);
assert.equal(werkleFirstSharedActionFrom({ ...action, checkIn: "2026-02-30" }), null);

const workbench = readFileSync("components/werkle/formation-workbench.tsx", "utf8");
const arrival = readFileSync("components/werkle/formation-arrival-context.tsx", "utf8");
const planner = readFileSync("components/werkle/first-shared-action-planner.tsx", "utf8");
const crucibleContext = readFileSync("components/crucible/match-check-context.tsx", "utf8");
const bellows = readFileSync("components/bellows/bellows-device-draft-shelf.tsx", "utf8");
const workshop = readFileSync("components/workshop/ghost-werkle-preview.tsx", "utf8");
const crucible = readFileSync("components/crucible/match-check-context.tsx", "utf8");
assert.match(workbench, /FormationArrivalContext/);
assert.match(workbench, /FirstSharedActionPlanner/);
assert.match(arrival, /parsed\?\.profileId === partnerId/);
assert.match(arrival, /does not enter the shared Werkle unless both sides later accept exact wording/);
assert.match(planner, /not an assignment or agreement/);
assert.doesNotMatch(planner, /fetch\(|supabase|\/api\//i);
assert.match(bellows, /Review This Shared Action/);
assert.match(workshop, /formation\?candidate=\$\{encodeURIComponent\(context\.profileId\)\}/);
assert.match(crucibleContext, /storedWerkleOperatingBriefFrom/);
assert.match(crucibleContext, /isWerkleFirstSharedActionCurrent\(parsedAction, storedBrief\.brief\.formationId, currentStep\)/, "Crucible must not present a shared action after its accepted Formation source disappears or changes");
assert.match(planner, /Choose a Narrow Outside Check/);
assert.match(crucible, /WERKLE_FIRST_SHARED_ACTION_KEY/);
assert.match(crucible, /Check only what could change this plan/);
assert.match(crucible, /Provider checks should answer one necessary claim—not grade the person or the partnership/);

console.log("Werkle shared-action continuity: PASS");
