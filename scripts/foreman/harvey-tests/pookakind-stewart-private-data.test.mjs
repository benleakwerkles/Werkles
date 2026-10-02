import assert from "node:assert/strict";
import test from "node:test";

import {
  generatePookaKindStewartPrivateTestIdentity,
  runPookaKindStewartPrivateFill,
  sealPookaKindStewartPrivateValue,
} from "../../../lib/harvey/pookakind-stewart-private-data.ts";

const hash = (character) => character.repeat(64);
const identity = generatePookaKindStewartPrivateTestIdentity();
const destination = { origin: "https://example.com", form_sha256: hash("3"), field_role_sha256: hash("4") };

function capsule(kind = "SOCIAL_SECURITY_NUMBER", plaintext = "S3cr3t-Value-92841") {
  const value = Buffer.from(plaintext, "utf8");
  const sealed = sealPookaKindStewartPrivateValue({
    value,
    kind,
    handleSha256: hash("1"),
    ownerRefSha256: hash("2"),
    recipientEncryptionPublicKeyPem: identity.public_key_pem,
    createdAt: "2026-08-21T20:00:00.000Z",
  });
  assert.equal(value.every((byte) => byte === 0), true);
  assert.equal(JSON.stringify(sealed).includes(plaintext), false);
  return sealed;
}

test("seals supported private identifiers for portable ciphertext custody", () => {
  for (const kind of [
    "SOCIAL_SECURITY_NUMBER", "DRIVER_LICENSE_NUMBER", "DEVICE_PIN", "PASSPORT_NUMBER",
    "TAX_IDENTIFIER", "ACCOUNT_NUMBER", "CUSTOM_PRIVATE_IDENTIFIER",
  ]) assert.equal(capsule(kind).kind, kind);
});

test("blind-fills exactly once and zeroes the short-lived plaintext buffer", async () => {
  let observed;
  const receipt = await runPookaKindStewartPrivateFill({
    capsule: capsule(),
    recipientEncryptionPrivateKeyPem: identity.private_key_pem,
    expectedHandleSha256: hash("1"),
    expectedOwnerRefSha256: hash("2"),
    destination,
    claimOperation: () => "CREATED",
    fillLocally: async (submission) => {
      observed = submission.value;
      assert.equal(observed.toString("utf8"), "S3cr3t-Value-92841");
      return {
        schema: "pookakind.stewart-private-provider-result/v1",
        accepted: true,
        filled_field_count: 1,
        field_state_sha256: hash("6"),
        provider_state_sha256: hash("5"),
        secret_material_returned: false,
        validation_passed: true,
      };
    },
  });
  assert.equal(receipt.state, "PROVIDER_ACCEPTED");
  assert.equal(receipt.provider_calls, 1);
  assert.equal(receipt.validation_passed, true);
  assert.equal(receipt.field_state_sha256, hash("6"));
  assert.equal(receipt.secret_material_returned, false);
  assert.equal(JSON.stringify(receipt).includes("S3cr3t-Value-92841"), false);
  assert.equal(observed.every((byte) => byte === 0), true);
});

test("exact replay does not decrypt or call the provider", async () => {
  let calls = 0;
  const receipt = await runPookaKindStewartPrivateFill({
    capsule: capsule("DEVICE_PIN"),
    recipientEncryptionPrivateKeyPem: identity.private_key_pem,
    expectedHandleSha256: hash("1"),
    expectedOwnerRefSha256: hash("2"),
    destination,
    claimOperation: () => "REPLAY_SAME_REQUEST",
    fillLocally: async () => { calls += 1; throw new Error("UNREACHABLE"); },
  });
  assert.equal(receipt.state, "ALREADY_CONSUMED");
  assert.equal(receipt.provider_calls, 0);
  assert.equal(calls, 0);
});

test("scope drift and malformed provider truth fail closed", async () => {
  await assert.rejects(() => runPookaKindStewartPrivateFill({
    capsule: capsule("DRIVER_LICENSE_NUMBER"),
    recipientEncryptionPrivateKeyPem: identity.private_key_pem,
    expectedHandleSha256: hash("6"),
    expectedOwnerRefSha256: hash("2"),
    destination,
    claimOperation: () => "CREATED",
    fillLocally: async () => { throw new Error("UNREACHABLE"); },
  }), /STEWART_PRIVATE_FILL_SCOPE_MISMATCH/);

  await assert.rejects(() => runPookaKindStewartPrivateFill({
    capsule: capsule("DRIVER_LICENSE_NUMBER"),
    recipientEncryptionPrivateKeyPem: identity.private_key_pem,
    expectedHandleSha256: hash("1"),
    expectedOwnerRefSha256: hash("2"),
    destination,
    claimOperation: () => "CREATED",
    fillLocally: async () => ({ accepted: true }),
  }), /STEWART_PRIVATE_PROVIDER_RESULT_INVALID/);

  await assert.rejects(() => runPookaKindStewartPrivateFill({
    capsule: capsule("DRIVER_LICENSE_NUMBER"),
    recipientEncryptionPrivateKeyPem: identity.private_key_pem,
    expectedHandleSha256: hash("1"),
    expectedOwnerRefSha256: hash("2"),
    destination,
    claimOperation: () => "CREATED",
    fillLocally: async () => ({
      schema: "pookakind.stewart-private-provider-result/v1",
      accepted: true,
      filled_field_count: 1,
      field_state_sha256: hash("6"),
      provider_state_sha256: hash("5"),
      secret_material_returned: false,
      validation_passed: false,
    }),
  }), /STEWART_PRIVATE_PROVIDER_RESULT_INVALID/);
});
