import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  WERKLES_MEMBERSHIP_PROMISE,
  WERKLES_TERMS,
  WERKLES_VALUE_LADDER
} from "../../lib/membership-value-ladder.ts";
import { GHOST_INTERACTION_QUESTIONS } from "../../lib/ghost-fleet/interaction.ts";

assert.equal(Object.isFrozen(WERKLES_TERMS), true);
assert.equal(Object.isFrozen(WERKLES_TERMS.workshop), true);
assert.equal(Object.isFrozen(WERKLES_TERMS.werkle), true);
assert.match(WERKLES_TERMS.workshop.definition, /private working room/i);
assert.match(WERKLES_TERMS.werkle.definition, /two or more Werklers/i);

assert.equal(Object.isFrozen(WERKLES_VALUE_LADDER), true);
assert.deepEqual(WERKLES_VALUE_LADDER.map((step) => step.id), ["free", "packet", "member", "shared"]);
for (const step of WERKLES_VALUE_LADDER) {
  assert.equal(Object.isFrozen(step), true);
  assert.equal(Object.isFrozen(step.features), true);
  assert.ok(step.features.length >= 3);
}

const free = WERKLES_VALUE_LADDER.find((step) => step.id === "free");
const packet = WERKLES_VALUE_LADDER.find((step) => step.id === "packet");
const member = WERKLES_VALUE_LADDER.find((step) => step.id === "member");
const shared = WERKLES_VALUE_LADDER.find((step) => step.id === "shared");
assert.ok(free && packet && member && shared);
assert.equal(free.price, "$0");
assert.match(free.features.join(" "), /practical next moves/i);
assert.match(packet.features.join(" "), /non-member price/i);
assert.equal(member.price, "$9.99 / month");
assert.match(member.features.join(" "), /packets included/i);
assert.match(shared.features.join(" "), /free preview/i);
assert.match(WERKLES_MEMBERSHIP_PROMISE, /not by making free deliberately frustrating/i);

const carryQuestion = GHOST_INTERACTION_QUESTIONS.find((question) => question.id === "carry");
assert.equal(carryQuestion?.label, "What could you take responsibility for?");
assert.doesNotMatch(carryQuestion?.label ?? "", /bring to the Werkle|what can you carry/i);

async function verifySurfaces() {
  const [membershipPage, workshopPage, css] = await Promise.all([
    readFile("app/membership/page.tsx", "utf8"),
    readFile("app/dashboard/blueprints/page.tsx", "utf8"),
    readFile("app/globals.css", "utf8")
  ]);

  assert.match(membershipPage, /WERKLES_VALUE_LADDER\.map/);
  assert.match(membershipPage, /Real member-to-member sharing and account-saved Werkle records are still being built/);
  assert.match(workshopPage, /Your Workshop becomes a Werkle when the work becomes shared/);
  assert.match(workshopPage, /Connecting does not merge your entire account/);
  assert.doesNotMatch(membershipPage, /Ghost Fleet|Stripe Identity|Plaid|Twilio|Checkr/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.membership-ladder__grid/);
}

verifySurfaces()
  .then(() => console.log("PASS Workshop/Werkle terminology and honest free-to-member value ladder"))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
