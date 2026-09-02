import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";

import {
  HARVEY_NERDKLE_EVENT_SCHEMA,
  type OrganismEvent,
  validateOrganismEvent,
} from "./event";
import {
  type ContractValidationIssue,
  type OrganismPacket,
  validateOrganismPacket,
} from "./packet";
import {
  HARVEY_NERDKLE_RECEIPT_SCHEMA,
  type OrganismReceipt,
  validateOrganismReceipt,
} from "./receipt";

export const ORGANISM_CONTRACT_ROOT = path.join(process.cwd(), "data", "organism", "contracts");
export const ORGANISM_CONTRACT_PACKET_DIR = path.join(ORGANISM_CONTRACT_ROOT, "packets");
export const ORGANISM_CONTRACT_RECEIPT_DIR = path.join(ORGANISM_CONTRACT_ROOT, "receipts");
export const ORGANISM_CONTRACT_EVENTS_PATH = path.join(ORGANISM_CONTRACT_ROOT, "events.jsonl");

export type OrganismWriteResult<T> =
  | {
      ok: true;
      value: T;
      path: string;
      event: OrganismEvent;
      event_path: string;
      sha256: string;
    }
  | {
      ok: false;
      code: "SCHEMA_INVALID";
      issues: ContractValidationIssue[];
      receipt: OrganismReceipt;
      receipt_path: string;
      event: OrganismEvent;
      event_path: string;
    };

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(process.cwd(), filePath));
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function safeFileId(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || `${fallback}_${stamp()}_${randomBytes(3).toString("hex")}`;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const tempPath = `${filePath}.${process.pid}.${randomBytes(3).toString("hex")}.tmp`;
  await writeFile(tempPath, raw, "utf8");
  await rename(tempPath, filePath);
  return sha256(raw);
}

async function appendEvent(event: OrganismEvent) {
  const validation = validateOrganismEvent(event);
  if (!validation.ok) {
    throw new Error(`EVENT_SCHEMA_INVALID:${JSON.stringify(validation.issues)}`);
  }

  await mkdir(path.dirname(ORGANISM_CONTRACT_EVENTS_PATH), { recursive: true });
  await appendFile(ORGANISM_CONTRACT_EVENTS_PATH, `${JSON.stringify(event)}\n`, "utf8");
  return repoRel(ORGANISM_CONTRACT_EVENTS_PATH);
}

async function buildEvent(input: {
  event_type: OrganismEvent["event_type"];
  source_path: string;
  packet_id: string | null;
  receipt_id: string | null;
  detected_by: string;
  destination_guess: string;
}) {
  const raw = await readFile(input.source_path);
  return {
    schema: HARVEY_NERDKLE_EVENT_SCHEMA,
    event_id: `${input.event_type}_${stamp()}_${randomBytes(3).toString("hex")}`,
    timestamp: new Date().toISOString(),
    event_type: input.event_type,
    source_path: repoRel(input.source_path),
    sha256: sha256(raw),
    packet_id: input.packet_id,
    receipt_id: input.receipt_id,
    detected_by: input.detected_by,
    destination_guess: input.destination_guess,
  } satisfies OrganismEvent;
}

function schemaInvalidReceipt(input: unknown, issues: ContractValidationIssue[], detectedBy: string): OrganismReceipt {
  const candidate = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const packetId = text(candidate.packet_id, `UNKNOWN_PACKET_${stamp()}`);
  const receiptId = `schema_invalid_${safeFileId(packetId, "packet")}_${randomBytes(3).toString("hex")}`;

  return {
    schema: HARVEY_NERDKLE_RECEIPT_SCHEMA,
    receipt_id: receiptId,
    packet_id: packetId,
    created_at: new Date().toISOString(),
    receiver: detectedBy,
    status: "blocked",
    what_was_attempted: "Validate organism packet before writing it.",
    what_changed: [`${repoRel(ORGANISM_CONTRACT_RECEIPT_DIR)}/${receiptId}.json`],
    what_did_not_change: ["No packet was written."],
    proof: [
      {
        kind: "command_output",
        value: JSON.stringify({ code: "SCHEMA_INVALID", issues }),
      },
    ],
    blocked_reason: `SCHEMA_INVALID: ${issues.map((item) => `${item.path} ${item.message}`).join("; ")}`,
    next_safe_action: "Fix the packet schema and resubmit through the contract write path.",
    source_hashes_used: {},
  };
}

