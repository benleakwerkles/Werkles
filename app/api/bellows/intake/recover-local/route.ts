import { NextRequest, NextResponse } from "next/server";

import { isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import {
  BELLOWS_OWNER_COOKIE,
  bellowsOwnerCookieOptions
} from "@/lib/squibb/bellows-owner-session";
import { readLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";

export const runtime = "nodejs";

const LOCAL_PREVIEW_OWNER = "member_dev-preview-user";

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production" || !isGhostFleetEnabled()) {
    return NextResponse.json({ error: "Local walkthrough recovery is unavailable." }, { status: 404 });
  }

  const latest = await readLatestSpeakerIntakeForOwner(LOCAL_PREVIEW_OWNER);
  if (!latest) {
    return NextResponse.json({ error: "No local walkthrough Intake was found." }, { status: 404 });
  }

  /* Keep the browser's exact local hostname. Switching between localhost and
     127.0.0.1 would strand this host-scoped walkthrough cookie again. */
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/bellows/recommendations" }
  });
  response.cookies.set(BELLOWS_OWNER_COOKIE, LOCAL_PREVIEW_OWNER, bellowsOwnerCookieOptions());
  return response;
}
