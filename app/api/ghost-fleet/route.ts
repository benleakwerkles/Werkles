import { NextResponse } from "next/server";

import { ghostFleetMeta, isGhostFleetEnabled, listGhostMembers } from "@/lib/ghost-fleet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGhostFleetEnabled()) {
    return NextResponse.json(
      { error: "Ghost Fleet is closed on this environment.", enabled: false },
      { status: 404 }
    );
  }

  const [meta, members] = await Promise.all([ghostFleetMeta(), listGhostMembers()]);
  return NextResponse.json({
    ...meta,
    members: members.map((m) => ({
      id: m.id,
      synthetic: m.synthetic,
      displayName: m.displayName,
      city: m.city,
      region: m.region,
      lane: m.lane,
      roleLabel: m.roleLabel,
      skills: m.skills,
      statedNeed: m.statedNeed,
      proofGaps: m.proofGaps,
      introEligibility: m.introEligibility,
      handeyeSeat: m.handeyeSeat,
      faceAsset: m.faceAsset,
      faceStatus: m.faceStatus,
      workshopHeadline: m.workshopHeadline,
      workshopRows: m.workshopRows
    }))
  });
}
