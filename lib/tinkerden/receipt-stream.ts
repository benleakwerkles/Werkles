import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export type TinkerdenReceiptPickup = {
  receipt_id: string;
  mission: string;
  producer: string;
  status_guess: string;
  timestamp: string;
  path: string;
  linked_packet_id: string;
  source: string;
};

type ReceiptPickupRecord = {
  receipt_id?: unknown;
  mission?: unknown;
  producer?: unknown;
  status_guess?: unknown;
  timestamp?: unknown;
  path?: unknown;
  linked_packet_id?: unknown;
  packet_id?: unknown;
};

type AeyeReceiptRecord = {
  receipt_id?: unknown;
  packet_id?: unknown;
  from_aeye?: unknown;
  from_machine?: unknown;
  status?: unknown;
  message?: unknown;
  created_at?: unknown;
};

type TinkerdenDroppedReceipt = {
  receipt_id?: unknown;
  linked_packet_id?: unknown;
  packet_id?: unknown;
  mission?: unknown;
  producer?: unknown;
  status_guess?: unknown;
  proof_reference?: unknown;
  timestamp?: unknown;
};

export type TinkerdenReceiptStream = {
  ok: true;
  source_path: string;
  source_paths: string[];
  count: number;
  receipts: TinkerdenReceiptPickup[];
  missing: boolean;
  malformed_count: number;
};

const RECEIPT_PICKUP_PATH = path.join("data", "organism", "receipt_pickup.jsonl");
const AEYE_RECEIPTS_DIR = path.join("foreman", "messages", "receipts");
const TINKERDEN_RECEIPTS_DIR = path.join("data", "tinkerden", "receipts");
const TINKERDEN_COMMAND_RECEIPTS_DIR = path.join("tinkerden", "receipts");
const MAX_RECEIPTS = 25;

function repoPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function field(value: unknown, fallback = "UNKNOWN") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizePickupRecord(record: ReceiptPickupRecord): TinkerdenReceiptPickup {
  return {
    receipt_id: field(record.receipt_id),
    mission: field(record.mission),
    producer: field(record.producer),
    status_guess: field(record.status_guess),
    timestamp: field(record.timestamp),
    path: field(record.path),
    linked_packet_id: field(record.linked_packet_id, field(record.packet_id)),
    source: slash(RECEIPT_PICKUP_PATH)
  };
}

function normalizeAeyeReceipt(record: AeyeReceiptRecord, sourcePath: string): TinkerdenReceiptPickup {
  const fromAeye = field(record.from_aeye);
  const fromMachine = field(record.from_machine);
  const producer = fromAeye === "UNKNOWN" && fromMachine === "UNKNOWN" ? "UNKNOWN" : `${fromAeye}@${fromMachine}`;

  return {
    receipt_id: field(record.receipt_id, path.basename(sourcePath, ".json")),
    mission: field(record.message),
    producer,
    status_guess: field(record.status),
    timestamp: field(record.created_at),
    path: slash(sourcePath),
    linked_packet_id: field(record.packet_id),
    source: slash(AEYE_RECEIPTS_DIR)
  };
}

function normalizeDroppedReceipt(
  record: TinkerdenDroppedReceipt,
  sourcePath: string,
  sourceRoot = TINKERDEN_RECEIPTS_DIR
): TinkerdenReceiptPickup {
  return {
    receipt_id: field(record.receipt_id, path.basename(sourcePath, ".json")),
    mission: field(record.mission),
    producer: field(record.producer),
    status_guess: field(record.status_guess),
    timestamp: field(record.timestamp),
    path: field(record.proof_reference, slash(sourcePath)),
    linked_packet_id: field(record.linked_packet_id, field(record.packet_id)),
    source: slash(sourceRoot)
  };
}

async function readJsonlPickup(): Promise<{ receipts: TinkerdenReceiptPickup[]; missing: boolean; malformed: number }> {
  try {
    const raw = await readFile(repoPath(RECEIPT_PICKUP_PATH), "utf8");
    let malformed = 0;
    const receipts = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return normalizePickupRecord(JSON.parse(line) as ReceiptPickupRecord);
        } catch {
          malformed += 1;
          return null;
        }
      })
      .filter((receipt): receipt is TinkerdenReceiptPickup => receipt !== null);

    return { receipts, missing: false, malformed };
  } catch {
    return { receipts: [], missing: true, malformed: 0 };
  }
}

