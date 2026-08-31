import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  personalBellowsProgressFrom,
  updatePersonalBellowsProgress
} from "../../lib/bellows/personal-progress";

const memberSources = [
  "lib/copy.ts",
  "app/signup/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/dashboard/member-dashboard-client.tsx",
  "app/spark/page.tsx",
  "app/bellows/recommendations/test-case-0/page.tsx",
  "app/api/bellows/intake/route.ts",
  "app/api/ghost-fleet/intros/route.ts"
].map((path) => readFileSync(path, "utf8")).join("\n");

assert.doesNotMatch(
  memberSources,
  /browser walkthrough|concierge intake|Ghost Match Deck|Dues buy runway|Full lessons are on the way|anti-guru operator|Check the runway|inspect runway/i
);
assert.match(memberSources, /Continue to Werkles/);
assert.match(memberSources, /Practice Match Deck and Werkle formation/);
assert.match(memberSources, /Browse every lesson or start with the shorter path/);

const empty = personalBellowsProgressFrom(null);
const completed = updatePersonalBellowsProgress(empty, "proof-before-reliance", true);
assert.deepEqual(completed.completedLessonSlugs, ["proof-before-reliance"]);
assert.deepEqual(updatePersonalBellowsProgress(completed, "proof-before-reliance", false).completedLessonSlugs, []);
assert.deepEqual(personalBellowsProgressFrom({ version: 1, completedLessonSlugs: ["../../other"] }).completedLessonSlugs, []);
assert.deepEqual(
  personalBellowsProgressFrom(JSON.parse(JSON.stringify(completed))).completedLessonSlugs,
  ["proof-before-reliance"]
);

const personalPage = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");
const progressControl = readFileSync("components/bellows/personal-lesson-progress.tsx", "utf8");
assert.match(personalPage, /Completed on this device/);
assert.match(personalPage, /Review This Step/);
assert.match(personalPage, /Continue This Lesson/);
assert.match(personalPage, /first lesson in your current path that is not marked complete on this device/);
assert.match(progressControl, /Mark this step complete/);
assert.match(progressControl, /does not share your work/);

const workshopPage = readFileSync("app/dashboard/blueprints/page.tsx", "utf8");
assert.match(workshopPage, /Leave this room with a clear next door/);
assert.match(workshopPage, /Compare My Next Moves/);
assert.match(workshopPage, /Open Match Deck/);
assert.match(workshopPage, /Return to Member Home/);

console.log("Member language and revisitable Bellows progress: PASS");
