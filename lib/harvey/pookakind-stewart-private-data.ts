import {
  createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey,
  diffieHellman, generateKeyPairSync, hkdfSync, randomBytes,
} from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const PRIVATE_VALUE_KINDS = new Set([
  "SOCIAL_SECURITY_NUMBER",
  "DRIVER_LICENSE_NUMBER",
  "DEVICE_PIN",
  "PASSPORT_NUMBER",
  "TAX_IDENTIFIER",
  "ACCOUNT_NUMBER",
  "CUSTOM_PRIVATE_IDENTIFIER",
]);
const CAPSULE_FIELDS = [
  "algorithm", "auth_tag_b64", "ciphertext_b64", "created_at", "ephemeral_public_key_pem",
  "ephemeral_public_key_sha256", "handle_sha256", "iv_b64", "kind", "owner_ref_sha256",
  "recipient_encryption_key_sha256", "salt_b64", "schema", "state", "value_byte_count",
];

function fail(code: string): never { throw new Error(code); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: readonly string[]) { return Object.keys(value).sort().join("|") === [...keys].sort().join("|"); }
function digest(value: string | Buffer) { return createHash("sha256").update(value).digest("hex"); }
function timestamp(value: unknown) { const parsed = typeof value === "string" ? Date.parse(value) : NaN; return Number.isFinite(parsed); }
function base64(value: unknown, exactBytes: number | null, maximum: number, code: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) fail(code);
  const bytes = Buffer.from(value, "base64");
  if (bytes.length < 1 || bytes.length > maximum || (exactBytes !== null && bytes.length !== exactBytes) || bytes.toString("base64") !== value) fail(code);
  return bytes;
}
function publicKey(value: string, code: string) {
  try { const key = createPublicKey(value); if (key.asymmetricKeyType !== "x25519") fail(code); return key; } catch { fail(code); }
}
function privateKey(value: string, code: string) {
  try { const key = createPrivateKey(value); if (key.asymmetricKeyType !== "x25519") fail(code); return key; } catch { fail(code); }
}
function keyFingerprint(key: ReturnType<typeof createPublicKey>) { return digest(key.export({ type: "spki", format: "der" })); }
function validOrigin(value: unknown) {
  if (typeof value !== "string" || value.length > 512) return false;
  try { const url = new URL(value); return url.protocol === "https:" && url.origin === value && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash; } catch { return false; }
}

export type PookaKindStewartPrivateValueKind =
  | "SOCIAL_SECURITY_NUMBER"
  | "DRIVER_LICENSE_NUMBER"
  | "DEVICE_PIN"
  | "PASSPORT_NUMBER"
  | "TAX_IDENTIFIER"
  | "ACCOUNT_NUMBER"
  | "CUSTOM_PRIVATE_IDENTIFIER";

export function sealPookaKindStewartPrivateValue(input: {
  value: Buffer;
  kind: PookaKindStewartPrivateValueKind;
  handleSha256: string;
  ownerRefSha256: string;
  recipientEncryptionPublicKeyPem: string;
  createdAt: string;
}) {
  if (!Buffer.isBuffer(input?.value)) fail("STEWART_PRIVATE_VALUE_BUFFER_REQUIRED");
  try {
    if (input.value.length < 1 || input.value.length > 512 || !PRIVATE_VALUE_KINDS.has(input.kind)
      || !SHA256.test(input.handleSha256 ?? "") || !SHA256.test(input.ownerRefSha256 ?? "")
      || !timestamp(input.createdAt)) fail("STEWART_PRIVATE_VALUE_INVALID");
    const recipient = publicKey(input.recipientEncryptionPublicKeyPem, "STEWART_PRIVATE_RECIPIENT_KEY_INVALID");
    const ephemeral = generateKeyPairSync("x25519");
    const salt = randomBytes(32); const iv = randomBytes(12);
    const ephemeralPem = ephemeral.publicKey.export({ type: "spki", format: "pem" }).toString();
    const unsigned = {
      schema: "pookakind.stewart-private-value-capsule/v1" as const,
      algorithm: "X25519_HKDF_SHA256_AES_256_GCM" as const,
      kind: input.kind,
      handle_sha256: input.handleSha256,
      owner_ref_sha256: input.ownerRefSha256,
      recipient_encryption_key_sha256: keyFingerprint(recipient),
      ephemeral_public_key_pem: ephemeralPem,
      ephemeral_public_key_sha256: keyFingerprint(ephemeral.publicKey),
      salt_b64: salt.toString("base64"),
      iv_b64: iv.toString("base64"),
      value_byte_count: input.value.length,
      created_at: input.createdAt,
      state: "SEALED_FOR_EXACT_STEWART_EXECUTOR" as const,
    };
    const aad = canonicalJson(unsigned);
    const shared = diffieHellman({ privateKey: ephemeral.privateKey, publicKey: recipient });
    const key = Buffer.from(hkdfSync("sha256", shared, salt, Buffer.from(`pookakind-stewart-private-value/v1:${digest(aad)}`, "utf8"), 32));
    const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    cipher.setAAD(Buffer.from(aad, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(input.value), cipher.final()]);
    return Object.freeze({
      ...unsigned,
      ciphertext_b64: ciphertext.toString("base64"),
      auth_tag_b64: cipher.getAuthTag().toString("base64"),
    });
  } finally {
    input?.value?.fill(0);
  }
}

