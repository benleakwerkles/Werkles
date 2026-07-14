import { NextResponse, type NextRequest } from "next/server";

import { shouldDenyInternalRoute } from "./lib/route-audience";

export function middleware(request: NextRequest) {
  if (
    shouldDenyInternalRoute({
      pathname: request.nextUrl.pathname,
      hostname: request.nextUrl.hostname,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      internalPreviewAccess: process.env.WERKLES_INTERNAL_PREVIEW_ACCESS,
      hasVercelProtectionBypass: request.headers.has("x-vercel-protection-bypass")
    })
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/operator/:path*",
    "/thinkit/:path*",
    "/tinkerden/:path*",
    "/soledash/:path*",
    "/gd/:path*",
    "/nerdkle/:path*",
    "/api/soledash/:path*",
    "/api/tinkerden/:path*",
    "/api/thinkit/:path*",
    "/api/nerdkle/:path*",
    "/api/organism/:path*",
    "/api/speaker/:path*"
  ]
};
