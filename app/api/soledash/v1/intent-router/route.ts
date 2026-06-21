import { NextResponse } from "next/server";

import { createIntentProposal, getIntentRouterView } from "@/lib/soledash/intent-router/router";

export const dynamic = "force-dynamic";

type Body = {
  intent?: string;
};

export async function GET() {
  return NextResponse.json(getIntentRouterView());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const intent = body.intent?.trim() ?? "";
    if (!intent) {
      return NextResponse.json({ ok: false, error: "intent required" }, { status: 400 });
    }

    const proposal = createIntentProposal(intent);
    return NextResponse.json({ ok: true, proposal });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Intent routing failed" },
      { status: 500 }
    );
  }
}
