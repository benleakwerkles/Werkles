import { NextRequest, NextResponse } from "next/server";

import { shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

const COOKIE_KEY = "werkles_dev_preview_session";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "").trim();
  const target = safeMemberReturnPath(form.get("next"));

  if (!shouldUseRuntimePreviewAuth() || !email || !password) {
    return NextResponse.redirect(new URL("/login?auth_error=missing_credentials", request.url), 303);
  }

  const response = NextResponse.redirect(new URL(target, request.url), 303);
  response.cookies.set(
    COOKIE_KEY,
    JSON.stringify({
      userId: "dev-preview-user",
      email
    }),
    {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax"
    }
  );
  return response;
}
