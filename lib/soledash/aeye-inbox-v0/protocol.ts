import fs from "node:fs/promises";
import path from "node:path";

export type AeyeMessageStatus =
  | "DRAFT"
  | "VALIDATED"
  | "QUEUED"
  | "SENT"
  | "RECEIVED"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "REJECTED"
  | "PENDING_RECIPIENT_AVAILABILITY";

export type AeyeTransportReason =
  | "EMPTY_PAYLOAD"
  | "UNKNOWN_AEYE"
  | "MACHINE_UNAVAILABLE"
  | "DUPLICATE_PACKET_ID"
  | "ORPHAN_RECEIPT"
  | "SENDER_MISMATCH"
  | "OUTBOX_FILE_MISSING";

export type AeyeMessagePacket = {
  packet_id: string;
  origin_surface: string;
  origin_card_id: string;
  target_aeye: string;
  target_machine: string;
  payload: Record<string, unknown>;
  status: AeyeMessageStatus;
  created_at: string;
};

export type AeyeMessageReceipt = {
  receipt_id: string;
  packet_id: string;
  from_aeye: string;
  from_machine: string;
  status: AeyeMessageStatus;
  message: string;
  created_at: string;
};

export type AeyeDestinationDirectoryEntry = {
  id: string;
  label: string;
  aeye: string;
  machine: string;
  destination_type: string;
  verified: boolean;
  status: string;
  evidence?: string;
  outbox_dir?: string;
  inbox_dir?: string;
  receipt_dir?: string;
};

export type AeyeDestinationDirectory = {
  schema_version?: string;
  generated_by?: string;
  generated_at?: string;
  source?: string;
  routing_rule?: string;
  destinations: AeyeDestinationDirectoryEntry[];
};

export type AeyeTransportPaths = {
  outbox?: string;
  inbox?: string;
  receipt?: string;
};

export type AeyeTransportSuccess = {
  ok: true;
  verdict: "GO";
  packet: AeyeMessagePacket;
  inbox_packet: AeyeMessagePacket;
  receipt: AeyeMessageReceipt;
  paths: Required<AeyeTransportPaths>;
};

export type AeyeTransportStop = {
  ok: false;
  verdict: "STOP";
  reason: AeyeTransportReason;
  status?: AeyeMessageStatus;
  packet?: AeyeMessagePacket;
  existing_packet?: AeyeMessagePacket | null;
  existing_receipt?: AeyeMessageReceipt | null;
  paths?: AeyeTransportPaths;
};

export type AeyeTransportResult = AeyeTransportSuccess | AeyeTransportStop;

export const AEYE_MESSAGE_ROOT = path.join(process.cwd(), "foreman", "messages");
export const AEYE_MESSAGE_OUTBOX = path.join(AEYE_MESSAGE_ROOT, "outbox");
export const AEYE_MESSAGE_INBOX = path.join(AEYE_MESSAGE_ROOT, "inbox");
export const AEYE_MESSAGE_RECEIPTS = path.join(AEYE_MESSAGE_ROOT, "receipts");
export const AEYE_DESTINATION_DIRECTORY_PATH = path.join(AEYE_MESSAGE_ROOT, "DESTINATION_DIRECTORY.json");

const KNOWN_AEYES = new Map([
  ["bean", "Bean"],
  ["computer", "Computer"],
  ["dink", "Dink"],
  ["ender", "Ender"],
  ["maker", "Maker"],
  ["petra", "Petra"],
  ["skybro", "Skybro"],
  ["thufir", "Thufir"]
]);

function safeName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeJsonExclusive(filePath: string, value: unknown): Promise<boolean> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "EEXIST") {
      return false;
    }
    throw err;
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function messagePacketPath(folder: "outbox" | "inbox", packetId: string): string {
  const dir = folder === "outbox" ? AEYE_MESSAGE_OUTBOX : AEYE_MESSAGE_INBOX;
  return path.join(dir, `${safeName(packetId)}.json`);
}

export function messageReceiptPath(receiptId: string): string {
  return path.join(AEYE_MESSAGE_RECEIPTS, `${safeName(receiptId)}.json`);
}

export function stampAeyeMessageId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeAeye(aeye: string | null | undefined): string | null {
  const key = aeye?.trim().toLowerCase();
  return key ? KNOWN_AEYES.get(key) ?? null : null;
}

function destinationKey(aeye: string, machine: string): string {
  return `${aeye.trim()}@${machine.trim()}`.toLowerCase();
}

function destinationIsVerified(destination: AeyeDestinationDirectoryEntry): boolean {
  return destination.verified === true && destination.status.trim().toLowerCase() === "available";
}

export async function loadDestinationDirectory(): Promise<AeyeDestinationDirectory> {
  const directory = await readJson<AeyeDestinationDirectory>(AEYE_DESTINATION_DIRECTORY_PATH);
  if (!directory || !Array.isArray(directory.destinations)) {
    return {
      schema_version: "destination_directory_v0",
      source: "foreman/messages/DESTINATION_DIRECTORY.json",
      routing_rule: "Destination Directory missing or invalid. No targets are routable.",
      destinations: []
    };
  }
  return directory;
}

