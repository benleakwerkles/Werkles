import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { dispatchAeyeMessage } from "@/lib/soledash/aeye-inbox-v0/protocol";

export type CommandSurfaceStatus = "ACK" | "BLOCKER" | "ARTIFACT";

export type CommandSurfaceResult = {
  packet_id: string;
  receipt_id: string;
  aeye_packet_id: string | null;
  aeye_receipt_id: string | null;
  destination_id: string;
  destination_label: string;
  packet_path: string;
  receipt_path: string;
  aeye_outbox_path: string | null;
  aeye_inbox_path: string | null;
  aeye_receipt_path: string | null;
  decision_ledger_path: string;
  packet_hash: string;
  receiver_read_hash: string;
  receiver_hash_match: boolean;
  aeye_payload_command_hash: string;
  aeye_inbox_packet_match: boolean;
  aeye_receipt_packet_match: boolean;
  aeye_relay_status: string;
  status: CommandSurfaceStatus;
  missing_receiver_proof: string | null;
  packet: Record<string, unknown>;
  receipt: Record<string, unknown>;
};

export type TinkerdenCommandDestination = {
  id: string;
  label: string;
  aeye: string;
  machine: string;
  destination_type: string;
  internal_destination: string;
};

export type TinkerdenCommandPacket = {
  packet_id: string;
  title: string;
  created_at: string;
  source: string;
  target: string;
  command: string;
  status: string;
  packet_path: string;
  packet_hash: string;
};

export type TinkerdenCommandReceipt = {
  receipt_id: string;
  packet_id: string;
  mission: string;
  producer: string;
  status_guess: CommandSurfaceStatus | "UNKNOWN";
  timestamp: string;
  path: string;
  packet_path: string;
  aeye_outbox_path: string | null;
  aeye_inbox_path: string | null;
  aeye_receipt_path: string | null;
  packet_hash: string;
  receiver_read_hash: string;
  receiver_hash_match: boolean;
  aeye_payload_command_hash: string;
  aeye_inbox_packet_match: boolean;
  aeye_receipt_packet_match: boolean;
  aeye_relay_status: string;
  missing_receiver_proof: string | null;
};

const INBOX_DIR = path.join("tinkerden", "inbox");
const RECEIPTS_DIR = path.join("tinkerden", "receipts");
const RECOMMENDATION_CARDS_PATH = path.join("tinkerden", "recommendations", "recommendation_cards.json");
const DECISION_LEDGER_PATH = path.join("tinkerden", "feedback", "decision-ledger.jsonl");
const DESTINATION_DIRECTORY_PATH = path.join("foreman", "messages", "DESTINATION_DIRECTORY.json");

