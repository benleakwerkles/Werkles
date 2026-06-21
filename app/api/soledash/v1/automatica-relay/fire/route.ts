import { NextResponse } from "next/server";

import { fireRelayCard } from "@/lib/soledash/automatica-relay/fire-card";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = { card_id?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const cardId = body.card_id?.trim() ?? "";
    if (!cardId) {
      return NextResponse.json({ ok: false, error: "card_id required" }, { status: 400 });
    }

    const result = await fireRelayCard(cardId);
    if ("error" in result && !("card" in result)) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Relay fire failed" },
      { status: 500 }
    );
  }
}
