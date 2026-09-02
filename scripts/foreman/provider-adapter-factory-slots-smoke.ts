import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  PROVIDER_PORT_PROFILES,
  EXTERNAL_VERIFICATION_PROVIDER_IDS
} from "../../lib/verification/provider-adapter-port.ts";
import {
  PROVIDER_ADAPTER_FACTORY_SLOTS,
  providerAdapterFactorySlot
} from "../../lib/verification/provider-adapter-factory-slots.ts";

const EXPECTED_DEPENDENCIES = Object.freeze({
  stripe_identity: ["stripe_identity.server_client", "stripe_identity.webhook_verifier"],
  plaid: ["plaid.server_client", "plaid.webhook_verifier"],
  twilio_verify: ["twilio_verify.server_client"],
  checkr: ["checkr.server_client", "checkr.webhook_verifier"]
} as const);

assert.deepEqual(
  Object.keys(PROVIDER_ADAPTER_FACTORY_SLOTS).sort(),
  [...EXTERNAL_VERIFICATION_PROVIDER_IDS].sort(),
  "factory slots must be exhaustive and contain no extra provider"
);

for (const providerId of EXTERNAL_VERIFICATION_PROVIDER_IDS) {
  const slot = providerAdapterFactorySlot(providerId);
  const port = PROVIDER_PORT_PROFILES[providerId];
  assert.equal(slot.providerId, providerId);
  assert.equal(slot.version, "v1");
  assert.equal(slot.runtimeBoundary, "server_only");
  assert.equal(slot.interaction, port.interaction);
  assert.equal(slot.completionAuthority, port.completionAuthority);
  assert.equal(slot.gate.productionReady, false);
  assert.ok(slot.factoryModule.startsWith("lib/verification/adapters/"));
  assert.match(slot.factoryExport, /^create[A-Z][A-Za-z]+Adapter$/);
  assert.deepEqual(slot.factoryContract, {
    output: "VerificationProviderAdapterPort",
    trustDomainSource: "trusted_server_composition",
    validationBoundary: "defineVerificationProviderAdapter",
    productionComposition: "closed_until_gate"
  });
  assert.deepEqual(slot.requiredServerDependencies, EXPECTED_DEPENDENCIES[providerId]);
  assert.ok(slot.operationPersistence.includes("owner_subject_binding"));
  assert.ok(slot.operationPersistence.includes("provider_operation_reference"));
  assert.ok(slot.operationPersistence.includes("revocation_instant"));
  assert.ok(slot.evidencePersistence.includes("provider_event_identity"));
  assert.ok(slot.evidencePersistence.includes("evidence_digest"));
  assert.ok(slot.evidencePersistence.includes("revoke_and_dispute_state"));
  assert.ok(slot.revokeSemantics.providerAction.length > 20);
  assert.ok(slot.revokeSemantics.localAction.length > 20);
  assert.ok(slot.revokeSemantics.lateEventRule.includes("cannot"));
  assert.ok(slot.gate.requirements.length >= 4);
  assert.ok(Object.isFrozen(slot));
  assert.ok(Object.isFrozen(slot.requiredServerDependencies));
  assert.ok(Object.isFrozen(slot.factoryContract));
  assert.ok(Object.isFrozen(slot.operationPersistence));
  assert.ok(Object.isFrozen(slot.evidencePersistence));
  assert.ok(Object.isFrozen(slot.revokeSemantics));
  assert.ok(Object.isFrozen(slot.gate));
  assert.ok(Object.isFrozen(slot.gate.requirements));
}

assert.ok(
  PROVIDER_ADAPTER_FACTORY_SLOTS.plaid.operationPersistence.includes("encrypted_provider_custody"),
  "Plaid must name encrypted Item custody"
);
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.stripe_identity.operationPersistence.includes("provider_redaction_state"));
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.plaid.operationPersistence.includes("provider_report_reference"));
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.plaid.operationPersistence.includes("provider_removal_state"));
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.twilio_verify.operationPersistence.includes("delivery_attempt_history"));
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.checkr.operationPersistence.includes("adverse_action_workflow_state"));
assert.ok(PROVIDER_ADAPTER_FACTORY_SLOTS.checkr.operationPersistence.includes("retention_schedule_binding"));
assert.equal(
  PROVIDER_ADAPTER_FACTORY_SLOTS.checkr.gate.status,
  "policy_blocked_pending_legal_and_provider_approval"
);
assert.match(PROVIDER_ADAPTER_FACTORY_SLOTS.stripe_identity.revokeSemantics.providerAction, /not redaction/);
assert.match(PROVIDER_ADAPTER_FACTORY_SLOTS.plaid.revokeSemantics.providerAction, /does not delete existing Asset Reports/);
assert.match(PROVIDER_ADAPTER_FACTORY_SLOTS.twilio_verify.revokeSemantics.providerAction, /successful send as pending/);
assert.match(PROVIDER_ADAPTER_FACTORY_SLOTS.checkr.revokeSemantics.providerAction, /never counts as adverse-action completion/);

const sourcePath = fileURLToPath(
  new URL("../../lib/verification/provider-adapter-factory-slots.ts", import.meta.url)
);
const source = readFileSync(sourcePath, "utf8");
for (const forbidden of [
  "process.env",
  "Deno.env",
  "Bun.env",
  "fetch(",
  "new Stripe",
  "new Plaid",
  "new Twilio",
  "apiKey",
  "clientSecret",
  "accessToken"
]) {
  assert.equal(source.includes(forbidden), false, `factory slots must not contain ${forbidden}`);
}

console.log("provider-adapter-factory-slots-smoke: PASS");
