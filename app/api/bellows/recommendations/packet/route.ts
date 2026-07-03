import { NextRequest, NextResponse } from "next/server";

import {
  storeSquibbRecommendationPacket,
  type SquibbRecommendationPacketAction
} from "@/lib/squibb/recommendation-packet-storage";
import { loadSquibbRecommendationSessionForBellows } from "@/lib/squibb/recommendation-session-server";

export const runtime = "nodejs";

const ACTIONS: SquibbRecommendationPacketAction[] = [
  "pursue_path",
  "keep_original_path",
  "request_more_proof"
];

function normalizeAction(value: unknown): SquibbRecommendationPacketAction | null {
  return ACTIONS.includes(value as SquibbRecommendationPacketAction)
    ? (value as SquibbRecommendationPacketAction)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { recommendationId?: unknown; action?: unknown };
    const recommendationId = String(body.recommendationId ?? "").trim();
    const action = normalizeAction(body.action);

    if (!recommendationId || !action) {
      return NextResponse.json(
        {
          error: "A recommendationId and valid action are required.",
          state: "Blocked"
        },
        { status: 400 }
      );
    }

    const session = await loadSquibbRecommendationSessionForBellows();
    const recommendation = [...session.ranked, ...session.catalog].find((item) => item.id === recommendationId);

    if (!recommendation) {
      return NextResponse.json(
        {
          error: `Recommendation not found: ${recommendationId}`,
          state: "Blocked"
        },
        { status: 404 }
      );
    }

    const stored = await storeSquibbRecommendationPacket(recommendation, action, session.source);
    return NextResponse.json({
      success: true,
      ...stored
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not stage recommendation packet.";
    return NextResponse.json({ error: message, state: "Failed" }, { status: 500 });
  }
}
