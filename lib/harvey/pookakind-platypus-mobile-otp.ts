import {
  createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey,
  diffieHellman, generateKeyPairSync, hkdfSync, randomBytes, sign, verify,
} from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const OPERATION = /^platypus-[a-f0-9]{32}$/;
const OTP = /^(?=[A-Za-z0-9]{4,10}$)(?=.*[0-9])[A-Za-z0-9]+$/;
const MODES = new Set(["ANDROID_SMS_USER_CONSENT", "IOS_SECURITY_CODE_AUTOFILL"]);
const REQUEST_FIELDS = [
  "account_ref_sha256", "capture_mode", "code_chat_export_authorized", "expires_at",
  "expected_sender_ref_sha256", "local_user_consent_required", "mobile_device_id_sha256",
  "mobile_signing_key_sha256", "operation_id", "origin", "provider_challenge_sha256",
  "raw_sms_export_authorized", "recipient_encryption_key_sha256", "request_sha256",
  "requested_at", "schema", "state", "station_id",
];
const CAPSULE_FIELDS = [
  "algorithm", "auth_tag_b64", "ciphertext_b64", "ephemeral_public_key_pem",
  "ephemeral_public_key_sha256", "iv_b64", "mobile_signature_b64",
  "mobile_signing_key_sha256", "observed_at", "observed_sender_ref_sha256",
  "otp_byte_count", "otp_exposed_to_aeye",
  "raw_sms_returned", "recipient_encryption_key_sha256", "request", "salt_b64",
  "schema", "state",
];

function fail(code: string): never { throw new Error(code); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: readonly string[]) { return Object.keys(value).sort().join("|") === [...keys].sort().join("|"); }
function digest(value: string | Buffer) { return createHash("sha256").update(value).digest("hex"); }
function validOrigin(value: unknown) {
  if (typeof value !== "string" || value.length > 512) return false;
  try { const url = new URL(value); return url.protocol === "https:" && url.origin === value && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash; } catch { return false; }
}
function timestamp(value: unknown) { const parsed = typeof value === "string" ? Date.parse(value) : NaN; return Number.isFinite(parsed) ? parsed : NaN; }
function base64(value: unknown, exactBytes: number | null, maximum: number, code: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) fail(code);
  const bytes = Buffer.from(value, "base64");
  if (bytes.length < 1 || bytes.length > maximum || (exactBytes !== null && bytes.length !== exactBytes) || bytes.toString("base64") !== value) fail(code);
  return bytes;
}
function keyFingerprint(key: ReturnType<typeof createPublicKey>, algorithm: "x25519" | "ed25519", code: string) {
  if (key.asymmetricKeyType !== algorithm) fail(code);
  return digest(key.export({ type: "spki", format: "der" }));
}
function publicKey(value: string, algorithm: "x25519" | "ed25519", code: string) {
  try { const key = createPublicKey(value); keyFingerprint(key, algorithm, code); return key; } catch { fail(code); }
}
function privateKey(value: string, algorithm: "x25519" | "ed25519", code: string) {
  try { const key = createPrivateKey(value); if (key.asymmetricKeyType !== algorithm) fail(code); return key; } catch { fail(code); }
}

export function compilePookaKindPlatypusOtpRequest(input: {
  operationId: string; stationId: string; origin: string; providerChallengeSha256: string;
  accountRefSha256: string; expectedSenderRefSha256: string; captureMode: string;
  requestedAt: string; expiresAt: string; mobileDeviceIdSha256: string;
  mobileSigningKeySha256: string; recipientEncryptionKeySha256: string;
}) {
  const requested = timestamp(input?.requestedAt); const expires = timestamp(input?.expiresAt);
  const body = {
    schema: "pookakind.platypus-otp-request/v1" as const,
    operation_id: input?.operationId,
    station_id: input?.stationId,
    origin: input?.origin,
    provider_challenge_sha256: input?.providerChallengeSha256,
    account_ref_sha256: input?.accountRefSha256,
    expected_sender_ref_sha256: input?.expectedSenderRefSha256,
    capture_mode: input?.captureMode,
    requested_at: input?.requestedAt,
    expires_at: input?.expiresAt,
    mobile_device_id_sha256: input?.mobileDeviceIdSha256,
    mobile_signing_key_sha256: input?.mobileSigningKeySha256,
    recipient_encryption_key_sha256: input?.recipientEncryptionKeySha256,
    local_user_consent_required: true as const,
    raw_sms_export_authorized: false as const,
    code_chat_export_authorized: false as const,
    state: "AWAITING_LOCAL_MOBILE_CAPTURE" as const,
  };
  if (!OPERATION.test(body.operation_id ?? "")
    || typeof body.station_id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(body.station_id)
    || !validOrigin(body.origin) || !SHA256.test(body.provider_challenge_sha256 ?? "")
    || !SHA256.test(body.account_ref_sha256 ?? "") || !SHA256.test(body.expected_sender_ref_sha256 ?? "")
    || !MODES.has(body.capture_mode ?? "") || !Number.isFinite(requested) || !Number.isFinite(expires)
    || expires <= requested || expires - requested > 5 * 60_000
    || !SHA256.test(body.mobile_device_id_sha256 ?? "") || !SHA256.test(body.mobile_signing_key_sha256 ?? "")
    || !SHA256.test(body.recipient_encryption_key_sha256 ?? "")) fail("PLATYPUS_OTP_REQUEST_INVALID");
  return validatePookaKindPlatypusOtpRequest({ ...body, request_sha256: digest(canonicalJson(body)) });
}

