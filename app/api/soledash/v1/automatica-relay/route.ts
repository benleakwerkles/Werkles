import { NextResponse } from "next/server";

import { listRelayCards } from "@/lib/soledash/automatica-relay/fire-card";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    cards: listRelayCards(),
    packet_dir: "foreman/soledash/automatica/packets",
    receipt_dir: "foreman/soledash/automatica/receipts"
  });
}
