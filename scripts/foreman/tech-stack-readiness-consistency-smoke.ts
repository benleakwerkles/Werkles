import assert from "node:assert/strict";

import {
  TECH_STACK_SLOT_IDS,
  TECH_STACK_SLOTS,
  type TechStackSlotId
} from "../../lib/integrations/tech-stack-slot-catalog";
import { TECH_STACK_READINESS_LEDGER } from "../../lib/integrations/tech-stack-readiness-ledger";

const readinessIdFor: Readonly<Record<TechStackSlotId, string>> = Object.freeze({
  supabase_auth: "supabase_auth",
  supabase_member_data: "supabase_postgres",
  supabase_storage: "supabase_storage",
  stripe_billing: "stripe_billing",
  stripe_identity: "stripe_identity",
  plaid: "plaid",
  twilio_verify: "twilio_verify",
  checkr: "checkr"
});

const compatibleReadiness: Readonly<Record<TechStackSlotId, readonly string[]>> = Object.freeze({
  supabase_auth: ["not_live_yet"],
  supabase_member_data: ["configured_not_enabled"],
  supabase_storage: ["not_adopted"],
  stripe_billing: ["not_live_yet"],
  stripe_identity: ["not_live_yet"],
  plaid: ["not_live_yet"],
  twilio_verify: ["planned"],
  checkr: ["policy_blocked"]
});

for (const slotId of TECH_STACK_SLOT_IDS) {
  const slot = TECH_STACK_SLOTS[slotId];
  const ledger = TECH_STACK_READINESS_LEDGER.find((item) => item.id === readinessIdFor[slotId]);
  assert.ok(ledger, `${slotId} has no readiness-ledger entry`);
  assert.equal(ledger.system, slot.system, `${slotId} names the provider differently across sources`);
  assert.equal(ledger.productionLive, false, `${slotId} is overstated as production-live`);
  assert.equal(ledger.actionEnabled, false, `${slotId} is overstated as member-action-enabled`);
  assert.ok(compatibleReadiness[slotId].includes(ledger.readiness), `${slotId} readiness contradicts its slot stage`);
  assert.ok(ledger.authorityBoundary.trim() && ledger.dataBoundary.trim(), `${slotId} needs authority and data boundaries`);
  if (ledger.layer === "member_provider") {
    assert.ok(ledger.memberPath.startsWith("/"), `${slotId} needs one member surface`);
  }
}

console.log("PASS tech-stack readiness consistency: catalog and ledger agree on all eight provider slots without enabling production or member actions");
