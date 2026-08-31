import { NextRequest, NextResponse } from "next/server";

import { runEphemeralMatchingFromConcierge } from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";
import { requireUser } from "@/lib/supabase/request";
import { readLatestMemberIntake } from "@/lib/squibb/member-intake-custody";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const intake = await readLatestMemberIntake(auth.supabase, auth.user.id);
    if (!intake) {
      return NextResponse.json(
        { error: "No saved Intake was found for this account." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const run = await runEphemeralMatchingFromConcierge(intake.intakeId, intake.answers);
    if (!run) {
      return NextResponse.json(
        { error: "Recommendations are not available right now." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const response = NextResponse.json({ session: shadowRunToRecommendationSession(run) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Werkles could not load your recommendations." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
