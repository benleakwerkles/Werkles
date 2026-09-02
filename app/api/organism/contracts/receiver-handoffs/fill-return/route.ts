import { NextResponse } from "next/server";

import {
  fillReceiverHandoffReturn,
  ReceiverHandoffReturnFillError,
  type FillReceiverHandoffReturnInput,
} from "@/lib/organism/contracts/receiver-handoff-return-fill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FillReceiverHandoffReturnInput;
    if (!body.bundle_id?.trim()) {
      return NextResponse.json({ ok: false, error: "BUNDLE_ID_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await fillReceiverHandoffReturn(body), { status: 201 });
  } catch (error) {
    const status = error instanceof ReceiverHandoffReturnFillError ? error.status : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "RECEIVER_HANDOFF_RETURN_FILL_FAILED",
        issues: error instanceof ReceiverHandoffReturnFillError ? error.issues : undefined,
      },
      { status },
    );
  }
}
