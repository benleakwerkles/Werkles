import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildGhostFleetPlayableLoopBridge,
  GHOST_FLEET_INTROS_ROUTE,
  GHOST_FLEET_WORKSHOP_ROUTE
} from "../../lib/ghost-fleet/playable-loop.ts";
import type { GhostMatchCandidate, GhostMatchResult } from "../../lib/ghost-fleet/types.ts";

const candidate = (eligibility: GhostMatchCandidate["eligibility"]): GhostMatchCandidate => ({
  ghostId: "ghost-secret",
  displayName: "Synthetic Secret",
  lane: "Builder",
  city: "Nowhere",
  region: "NA",
  score: 71,
  rank: 1,
  orderReason: "Strongest current fit from the information you submitted.",
  reasons: [{ label: "Complement", detail: "Fixture only", points: 5 }],
  blockers: [],
  eligibility,
  faceAsset: "/fixture.svg",
  faceStatus: "placeholder",
  synthetic: true,
  proximity: Object.freeze({ band: "unknown", label: "Location preference not on file" })
});

const result: GhostMatchResult = {
  intakeId: "intake-owner-a",
  statedNeed: "private intake text",
  scored: 150,
  excludedBlocked: 2,
  candidates: [candidate("open"), { ...candidate("review_required"), ghostId: "ghost-secret-2", rank: 2 }]
};

const bridge = buildGhostFleetPlayableLoopBridge(
  result,
  "intake-owner-a",
  "Synthetic test members. Not real people."
);
assert.deepEqual(bridge, {
  synthetic: true,
  state: "ranked",
  candidateCount: 2,
  reviewRequiredCount: 1,
  disclosure: "Synthetic test members. Not real people.",
  workshopHref: GHOST_FLEET_WORKSHOP_ROUTE,
  introsHref: GHOST_FLEET_INTROS_ROUTE
});
assert.equal(Object.isFrozen(bridge), true);
const serialized = JSON.stringify(bridge);
for (const forbidden of ["ghost-secret", "Synthetic Secret", "private intake text", "intake-owner-a", '"score"']) {
  assert.equal(serialized.includes(forbidden), false, `bridge leaked ${forbidden}`);
}

assert.equal(buildGhostFleetPlayableLoopBridge(result, "intake-owner-b", "disclosure"), null);
assert.equal(
  buildGhostFleetPlayableLoopBridge(
    { ...result, candidates: [{ ...candidate("open"), synthetic: false as true }] },
    "intake-owner-a",
    "disclosure"
  ),
  null
);
assert.equal(buildGhostFleetPlayableLoopBridge(result, "intake-owner-a", " "), null);
assert.equal(
  buildGhostFleetPlayableLoopBridge(
    { ...result, scored: 1 },
    "intake-owner-a",
    "disclosure"
  ),
  null
);
assert.equal(
  buildGhostFleetPlayableLoopBridge(
    { ...result, candidates: [candidate("open"), { ...candidate("review_required"), rank: 2 }] },
    "intake-owner-a",
    "disclosure"
  ),
  null
);
assert.equal(
  buildGhostFleetPlayableLoopBridge(
    { ...result, candidates: [{ ...candidate("open"), ghostId: "" }] },
    "intake-owner-a",
    "disclosure"
  ),
  null
);
assert.deepEqual(
  buildGhostFleetPlayableLoopBridge(
    { ...result, candidates: [] },
    "intake-owner-a",
    "disclosure"
  ),
  {
    synthetic: true,
    state: "no_honest_match",
    candidateCount: 0,
    reviewRequiredCount: 0,
    disclosure: "disclosure",
    workshopHref: "/dashboard/blueprints",
    introsHref: "/dashboard/intros"
  }
);

async function verifySourceContracts() {
  const fleet = JSON.parse(await readFile("data/ghost-fleet/members.json", "utf8")) as {
    targetCount: number;
    members: Array<{ synthetic?: boolean }>;
  };
  assert.equal(fleet.targetCount, 150);
  assert.equal(fleet.members.length, 150);
  assert.equal(fleet.members.every((member) => member.synthetic === true), true);

  const serverSource = await readFile("lib/squibb/public-recommendation-session-server.ts", "utf8");
  assert.match(serverSource, /readBellowsOwnerIdFromCookies\(\)/);
  assert.match(serverSource, /matchGhostsForOwner\(ownerId, 12\)/);
  assert.match(serverSource, /buildGhostFleetPlayableLoopBridge\(ghostMatches, shownIntakeId/);
  assert.doesNotMatch(serverSource, /searchParams|get\(["']owner/);

  const pageSource = await readFile("app/bellows/recommendations/page.tsx", "utf8");
  const continuationSource = await readFile("components/ghost-fleet/account-aware-people-continuation.tsx", "utf8");
  const recommendationSource = await readFile("components/squibb/recommendation-surface.tsx", "utf8");
  assert.match(continuationSource, /These are practice profiles, not real members/);
  assert.match(continuationSource, /href="\/dashboard\/intros"/);
  assert.match(continuationSource, /Meet People With Similar Ambitions/);
  assert.match(continuationSource, /Meet People Who May Fit/);
  assert.match(pageSource, /peopleGateway=\{<AccountAwarePeopleContinuation key="recommendation-people-gateway" initialBridge=\{ghostFleetBridge\} \/>\}/);
  assert.ok(
    recommendationSource.indexOf("{peopleGateway}") > recommendationSource.indexOf("selectedAnswerExcerpts.length > 0") &&
      recommendationSource.indexOf("{peopleGateway}") < recommendationSource.indexOf("<RecommendationWorkPath"),
    "people gateway must follow the recommendation explanation and precede the long work path"
  );
  assert.match(continuationSource, /people-shared-possibility-v1\.png/);
  assert.match(recommendationSource, /Explore resources beyond people/);
  assert.match(recommendationSource, /href="\/bellows\/library\/supplier-comparison"/);
  assert.match(recommendationSource, /href="\/bellows\/library"/);
  assert.doesNotMatch(pageSource, /Review \$\{ghostFleetBridge\.candidateCount\}/);
  assert.doesNotMatch(pageSource, /ghostFleetBridge\.(candidates|ownerId|intakeId)/);
}

verifySourceContracts()
  .then(() => {
    console.log("PASS ghost-fleet playable-loop contract: owner/intake bound, synthetic labeled, no raw candidate leakage");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