export function validatePookaKindPlatypusOtpRequest(value: unknown) {
  if (!record(value) || !exact(value, REQUEST_FIELDS) || value.schema !== "pookakind.platypus-otp-request/v1"
    || value.state !== "AWAITING_LOCAL_MOBILE_CAPTURE" || typeof value.operation_id !== "string" || !OPERATION.test(value.operation_id)
    || typeof value.station_id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(value.station_id)
    || !validOrigin(value.origin) || typeof value.provider_challenge_sha256 !== "string" || !SHA256.test(value.provider_challenge_sha256)
    || typeof value.account_ref_sha256 !== "string" || !SHA256.test(value.account_ref_sha256)
    || typeof value.expected_sender_ref_sha256 !== "string" || !SHA256.test(value.expected_sender_ref_sha256)
    || typeof value.capture_mode !== "string" || !MODES.has(value.capture_mode)
    || value.local_user_consent_required !== true || value.raw_sms_export_authorized !== false || value.code_chat_export_authorized !== false
    || typeof value.mobile_device_id_sha256 !== "string" || !SHA256.test(value.mobile_device_id_sha256)
    || typeof value.mobile_signing_key_sha256 !== "string" || !SHA256.test(value.mobile_signing_key_sha256)
    || typeof value.recipient_encryption_key_sha256 !== "string" || !SHA256.test(value.recipient_encryption_key_sha256)
    || typeof value.request_sha256 !== "string" || !SHA256.test(value.request_sha256)) fail("PLATYPUS_OTP_REQUEST_INVALID");
  const requested = timestamp(value.requested_at); const expires = timestamp(value.expires_at);
  if (!Number.isFinite(requested) || !Number.isFinite(expires) || expires <= requested || expires - requested > 5 * 60_000) fail("PLATYPUS_OTP_REQUEST_INVALID");
  const body = { ...value }; delete body.request_sha256;
  if (digest(canonicalJson(body)) !== value.request_sha256) fail("PLATYPUS_OTP_REQUEST_HASH_MISMATCH");
  return Object.freeze({ ...value });
}

