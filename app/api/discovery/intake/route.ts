import { NextRequest, NextResponse } from "next/server";
import {
  normalizeDiscoveryIntake,
  validateDiscoveryIntake,
  writeDiscoveryIntake
} from "@/lib/discovery/concierge";
import {
  DISCOVERY_INTAKE_CLOSED_MESSAGE,
  DISCOVERY_INTAKE_SUBMISSION_OPEN
} from "@/lib/discovery/intake-availability";
import { runShadowMatchingFromDiscovery, shadowRunSmokeSummary } from "@/lib/matching/shadow-pipeline";
import { isMatchingPublicEnabled, matchingPublicModeLabel } from "@/lib/matching/feature-flags";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!DISCOVERY_INTAKE_SUBMISSION_OPEN) {
    return NextResponse.json(
      {
        error: DISCOVERY_INTAKE_CLOSED_MESSAGE,
        state: "Closed"
      },
      { status: 503 }
    );
  }

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
      state: record.state,
      matching_mode: isMatchingPublicEnabled() ? matchingPublicModeLabel() : "shadow",
      summary: shadowRun ? shadowRunSmokeSummary(shadowRun) : null,
      meaning: isMatchingPublicEnabled()
        ? "Intake received for rules-based recommendation review."
        : "Intake received for operator review."
    });
  } catch (error) {
    console.error("Discovery intake failed", {
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
    return NextResponse.json(
      { error: "The intake could not be received. Nothing should be assumed saved.", state: "Failed" },
      { status: 500 }
    );
  }
}
