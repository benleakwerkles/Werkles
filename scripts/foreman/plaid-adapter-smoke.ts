import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createPlaidVerificationAdapter } from "../../lib/verification/adapters/plaid-adapter.ts";

// Run with: $env:NODE_OPTIONS='--conditions=react-server'; npx --yes tsx scripts/foreman/plaid-adapter-smoke.ts
async function main() {
const now = "2026-08-20T20:00:00.000Z";
const expiry = "2026-08-20T20:30:00.000Z";
const eventId = `plaid_webhook:${"a".repeat(64)}`;
const itemId = "item_sandbox_001";
const reportId = "asset_report_001";
const calls: string[] = [];

function dependencies(overrides: Record<string, unknown> = {}) {
  const base = {
    trustDomain: "test" as const,
    client: {
      async createAssetsLinkToken(input: Readonly<{ operationRef: string; subjectRef: string }>) {
        calls.push(`begin:${input.operationRef}:${input.subjectRef}`);
        return { linkToken: "link-sandbox-test-token", expiration: expiry, environment: "sandbox" as const };
      },
      async exchangeAndCreateAssetSnapshot(input: Readonly<{ operationRef: string; transientToken: string }>) {
        calls.push(`handoff:${input.operationRef}:${input.transientToken.length}`);
        return { operationRef: input.operationRef, itemId, assetReportId: reportId, status: "pending" as const, createdAt: now, environment: "sandbox" as const };
      },
      async evaluateAndDisposeAssetSnapshot(input: Readonly<{ operationRef: string; assetReportId: string }>) {
        calls.push(`evaluate:${input.operationRef}:${input.assetReportId}`);
        return { assetReportId: input.assetReportId, status: "threshold_met" as const, observedAt: now, environment: "sandbox" as const, itemRemoved: true as const, reportRemoved: true as const };
      },
      async removeItem(input: Readonly<{ itemId: string }>) {
        calls.push(`remove-item:${input.itemId}`);
        return { id: input.itemId, state: "removed" as const };
      },
      async removeAssetReport(input: Readonly<{ assetReportId: string }>) {
        calls.push(`remove-report:${input.assetReportId}`);
        return { id: input.assetReportId, state: "removed" as const };
      }
    },
    async verifyWebhook() {
      calls.push("verify-webhook");
      return { eventId, webhookType: "ASSETS" as const, webhookCode: "PRODUCT_READY" as const, assetReportId: reportId, reportType: "FAST" as const, environment: "sandbox" as const, verifiedAt: now };
    },
    async resolveInternalOperationRef(value: string) {
      calls.push(`resolve-operation:${value}`);
      return value === reportId ? "operation_001" : null;
    },
    async resolveProviderCustody(operationRef: string) {
      calls.push(`resolve-custody:${operationRef}`);
      return operationRef === "operation_001" ? { itemId, assetReportId: reportId } : null;
    }
  };
  return Object.assign(base, overrides);
}

const adapter = createPlaidVerificationAdapter(dependencies());
assert.equal(adapter.providerId, "plaid");
assert.equal(adapter.trustDomain, "test");
assert.equal(adapter.interaction, "embedded_link");
assert.equal(adapter.completionAuthority, "signed_webhook");

const begun = await adapter.begin({ operationRef: "operation_001", subjectRef: "member_001" });
assert.deepEqual(begun, {
  kind: "embedded_link",
  operationRef: "operation_001",
  clientToken: "link-sandbox-test-token",
  expiresAt: expiry
});

const handoff = await adapter.verifyAndNormalize({
  kind: "client_handoff",
  operationRef: "operation_001",
  transientToken: "public-sandbox-test-token",
  receivedAt: now
});
assert.deepEqual(handoff, { kind: "operation_progress", operationRef: "operation_001", state: "connected" });
assert.equal(JSON.stringify(handoff).includes("public-sandbox-test-token"), false);
assert.equal(JSON.stringify(handoff).includes(reportId), false);

const observation = await adapter.verifyAndNormalize({
  kind: "webhook",
  rawBody: new TextEncoder().encode('{"webhook_type":"ASSETS"}'),
  headers: { "plaid-verification": "verified-by-injected-boundary" },
  receivedAt: now
});
assert.equal(observation.kind, "verified_observation");
if (observation.kind !== "verified_observation") throw new Error("Expected a verified observation");
assert.equal(observation.event.observationKind, "funds_threshold_observation");
assert.equal(observation.event.providerStatus, "threshold_met");
assert.equal(observation.event.operationRef, "operation_001");
assert.match(observation.event.evidenceDigest, /^sha256:[0-9a-f]{64}$/);
assert.equal(JSON.stringify(observation).includes("balance"), false);
assert.equal(JSON.stringify(observation).includes("transaction"), false);
assert.deepEqual(calls.slice(-3), ["verify-webhook", `resolve-operation:${reportId}`, `evaluate:operation_001:${reportId}`]);

assert.deepEqual(await adapter.revoke("operation_001"), { operationRef: "operation_001", state: "revoked" });
assert.deepEqual(calls.slice(-3), [`resolve-custody:operation_001`, `remove-item:${itemId}`, `remove-report:${reportId}`]);

const errorAdapter = createPlaidVerificationAdapter(dependencies({
  async verifyWebhook() {
    return { eventId, webhookType: "ASSETS" as const, webhookCode: "ERROR" as const, assetReportId: reportId, reportType: null, environment: "sandbox" as const, verifiedAt: now };
  }
}));
const beforeError = calls.length;
assert.deepEqual(await errorAdapter.verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: {}, receivedAt: now }), {
  kind: "operation_progress",
  operationRef: "operation_001",
  state: "cancelled"
});
assert.deepEqual(calls.slice(beforeError), [
  `resolve-operation:${reportId}`,
  `resolve-custody:operation_001`,
  `remove-item:${itemId}`,
  `remove-report:${reportId}`
]);