function validateCapsule(value: unknown) {
  if (!record(value) || !exact(value, CAPSULE_FIELDS)
    || value.schema !== "pookakind.stewart-private-value-capsule/v1"
    || value.algorithm !== "X25519_HKDF_SHA256_AES_256_GCM"
    || typeof value.kind !== "string" || !PRIVATE_VALUE_KINDS.has(value.kind)
    || typeof value.handle_sha256 !== "string" || !SHA256.test(value.handle_sha256)
    || typeof value.owner_ref_sha256 !== "string" || !SHA256.test(value.owner_ref_sha256)
    || typeof value.recipient_encryption_key_sha256 !== "string" || !SHA256.test(value.recipient_encryption_key_sha256)
    || typeof value.ephemeral_public_key_pem !== "string"
    || typeof value.ephemeral_public_key_sha256 !== "string" || !SHA256.test(value.ephemeral_public_key_sha256)
    || !Number.isSafeInteger(value.value_byte_count) || Number(value.value_byte_count) < 1 || Number(value.value_byte_count) > 512
    || !timestamp(value.created_at) || value.state !== "SEALED_FOR_EXACT_STEWART_EXECUTOR") fail("STEWART_PRIVATE_CAPSULE_INVALID");
  base64(value.salt_b64, 32, 32, "STEWART_PRIVATE_CAPSULE_INVALID");
  base64(value.iv_b64, 12, 12, "STEWART_PRIVATE_CAPSULE_INVALID");
  base64(value.auth_tag_b64, 16, 16, "STEWART_PRIVATE_CAPSULE_INVALID");
  base64(value.ciphertext_b64, Number(value.value_byte_count), 512, "STEWART_PRIVATE_CAPSULE_INVALID");
  return value;
}

