import { NextRequest, NextResponse } from "next/server";

import { shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import {
  BELLOWS_OWNER_COOKIE,
  bellowsOwnerCookieOptions
} from "@/lib/squibb/bellows-owner-session";

const COOKIE_KEY = "werkles_dev_preview_session";

function safeLocalTarget(value: string, requestUrl: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return new URL("/dashboard", requestUrl);
  }

  const target = new URL(value, requestUrl);
  return target.origin === new URL(requestUrl).origin
    ? target
    : new URL("/dashboard", requestUrl);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "").trim();
  const next = String(form.get("next") || "/dashboard");
  const target = safeLocalTarget(next, request.url);

  if (!shouldUseRuntimePreviewAuth() || !email || !password) {
    return NextResponse.redirect(new URL("/login?auth_error=missing_credentials", request.url), 303);
  }

  const response = NextResponse.redirect(target, 303);
  response.cookies.set(
    COOKIE_KEY,
    JSON.stringify({
      userId: "dev-preview-user",
      email
    }),
    bellowsOwnerCookieOptions(60 * 60 * 24)
  );
  response.cookies.set(
    BELLOWS_OWNER_COOKIE,
    "member_dev-preview-user",
    bellowsOwnerCookieOptions()
  );
  return response;
}
