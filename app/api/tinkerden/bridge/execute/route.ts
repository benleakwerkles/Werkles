import { NextResponse } from "next/server";

import { createBridgeExecutePacket } from "@/lib/tinkerden-return-system-v0/store";

export const dynamic = "force-dynamic";

type ExecuteBody = {
  card_id?: string;
  operator_selection?: string;
  move?: string;
  recommendation?: string;
  composite_score?: number;
  operator_reason?: string;
  why_now?: string;
  recommended_because?: string;
};

const OPERATOR_SELECTIONS = new Set(["KEEP", "KILL", "STEAL", "MERGE"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExecuteBody;

    if (!body.card_id?.trim()) {
      return NextResponse.json({ ok: false, error: "CARD_ID_REQUIRED" }, { status: 400 });
    }

    if (!body.move?.trim()) {
      return NextResponse.json({ ok: false, error: "MOVE_REQUIRED" }, { status: 400 });
    }

    const operatorSelection = body.operator_selection?.trim().toUpperCase();
    if (!operatorSelection || !OPERATOR_SELECTIONS.has(operatorSelection)) {
      return NextResponse.json({ ok: false, error: "KEEP_KILL_STEAL_MERGE_REQUIRED" }, { status: 400 });
    }

    const result = await createBridgeExecutePacket({
      card_id: body.card_id.trim(),
      operator_selection: operatorSelection as "KEEP" | "KILL" | "STEAL" | "MERGE",
      move: body.move.trim(),
      recommendation: body.recommendation?.trim() || "unknown",
      composite_score: Number.isFinite(body.composite_score) ? body.composite_score! : null,
      operator_reason: body.operator_reason?.trim() || null,
      why_now: body.why_now?.trim() || "",
      recommended_because: body.recommended_because?.trim() || "",
    });

    return NextResponse.json({
      ok: true,
      packet_id: result.packet.packet_id,
      receipt_id: result.receipt.receipt_id,
      packet: result.packet,
      receipt: result.receipt,
      execution: result.execution,
      packet_path: result.packet_path,
      receipt_path: result.receipt_path,
      execution_path: result.execution_path,
      receipt_pickup_path: result.receipt_pickup_path,
      dispatch_state_path: result.dispatch_state_path,
      event_path: result.event_path,
      relay_event: result.relay_event,
      card_status: "DISPATCHED",
      visible_state: "RECEIPT_LINKED",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "EXECUTE_PACKET_FAILED" },
      { status: 500 },
    );
  }
}
