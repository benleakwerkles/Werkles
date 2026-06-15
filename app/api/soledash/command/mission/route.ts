import { NextResponse } from "next/server";

import { buildMachineCapsule } from "@/lib/soledash/command-surface/machine-capsule";
import { buildMissionPacket, classifyMission } from "@/lib/soledash/command-surface/mission-router";

export const dynamic = "force-dynamic";

type MissionBody = {
  mission?: string;
  includeCapsule?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MissionBody;
    const rawMission = body.mission?.trim() ?? "";

    if (!rawMission) {
      return NextResponse.json({ ok: false, error: "Empty mission text." }, { status: 400 });
    }

    const classification = classifyMission(rawMission);
    let capsuleSnippet = "(Capsule omitted — regenerate from Machine State lane.)";

    if (body.includeCapsule !== false) {
      const capsule = await buildMachineCapsule();
      capsuleSnippet = capsule.handoffBlock;
    }

    const packet = buildMissionPacket({ rawMission, classification, capsuleSnippet });

    return NextResponse.json({ ok: true, classification, packet });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Mission routing failed." },
      { status: 500 }
    );
  }
}
