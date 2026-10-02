import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  timingSafeEqual,
  verify,
} from "node:crypto";

export function canonicalJson(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    if (
      keys.length !== value.length
      || keys.some((key, index) => key !== String(index))
    ) throw new Error("CANONICAL_JSON_VALUE_INVALID");
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("CANONICAL_JSON_VALUE_INVALID");
    }
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  if (
    (typeof value === "number" && !Number.isFinite(value))
    || !["string", "number", "boolean"].includes(typeof value)
  ) throw new Error("CANONICAL_JSON_VALUE_INVALID");
  return JSON.stringify(value);
}

export function generateIdentity() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    public_key_pem: publicKey.export({ type: "spki", format: "pem" }),
    private_key_pem: privateKey.export({ type: "pkcs8", format: "pem" }),
    public_key_sha256: keyFingerprint(publicKey),
  };
}

export function keyFingerprint(keyValue) {
  const key = typeof keyValue === "string" ? createPublicKey(keyValue) : keyValue;
  if (key.asymmetricKeyType !== "ed25519") throw new Error("IDENTITY_KEY_ALGORITHM_INVALID");
  return createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");
}

export function signEnvelope(privateKeyPem, payload, { issuer, audience, lifetimeSeconds = 120, now = new Date(), nonce = randomBytes(16).toString("hex") }) {
  if (!issuer || !audience || !Number.isInteger(lifetimeSeconds) || lifetimeSeconds < 1 || lifetimeSeconds > 900) throw new Error("ENVELOPE_INPUT_INVALID");
  const unsigned = {
    schema: "werkles.harvey-signed-envelope/v1",
    issuer,
    audience,
    nonce,
    issued_at: now.toISOString(),
    expires_at: new Date(now.getTime() + lifetimeSeconds * 1000).toISOString(),
    payload,
  };
  return {
    ...unsigned,
    signature_ed25519: sign(null, Buffer.from(canonicalJson(unsigned)), createPrivateKey(privateKeyPem)).toString("base64"),
  };
}

export function verifyEnvelope(publicKeyPem, envelope, {
  issuer,
  audience,
  now = new Date(),
  maximumClockSkewSeconds = 30,
  consumeNonce,
} = {}) {
  const expected = ["schema", "issuer", "audience", "nonce", "issued_at", "expires_at", "payload", "signature_ed25519"].sort();
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope) || Object.keys(envelope).sort().join("|") !== expected.join("|")) throw new Error("ENVELOPE_SCHEMA_INVALID");
  if (envelope.schema !== "werkles.harvey-signed-envelope/v1" || !/^[a-f0-9]{32}$/.test(envelope.nonce) || envelope.issuer !== issuer || envelope.audience !== audience) throw new Error("ENVELOPE_SCOPE_INVALID");
  const issued = Date.parse(envelope.issued_at);
  const expires = Date.parse(envelope.expires_at);
  const timestamp = now.getTime();
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued || expires - issued > 900_000 || issued > timestamp + maximumClockSkewSeconds * 1000 || expires < timestamp - maximumClockSkewSeconds * 1000) throw new Error("ENVELOPE_EXPIRED");
  const { signature_ed25519: signature, ...unsigned } = envelope;
  if (!verify(null, Buffer.from(canonicalJson(unsigned)), createPublicKey(publicKeyPem), Buffer.from(signature, "base64"))) throw new Error("ENVELOPE_SIGNATURE_INVALID");
  if (consumeNonce && !consumeNonce(envelope.nonce, envelope.expires_at)) throw new Error("ENVELOPE_REPLAYED");
  return structuredClone(envelope.payload);
}

export function signDurableRecord(privateKeyPem, payload, { issuer, audience }) {
  if (!issuer || !audience || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("DURABLE_RECORD_INPUT_INVALID");
  }
  const privateKey = createPrivateKey(privateKeyPem);
  const unsigned = {
    schema: "werkles.harvey-signed-durable-record/v1",
    issuer,
    audience,
    signer_public_key_sha256: keyFingerprint(createPublicKey(privateKey)),
    payload,
  };
  return {
    ...unsigned,
    signature_ed25519: sign(
      null,
      Buffer.from(canonicalJson(unsigned)),
      privateKey
    ).toString("base64"),
  };
}

export function verifyDurableRecord(publicKeyPem, record, { issuer, audience } = {}) {
  const expected = ["schema", "issuer", "audience", "signer_public_key_sha256", "payload", "signature_ed25519"].sort();
  const publicKey = createPublicKey(publicKeyPem);
  if (
    !record
    || typeof record !== "object"
    || Array.isArray(record)
    || Object.keys(record).sort().join("|") !== expected.join("|")
    || record.schema !== "werkles.harvey-signed-durable-record/v1"
    || record.issuer !== issuer
    || record.audience !== audience
    || record.signer_public_key_sha256 !== keyFingerprint(publicKey)
    || !record.payload
    || typeof record.payload !== "object"
    || Array.isArray(record.payload)
  ) throw new Error("DURABLE_RECORD_SCHEMA_INVALID");
  const { signature_ed25519: signature, ...unsigned } = record;
  if (
    typeof signature !== "string"
    || !verify(
      null,
      Buffer.from(canonicalJson(unsigned)),
      publicKey,
      Buffer.from(signature, "base64")
    )
  ) throw new Error("DURABLE_RECORD_SIGNATURE_INVALID");
  return structuredClone(record.payload);
}

export function constantTimeTokenMatch(token, expectedSha256) {
  const actual = createHash("sha256").update(token, "utf8").digest();
  const expected = Buffer.from(expectedSha256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
