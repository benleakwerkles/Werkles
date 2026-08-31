import { NextResponse } from "next/server";

import { loadOwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Caller's own surface state only. Resolved from the session cookie, never from a query param. */
export async function GET() {
  const state = await loadOwnerSurfaceState(await readBellowsOwnerIdFromCookies());
  return NextResponse.json({ state });
}
