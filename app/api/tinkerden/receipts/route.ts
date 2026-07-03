import { NextResponse } from "next/server";

import { readTinkerdenReceiptStream } from "@/lib/tinkerden/receipt-stream";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readTinkerdenReceiptStream(25));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "TinkerDen receipt stream read failed",
        receipts: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
