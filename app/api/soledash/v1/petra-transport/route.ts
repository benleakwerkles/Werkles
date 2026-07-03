import { NextResponse } from "next/server";

import { runPetraTransportDeliver } from "@/lib/soledash/petra-transport/run-deliver";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = {
  raw_text?: string;
};

export async function POST(request: Request) {
  if (process.platform !== "win32") {
    return NextResponse.json(
      {
        ok: false,
        error: "Petra transport v0 requires LOCAL_SALLY_WINDOWS (Betsy)."
      },
      { status: 501 }
    );
  }

  try {
    const body = (await request.json()) as Body;
    const raw_text = body.raw_text?.trim() ?? "";

    if (!raw_text) {
      return NextResponse.json({ ok: false, error: "raw_text required." }, { status: 400 });
    }

    const result = await runPetraTransportDeliver(raw_text);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Petra transport failed."
      },
      { status: 500 }
    );
  }
}