export function sealPookaKindPlatypusOtp(input: {
  request: unknown; otp: string; observedSenderRefSha256: string; observedAt: string;
  recipientEncryptionPublicKeyPem: string; mobileSigningPrivateKeyPem: string;
}) {
  const request = validatePookaKindPlatypusOtpRequest(input?.request);
  const observedAt = timestamp(input?.observedAt);
  if (typeof input?.otp !== "string" || !OTP.test(input.otp) || !SHA256.test(input.observedSenderRefSha256 ?? "")
    || input.observedSenderRefSha256 !== request.expected_sender_ref_sha256
    || !Number.isFinite(observedAt) || observedAt < timestamp(request.requested_at) || observedAt > timestamp(request.expires_at)) fail("PLATYPUS_OTP_CAPTURE_INVALID");
  const recipient = publicKey(input.recipientEncryptionPublicKeyPem, "x25519", "PLATYPUS_OTP_RECIPIENT_KEY_INVALID");
  if (keyFingerprint(recipient, "x25519", "PLATYPUS_OTP_RECIPIENT_KEY_INVALID") !== request.recipient_encryption_key_sha256) fail("PLATYPUS_OTP_RECIPIENT_MISMATCH");
  const signer = privateKey(input.mobileSigningPrivateKeyPem, "ed25519", "PLATYPUS_OTP_SIGNING_KEY_INVALID");
  if (keyFingerprint(createPublicKey(signer), "ed25519", "PLATYPUS_OTP_SIGNING_KEY_INVALID") !== request.mobile_signing_key_sha256) fail("PLATYPUS_OTP_SIGNER_MISMATCH");
  const ephemeral = generateKeyPairSync("x25519"); const salt = randomBytes(32); const iv = randomBytes(12);
  const ephemeralPem = ephemeral.publicKey.export({ type: "spki", format: "pem" }).toString();
  const unsigned = {
    schema: "pookakind.platypus-otp-capsule/v1" as const,
    algorithm: "X25519_HKDF_SHA256_AES_256_GCM_ED25519" as const,
    request,
    recipient_encryption_key_sha256: request.recipient_encryption_key_sha256,
    ephemeral_public_key_pem: ephemeralPem,
    ephemeral_public_key_sha256: keyFingerprint(ephemeral.publicKey, "x25519", "PLATYPUS_OTP_EPHEMERAL_KEY_INVALID"),
    salt_b64: salt.toString("base64"), iv_b64: iv.toString("base64"),
    otp_byte_count: Buffer.byteLength(input.otp, "utf8"),
    mobile_signing_key_sha256: request.mobile_signing_key_sha256,
    observed_sender_ref_sha256: input.observedSenderRefSha256,
    observed_at: input.observedAt,
    raw_sms_returned: false as const, otp_exposed_to_aeye: false as const,
    state: "SEALED_OTP_HELD_FOR_EXACT_ACCESS_STEWARD" as const,
  };
  const aad = canonicalJson(unsigned);
  const shared = diffieHellman({ privateKey: ephemeral.privateKey, publicKey: recipient });
  const key = Buffer.from(hkdfSync("sha256", shared, salt, Buffer.from(`pookakind-platypus-otp/v1:${digest(aad)}`, "utf8"), 32));
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 }); cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(input.otp, "utf8"), cipher.final()]);
  const signed = { ...unsigned, ciphertext_b64: ciphertext.toString("base64"), auth_tag_b64: cipher.getAuthTag().toString("base64") };
  return Object.freeze({ ...signed, mobile_signature_b64: sign(null, Buffer.from(canonicalJson(signed), "utf8"), signer).toString("base64") });
}

function validatePookaKindPlatypusOtpCapsuleSignature(input: {
  capsule: unknown; expectedRequest: unknown; expectedMobileSigningPublicKeyPem: string; now: string;
}) {
  const expectedRequest = validatePookaKindPlatypusOtpRequest(input?.expectedRequest);
  const value = input?.capsule;
  if (!record(value) || !exact(value, CAPSULE_FIELDS) || value.schema !== "pookakind.platypus-otp-capsule/v1"
    || value.algorithm !== "X25519_HKDF_SHA256_AES_256_GCM_ED25519"
    || canonicalJson(value.request) !== canonicalJson(expectedRequest)
    || value.recipient_encryption_key_sha256 !== expectedRequest.recipient_encryption_key_sha256
    || value.mobile_signing_key_sha256 !== expectedRequest.mobile_signing_key_sha256
    || value.observed_sender_ref_sha256 !== expectedRequest.expected_sender_ref_sha256
    || !Number.isFinite(timestamp(value.observed_at))
    || timestamp(value.observed_at) < timestamp(expectedRequest.requested_at)
    || timestamp(value.observed_at) > timestamp(expectedRequest.expires_at)
    || value.raw_sms_returned !== false || value.otp_exposed_to_aeye !== false
    || value.state !== "SEALED_OTP_HELD_FOR_EXACT_ACCESS_STEWARD"
    || !Number.isSafeInteger(value.otp_byte_count) || Number(value.otp_byte_count) < 4 || Number(value.otp_byte_count) > 10
    || typeof value.mobile_signature_b64 !== "string") fail("PLATYPUS_OTP_CAPSULE_INVALID");
  const now = timestamp(input.now);
  if (!Number.isFinite(now) || now > timestamp(expectedRequest.expires_at)) fail("PLATYPUS_OTP_CAPSULE_EXPIRED");
  const signer = publicKey(input.expectedMobileSigningPublicKeyPem, "ed25519", "PLATYPUS_OTP_SIGNING_KEY_INVALID");
  if (keyFingerprint(signer, "ed25519", "PLATYPUS_OTP_SIGNING_KEY_INVALID") !== expectedRequest.mobile_signing_key_sha256) fail("PLATYPUS_OTP_SIGNER_MISMATCH");
  const signed = { ...value }; delete signed.mobile_signature_b64;
  const signature = base64(value.mobile_signature_b64, 64, 64, "PLATYPUS_OTP_SIGNATURE_INVALID");
  if (!verify(null, Buffer.from(canonicalJson(signed), "utf8"), signer, signature)) fail("PLATYPUS_OTP_SIGNATURE_INVALID");
  return { expectedRequest, value, signed };
}

