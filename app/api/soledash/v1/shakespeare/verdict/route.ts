import { NextResponse } from "next/server";

import { consumeShakespearePayload } from "@/lib/soledash/shakespeare/consume-verdict";
import type { ShakespeareV0Payload } from "@/lib/soledash/shakespeare/types";
import { writeShakespeareVerdictReceipt } from "@/lib/soledash/shakespeare/write-verdict-receipt";

export const dynamic = "force-dynamic";

type ClassifyResult = {
  intent: string;
  classifier: string;
  policy: string;
  verdict: ShakespeareV0Payload["verdict"];
  rule: string;
  reason: string;
  confidence: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { intent?: string };
    const intent = String(body.intent ?? "").trim();
    if (!intent) {
      return NextResponse.json({ ok: false, error: "intent required" }, { status: 400 });
    }

    const { classifyIntent } = (await import(
      "../../../../../../scripts/foreman/shakespeare-v0.mjs"
    )) as { classifyIntent: (input: string) => ClassifyResult };

    const decision = classifyIntent(intent);
    const payload: ShakespeareV0Payload = {
      schema: "SHAKESPEARE_V0",
      path: "Intent -> Classifier -> Policy -> Verdict",
      intent: decision.intent,
      classifier: decision.classifier,
      policy: decision.policy,
      verdict: decision.verdict,
      rule: decision.rule,
      reason: decision.reason,
      confidence: decision.confidence
    };

    const view = consumeShakespearePayload(payload);
    const receiptPath = writeShakespeareVerdictReceipt(payload, view);
    const viewWithReceipt: typeof view = {
      ...view,
      receiptLink: `/api/soledash/v1/shakespeare/receipt?file=${encodeURIComponent(receiptPath.split(/[/\\]/).pop() ?? "")}`
    };

    return NextResponse.json({ ok: true, payload, view: viewWithReceipt });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Shakespeare verdict failed" },
      { status: 500 }
    );
  }
}
