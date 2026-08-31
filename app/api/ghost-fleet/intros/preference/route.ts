import { NextRequest, NextResponse } from "next/server";

import { buildGhostInteractionMember } from "@/lib/ghost-fleet/interaction";
import { isGhostFleetEnabled, listGhostMembers, matchGhostsForOwner } from "@/lib/ghost-fleet";
import { readGhostLocationPreference, storeGhostLocationPreference } from "@/lib/ghost-fleet/preference-storage";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readout(ownerId: string) {
  const [location, result, fleet] = await Promise.all([
    readGhostLocationPreference(ownerId),
    matchGhostsForOwner(ownerId, 12),
    listGhostMembers()
  ]);
  const byId = new Map(fleet.map((member) => [member.id, member]));
  const members = (result?.candidates ?? []).slice(0, 9).flatMap((candidate) => {
    const member = byId.get(candidate.ghostId);
    const interaction = member ? buildGhostInteractionMember(member, {
      rank: candidate.rank,
      orderReason: candidate.orderReason,
      proximityLabel: candidate.proximity.label,
      reasons: candidate.reasons,
      cautions: candidate.blockers,
      snapshotNeed: result?.statedNeed ?? undefined
    }) : null;
    return interaction ? [interaction] : [];
  });
  return { location, members };
}

export async function GET() {
  if (!isGhostFleetEnabled() || !isLocalRoutePreviewUnlocked()) {
    return NextResponse.json({ error: "Local matching preference is unavailable." }, { status: 404 });
  }
  const ownerId = await readBellowsOwnerIdFromCookies();
  if (!ownerId) return NextResponse.json({ error: "Complete Intake first." }, { status: 404 });
  const response = NextResponse.json(await readout(ownerId));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isGhostFleetEnabled() || !isLocalRoutePreviewUnlocked()) {
    return NextResponse.json({ error: "Local matching preference is unavailable." }, { status: 404 });
  }
  const ownerId = await readBellowsOwnerIdFromCookies();
  if (!ownerId) return NextResponse.json({ error: "Complete Intake first." }, { status: 404 });
  try {
    const body = await request.json();
    await storeGhostLocationPreference(ownerId, body);
    const response = NextResponse.json(await readout(ownerId));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Enter a city, valid two-letter state, and one listed work preference." },
      { status: 400 }
    );
  }
}
