import { NextResponse } from "next/server";

import {
  postReceiverHandoffReturn,
  ReceiverHandoffReturnPostError,
} from "@/lib/organism/contracts/receiver-handoff-return-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  bundle_id?: string;
  detected_by?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body.bundle_id?.trim()) {
      return NextResponse.json({ ok: false, error: "BUNDLE_ID_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(
      await postReceiverHandoffReturn({
        bundle_id: body.bundle_id,
        detected_by: body.detected_by,
      }),
    );
  } catch (error) {
    const status = error instanceof ReceiverHandoffReturnPostError ? error.status : 500;
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "RECEIVER_HANDOFF_RETURN_POST_FAILED",
        issues: error instanceof ReceiverHandoffReturnPostError ? error.issues : undefined,
      },
      { status },
    );
  }
}
