import assert from "node:assert/strict";

import { defineVerificationProviderAdapter, type ProviderVerifiedEvent, type VerificationProviderAdapterPort } from "../../lib/verification/provider-adapter-port.ts";
import { conformPortVerifiedProviderObservation, createProviderObservationReplayState, reduceProviderObservationReplay, type TrustedProviderClaimBindingSources } from "../../lib/verification/provider-adapter-conformance.ts";

const DIGEST = `sha256:${"a".repeat(64)}` as const;
const binding = (overrides: Partial<TrustedProviderClaimBindingSources> = {}): TrustedProviderClaimBindingSources => ({
  claimId: "claim_1", subjectId: "member_1", claimType: "government_id_document_authentic",
  purpose: "account_security", scope: "member:member_1:identity",
  consent: { basis: "affirmative_consent", capturedAt: "2026-08-15T11:00:00.000Z", version: "v1", evidenceRef: "consent_1" },
  ...overrides
});

function stripeAdapter(eventOverrides: Partial<ProviderVerifiedEvent> = {}): VerificationProviderAdapterPort {
  return defineVerificationProviderAdapter({
    version: "v1", providerId: "stripe_identity", trustDomain: "test", interaction: "hosted_redirect", completionAuthority: "signed_webhook",
    async begin(input) { return { kind: "hosted_redirect", operationRef: input.operationRef, url: "https://provider.invalid/start" }; },
    async verifyAndNormalize() {
      return { kind: "verified_observation", event: { providerId: "stripe_identity", trustDomain: "test", providerEventId: "evt_1", operationRef: "op_1", observationKind: "government_id_document_check", providerStatus: "verified", observedAt: "2026-08-15T12:00:00.000Z", evidenceDigest: DIGEST, ...eventOverrides } };
    },
    async revoke(operationRef) { return { operationRef, state: "revoked" }; }
  });
}

async function verifiedEvent(overrides: Partial<ProviderVerifiedEvent> = {}) {
  const result = await stripeAdapter(overrides).verifyAndNormalize({ kind: "webhook", rawBody: new Uint8Array([1]), headers: { signature: "signed" }, receivedAt: "2026-08-15T13:00:00.000Z" });
  if (result.kind !== "verified_observation") throw new Error("fixture failed");
  return result.event;
}

async function main() {
  const event = await verifiedEvent();
  const result = conformPortVerifiedProviderObservation(binding(), event, { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:00:00.000Z" });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("conformance fixture failed");
  assert.equal(result.value.claim.type, "government_id_document_authentic");
  assert.equal(result.value.claim.evaluation, "inconclusive");
  assert.equal(result.value.claim.provenance.method, "stripe_identity.document_result");

  const forged = { ...event } as ProviderVerifiedEvent;
  const forgedResult = conformPortVerifiedProviderObservation(binding(), forged, { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:00:00.000Z" });
  assert.equal(forgedResult.ok, false);
  if (!forgedResult.ok) assert.ok(forgedResult.issues.some((issue) => issue.code === "unverified_provider_event"));

  const kindMismatch = conformPortVerifiedProviderObservation(binding({ claimType: "selfie_matches_government_id" }), event, { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:00:00.000Z" });
  assert.equal(kindMismatch.ok, false);
  if (!kindMismatch.ok) assert.ok(kindMismatch.issues.some((issue) => issue.code === "operation_capability_mismatch"));

  const unknownKindEvent = await verifiedEvent({ observationKind: "caller_selected_capability" });
  const unknownKind = conformPortVerifiedProviderObservation(binding(), unknownKindEvent, { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:00:00.000Z" });
  assert.equal(unknownKind.ok, false);
  if (!unknownKind.ok) assert.ok(unknownKind.issues.some((issue) => issue.path === "observation.observationKind"));

  const unknownStatusEvent = await verifiedEvent({ providerStatus: "session_created" });
  const unknownStatus = conformPortVerifiedProviderObservation(binding(), unknownStatusEvent, { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:00:00.000Z" });
  assert.equal(unknownStatus.ok, false);
  if (!unknownStatus.ok) assert.ok(unknownStatus.issues.some((issue) => issue.path === "observation.providerStatus"));

  let replay = createProviderObservationReplayState();
  const accepted = reduceProviderObservationReplay(replay, result.value);
  assert.equal(accepted.ok && accepted.outcome, "accepted");
  if (!accepted.ok) throw new Error("replay fixture failed");
  replay = accepted.state;
  const idempotent = reduceProviderObservationReplay(replay, result.value);
  assert.equal(idempotent.ok && idempotent.outcome, "idempotent");

  const rebound = conformPortVerifiedProviderObservation(
    binding({ claimId: "claim_victim", subjectId: "victim_member" }),
    event,
    { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:01:00.000Z" }
  );
  assert.equal(rebound.ok, true);
  if (!rebound.ok) throw new Error("rebound fixture failed");
  const reboundReplay = reduceProviderObservationReplay(replay, rebound.value);
  assert.equal(reboundReplay.ok, false);
  if (!reboundReplay.ok) assert.ok(reboundReplay.issues.some((issue) => issue.code === "adapter_event_replay_conflict"));

  const otherOperationEvent = await verifiedEvent({ operationRef: "op_2" });
  const otherOperation = conformPortVerifiedProviderObservation(
    binding({ claimId: "claim_2", subjectId: "member_2", scope: "member:member_2:identity" }),
    otherOperationEvent,
    { evidenceRef: "evidence_1", receivedAt: "2026-08-15T13:02:00.000Z" }
  );
  assert.equal(otherOperation.ok, true);
  if (!otherOperation.ok) throw new Error("cross-operation fixture failed");
  const crossOperationReplay = reduceProviderObservationReplay(replay, otherOperation.value);
  assert.equal(crossOperationReplay.ok, false);
  if (!crossOperationReplay.ok) assert.ok(crossOperationReplay.issues.some((issue) => issue.code === "adapter_event_replay_conflict"));

  // Trust domain partitions event identity. Operation identity remains a
  // conflict field, so one provider event cannot be rebound to another op.
  assert.match(result.value.adapterEventKey, /^stripe_identity:test:evt_1$/);

  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(result.value.claim), true);
  console.log("Provider adapter conformance: PASS (port brand + exact observation tuple + replay closure)");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
