import { NextResponse } from "next/server";

import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled, matchGhostsForOwner } from "@/lib/ghost-fleet";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGhostFleetEnabled()) {
    return NextResponse.json(
      { error: "Ghost Fleet intros closed on this environment.", enabled: false },
      { status: 404 }
    );
  }

  const ownerId = await readBellowsOwnerIdFromCookies();
  if (!ownerId) {
    return NextResponse.json({
      synthetic: true,
      disclosure: GHOST_FLEET_DISCLOSURE,
      state: "no_intake",
      message: "Answer the Werkles questions first. Candidates are ranked against what you deliberately told Werkles—not a generic list.",
      result: null
    });
  }

  const result = await matchGhostsForOwner(ownerId, 12);
  if (!result) {
    return NextResponse.json({
      synthetic: true,
      disclosure: GHOST_FLEET_DISCLOSURE,
      state: "no_intake",
      message: "No intake found for this session yet.",
      result: null
    });
  }

  return NextResponse.json({
    synthetic: true,
    disclosure: GHOST_FLEET_DISCLOSURE,
    state: result.candidates.length > 0 ? "ranked" : "no_honest_match",
    message:
      result.candidates.length > 0
        ? "Ranked against your intake. Ranking is not verification and Werkles cannot introduce you."
        : "No synthetic member scored an honest reason against your intake. Empty is a valid answer.",
    result
  });
}
