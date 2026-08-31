import { NextResponse } from "next/server";

import { loadRecommendationView } from "@/lib/recommendation-view/model";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Caller's own readout only. Owner comes from the session cookie, never a query param. */
export async function GET() {
  const view = await loadRecommendationView(await readBellowsOwnerIdFromCookies());
  return NextResponse.json({ view });
}
