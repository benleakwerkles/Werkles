import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

export type CanonicalExecutionRecord = {
  packet_id: string;
  relay_id: string;
  receipt_id: string;
  relay_status: string;
  receipt_status: string;
  created_at: string;
  owner: string;
  mission: string;
  artifact_path: string;
  packet_path: string;
  receipt_path: string;
};

type PacketRecord = {
  packet_id?: unknown;
  created_at?: unknown;
  owner?: unknown;
  mission?: unknown;
  status?: unknown;
};

type ReceiptRecord = {
  receipt_id?: unknown;
  relay_id?: unknown;
  packet_id?: unknown;
  linked_packet_id?: unknown;
  timestamp?: unknown;
  artifact_link?: unknown;
  proof_reference?: unknown;
  path?: unknown;
};

const EXECUTION_DIR = path.join("data", "tinkerden", "executions");
const STATE_PATH = path.join("foreman", "soledash", "tinkerden-return-system-v0", "state.json");
const ORGANISM_EVENTS_PATH = path.join("data", "organism", "events.jsonl");
const TINKERDEN_RECEIPT_DIR = path.join("data", "tinkerden", "receipts");

function repoPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function text(value: unknown, fallback = "UNKNOWN") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function executionPath(packetId: string) {
  return path.join(repoPath(EXECUTION_DIR), `${packetId}.json`);
}

function executionRelPath(packetId: string) {
  return slash(path.join(EXECUTION_DIR, `${packetId}.json`));
}

async function readJson<T>(relativePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(repoPath(relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}

async function readJsonl(relativePath: string): Promise<JsonRecord[]> {
  try {
    const raw = await readFile(repoPath(relativePath), "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as JsonRecord;
        } catch {
          return null;
        }
      })
      .filter((record): record is JsonRecord => record !== null);
  } catch {
    return [];
  }
}

async function readReceiptArtifacts(): Promise<ReceiptRecord[]> {
  try {
    const entries = await readdir(repoPath(TINKERDEN_RECEIPT_DIR), { withFileTypes: true });
    const records: Array<ReceiptRecord | null> = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          try {
            const relativePath = path.join(TINKERDEN_RECEIPT_DIR, entry.name);
            const parsed = JSON.parse(await readFile(repoPath(relativePath), "utf8")) as ReceiptRecord;
            return { ...parsed, path: text(parsed.proof_reference, slash(relativePath)) };
          } catch {
            return null;
          }
        })
    );
    return records.filter((record): record is ReceiptRecord => record !== null);
  } catch {
    return [];
  }
}

async function readPersistedExecutions(): Promise<CanonicalExecutionRecord[]> {
  try {
    const entries = await readdir(repoPath(EXECUTION_DIR), { withFileTypes: true });
    const records = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          try {
            return JSON.parse(await readFile(path.join(repoPath(EXECUTION_DIR), entry.name), "utf8")) as CanonicalExecutionRecord;
          } catch {
            return null;
          }
        })
    );
    return records.filter((record): record is CanonicalExecutionRecord => record !== null);
  } catch {
    return [];
  }
}

function receiptPacketId(receipt: ReceiptRecord) {
  return text(receipt.packet_id, text(receipt.linked_packet_id, ""));
}

function latestReceipt(receipts: ReceiptRecord[]) {
  return receipts
    .filter((receipt) => receiptPacketId(receipt))
    .sort((a, b) => Date.parse(text(b.timestamp, "0")) - Date.parse(text(a.timestamp, "0")))[0];
}

function relayStatus(packetId: string, packetStatus: string, events: JsonRecord[]) {
  const matching = events.filter((event) => text(event.packet_id, "") === packetId);
  if (matching.some((event) => text(event.event_type, text(event.event)) === "packet_dispatched")) return "RELAY_DISPATCHED";
  if (matching.some((event) => text(event.event_type, text(event.event)) === "packet_relay_ready")) return "RELAY_READY";
  if (matching.some((event) => text(event.event_type, text(event.event)) === "packet_autopaste_ready")) return "RELAY_READY";
  if (packetStatus === "PACKET_RELAY_READY" || packetStatus === "AUTOPASTE_READY") return "RELAY_READY";
  return packetStatus;
}

export async function writeCanonicalExecutionRecord(record: CanonicalExecutionRecord) {
  await mkdir(repoPath(EXECUTION_DIR), { recursive: true });
  await writeFile(executionPath(record.packet_id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return executionRelPath(record.packet_id);
}

export async function readCanonicalExecutionRecords(limit = 25): Promise<CanonicalExecutionRecord[]> {
  const state = await readJson<{ packets?: PacketRecord[]; receipts?: ReceiptRecord[] }>(STATE_PATH);
  const packets = Array.isArray(state?.packets) ? state.packets : [];
  const stateReceipts = Array.isArray(state?.receipts) ? state.receipts : [];
  const receiptArtifacts = await readReceiptArtifacts();
  const events = await readJsonl(ORGANISM_EVENTS_PATH);
  const persisted = await readPersistedExecutions();
  const persistedByPacket = new Map(persisted.map((record) => [record.packet_id, record]));
  const receiptsByPacket = new Map<string, ReceiptRecord[]>();

  for (const receipt of [...stateReceipts, ...receiptArtifacts]) {
    const packetId = receiptPacketId(receipt);
    if (!packetId) continue;
    receiptsByPacket.set(packetId, [...(receiptsByPacket.get(packetId) ?? []), receipt]);
  }

  const records = packets
    .map((packet): CanonicalExecutionRecord => {
      const packetId = text(packet.packet_id, "");
      const persistedRecord = persistedByPacket.get(packetId);
      const receipt = latestReceipt(receiptsByPacket.get(packetId) ?? []);
      const relayId = text(receipt?.relay_id, persistedRecord?.relay_id ?? "NO_RELAY");
      const receiptId = text(receipt?.receipt_id, persistedRecord?.receipt_id ?? "NO_RECEIPT");
      const receiptPath = text(receipt?.path, persistedRecord?.receipt_path ?? "");
      const packetPath = text(persistedRecord?.packet_path, packetId ? slash(path.join("tinkerden", "dispatch", "packets", `${packetId}.json`)) : "");
      const packetStatus = text(packet.status);

      return {
        packet_id: packetId,
        relay_id: relayId,
        receipt_id: receiptId,
        relay_status: persistedRecord?.relay_status ?? relayStatus(packetId, packetStatus, events),
        receipt_status: receipt ? "RECEIPT_LINKED" : "MISSING_RECEIPT",
        created_at: text(packet.created_at, persistedRecord?.created_at),
        owner: text(packet.owner, persistedRecord?.owner),
        mission: text(packet.mission, persistedRecord?.mission),
        artifact_path: receiptPath || packetPath,
        packet_path: packetPath,
        receipt_path: receiptPath
      };
    })
    .filter((record) => record.packet_id)
    .filter((record) => record.receipt_id !== "NO_RECEIPT" && record.receipt_path)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return records.slice(0, limit);
}

