import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OTP = /^\d{6}$/;
const DEFAULT_TTL_MS = 120_000;
const MAX_TTL_MS = 300_000;
const INPUT_FIELDS = ["binding", "now", "otp_material", "producer", "schema", "source", "ttl_ms"];
const BINDING_FIELDS = ["account_ref_sha256", "canonical_origin_sha256", "form_sha256", "operation_id_sha256", "route_epoch_sha256", "tab_id_sha256"];
const PRODUCER_FIELDS = ["actual_hostname", "role", "windows_user"];
const SOURCE_FIELDS = ["inbox_provider", "message_ref_sha256", "received_at", "sender_ref_sha256"];
const HANDLE_FIELDS = ["ref_sha256", "schema"];
const CONTEXT_FIELDS = ["binding", "now", "producer", "purpose"];
const PURPOSE = "DISNEY_MYDISNEY_EMAIL_OTP";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function plain(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}
function hashes(value, fields, code) { for (const field of fields) if (!HASH.test(value[field] ?? "")) fail(code); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function iso(value, code) { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) fail(code); return parsed; }

function validateBinding(value, code) { exact(value, BINDING_FIELDS, code); hashes(value, BINDING_FIELDS, code); }
function validateProducer(value, code) {
  exact(value, PRODUCER_FIELDS, code);
  if (![value.role, value.actual_hostname, value.windows_user].every((entry) => typeof entry === "string" && entry.length >= 1 && entry.length <= 160)) fail(code);
}
function validateSource(value, code) {
  exact(value, SOURCE_FIELDS, code);
  if (typeof value.inbox_provider !== "string" || !HASH.test(value.message_ref_sha256 ?? "") || (value.sender_ref_sha256 !== null && !HASH.test(value.sender_ref_sha256 ?? "")) || (value.received_at !== null && !Number.isFinite(Date.parse(value.received_at)))) fail(code);
}
function custody(binding, producer, source, createdAt, expiresAt, nonceSha256) {
  return { purpose: PURPOSE, binding, producer, source, created_at: createdAt, expires_at: expiresAt, nonce_sha256: nonceSha256 };
}
function entropyFor(refSha256, custodySha256) { return Buffer.from(canonicalJson({ schema: "pookakind.stewart-private-inbox-email-otp-entropy/v1", purpose: PURPOSE, ref_sha256: refSha256, custody_sha256: custodySha256 }), "utf8"); }

