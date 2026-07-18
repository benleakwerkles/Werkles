import { NextResponse } from "next/server";

import { harveyPrivateCookieName, harveyPrivateSameOrigin } from "@/lib/harvey/private-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!harveyPrivateSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "REQUEST_ORIGIN_REJECTED" }, { status: 403, headers: { "cache-control": "no-store, max-age=0" } });
  }
  const response = NextResponse.redirect(new URL("/harvey-access", request.url), 303);
  response.headers.set("cache-control", "no-store, max-age=0");
  response.cookies.set(harveyPrivateCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0)
  });
  return response;
}
