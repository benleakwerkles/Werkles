import assert from "node:assert/strict";

import {
  PROVIDER_PORT_PROFILES,
  createVerificationProviderRegistry,
  defineVerificationProviderAdapter,
  type VerificationProviderAdapterPort
} from "../../lib/verification/provider-adapter-port.ts";

function inertAdapter(
  providerId: VerificationProviderAdapterPort["providerId"]
): VerificationProviderAdapterPort {
  const profile = PROVIDER_PORT_PROFILES[providerId];
  return {
    version: "v1",
    providerId,
    trustDomain: "test",
    ...profile,
    async begin(input) {
      if (profile.interaction === "hosted_redirect") {
        return {
          kind: "hosted_redirect",
          operationRef: input.operationRef,
          providerOperationRef: `${providerId}_provider_operation`,
          url: "https://provider.invalid/start"
        };
      }
      if (profile.interaction === "embedded_link") {
        return { kind: "embedded_link", operationRef: input.operationRef, clientToken: "transient" };
      }
      if (profile.interaction === "challenge_code") {
        return {
          kind: "challenge_code",
          operationRef: input.operationRef,
          maskedDestination: "***-***-1212",
          expiresAt: "2026-08-15T13:10:00.000Z"
        };
      }
      return { kind: "hosted_invitation", operationRef: input.operationRef, deliveryState: "queued" };
    },
    async verifyAndNormalize(input) {
      const operationRef = "operationRef" in input ? input.operationRef : "resolved_from_verified_webhook";
      return { kind: "operation_progress", operationRef, state: "pending" };
    },
    async revoke(operationRef) {
      return { operationRef, state: "revoked" };
    }
  };
}

async function main() {
  const adapters = (["stripe_identity", "plaid", "twilio_verify", "checkr"] as const).map((id) =>
    defineVerificationProviderAdapter(inertAdapter(id))
  );
  const registry = createVerificationProviderRegistry(adapters);
  assert.equal(registry.size, 4);
  assert.equal(Object.isFrozen(registry.get("plaid")), true);
  assert.equal(registry.get("twilio_verify")?.interaction, "challenge_code");
  const begun = await registry.get("stripe_identity")?.begin({ operationRef: "op_1", subjectRef: "subject_1" });
  assert.equal(begun?.providerOperationRef, "stripe_identity_provider_operation");
  assert.equal(Object.isFrozen(begun), true);

  assert.throws(
    () =>
      defineVerificationProviderAdapter({
        ...inertAdapter("plaid"),
        interaction: "hosted_redirect"
      } as VerificationProviderAdapterPort),
    /profile mismatch/
  );
  assert.throws(
    () => createVerificationProviderRegistry([inertAdapter("plaid"), inertAdapter("plaid")]),
    /Duplicate/
  );
  assert.equal("set" in registry, false);
  assert.equal("clear" in registry, false);
  assert.equal("forEach" in registry, false);

  const badBegin = defineVerificationProviderAdapter({
    ...inertAdapter("plaid"),
    async begin(input) {
      return {
        kind: "hosted_redirect",
        operationRef: `${input.operationRef}_wrong`,
        url: "javascript:alert(1)",
        accessToken: "SECRET"
      } as unknown as Awaited<ReturnType<VerificationProviderAdapterPort["begin"]>>;
    }
  });
  await assert.rejects(
    () => badBegin.begin({ operationRef: "op_1", subjectRef: "subject_1" }),
    /invalid fields|kind mismatch|operation mismatch/
  );

  const blankProviderOperation = defineVerificationProviderAdapter({
    ...inertAdapter("stripe_identity"),
    async begin(input) {
      return {
        kind: "hosted_redirect",
        operationRef: input.operationRef,
        providerOperationRef: "   ",
        url: "https://provider.invalid/start"
      };
    }
  });
  await assert.rejects(
    () => blankProviderOperation.begin({ operationRef: "op_1", subjectRef: "subject_1" }),
    /provider-created operation reference/
  );

  const badConsume = defineVerificationProviderAdapter({
    ...inertAdapter("plaid"),
    async verifyAndNormalize() {
      return {
        kind: "verified_observation",
        event: {
          providerId: "checkr",
          trustDomain: "production",
          providerEventId: "event_1",
          operationRef: "victim_operation",
          observationKind: "funds_threshold_observation",
          providerStatus: "passed",
          observedAt: "2026-02-31T00:00:00.000Z",
          evidenceDigest: "sha256:not-a-digest",
          reportPayload: { ssn: "must-not-cross" }
        }
      } as unknown as Awaited<ReturnType<VerificationProviderAdapterPort["verifyAndNormalize"]>>;
    }
  });
  await assert.rejects(
    () =>
      badConsume.verifyAndNormalize({
        kind: "webhook",
        rawBody: new Uint8Array([1]),
        headers: { "x-signature": "present" },
        receivedAt: "2026-08-15T13:00:00.000Z"
      }),
    /invalid fields|identity mismatch|trust-domain mismatch|invalid/
  );

  const mutableSource = inertAdapter("plaid") as VerificationProviderAdapterPort & {
    providerId: VerificationProviderAdapterPort["providerId"];
    trustDomain: VerificationProviderAdapterPort["trustDomain"];
    verifyAndNormalize: VerificationProviderAdapterPort["verifyAndNormalize"];
  };
  const capturedAdapter = defineVerificationProviderAdapter(mutableSource);
  mutableSource.providerId = "checkr";
  mutableSource.trustDomain = "production";
  mutableSource.verifyAndNormalize = async () => ({
    kind: "verified_observation",
    event: {
      providerId: "checkr",
      trustDomain: "production",
      providerEventId: "event_mutated",
      operationRef: "operation_mutated",
      observationKind: "employment_background_screening_completed",
      providerStatus: "completed",
      observedAt: "2026-08-15T13:00:00.000Z",
      evidenceDigest: `sha256:${"a".repeat(64)}`
    }
  });
  assert.equal(capturedAdapter.providerId, "plaid");
  assert.equal(capturedAdapter.trustDomain, "test");
  const capturedProgress = await capturedAdapter.verifyAndNormalize({
    kind: "client_handoff",
    operationRef: "operation_1",
    transientToken: "transient",
    receivedAt: "2026-08-15T13:00:00.000Z"
  });
  assert.deepEqual(capturedProgress, {
    kind: "operation_progress",
    operationRef: "operation_1",
    state: "pending"
  });

  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("lib/verification/provider-adapter-port.ts", "utf8")
  );
  assert.doesNotMatch(source, /process\.env|fetch\(|console\.|accessToken|accountNumber|reportPayload/);
  assert.match(source, /carries no subject, claim, purpose, scope/);

  console.log("Verification provider adapter port: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
