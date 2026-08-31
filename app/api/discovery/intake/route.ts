import { NextRequest, NextResponse } from "next/server";
import {
  normalizeDiscoveryIntake,
  validateDiscoveryIntake,
  writeDiscoveryIntake
} from "@/lib/discovery/concierge";
import { runShadowMatchingFromDiscovery } from "@/lib/matching/shadow-pipeline";
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
    await runShadowMatchingFromDiscovery(record.user_id, input);

    // Public response carries only what the submitter needs. Storage paths,
    // shadow-run ids, and smoke telemetry are internal (Locke, correction-side
    // review 2026-07-31: "the API is the leak; a UI-only fix is one curl away").
    return NextResponse.json({
      success: true,
      intake_id: record.user_id,
      state: record.state,
      meaning: isMatchingPublicEnabled()
        ? "Intake received. Your matching readout is being prepared."
        : "Intake received for review. We'll follow up at the contact you gave us."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save discovery intake.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
