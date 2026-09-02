import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createTwilioVerifyAdapter,
  type TwilioVerifyAdapterDependencies,
  type TwilioVerifyChecked,
  type TwilioVerifyServerClient
} from "../../lib/verification/adapters/twilio-verify-adapter.ts";

const SID = `VE${"a".repeat(32)}`;
const CREATED_AT = "2026-08-20T22:00:00.000Z";
const CHECKED_AT = "2026-08-20T22:03:00.000Z";

function fixture(status: TwilioVerifyChecked["status"] = "approved") {
  const calls = { starts: [] as unknown[], checks: [] as unknown[], cancels: [] as unknown[] };
  const client: TwilioVerifyServerClient = {
    async startSmsVerification(input) {
      calls.starts.push(input);
      return { verificationSid: SID, status: "pending", createdAt: CREATED_AT };
    },
    async checkVerification(input) {
      calls.checks.push(input);
      return { verificationSid: SID, status, checkedAt: CHECKED_AT };
    },
    async cancelVerification(input) {
      calls.cancels.push(input);
      return { verificationSid: SID, status: "canceled" };
    }
  };
  const dependencies: TwilioVerifyAdapterDependencies = {
    trustDomain: "test",
    client,
    async resolveProviderOperationRef(operationRef) {
      return operationRef === "op_phone" ? SID : null;
    }
  };
  return { calls, client, dependencies };
}

async function main() {
  const base = fixture();
  const adapter = createTwilioVerifyAdapter(base.dependencies);
  assert.equal(adapter.providerId, "twilio_verify");
  assert.equal(adapter.trustDomain, "test");

  const begun = await adapter.begin({
    operationRef: "op_phone",
    subjectRef: "member_1",
    deliveryTarget: "+15555550100"
  });
  assert.deepEqual(begun, {
    kind: "challenge_code",
    operationRef: "op_phone",
    providerOperationRef: SID,
    maskedDestination: "••• ••• 0100",
    expiresAt: "2026-08-20T22:10:00.000Z"
  });
  assert.deepEqual(base.calls.starts, [{ destination: "+15555550100" }]);
  assert.equal(Object.isFrozen(begun), true);

  const approved = await adapter.verifyAndNormalize({
    kind: "challenge_response",
    operationRef: "op_phone",
    code: "123456",
    receivedAt: CHECKED_AT
  });
  assert.equal(approved.kind, "verified_observation");
  if (approved.kind === "verified_observation") {
    assert.equal(approved.event.observationKind, "contact_channel_possession_check");
    assert.equal(approved.event.providerStatus, "approved");
    assert.match(approved.event.evidenceDigest, /^sha256:[0-9a-f]{64}$/);
    assert.equal("destination" in approved.event, false);
    assert.equal("code" in approved.event, false);
  }
  assert.deepEqual(base.calls.checks, [{ verificationSid: SID, code: "123456" }]);

  const pending = await createTwilioVerifyAdapter(fixture("pending").dependencies).verifyAndNormalize({
    kind: "challenge_response", operationRef: "op_phone", code: "000000", receivedAt: CHECKED_AT
  });
  assert.deepEqual(pending, { kind: "operation_progress", operationRef: "op_phone", state: "requires_input" });
  const expired = await createTwilioVerifyAdapter(fixture("expired").dependencies).verifyAndNormalize({
    kind: "challenge_response", operationRef: "op_phone", code: "000000", receivedAt: CHECKED_AT
  });
  assert.deepEqual(expired, { kind: "operation_progress", operationRef: "op_phone", state: "cancelled" });

  assert.deepEqual(await adapter.revoke("op_phone"), { operationRef: "op_phone", state: "revoked" });
  assert.deepEqual(base.calls.cancels, [{ verificationSid: SID }]);

  await assert.rejects(
    () => adapter.begin({ operationRef: "op_phone", subjectRef: "member_1", deliveryTarget: "555-555-0100" }),
    /E\.164/
  );
  await assert.rejects(
    () => adapter.verifyAndNormalize({ kind: "challenge_response", operationRef: "unknown", code: "123456", receivedAt: CHECKED_AT }),
    /operation reference is unavailable/
  );
  const malformed = fixture();
  const malformedClient = malformed.client as {
    startSmsVerification: TwilioVerifyServerClient["startSmsVerification"];
  };
  malformedClient.startSmsVerification = async () => ({
    verificationSid: "not-a-verification-sid",
    status: "pending",
    createdAt: "2026-02-31T22:00:00.000Z"
  });
  await assert.rejects(
    () => createTwilioVerifyAdapter(malformed.dependencies).begin({
      operationRef: "op_phone", subjectRef: "member_1", deliveryTarget: "+15555550100"
    }),
    /start result is invalid/
  );
  assert.throws(
    () => createTwilioVerifyAdapter({ ...fixture().dependencies, trustDomain: "production" }),
    /production gate is closed/
  );

  const mutable = fixture();
  const captured = createTwilioVerifyAdapter(mutable.dependencies);
  const mutableClient = mutable.client as {
    checkVerification: TwilioVerifyServerClient["checkVerification"];
  };
  mutableClient.checkVerification = async () => ({
    verificationSid: `VE${"b".repeat(32)}`,
    status: "approved",
    checkedAt: "2036-08-20T22:03:00.000Z"
  });
  const afterMutation = await captured.verifyAndNormalize({
    kind: "challenge_response", operationRef: "op_phone", code: "123456", receivedAt: CHECKED_AT
  });
  assert.equal(afterMutation.kind, "verified_observation");

  const source = await readFile("lib/verification/adapters/twilio-verify-adapter.ts", "utf8");
  assert.match(source, /import "server-only"/);
  assert.doesNotMatch(source, /process\.env|fetch\(|console\.|accountSid|authToken|TWILIO_/);
  assert.match(source, /acceptProviderAdapterFactoryOutput\("twilio_verify"/);

  console.log("Twilio Verify adapter shell: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
