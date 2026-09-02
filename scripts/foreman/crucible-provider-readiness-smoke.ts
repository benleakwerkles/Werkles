import assert from "node:assert/strict";

import { pricing } from "../../lib/pricing.ts";
import {
  CRUCIBLE_PROVIDER_READINESS,
  providerReadinessFor,
  resolveProviderReadiness
} from "../../lib/crucible-provider-readiness.ts";

const pricingKeys = pricing.crucible.map((check) => check.key).sort();
const manifestKeys = Object.keys(CRUCIBLE_PROVIDER_READINESS).sort();
assert.deepEqual(manifestKeys, pricingKeys, "Every priced Crucible check needs one readiness entry");

for (const key of pricingKeys) {
  const entry = providerReadinessFor(key);
  assert.equal(entry.checkKey, key);
  assert.equal(entry.productionLive, false, `${key} must not look production-live`);
  assert.doesNotMatch(entry.readout, /\b(?:live|verified|cleared|approved)\b/i);

  if (entry.adapterStage === "planned" || entry.adapterStage === "policy_blocked") {
    assert.equal(entry.route, null, `${key} cannot expose a route before an adapter is connected`);
  }

  if (entry.adapterStage === "policy_blocked") {
    assert.equal(entry.policyGate, "counsel_and_provider_approval");
  }
}

const identity = providerReadinessFor("identity");
assert.equal(resolveProviderReadiness(identity, { walkthroughReadOnly: true, runtime: "available" }).actionEnabled, false);
assert.deepEqual(resolveProviderReadiness(identity, { walkthroughReadOnly: false, runtime: "unknown" }), {
  status: "runtime_check_required",
  label: "Checked when opened",
  detail: identity.readout,
  actionEnabled: false
});
assert.equal(resolveProviderReadiness(identity, { walkthroughReadOnly: false, runtime: "available" }).status, "test_available");

const funds = providerReadinessFor("funds");
assert.equal(funds.proofStorage, "none");
assert.equal(resolveProviderReadiness(funds, { walkthroughReadOnly: false, runtime: "available" }).status, "sandbox_demo_available");
assert.deepEqual(resolveProviderReadiness(funds, { walkthroughReadOnly: false, runtime: "unavailable" }), {
  status: "runtime_unavailable",
  label: "Unavailable in this environment",
  detail: funds.readout,
  actionEnabled: false
});

const phone = providerReadinessFor("phone");
assert.equal(resolveProviderReadiness(phone, { walkthroughReadOnly: false, runtime: "available" }).actionEnabled, false);

for (const key of ["background_basic", "background_essential", "background_complete", "continuous_monitoring"] as const) {
  const readout = resolveProviderReadiness(providerReadinessFor(key), {
    walkthroughReadOnly: false,
    runtime: "available"
  });
  assert.equal(readout.status, "policy_blocked");
  assert.equal(readout.actionEnabled, false);
}

console.log("Crucible provider readiness manifest: PASS");
