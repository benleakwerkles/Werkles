import { NextResponse } from "next/server";

import { queueSkyPookaAction } from "@/lib/skypooka/relay-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FireQueueBody = {
  card_id?: string;
  subject?: string;
  target?: string;
  path?: string;
  action?: "fire" | "hold";
};

function isAllowedHandoffPath(value: string) {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  return (
    normalized.startsWith("foreman/handoffs/outbox/")
    || normalized.startsWith("foreman/handoffs/inbox/")
  ) && !normalized.includes("..");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FireQueueBody;
    const action = body.action === "hold" ? "hold" : "fire";
    const cardId = typeof body.card_id === "string" ? body.card_id.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const target = typeof body.target === "string" ? body.target.trim() : "Unknown";
    const handoffPath = typeof body.path === "string" ? body.path.trim() : "";

    if (!cardId || !subject || !handoffPath || !isAllowedHandoffPath(handoffPath)) {
      return NextResponse.json({ ok: false, error: "VALID_HANDOFF_REQUIRED" }, { status: 400 });
    }

    const result = await queueSkyPookaAction({
      action,
      card_id: cardId,
      subject,
      target,
      path: handoffPath.replace(/\\/g, "/")
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "QUEUE_FAILED" },
      { status: 500 }
    );
  }
}
