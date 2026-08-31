import "server-only";

import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseForRequest } from "@/lib/supabase/request";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { isLocalWalkthroughSessionCookie } from "@/lib/local-walkthrough-header";

/** HttpOnly cookie that scopes anonymous local/preview personal readouts. */
export const BELLOWS_OWNER_COOKIE = "werkles_bellows_owner";

const OWNER_RE = /^(bellows_owner_|member_)[a-zA-Z0-9_-]+$/;

export function isValidBellowsOwnerId(value: string | undefined | null): value is string {
  return Boolean(value && OWNER_RE.test(value) && value.length <= 120);
}

export function newAnonymousBellowsOwnerId() {
  return `bellows_owner_${randomUUID()}`;
}

export function bellowsOwnerCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 90) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.VERCEL_ENV === "production",
    maxAge: maxAgeSeconds
  };
}

/**
 * Soft auth: bearer user → member_<id>; else existing owner cookie; else mint anonymous.
 * Used on intake POST so the readout can bind to the same owner.
 */
export async function resolveBellowsOwnerForIntakeRequest(request: NextRequest): Promise<{
  ownerId: string;
  setCookie: boolean;
}> {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token && token !== "dev-preview-token") {
    try {
      const supabase = getSupabaseForRequest(request);
      const { data } = await supabase.auth.getUser(token);
      if (data.user?.id) {
        const ownerId = `member_${data.user.id}`;
        return {
          ownerId,
          setCookie: request.cookies.get(BELLOWS_OWNER_COOKIE)?.value !== ownerId
        };
      }
    } catch {
      /* fall through to cookie / anonymous */
    }
  }

  if (token === "dev-preview-token") {
    const existing = request.cookies.get(BELLOWS_OWNER_COOKIE)?.value;
    if (isValidBellowsOwnerId(existing) && existing.startsWith("member_")) {
      return { ownerId: existing, setCookie: false };
    }
    return { ownerId: "member_dev-preview-user", setCookie: true };
  }

  const existing = request.cookies.get(BELLOWS_OWNER_COOKIE)?.value;
  if (isValidBellowsOwnerId(existing)) {
    return { ownerId: existing, setCookie: false };
  }

  return { ownerId: newAnonymousBellowsOwnerId(), setCookie: true };
}

/** Read owner cookie for RSC/pages. Does not mint — unbound stays example/empty. */
export async function readBellowsOwnerIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const localSession = jar.get("werkles_dev_preview_session")?.value;
  if (isLocalRoutePreviewUnlocked() && isLocalWalkthroughSessionCookie(localSession)) {
    return "member_dev-preview-user";
  }
  const value = jar.get(BELLOWS_OWNER_COOKIE)?.value;
  return isValidBellowsOwnerId(value) ? value : null;
}