function repoPath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(value: string | null | undefined) {
  if (!value) return null;
  return slash(path.isAbsolute(value) ? path.relative(process.cwd(), value) : value);
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(relativePath: string) {
  try {
    await stat(repoPath(relativePath));
    return true;
  } catch {
    return false;
  }
}

async function writeJson(relativePath: string, value: Record<string, unknown>) {
  await mkdir(path.dirname(repoPath(relativePath)), { recursive: true });
  await writeFile(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendJsonl(relativePath: string, value: Record<string, unknown>) {
  await mkdir(path.dirname(repoPath(relativePath)), { recursive: true });
  await writeFile(repoPath(relativePath), `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
}

async function readAndHash(relativePath: string) {
  const raw = await readFile(repoPath(relativePath), "utf8");
  return sha256(raw);
}

function text(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function commandStatus(value: unknown): CommandSurfaceStatus | "UNKNOWN" {
  return value === "ACK" || value === "BLOCKER" || value === "ARTIFACT" ? value : "UNKNOWN";
}

function bool(value: unknown) {
  return value === true;
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

async function readJsonFile(relativePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(repoPath(relativePath), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function readTinkerdenCommandDestinations(): Promise<TinkerdenCommandDestination[]> {
  const directory = await readJsonFile(DESTINATION_DIRECTORY_PATH);
  const destinations = Array.isArray(directory?.destinations) ? directory.destinations : [];

  return destinations
    .map((destination) => objectRecord(destination))
    .filter((destination): destination is Record<string, unknown> => destination !== null)
    .filter((destination) => destination.verified === true && destination.status === "available")
    .map((destination) => {
      const aeye = text(destination.aeye);
      const machine = text(destination.machine);
      const label = text(destination.label, `${aeye}@${machine}`);

      return {
        id: text(destination.id),
        label,
        aeye,
        machine,
        destination_type: text(destination.destination_type),
        internal_destination: text(destination.inbox_dir, text(destination.endpoint, "UNKNOWN"))
      };
    })
    .filter((destination) => destination.id !== "UNKNOWN" && destination.aeye !== "UNKNOWN" && destination.machine !== "UNKNOWN");
}

async function listJsonFiles(relativeDir: string) {
  try {
    const entries = await readdir(repoPath(relativeDir), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => slash(path.join(relativeDir, entry.name)));
  } catch {
    return [];
  }
}

export async function readTinkerdenCommandInbox(limit = 25): Promise<TinkerdenCommandPacket[]> {
  const files = await listJsonFiles(INBOX_DIR);
  const packets = await Promise.all(
    files.map(async (packetPath) => {
      const packet = await readJsonFile(packetPath);
      if (!packet || packet.schema !== "tinkerden_command_packet_v0") return null;

      return {
        packet_id: text(packet.packet_id),
        title: text(packet.title, "TinkerDen command packet"),
        created_at: text(packet.created_at),
        source: text(packet.source),
        target: text(packet.target),
        command: text(packet.command),
        status: text(packet.status),
        packet_path: packetPath,
        packet_hash: await readAndHash(packetPath)
      };
    })
  );

  return packets
    .filter((packet): packet is TinkerdenCommandPacket => packet !== null)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, limit);
}

export async function readTinkerdenCommandReceipts(limit = 25): Promise<TinkerdenCommandReceipt[]> {
  const files = await listJsonFiles(RECEIPTS_DIR);
  const receipts = await Promise.all(
    files.map(async (receiptPath) => {
      const receipt = await readJsonFile(receiptPath);
      if (!receipt || receipt.schema !== "tinkerden_command_receipt_v0") return null;

      return {
        receipt_id: text(receipt.receipt_id),
        packet_id: text(receipt.packet_id),
        mission: text(receipt.mission),
        producer: text(receipt.producer),
        status_guess: commandStatus(receipt.status_guess),
        timestamp: text(receipt.timestamp),
        path: text(receipt.path, receiptPath),
        packet_path: text(receipt.packet_path),
        aeye_outbox_path: typeof receipt.aeye_outbox_path === "string" ? receipt.aeye_outbox_path : null,
        aeye_inbox_path: typeof receipt.aeye_inbox_path === "string" ? receipt.aeye_inbox_path : null,
        aeye_receipt_path: typeof receipt.aeye_receipt_path === "string" ? receipt.aeye_receipt_path : null,
        packet_hash: text(receipt.packet_hash),
        receiver_read_hash: text(receipt.receiver_read_hash),
        receiver_hash_match: bool(receipt.receiver_hash_match),
        aeye_payload_command_hash: text(receipt.aeye_payload_command_hash),
        aeye_inbox_packet_match: bool(receipt.aeye_inbox_packet_match),
        aeye_receipt_packet_match: bool(receipt.aeye_receipt_packet_match),
        aeye_relay_status: text(receipt.aeye_relay_status, "UNKNOWN"),
        missing_receiver_proof: typeof receipt.missing_receiver_proof === "string" ? receipt.missing_receiver_proof : null
      };
    })
  );

  return receipts
    .filter((receipt): receipt is TinkerdenCommandReceipt => receipt !== null)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, limit);
}

export async function createTinkerdenCommandSurfaceReceipt(
  commandInput: string,
  destinationId: string,
  options: {
    source_surface?: string;
    stream?: string;
    command_type?: string;
  } = {}
): Promise<CommandSurfaceResult> {
  const command = commandInput.trim();
  if (!command) {
    throw new Error("COMMAND_REQUIRED");
  }

  const destinations = await readTinkerdenCommandDestinations();
  const destination = destinationId
    ? destinations.find((candidate) => candidate.id === destinationId)
    : destinations.length === 1
      ? destinations[0]
      : null;
  if (!destination) {
    throw new Error("VERIFIED_DESTINATION_REQUIRED");
  }

  const createdAt = new Date().toISOString();
  const sourceSurface = options.source_surface?.trim() || "TinkerDen@Betsy";
  const stream = options.stream?.trim() || "FERAL / TINKERDEN";
  const commandType = options.command_type?.trim() || "COMMAND";
  const idSeed = `${stamp()}_${randomBytes(3).toString("hex")}`;
  const packetId = `td_command_${idSeed}`;
  const receiptId = `td_command_receipt_${idSeed}`;
  const packetPath = slash(path.join(INBOX_DIR, `${packetId}.json`));
  const receiptPath = slash(path.join(RECEIPTS_DIR, `${receiptId}.json`));

  const requiredSurfaces = {
    inbox: slash(INBOX_DIR),
    receipts: slash(RECEIPTS_DIR),
    recommendation_cards: slash(RECOMMENDATION_CARDS_PATH),
    decision_ledger: slash(DECISION_LEDGER_PATH)
  };

  const packet = {
    schema: "tinkerden_command_packet_v0",
    packet_id: packetId,
    title: "TinkerDen command surface command",
    created_at: createdAt,
    from: sourceSurface,
    source: sourceSurface,
    target: destination.label,
    target_aeye: destination.aeye,
    target_machine: destination.machine,
    destination_id: destination.id,
    destination_type: destination.destination_type,
    internal_destination: destination.internal_destination,
    stream,
    command,
    status: "PACKET_WRITTEN",
    packet_type: commandType,
    mission: command,
    context: "Issued from Command Dash. Relay must write a linked Aeye inbox packet and return ACK / BLOCKER / ARTIFACT.",
    do: ["Read this command packet.", "Write linked Aeye inbox custody files.", "Return a receipt linked to packet_id."],
    do_not: ["Do not call sender-side write proof.", "Do not use free-text routing.", "Do not auto-send outside the local filesystem relay."],
    output_required: "A linked receipt with packet hash and Aeye relay custody paths.",
    receipt_required: "ACK",
    required_return: "ACK / BLOCKER / ARTIFACT",
    proof_rule: "Receiver must read the packet file and match the sender-side SHA-256 file hash before ACK.",
    required_surfaces: requiredSurfaces
  };

  await writeJson(packetPath, packet);
  const packetHash = await readAndHash(packetPath);

  let receiverReadHash = "UNREAD";
  let receiverHashMatch = false;
  let status: CommandSurfaceStatus = "BLOCKER";
  let missingReceiverProof: string | null = "Receiver did not read the written packet.";

  try {
    receiverReadHash = await readAndHash(packetPath);
    receiverHashMatch = receiverReadHash === packetHash;
    if (receiverHashMatch) {
      status = "ACK";
      missingReceiverProof = null;
    } else {
      missingReceiverProof = "Receiver read hash did not match sender packet hash.";
    }
  } catch (error) {
    missingReceiverProof = error instanceof Error ? error.message : "Receiver read failed.";
  }

  let aeyePacketId: string | null = null;
  let aeyeReceiptId: string | null = null;
  let aeyeOutboxPath: string | null = null;
  let aeyeInboxPath: string | null = null;
  let aeyeReceiptPath: string | null = null;
  let aeyePayloadCommandHash = "UNREAD";
  let aeyeInboxPacketMatch = false;
  let aeyeReceiptPacketMatch = false;
  let aeyeRelayStatus = "NOT_ATTEMPTED";

  const transport = await dispatchAeyeMessage({
    packet_id: packetId,
    origin_surface: sourceSurface,
    origin_card_id: `command_dash_${packetId}`,
    target_aeye: destination.aeye,
    target_machine: destination.machine,
    payload: {
      schema: "tinkerden_command_aeye_relay_v0",
      command_packet_id: packetId,
      command_packet_path: packetPath,
      command_packet_hash: packetHash,
      command,
      stream,
      command_type: commandType,
      destination_id: destination.id,
      destination_label: destination.label,
      source_surface: sourceSurface,
      required_return: "ACK / BLOCKER / ARTIFACT"
    },
    receipt: {
      receipt_id: `aeye_${receiptId}`,
      from_aeye: destination.aeye,
      from_machine: destination.machine,
      status: "ACKNOWLEDGED",
      message: `${destination.label} accepted command custody for ${packetId}; command packet hash ${packetHash}.`
    },
    created_at: createdAt
  });

  if (transport.ok) {
    aeyePacketId = transport.packet.packet_id;
    aeyeReceiptId = transport.receipt.receipt_id;
    aeyeOutboxPath = repoRel(transport.paths.outbox);
    aeyeInboxPath = repoRel(transport.paths.inbox);
    aeyeReceiptPath = repoRel(transport.paths.receipt);
    aeyeRelayStatus = transport.receipt.status;

    const aeyeInboxPayload = objectRecord(transport.inbox_packet.payload);
    aeyePayloadCommandHash = text(aeyeInboxPayload?.command_packet_hash);
    receiverReadHash = aeyePayloadCommandHash;
    aeyeInboxPacketMatch = transport.inbox_packet.packet_id === packetId;
    aeyeReceiptPacketMatch = transport.receipt.packet_id === packetId;
    receiverHashMatch = aeyePayloadCommandHash === packetHash && aeyeInboxPacketMatch && aeyeReceiptPacketMatch;
    if (receiverHashMatch) {
      status = "ACK";
      missingReceiverProof = null;
    } else {
      const failures = [
        aeyePayloadCommandHash === packetHash ? null : "Aeye inbox payload did not preserve command packet hash.",
        aeyeInboxPacketMatch ? null : "Aeye inbox packet_id did not match command packet_id.",
        aeyeReceiptPacketMatch ? null : "Aeye receipt packet_id did not match command packet_id."
      ].filter(Boolean);
      missingReceiverProof = failures.join(" ");
    }
  } else {
    status = "BLOCKER";
    aeyeRelayStatus = transport.status ?? transport.reason;
    missingReceiverProof = `Aeye relay blocked: ${transport.reason}`;
    aeyeOutboxPath = repoRel(transport.paths?.outbox);
    aeyeInboxPath = repoRel(transport.paths?.inbox);
    aeyeReceiptPath = repoRel(transport.paths?.receipt);
  }

  const receipt = {
    schema: "tinkerden_command_receipt_v0",
    receipt_id: receiptId,
    packet_id: packetId,
    linked_packet_id: packetId,
    aeye_packet_id: aeyePacketId,
    aeye_receipt_id: aeyeReceiptId,
    destination_id: destination.id,
    destination_label: destination.label,
    mission: command,
    producer: destination.label,
    status_guess: status,
    timestamp: new Date().toISOString(),
    path: receiptPath,
    proof_reference: receiptPath,
    packet_path: packetPath,
    aeye_outbox_path: aeyeOutboxPath,
    aeye_inbox_path: aeyeInboxPath,
    aeye_receipt_path: aeyeReceiptPath,
    packet_hash: packetHash,
    receiver_read_hash: receiverReadHash,
    receiver_hash_match: receiverHashMatch,
    aeye_payload_command_hash: aeyePayloadCommandHash,
    aeye_inbox_packet_match: aeyeInboxPacketMatch,
    aeye_receipt_packet_match: aeyeReceiptPacketMatch,
    aeye_relay_status: aeyeRelayStatus,
    first_return: status,
    missing_receiver_proof: missingReceiverProof,
    required_surfaces: {
      ...requiredSurfaces,
      recommendation_cards_exists: await exists(RECOMMENDATION_CARDS_PATH),
      decision_ledger_exists: await exists(DECISION_LEDGER_PATH)
    },
    limitation: "Filesystem Aeye inbox v0 custody proof only; no independent model/process execution is proven by this ACK."
  };

  await writeJson(receiptPath, receipt);
  await appendJsonl(DECISION_LEDGER_PATH, {
    event_type: "command_surface_receipt",
    timestamp: receipt.timestamp,
    packet_id: packetId,
    receipt_id: receiptId,
    destination_id: destination.id,
    destination_label: destination.label,
    command,
    status,
    packet_path: packetPath,
    receipt_path: receiptPath,
    aeye_packet_id: aeyePacketId,
    aeye_receipt_id: aeyeReceiptId,
    aeye_outbox_path: aeyeOutboxPath,
    aeye_inbox_path: aeyeInboxPath,
    aeye_receipt_path: aeyeReceiptPath,
    aeye_relay_status: aeyeRelayStatus,
    packet_hash: packetHash,
    receiver_read_hash: receiverReadHash,
    receiver_hash_match: receiverHashMatch,
    aeye_payload_command_hash: aeyePayloadCommandHash,
    aeye_inbox_packet_match: aeyeInboxPacketMatch,
    aeye_receipt_packet_match: aeyeReceiptPacketMatch,
    missing_receiver_proof: missingReceiverProof
  });

  return {
    packet_id: packetId,
    receipt_id: receiptId,
    aeye_packet_id: aeyePacketId,
    aeye_receipt_id: aeyeReceiptId,
    destination_id: destination.id,
    destination_label: destination.label,
    packet_path: packetPath,
    receipt_path: receiptPath,
    aeye_outbox_path: aeyeOutboxPath,
    aeye_inbox_path: aeyeInboxPath,
    aeye_receipt_path: aeyeReceiptPath,
    decision_ledger_path: slash(DECISION_LEDGER_PATH),
    packet_hash: packetHash,
    receiver_read_hash: receiverReadHash,
    receiver_hash_match: receiverHashMatch,
    aeye_payload_command_hash: aeyePayloadCommandHash,
    aeye_inbox_packet_match: aeyeInboxPacketMatch,
    aeye_receipt_packet_match: aeyeReceiptPacketMatch,
    aeye_relay_status: aeyeRelayStatus,
    status,
    missing_receiver_proof: missingReceiverProof,
    packet,
    receipt
  };
}
