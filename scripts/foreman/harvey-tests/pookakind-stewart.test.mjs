import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compilePookaKindPlatypusOtpRequest, generatePookaKindPlatypusTestIdentities,
  sealPookaKindPlatypusOtp,
} from "../../../lib/harvey/pookakind-platypus-mobile-otp.ts";
import { runPookaKindStewart } from "../../../lib/harvey/pookakind-stewart.ts";

const hash = (character) => character.repeat(64);

test("Stewart composes the durable claim and provider handoff under one human name", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "pk-stewart-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const identity = generatePookaKindPlatypusTestIdentities();
  const request = compilePookaKindPlatypusOtpRequest({
    operationId: `platypus-${"1".repeat(32)}`, stationId: "doss", origin: "https://example.com",
    providerChallengeSha256: hash("2"), accountRefSha256: hash("3"), expectedSenderRefSha256: hash("4"),
    captureMode: "ANDROID_SMS_USER_CONSENT", requestedAt: "2026-08-20T12:00:00.000Z", expiresAt: "2026-08-20T12:05:00.000Z",
    mobileDeviceIdSha256: hash("5"), mobileSigningKeySha256: identity.mobile_key_sha256,
    recipientEncryptionKeySha256: identity.recipient_key_sha256,
  });
  const capsule = sealPookaKindPlatypusOtp({
    request, otp: "482913", observedSenderRefSha256: hash("4"), observedAt: "2026-08-20T12:01:00.000Z",
    recipientEncryptionPublicKeyPem: identity.recipient_public_key_pem,
    mobileSigningPrivateKeyPem: identity.mobile_private_key_pem,
  });
  let calls = 0;
  const run = () => runPookaKindStewart({
    claimStoreRoot: root, capsule, expectedRequest: request,
    recipientEncryptionPrivateKeyPem: identity.recipient_private_key_pem,
    expectedMobileSigningPublicKeyPem: identity.mobile_public_key_pem,
    now: "2026-08-20T12:02:00.000Z",
    submitOtpLocally: async () => {
      calls++;
      return {
        schema: "pookakind.platypus-provider-submit-result/v1", operation_id: request.operation_id,
        origin: request.origin, account_ref_sha256: request.account_ref_sha256,
        provider_challenge_sha256: request.provider_challenge_sha256,
        provider_response_sha256: hash("9"), accepted: true, authentication_completed: true,
        otp_returned: false, provider_response_body_returned: false,
      };
    },
  });

  const first = await run();
  const replay = await run();
  assert.equal(first.organ_name, "Stewart");
  assert.equal(first.compatibility_protocol, "POOKAKIND_ACCESS_STEWARD_V1");
  assert.equal(first.result.state, "PROVIDER_VERIFIED");
  assert.equal(replay.result.state, "ALREADY_CONSUMED");
  assert.equal(replay.result.provider_calls, 0);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(first).includes("482913"), false);
});

test("Stewart rejects an unbound local submitter", async () => {
  await assert.rejects(runPookaKindStewart({}), /STEWART_BOUNDARY_INVALID/);
});