export async function createStewartPrivateInboxEmailOtpHandle(rawInput, adapters) {
  plain(rawInput, "STEWART_PRIVATE_INBOX_OTP_INPUT_INVALID"); exact(rawInput, INPUT_FIELDS, "STEWART_PRIVATE_INBOX_OTP_INPUT_INVALID");
  if (rawInput.schema !== "pookakind.stewart-private-inbox-email-otp-create-input/v1" || !Number.isFinite(rawInput.now)) fail("STEWART_PRIVATE_INBOX_OTP_INPUT_INVALID");
  validateBinding(rawInput.binding, "STEWART_PRIVATE_INBOX_OTP_BINDING_INVALID"); validateProducer(rawInput.producer, "STEWART_PRIVATE_INBOX_OTP_PRODUCER_INVALID"); validateSource(rawInput.source, "STEWART_PRIVATE_INBOX_OTP_SOURCE_INVALID");
  const ttl = rawInput.ttl_ms ?? DEFAULT_TTL_MS;
  if (!Number.isSafeInteger(ttl) || ttl < 1 || ttl > MAX_TTL_MS || typeof rawInput.otp_material !== "string" || !OTP.test(rawInput.otp_material)) fail("STEWART_PRIVATE_INBOX_OTP_MATERIAL_INVALID");
  if (typeof adapters?.randomBytes !== "function" || typeof adapters?.protect !== "function" || typeof adapters?.signRecord !== "function" || typeof adapters?.store?.create !== "function") fail("STEWART_PRIVATE_INBOX_OTP_ADAPTER_INVALID");
  const material = Buffer.from(rawInput.otp_material, "utf8");
  let entropy;
  try {
    const nonce = Buffer.from(await adapters.randomBytes(32));
    if (nonce.length !== 32) fail("STEWART_PRIVATE_INBOX_OTP_NONCE_INVALID");
    const createdAt = new Date(rawInput.now).toISOString(); const expiresAt = new Date(rawInput.now + ttl).toISOString();
    const nonceSha256 = createHash("sha256").update(nonce).digest("hex"); nonce.fill(0);
    const custodyBody = custody(rawInput.binding, rawInput.producer, rawInput.source, createdAt, expiresAt, nonceSha256);
    const custodySha256 = digest(custodyBody);
    const handleId = Buffer.from(await adapters.randomBytes(32));
    if (handleId.length !== 32) fail("STEWART_PRIVATE_INBOX_OTP_HANDLE_ID_INVALID");
    const refSha256 = createHash("sha256").update(handleId).update(custodySha256).digest("hex"); handleId.fill(0);
    entropy = entropyFor(refSha256, custodySha256);
    const ciphertextBase64 = await adapters.protect(material, entropy);
    if (typeof ciphertextBase64 !== "string" || ciphertextBase64.length < 1) fail("STEWART_PRIVATE_INBOX_OTP_PROTECTION_FAILED");
    const signedPayload = { schema: "pookakind.stewart-private-inbox-email-otp-envelope-metadata/v1", ref_sha256: refSha256, custody_sha256: custodySha256, ...custodyBody };
    const signedRecord = await adapters.signRecord(signedPayload);
    const envelope = { schema: "pookakind.stewart-private-inbox-email-otp-envelope/v1", state: "PENDING", ref_sha256: refSha256, custody_sha256: custodySha256, ciphertext_base64: ciphertextBase64, signed_record: signedRecord };
    const envelopeSha256 = digest(envelope);
    if (await adapters.store.create(refSha256, envelope) !== true) fail("STEWART_PRIVATE_INBOX_OTP_STORE_FAILED");
    return freeze({ handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: refSha256 }, receipt: { schema: "pookakind.stewart-private-inbox-email-otp-handle-receipt/v1", state: "CREATED", handle_ref_sha256: refSha256, custody_sha256: custodySha256, envelope_sha256: envelopeSha256, created_at: createdAt, expires_at: expiresAt, secret_material_returned: false, otp_output_hash_storage_forbidden: true } });
  } finally {
    material.fill(0); if (entropy) entropy.fill(0);
  }
}

