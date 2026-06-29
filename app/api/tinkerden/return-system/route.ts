import { NextResponse } from "next/server";

import { loadTinkerDenState, runTinkerDenAction } from "@/lib/tinkerden-return-system-v0/store";
import type { TinkerDenAction } from "@/lib/tinkerden-return-system-v0/types";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<TinkerDenAction>([
  "send_packet",
  "mark_working",
  "attach_receipt",
  "validate_receipt",
  "assimilate",
  "escalate_missing",
  "kill_packet"
]);

export async function GET() {
  const state = await loadTinkerDenState();
  return NextResponse.json({ ok: true, state });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: TinkerDenAction;
      packet_id?: string;
    };
    if (!body.action || !ACTIONS.has(body.action)) {
      return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
    }
    if (!body.packet_id) {
      return NextResponse.json({ ok: false, error: "PACKET_ID_REQUIRED" }, { status: 400 });
    }
    const result = await runTinkerDenAction(body.action, body.packet_id);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "TinkerDen action failed" },
      { status: 500 }
    );
  }
}
