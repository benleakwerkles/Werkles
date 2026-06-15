import { NextResponse } from "next/server";



import { buildCommandSurfaceView } from "@/lib/soledash/command-surface/build-view";

import { buildOsSurfaceView } from "@/lib/soledash/command-surface/os-view";

import { buildDecisionSurfaceView } from "@/lib/soledash/decision-surface/load-contract";
import { buildHomeFleet } from "@/lib/soledash/megawork-home/build-view";

import { loadSoleDashData } from "@/lib/soledash/cockpit-data";



export const dynamic = "force-dynamic";



export async function GET(request: Request) {

  try {

    const data = await loadSoleDashData();

    const view = buildCommandSurfaceView(data);

    const mode = new URL(request.url).searchParams.get("mode");

    if (mode === "decision") {
      const machineLabel = data.machineCard.werklesName;
      const { fleet, fleet_state_loaded } = buildHomeFleet(machineLabel);

      return NextResponse.json({
        ok: true,
        view,
        decisionView: buildDecisionSurfaceView(machineLabel),
        homeFleet: fleet,
        fleetStateLoaded: fleet_state_loaded
      });
    }

    if (mode === "os") {

      return NextResponse.json({ ok: true, view, osView: buildOsSurfaceView(data) });

    }

    return NextResponse.json({ ok: true, view });

  } catch (err) {

    return NextResponse.json(

      { ok: false, error: err instanceof Error ? err.message : "Failed to load command surface." },

      { status: 500 }

    );

  }

}

