import { NextRequest, NextResponse } from "next/server";
import {
  normalizeDiscoveryIntake,
  validateDiscoveryIntake,
  writeDiscoveryIntake
} from "@/lib/discovery/concierge";
import { runShadowMatchingFromDiscovery, shadowRunSmokeSummary } from "@/lib/matching/shadow-pipeline";
import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = normalizeDiscoveryIntake(await request.json());
    const missing = validateDiscoveryIntake(input);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Required intake fields are missing.",
          missing
        },
        { status: 400 }
      );
    }

    const record = await writeDiscoveryIntake(input);
    const shadowRun = await runShadowMatchingFromDiscovery(record.user_id, input);

    return NextResponse.json({
      success: true,
      intake_id: record.user_id,
      state: record.state,
      record_path: record.record_path,
      shadow_run_id: shadowRun?.runId ?? null,
      matching_mode: isMatchingPublicEnabled() ? "autonomous" : "shadow",
      ...(shadowRun ? shadowRunSmokeSummary(shadowRun) : {}),
      meaning: isMatchingPublicEnabled()
        ? "Intake processed by the Werkles matching engine. Speaker facts and Squibb paths are ready."
        : "Intake saved. Matching engine ran in shadow mode — operator review before public delivery."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save discovery intake.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