async function readJsonReceipts(
  relativeDir: string,
  normalize: (record: Record<string, unknown>, sourcePath: string) => TinkerdenReceiptPickup
): Promise<{ receipts: TinkerdenReceiptPickup[]; missing: boolean; malformed: number }> {
  const absoluteDir = repoPath(relativeDir);

  try {
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    let malformed = 0;
    const receipts = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const absolutePath = path.join(absoluteDir, entry.name);
          const sourcePath = slash(path.join(relativeDir, entry.name));

          try {
            const raw = await readFile(absolutePath, "utf8");
            return normalize(JSON.parse(raw) as Record<string, unknown>, sourcePath);
          } catch {
            malformed += 1;
            return null;
          }
        })
    );

    return {
      receipts: receipts.filter((receipt): receipt is TinkerdenReceiptPickup => receipt !== null),
      missing: false,
      malformed
    };
  } catch {
    return { receipts: [], missing: true, malformed: 0 };
  }
}

async function latestMtime(relativePath: string) {
  try {
    const info = await stat(repoPath(relativePath));
    return info.mtime.toISOString();
  } catch {
    return "UNKNOWN";
  }
}

function receiptKey(receipt: TinkerdenReceiptPickup) {
  return `${receipt.receipt_id}:${receipt.path}`;
}

function receiptTime(receipt: TinkerdenReceiptPickup) {
  const time = Date.parse(receipt.timestamp);
  return Number.isFinite(time) ? time : 0;
}

export async function readTinkerdenReceiptStream(limit = MAX_RECEIPTS): Promise<TinkerdenReceiptStream> {
  const [pickup, aeye, dropped, commandReceipts] = await Promise.all([
    readJsonlPickup(),
    readJsonReceipts(AEYE_RECEIPTS_DIR, (record, sourcePath) => normalizeAeyeReceipt(record, sourcePath)),
    readJsonReceipts(TINKERDEN_RECEIPTS_DIR, (record, sourcePath) => normalizeDroppedReceipt(record, sourcePath)),
    readJsonReceipts(TINKERDEN_COMMAND_RECEIPTS_DIR, (record, sourcePath) =>
      normalizeDroppedReceipt(record, sourcePath, TINKERDEN_COMMAND_RECEIPTS_DIR)
    )
  ]);

  const receiptsByKey = new Map<string, TinkerdenReceiptPickup>();
  for (const receipt of [...pickup.receipts, ...aeye.receipts, ...dropped.receipts, ...commandReceipts.receipts]) {
    const key = receiptKey(receipt);
    const existing = receiptsByKey.get(key);
    if (!existing || receiptTime(receipt) >= receiptTime(existing)) receiptsByKey.set(key, receipt);
  }

  const receipts = [...receiptsByKey.values()]
    .sort((a, b) => receiptTime(b) - receiptTime(a))
    .slice(0, limit);

  const sourcePaths = [
    RECEIPT_PICKUP_PATH,
    AEYE_RECEIPTS_DIR,
    TINKERDEN_RECEIPTS_DIR,
    TINKERDEN_COMMAND_RECEIPTS_DIR
  ].map(slash);

  return {
    ok: true,
    source_path: slash(RECEIPT_PICKUP_PATH),
    source_paths: sourcePaths,
    count: receipts.length,
    receipts,
    missing: pickup.missing && aeye.missing && dropped.missing && commandReceipts.missing,
    malformed_count: pickup.malformed + aeye.malformed + dropped.malformed + commandReceipts.malformed
  };
}

export async function tinkerdenReceiptStreamReadback() {
  const stream = await readTinkerdenReceiptStream();
  return {
    ...stream,
    source_mtimes: Object.fromEntries(
      await Promise.all(stream.source_paths.map(async (sourcePath) => [sourcePath, await latestMtime(sourcePath)]))
    )
  };
}
