import { NextResponse } from "next/server";

import { classifyApprovalAction } from "@/lib/soledash/command-surface/approval-classifier";

export const dynamic = "force-dynamic";

type ClassifyBody = {
  action?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClassifyBody;
    const action = body.action?.trim() ?? "";

    if (!action) {
      return NextResponse.json({ ok: false, error: "Empty action text." }, { status: 400 });
    }

    const classification = classifyApprovalAction(action);
    return NextResponse.json({ ok: true, classification });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Classification failed." },
      { status: 500 }
    );
  }
}
