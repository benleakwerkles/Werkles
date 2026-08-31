import { NextRequest, NextResponse } from "next/server";

import { runEphemeralMatchingFromDocument } from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";

export const runtime = "nodejs";

/**
 * Operator-only document score proof.
 * Protected by /api/operator internal audience (localhost / approved preview only).
 * Never persists the paste.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { title?: unknown; body?: unknown };
    const title = String(body.title ?? "").trim();
    const documentBody = String(body.body ?? "").trim();

    if (documentBody.length < 40) {
      return NextResponse.json(
        { error: "Paste at least a short real-world note or document (40+ characters)." },
        { status: 400 }
      );
    }

    const run = await runEphemeralMatchingFromDocument({ title, body: documentBody });
    if (!run) {
      return NextResponse.json({ error: "Matching shadow is disabled." }, { status: 503 });
    }

    const session = shadowRunToRecommendationSession(run);
    if (session.source) {
      session.source.fedDocument = {
        id: run.intakeId,
        title: title || "Pasted document",
        kind: "uploaded_document",
        summary: "Real-world document you pasted for this score proof. Not saved to custody.",
        body: documentBody,
        excerpts: session.source.fedDocument?.excerpts ?? []
      };
      session.source.label = "Document score proof";
      session.source.detail =
        "Ephemeral Autonomous Matching run. Document was not written to Supabase. Compare source text to rules scores below.";
    }

    const scoreboard = run.readout.scoredPaths
      .map((path) => ({
        kind: path.kind,
        rank: path.rank,
        score: path.score,
        disqualified: Boolean(path.disqualified),
        confidenceLabel: path.confidenceLabel
      }))
      .sort((left, right) => left.rank - right.rank || right.score - left.score);

    return NextResponse.json({
      success: true,
      run_id: run.runId,
      persisted: false,
      session,
      scoreboard,
      eligible_count: session.ranked.length,
      smoke: {
        shadow_top_eligible_path:
          run.readout.scoredPaths.find((candidate) => !candidate.disqualified)?.kind ?? null,
        shadow_disqualified_kinds: run.notMatch.disqualified.map((item) => item.kind)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not score document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
