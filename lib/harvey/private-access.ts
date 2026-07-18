import "server-only";

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

const VERIFIER_PREFIX = "scrypt-v1";
const SCRYPT_N = 131_072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_BYTES = 32;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;
const SESSION_VERSION = "v1";
const SESSION_PURPOSE = "werkles-harvey-private-session";
const SESSION_SHORT_SECONDS = 12 * 60 * 60;
const SESSION_REMEMBERED_SECONDS = 7 * 24 * 60 * 60;
const SESSION_CLOCK_SKEW_SECONDS = 60;
const SESSION_NONCE_BYTES = 24;
const SESSION_SECRET_MIN_BYTES = 32;
const PASSWORD_MAX_BYTES = 1024;

export class HarveyPrivateAccessConfigurationError extends Error {
  constructor() {
    super("HARVEY_PRIVATE_ACCESS_NOT_CONFIGURED");
    this.name = "HarveyPrivateAccessConfigurationError";
  }
}

export function harveyPrivateAccessRequired() {
  return process.env.NODE_ENV === "production" || process.env.HARVEY_PRIVATE_ACCESS_ENFORCED === "1";
}

export function harveyPrivateCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-harvey_private" : "harvey_private_dev";
}

function base64UrlBytes(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new HarveyPrivateAccessConfigurationError();
  try {
    return Buffer.from(value, "base64url");
  } catch {
    throw new HarveyPrivateAccessConfigurationError();
  }
}

function passwordVerifier() {
  const source = process.env.HARVEY_PRIVATE_PASSWORD_VERIFIER ?? "";
  const fields = source.split("$");
  if (fields.length !== 6 || fields[0] !== VERIFIER_PREFIX) throw new HarveyPrivateAccessConfigurationError();
  const n = Number(fields[1]);
  const r = Number(fields[2]);
  const p = Number(fields[3]);
  const salt = base64UrlBytes(fields[4]);
  const expected = base64UrlBytes(fields[5]);
  if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P || salt.byteLength < 16 || salt.byteLength > 64 || expected.byteLength !== SCRYPT_KEY_BYTES) {
    throw new HarveyPrivateAccessConfigurationError();
  }
  return { n, r, p, salt, expected };
}

function sessionSecret() {
  const value = process.env.HARVEY_PRIVATE_SESSION_SECRET ?? "";
  const bytes = Buffer.from(value, "utf8");
  if (bytes.byteLength < SESSION_SECRET_MIN_BYTES) throw new HarveyPrivateAccessConfigurationError();
  return bytes;
}

export function harveyPrivateAccessConfigured() {
  try {
    passwordVerifier();
    sessionSecret();
    return true;
  } catch {
    return false;
  }
}

export async function verifyHarveyPrivatePassword(candidate: string) {
  const verifier = passwordVerifier();
  const candidateBytes = Buffer.from(candidate, "utf8");
  if (candidateBytes.byteLength < 1 || candidateBytes.byteLength > PASSWORD_MAX_BYTES) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(candidateBytes, verifier.salt, SCRYPT_KEY_BYTES, {
      N: verifier.n,
      r: verifier.r,
      p: verifier.p,
      maxmem: SCRYPT_MAX_MEMORY
    }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey));
  });
  return actual.byteLength === verifier.expected.byteLength && timingSafeEqual(actual, verifier.expected);
}

function signSessionFields(version: string, issuedAt: string, expiresAt: string, nonce: string) {
  return createHmac("sha256", sessionSecret())
    .update([version, issuedAt, expiresAt, nonce, SESSION_PURPOSE].join("\n"), "utf8")
    .digest("base64url");
}

function safeTextEqual(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.byteLength === expectedBytes.byteLength && timingSafeEqual(actualBytes, expectedBytes);
}

export function createHarveyPrivateSession(remember: boolean, nowSeconds = Math.floor(Date.now() / 1000)) {
  const lifetime = remember ? SESSION_REMEMBERED_SECONDS : SESSION_SHORT_SECONDS;
  const issuedAt = String(nowSeconds);
  const expiresAt = String(nowSeconds + lifetime);
  const nonce = randomBytes(SESSION_NONCE_BYTES).toString("base64url");
  const signature = signSessionFields(SESSION_VERSION, issuedAt, expiresAt, nonce);
  return {
    token: [SESSION_VERSION, issuedAt, expiresAt, nonce, signature].join("."),
    lifetime,
    remember
  };
}

export function verifyHarveyPrivateSession(token: string | undefined, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!token) return false;
  const fields = token.split(".");
  if (fields.length !== 5) return false;
  const [version, issuedAtText, expiresAtText, nonce, signature] = fields;
  if (version !== SESSION_VERSION || !/^\d{10}$/.test(issuedAtText) || !/^\d{10}$/.test(expiresAtText)) return false;
  if (!/^[A-Za-z0-9_-]{32}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;
  const issuedAt = Number(issuedAtText);
  const expiresAt = Number(expiresAtText);
  const lifetime = expiresAt - issuedAt;
  if (![SESSION_SHORT_SECONDS, SESSION_REMEMBERED_SECONDS].includes(lifetime)) return false;
  if (issuedAt > nowSeconds + SESSION_CLOCK_SKEW_SECONDS || expiresAt <= nowSeconds) return false;
  const expected = signSessionFields(version, issuedAtText, expiresAtText, nonce);
  return safeTextEqual(signature, expected);
}

function cookieValue(header: string | null, name: string) {
  const prefix = `${name}=`;
  const item = (header ?? "").split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix));
  if (!item) return undefined;
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return undefined;
  }
}

export function harveyPrivateSessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    priority: "high" as const,
    ...(remember ? { maxAge: SESSION_REMEMBERED_SECONDS } : {})
  };
}

export async function hasHarveyPrivatePageSession() {
  if (!harveyPrivateAccessRequired()) return true;
  if (!harveyPrivateAccessConfigured()) return false;
  const store = await cookies();
  return verifyHarveyPrivateSession(store.get(harveyPrivateCookieName())?.value);
}

export async function requireHarveyPrivatePageSession() {
  if (await hasHarveyPrivatePageSession()) return;
  redirect("/harvey-access");
}

export async function harveyPrivateApiGate(request: Request) {
  if (!harveyPrivateAccessRequired()) return null;
  if (!harveyPrivateAccessConfigured()) {
    return NextResponse.json(
      { ok: false, error: "HARVEY_PRIVATE_ACCESS_UNAVAILABLE" },
      { status: 503, headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" } }
    );
  }
  const token = cookieValue(request.headers.get("cookie"), harveyPrivateCookieName());
  if (verifyHarveyPrivateSession(token)) return null;
  return NextResponse.json(
    { ok: false, error: "HARVEY_PRIVATE_SESSION_REQUIRED" },
    { status: 401, headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" } }
  );
}

export function harveyPrivateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return !harveyPrivateAccessRequired();
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const requestHost = (request.headers.get("host") ?? requestUrl.host).trim().toLowerCase();
    return originUrl.host.toLowerCase() === requestHost && originUrl.protocol === requestUrl.protocol;
  } catch {
    return false;
  }
}
