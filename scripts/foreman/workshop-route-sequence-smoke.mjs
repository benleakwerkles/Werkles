import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function source(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

function containsInOrder(text, fragments, label) {
  let cursor = -1;
  for (const fragment of fragments) {
    const next = text.indexOf(fragment, cursor + 1);
    assert.ok(next > cursor, `${label}: missing or misordered ${JSON.stringify(fragment)}`);
    cursor = next;
  }
}

const routes = [
  "/bellows/intake",
  "/bellows/recommendations",
  "/dashboard/blueprints",
  "/dashboard/intros"
];
for (const route of routes) {
  const pagePath = route === "/" ? "app/page.tsx" : `app${route}/page.tsx`;
  await assert.doesNotReject(access(path.join(repoRoot, pagePath)), `missing walkthrough route ${route}`);
}

const [
  intakeForm,
  recommendationsPage,
  recommendationsSurface,
  recommendationsContinuation,
  recommendationsServer,
  bridgeContract,
  workshopPage,
  workshopState,
  ownerState,
  introsPage,
  introsModel
] = await Promise.all([
  source("components/squibb/concierge-intake-form.tsx"),
  source("app/bellows/recommendations/page.tsx"),
  source("components/squibb/recommendation-surface.tsx"),
  source("components/ghost-fleet/account-aware-people-continuation.tsx"),
  source("lib/squibb/public-recommendation-session-server.ts"),
  source("lib/ghost-fleet/playable-loop.ts"),
  source("app/dashboard/blueprints/page.tsx"),
  source("components/workshop/account-aware-workshop-state.tsx"),
  source("lib/owner-surfaces/owner-state.ts"),
  source("app/dashboard/intros/page.tsx"),
  source("lib/recommendation-view/model.ts")
]);

// Intake submits to the owner-bound endpoint before navigation. A failed save
// cannot silently advance into a recommendation or Workshop.
containsInOrder(
  intakeForm,
  [
    'fetch("/api/bellows/intake"',
    "if (!response.ok)",
    "setSubmitted(packet)",
    'window.location.assign("/bellows/recommendations")'
  ],
  "intake save sequence"
);
assert.match(intakeForm, /credentials:\s*"same-origin"/);
assert.match(
  intakeForm,
  /This must be a document navigation, not a cached App Router transition[\s\S]*?HttpOnly owner cookie/
);

// Recommendations is a real interpretation seam. It reads only the browser's
// owner, binds the synthetic bridge to the exact intake displayed, then hands
// the account-aware continuation its initial browser-session bridge.
assert.match(recommendationsServer, /readBellowsOwnerIdFromCookies\(\)/);
assert.match(recommendationsServer, /matchGhostsForOwner\(ownerId, 12\)/);
assert.match(recommendationsServer, /session\.source\?\.mode === "latest_intake"/);
assert.match(
  recommendationsServer,
  /buildGhostFleetPlayableLoopBridge\(ghostMatches, shownIntakeId, GHOST_FLEET_DISCLOSURE\)/
);
assert.match(bridgeContract, /result\.intakeId !== expectedIntakeId/);
assert.match(bridgeContract, /GHOST_FLEET_WORKSHOP_ROUTE = "\/dashboard\/blueprints"/);
assert.match(bridgeContract, /GHOST_FLEET_INTROS_ROUTE = "\/dashboard\/intros"/);
assert.match(recommendationsPage, /AccountAwarePeopleContinuation initialBridge={ghostFleetBridge}/);
assert.match(recommendationsSurface, /href="\/dashboard\/blueprints">Open My Workshop/);
assert.match(recommendationsContinuation, /href="\/dashboard\/intros">Open Match Deck/);
assert.doesNotMatch(recommendationsContinuation, /href="\/dashboard\/blueprints"/);
assert.match(recommendationsContinuation, /These are practice profiles, not real members/);

// Workshop must read the same browser owner and must be able to continue to
// Intros in both states. It cannot accept an owner through query parameters.
assert.match(workshopPage, /loadOwnerSurfaceState\(await readBellowsOwnerIdFromCookies\(\)\)/);
assert.doesNotMatch(workshopPage, /searchParams|get\(["']owner/);
assert.match(workshopPage, /href="\/dashboard\/intros"/);

// Honest empty Workshop: no owner or no stored intake returns a closed empty
// model. The page says it will not guess, offers intake recovery, and suppresses
// the carrying/coverage sections instead of fabricating rows or candidates.
assert.match(ownerState, /if \(!ownerId\) return emptyOwnerSurfaceState\(\)/);
assert.match(ownerState, /if \(!latest\) return emptyOwnerSurfaceState\(\)/);
assert.match(ownerState, /hasIntake:\s*false/);
assert.match(ownerState, /intakeId:\s*null/);
assert.match(ownerState, /Nothing to read yet — Werkles will not guess at your situation\./);
assert.match(
  ownerState,
  /candidates:\s*\{\s*available:\s*false,\s*count:\s*0,\s*reviewRequired:\s*0,\s*topName:\s*null,\s*topScore:\s*null\s*\}/
);
assert.match(ownerState, /label:\s*"Run the concierge intake"[\s\S]*?href:\s*"\/bellows\/intake"/);
assert.match(workshopPage, /href="#action-plan"[\s\S]*?Build or Review My Action Plan/);
assert.match(workshopPage, /href="\/bellows\/intake">Review My Answers/);
assert.match(workshopState, /Werkles used your answers to shape the working read below/);
assert.match(workshopState, /href="\/bellows\/intake">Start Intake<\/Link>/);
assert.doesNotMatch(workshopState, /Open intros|Open proof/i);
assert.ok(
  (workshopState.match(/\{state\.hasIntake \? \(/g) ?? []).length >= 2,
  "Account-aware Workshop must gate the owner readback and post-intake next move on hasIntake"
);

// Honest populated Workshop: hasIntake becomes true only after an owner-scoped
// latest intake exists. The owner model retains answer provenance, but the
// Workshop acknowledges the complete Intake without replaying long raw answers.
// Candidate availability follows the fleet gate and any count follows ranking.
containsInOrder(
  ownerState,
  [
    "readLatestSpeakerIntakeForOwner(ownerId)",
    "if (!latest) return emptyOwnerSurfaceState()",
    "answersFromPacket(latest.packet.symptoms)",
    "buildOwnerSurfaceStateFromAnswers(",
    "latest.stored.intakeId",
    "rankGhostsForSignals(signals, await listGhostMembers(), 12)",
    "hasIntake: true",
    "intakeId,"
  ],
  "populated Workshop derivation"
);
assert.match(ownerState, /value:\s*answers\[question\.id\]/);
assert.match(ownerState, /answered:\s*answers\[question\.id\]\.trim\(\)\.length > 0/);
assert.match(ownerState, /candidates:\s*\{ available: fleetOn, count: candidateCount/);
assert.doesNotMatch(workshopState, /state\.carrying\.map\(\(row, index\) =>/);
assert.match(workshopState, /Your complete wording stays in Intake/);
assert.match(workshopState, /Review or Change My Intake/);
assert.match(workshopState, /Turn one path into useful work/);
assert.match(workshopState, /href="\/bellows\/recommendations">Open Recommendations<\/Link>/);
assert.match(workshopState, /Match Deck comes later—only if a person is actually part of the answer\./);
assert.match(workshopPage, /GHOST_FLEET_DISCLOSURE/);

// Intros repeats the owner boundary. Empty means no ask, reasons, doors, or
// synthetic disclosure; populated doors remain explicitly synthetic and are
// disclosed only when actual doors exist.
containsInOrder(
  introsPage,
  [
    "const ownerId = await readBellowsOwnerIdFromCookies()",
    "loadRecommendationView(ownerId)",
    "matchGhostsForOwner(ownerId, 9)"
  ],
  "owner-bound Match Deck derivation"
);
assert.match(introsModel, /if \(!ownerId\) return emptyRecommendationView\(\)/);
assert.match(introsModel, /if \(!latest\) return emptyRecommendationView\(\)/);
assert.match(introsModel, /state:\s*"no_intake"/);
assert.match(introsModel, /summary:\s*"Nothing asked for yet\. Werkles will not invent an ask on your behalf\."/);
assert.match(introsModel, /doors:\s*\[\]/);
assert.match(introsModel, /syntheticDisclosure:\s*null/);
assert.match(introsModel, /synthetic:\s*true/);
assert.match(introsModel, /syntheticDisclosure:\s*fleetOn && doors\.length > 0 \? GHOST_FLEET_DISCLOSURE : null/);
assert.match(introsPage, /AccountAwareGhostMemberLab initialMembers={interactionMembers}/);

console.log(
  "Workshop route sequence: PASS (intake save -> owner-bound recommendations -> current Workshop -> current synthetic readout; honest empty/populated states)"
);
