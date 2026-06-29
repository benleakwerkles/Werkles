import { readFile } from "node:fs/promises";
import path from "node:path";

export type TinkerPitPacketInboxEntry = {
  packet_id: string;
  action: string;
  created_at: string;
  status: "NEW" | "SEEN" | "WORKING" | "COMPLETE";
};

const PACKET_INBOX_PATH = path.join("tinkerden", "dispatch", "packet_inbox.json");
const VALID_STATUSES = new Set(["NEW", "SEEN", "WORKING", "COMPLETE"]);

function text(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function status(value: unknown): TinkerPitPacketInboxEntry["status"] {
  const candidate = text(value, "NEW");
  return VALID_STATUSES.has(candidate) ? (candidate as TinkerPitPacketInboxEntry["status"]) : "NEW";
}

function normalizeEntry(value: unknown): TinkerPitPacketInboxEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  return {
    packet_id: text(record.packet_id),
    action: text(record.action),
    created_at: text(record.created_at),
    status: status(record.status),
  };
}

export async function readTinkerPitPacketInbox(limit = 25) {
  try {
    const raw = await readFile(path.join(process.cwd(), PACKET_INBOX_PATH), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const packets = Array.isArray(parsed)
      ? parsed.map(normalizeEntry).filter((entry): entry is TinkerPitPacketInboxEntry => entry !== null)
      : [];

    return {
      ok: true,
      source_path: PACKET_INBOX_PATH.replaceAll("\\", "/"),
      count: packets.length,
      packets: packets.slice(0, limit),
    };
  } catch {
    return {
      ok: false,
      source_path: PACKET_INBOX_PATH.replaceAll("\\", "/"),
      count: 0,
      packets: [] as TinkerPitPacketInboxEntry[],
    };
  }
}
