import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { rankGhostsForSignals } from "../../lib/ghost-fleet/match.ts";
import { ghostProximityFor, parseGhostSeekerLocation } from "../../lib/ghost-fleet/proximity.ts";
import { signalsFromConcierge } from "../../lib/matching/signals.ts";
import { EMPTY_INTAKE_ANSWERS } from "../../lib/squibb/concierge-intake-v0.ts";
import type { GhostMember, GhostLane } from "../../lib/ghost-fleet/types.ts";

function ghost(id: string, city: string, region: string, lane: GhostLane = "Builder"): GhostMember {
  return {
    id, synthetic: true, displayName: id, city, region, lane, roleLabel: `${lane} fixture`,
    skills: [], offers: [], seeks: [], capitalPosture: "not_qualified", openToPartner: true,
    statedNeed: "Shared launch planning", alreadyTried: "", timeCost: "", stuckDecision: "Shared launch planning",
    successTwelveMonths: "", proofGaps: [], workshopHeadline: "", workshopRows: [], introEligibility: "open",
    handeyeSeat: "Bean", faceAsset: "", faceStatus: "placeholder"
  };
}

const local = parseGhostSeekerLocation({ city: "Cleveland", state: "oh", workPreference: "Local Only" });
assert.deepEqual(local, { city: "Cleveland", state: "OH", workPreference: "Local Only" });
assert.equal(ghostProximityFor(local, { city: "Cleveland", state: "OH" }).band, "same_city");
assert.equal(ghostProximityFor(local, { city: "Columbus", state: "OH" }).band, "same_state");
assert.equal(ghostProximityFor(local, { city: "Pittsburgh", state: "PA" }).band, "neighboring_state");
assert.equal(ghostProximityFor(local, { city: "Birmingham", state: "AL" }).band, "farther_away");
assert.equal(parseGhostSeekerLocation({ city: "Cleveland", state: "Ohio", workPreference: "Local Only" }), null);
assert.equal(parseGhostSeekerLocation({ city: "Cleveland", state: "OH", workPreference: "Nearby-ish" }), null);

const partnerSignals = signalsFromConcierge("location-fixture", {
  ...EMPTY_INTAKE_ANSWERS,
  heaviest_lift: "I need a partner to help launch this work.",
  stuck_decision: "Which partner should help launch it?"
});
const fleet = [
  ghost("birmingham", "Birmingham", "AL", "Connector"),
  ghost("cleveland", "Cleveland", "OH", "Builder"),
  ghost("columbus", "Columbus", "OH", "Operator"),
  ghost("pittsburgh", "Pittsburgh", "PA", "Backer")
];
const rankedLocal = rankGhostsForSignals(partnerSignals, fleet, 4, local);
assert.deepEqual(rankedLocal.candidates.map((item) => item.ghostId), ["cleveland", "columbus", "pittsburgh", "birmingham"]);
assert.deepEqual(rankedLocal.candidates.map((item) => item.proximity.band), ["same_city", "same_state", "neighboring_state", "farther_away"]);

const remote = parseGhostSeekerLocation({ city: "Cleveland", state: "OH", workPreference: "Remote Only" });
const rankedRemote = rankGhostsForSignals(partnerSignals, fleet, 4, remote);
assert.equal(rankedRemote.candidates[0].ghostId, "birmingham", "remote ranking must not invent a location preference");

const strongerFar = {
  ...ghost("strong-far", "Birmingham", "AL", "Connector"),
  offers: ["Help launch"],
  skills: ["Launch help"]
};
const weakNear = ghost("weak-near", "Cleveland", "OH", "Builder");
const fitFirst = rankGhostsForSignals(partnerSignals, [weakNear, strongerFar], 2, local);
assert.equal(fitFirst.candidates[0].ghostId, "strong-far", "materially stronger fit must outrank proximity");
assert.ok(fitFirst.candidates[0].score > fitFirst.candidates[1].score);

const unsupportedSignals = signalsFromConcierge("no-fit", { ...EMPTY_INTAKE_ANSWERS, heaviest_lift: "" });
assert.equal(rankGhostsForSignals(unsupportedSignals, [ghost("nearby", "Cleveland", "OH")], 3, local).candidates.length, 0);

async function verifyIntegration() {
  const api = await readFile("app/api/ghost-fleet/intros/current/route.ts", "utf8");
  const localApi = await readFile("app/api/ghost-fleet/intros/preference/route.ts", "utf8");
  const localStorage = await readFile("lib/ghost-fleet/preference-storage.ts", "utf8");
  const client = await readFile("components/ghost-fleet/account-aware-ghost-member-lab.tsx", "utf8");
  assert.match(api, /requireUser\(request\)/);
  assert.match(api, /readLatestMemberIntake\(auth\.supabase, auth\.user\.id\)/);
  assert.match(api, /\.select\("location_city,location_state,work_preference"\)/);
  assert.doesNotMatch(api, /service|SUPABASE_SERVICE|process\.env/);
  assert.match(client, /getClientAccessToken\(\)/);
  assert.match(client, /\/api\/ghost-fleet\/intros\/current/);
  assert.match(client, /Add it to my profile/);
  assert.match(client, /How close should these people be\?/);
  assert.match(client, /you do not need to redo Intake/);
  assert.match(localApi, /readBellowsOwnerIdFromCookies\(\)/);
  assert.match(localApi, /isLocalRoutePreviewUnlocked\(\)/);
  assert.match(localApi, /storeGhostLocationPreference\(ownerId, body\)/);
  assert.doesNotMatch(localApi, /error instanceof Error \? error\.message/);
  assert.match(localStorage, /isValidBellowsOwnerId\(ownerId\)/);
  assert.doesNotMatch(localStorage, /localStorage|sessionStorage|service|process\.env/);
}

verifyIntegration()
  .then(() => console.log("Ghost location-aware ranking contract: PASS"))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
