import { NextResponse } from "next/server";

import { createReceiverHandoffBundle } from "@/lib/organism/contracts/receiver-handoff-bundle";
import { readReceiverHandoffIndex } from "@/lib/organism/contracts/receiver-handoff-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");

  try {
    return NextResponse.json(await readReceiverHandoffIndex(Number.isFinite(limit) ? limit : 25));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "receiver handoff index read failed",
        records: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      packet_id?: string;
      receiver?: string;
      base_url?: string;
      bundle_id?: string;
    };

    if (!body.packet_id?.trim()) {
      return NextResponse.json({ ok: false, error: "PACKET_ID_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(
      await createReceiverHandoffBundle({
        packet_id: body.packet_id,
        receiver: body.receiver,
        base_url: body.base_url,
        bundle_id: body.bundle_id,
      }),
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "receiver handoff bundle create failed";
    const status = message.startsWith("PACKET_NOT_FOUND") ? 404 : message.startsWith("BUNDLE_HAS_RETURNED_RECEIPT") ? 409 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}
