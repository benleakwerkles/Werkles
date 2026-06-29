import { readFile } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

export type PacketRelayReadyEvent = {
  event_type: "packet_relay_ready";
  packet_id: string;
  relay_id: string;
  receipt_id: string;
  relay_status: string;
  target_aeye: string;
  target_machine: string;
  workspace: string;
  timestamp: string;
  clipboard_set: boolean;
  focus_attempted: boolean;
};

const EVENTS_PATH = path.join("data", "organism", "events.jsonl");

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown) {
  return value === true;
}

function normalizePacketRelayEvent(record: JsonRecord): PacketRelayReadyEvent | null {
  const eventType = text(record.event_type, "");
  if (eventType !== "packet_relay_ready" && eventType !== "packet_autopaste_ready" && eventType !== "autopaste_ready") {
    return null;
  }

  const workspace = text(record.workspace, text(record.workspace_target, "none"));
  const workspaceAction = text(record.workspace_action, "none");
  const focusAttempted =
    typeof record.focus_attempted === "boolean"
      ? record.focus_attempted
      : workspace !== "none" && !["none", "disabled"].includes(workspaceAction);

  return {
    event_type: "packet_relay_ready",
    packet_id: text(record.packet_id),
    relay_id: text(record.relay_id),
    receipt_id: text(record.receipt_id),
    relay_status: text(record.relay_status, "PACKET_RELAY_COMPLETE"),
    target_aeye: text(record.target_aeye),
    target_machine: text(record.target_machine),
    workspace,
    timestamp: text(record.timestamp),
    clipboard_set: bool(record.clipboard_set),
    focus_attempted: focusAttempted
  };
}

function eventTime(event: PacketRelayReadyEvent) {
  const parsed = Date.parse(event.timestamp);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function readPacketRelayReadyEvents(limit = 10): Promise<PacketRelayReadyEvent[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), EVENTS_PATH), "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as unknown;
          return isRecord(parsed) ? normalizePacketRelayEvent(parsed) : null;
        } catch {
          return null;
        }
      })
      .filter((event): event is PacketRelayReadyEvent => event !== null)
      .sort((a, b) => eventTime(b) - eventTime(a))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function readPacketRelayEventPipeline(limit = 10) {
  const events = await readPacketRelayReadyEvents(limit);
  return {
    ok: true,
    source_path: EVENTS_PATH.replaceAll("\\", "/"),
    count: events.length,
    latest: events[0] ?? null,
    events
  };
}

