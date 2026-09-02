import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  ORGANISM_CONTRACT_EVENTS_PATH,
  ORGANISM_CONTRACT_PACKET_DIR,
  ORGANISM_CONTRACT_RECEIPT_DIR,
  ORGANISM_CONTRACT_ROOT,
} from "./storage";
import { type OrganismEvent, validateOrganismEvent } from "./event";
import { type OrganismPacket, validateOrganismPacket } from "./packet";
import { type OrganismReceipt, validateOrganismReceipt } from "./receipt";

type JsonRecord = Record<string, unknown>;

export type OrganismContractIndexRecord = {
  packet_id: string;
  packet_path: string;
  packet_created_at: string;
  lane: string;
  from: string;
  to: string;
  operator_intent: string;
  receipt_id: string;
  receipt_path: string;
  receipt_status: string;
  receiver: string;
  receipt_created_at: string;
  event_count: number;
  latest_event_type: string;
  latest_event_at: string;
  joined_event_count: number;
  truth_boundary: string;
};

export type OrganismContractIndex = {
  ok: true;
  source_path: string;
  source_paths: string[];
  count: number;
  packet_count: number;
  receipt_count: number;
  event_count: number;
  malformed_count: number;
  invalid_count: number;
  records: OrganismContractIndexRecord[];
};

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(process.cwd(), filePath));
}

function field(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function timeValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readJsonFiles<T>(
  dir: string,
  validate: (value: unknown) => { ok: true; value: T } | { ok: false },
): Promise<{ values: Array<{ value: T; path: string; mtime: string }>; malformed: number; invalid: number }> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let malformed = 0;
    let invalid = 0;
    const values = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const filePath = path.join(dir, entry.name);
          try {
            const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
            const parsed = JSON.parse(raw) as unknown;
            const validation = validate(parsed);
            if (!validation.ok) {
              invalid += 1;
              return null;
            }
            return {
              value: validation.value,
              path: repoRel(filePath),
              mtime: fileStat.mtime.toISOString(),
            };
          } catch {
            malformed += 1;
            return null;
          }
        }),
    );

    return {
      values: values.filter((value): value is { value: T; path: string; mtime: string } => Boolean(value)),
      malformed,
      invalid,
    };
  } catch {
    return { values: [], malformed: 0, invalid: 0 };
  }
}

async function readEvents(): Promise<{ values: OrganismEvent[]; malformed: number; invalid: number }> {
  try {
    const raw = await readFile(ORGANISM_CONTRACT_EVENTS_PATH, "utf8");
    let malformed = 0;
    let invalid = 0;
    const values = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as unknown;
          const validation = validateOrganismEvent(parsed);
          if (!validation.ok) {
            invalid += 1;
            return null;
          }
          return validation.value;
        } catch {
          malformed += 1;
          return null;
        }
      })
      .filter((event): event is OrganismEvent => Boolean(event));

    return { values, malformed, invalid };
  } catch {
    return { values: [], malformed: 0, invalid: 0 };
  }
}

function truthBoundary(receipt: OrganismReceipt | null) {
  if (!receipt) return "Receipt missing.";
  const boundary = receipt.what_did_not_change.find((item) => /completion proof|downstream|receiver-side/i.test(item));
  if (boundary) return boundary;
  if (receipt.status !== "completed") return `Receipt status is ${receipt.status}.`;
  return "Receipt claims completed status.";
}

export async function readOrganismContractIndex(limit = 25): Promise<OrganismContractIndex> {
  const [packets, receipts, events] = await Promise.all([
    readJsonFiles<OrganismPacket>(ORGANISM_CONTRACT_PACKET_DIR, validateOrganismPacket),
    readJsonFiles<OrganismReceipt>(ORGANISM_CONTRACT_RECEIPT_DIR, validateOrganismReceipt),
    readEvents(),
  ]);
  const receiptsByPacket = new Map<string, Array<{ value: OrganismReceipt; path: string; mtime: string }>>();
  const eventsByPacket = new Map<string, OrganismEvent[]>();

  for (const receipt of receipts.values) {
    receiptsByPacket.set(receipt.value.packet_id, [...(receiptsByPacket.get(receipt.value.packet_id) ?? []), receipt]);
  }

  for (const event of events.values) {
    if (!event.packet_id) continue;
    eventsByPacket.set(event.packet_id, [...(eventsByPacket.get(event.packet_id) ?? []), event]);
  }

  const records = packets.values
    .map((packet) => {
      const matchingReceipts = (receiptsByPacket.get(packet.value.packet_id) ?? []).sort(
        (a, b) => timeValue(b.value.created_at || b.mtime) - timeValue(a.value.created_at || a.mtime),
      );
      const receipt = matchingReceipts[0] ?? null;
      const matchingEvents = (eventsByPacket.get(packet.value.packet_id) ?? []).sort(
        (a, b) => timeValue(b.timestamp) - timeValue(a.timestamp),
      );
      const latestEvent = matchingEvents[0] ?? null;

      return {
        packet_id: packet.value.packet_id,
        packet_path: packet.path,
        packet_created_at: packet.value.created_at,
        lane: packet.value.lane,
        from: packet.value.from,
        to: packet.value.to,
        operator_intent: packet.value.operator_intent,
        receipt_id: receipt?.value.receipt_id ?? "NO_RECEIPT",
        receipt_path: receipt?.path ?? "NO_RECEIPT_PATH",
        receipt_status: receipt?.value.status ?? "missing",
        receiver: receipt?.value.receiver ?? "UNKNOWN",
        receipt_created_at: receipt?.value.created_at ?? "UNKNOWN",
        event_count: matchingEvents.length,
        latest_event_type: field(latestEvent?.event_type, "NO_EVENT"),
        latest_event_at: field(latestEvent?.timestamp, "UNKNOWN"),
        joined_event_count: matchingEvents.filter((event) => event.packet_id && event.receipt_id).length,
        truth_boundary: truthBoundary(receipt?.value ?? null),
      } satisfies OrganismContractIndexRecord;
    })
    .sort((a, b) => timeValue(b.latest_event_at) - timeValue(a.latest_event_at))
    .slice(0, limit);

  return {
    ok: true,
    source_path: repoRel(ORGANISM_CONTRACT_ROOT),
    source_paths: [
      repoRel(ORGANISM_CONTRACT_PACKET_DIR),
      repoRel(ORGANISM_CONTRACT_RECEIPT_DIR),
      repoRel(ORGANISM_CONTRACT_EVENTS_PATH),
    ],
    count: records.length,
    packet_count: packets.values.length,
    receipt_count: receipts.values.length,
    event_count: events.values.length,
    malformed_count: packets.malformed + receipts.malformed + events.malformed,
    invalid_count: packets.invalid + receipts.invalid + events.invalid,
    records,
  };
}