export async function resolveStewartPrivateInboxEmailOtpHandle(rawHandle, rawContext, adapters) {
  exact(rawHandle, HANDLE_FIELDS, "STEWART_PRIVATE_INBOX_OTP_HANDLE_INVALID");
  if (rawHandle.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(rawHandle.ref_sha256 ?? "")) fail("STEWART_PRIVATE_INBOX_OTP_HANDLE_INVALID");
  exact(rawContext, CONTEXT_FIELDS, "STEWART_PRIVATE_INBOX_OTP_CONTEXT_INVALID"); validateBinding(rawContext.binding, "STEWART_PRIVATE_INBOX_OTP_BINDING_INVALID"); validateProducer(rawContext.producer, "STEWART_PRIVATE_INBOX_OTP_PRODUCER_INVALID");
  if (rawContext.purpose !== PURPOSE || !Number.isFinite(rawContext.now) || typeof adapters?.store?.claim !== "function" || typeof adapters?.store?.consume !== "function" || typeof adapters?.verifyRecord !== "function" || typeof adapters?.unprotect !== "function") fail("STEWART_PRIVATE_INBOX_OTP_ADAPTER_INVALID");
  const claimed = await adapters.store.claim(rawHandle.ref_sha256);
  if (claimed?.state === "CONSUMED") fail("STEWART_PRIVATE_INBOX_OTP_ALREADY_CONSUMED");
  if (claimed?.state !== "CONSUMING" || !claimed.envelope) fail("STEWART_PRIVATE_INBOX_OTP_INDETERMINATE");
  const envelope = claimed.envelope;
  let entropy; let plaintext;
  try {
    if (envelope.schema !== "pookakind.stewart-private-inbox-email-otp-envelope/v1" || envelope.ref_sha256 !== rawHandle.ref_sha256 || !HASH.test(envelope.custody_sha256 ?? "") || typeof envelope.ciphertext_base64 !== "string") fail("STEWART_PRIVATE_INBOX_OTP_ENVELOPE_INVALID");
    const payload = await adapters.verifyRecord(envelope.signed_record);
    if (!payload || payload.schema !== "pookakind.stewart-private-inbox-email-otp-envelope-metadata/v1" || payload.ref_sha256 !== rawHandle.ref_sha256 || payload.custody_sha256 !== envelope.custody_sha256 || digest(custody(payload.binding, payload.producer, payload.source, payload.created_at, payload.expires_at, payload.nonce_sha256)) !== payload.custody_sha256) fail("STEWART_PRIVATE_INBOX_OTP_SIGNATURE_INVALID");
    validateBinding(payload.binding, "STEWART_PRIVATE_INBOX_OTP_BINDING_INVALID"); validateProducer(payload.producer, "STEWART_PRIVATE_INBOX_OTP_PRODUCER_INVALID");
    if (canonicalJson(payload.binding) !== canonicalJson(rawContext.binding) || canonicalJson(payload.producer) !== canonicalJson(rawContext.producer)) fail("STEWART_PRIVATE_INBOX_OTP_CUSTODY_CONFLICT");
    const created = iso(payload.created_at, "STEWART_PRIVATE_INBOX_OTP_TIME_INVALID"); const expires = iso(payload.expires_at, "STEWART_PRIVATE_INBOX_OTP_TIME_INVALID");
    if (expires <= created || expires - created > MAX_TTL_MS || rawContext.now < created || rawContext.now > expires) fail("STEWART_PRIVATE_INBOX_OTP_STALE");
    entropy = entropyFor(rawHandle.ref_sha256, envelope.custody_sha256);
    plaintext = Buffer.from(await adapters.unprotect(envelope.ciphertext_base64, entropy));
    const material = plaintext.toString("utf8");
    if (!OTP.test(material)) fail("STEWART_PRIVATE_INBOX_OTP_MATERIAL_INVALID");
    if (await adapters.store.consume(rawHandle.ref_sha256) !== true) fail("STEWART_PRIVATE_INBOX_OTP_CONSUME_FAILED");
    return { resolved: true, material };
  } finally {
    if (plaintext) plaintext.fill(0); if (entropy) entropy.fill(0);
  }
}

export async function inspectStewartPrivateInboxEmailOtpHandle(rawHandle, adapters) {
  exact(rawHandle, HANDLE_FIELDS, "STEWART_PRIVATE_INBOX_OTP_HANDLE_INVALID");
  if (rawHandle.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(rawHandle.ref_sha256 ?? "") || typeof adapters?.store?.inspect !== "function") fail("STEWART_PRIVATE_INBOX_OTP_HANDLE_INVALID");
  const state = await adapters.store.inspect(rawHandle.ref_sha256);
  if (!state || !["PENDING", "CONSUMING", "CONSUMED", "ABSENT"].includes(state.state)) fail("STEWART_PRIVATE_INBOX_OTP_INSPECTION_INVALID");
  return freeze({ schema: "pookakind.stewart-private-inbox-email-otp-inspection/v1", handle_ref_sha256: rawHandle.ref_sha256, state: state.state, secret_material_returned: false });
}

export const STEWART_PRIVATE_INBOX_EMAIL_OTP_PURPOSE = PURPOSE;
