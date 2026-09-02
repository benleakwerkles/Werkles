import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CRUCIBLE_PROVIDER_READINESS } from "../../lib/crucible-provider-readiness.ts";
import {
  TECH_STACK_SLOT_IDS,
  techStackSlot
} from "../../lib/integrations/tech-stack-slot-catalog.ts";
import {
  buildOperatorTechStackDiagnosticSnapshot,
  type OperatorTechStackState
} from "../../lib/integrations/operator-tech-stack-diagnostics.ts";

const snapshot = buildOperatorTechStackDiagnosticSnapshot();

assert.equal(snapshot.scope, "static_repository_readiness");
assert.equal(snapshot.runtimeInspected, false);
assert.equal(snapshot.secretsInspected, false);
assert.equal(snapshot.providersContacted, false);
assert.equal(snapshot.productionLive, false);
assert.equal(snapshot.slots.length, TECH_STACK_SLOT_IDS.length);
assert.equal(Object.isFrozen(snapshot), true);
assert.equal(Object.isFrozen(snapshot.slots), true);

const expectedStates: Record<string, OperatorTechStackState> = {
  supabase_auth: "code_path_present",
  supabase_member_data: "foundation_only",
  supabase_storage: "not_connected",
  stripe_billing: "code_path_present",
  stripe_identity: "code_path_present",
  plaid: "sandbox_scaffold",
  twilio_verify: "foundation_only",
  checkr: "policy_blocked"
};

for (const slot of snapshot.slots) {
  assert.equal(slot.state, expectedStates[slot.id]);
  assert.equal(slot.productionLive, false);
  assert.equal(slot.runtimeAvailability, "unknown");
  assert.equal(slot.actionEnabled, false);
  assert.equal(slot.blocker, techStackSlot(slot.id).blocker);
  assert.ok(slot.blocker.length > 10);
  assert.equal(Object.isFrozen(slot), true);
  assert.equal(Object.isFrozen(slot.routes), true);
  assert.equal(Object.isFrozen(slot.providerChecks), true);
}

const plaid = snapshot.slots.find((slot) => slot.id === "plaid");
assert.ok(plaid);
assert.match(plaid.stateDetail, /not proof storage or production readiness/i);
assert.deepEqual(
  plaid.providerChecks.map((check) => [check.checkKey, check.state]),
  [
    ["funds", "sandbox_scaffold"],
    ["funds_reverification", "not_connected"]
  ]
);
assert.ok(plaid.providerChecks.every((check) => check.runtimeAvailability === "unknown"));
assert.ok(plaid.providerChecks.every((check) => check.actionEnabled === false));

const checkr = snapshot.slots.find((slot) => slot.id === "checkr");
assert.ok(checkr);
assert.ok(checkr.providerChecks.every((check) => check.state === "policy_blocked"));
assert.ok(checkr.providerChecks.every((check) => check.productionLive === false));

assert.deepEqual(
  snapshot.unassignedProviderChecks.map((check) => check.checkKey).sort(),
  ["employment", "license", "reference"]
);
assert.ok(snapshot.unassignedProviderChecks.every((check) => check.state === "not_connected"));

assert.equal(Object.isFrozen(CRUCIBLE_PROVIDER_READINESS), true);
assert.ok(Object.values(CRUCIBLE_PROVIDER_READINESS).every(Object.isFrozen));
assert.throws(() => {
  (CRUCIBLE_PROVIDER_READINESS.identity as { readout: string }).readout = "forged ready";
}, TypeError);
assert.notEqual(CRUCIBLE_PROVIDER_READINESS.identity.readout, "forged ready");

const source = readFileSync("lib/integrations/operator-tech-stack-diagnostics.ts", "utf8");
for (const forbidden of [
  "process.env",
  "fetch(",
  "console.",
  "access_token",
  "client_secret",
  "api_key"
]) {
  assert.equal(source.includes(forbidden), false, `diagnostic source contains forbidden token: ${forbidden}`);
}

const serverWrapper = readFileSync(
  "lib/integrations/operator-tech-stack-diagnostics.server.ts",
  "utf8"
);
assert.match(serverWrapper, /import "server-only"/);
assert.doesNotMatch(serverWrapper, /Response|NextResponse|fetch\(/);

function sourceFilesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesBelow(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

for (const file of [...sourceFilesBelow("app"), ...sourceFilesBelow("components")]) {
  assert.doesNotMatch(
    readFileSync(file, "utf8"),
    /operator-tech-stack-diagnostics/,
    `operator diagnostics must not be imported by public or member UI source: ${file}`
  );
}

console.log("Werkles operator tech-stack diagnostics: PASS");
