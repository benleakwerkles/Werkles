import { NextResponse } from "next/server";

import { readPacketRelayEventPipeline } from "@/lib/tinkerden/packet-relay-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readPacketRelayEventPipeline(25));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "packet relay event read failed" },
      { status: 500 }
    );
  }
}

