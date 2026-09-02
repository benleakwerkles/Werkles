import { NextRequest, NextResponse } from "next/server";

import {
  conciergeIntakeFieldLimit,
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers
} from "@/lib/squibb/concierge-intake-v0";
import { storeSpeakerIntake } from "@/lib/squibb/concierge-intake-storage";
import {
  BELLOWS_INTAKE_CLOSED_MESSAGE,
  BELLOWS_INTAKE_SUBMISSION_OPEN
} from "@/lib/squibb/concierge-intake-availability";
import {
  BELLOWS_OWNER_COOKIE,
  bellowsOwnerCookieOptions,
  resolveBellowsOwnerForIntakeRequest
} from "@/lib/squibb/bellows-owner-session";
import { isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import { runShadowMatchingFromConcierge, shadowRunSmokeSummary } from "@/lib/matching/shadow-pipeline";
import { isMatchingPublicEnabled, matchingPublicModeLabel } from "@/lib/matching/feature-flags";
import { requireUser } from "@/lib/supabase/request";
import { storeMemberIntake } from "@/lib/squibb/member-intake-custody";

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
      [question.id]: String(record[question.id] ?? "").trim().slice(0, conciergeIntakeFieldLimit(question.id))
    }),
    { ...EMPTY_INTAKE_ANSWERS }
  );
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  const accountSubmission = Boolean(bearer && bearer !== "dev-preview-token");

  if (!BELLOWS_INTAKE_SUBMISSION_OPEN && !accountSubmission) {
    return NextResponse.json(
      {
        error: BELLOWS_INTAKE_CLOSED_MESSAGE,
        state: "Closed"
      },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const answers = normalizeAnswers(payload);
    const answeredCount = CONCIERGE_INTAKE_QUESTIONS.filter((question) => answers[question.id].length > 0).length;

    const missingRequired = CONCIERGE_INTAKE_QUESTIONS.filter(
      (question) => question.required && answers[question.id].length === 0
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Please say what you are trying to make real, where it is today, and what is getting in the way.",
          state: "Blocked"
        },
        { status: 400 }
      );
    }

    if (bearer && bearer !== "dev-preview-token") {
      const auth = await requireUser(request);
      if ("response" in auth) return auth.response;
      const clientSubmissionId =
        typeof payload === "object" && payload !== null &&
        "clientSubmissionId" in payload && typeof payload.clientSubmissionId === "string"
          ? payload.clientSubmissionId
          : "";
      const stored = await storeMemberIntake({
        supabase: auth.supabase,
        userId: auth.user.id,
        clientSubmissionId,
        answers
      });
      const response = NextResponse.json({
        success: true,
        intakeId: stored.intakeId,
        shadow_run_id: null,
        matching_mode: "account",
        meaning: "Saved to your Werkles account. Your latest Intake will follow this sign-in."
      });
      response.headers.set("Cache-Control", "private, no-store");
      response.cookies.set(
        BELLOWS_OWNER_COOKIE,
        `member_${auth.user.id}`,
        bellowsOwnerCookieOptions()
      );
      return response;
    }

    const owner = await resolveBellowsOwnerForIntakeRequest(request);
    /* Handeye traffic is only ever test traffic where the fleet is open. */
    const testRun = isGhostFleetEnabled() && request.headers.get("x-werkles-handeye") === "1";
    const stored = await storeSpeakerIntake(answers, { ownerId: owner.ownerId, testRun });
    const shadowRun = await runShadowMatchingFromConcierge(stored.intakeId, answers);

    const response = NextResponse.json({
      success: true,
      ...stored,
      shadow_run_id: shadowRun?.runId ?? null,
      matching_mode: isMatchingPublicEnabled() ? matchingPublicModeLabel() : "shadow",
      ...(shadowRun ? shadowRunSmokeSummary(shadowRun) : {}),
      meaning: isMatchingPublicEnabled()
        ? "Local walkthrough saved and processed by Autonomous Matching. It is not saved to your Werkles account."
        : "Local walkthrough saved. Matching ran in shadow mode for operator review; this is not Werkles account storage."
    });

    if (owner.setCookie) {
      response.cookies.set(BELLOWS_OWNER_COOKIE, owner.ownerId, bellowsOwnerCookieOptions());
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save your answers.";
    return NextResponse.json({ error: message, state: "Failed" }, { status: 500 });
  }
}
