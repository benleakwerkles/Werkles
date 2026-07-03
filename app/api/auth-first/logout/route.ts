import { NextRequest, NextResponse } from "next/server";

const COOKIE_KEY = "werkles_dev_preview_session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?logged_out=1", request.url), 303);
  response.cookies.set(COOKIE_KEY, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax"
  });
  return response;
}
