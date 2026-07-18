import { createHash, createPublicKey, timingSafeEqual, verify } from "node:crypto";

import { HarveyControlError } from "@/lib/harvey/machine-control";

export const EPHEMERAL_RSA_AUTH_MODE = "EPHEMERAL_RSA_V1" as const;
export const EPHEMERAL_RSA_AUDIENCE = "HARVEY_HANDEYE" as const;
export const EPHEMERAL_RSA_SIGNATURE_WINDOW_SECONDS = 90;

const HEX_128_PATTERN = /^[a-f0-9]{32}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export type EphemeralRsaPublicJwk = {
  kty: "RSA";
  n: string;
  e: string;
};

export type EphemeralRsaEnvelope = {
  kind: "ephemeral-rsa";
  authMode: typeof EPHEMERAL_RSA_AUTH_MODE;
  credentialId: string;
  timestamp: string;
  nonce: string;
  signature: string;
};

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized + "=".repeat((4 - (normalized.length % 4)) % 4), "base64");
}

function hasExactKeys(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

export function requireRsa2048PublicJwk(value: unknown): EphemeralRsaPublicJwk {
  if (!hasExactKeys(value, ["kty", "n", "e"])) throw new HarveyControlError("HANDEYE_PAIRING_PUBLIC_KEY_INVALID", 400);
  const candidate = value as { kty?: unknown; n?: unknown; e?: unknown };
  const n = String(candidate.n ?? "");
  const e = String(candidate.e ?? "");
  if (candidate.kty !== "RSA" || !BASE64URL_PATTERN.test(n) || !BASE64URL_PATTERN.test(e)) {
    throw new HarveyControlError("HANDEYE_PAIRING_PUBLIC_KEY_INVALID", 400);
  }
  if (decodeBase64Url(n).byteLength !== 256 || decodeBase64Url(e).byteLength < 1 || decodeBase64Url(e).byteLength > 4) {
    throw new HarveyControlError("HANDEYE_PAIRING_RSA_2048_REQUIRED", 400);
  }
  try {
    const key = createPublicKey({ key: { kty: "RSA", n, e }, format: "jwk" });
    if (key.asymmetricKeyType !== "rsa" || key.asymmetricKeyDetails?.modulusLength !== 2048) {
      throw new Error("not RSA-2048");
    }
  } catch {
    throw new HarveyControlError("HANDEYE_PAIRING_PUBLIC_KEY_INVALID", 400);
  }
  return { kty: "RSA", n, e };
}

export function publicJwkSha256(jwk: EphemeralRsaPublicJwk) {
  return createHash("sha256").update(`RSA\n${jwk.n}\n${jwk.e}`, "utf8").digest("hex");
}

export function parseEphemeralRsaEnvelope(request: Request): EphemeralRsaEnvelope {
  const authMode = (request.headers.get("x-harvey-auth-mode") ?? "").trim();
  if (authMode !== EPHEMERAL_RSA_AUTH_MODE) throw new HarveyControlError("EPHEMERAL_AUTH_MODE_INVALID", 401);
  const credentialId = (request.headers.get("x-harvey-credential-id") ?? "").trim().toLowerCase();
  if (!/^betsy_pair_[a-f0-9]{32}$/.test(credentialId)) throw new HarveyControlError("EPHEMERAL_CREDENTIAL_ID_INVALID", 401);
  const timestamp = (request.headers.get("x-harvey-timestamp") ?? "").trim();
  const timestampSeconds = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || !Number.isSafeInteger(timestampSeconds)) {
    throw new HarveyControlError("REQUEST_TIMESTAMP_INVALID", 401);
  }
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > EPHEMERAL_RSA_SIGNATURE_WINDOW_SECONDS) {
    throw new HarveyControlError("REQUEST_TIMESTAMP_EXPIRED", 401);
  }
  const nonce = (request.headers.get("x-harvey-nonce") ?? "").trim().toLowerCase();
  if (!HEX_128_PATTERN.test(nonce)) throw new HarveyControlError("REQUEST_NONCE_INVALID", 401);
  const signature = (request.headers.get("x-harvey-signature") ?? "").trim();
  if (!signature || !BASE64URL_PATTERN.test(signature)) throw new HarveyControlError("REQUEST_SIGNATURE_REQUIRED", 401);
  if (request.headers.get("x-harvey-machine") || request.headers.get("x-harvey-agent-id")) {
    throw new HarveyControlError("EPHEMERAL_CALLER_IDENTITY_FIELDS_FORBIDDEN", 400);
  }
  return { kind: "ephemeral-rsa", authMode: EPHEMERAL_RSA_AUTH_MODE, credentialId, timestamp, nonce, signature };
}

export function ephemeralRsaCanonicalRequest(request: Request, rawBody: string, envelope: EphemeralRsaEnvelope) {
  const url = new URL(request.url);
  if (url.search) throw new HarveyControlError("EPHEMERAL_REQUEST_QUERY_FORBIDDEN", 400);
  const bodySha256 = createHash("sha256").update(rawBody, "utf8").digest("hex");
  return [
    EPHEMERAL_RSA_AUTH_MODE,
    EPHEMERAL_RSA_AUDIENCE,
    envelope.credentialId,
    request.method.toUpperCase(),
    url.pathname,
    "Betsy",
    "BETSY",
    "handeye-betsy-betsy",
    envelope.timestamp,
    envelope.nonce,
    bodySha256
  ].join("\n");
}

export function verifyEphemeralRsaSignature(
  request: Request,
  rawBody: string,
  envelope: EphemeralRsaEnvelope,
  publicJwk: EphemeralRsaPublicJwk
) {
  const canonical = ephemeralRsaCanonicalRequest(request, rawBody, envelope);
  let signature: Buffer;
  try { signature = decodeBase64Url(envelope.signature); }
  catch { throw new HarveyControlError("INVALID_EPHEMERAL_SIGNATURE", 401); }
  if (signature.byteLength !== 256) throw new HarveyControlError("INVALID_EPHEMERAL_SIGNATURE", 401);
  const valid = verify(
    "RSA-SHA256",
    Buffer.from(canonical, "utf8"),
    createPublicKey({ key: publicJwk, format: "jwk" }),
    signature
  );
  if (!valid) throw new HarveyControlError("INVALID_EPHEMERAL_SIGNATURE", 401);
}

export function constantTimeHexEqual(actual: string, expected: string) {
  if (!/^[a-f0-9]+$/.test(actual) || !/^[a-f0-9]+$/.test(expected)) return false;
  const actualBytes = Buffer.from(actual, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
