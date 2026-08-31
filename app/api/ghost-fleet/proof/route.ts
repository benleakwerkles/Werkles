import { NextResponse } from "next/server";

import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled, listGhostMembers } from "@/lib/ghost-fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGhostFleetEnabled()) {
    return NextResponse.json(
      { error: "Ghost Fleet proof closed on this environment.", enabled: false },
      { status: 404 }
    );
  }

  const members = await listGhostMembers();
  const gaps = members.slice(0, 24).map((m) => ({
    ghostId: m.id,
    displayName: m.displayName,
    lane: m.lane,
    proofGaps: m.proofGaps,
    synthetic: true as const
  }));

  return NextResponse.json({
    synthetic: true,
    disclosure: GHOST_FLEET_DISCLOSURE,
    mode: "sandbox_dry_run",
    gaps
  });
}
