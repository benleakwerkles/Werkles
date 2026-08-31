import assert from "node:assert/strict";

import {
  TECH_STACK_LAYER_ORDER,
  TECH_STACK_READINESS_LEDGER,
  techStackEntriesForLayer
} from "../../lib/integrations/tech-stack-readiness-ledger";

const ids = TECH_STACK_READINESS_LEDGER.map((item) => item.id);
assert.equal(new Set(ids).size, ids.length, "Every stack slot must have one stable id.");
assert.deepEqual(TECH_STACK_LAYER_ORDER, ["product_runtime", "member_provider", "operator_custody"]);

for (const layer of TECH_STACK_LAYER_ORDER) {
  assert.ok(techStackEntriesForLayer(layer).length > 0, `${layer} must not be an empty decorative layer.`);
}

for (const item of TECH_STACK_READINESS_LEDGER) {
  assert.equal(item.productionLive, false, `${item.id} must not claim production-live readiness.`);
  assert.ok(item.authorityBoundary.length > 25, `${item.id} needs a meaningful authority boundary.`);
  assert.ok(item.dataBoundary.length > 25, `${item.id} needs a meaningful data boundary.`);

  if (item.layer === "member_provider") {
    assert.ok(item.memberPath.startsWith("/"), `${item.id} needs a real member destination.`);
  } else {
    assert.ok(!("memberPath" in item), `${item.id} must not invent a member destination.`);
  }
}

const posthog = TECH_STACK_READINESS_LEDGER.find((item) => item.id === "posthog");
assert.equal(posthog?.layer, "product_runtime");
assert.equal(posthog?.readiness, "not_adopted");
assert.match(posthog?.authorityBoundary ?? "", /may not rank members/i);
assert.match(posthog?.dataBoundary ?? "", /No session replay/i);

const expo = TECH_STACK_READINESS_LEDGER.find((item) => item.id === "expo_push");
assert.equal(expo?.layer, "product_runtime");
assert.equal(expo?.readiness, "not_adopted");
assert.match(expo?.dataBoundary ?? "", /revocable delivery token/i);
assert.match(expo?.dataBoundary ?? "", /never place sensitive Werkle details/i);

const memberReadiness = new Set(["available", "not_live_yet", "planned", "policy_blocked"]);
const runtimeReadiness = new Set(["in_use", "configured_not_enabled", "not_adopted"]);
const custodyReadiness = new Set(["in_use", "not_adopted"]);
for (const item of TECH_STACK_READINESS_LEDGER) {
  const vocabulary = item.layer === "member_provider"
    ? memberReadiness
    : item.layer === "product_runtime"
      ? runtimeReadiness
      : custodyReadiness;
  assert.ok(vocabulary.has(item.readiness), `${item.id} uses another layer's readiness vocabulary.`);
}

console.log("PASS tech-stack readiness ledger: three distinct layers, layer-safe vocabulary, truthful non-live state, member destinations only for member providers, and privacy-bounded PostHog/Expo foundations.");
