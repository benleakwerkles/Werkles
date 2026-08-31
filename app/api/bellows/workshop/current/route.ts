import { NextRequest, NextResponse } from "next/server";

import { buildOwnerSurfaceStateFromAnswers, emptyOwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { readLatestMemberIntake } from "@/lib/squibb/member-intake-custody";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const intake = await readLatestMemberIntake(auth.supabase, auth.user.id);
    const state = intake
      ? await buildOwnerSurfaceStateFromAnswers(intake.intakeId, intake.capturedAt, intake.answers)
      : emptyOwnerSurfaceState();
    const response = NextResponse.json({ state });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Werkles could not load your saved Workshop." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
