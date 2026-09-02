import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Executable entrypoint: node scripts/foreman/run-provider-composition-root-smoke.mjs
// The wrapper supplies the react-server condition required by the server-only marker.

import { PROVIDER_PORT_PROFILES, type ExternalVerificationProviderId, type VerificationProviderAdapterPort } from "../../lib/verification/provider-adapter-port.ts";
import { getVerificationProviderRuntime } from "../../lib/verification/provider-composition-root.ts";
import { composeTestVerificationProviderRoot } from "../../lib/verification/provider-composition-root.testing.ts";
import type {
  ResolvedProviderLifecycleAuthorization,
  ResolvedProviderLifecycleOperation,
  ResolvedProviderOperation
} from "../../lib/verification/provider-composition-root-internal.ts";

const RECEIVED_AT = "2026-08-15T13:00:00.000Z";
const DIGEST = `sha256:${"a".repeat(64)}` as const;
const IDS = ["stripe_identity", "plaid", "twilio_verify", "checkr"] as const;

type AdapterCalls = { begin: number; revoke: number; beginInput?: unknown };

function adapter(providerId: ExternalVerificationProviderId, calls?: AdapterCalls): VerificationProviderAdapterPort {
  const profile = PROVIDER_PORT_PROFILES[providerId];
  return {
    version: "v1", providerId, trustDomain: "test", ...profile,
    async begin(input) {
      if (calls) { calls.begin += 1; calls.beginInput = input; }
      const providerOperationRef = `${providerId}_provider_operation`;
      if (profile.interaction === "hosted_redirect") return { kind: "hosted_redirect", operationRef: input.operationRef, providerOperationRef, url: "https://provider.invalid/start" };
      if (profile.interaction === "embedded_link") return { kind: "embedded_link", operationRef: input.operationRef, providerOperationRef, clientToken: "transient" };
      if (profile.interaction === "challenge_code") return { kind: "challenge_code", operationRef: input.operationRef, providerOperationRef, maskedDestination: "***1212", expiresAt: RECEIVED_AT };
      return { kind: "hosted_invitation", operationRef: input.operationRef, providerOperationRef, deliveryState: "queued" };
    },
    async verifyAndNormalize(input) {
      const operationRef = "operationRef" in input ? input.operationRef : "op_identity";
      if (providerId !== "stripe_identity") return { kind: "operation_progress", operationRef, state: "pending" };
      return { kind: "verified_observation", event: { providerId, trustDomain: "test", providerEventId: "evt_1", operationRef, observationKind: "government_id_document_check", providerStatus: "verified", observedAt: "2026-08-15T12:00:00.000Z", evidenceDigest: DIGEST } };
    },
    async revoke(operationRef) { if (calls) calls.revoke += 1; return { operationRef, state: "revoked" }; }
  };
}

const operation = (overrides: Partial<ResolvedProviderOperation> = {}): ResolvedProviderOperation => ({
  operationId: "operation_1", operationRef: "op_identity", providerId: "stripe_identity", trustDomain: "test",
  claimId: "claim_1", subjectId: "member_1", claimType: "government_id_document_authentic",
  purpose: "account_security", scope: "member:member_1:identity",
  consent: { basis: "affirmative_consent", capturedAt: "2026-08-15T11:00:00.000Z", version: "v1", evidenceRef: "consent_1" },
  ...overrides
});

const lifecycleOperation = (overrides: Partial<ResolvedProviderLifecycleOperation> = {}): ResolvedProviderLifecycleOperation => ({
  operationId: "operation_1",
  operationRef: "op_identity",
  ownerSubjectId: "member_1",
  providerId: "stripe_identity",
  trustDomain: "test",
  capability: "government_id_document_check",
  subjectRef: "provider_subject_1",
  returnUrl: "http://localhost:3000/verification/return",
  deliveryTargetRef: null,
  ...overrides
});

const lifecycleAuthorization = (
  action: "begin" | "revoke",
  overrides: Partial<ResolvedProviderLifecycleAuthorization> = {}
): ResolvedProviderLifecycleAuthorization => ({
  authorizationId: `authorization_${action}`,
  operationId: "operation_1",
  ownerSubjectId: "member_1",
  actorPrincipalId: "principal_1",
  providerId: "stripe_identity",
  trustDomain: "test",
  capability: "government_id_document_check",
  action,
  status: "active",
  ...overrides
});