export async function listVerifiedDestinations(): Promise<AeyeDestinationDirectoryEntry[]> {
  const directory = await loadDestinationDirectory();
  return directory.destinations.filter(destinationIsVerified);
}

export async function verifiedDestinationFor(aeye: string, machine: string): Promise<AeyeDestinationDirectoryEntry | null> {
  const target = destinationKey(aeye, machine);
  const destinations = await listVerifiedDestinations();
  return destinations.find((destination) => destinationKey(destination.aeye, destination.machine) === target) ?? null;
}

export async function recipientAvailable(aeye: string, machine: string): Promise<boolean> {
  return Boolean(await verifiedDestinationFor(aeye, machine));
}

function payloadHasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(payloadHasValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(payloadHasValue);
  return false;
}

export function payloadEmpty(payload: Record<string, unknown>): boolean {
  return !payloadHasValue(payload);
}

async function findExistingReceiptForPacket(packetId: string): Promise<AeyeMessageReceipt | null> {
  try {
    const entries = await fs.readdir(AEYE_MESSAGE_RECEIPTS, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const receipt = await readJson<AeyeMessageReceipt>(path.join(AEYE_MESSAGE_RECEIPTS, entry.name));
      if (receipt?.packet_id === packetId) return receipt;
    }
  } catch {
    return null;
  }
  return null;
}

async function existingPacket(packetId: string): Promise<AeyeMessagePacket | null> {
  return (
    (await readJson<AeyeMessagePacket>(messagePacketPath("outbox", packetId))) ??
    (await readJson<AeyeMessagePacket>(messagePacketPath("inbox", packetId)))
  );
}

export async function verifySentOutbox(packetId: string): Promise<AeyeTransportStop | { ok: true; packet: AeyeMessagePacket; path: string }> {
  const outbox = messagePacketPath("outbox", packetId);
  const packet = await readJson<AeyeMessagePacket>(outbox);
  if (!packet || packet.status !== "SENT") {
    return {
      ok: false,
      verdict: "STOP",
      reason: "OUTBOX_FILE_MISSING",
      status: "FAILED",
      paths: { outbox }
    };
  }
  return { ok: true, packet, path: outbox };
}

export async function writeAeyeReceiptForPacket(input: {
  packet_id: string;
  receipt_id?: string;
  from_aeye: string;
  from_machine: string;
  status?: AeyeMessageStatus;
  message: string;
  created_at?: string;
}): Promise<AeyeTransportStop | { ok: true; receipt: AeyeMessageReceipt; inbox_packet: AeyeMessagePacket; paths: Required<AeyeTransportPaths> }> {
  const outbox = messagePacketPath("outbox", input.packet_id);
  const packet = await readJson<AeyeMessagePacket>(outbox);
  if (!packet) {
    return {
      ok: false,
      verdict: "STOP",
      reason: "ORPHAN_RECEIPT",
      paths: { outbox }
    };
  }

  if (packet.target_aeye !== input.from_aeye.trim() || packet.target_machine !== input.from_machine.trim()) {
    return {
      ok: false,
      verdict: "STOP",
      reason: "SENDER_MISMATCH",
      packet,
      paths: { outbox }
    };
  }

  const receipt: AeyeMessageReceipt = {
    receipt_id: input.receipt_id?.trim() || stampAeyeMessageId("receipt"),
    packet_id: packet.packet_id,
    from_aeye: input.from_aeye.trim(),
    from_machine: input.from_machine.trim(),
    status: input.status ?? "RECEIVED",
    message: input.message,
    created_at: input.created_at ?? new Date().toISOString()
  };
  const inboxPacket: AeyeMessagePacket = {
    ...packet,
    status: input.status ?? "RECEIVED"
  };
  const inbox = messagePacketPath("inbox", packet.packet_id);
  const receiptPath = messageReceiptPath(receipt.receipt_id);

  const receiptWritten = await writeJsonExclusive(receiptPath, receipt);
  if (!receiptWritten) {
    return {
      ok: false,
      verdict: "STOP",
      reason: "DUPLICATE_PACKET_ID",
      packet,
      existing_receipt: await readJson<AeyeMessageReceipt>(receiptPath),
      paths: { outbox, receipt: receiptPath }
    };
  }

  await writeJson(inbox, inboxPacket);

  return {
    ok: true,
    receipt,
    inbox_packet: inboxPacket,
    paths: { outbox, inbox, receipt: receiptPath }
  };
}

