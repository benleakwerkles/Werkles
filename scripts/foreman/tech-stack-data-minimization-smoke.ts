import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DATA_MINIMIZATION_BOUNDARIES } from "../../lib/integrations/data-minimization-boundaries.ts";
import { TECH_STACK_SLOT_IDS } from "../../lib/integrations/tech-stack-slot-catalog.ts";

assert.deepEqual(Object.keys(DATA_MINIMIZATION_BOUNDARIES).sort(), [...TECH_STACK_SLOT_IDS].sort());
for (const boundary of Object.values(DATA_MINIMIZATION_BOUNDARIES)) {
  assert.equal(boundary.status, "planned_not_live");
  assert.ok(boundary.werklesKeeps.length > 30);
  assert.ok(boundary.providerHandles.length > 30);
  assert.ok(boundary.disposal.length > 30);
  assert.equal(Object.isFrozen(boundary), true);
}

const plaid = DATA_MINIMIZATION_BOUNDARIES.plaid;
assert.match(plaid.werklesKeeps, /not public amounts, balances, bands, transactions, or account numbers/i);
assert.match(plaid.werklesKeeps, /mutually approved private disclosure/i);
assert.match(plaid.providerHandles, /raw account, balance, and Asset Report data/i);
assert.match(plaid.disposal, /Remove the Plaid Item and Asset Report from Werkles access after evaluation/i);
assert.match(plaid.disposal, /no result becomes shareable until removal is confirmed/i);
assert.match(plaid.disposal, /Plaid's independent retention follows its own terms and legal duties/i);
assert.match(DATA_MINIMIZATION_BOUNDARIES.stripe_identity.werklesKeeps, /not document or selfie files/i);
assert.match(DATA_MINIMIZATION_BOUNDARIES.stripe_billing.providerHandles, /Card and payment-method details/i);
assert.match(DATA_MINIMIZATION_BOUNDARIES.twilio_verify.werklesKeeps, /not the verification code/i);
assert.match(DATA_MINIMIZATION_BOUNDARIES.checkr.disposal, /No collection until counsel approves/i);

const journey = readFileSync("components/crucible/tech-stack-journey.tsx", "utf8");
assert.match(journey, /Not live yet: what would happen to the data/);
assert.match(journey, /Werkles would keep/);
assert.match(journey, /Provider would handle/);
assert.match(journey, /Deletion or expiry/);

console.log("Eight-service planned data-minimization boundaries: PASS");
