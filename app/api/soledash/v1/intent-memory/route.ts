import { NextResponse } from "next/server";

import { interpretIntent } from "@/lib/soledash/intent-memory/actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; proposal_id?: string | null };
    const text = body.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ ok: false, error: "Empty intent" }, { status: 400 });
    }
    const panel = interpretIntent(text, body.proposal_id ?? null);
    return NextResponse.json({ ok: true, panel });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Intent memory failed" },
      { status: 500 }
    );
  }
}