export async function dispatchAeyeMessage(input: {
  packet_id?: string;
  origin_surface?: string;
  origin_card_id?: string;
  target_aeye?: string;
  target_machine?: string;
  payload: Record<string, unknown>;
    receipt?: {
      receipt_id?: string;
      from_aeye?: string;
      from_machine?: string;
      status?: AeyeMessageStatus;
      message?: string;
    };
  created_at?: string;
}): Promise<AeyeTransportResult> {
  if (payloadEmpty(input.payload)) {
    return { ok: false, verdict: "STOP", reason: "EMPTY_PAYLOAD", status: "REJECTED" };
  }

  const targetAeye = normalizeAeye(input.target_aeye ?? "Dink");
  if (!targetAeye) {
    return { ok: false, verdict: "STOP", reason: "UNKNOWN_AEYE", status: "REJECTED" };
  }

  const targetMachine = (input.target_machine ?? "Betsy").trim();
  const packet: AeyeMessagePacket = {
    packet_id: input.packet_id?.trim() || stampAeyeMessageId("packet"),
    origin_surface: input.origin_surface?.trim() || "Wonka Den",
    origin_card_id: input.origin_card_id?.trim() || stampAeyeMessageId("origin_card"),
    target_aeye: targetAeye,
    target_machine: targetMachine,
    payload: input.payload,
    status: "DRAFT",
    created_at: input.created_at ?? new Date().toISOString()
  };

  const outbox = messagePacketPath("outbox", packet.packet_id);
  const inbox = messagePacketPath("inbox", packet.packet_id);
  const hasDuplicate = (await fileExists(outbox)) || (await fileExists(inbox));
  if (hasDuplicate) {
    return {
      ok: false,
      verdict: "STOP",
      reason: "DUPLICATE_PACKET_ID",
      status: "REJECTED",
      existing_packet: await existingPacket(packet.packet_id),
      existing_receipt: await findExistingReceiptForPacket(packet.packet_id),
      paths: { outbox, inbox }
    };
  }

  if (!(await recipientAvailable(targetAeye, targetMachine))) {
    const pendingPacket: AeyeMessagePacket = {
      ...packet,
      status: "PENDING_RECIPIENT_AVAILABILITY"
    };
    await writeJsonExclusive(outbox, pendingPacket);
    return {
      ok: false,
      verdict: "STOP",
      reason: "MACHINE_UNAVAILABLE",
      status: "PENDING_RECIPIENT_AVAILABILITY",
      packet: pendingPacket,
      paths: { outbox }
    };
  }

  const validatedPacket: AeyeMessagePacket = {
    ...packet,
    status: "VALIDATED"
  };
  const queuedPacket: AeyeMessagePacket = {
    ...validatedPacket,
    status: "QUEUED"
  };
  const wroteQueued = await writeJsonExclusive(outbox, queuedPacket);
  if (!wroteQueued) {
    return {
      ok: false,
      verdict: "STOP",
      reason: "DUPLICATE_PACKET_ID",
      status: "REJECTED",
      existing_packet: await readJson<AeyeMessagePacket>(outbox),
      paths: { outbox }
    };
  }

  const queuedFromDisk = await readJson<AeyeMessagePacket>(outbox);
  if (!queuedFromDisk) {
    return { ok: false, verdict: "STOP", reason: "OUTBOX_FILE_MISSING", status: "FAILED", paths: { outbox } };
  }

  const sentPacket: AeyeMessagePacket = {
    ...queuedFromDisk,
    status: "SENT"
  };
  await writeJson(outbox, sentPacket);

  const sentVerified = await verifySentOutbox(sentPacket.packet_id);
  if (!sentVerified.ok) return sentVerified;

  const receipt = await writeAeyeReceiptForPacket({
    packet_id: sentPacket.packet_id,
    receipt_id: input.receipt?.receipt_id,
    from_aeye: input.receipt?.from_aeye ?? targetAeye,
    from_machine: input.receipt?.from_machine ?? targetMachine,
    status: input.receipt?.status ?? "RECEIVED",
    message: input.receipt?.message ?? `${targetAeye}@${targetMachine} received this task.`,
    created_at: new Date().toISOString()
  });

  if (!receipt.ok) return receipt;

  return {
    ok: true,
    verdict: "GO",
    packet: sentPacket,
    inbox_packet: receipt.inbox_packet,
    receipt: receipt.receipt,
    paths: receipt.paths
  };
}

export async function writeAeyeMessageExchange(packet: AeyeMessagePacket, receipt: AeyeMessageReceipt) {
  const result = await dispatchAeyeMessage({
    packet_id: packet.packet_id,
    origin_surface: packet.origin_surface,
    origin_card_id: packet.origin_card_id,
    target_aeye: packet.target_aeye,
    target_machine: packet.target_machine,
    payload: packet.payload,
    created_at: packet.created_at,
    receipt: {
      receipt_id: receipt.receipt_id,
      from_aeye: receipt.from_aeye,
      from_machine: receipt.from_machine,
      message: receipt.message
    }
  });

  if (!result.ok) {
    throw new Error(result.reason);
  }

  return {
    outbox: result.paths.outbox,
    inbox: result.paths.inbox,
    receipt: result.paths.receipt
  };
}