async function writeReceiptWithoutRevalidation(receipt: OrganismReceipt, detectedBy: string, eventType: OrganismEvent["event_type"]) {
  const receiptPath = path.join(ORGANISM_CONTRACT_RECEIPT_DIR, `${safeFileId(receipt.receipt_id, "receipt")}.json`);
  await writeJsonAtomic(receiptPath, receipt);
  const event = await buildEvent({
    event_type: eventType,
    source_path: receiptPath,
    packet_id: receipt.packet_id,
    receipt_id: receipt.receipt_id,
    detected_by: detectedBy,
    destination_guess: "organism_contract_receipts",
  });
  const eventPath = await appendEvent(event);
  return {
    receipt_path: repoRel(receiptPath),
    event,
    event_path: eventPath,
  };
}

export async function writeOrganismPacketRecord(
  input: unknown,
  options: { detected_by?: string } = {},
): Promise<OrganismWriteResult<OrganismPacket>> {
  const detectedBy = options.detected_by ?? "organism-contract-storage";
  const validation = validateOrganismPacket(input);

  if (!validation.ok) {
    const receipt = schemaInvalidReceipt(input, validation.issues, detectedBy);
    const receiptValidation = validateOrganismReceipt(receipt);
    if (!receiptValidation.ok) {
      throw new Error(`SCHEMA_INVALID_RECEIPT_FAILED:${JSON.stringify(receiptValidation.issues)}`);
    }

    const written = await writeReceiptWithoutRevalidation(receipt, detectedBy, "breach_denied");
    return {
      ok: false,
      code: "SCHEMA_INVALID",
      issues: validation.issues,
      receipt,
      receipt_path: written.receipt_path,
      event: written.event,
      event_path: written.event_path,
    };
  }

  const packetPath = path.join(ORGANISM_CONTRACT_PACKET_DIR, `${safeFileId(validation.value.packet_id, "packet")}.json`);
  const packetHash = await writeJsonAtomic(packetPath, validation.value);
  const event = await buildEvent({
    event_type: "packet_dispatched",
    source_path: packetPath,
    packet_id: validation.value.packet_id,
    receipt_id: null,
    detected_by: detectedBy,
    destination_guess: "organism_contract_packets",
  });
  const eventPath = await appendEvent(event);

  return {
    ok: true,
    value: validation.value,
    path: repoRel(packetPath),
    event,
    event_path: eventPath,
    sha256: packetHash,
  };
}

export async function writeOrganismReceiptRecord(
  input: unknown,
  options: { detected_by?: string } = {},
): Promise<OrganismWriteResult<OrganismReceipt>> {
  const detectedBy = options.detected_by ?? "organism-contract-storage";
  const validation = validateOrganismReceipt(input);

  if (!validation.ok) {
    const packetId = input && typeof input === "object" && !Array.isArray(input)
      ? text((input as Record<string, unknown>).packet_id, `UNKNOWN_PACKET_${stamp()}`)
      : `UNKNOWN_PACKET_${stamp()}`;
    const receipt = schemaInvalidReceipt({ packet_id: packetId }, validation.issues, detectedBy);
    const written = await writeReceiptWithoutRevalidation(receipt, detectedBy, "breach_denied");
    return {
      ok: false,
      code: "SCHEMA_INVALID",
      issues: validation.issues,
      receipt,
      receipt_path: written.receipt_path,
      event: written.event,
      event_path: written.event_path,
    };
  }

  const receiptPath = path.join(ORGANISM_CONTRACT_RECEIPT_DIR, `${safeFileId(validation.value.receipt_id, "receipt")}.json`);
  const receiptHash = await writeJsonAtomic(receiptPath, validation.value);
  const event = await buildEvent({
    event_type: "packet_receipted",
    source_path: receiptPath,
    packet_id: validation.value.packet_id,
    receipt_id: validation.value.receipt_id,
    detected_by: detectedBy,
    destination_guess: "organism_contract_receipts",
  });
  const eventPath = await appendEvent(event);

  return {
    ok: true,
    value: validation.value,
    path: repoRel(receiptPath),
    event,
    event_path: eventPath,
    sha256: receiptHash,
  };
}
