import { NextResponse } from "next/server";

import { listRelayCards } from "@/lib/soledash/automatica-relay/fire-card";
import {
  runRelayCardAction,
  type RelayCardActionKind
} from "@/lib/soledash/automatica-relay/card-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = {
  card_id?: string;
  action?: RelayCardActionKind;
  cousin?: "MAKER" | "DINK" | "PETRA" | "ENDER" | "BEAN";
  note?: string;
};

const ACTIONS: RelayCardActionKind[] = ["approve", "edit_route", "needs_research", "kill_test"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const cardId = body.card_id?.trim() ?? "";
    const action = body.action;

    if (!cardId || !action || !ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: "card_id and valid action required" }, { status: 400 });
    }

    const result = await runRelayCardAction(cardId, action, {
      cousin: body.cousin,
      note: body.note
    });

    return NextResponse.json({
      ok: result.ok,
      result,
      cards: listRelayCards()
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Relay card action failed" },
      { status: 500 }
    );
  }
}
