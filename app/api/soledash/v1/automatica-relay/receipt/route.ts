import { NextResponse } from "next/server";

import { readRelayReceipt } from "@/lib/soledash/automatica-relay/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packetId = searchParams.get("packet_id")?.trim() ?? "";
  if (!packetId) {
    return NextResponse.json({ ok: false, error: "packet_id required" }, { status: 400 });
  }

  const receipt = readRelayReceipt(packetId);
  if (!receipt) {
    return NextResponse.json({ ok: false, error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, receipt });
}
