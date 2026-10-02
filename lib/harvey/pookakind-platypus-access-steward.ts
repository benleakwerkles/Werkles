import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import {
  openPookaKindPlatypusOtp,
  validatePookaKindPlatypusOtpRequest,
} from "./pookakind-platypus-mobile-otp.ts";

const SHA256 = /^[a-f0-9]{64}$/;
const RESULT_FIELDS = [
  "accepted", "account_ref_sha256", "authentication_completed", "operation_id",
  "origin", "otp_returned", "provider_challenge_sha256", "provider_response_body_returned",
  "provider_response_sha256", "schema",
];

function fail(code: string): never { throw new Error(code); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: readonly string[]) { return Object.keys(value).sort().join("|") === [...keys].sort().join("|"); }
function digest(value: unknown) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }

export async function runPookaKindPlatypusAccessSteward(input: {
  capsule: unknown;
  expectedRequest: unknown;
  recipientEncryptionPrivateKeyPem: string;
  expectedMobileSigningPublicKeyPem: string;
  now: string;
  claimOperation: (claim: Readonly<Record<string, unknown>>) => "CREATED" | "REPLAY_SAME_REQUEST";
  submitOtpLocally: (submission: Readonly<{ operation_id: string; origin: string; account_ref_sha256: string; provider_challenge_sha256: string; otp: Buffer }>) => Promise<unknown>;
}) {
  if (typeof input?.claimOperation !== "function" || typeof input?.submitOtpLocally !== "function") fail("PLATYPUS_ACCESS_STEWARD_BOUNDARY_INVALID");
  const request = validatePookaKindPlatypusOtpRequest(input.expectedRequest);
  const capsuleSha256 = digest(input.capsule);
  const otp = openPookaKindPlatypusOtp({
    capsule: input.capsule,
    expectedRequest: request,
    recipientEncryptionPrivateKeyPem: input.recipientEncryptionPrivateKeyPem,
    expectedMobileSigningPublicKeyPem: input.expectedMobileSigningPublicKeyPem,
    now: input.now,
  });
  try {
    const claim = Object.freeze({
      schema: "pookakind.platypus-access-steward-claim/v1" as const,
      operation_id: request.operation_id,
      request_sha256: request.request_sha256,
      capsule_sha256: capsuleSha256,
      state: "CLAIMED_NOT_SUBMITTED" as const,
    });
    const claimState = input.claimOperation(claim);
    if (claimState !== "CREATED" && claimState !== "REPLAY_SAME_REQUEST") fail("PLATYPUS_ACCESS_STEWARD_CLAIM_INVALID");
    if (claimState === "REPLAY_SAME_REQUEST") {
      return Object.freeze({
        schema: "pookakind.platypus-access-steward-receipt/v1" as const,
        operation_id: request.operation_id,
        request_sha256: request.request_sha256,
        capsule_sha256: capsuleSha256,
        state: "ALREADY_CONSUMED" as const,
        provider_calls: 0 as const,
        otp_returned: false as const,
        otp_exposed_to_aeye: false as const,
        otp_buffer_zeroed_before_return: true as const,
        authentication_completed: false as const,
      });
    }
    const result = await input.submitOtpLocally(Object.freeze({
      operation_id: String(request.operation_id),
      origin: String(request.origin),
      account_ref_sha256: String(request.account_ref_sha256),
      provider_challenge_sha256: String(request.provider_challenge_sha256),
      otp,
    }));
    if (!record(result) || !exact(result, RESULT_FIELDS)
      || result.schema !== "pookakind.platypus-provider-submit-result/v1"
      || result.operation_id !== request.operation_id || result.origin !== request.origin
      || result.account_ref_sha256 !== request.account_ref_sha256
      || result.provider_challenge_sha256 !== request.provider_challenge_sha256
      || typeof result.provider_response_sha256 !== "string" || !SHA256.test(result.provider_response_sha256)
      || typeof result.accepted !== "boolean" || result.authentication_completed !== result.accepted
      || result.otp_returned !== false || result.provider_response_body_returned !== false) fail("PLATYPUS_ACCESS_STEWARD_PROVIDER_RESULT_INVALID");
    return Object.freeze({
      schema: "pookakind.platypus-access-steward-receipt/v1" as const,
      operation_id: request.operation_id,
      request_sha256: request.request_sha256,
      capsule_sha256: capsuleSha256,
      provider_response_sha256: result.provider_response_sha256,
      state: result.accepted ? "PROVIDER_VERIFIED" as const : "PROVIDER_REJECTED" as const,
      provider_calls: 1 as const,
      otp_returned: false as const,
      otp_exposed_to_aeye: false as const,
      otp_buffer_zeroed_before_return: true as const,
      provider_response_body_returned: false as const,
      authentication_completed: result.accepted,
    });
  } finally {
    otp.fill(0);
  }
}
