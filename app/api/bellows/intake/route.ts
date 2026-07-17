import { NextRequest, NextResponse } from "next/server";

import {
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";
import {
  BELLOWS_INTAKE_CLOSED_MESSAGE,
  BELLOWS_INTAKE_SUBMISSION_OPEN
} from "@/lib/squibb/concierge-intake-availability";
import { storeSpeakerIntake } from "@/lib/squibb/concierge-intake-storage";
import { runShadowMatchingFromConcierge, shadowRunSmokeSummary } from "@/lib/matching/shadow-pipeline";
import { isMatchingPublicEnabled, matchingPublicModeLabel } from "@/lib/matching/feature-flags";

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
  if (!BELLOWS_INTAKE_SUBMISSION_OPEN) {
    return NextResponse.json(
      {
        error: BELLOWS_INTAKE_CLOSED_MESSAGE,
        state: "Closed"
      },
      { status: 503 }
    );
  }

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
      state: stored.state,
      matching_mode: isMatchingPublicEnabled() ? matchingPublicModeLabel() : "shadow",
      summary: shadowRun ? shadowRunSmokeSummary(shadowRun) : null,
      meaning: isMatchingPublicEnabled()
        ? "Intake received for rules-based recommendation review."
        : "Intake received for operator review."
    });
  } catch (error) {
    console.error("Bellows intake failed", {
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
    return NextResponse.json(
      { error: "The intake could not be received. Nothing should be assumed saved.", state: "Failed" },
      { status: 500 }
    );
  }
}
