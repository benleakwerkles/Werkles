import { NextResponse, type NextRequest } from "next/server";

import {
  runEphemeralMatchingFromDocument,
  shadowRunSmokeSummary
} from "@/lib/matching/shadow-pipeline";
import { shadowRunToRecommendationSession } from "@/lib/matching/shadow-to-recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
};
const MAX_REQUEST_BYTES = 24_000;

const INTERNAL_EXPLANATION_LANGUAGE =
  /Layer 0|not-match|shadow|\b(?:Automated|Autonomous)\b|\bRule\s+\d+\b/i;

function safeRowExplanation(values: Array<string | undefined>, fallback: string) {
  for (const value of values) {
    const candidate = value?.trim();
    if (!candidate || INTERNAL_EXPLANATION_LANGUAGE.test(candidate)) continue;
    return candidate.length > 240 ? `${candidate.slice(0, 237).trimEnd()}...` : candidate;
  }
  return fallback;
}

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Internal, ephemeral score proof. The pasted document is never persisted. */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return privateJson({ error: "Send this request as JSON." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return privateJson({ error: "Keep the request under 24,000 bytes." }, 413);
  }

  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return privateJson({ error: "Send valid JSON." }, 400);
    }

    if (
      !isJsonRecord(input) ||
      typeof input.body !== "string" ||
      (input.title !== undefined && typeof input.title !== "string")
    ) {
      return privateJson({ error: "Provide a document body and an optional text title." }, 400);
    }
    if (input.custody_confirmed !== true) {
      return privateJson(
        { error: "Confirm that you are authorized to use a redacted copy of this document." },
        400
      );
    }

    const title = (input.title ?? "").trim().slice(0, 200);
    const documentBody = input.body.trim();

    if (documentBody.length < 40) {
      return privateJson({ error: "Paste at least 40 characters." }, 400);
    }
    if (documentBody.length > 20_000) {
      return privateJson({ error: "Keep the document under 20,000 characters." }, 413);
    }

    const run = await runEphemeralMatchingFromDocument({ title, body: documentBody });
    if (!run) {
      return privateJson({ error: "Matching rules are disabled." }, 503);
    }

    const session = shadowRunToRecommendationSession(run);
    if (!session.source) {
      throw new Error("Matching returned no source context.");
    }
    session.source = {
      ...session.source,
      mode: "ephemeral_document",
      label: "Document score",
      detail:
        "Processed once in memory by this internal Werkles endpoint. This feature does not persist the paste or forward it to an AI provider or external recipient."
    };

    const scoreboard = run.readout.scoredPaths
      .map((path) => {
        const disqualified = Boolean(path.disqualified);
        const fallback = disqualified
          ? "The current rules held this path for more proof or human review."
          : "The current rules found some support for this path in the paste.";
        return {
          kind: path.kind,
          label: RECOMMENDATION_KIND_LABELS[path.kind],
          rank: path.rank,
          score: path.score,
          disqualified,
          ruleSupportBand: path.confidenceLabel,
          why: safeRowExplanation(
            disqualified ? [path.disqualifyReason, ...path.rationale] : path.rationale,
            fallback
          )
        };
      })
      .sort((left, right) => left.rank - right.rank || right.score - left.score);

    return privateJson(
      {
        success: true,
        run_id: run.runId,
        persisted: false,
        session,
        scoreboard,
        not_ruled_out_count: session.ranked.length,
        smoke: shadowRunSmokeSummary(run)
      }
    );
  } catch {
    return privateJson({ error: "The document could not be scored." }, 500);
  }
}
