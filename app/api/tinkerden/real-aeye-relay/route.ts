import { NextResponse } from "next/server";

import {
  completeRealAeyeRelay,
  createRealAeyeRelayRequest,
  listRealAeyeRelays,
  readRealAeyeRelayStatus
} from "@/lib/tinkerden/real-aeye-relay";

export const dynamic = "force-dynamic";

type CreateRelayBody = {
  command?: string;
  destination_id?: string | null;
  destination_label?: string | null;
  source_surface?: string | null;
  stream?: string | null;
  command_packet_id?: string | null;
  command_receipt_id?: string | null;
  aeye_receipt_id?: string | null;
  packet_path?: string | null;
  receipt_path?: string | null;
};

type CompleteRelayBody = {
  relay_id?: string;
  thread_id?: string | null;
  prompt_sent?: string | null;
  answer_text?: string | null;
  status?: "ARTIFACT" | "BLOCKER" | "WAITING_FOR_CODEX_THREAD_BRIDGE" | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const relayId = url.searchParams.get("relay_id");

  if (relayId) {
    const status = await readRealAeyeRelayStatus(relayId);
    if (!status) {
      return NextResponse.json({ ok: false, error: "RELAY_REQUEST_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(status);
  }

  return NextResponse.json({
    ok: true,
    relays: await listRealAeyeRelays(50)
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRelayBody;
    const result = await createRealAeyeRelayRequest({
      command: body.command ?? "",
      destination_id: body.destination_id,
      destination_label: body.destination_label,
      source_surface: body.source_surface,
      stream: body.stream,
      command_packet_id: body.command_packet_id,
      command_receipt_id: body.command_receipt_id,
      aeye_receipt_id: body.aeye_receipt_id,
      packet_path: body.packet_path,
      receipt_path: body.receipt_path
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "REAL_AEYE_RELAY_FAILED";
    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: message === "COMMAND_REQUIRED" ? 400 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as CompleteRelayBody;
    const result = await completeRealAeyeRelay({
      relay_id: body.relay_id ?? "",
      thread_id: body.thread_id,
      prompt_sent: body.prompt_sent,
      answer_text: body.answer_text,
      status: body.status
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "REAL_AEYE_RELAY_COMPLETION_FAILED";
    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: message === "RELAY_ID_REQUIRED" ? 400 : message === "RELAY_REQUEST_NOT_FOUND" ? 404 : 500 }
    );
  }
}

export const PUT = PATCH;
