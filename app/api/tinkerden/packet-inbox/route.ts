import { NextResponse } from "next/server";

import { readTinkerPitPacketInbox } from "@/lib/tinkerden/packet-inbox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readTinkerPitPacketInbox(50));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "packet inbox read failed" },
      { status: 500 }
    );
  }
}
