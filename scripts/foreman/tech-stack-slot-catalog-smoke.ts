import assert from "node:assert/strict";

import {
  TECH_STACK_SLOT_IDS,
  TECH_STACK_SLOTS,
  techStackSlot
} from "../../lib/integrations/tech-stack-slot-catalog.ts";

assert.deepEqual(Object.keys(TECH_STACK_SLOTS).sort(), [...TECH_STACK_SLOT_IDS].sort());

for (const id of TECH_STACK_SLOT_IDS) {
  const entry = techStackSlot(id);
  assert.equal(entry.id, id);
  assert.equal(entry.productionLive, false);
  assert.ok(entry.compositionModule.startsWith("lib/"));
  assert.ok(entry.authority.length > 20);
  assert.equal(Object.isFrozen(entry), true);
  assert.equal(Object.isFrozen(entry.routes), true);
}

assert.equal(techStackSlot("plaid").stage, "sandbox_demo");
assert.match(techStackSlot("plaid").authority, /Link completion alone is never proof/);
assert.equal(techStackSlot("twilio_verify").routes.length, 0);
assert.match(techStackSlot("twilio_verify").authority, /send success alone is never proof/i);
assert.equal(techStackSlot("checkr").stage, "policy_blocked");
assert.match(techStackSlot("supabase_member_data").blocker ?? "", /schema and RLS/i);

console.log("Werkles tech-stack slot catalog: PASS");
