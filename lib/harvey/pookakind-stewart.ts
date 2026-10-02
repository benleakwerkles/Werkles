import { runPookaKindPlatypusAccessSteward } from "./pookakind-platypus-access-steward.ts";
import { createPookaKindPlatypusClaimStore } from "./pookakind-platypus-claim-store.ts";

export {
  generatePookaKindStewartPrivateTestIdentity,
  runPookaKindStewartPrivateFill,
  sealPookaKindStewartPrivateValue,
} from "./pookakind-stewart-private-data.ts";
export type { PookaKindStewartPrivateValueKind } from "./pookakind-stewart-private-data.ts";

function fail(code: string): never { throw new Error(code); }

/**
 * Stewart is PookaKind's human-facing name for the no-secret Access Steward.
 * Historical wire schemas retain their original identifiers so old receipts
 * remain verifiable.
 */
export async function runPookaKindStewart(input: {
  claimStoreRoot: string;
  capsule: unknown;
  expectedRequest: unknown;
  recipientEncryptionPrivateKeyPem: string;
  expectedMobileSigningPublicKeyPem: string;
  now: string;
  submitOtpLocally: (submission: Readonly<{
    operation_id: string;
    origin: string;
    account_ref_sha256: string;
    provider_challenge_sha256: string;
    otp: Buffer;
  }>) => Promise<unknown>;
}) {
  if (!input || typeof input.submitOtpLocally !== "function") fail("STEWART_BOUNDARY_INVALID");
  const claimOperation = createPookaKindPlatypusClaimStore({ root: input.claimStoreRoot });
  const result = await runPookaKindPlatypusAccessSteward({
    capsule: input.capsule,
    expectedRequest: input.expectedRequest,
    recipientEncryptionPrivateKeyPem: input.recipientEncryptionPrivateKeyPem,
    expectedMobileSigningPublicKeyPem: input.expectedMobileSigningPublicKeyPem,
    now: input.now,
    claimOperation: (claim) => claimOperation(claim).state,
    submitOtpLocally: input.submitOtpLocally,
  });
  return Object.freeze({
    schema: "pookakind.stewart-operation-receipt/v1" as const,
    organ_name: "Stewart" as const,
    compatibility_protocol: "POOKAKIND_ACCESS_STEWARD_V1" as const,
    result,
    secret_material_returned: false as const,
    recurring_operation_created: false as const,
  });
}
