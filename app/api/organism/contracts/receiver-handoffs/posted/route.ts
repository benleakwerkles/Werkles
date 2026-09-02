import { NextResponse } from "next/server";

import { readReceiverHandoffPostedIndex } from "@/lib/organism/contracts/receiver-handoff-posted-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");

  try {
    return NextResponse.json(await readReceiverHandoffPostedIndex(Number.isFinite(limit) ? limit : 25));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "receiver posted handoff index read failed",
        records: [],
        count: 0,
        latest: null,
      },
      { status: 500 },
    );
  }
}
