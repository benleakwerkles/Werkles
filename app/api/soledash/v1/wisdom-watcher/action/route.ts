import { NextResponse } from "next/server";

import { loadWisdomWatchPanel, runWisdomWatchAction } from "@/lib/soledash/wisdom-watcher/actions";
import type { WisdomWatchAction } from "@/lib/soledash/wisdom-watcher/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ACTIONS: WisdomWatchAction[] = ["send_petra", "send_bean", "mark_resolved", "park"];

type Body = { action?: WisdomWatchAction; risk_id?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const action = body.action;
    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const result = await runWisdomWatchAction(action, body.risk_id?.trim());
    const panel = loadWisdomWatchPanel();
    return NextResponse.json({ ok: result.ok, result, panel }, { status: result.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