function root(overrides: Partial<Parameters<typeof composeTestVerificationProviderRoot>[0]> = {}) {
  const leases = new Set<string>();
  return composeTestVerificationProviderRoot({
    adapters: IDS.map((id) => adapter(id)),
    async resolveOperation() { return operation(); },
    async resolveEvidenceRef() { return "evidence_1"; },
    async resolveLifecycleOperation() { return lifecycleOperation(); },
    async resolveLifecycleAuthorization(context) { return lifecycleAuthorization(context.action); },
    async resolveLifecycleActor() { return { principalId: "principal_1" }; },
    async resolveVerifiedDeliveryTarget() { return null; },
    async acquireLifecycleLease(context) {
      const key = `${context.operationId}:${context.action}`;
      if (leases.has(key)) return { state: "unavailable" };
      leases.add(key);
      return { state: "acquired", leaseId: `lease:${key}` };
    },
    async finalizeLifecycleLease() { return { state: "recorded" }; },
    now() { return RECEIVED_AT; },
    ...overrides
  });
}

async function main() {
  const production = getVerificationProviderRuntime();
  assert.equal(production.configured, false);
  assert.deepEqual(await production.begin({ operationId: "operation_1", authorizationId: "authorization_begin" }), { ok: false, code: "not_configured" });
  assert.deepEqual(await production.consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array(), headers: {} }), { ok: false, code: "not_configured" });
  assert.deepEqual(await production.revoke({ operationId: "operation_1", authorizationId: "authorization_revoke", reason: "member_requested" }), { ok: false, code: "not_configured" });
  assert.equal("compose" in production, false);

  const runtime = root();
  assert.equal(Object.isFrozen(runtime), true);
  assert.deepEqual(Object.keys(runtime).sort(), ["begin", "consume", "revoke", "trustDomain", "version"]);
  assert.equal("adapterFor" in runtime, false);
  assert.equal("registry" in runtime, false);
  assert.equal("adapters" in runtime, false);
  assert.equal("resolveOperation" in runtime, false);

  const calls: AdapterCalls = { begin: 0, revoke: 0 };
  const outcomes: unknown[] = [];
  const lifecycleRuntime = root({
    adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? calls : undefined)),
    async finalizeLifecycleLease(outcome) {
      outcomes.push(outcome);
      return { state: "recorded" };
    }
  });
  const begun = await lifecycleRuntime.begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.equal(begun.ok && begun.kind, "hosted_redirect");
  assert.equal(begun.ok && begun.providerId, "stripe_identity");
  assert.equal(calls.begin, 1);
  assert.deepEqual(calls.beginInput, {
    operationRef: "op_identity",
    subjectRef: "provider_subject_1",
    returnUrl: "http://localhost:3000/verification/return"
  });
  assert.equal("subjectRef" in begun, false);
  assert.equal("authorizationId" in begun, false);
  assert.equal("operationRef" in begun, false);
  assert.equal("providerOperationRef" in begun, false);
  assert.deepEqual(outcomes[0], {
    leaseId: "lease:operation_1:begin",
    operationId: "operation_1",
    action: "begin",
    outcome: "provider_acknowledged",
    providerState: "hosted_redirect",
    providerOperationRef: "stripe_identity_provider_operation"
  });
  assert.equal(Object.isFrozen(outcomes[0]), true);

  const revoked = await lifecycleRuntime.revoke({ operationId: "operation_1", authorizationId: "authorization_revoke", reason: "member_requested" });
  assert.deepEqual(revoked, {
    ok: true,
    kind: "provider_operation_revoke_acknowledgement",
    providerId: "stripe_identity",
    operationId: "operation_1",
    providerOperationState: "revoked",
    claimState: "not_changed",
    evidenceState: "not_changed",
    providerDataDeletion: "not_asserted"
  });
  assert.equal(calls.revoke, 1);
  assert.equal("operationRef" in revoked, false);
  assert.equal("providerOperationRef" in revoked, false);
  assert.deepEqual(outcomes[1], {
    leaseId: "lease:operation_1:revoke",
    operationId: "operation_1",
    action: "revoke",
    outcome: "provider_acknowledged",
    providerState: "revoked",
    providerOperationRef: null
  });

  const repeatedBegin = await lifecycleRuntime.begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(repeatedBegin, { ok: false, code: "action_not_available" });
  const repeatedRevoke = await lifecycleRuntime.revoke({ operationId: "operation_1", authorizationId: "authorization_revoke", reason: "member_requested" });
  assert.deepEqual(repeatedRevoke, { ok: false, code: "action_not_available" });
  assert.equal(calls.begin, 1);
  assert.equal(calls.revoke, 1);

  for (const attack of [
    { async resolveLifecycleAuthorization() { return null; } },
    { async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin", { ownerSubjectId: "victim" }); } },
    { async resolveLifecycleActor() { return { principalId: "attacker" }; } },
    { async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin", { providerId: "plaid" }); } },
    { async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin", { trustDomain: "production" }); } },
    { async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin", { capability: "selfie_government_id_match" }); } },
    { async resolveLifecycleOperation() { return lifecycleOperation({ capability: "invented_capability" }); }, async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin", { capability: "invented_capability" }); } }
  ]) {
    const deniedCalls: AdapterCalls = { begin: 0, revoke: 0 };
    const denied = await root({ adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? deniedCalls : undefined)), ...attack }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
    assert.equal(denied.ok, false);
    assert.equal(deniedCalls.begin, 0, "authorization/capability failure must precede adapter call");
  }

  const callerInjectionCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const callerInjection = await root({ adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? callerInjectionCalls : undefined)) }).begin({
    operationId: "operation_1",
    authorizationId: "authorization_begin",
    providerId: "plaid",
    returnUrl: "https://attacker.invalid"
  } as never);
  assert.deepEqual(callerInjection, { ok: false, code: "invalid_request" });
  assert.equal(callerInjectionCalls.begin, 0);

  const openRedirectCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const openRedirect = await root({
    adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? openRedirectCalls : undefined)),
    async resolveLifecycleOperation() { return lifecycleOperation({ returnUrl: "https://attacker.invalid/steal" }); }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(openRedirect, { ok: false, code: "operation_mismatch" });
  assert.equal(openRedirectCalls.begin, 0);

  const deliveryAttackCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const deliveryAttack = await root({
    adapters: IDS.map((id) => adapter(id, id === "twilio_verify" ? deliveryAttackCalls : undefined)),
    async resolveLifecycleOperation() {
      return lifecycleOperation({
        operationRef: "op_phone",
        providerId: "twilio_verify",
        capability: "contact_channel_possession_check",
        returnUrl: null,
        deliveryTargetRef: "contact_1"
      });
    },
    async resolveLifecycleAuthorization() {
      return lifecycleAuthorization("begin", { providerId: "twilio_verify", capability: "contact_channel_possession_check" });
    },
    async resolveVerifiedDeliveryTarget() {
      return { targetRef: "contact_1", ownerSubjectId: "victim", deliveryTarget: "+15555550100" };
    }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(deliveryAttack, { ok: false, code: "not_authorized" });
  assert.equal(deliveryAttackCalls.begin, 0);

  const concurrentCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const concurrentRuntime = root({ adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? concurrentCalls : undefined)) });
  const concurrent = await Promise.all([
    concurrentRuntime.begin({ operationId: "operation_1", authorizationId: "authorization_begin" }),
    concurrentRuntime.begin({ operationId: "operation_1", authorizationId: "authorization_begin" })
  ]);
  assert.equal(concurrent.filter((result) => result.ok).length, 1);
  assert.equal(concurrent.filter((result) => !result.ok && result.code === "action_not_available").length, 1);
  assert.equal(concurrentCalls.begin, 1);

  const outcomeFailureCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const outcomeFailure = await root({
    adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? outcomeFailureCalls : undefined)),
    async finalizeLifecycleLease() { throw new Error("storage unavailable"); }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(outcomeFailure, { ok: false, code: "action_outcome_unrecorded" });
  assert.equal(outcomeFailureCalls.begin, 1);

  const providerRedirectCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const maliciousRedirectAdapter: VerificationProviderAdapterPort = {
    ...adapter("stripe_identity", providerRedirectCalls),
    async begin(input) { providerRedirectCalls.begin += 1; return { kind: "hosted_redirect", operationRef: input.operationRef, url: "https://attacker.invalid/start" }; }
  };
  const providerRedirect = await root({ adapters: [maliciousRedirectAdapter, ...IDS.slice(1).map((id) => adapter(id))] })
    .begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(providerRedirect, { ok: false, code: "provider_rejected" });
  assert.equal(providerRedirectCalls.begin, 1);
  const unrecordedRedirect = await root({
    adapters: [maliciousRedirectAdapter, ...IDS.slice(1).map((id) => adapter(id))],
    async finalizeLifecycleLease() { throw new Error("storage unavailable"); }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(unrecordedRedirect, { ok: false, code: "action_outcome_unrecorded" });

  const fullDestinationCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const fullDestinationAdapter: VerificationProviderAdapterPort = {
    ...adapter("twilio_verify", fullDestinationCalls),
    async begin(input) {
      fullDestinationCalls.begin += 1;
      return { kind: "challenge_code", operationRef: input.operationRef, maskedDestination: "+15555550100", expiresAt: RECEIVED_AT };
    }
  };
  const fullDestination = await root({
    adapters: [adapter("stripe_identity"), adapter("plaid"), fullDestinationAdapter, adapter("checkr")],
    async resolveLifecycleOperation() {
      return lifecycleOperation({ operationRef: "op_phone", providerId: "twilio_verify", capability: "contact_channel_possession_check", returnUrl: null, deliveryTargetRef: "contact_1" });
    },
    async resolveLifecycleAuthorization() {
      return lifecycleAuthorization("begin", { providerId: "twilio_verify", capability: "contact_channel_possession_check" });
    },
    async resolveVerifiedDeliveryTarget() {
      return { targetRef: "contact_1", ownerSubjectId: "member_1", deliveryTarget: "+15555550100" };
    }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(fullDestination, { ok: false, code: "provider_rejected" });
  assert.equal(fullDestinationCalls.begin, 1);
  const unrecordedFullDestination = await root({
    adapters: [adapter("stripe_identity"), adapter("plaid"), fullDestinationAdapter, adapter("checkr")],
    async resolveLifecycleOperation() {
      return lifecycleOperation({ operationRef: "op_phone", providerId: "twilio_verify", capability: "contact_channel_possession_check", returnUrl: null, deliveryTargetRef: "contact_1" });
    },
    async resolveLifecycleAuthorization() {
      return lifecycleAuthorization("begin", { providerId: "twilio_verify", capability: "contact_channel_possession_check" });
    },
    async resolveVerifiedDeliveryTarget() {
      return { targetRef: "contact_1", ownerSubjectId: "member_1", deliveryTarget: "+15555550100" };
    },
    async finalizeLifecycleLease() { throw new Error("storage unavailable"); }
  }).begin({ operationId: "operation_1", authorizationId: "authorization_begin" });
  assert.deepEqual(unrecordedFullDestination, { ok: false, code: "action_outcome_unrecorded" });

  const revokeDeniedCalls: AdapterCalls = { begin: 0, revoke: 0 };
  const revokeDenied = await root({
    adapters: IDS.map((id) => adapter(id, id === "stripe_identity" ? revokeDeniedCalls : undefined)),
    async resolveLifecycleAuthorization() { return lifecycleAuthorization("begin"); }
  }).revoke({ operationId: "operation_1", authorizationId: "authorization_revoke", reason: "member_requested" });
  assert.deepEqual(revokeDenied, { ok: false, code: "operation_mismatch" });
  assert.equal(revokeDeniedCalls.revoke, 0);

  const success = await runtime.consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array([1]), headers: { "stripe-signature": "signed" } });
  assert.equal(success.ok && success.kind, "conformed_observation");
  if (success.ok && success.kind === "conformed_observation") {
    assert.equal(success.value.claim.subjectId, "member_1");
    assert.equal(success.value.claim.type, "government_id_document_authentic");
    assert.equal(success.value.claim.evaluation, "inconclusive");
  }

  const progress = await root({
    async resolveOperation() {
      return operation({
        operationId: "operation_plaid",
        operationRef: "op_plaid",
        providerId: "plaid",
        claimType: "funds_threshold_observed",
        purpose: "payment_risk"
      });
    }
  }).consume("plaid", { kind: "client_handoff", operationRef: "op_plaid", transientToken: "transient" });
  assert.deepEqual(progress, { ok: true, kind: "operation_progress", operationId: "operation_plaid", state: "pending" });
  assert.equal("operationRef" in progress, false);

  assert.throws(() => root({ adapters: IDS.slice(0, -1).map((id) => adapter(id)) }), /complete test-domain adapter set/);
  assert.throws(() => root({ adapters: [adapter("stripe_identity"), adapter("plaid"), adapter("twilio_verify"), adapter("plaid")] }), /Duplicate/);
  assert.throws(() => root({ adapters: IDS.map((id) => ({ ...adapter(id), trustDomain: id === "checkr" ? "production" : "test" })) }), /complete test-domain adapter set/);
  const missing = await root({ async resolveOperation() { return null; } }).consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array([1]), headers: {} });
  assert.equal(!missing.ok && missing.code, "operation_not_found");
  const orphanProgress = await root({ async resolveOperation() { return null; } }).consume("plaid", { kind: "client_handoff", operationRef: "orphan_op", transientToken: "transient" });
  assert.equal(!orphanProgress.ok && orphanProgress.code, "operation_not_found");
  const capabilityAttack = await root({ async resolveOperation() { return operation({ subjectId: "victim", claimType: "funds_threshold_observed" }); } }).consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array([1]), headers: {} });
  assert.equal(!capabilityAttack.ok && capabilityAttack.code, "conformance_rejected");
  const domainAttack = await root({ async resolveOperation() { return operation({ trustDomain: "production" }); } }).consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array([1]), headers: {} });
  assert.equal(!domainAttack.ok && domainAttack.code, "operation_not_found");
  const timeAttack = await root({ now() { return "caller-time"; } }).consume("stripe_identity", { kind: "webhook", rawBody: new Uint8Array([1]), headers: {} });
  assert.equal(!timeAttack.ok && timeAttack.code, "provider_rejected");

  const source = await readFile("lib/verification/provider-composition-root.ts", "utf8");
  assert.match(source, /^import "server-only";/);
  assert.doesNotMatch(source, /process\.env|fetch\(|console\.|api[_-]?key|client[_-]?secret|private[_-]?key/i);
  const fs = await import("node:fs/promises");
  for (const directory of ["app", "components", "lib"] as const) {
    const paths = await fs.readdir(directory, { recursive: true });
    const files = paths.filter((path) => /\.(ts|tsx)$/.test(path)).filter((path) => {
      const normalized = `${directory}/${path}`.replaceAll("\\", "/");
      return ![
        "lib/verification/provider-composition-root.ts",
        "lib/verification/provider-composition-root-internal.ts",
        "lib/verification/provider-composition-root.testing.ts",
        "lib/verification/provider-adapter-conformance.ts",
        "lib/verification/provider-adapter-port.ts",
        "lib/verification/provider-adapter-factory-slots.ts",
        "lib/verification/provider-adapter-factory-acceptance.ts",
        "lib/verification/adapters/plaid-adapter.ts",
        "lib/verification/adapters/stripe-identity-adapter.ts",
        "lib/verification/adapters/twilio-verify-adapter.ts"
      ].includes(normalized);
    });
    for (const candidate of await Promise.all(files.map((path) => readFile(`${directory}/${path}`, "utf8")))) {
      assert.doesNotMatch(candidate, /provider-adapter-conformance|provider-adapter-factory-acceptance|provider-composition-root(?:-internal|\.testing)|defineVerificationProviderAdapter/);
    }
  }
  console.log("Verification provider composition root: PASS");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
