import { NextResponse } from "next/server";

import { runIntentMemoryAction } from "@/lib/soledash/intent-memory/actions";
import type { CousinId } from "@/lib/soledash/command-surface/types";
import type { IntentMemoryAction, IntentMemoryPanel } from "@/lib/soledash/intent-memory/types";

export const dynamic = "force-dynamic";

const COUSINS = new Set<string>(["MAKER", "DINK", "PETRA", "ENDER", "SKYBRO", "BEAN", "COMPUTER"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: IntentMemoryAction;
      panel?: IntentMemoryPanel;
      cousin?: string;
      park_reason?: string;
    };

    const action = body.action;
    const panel = body.panel;
    if (!action || !panel?.intent_id || !panel.raw_command) {
      return NextResponse.json({ ok: false, error: "action and panel required" }, { status: 400 });
    }

    const cousin =
      body.cousin && COUSINS.has(body.cousin) ? (body.cousin as CousinId) : undefined;

    const { result, panel: nextPanel } = await runIntentMemoryAction(action, panel, {
      cousin,
      park_reason: body.park_reason
    });

    return NextResponse.json(
      { ok: result.ok, result, panel: nextPanel },
      { status: result.ok ? 200 : 422 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Intent action failed" },
      { status: 500 }
    );
  }
}
