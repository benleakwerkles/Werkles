import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createHarveyPrivateSession,
  harveyPrivateAccessConfigured,
  harveyPrivateCookieName,
  harveyPrivateSameOrigin,
  harveyPrivateSessionCookieOptions,
  verifyHarveyPrivatePassword
} from "@/lib/harvey/private-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGIN_BODY_BYTES = 2048;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_RATE_LIMIT_KEYS = 2048;
const attempts = new Map<string, { failures: number; firstAt: number; lockedUntil: number }>();
const headers = { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" };

function attemptKey(request: Request) {
  const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  const source = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(source, "utf8").digest("hex");
}

function currentAttempt(key: string, now: number) {
  for (const [candidate, value] of attempts) {
    if (now - value.firstAt > ATTEMPT_WINDOW_MS && value.lockedUntil <= now) attempts.delete(candidate);
  }
  const value = attempts.get(key);
  if (!value || now - value.firstAt > ATTEMPT_WINDOW_MS) return { failures: 0, firstAt: now, lockedUntil: 0 };
  return value;
}

async function readLoginBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_LOGIN_REQUEST");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_LOGIN_BODY_BYTES) {
      await reader.cancel("LOGIN_BODY_TOO_LARGE");
      throw new Error("LOGIN_BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

export async function POST(request: Request) {
  if (!harveyPrivateSameOrigin(request)) return NextResponse.json({ ok: false, error: "REQUEST_ORIGIN_REJECTED" }, { status: 403, headers });
  if (!harveyPrivateAccessConfigured()) return NextResponse.json({ ok: false, error: "HARVEY_PRIVATE_ACCESS_UNAVAILABLE" }, { status: 503, headers });
  const advertisedLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_LOGIN_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "LOGIN_BODY_TOO_LARGE" }, { status: 413, headers });
  }
  const key = attemptKey(request);
  const now = Date.now();
  const attempt = currentAttempt(key, now);
  if (attempt.lockedUntil > now) {
    const retryAfter = Math.max(1, Math.ceil((attempt.lockedUntil - now) / 1000));
    return NextResponse.json({ ok: false, error: "LOGIN_RATE_LIMITED" }, { status: 429, headers: { ...headers, "retry-after": String(retryAfter) } });
  }
  if (!attempts.has(key) && attempts.size >= MAX_RATE_LIMIT_KEYS) {
    return NextResponse.json({ ok: false, error: "LOGIN_RATE_LIMITED" }, { status: 429, headers: { ...headers, "retry-after": "60" } });
  }

  let body: { password?: unknown; remember?: unknown };
  try {
    body = JSON.parse(await readLoginBody(request)) as { password?: unknown; remember?: unknown };
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "LOGIN_BODY_TOO_LARGE";
    return NextResponse.json({ ok: false, error: tooLarge ? "LOGIN_BODY_TOO_LARGE" : "INVALID_LOGIN_REQUEST" }, { status: tooLarge ? 413 : 400, headers });
  }
  const password = typeof body.password === "string" ? body.password : "";
  const reservedFailures = attempt.failures + 1;
  attempts.set(key, {
    failures: reservedFailures,
    firstAt: attempt.firstAt,
    lockedUntil: reservedFailures >= MAX_FAILURES ? now + LOCK_MS : 0
  });
  const valid = await verifyHarveyPrivatePassword(password);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401, headers });
  }

  attempts.delete(key);
  const session = createHarveyPrivateSession(body.remember === true);
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(harveyPrivateCookieName(), session.token, harveyPrivateSessionCookieOptions(session.remember));
  return response;
}
