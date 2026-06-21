import { NextResponse } from "next/server";

import { buildAgentInventoryRoster } from "@/lib/soledash/agent-inventory/build-roster";
import { buildMachineWallHealth } from "@/lib/soledash/machine-wall/build-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const roster = buildAgentInventoryRoster();
    const machineWall = buildMachineWallHealth();
    return NextResponse.json({ ok: true, roster, machineWall });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Agent inventory failed" },
      { status: 500 }
    );
  }
}
