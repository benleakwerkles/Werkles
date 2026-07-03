import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  dispatchAeyeMessage,
  listVerifiedDestinations,
  verifySentOutbox,
  writeAeyeReceiptForPacket,
  type AeyeMessagePacket,
  type AeyeMessageReceipt,
  type AeyeTransportReason,
  type AeyeTransportStop
} from "@/lib/soledash/aeye-inbox-v0/protocol";

export const dynamic = "force-dynamic";

type AeyeLoopPacket = {
  packet_id: string;
  origin_card_id: string;
  target_aeye: string;
  target_machine: string;
  task_text: string;
  created_at: string;
  status: "SENT";
};

type AeyeLoopResponse = {
  packet_id: string;
  response_id: string;
  status: "ACKNOWLEDGED";
  message: string;
  timestamp: string;
};

const REPO_ROOT = process.cwd();
const LOOP_ROOT = path.join(REPO_ROOT, "foreman", "soledash", "wonka-den", "aeye-loop");
const INBOX_DIR = path.join(LOOP_ROOT, "inbox");
const RESPONSE_DIR = path.join(LOOP_ROOT, "responses");

function safeName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function httpStatusForReason(reason: AeyeTransportReason): number {
  switch (reason) {
    case "DUPLICATE_PACKET_ID":
    case "MACHINE_UNAVAILABLE":
      return 409;
    case "ORPHAN_RECEIPT":
    case "OUTBOX_FILE_MISSING":
    case "SENDER_MISMATCH":
    case "EMPTY_PAYLOAD":
    case "UNKNOWN_AEYE":
      return 400;
  }
}

function stopResponse(stop: AeyeTransportStop) {
  return NextResponse.json(
    {
      ...stop,
      error: stop.reason
    },
    { status: httpStatusForReason(stop.reason) }
  );
}

export async function GET() {
  const destinations = await listVerifiedDestinations();
  return NextResponse.json({
    ok: true,
    source: "foreman/messages/DESTINATION_DIRECTORY.json",
    routing_rule: "verified destinations only",
    destinations
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "send" | "receipt_only" | "verify_sent";
      destination_id?: string;
      packet_id?: string;
      origin_surface?: string;
      origin_card_id?: string;
      target_aeye?: string;
      target_machine?: string;
      task_text?: string;
      payload?: Record<string, unknown>;
      receipt_id?: string;
      from_aeye?: string;
      from_machine?: string;
      receipt_message?: string;
    };

    if (body.mode === "verify_sent") {
      const verified = await verifySentOutbox(body.packet_id ?? "");
      if (!verified.ok) return stopResponse(verified);
      return NextResponse.json({ ok: true, verdict: "GO", packet: verified.packet, path: path.relative(REPO_ROOT, verified.path) });
    }

    if (body.mode === "receipt_only") {
      const receipt = await writeAeyeReceiptForPacket({
        packet_id: body.packet_id ?? "",
        receipt_id: body.receipt_id,
        from_aeye: body.from_aeye ?? "Dink",
        from_machine: body.from_machine ?? "Betsy",
        status: "ACKNOWLEDGED",
        message: body.receipt_message ?? "Dink@Betsy received this task."
      });
      if (!receipt.ok) return stopResponse(receipt);
      return NextResponse.json({
        ok: true,
        verdict: "GO",
        message_receipt: receipt.receipt,
        inbox_packet: receipt.inbox_packet,
        paths: {
          message_outbox: path.relative(REPO_ROOT, receipt.paths.outbox),
          message_inbox: path.relative(REPO_ROOT, receipt.paths.inbox),
          message_receipt: path.relative(REPO_ROOT, receipt.paths.receipt)
        }
      });
    }

    const verifiedDestinations = await listVerifiedDestinations();
    if (!body.destination_id) {
      return NextResponse.json(
        {
          ok: false,
          verdict: "STOP",
          error: "DESTINATION_ID_REQUIRED",
          source: "foreman/messages/DESTINATION_DIRECTORY.json",
          destinations: verifiedDestinations
        },
        { status: 400 }
      );
    }

    const requestedDestination = verifiedDestinations.find((destination) => destination.id === body.destination_id);

    if (!requestedDestination) {
      return NextResponse.json(
        {
          ok: false,
          verdict: "STOP",
          error: "UNVERIFIED_DESTINATION",
          source: "foreman/messages/DESTINATION_DIRECTORY.json",
          destinations: verifiedDestinations
        },
        { status: 400 }
      );
    }

    const basePayload: Record<string, unknown> = body.payload ?? { task_text: body.task_text ?? "" };
    const payload: Record<string, unknown> = {
      ...basePayload,
      directory_source: "foreman/messages/DESTINATION_DIRECTORY.json",
      destination_id: requestedDestination.id,
      target: requestedDestination.label,
      destination_type: requestedDestination.destination_type
    };
    const taskTextForAck = typeof payload.task_text === "string" ? payload.task_text.trim() : "";
    const receiptMessage =
      body.receipt_message ?? (taskTextForAck ? `${requestedDestination.label} received ${taskTextForAck}` : `${requestedDestination.label} received this task.`);
    const transport = await dispatchAeyeMessage({
      packet_id: body.packet_id,
      origin_surface: body.origin_surface ?? "Wonka Den",
      origin_card_id: body.origin_card_id,
      target_aeye: requestedDestination.aeye,
      target_machine: requestedDestination.machine,
      payload,
      receipt: {
        receipt_id: body.receipt_id,
        from_aeye: requestedDestination.aeye,
        from_machine: requestedDestination.machine,
        status: "ACKNOWLEDGED",
        message: receiptMessage
      }
    });

    if (!transport.ok) return stopResponse(transport);

    const taskText = typeof transport.packet.payload.task_text === "string" ? transport.packet.payload.task_text : JSON.stringify(transport.packet.payload);
    const packet: AeyeLoopPacket = {
      packet_id: transport.packet.packet_id,
      origin_card_id: transport.packet.origin_card_id,
      target_aeye: transport.packet.target_aeye,
      target_machine: transport.packet.target_machine,
      task_text: taskText,
      created_at: transport.packet.created_at,
      status: "SENT"
    };

    const response: AeyeLoopResponse = {
      packet_id: packet.packet_id,
      response_id: transport.receipt.receipt_id,
      status: "ACKNOWLEDGED",
      message: transport.receipt.message,
      timestamp: transport.receipt.created_at
    };

    const packetPath = path.join(INBOX_DIR, `${safeName(packet.packet_id)}.json`);
    const responsePath = path.join(RESPONSE_DIR, `${safeName(response.response_id)}.json`);

    await writeJson(packetPath, packet);
    await writeJson(responsePath, response);

    return NextResponse.json({
      ok: true,
      verdict: "GO",
      directory_destination: requestedDestination,
      packet,
      response,
      message_packet: transport.packet,
      inbox_packet: transport.inbox_packet,
      message_receipt: transport.receipt,
      paths: {
        packet: path.relative(REPO_ROOT, packetPath),
        response: path.relative(REPO_ROOT, responsePath),
        message_outbox: path.relative(REPO_ROOT, transport.paths.outbox),
        message_inbox: path.relative(REPO_ROOT, transport.paths.inbox),
        message_receipt: path.relative(REPO_ROOT, transport.paths.receipt)
      }
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Aeye loop failed" },
      { status: 500 }
    );
  }
}
