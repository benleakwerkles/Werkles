import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const OPTIONAL_PACKET_LOG_PATH = path.join(MEMBRANE_ROOT, "optional_packets.jsonl");
const OPTIONAL_PACKET_DIR = path.join(MEMBRANE_ROOT, "optional_packets");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");

type OptionalCardInput = {
  id?: unknown;
  card_id?: unknown;
  title?: unknown;
  move?: unknown;
  why?: unknown;
  why_now?: unknown;
  target_aeye?: unknown;
  target?: unknown;
  risk_class?: unknown;
  recommendation?: unknown;
};

type OptionalPacketRequest = {
  card?: OptionalCardInput;
  source_path?: unknown;
  food_sources?: unknown;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringList(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.length > 0 ? value.map(String).filter(Boolean) : fallback;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJsonl(filePath: string, value: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readOptionalPacketLog() {
  try {
    return fs
      .readFileSync(OPTIONAL_PACKET_LOG_PATH, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [];
  }
}

function existingPacketFor(cardId: string) {
  return readOptionalPacketLog()
    .reverse()
    .find((packet) => packet.card_id === cardId) ?? null;
}

function latestPacketsByCard() {
  const packets = new Map<string, Record<string, unknown>>();
  for (const packet of readOptionalPacketLog()) {
    const cardId = text(packet.card_id);
    if (!cardId) continue;
    packets.set(cardId, withRelaySuccess(packet));
  }
  return Array.from(packets.values());
}

function withRelaySuccess(packet: Record<string, unknown>) {
  const awaiting = text(packet.awaiting, "MOMENTUM_TAP");
  return {
    ...packet,
    relay_status: "SUCCESS_RELAYED",
    success_message: `Relay success: optional packet queued for ${awaiting}.`
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    optional_packets: latestPacketsByCard()
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OptionalPacketRequest;
    const card = body.card || {};
    const cardId = text(card.id, text(card.card_id));
    if (!cardId) {
      return NextResponse.json({ ok: false, error: "TOP_THREE_CARD_ID_REQUIRED" }, { status: 400 });
    }

    const existingPacket = existingPacketFor(cardId);
    if (existingPacket) {
      return NextResponse.json({
        ok: true,
        duplicate_ignored: true,
        optional_packet: withRelaySuccess(existingPacket)
      });
    }

    const createdAt = new Date().toISOString();
    const title = text(card.title, text(card.move, "Untitled optional packet"));
    const why = text(card.why, text(card.why_now, "No why attached."));
    const targetAeye = text(card.target_aeye, text(card.target, "OPERATOR_SELECTS_TARGET"));
    const riskClass = text(card.risk_class, "UNKNOWN").toUpperCase();
    const foodSources = stringList(body.food_sources, ["Petra", "Skybro"]);
    const sourcePath = text(body.source_path, "tinkarden/membrane/recommendation_cards.json");
    const packetId = `optional_packet_${safeName(cardId)}_${stamp()}_${crypto.randomBytes(3).toString("hex")}`;
    const packetPath = path.join(OPTIONAL_PACKET_DIR, `${safeName(packetId)}.json`);
    const optionalPacket = {
      schema: "feral_membrane_top_three_optional_packet_v0",
      event_type: "optional_packet_created",
      packet_id: packetId,
      card_id: cardId,
      title,
      mission: title,
      why,
      recommendation: text(card.recommendation),
      food_sources: foodSources,
      source_path: sourcePath,
      target_aeye: targetAeye,
      risk_class: riskClass,
      status: "OPTIONAL_PACKET_CREATED",
      awaiting: "MOMENTUM_TAP",
      operator_choice_required: true,
      note: "Petra/Skybro food was copied into an optional packet. No target file mutation or relay execution happened here.",
      target_mutations: [`optional packet for ${targetAeye}`],
      momentum_velocity_churn: {
        created_by: "Operator Top 3 packet choice",
        next_allowed_action: "Momentum Tap",
        execution_state: "not executed"
      },
      swanson_merge_contract: {
        expected_consumer: "Swanson functional relay page",
        packet_log_path: rel(OPTIONAL_PACKET_LOG_PATH),
        interface_event_path: rel(INTERFACE_NOTIFY_LOG_PATH)
      },
      created_at: createdAt,
      card_hash: sha256(card)
    };

    fs.mkdirSync(OPTIONAL_PACKET_DIR, { recursive: true });
    fs.writeFileSync(packetPath, `${JSON.stringify(optionalPacket, null, 2)}\n`, "utf8");

    const packetEvent = {
      ...optionalPacket,
      packet_path: rel(packetPath),
      packet_log_path: rel(OPTIONAL_PACKET_LOG_PATH),
      event_path: rel(INTERFACE_NOTIFY_LOG_PATH),
      relay_status: "SUCCESS_RELAYED",
      success_message: "Relay success: optional packet queued for MOMENTUM_TAP."
    };
    writeJsonl(OPTIONAL_PACKET_LOG_PATH, packetEvent);
    writeJsonl(INTERFACE_NOTIFY_LOG_PATH, packetEvent);

    return NextResponse.json({
      ok: true,
      optional_packet: packetEvent
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "OPTIONAL_PACKET_FAILED" },
      { status: 500 }
    );
  }
}
