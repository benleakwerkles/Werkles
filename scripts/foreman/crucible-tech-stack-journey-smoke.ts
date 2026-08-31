import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { MEMBER_TECH_STACK_JOURNEY, TECH_STACK_ACTIVATION_WAVES } from "../../lib/crucible-tech-stack-journey.ts";
import { copy } from "../../lib/copy.ts";
import { TECH_STACK_SLOT_IDS } from "../../lib/integrations/tech-stack-slot-catalog.ts";

const services = MEMBER_TECH_STACK_JOURNEY.flatMap((stage) => stage.services);
assert.equal(services.length, TECH_STACK_SLOT_IDS.length);
assert.deepEqual([...new Set(services.map((service) => service.id))].sort(), [...TECH_STACK_SLOT_IDS].sort());
assert.ok(services.every((service) => service.productionLive === false));
assert.ok(services.every((service) => service.does.length > 20 && service.doesNot.length > 20));
assert.ok(services.every((service) => service.memberAction.length > 35));
assert.ok(services.every((service) => service.nextBuild.length > 45));
assert.ok(services.every((service) => service.humanGate.length > 35));
assert.ok(services.every((service) => service.page.startsWith("/")));
assert.ok(services.every((service) => Object.isFrozen(service)));
assert.ok(MEMBER_TECH_STACK_JOURNEY.every((stage) => Object.isFrozen(stage) && Object.isFrozen(stage.services)));
assert.equal(TECH_STACK_ACTIVATION_WAVES.length, 4);
assert.ok(TECH_STACK_ACTIVATION_WAVES.every((wave) => Object.isFrozen(wave)));
assert.ok(TECH_STACK_ACTIVATION_WAVES.every((wave) => wave.nextProof.length > 45 && wave.stopsBefore.length > 35));

const identity = services.find((service) => service.id === "stripe_identity");
const plaid = services.find((service) => service.id === "plaid");
const twilio = services.find((service) => service.id === "twilio_verify");
const checkr = services.find((service) => service.id === "checkr");
assert.match(identity?.doesNot ?? "", /does not prove character/i);
assert.match(plaid?.doesNot ?? "", /Link alone is not funds proof/i);
assert.match(twilio?.doesNot ?? "", /does not prove legal identity/i);
assert.match(checkr?.doesNot ?? "", /not a universal safe-person badge/i);
assert.equal(plaid?.state, "sandbox_demo");
assert.equal(checkr?.state, "policy_blocked");

const component = readFileSync("components/crucible/tech-stack-journey.tsx", "utf8");
const panel = readFileSync("components/crucible/crucible-panel.tsx", "utf8");
const card = readFileSync("components/crucible/verification-card.tsx", "utf8");
const page = readFileSync("app/dashboard/crucible/page.tsx", "utf8");
assert.match(component, /A provider name never means/);
assert.match(component, /Closest useful progress/);
assert.match(component, /Waits for:/);
assert.match(component, /Can I use this now\?/);
assert.match(component, /What moves this forward/);
assert.match(component, /Werkles must prove:/);
assert.match(component, /Before this can go live:/);
assert.doesNotMatch(component, /Human gate:|Next build:/, "member-facing provider copy must not expose control-plane labels");
assert.match(component, /Test and sandbox activity is not live verification/);
assert.match(component, /data-stack-state=\{service\.state\}/);
assert.doesNotMatch(component, /production ready|live provider|fully connected/i);
assert.match(panel, /<TechStackJourney \/>/);
assert.doesNotMatch(panel, /copy\.squibb\.crucible/);
assert.match(card, /id=\{`check-\$\{check\.key\}`\}/);

const firstContactCopy = [
  copy.crucible.pageEyebrow,
  copy.crucible.pageHeadline,
  copy.crucible.principle,
  copy.crucible.intro,
  copy.crucible.readyStatus,
  copy.crucible.unavailableStatus,
  ...copy.crucible.workflowStates.flatMap((state) => [state.title, state.summary, state.memberNote, state.cta])
].join("\n");
assert.doesNotMatch(firstContactCopy, /runway|Foundry Dues|proof doctrine|concierge intake|Squibb/i);
assert.doesNotMatch(page, /Run the concierge intake|Proof doctrine|Foundry Dues/);
assert.match(copy.crucible.principle, /one narrow question/i);
assert.match(page, /Answer the Werkles questions/);
assert.match(page, />\s*See check pricing\s*<\/Link>/);

console.log("Crucible member tech-stack journey: PASS");
