import { NextResponse } from "next/server";

import { loadTransportReceipts } from "@/lib/soledash/decision-surface/load-live-transport";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const actionId = searchParams.get("action_id")?.trim() ?? "";
  if (!actionId) {
    return NextResponse.json({ ok: false, error: "action_id required" }, { status: 400 });
  }

  const receipts = loadTransportReceipts(false);
  const inReceiptCenter = receipts.some((r) => r.action_id === actionId);

  return NextResponse.json({
    ok: true,
    action_id: actionId,
    in_receipt_center: inReceiptCenter
  });
}
