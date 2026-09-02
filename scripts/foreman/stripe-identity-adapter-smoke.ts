import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createStripeIdentityVerificationAdapter } from "../../lib/verification/adapters/stripe-identity-adapter.ts";
import { isPortVerifiedProviderEvent } from "../../lib/verification/provider-adapter-port.ts";

const SESSION = "vs_12345678";
const EVENT = "evt_12345678";
const INSTANT = "2026-08-20T22:00:00.000Z";
const calls: string[] = [];

const dependencies = {
  trustDomain: "test" as const,
  client: {
    async createDocumentSession(input: { operationRef: string; returnUrl: string }) {
      calls.push(`begin:${input.operationRef}:${input.returnUrl}`);
      return { sessionId: SESSION, status: "requires_input" as const, url: "https://verify.stripe.com/start", createdAt: INSTANT, livemode: false };
    },
    async cancelSession(input: { sessionId: string }) {
      calls.push(`cancel:${input.sessionId}`);
      return { sessionId: input.sessionId, status: "canceled" as const };
    }
  },
  async verifyWebhook(rawBody: Uint8Array, headers: Readonly<Record<string, string>>) {
    calls.push(`verify:${rawBody.length}:${headers["stripe-signature"]}`);
    return {
      eventId: EVENT,
      eventType: "identity.verification_session.verified",
      createdAt: INSTANT,
      sessionId: SESSION,
      status: "verified" as const,
      livemode: false
    };
  },
  async resolveInternalOperationRef(sessionId: string) {
    return sessionId === SESSION ? "op_identity_1" : null;
  },
  async resolveProviderSessionId(operationRef: string) {
    return operationRef === "op_identity_1" ? SESSION : null;
  }
};

const adapter = createStripeIdentityVerificationAdapter(dependencies);
assert.equal(adapter.providerId, "stripe_identity");
assert.equal(adapter.trustDomain, "test");
assert.equal(adapter.interaction, "hosted_redirect");
assert.equal(adapter.completionAuthority, "signed_webhook");

const begun = await adapter.begin({ operationRef: "op_identity_1", subjectRef: "member_1", returnUrl: "https://werkles.com/dashboard/crucible" });
assert.deepEqual(begun, { kind: "hosted_redirect", operationRef: "op_identity_1", providerOperationRef: SESSION, url: "https://verify.stripe.com/start" });

const consumed = await adapter.verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1, 2]), headers: { "stripe-signature": "signed" }, receivedAt: INSTANT });
assert.equal(consumed.kind, "verified_observation");
if (consumed.kind === "verified_observation") {
  assert.equal(isPortVerifiedProviderEvent(consumed.event), true);
  assert.equal(consumed.event.operationRef, "op_identity_1");
  assert.equal(consumed.event.observationKind, "government_id_document_check");
  assert.equal(consumed.event.providerStatus, "verified");
  assert.match(consumed.event.evidenceDigest, /^sha256:[0-9a-f]{64}$/);
  assert.doesNotMatch(JSON.stringify(consumed.event), /member_1|stripe-signature|rawBody|client_secret|report/i);
}

assert.deepEqual(await adapter.revoke("op_identity_1"), { operationRef: "op_identity_1", state: "revoked" });
assert.deepEqual(calls, [
  "begin:op_identity_1:https://werkles.com/dashboard/crucible",
  "verify:2:signed",
  `cancel:${SESSION}`
]);

assert.throws(() => createStripeIdentityVerificationAdapter({ ...dependencies, trustDomain: "production" }), /production gate is closed/);
await assert.rejects(
  createStripeIdentityVerificationAdapter({ ...dependencies, trustDomain: "test", client: { ...dependencies.client, async createDocumentSession() { return { sessionId: SESSION, status: "requires_input", url: "javascript:alert(1)", createdAt: INSTANT, livemode: false } as const; } } })
    .begin({ operationRef: "op_identity_1", subjectRef: "member_1", returnUrl: "https://werkles.com/return" }),
  /session start is invalid/
);
await assert.rejects(
  createStripeIdentityVerificationAdapter({ ...dependencies, verifyWebhook: async () => ({ eventId: EVENT, eventType: "identity.verification_session.canceled", createdAt: INSTANT, sessionId: SESSION, status: "verified" as const, livemode: false }) })
    .verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: { "stripe-signature": "signed" }, receivedAt: INSTANT }),
  /type and status differ/
);

const source = readFileSync("lib/verification/adapters/stripe-identity-adapter.ts", "utf8");
assert.doesNotMatch(source, /process\.env|fetch\(|console\.|client_secret|verification_report|FileUpload/i);
assert.match(source, /createStripeIdentityVerificationAdapter/);
assert.match(source, /providerOperationRef: started\.sessionId/);
assert.match(source, /fact\.eventType !== expectedType/);

console.log("Stripe Identity test adapter contract: PASS");
