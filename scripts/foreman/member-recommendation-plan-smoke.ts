import assert from "node:assert/strict";

import { buildMemberRecommendationPlan } from "../../lib/squibb/member-recommendation-plan.ts";

const bakeryFacts = [
  { id: "intake-heaviest_lift", label: "What are you trying to make real?", text: "Open a small neighborhood bakery with dependable weekday sales." },
  { id: "intake-business_stage", label: "Where is it today?", text: "Testing it" },
  { id: "intake-time_cost", label: "What is getting in the way right now?", text: "Customers or sales; Tools, equipment, or space" },
  { id: "intake-stuck_decision", label: "What decision do you need to make next?", text: "Choose whether to validate preorder demand before leasing kitchen space." },
  { id: "intake-resources_on_hand", label: "What do you already have?", text: "An idea or prototype; Skills or credentials" },
  { id: "intake-constraints", label: "What cannot change?", text: "Not answered" }
] as const;

const bakery = buildMemberRecommendationPlan("verify_proof", bakeryFacts);
assert.equal(bakery.tailored, true);
assert.equal(bakery.title, "Prove weekday demand before you lease or buy.");
assert.match(bakery.verdict, /two-cycle demand test/i);
assert.equal(bakery.sprint.length, 3);
assert.match(bakery.sprint[0].action, /one product or bundle/i);
assert.match(bakery.sprint[1].action, /minimum paid orders or revenue/i);
assert.match(bakery.sprint[2].action, /Interest without a paid order stays interest/i);
assert.match(bakery.finishLine, /threshold is reached twice/i);
assert.match(bakery.artifactDraft.hypothesis, /weekday offer reaches a written demand threshold/i);
assert.doesNotMatch(bakery.artifactDraft.hypothesis, /sales\. is ready/i);
assert.match(bakery.artifactDraft.support, /Self-reported stage: Testing it/);
assert.match(bakery.artifactDraft["gap-test"], /Run the same small paid-demand test twice/);

const equipment = buildMemberRecommendationPlan("find_equipment", bakeryFacts);
assert.equal(equipment.title, "Size the smallest capacity upgrade the demand test earns.");
assert.match(equipment.verdict, /Do not shop for an oven or lease first/i);
assert.match(equipment.sprint[0].action, /paid orders per pickup window/i);
assert.match(equipment.sprint[1].action, /minimum units per hour/i);
assert.match(equipment.sprint[2].action, /rental or shared kitchen/i);
assert.notEqual(equipment.verdict, bakery.verdict);

const decisionPlan = buildMemberRecommendationPlan("translate_need", bakeryFacts);
assert.equal(decisionPlan.title, "Choose the demand test before the capacity bet.");
assert.match(decisionPlan.sprint[2].action, /go, revise, and stop/i);
assert.notEqual(decisionPlan.verdict, bakery.verdict);

const digitalFacts = [
  { id: "intake-heaviest_lift", label: "Goal", text: "Get Werkles and PookaKind ready for customers, mentors, and investors." },
  { id: "intake-business_stage", label: "Stage", text: "Testing it" },
  { id: "intake-time_cost", label: "Blocker", text: "Customers or sales; Tools, equipment, or space" },
  { id: "intake-stuck_decision", label: "Decision", text: "Decide whether the apps are built enough for real users." },
  { id: "intake-constraints", label: "Constraints", text: "Do not expose private customer data." }
] as const;
const digitalEquipment = buildMemberRecommendationPlan("find_equipment", digitalFacts);
assert.equal(digitalEquipment.title, "Name the product bottleneck before adding another tool.");
assert.match(digitalEquipment.verdict, /service, contractor, or piece of infrastructure/i);
assert.match(digitalEquipment.sprint[2].action, /data risk, lock-in, and reversibility/i);
assert.doesNotMatch(JSON.stringify(digitalEquipment), /oven|bakery|shared kitchen/i);

const thin = buildMemberRecommendationPlan("verify_proof", [
  { id: "intake-heaviest_lift", label: "Goal", text: "I'm stuck." }
]);
assert.equal(thin.tailored, false);
assert.equal(thin.sprint.length, 0);
assert.match(thin.verdict, /concrete outcome and the main thing blocking it/i);
assert.deepEqual(thin.artifactDraft, {});

const ordinary = buildMemberRecommendationPlan("translate_need", [
  { id: "intake-heaviest_lift", label: "Goal", text: "Open a repair shop." },
  { id: "intake-time_cost", label: "Blocker", text: "I cannot choose a location." }
]);
assert.equal(ordinary.tailored, true);
assert.equal(ordinary.sprint.length, 3);
assert.doesNotMatch(ordinary.title, /Open a repair shop/);
assert.doesNotMatch(ordinary.sprint.map((step) => step.action).join(" "), /cannot choose a location/);
assert.match(ordinary.reasons.join(" "), /one-decision brief/i);
assert.match(ordinary.reasons.join(" "), /real choices, cost of testing, time to evidence, reversibility/i);

console.log("Member recommendation plan: PASS");
