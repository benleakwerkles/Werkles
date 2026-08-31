import { NextResponse } from "next/server";

import {
  GHOST_FLEET_DISCLOSURE,
  isGhostFleetEnabled,
  workshopSnapshotsForFleet
} from "@/lib/ghost-fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGhostFleetEnabled()) {
    return NextResponse.json(
      { error: "Ghost Fleet workshop closed on this environment.", enabled: false },
      { status: 404 }
    );
  }

  const workshops = await workshopSnapshotsForFleet(16);
  return NextResponse.json({
    synthetic: true,
    disclosure: GHOST_FLEET_DISCLOSURE,
    workshops
  });
}
