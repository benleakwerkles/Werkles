import { NextRequest, NextResponse } from "next/server";

import {
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";
import { storeSpeakerIntake } from "@/lib/squibb/concierge-intake-storage";
import { runShadowMatchingFromConcierge, shadowRunSmokeSummary } from "@/lib/matching/shadow-pipeline";
import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";

export const runtime = "nodejs";

function normalizeAnswers(value: unknown): ConciergeIntakeAnswers {
  const source =
    typeof value === "object" && value !== null && "answers" in value
      ? (value as { answers?: unknown }).answers
      : value;
  const record = typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};

  return CONCIERGE_INTAKE_QUESTIONS.reduce<ConciergeIntakeAnswers>(
    (next, question) => ({
      ...next,
      [question.id]: String(record[question.id] ?? "").trim().slice(0, 600)
    }),
    { ...EMPTY_INTAKE_ANSWERS }
  );
}

export async function POST(request: NextRequest) {
  try {
    const answers = normalizeAnswers(await request.json());
    const answeredCount = CONCIERGE_INTAKE_QUESTIONS.filter((question) => answers[question.id].length > 0).length;

    if (answeredCount === 0) {
      return NextResponse.json(
        {
          error: "At least one intake answer is required.",
          state: "Blocked"
        },
        { status: 400 }
      );
    }

    const stored = await storeSpeakerIntake(answers);
    const shadowRun = await runShadowMatchingFromConcierge(stored.intakeId, answers);

    return NextResponse.json({
      success: true,
      ...stored,
      shadow_run_id: shadowRun?.runId ?? null,
      matching_mode: isMatchingPublicEnabled() ? "autonomous" : "shadow",
      ...(shadowRun ? shadowRunSmokeSummary(shadowRun) : {}),
      meaning: isMatchingPublicEnabled()
        ? "Intake processed. Speaker delivered plain facts; Squibb ranked your paths."
        : "Intake saved. Matching engine ran in shadow mode — results visible to operator review."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not store concierge intake.";
    return NextResponse.json({ error: message, state: "Failed" }, { status: 500 });
  }
}
