import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartDisneyAuthenticatedInboxOrgan } from "../../../lib/harvey/stewart-disney-authenticated-inbox-organ.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const accepted = Date.parse("2026-09-22T04:00:00.000Z");
const request = { schema: "pookakind.password-provider-stage-request/v1", operation_sha256: h("operation"), binding_sha256: h("binding") };
const message = (patch = {}) => ({ provider: "GMAIL_AUTHENTICATED_SESSION", sender: "no-reply@disneyplus.com", received_at: new Date(accepted + 1_000).toISOString(), message_ref_sha256: h("message"), otp_material: "123456", ...patch });
const handle = async (input) => { assert.equal(input.otp_material, "123456"); return { handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("handle") }, receipt: { state: "CREATED", secret_material_returned: false } }; };
function bound(adapter, createOpaqueOtpHandle = handle, clock = accepted + 2_000) {
  const organ = createStewartDisneyAuthenticatedInboxOrgan({ adapter, createOpaqueOtpHandle, now: () => clock });
  organ.bindRecoveryAcceptance({ operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256, submitted_at: new Date(accepted).toISOString() });
  return organ;
}

test("captures one fresh authenticated Disney message into an opaque handle without material output", async () => {
  const source = message();
  const organ = bound({ readDisneyOtpCandidatesOnce: async () => [source] });
  const receipt = await organ.captureEmailChallenge(request);
  assert.equal(receipt.receipt.private_message_count, 1); assert.equal(source.otp_material, null); assert.doesNotMatch(JSON.stringify(receipt), /123456|no-reply/);
  await assert.rejects(organ.captureEmailChallenge(request), /ALREADY_CONSUMED/);
});

test("rejects stale, duplicate, hostile-sender, malformed and out-of-window candidates", async () => {
  const cases = [
    [message({ sender: "attacker.invalid@example.invalid" })],
    [message({ otp_material: "12345" })],
    [message({ received_at: new Date(accepted - 1).toISOString() })],
    [message(), message({ message_ref_sha256: h("other") })],
  ];
  for (const candidates of cases) {
    const organ = bound({ readDisneyOtpCandidatesOnce: async () => candidates });
    await assert.rejects(organ.captureEmailChallenge(request), /INBOX_/);
  }
  assert.throws(() => bound({ readDisneyOtpCandidatesOnce: async () => [message()] }, handle, accepted + 120_001), /RECOVERY_BINDING_INVALID/);
});

test("fails closed when the mailbox read or handle custody is not exact", async () => {
  const invalidRead = bound({ readDisneyOtpCandidatesOnce: async () => null }, handle, accepted + 1);
  await assert.rejects(invalidRead.captureEmailChallenge(request), /READ_UNPROVEN/);
  const invalidHandle = bound({ readDisneyOtpCandidatesOnce: async () => [message()] }, async () => ({ handle: { schema: "wrong" } }));
  await assert.rejects(invalidHandle.captureEmailChallenge(request), /HANDLE_INVALID/);
});

test("mailbox capture requires a matching accepted recovery and rejects replayed binding", async () => {
  let reads = 0;
  const organ = createStewartDisneyAuthenticatedInboxOrgan({ adapter: { readDisneyOtpCandidatesOnce: async () => { reads++; return [message()]; } }, createOpaqueOtpHandle: handle, now: () => accepted + 2_000 });
  await assert.rejects(organ.captureEmailChallenge(request), /RECOVERY_NOT_BOUND/);
  assert.equal(reads, 0);
  const mismatched = bound({ readDisneyOtpCandidatesOnce: async () => { reads++; return [message()]; } });
  await assert.rejects(mismatched.captureEmailChallenge({ ...request, binding_sha256: h("other") }), /RECOVERY_NOT_BOUND/);
  assert.equal(reads, 0);
  assert.throws(() => mismatched.bindRecoveryAcceptance({ operation_sha256: request.operation_sha256, binding_sha256: request.binding_sha256, submitted_at: new Date(accepted).toISOString() }), /ALREADY_BOUND/);
});
