import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/supabase/request";
import { readLatestMemberIntake } from "@/lib/squibb/member-intake-custody";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  try {
    const intake = await readLatestMemberIntake(auth.supabase, auth.user.id);
    const response = NextResponse.json({ intake });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Werkles could not load your saved Intake." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
