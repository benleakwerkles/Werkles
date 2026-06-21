import { NextResponse } from "next/server";

import { mockOperatorChat } from "@/lib/soledash/decision-surface/mock-actions";

export const dynamic = "force-dynamic";

type ChatBody = {
  text?: string;
  proposal_id?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    const text = body.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json({ ok: false, mock: true, error: "text required." }, { status: 400 });
    }

    return NextResponse.json(mockOperatorChat(text, body.proposal_id));
  } catch (err) {
    return NextResponse.json(
      { ok: false, mock: true, error: err instanceof Error ? err.message : "Mock chat failed." },
      { status: 500 }
    );
  }
}