export async function runPookaKindStewartPrivateFill(input: {
  capsule: unknown;
  recipientEncryptionPrivateKeyPem: string;
  expectedHandleSha256: string;
  expectedOwnerRefSha256: string;
  destination: Readonly<{ origin: string; form_sha256: string; field_role_sha256: string }>;
  claimOperation: (claim: Readonly<{ capsule_sha256: string; destination_sha256: string; handle_sha256: string }>) => "CREATED" | "REPLAY_SAME_REQUEST";
  fillLocally: (submission: Readonly<{ kind: PookaKindStewartPrivateValueKind; origin: string; form_sha256: string; field_role_sha256: string; value: Buffer }>) => Promise<unknown>;
}) {
  if (typeof input?.claimOperation !== "function" || typeof input?.fillLocally !== "function") fail("STEWART_PRIVATE_FILL_BOUNDARY_INVALID");
  const capsule = validateCapsule(input.capsule);
  if (capsule.handle_sha256 !== input.expectedHandleSha256 || capsule.owner_ref_sha256 !== input.expectedOwnerRefSha256
    || !SHA256.test(input.expectedHandleSha256 ?? "") || !SHA256.test(input.expectedOwnerRefSha256 ?? "")
    || !validOrigin(input.destination?.origin) || !SHA256.test(input.destination?.form_sha256 ?? "")
    || !SHA256.test(input.destination?.field_role_sha256 ?? "")) fail("STEWART_PRIVATE_FILL_SCOPE_MISMATCH");
  const capsuleSha256 = digest(canonicalJson(capsule));
  const destinationSha256 = digest(canonicalJson(input.destination));
  const claim = input.claimOperation(Object.freeze({
    capsule_sha256: capsuleSha256,
    destination_sha256: destinationSha256,
    handle_sha256: input.expectedHandleSha256,
  }));
  if (claim === "REPLAY_SAME_REQUEST") return Object.freeze({
    schema: "pookakind.stewart-private-fill-receipt/v1" as const,
    state: "ALREADY_CONSUMED" as const,
    capsule_sha256: capsuleSha256,
    destination_sha256: destinationSha256,
    provider_calls: 0 as const,
    secret_material_returned: false as const,
    secret_buffer_zeroed_before_return: true as const,
  });
  if (claim !== "CREATED") fail("STEWART_PRIVATE_FILL_CLAIM_INVALID");
  const recipient = privateKey(input.recipientEncryptionPrivateKeyPem, "STEWART_PRIVATE_RECIPIENT_KEY_INVALID");
  if (keyFingerprint(createPublicKey(recipient)) !== capsule.recipient_encryption_key_sha256) fail("STEWART_PRIVATE_RECIPIENT_MISMATCH");
  const ephemeral = publicKey(String(capsule.ephemeral_public_key_pem), "STEWART_PRIVATE_EPHEMERAL_KEY_INVALID");
  if (keyFingerprint(ephemeral) !== capsule.ephemeral_public_key_sha256) fail("STEWART_PRIVATE_EPHEMERAL_KEY_INVALID");
  const salt = base64(capsule.salt_b64, 32, 32, "STEWART_PRIVATE_CAPSULE_INVALID");
  const iv = base64(capsule.iv_b64, 12, 12, "STEWART_PRIVATE_CAPSULE_INVALID");
  const ciphertext = base64(capsule.ciphertext_b64, Number(capsule.value_byte_count), 512, "STEWART_PRIVATE_CAPSULE_INVALID");
  const tag = base64(capsule.auth_tag_b64, 16, 16, "STEWART_PRIVATE_CAPSULE_INVALID");
  const unsigned = { ...capsule }; delete unsigned.ciphertext_b64; delete unsigned.auth_tag_b64;
  const aad = canonicalJson(unsigned);
  let value: Buffer | undefined;
  try {
    const shared = diffieHellman({ privateKey: recipient, publicKey: ephemeral });
    const key = Buffer.from(hkdfSync("sha256", shared, salt, Buffer.from(`pookakind-stewart-private-value/v1:${digest(aad)}`, "utf8"), 32));
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    decipher.setAAD(Buffer.from(aad, "utf8")); decipher.setAuthTag(tag);
    value = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (value.length !== capsule.value_byte_count) fail("STEWART_PRIVATE_PLAINTEXT_INVALID");
    const result = await input.fillLocally(Object.freeze({
      kind: capsule.kind as PookaKindStewartPrivateValueKind,
      origin: input.destination.origin,
      form_sha256: input.destination.form_sha256,
      field_role_sha256: input.destination.field_role_sha256,
      value,
    }));
    if (!record(result) || !exact(result, ["accepted", "field_state_sha256", "filled_field_count", "provider_state_sha256", "schema", "secret_material_returned", "validation_passed"])
      || result.schema !== "pookakind.stewart-private-provider-result/v1"
      || typeof result.accepted !== "boolean" || result.filled_field_count !== 1
      || typeof result.validation_passed !== "boolean" || (result.accepted === true && result.validation_passed !== true)
      || typeof result.field_state_sha256 !== "string" || !SHA256.test(result.field_state_sha256)
      || typeof result.provider_state_sha256 !== "string" || !SHA256.test(result.provider_state_sha256)
      || result.secret_material_returned !== false) fail("STEWART_PRIVATE_PROVIDER_RESULT_INVALID");
    return Object.freeze({
      schema: "pookakind.stewart-private-fill-receipt/v1" as const,
      state: result.accepted ? "PROVIDER_ACCEPTED" as const : "PROVIDER_REJECTED" as const,
      capsule_sha256: capsuleSha256,
      destination_sha256: destinationSha256,
      field_state_sha256: result.field_state_sha256,
      provider_state_sha256: result.provider_state_sha256,
      validation_passed: result.validation_passed,
      provider_calls: 1 as const,
      secret_material_returned: false as const,
      secret_buffer_zeroed_before_return: true as const,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STEWART_")) throw error;
    fail("STEWART_PRIVATE_AUTHENTICATION_FAILED");
  } finally {
    value?.fill(0);
  }
}

export function generatePookaKindStewartPrivateTestIdentity() {
  const recipient = generateKeyPairSync("x25519");
  return {
    public_key_pem: recipient.publicKey.export({ type: "spki", format: "pem" }).toString(),
    private_key_pem: recipient.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    public_key_sha256: keyFingerprint(recipient.publicKey),
  };
}