export function validatePookaKindPlatypusOtpCapsuleCustody(input: {
  capsule: unknown; expectedRequest: unknown; expectedMobileSigningPublicKeyPem: string; now: string;
}) {
  const { expectedRequest, value } = validatePookaKindPlatypusOtpCapsuleSignature(input);
  return Object.freeze({
    schema: "pookakind.platypus-otp-capsule-custody/v1" as const,
    operation_id: expectedRequest.operation_id,
    request_sha256: expectedRequest.request_sha256,
    capsule_sha256: digest(canonicalJson(value)),
    mobile_signing_key_sha256: expectedRequest.mobile_signing_key_sha256,
    recipient_encryption_key_sha256: expectedRequest.recipient_encryption_key_sha256,
    observed_at: value.observed_at,
    state: "SIGNED_ENCRYPTED_CAPSULE_VALIDATED__NOT_OPENED" as const,
    otp_opened: false as const,
    otp_returned: false as const,
  });
}

export function openPookaKindPlatypusOtp(input: {
  capsule: unknown; expectedRequest: unknown; recipientEncryptionPrivateKeyPem: string;
  expectedMobileSigningPublicKeyPem: string; now: string;
}) {
  const { expectedRequest, value, signed } = validatePookaKindPlatypusOtpCapsuleSignature(input);
  const recipient = privateKey(input.recipientEncryptionPrivateKeyPem, "x25519", "PLATYPUS_OTP_RECIPIENT_KEY_INVALID");
  if (keyFingerprint(createPublicKey(recipient), "x25519", "PLATYPUS_OTP_RECIPIENT_KEY_INVALID") !== expectedRequest.recipient_encryption_key_sha256) fail("PLATYPUS_OTP_RECIPIENT_MISMATCH");
  if (typeof value.ephemeral_public_key_pem !== "string") fail("PLATYPUS_OTP_CAPSULE_INVALID");
  const ephemeral = publicKey(value.ephemeral_public_key_pem, "x25519", "PLATYPUS_OTP_EPHEMERAL_KEY_INVALID");
  if (keyFingerprint(ephemeral, "x25519", "PLATYPUS_OTP_EPHEMERAL_KEY_INVALID") !== value.ephemeral_public_key_sha256) fail("PLATYPUS_OTP_EPHEMERAL_KEY_INVALID");
  const salt = base64(value.salt_b64, 32, 32, "PLATYPUS_OTP_CAPSULE_INVALID");
  const iv = base64(value.iv_b64, 12, 12, "PLATYPUS_OTP_CAPSULE_INVALID");
  const ciphertext = base64(value.ciphertext_b64, Number(value.otp_byte_count), 10, "PLATYPUS_OTP_CAPSULE_INVALID");
  const tag = base64(value.auth_tag_b64, 16, 16, "PLATYPUS_OTP_CAPSULE_INVALID");
  const unsigned = { ...signed }; delete unsigned.ciphertext_b64; delete unsigned.auth_tag_b64;
  const aad = canonicalJson(unsigned);
  try {
    const shared = diffieHellman({ privateKey: recipient, publicKey: ephemeral });
    const key = Buffer.from(hkdfSync("sha256", shared, salt, Buffer.from(`pookakind-platypus-otp/v1:${digest(aad)}`, "utf8"), 32));
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 }); decipher.setAAD(Buffer.from(aad, "utf8")); decipher.setAuthTag(tag);
    const otp = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (otp.length !== value.otp_byte_count || !OTP.test(otp.toString("utf8"))) fail("PLATYPUS_OTP_PLAINTEXT_INVALID");
    return otp;
  } catch (error) {
    if (error instanceof Error && error.message === "PLATYPUS_OTP_PLAINTEXT_INVALID") throw error;
    fail("PLATYPUS_OTP_AUTHENTICATION_FAILED");
  }
}

export function generatePookaKindPlatypusTestIdentities() {
  const recipient = generateKeyPairSync("x25519"); const mobile = generateKeyPairSync("ed25519");
  return {
    recipient_public_key_pem: recipient.publicKey.export({ type: "spki", format: "pem" }).toString(),
    recipient_private_key_pem: recipient.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    recipient_key_sha256: keyFingerprint(recipient.publicKey, "x25519", "PLATYPUS_OTP_RECIPIENT_KEY_INVALID"),
    mobile_public_key_pem: mobile.publicKey.export({ type: "spki", format: "pem" }).toString(),
    mobile_private_key_pem: mobile.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    mobile_key_sha256: keyFingerprint(mobile.publicKey, "ed25519", "PLATYPUS_OTP_SIGNING_KEY_INVALID"),
  };
}
