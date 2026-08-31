import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/supabase/request";
import { isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import {
  BELLOWS_OWNER_COOKIE,
  bellowsOwnerCookieOptions,
  isValidBellowsOwnerId
} from "@/lib/squibb/bellows-owner-session";
import { adoptLatestSpeakerIntakeForOwner } from "@/lib/squibb/concierge-intake-storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const targetOwnerId = `member_${auth.user.id}`;
  const currentOwnerId = request.cookies.get(BELLOWS_OWNER_COOKIE)?.value;
  const canRecoverSharedLocalIntake =
    process.env.VERCEL_ENV !== "production" &&
    isGhostFleetEnabled() &&
    currentOwnerId === "member_dev-preview-user";
  const recovered = canRecoverSharedLocalIntake && isValidBellowsOwnerId(currentOwnerId)
    ? await adoptLatestSpeakerIntakeForOwner(currentOwnerId, targetOwnerId)
    : null;

  const response = NextResponse.json({
    success: true,
    recoveredIntake: Boolean(recovered)
  });
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(BELLOWS_OWNER_COOKIE, targetOwnerId, bellowsOwnerCookieOptions());
  return response;
}
