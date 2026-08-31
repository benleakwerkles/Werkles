import { NextRequest, NextResponse } from "next/server";

import { buildGhostInteractionMember } from "@/lib/ghost-fleet/interaction";
import {
  GHOST_FLEET_DISCLOSURE,
  isGhostFleetEnabled,
  listGhostMembers,
  parseGhostSeekerLocation,
  rankGhostsForSignals
} from "@/lib/ghost-fleet";
import { signalsFromConcierge } from "@/lib/matching/signals";
import { buildRecommendationViewFromAnswers, emptyRecommendationView } from "@/lib/recommendation-view/model";
import { readLatestMemberIntake } from "@/lib/squibb/member-intake-custody";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isGhostFleetEnabled()) {
    return NextResponse.json({ error: "Practice matching is unavailable." }, { status: 404 });
  }
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const [intake, profileResult, fleet] = await Promise.all([
      readLatestMemberIntake(auth.supabase, auth.user.id),
      auth.supabase
        .from("profiles")
        .select("location_city,location_state,work_preference")
        .eq("id", auth.user.id)
        .maybeSingle(),
      listGhostMembers()
    ]);
    if (!intake) {
      return NextResponse.json({
        needsIntake: true,
        members: [],
        location: null,
        locationMessage: null,
        view: emptyRecommendationView()
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (profileResult.error) throw new Error("Profile location could not be loaded.");

    const row = profileResult.data as Record<string, unknown> | null;
    const location = parseGhostSeekerLocation(row ? {
      city: row.location_city,
      state: row.location_state,
      workPreference: row.work_preference
    } : null);
    const signals = signalsFromConcierge(intake.intakeId, intake.answers);
    const view = await buildRecommendationViewFromAnswers(intake.intakeId, intake.answers);
    const matchResult = rankGhostsForSignals(signals, fleet, 12, location);
    const byId = new Map(fleet.map((member) => [member.id, member]));
    const members = matchResult.candidates.slice(0, 9).flatMap((candidate) => {
      const member = byId.get(candidate.ghostId);
      if (!member) return [];
      const interaction = buildGhostInteractionMember(member, {
        rank: candidate.rank,
        orderReason: candidate.orderReason,
        proximityLabel: candidate.proximity.label,
        reasons: candidate.reasons,
        cautions: candidate.blockers,
        snapshotNeed: signals.statedNeed
      });
      return interaction ? [interaction] : [];
    });

    const response = NextResponse.json({
      synthetic: true,
      disclosure: GHOST_FLEET_DISCLOSURE,
      location: location ? {
        city: location.city,
        state: location.state,
        workPreference: location.workPreference
      } : null,
      locationMessage: location
        ? `Using ${location.city}, ${location.state} and your ${location.workPreference.toLowerCase()} preference.`
        : "Add your city, state, and work preference to make travel part of the shortlist.",
      members,
      view
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Werkles could not refresh people for this account." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