const fullAdapter = createPlaidVerificationAdapter(dependencies({
  async verifyWebhook() {
    return { eventId, webhookType: "ASSETS" as const, webhookCode: "PRODUCT_READY" as const, assetReportId: reportId, reportType: "FULL" as const, environment: "sandbox" as const, verifiedAt: now };
  }
}));
const beforeFull = calls.length;
assert.deepEqual(
  await fullAdapter.verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: {}, receivedAt: now }),
  { kind: "operation_progress", operationRef: "operation_001", state: "cancelled" }
);
assert.deepEqual(calls.slice(beforeFull), [
  `resolve-operation:${reportId}`,
  `resolve-custody:operation_001`,
  `remove-item:${itemId}`,
  `remove-report:${reportId}`
]);

const mismatchAdapter = createPlaidVerificationAdapter(dependencies({
  async verifyWebhook() {
    return { eventId, webhookType: "ASSETS" as const, webhookCode: "PRODUCT_READY" as const, assetReportId: reportId, reportType: "FAST" as const, environment: "production" as const, verifiedAt: now };
  }
}));
await assert.rejects(
  mismatchAdapter.verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: {}, receivedAt: now }),
  /environment does not match/
);

const staleWebhookAdapter = createPlaidVerificationAdapter(dependencies({
  async verifyWebhook() {
    return { eventId, webhookType: "ASSETS" as const, webhookCode: "PRODUCT_READY" as const, assetReportId: reportId, reportType: "FAST" as const, environment: "sandbox" as const, verifiedAt: "2026-08-20T19:54:59.000Z" };
  }
}));
await assert.rejects(
  staleWebhookAdapter.verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: {}, receivedAt: now }),
  /outside the receipt window/
);

const futureHandoffDependencies = dependencies();
futureHandoffDependencies.client.exchangeAndCreateAssetSnapshot = async (input) => ({
  operationRef: input.operationRef,
  itemId,
  assetReportId: reportId,
  status: "pending",
  createdAt: "2026-08-20T20:00:01.000Z",
  environment: "sandbox"
});
const futureHandoffAdapter = createPlaidVerificationAdapter(futureHandoffDependencies);
await assert.rejects(
  futureHandoffAdapter.verifyAndNormalize({ kind: "client_handoff", operationRef: "operation_001", transientToken: "public-sandbox-test-token", receivedAt: now }),
  /cannot follow its receipt time/
);

const partialRemovalAdapter = createPlaidVerificationAdapter(dependencies({
  client: {
    ...dependencies().client,
    async removeAssetReport(input: Readonly<{ assetReportId: string }>) {
      return { id: input.assetReportId, state: "failed" as never };
    }
  }
}));
await assert.rejects(partialRemovalAdapter.revoke("operation_001"), /Asset Report removal is invalid/);

assert.throws(
  () => createPlaidVerificationAdapter({ ...dependencies(), trustDomain: "production" }),
  /production gate is closed/
);

const mutable = dependencies();
const captured = createPlaidVerificationAdapter(mutable);
mutable.client.createAssetsLinkToken = async () => ({ linkToken: "mutated-sandbox-token", expiration: expiry, environment: "sandbox" });
const capturedBegin = await captured.begin({ operationRef: "operation_002", subjectRef: "member_002" });
assert.equal(capturedBegin.kind, "embedded_link");
if (capturedBegin.kind !== "embedded_link") throw new Error("Expected embedded Link");
assert.equal(capturedBegin.clientToken, "link-sandbox-test-token");

const source = readFileSync(resolve(process.cwd(), "lib/verification/adapters/plaid-adapter.ts"), "utf8");
assert.doesNotMatch(source, /process\.env|\bfetch\s*\(|console\.|PLAID_SECRET|PLAID_CLIENT_ID/);
assert.doesNotMatch(source, /reportPayload|accountNumber|routingNumber|socialSecurityNumber/);

console.log("PASS: Plaid test adapter keeps Link, signed readiness, narrow threshold evaluation, and disposal separate.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
