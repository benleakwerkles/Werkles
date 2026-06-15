import { NextResponse } from "next/server";

import { saveReceiptToInbox, validateReceiptShape } from "@/lib/soledash/command-surface/inbox-save";

export const dynamic = "force-dynamic";

type ReceiptBody = {
  text?: string;
  sourcePlatform?: string;
  sourceHint?: string;
  validateOnly?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReceiptBody;
    const text = body.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json({ ok: false, error: "Empty response text." }, { status: 400 });
    }

    const validation = validateReceiptShape(text, body.sourceHint);

    if (body.validateOnly) {
      return NextResponse.json({ ok: true, validation });
    }

    const result = saveReceiptToInbox({
      body: text,
      sourcePlatform: body.sourcePlatform,
      sourceHint: body.sourceHint
    });

    if (!result.ok) {
      return NextResponse.json({ validation, saved: false, ...result }, { status: 422 });
    }

    return NextResponse.json({ validation, saved: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Receipt capture failed." },
      { status: 500 }
    );
  }
}
