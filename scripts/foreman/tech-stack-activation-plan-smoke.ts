import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import {
  TECH_STACK_ACTIVATION_WAVES,
  activationWaveFor
} from "../../lib/integrations/tech-stack-activation-plan";
import {
  TECH_STACK_SLOT_IDS,
  TECH_STACK_SLOTS
} from "../../lib/integrations/tech-stack-slot-catalog";
import { DATA_MINIMIZATION_BOUNDARIES } from "../../lib/integrations/data-minimization-boundaries";

const assignments = TECH_STACK_ACTIVATION_WAVES.flatMap((wave) =>
  wave.slotIds.map((slotId) => ({ slotId, wave: wave.number }))
);

assert.deepEqual(
  [...new Set(assignments.map((item) => item.slotId))].sort(),
  [...TECH_STACK_SLOT_IDS].sort(),
  "activation plan must cover every product-provider slot"
);
assert.equal(assignments.length, TECH_STACK_SLOT_IDS.length, "a provider slot may appear in only one wave");

for (const slotId of TECH_STACK_SLOT_IDS) {
  const slot = TECH_STACK_SLOTS[slotId];
  const wave = activationWaveFor(slotId);
  const boundary = DATA_MINIMIZATION_BOUNDARIES[slotId];
  assert.ok(wave.nextProof.trim(), `${slotId} needs an executable next proof`);
  assert.ok(wave.stopsBefore.trim(), `${slotId} needs a stopping boundary`);
  assert.equal(slot.productionLive, false, `${slotId} must not be represented as production-live`);
  assert.equal(boundary.status, "planned_not_live", `${slotId} data boundary must remain explicitly planned`);
  assert.ok(boundary.werklesKeeps.trim() && boundary.providerHandles.trim() && boundary.disposal.trim());
  if (slot.stage !== "not_connected" && slot.stage !== "policy_blocked") {
    assert.ok(existsSync(slot.compositionModule), `${slotId} composition module is missing: ${slot.compositionModule}`);
  }
}

assert.equal(activationWaveFor("supabase_auth").number, 1);
assert.equal(activationWaveFor("supabase_member_data").number, 1);
assert.equal(activationWaveFor("stripe_billing").number, 2);
assert.equal(activationWaveFor("stripe_identity").number, 3);
assert.equal(activationWaveFor("plaid").number, 3);
assert.equal(activationWaveFor("twilio_verify").number, 3);
assert.equal(activationWaveFor("checkr").number, 4);

console.log("PASS tech-stack activation plan: complete provider coverage, custody-first order, data boundaries, and closed production claims");
