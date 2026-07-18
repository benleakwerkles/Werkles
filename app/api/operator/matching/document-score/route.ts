import { NextResponse, type NextRequest } from "next/server";

import {
  runEphemeralMatchingFromDocument,
  shadowRunSmokeSummary
} from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
};

/** Internal, ephemeral score proof. The pasted document is never persisted. */
export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as { title?: unknown; body?: unknown };
    const title = String(input.title ?? "").trim().slice(0, 200);
    const documentBody = String(input.body ?? "").trim();

    if (documentBody.length < 40) {
      return NextResponse.json(
        { error: "Paste at least 40 characters." },
        { status: 400, headers: PRIVATE_HEADERS }
      );
    }
    if (documentBody.length > 20_000) {
      return NextResponse.json(
        { error: "Keep the document under 20,000 characters." },
        { status: 413, headers: PRIVATE_HEADERS }
      );
    }

    const run = await runEphemeralMatchingFromDocument({ title, body: documentBody });
    if (!run) {
      return NextResponse.json(
        { error: "Matching rules are disabled." },
        { status: 503, headers: PRIVATE_HEADERS }
      );
    }

    const session = shadowRunToRecommendationSession(run);
    if (!session.source) {
      throw new Error("Matching returned no source context.");
    }
    session.source = {
      ...session.source,
      label: "Document score",
      detail: "Rules-only score from this paste. The document was not saved or sent anywhere.",
      fedDocument: {
        id: run.intakeId,
        title: title || "Pasted document",
        kind: "uploaded_document",
        summary: "The document used for this one-time score.",
        body: documentBody,
        excerpts: []
      }
    };

    const scoreboard = run.readout.scoredPaths
      .map((path) => ({
        kind: path.kind,
        rank: path.rank,
        score: path.score,
        disqualified: Boolean(path.disqualified),
        confidenceLabel: path.confidenceLabel
      }))
      .sort((left, right) => left.rank - right.rank || right.score - left.score);

    return NextResponse.json(
      {
        success: true,
        run_id: run.runId,
        persisted: false,
        session,
        scoreboard,
        eligible_count: session.ranked.length,
        smoke: shadowRunSmokeSummary(run)
      },
      { headers: PRIVATE_HEADERS }
    );
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "The document could not be scored.";
    return NextResponse.json({ error: message }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
