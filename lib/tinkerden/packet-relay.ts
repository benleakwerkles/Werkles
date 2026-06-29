import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

export type PacketRelayCard = {
  packet_id: string;
  source_path: string;
  source_type: "aeye_message" | "tinkerden_transport" | "tinkerden_packet_store";
  modified_at: string;
  status: string;
  to: string;
  from: string;
  mission: string;
  objective: string;
  task: string;
  return_to: string;
  rules: string[];
  packet_relay_text: string;
};

const PACKET_RELAY_RULES = [
  "No auto-send.",
  "No account automation.",
  "No browser control.",
  "Clipboard/copy helper only."
];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function field(value: unknown, fallback = "UNKNOWN"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function textBlock(value: unknown, fallback = "UNKNOWN"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map((item) => field(item, "")).filter(Boolean).join("\n");
  if (isRecord(value)) return JSON.stringify(value, null, 2);
  return fallback;
}

function targetFromParts(aeye: unknown, machine: unknown): string {
  const targetAeye = field(aeye, "");
  const targetMachine = field(machine, "");
  if (targetAeye && targetMachine) return `${targetAeye}@${targetMachine}`;
  return targetAeye || targetMachine || "UNKNOWN";
}

function sourcePath(fullPath: string): string {
  return path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
}

function sortTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildPacketRelayText(card: Omit<PacketRelayCard, "packet_relay_text">): string {
  const rules = [...card.rules, `Preserve packet_id: ${card.packet_id}`];

  return [
    `TO: ${card.to}`,
    `FROM: ${card.from}`,
    "",
    `MISSION: ${card.mission}`,
    "",
    "OBJECTIVE:",
    card.objective,
    "",
    "TASK:",
    card.task,
    "",
    "RETURN:",
    card.return_to,
    "",
    "RULES:",
    ...rules.map((rule) => `- ${rule}`)
  ].join("\n");
}

async function readJsonFile(fullPath: string): Promise<{ record: JsonRecord; modified_at: string } | null> {
  try {
    const [raw, fileStat] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    return { record: parsed, modified_at: fileStat.mtime.toISOString() };
  } catch {
    return null;
  }
}

async function readJsonFiles(folder: string): Promise<Array<{ fullPath: string; record: JsonRecord; modified_at: string }>> {
  try {
    const entries = await readdir(folder, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const fullPath = path.join(folder, entry.name);
          const loaded = await readJsonFile(fullPath);
          return loaded ? { fullPath, ...loaded } : null;
        })
    );

    return files.filter((file): file is { fullPath: string; record: JsonRecord; modified_at: string } => Boolean(file));
  } catch {
    return [];
  }
}

function normalizeAeyeMessage(fullPath: string, record: JsonRecord, modified_at: string): PacketRelayCard {
  const payload = isRecord(record.payload) ? record.payload : {};
  const artifact = field(payload.artifact, "");
  const task = textBlock(payload.task_text, textBlock(payload.task, textBlock(payload, "UNKNOWN")));
  const card = {
    packet_id: field(record.packet_id, path.basename(fullPath, ".json")),
    source_path: sourcePath(fullPath),
    source_type: "aeye_message" as const,
    modified_at,
    status: field(record.status, "UNKNOWN"),
    to: field(payload.target, targetFromParts(record.target_aeye, record.target_machine)),
    from: field(payload.sender, "Dink@Betsy"),
    mission: field(payload.mission, field(record.origin_card_id, "UNKNOWN")),
    objective: field(payload.objective, artifact ? `Create or return ${artifact}.` : task),
    task,
    return_to: field(payload.return_destination, "foreman/messages/receipts"),
    rules: PACKET_RELAY_RULES
  };

  return { ...card, packet_relay_text: buildPacketRelayText(card) };
}

function normalizeTinkerdenTransport(fullPath: string, record: JsonRecord, modified_at: string): PacketRelayCard {
  const mission = field(record.mission, field(record.title, "UNKNOWN"));
  const purpose = field(record.purpose, mission);
  const card = {
    packet_id: field(record.packet_id, path.basename(fullPath, ".json")),
    source_path: sourcePath(fullPath),
    source_type: "tinkerden_transport" as const,
    modified_at,
    status: field(record.status, "OUTBOX"),
    to: targetFromParts(record.target_aeye, record.target_machine),
    from: field(record.from, "TinkerDen@Betsy"),
    mission,
    objective: purpose,
    task: textBlock(record.task, purpose),
    return_to: field(record.return_destination, "data/tinkerden/receipts"),
    rules: PACKET_RELAY_RULES
  };

  return { ...card, packet_relay_text: buildPacketRelayText(card) };
}

function normalizePacketStore(record: JsonRecord, index: number): PacketRelayCard {
  const mission = field(record.mission, field(record.title, "UNKNOWN"));
  const purpose = field(record.purpose, mission);
  const packetId = field(record.packet_id, `packet_store_${index}`);
  const modifiedAt = field(record.created_at, "UNKNOWN");
  const card = {
    packet_id: packetId,
    source_path: "data/packets.json",
    source_type: "tinkerden_packet_store" as const,
    modified_at: modifiedAt,
    status: field(record.status, "UNKNOWN"),
    to: field(record.target, targetFromParts(record.target_aeye, record.target_machine)),
    from: field(record.from, "TinkerDen@Betsy"),
    mission,
    objective: purpose,
    task: textBlock(record.task, purpose),
    return_to: field(record.return_destination, "TinkerDen Intake"),
    rules: PACKET_RELAY_RULES
  };

  return { ...card, packet_relay_text: buildPacketRelayText(card) };
}

async function readPacketStore(): Promise<PacketRelayCard[]> {
  const fullPath = path.join(process.cwd(), "data", "packets.json");

  try {
    const raw = await readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).map((record, index) => normalizePacketStore(record, index));
  } catch {
    return [];
  }
}

export async function listPacketRelayCards(): Promise<PacketRelayCard[]> {
  const aeyeOutbox = await readJsonFiles(path.join(process.cwd(), "foreman", "messages", "outbox"));
  const tinkerdenOutbox = await readJsonFiles(path.join(process.cwd(), "data", "tinkerden", "outbox"));
  const packetStore = await readPacketStore();

  return [
    ...aeyeOutbox.map(({ fullPath, record, modified_at }) => normalizeAeyeMessage(fullPath, record, modified_at)),
    ...tinkerdenOutbox.map(({ fullPath, record, modified_at }) => normalizeTinkerdenTransport(fullPath, record, modified_at)),
    ...packetStore
  ].sort((a, b) => sortTime(b.modified_at) - sortTime(a.modified_at));
}

