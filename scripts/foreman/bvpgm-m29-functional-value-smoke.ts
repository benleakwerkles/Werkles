import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createPersonalPlanCheckIn,
  PERSONAL_PLAN_CHECK_IN_CHOICES,
  PERSONAL_PLAN_CHECK_IN_DESTINATIONS,
  storedPersonalPlanCheckInFrom
} from "../../lib/bellows/personal-plan-check-in";

const stored = createPersonalPlanCheckIn(
  "need_person",
  "A real operating partner is now part of the answer.",
  "2026-08-24T12:00:00.000Z"
);
assert.equal(storedPersonalPlanCheckInFrom(JSON.parse(JSON.stringify(stored)))?.choice, "need_person");
assert.equal(PERSONAL_PLAN_CHECK_IN_DESTINATIONS.need_person.href, "/dashboard/intros");
assert.equal(PERSONAL_PLAN_CHECK_IN_DESTINATIONS.need_check.href, "/dashboard/crucible");
assert.equal(new Set(PERSONAL_PLAN_CHECK_IN_CHOICES).size, 4);
assert.equal(storedPersonalPlanCheckInFrom({ ...stored, version: 2 }), null);
assert.equal(storedPersonalPlanCheckInFrom({ ...stored, choice: "watched_clicks" }), null);
assert.equal(storedPersonalPlanCheckInFrom({ ...stored, note: "x".repeat(801) }), null);

const checkIn = readFileSync("components/bellows/personal-plan-check-in.tsx", "utf8");
assert.match(checkIn, /Werkles does not watch your clicks or infer progress/);
assert.match(checkIn, /Nothing was sent or used to change your matches/);
assert.match(checkIn, /Save This Check-In/);

const matchDeck = readFileSync("components/ghost-fleet/ghost-member-interaction-lab.tsx", "utf8");
assert.match(matchDeck, /Why the strongest three are different/);
assert.match(matchDeck, /There is no compatibility percentage/);
assert.match(matchDeck, /Still unknown/);
assert.match(matchDeck, /comparisonMembers = availableMembers\.slice\(0, 3\)/);

const styles = readFileSync("app/globals.css", "utf8");
assert.match(styles, /\.ghost-member-lab__comparison-grid/);
assert.match(styles, /\.bellows-plan-check-in__choices/);
assert.match(styles, /\.recview__location-note[\s\S]*color: #fffaf1 !important/);

console.log("PASS BVPGM M29 functional value: device check-in, match comparison, and location contrast");
