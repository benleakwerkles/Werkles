import { NextResponse } from "next/server";

import { proposeFreeform, dispatchBuild } from "@/lib/soledash/command-surface/dispatch";

export const dynamic = "force-dynamic";

type FreeformBody = {
  text?: string;
  approve?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FreeformBody;
    const text = body.text?.trim() ?? "";

    if (body.approve) {
      const result = await dispatchBuild({ fromFreeform: true });
      if (!result.ok) {
        return NextResponse.json(result, { status: 422 });
      }
      return NextResponse.json(result);
    }

    if (!text) {
      return NextResponse.json({ ok: false, error: "Empty command." }, { status: 400 });
    }

    const result = await proposeFreeform(text);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Freeform command failed." },
      { status: 500 }
    );
  }
}
