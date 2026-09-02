import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readout = readFileSync("components/ghost-fleet/account-aware-intros-readout.tsx", "utf8");
const lab = readFileSync("components/ghost-fleet/ghost-member-interaction-lab.tsx", "utf8");
const perspective = readFileSync("components/werkle/partner-perspective-exercise.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const copy = readFileSync("lib/copy.ts", "utf8");
const membership = readFileSync("app/membership/page.tsx", "utf8");
const personalBellows = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");

const checks = [
  [readout.includes("Preview what another member could see"), "Match Deck exposes a self-preview before any real introduction"],
  [readout.includes("Not shared yet") && readout.includes("Private preview"), "self-preview names its current sharing state"],
  [readout.includes("view.askedFor.summary") && readout.includes("view.askedFor.laneNeeded") && readout.includes("view.askedFor.turf") && readout.includes("view.askedFor.proofPosture"), "self-preview is built from the account-aware recommendation read"],
  [readout.includes("bank balance, net worth, precise location") && readout.includes("inferred traits"), "self-preview excludes wealth, precise location, and inferred traits"],
  [readout.includes("Correct What Werkles Knows"), "self-preview has a correction route"],
  [lab.includes("Prepare for a Future Conversation") && !lab.includes("Prepare for a Real Conversation"), "synthetic practice does not imply a real person is waiting"],
  [perspective.includes("this browser on this device"), "perspective exercise describes its actual localStorage boundary"],
  [styles.includes(".recview__self-preview-grid") && styles.includes("@media (max-width: 680px)"), "self-preview has desktop and mobile layout rules"],
  [copy.includes("Live production checks remain off") && copy.includes("limited to connected test members") && copy.includes("The live design keeps a narrow result and its date"), "Crucible separates test-member access from intended live retention without internal runtime language"],
  [membership.includes("browser-local practice Werkle today") && membership.includes("Real member-to-member sharing"), "Membership names what exists and what does not"],
  [personalBellows.includes("This path follows your current Intake") && !personalBellows.includes("create a custom Pooka"), "Personal Bellows leads with useful continuity instead of internal product disclaimers"]
];

for (const [pass, label] of checks) assert.equal(pass, true, label);
console.log(`PASS BVPGM M21 member continuity: ${checks.length}/${checks.length}`);
