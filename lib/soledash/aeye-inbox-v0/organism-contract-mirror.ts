import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { HARVEY_NERDKLE_PACKET_SCHEMA, type OrganismPacket } from "../../organism/contracts/packet";
import { HARVEY_NERDKLE_RECEIPT_SCHEMA, type OrganismReceipt } from "../../organism/contracts/receipt";
import {
  writeOrganismPacketRecord,
  writeOrganismReceiptRecord,
  type OrganismWriteResult,
} from "../../organism/contracts/storage";
import type { AeyeMessagePacket, AeyeMessageReceipt } from "./protocol";

export type SoleDashAeyeTransportContractMirror = {
  ok: true;
  packet_id: string;
  receipt_id?: string;
  artifact_path: string;
  event_path: string;
  sha256: string;
};

const ROOT = process.cwd();

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(ROOT, filePath));
}

function abs(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function safeId(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || `${fallback}_${Date.now().toString(36)}`;
}

function expiresInDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function sourceProof(filePath: string | undefined) {
  if (!filePath?.trim()) return null;
  const absolutePath = abs(filePath);
  const relativePath = repoRel(absolutePath);
  try {
    const raw = await readFile(absolutePath);
    return {
      path: relativePath,
      sha256: sha256(raw),
      exists: true,
    };
  } catch {
    return {
      path: relativePath,
      sha256: null,
      exists: false,
    };
  }
}

function summarizePacketWrite(
  result: OrganismWriteResult<OrganismPacket>,
  packetId: string,
): SoleDashAeyeTransportContractMirror {
  if (!result.ok) {
    throw new Error(`SOLEDASH_AEYE_ORGANISM_PACKET_SCHEMA_INVALID:${JSON.stringify(result.issues)}`);
  }

  return {
    ok: true,
    packet_id: packetId,
    artifact_path: result.path,
    event_path: result.event_path,
    sha256: result.sha256,
  };
}

function summarizeReceiptWrite(
  result: OrganismWriteResult<OrganismReceipt>,
  packetId: string,
): SoleDashAeyeTransportContractMirror {
  if (!result.ok) {
    throw new Error(`SOLEDASH_AEYE_ORGANISM_RECEIPT_SCHEMA_INVALID:${JSON.stringify(result.issues)}`);
  }

  return {
    ok: true,
    packet_id: packetId,
    receipt_id: result.value.receipt_id,
    artifact_path: result.path,
    event_path: result.event_path,
    sha256: result.sha256,
  };
}

export function soledashAeyeOrganismPacketId(packetId: string) {
  return `soledash_aeye_transport_${safeId(packetId, "packet")}`;
}

export async function writeSoleDashAeyeTransportPacketRecord(input: {
  packet: AeyeMessagePacket;
  outbox_path?: string;
  inbox_path?: string;
}) {
  const outboxProof = await sourceProof(input.outbox_path);
  const inboxProof = await sourceProof(input.inbox_path);
  const sourceProofs = [outboxProof, inboxProof].filter((proof): proof is NonNullable<typeof proof> => Boolean(proof?.exists));
  const sourceHashes = Object.fromEntries(sourceProofs.map((proof) => [proof.path, proof.sha256]));
  const packetId = soledashAeyeOrganismPacketId(input.packet.packet_id);

  const packet: OrganismPacket = {
    schema: HARVEY_NERDKLE_PACKET_SCHEMA,
    packet_id: packetId,
    created_at: input.packet.created_at,
    from: input.packet.origin_surface || "SoleDash@Werkles",
    to: `${input.packet.target_aeye}@${input.packet.target_machine}`,
    lane: "SoleDash Aeye transport",
    operator_intent: "Transport a SoleDash Aeye message and preserve canonical custody proof.",
    source_paths: sourceProofs.map((proof) => proof.path),
    source_hashes: sourceHashes as Record<string, string>,
    cwd: ROOT,
    requested_action: "Record transport custody for a SoleDash Aeye packet.",
    allowed_actions: ["read", "write", "dispatch_packet", "readback"],
    forbidden_actions: ["deploy", "push", "secret_access", "production_mutation"],
    stop_conditions: [
      "Stop if the destination is not verified.",
      "Stop if the transport packet cannot be written or read back.",
    ],
    acceptance_criteria: [
      "SoleDash message packet is written to outbox.",
      "Canonical organism packet mirror is written.",
      "Receiver work proof remains separate from transport ACK proof.",
    ],
    receipt_required: true,
    receipt_destination: "data/organism/contracts/receipts",
    idempotency_key: `soledash-aeye:${input.packet.packet_id}:organism-packet`,
    expires_at: expiresInDays(7),
  };

  return {
    packet,
    contract_write: summarizePacketWrite(
      await writeOrganismPacketRecord(packet, { detected_by: "SoleDashAeyeTransportPacketMirror@Werkles" }),
      packetId,
    ),
  };
}

export async function writeSoleDashAeyeTransportReceiptRecord(input: {
  packet: AeyeMessagePacket;
  receipt: AeyeMessageReceipt;
  outbox_path?: string;
  inbox_path?: string;
  receipt_path?: string;
}) {
  const outboxProof = await sourceProof(input.outbox_path);
  const inboxProof = await sourceProof(input.inbox_path);
  const receiptProof = await sourceProof(input.receipt_path);
  const sourceProofs = [outboxProof, inboxProof, receiptProof].filter((proof): proof is NonNullable<typeof proof> => Boolean(proof?.exists));
  const sourceHashes = Object.fromEntries(sourceProofs.map((proof) => [proof.path, proof.sha256]));
  const packetId = soledashAeyeOrganismPacketId(input.packet.packet_id);
  const receiptId = `soledash_aeye_transport_receipt_${safeId(input.receipt.receipt_id, "receipt")}`;
  const outboxRel = outboxProof?.path ?? repoRel(abs(input.outbox_path || "foreman/messages/outbox/UNKNOWN.json"));
  const inboxRel = inboxProof?.path ?? repoRel(abs(input.inbox_path || "foreman/messages/inbox/UNKNOWN.json"));
  const receiptRel = receiptProof?.path ?? repoRel(abs(input.receipt_path || "foreman/messages/receipts/UNKNOWN.json"));

  const receipt: OrganismReceipt = {
    schema: HARVEY_NERDKLE_RECEIPT_SCHEMA,
    receipt_id: receiptId,
    packet_id: packetId,
    created_at: input.receipt.created_at,
    receiver: `${input.receipt.from_aeye}@${input.receipt.from_machine}`,
    status: "partial",
    what_was_attempted:
      "Mirror a SoleDash Aeye transport ACK into the canonical organism receipt/event contract without claiming receiver work completion.",
    what_changed: [
      outboxRel,
      inboxRel,
      receiptRel,
      `data/organism/contracts/receipts/${receiptId}.json`,
      "data/organism/contracts/events.jsonl",
    ],
    what_did_not_change: [
      "Transport ACK was not upgraded into completed receiver work proof.",
      "No receiver-side artifact change is claimed by this receipt.",
      "No external send beyond the local SoleDash message transport.",
      "No deploy.",
      "No push.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: receiptRel,
      },
      receiptProof?.sha256
        ? {
            kind: "hash",
            value: `${receiptRel} sha256 ${receiptProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `transport_receipt_missing=${receiptRel}`,
          },
      {
        kind: "artifact_path",
        value: outboxRel,
      },
      outboxProof?.sha256
        ? {
            kind: "hash",
            value: `${outboxRel} sha256 ${outboxProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `outbox_missing=${outboxRel}`,
          },
      {
        kind: "artifact_path",
        value: inboxRel,
      },
      inboxProof?.sha256
        ? {
            kind: "hash",
            value: `${inboxRel} sha256 ${inboxProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `inbox_missing=${inboxRel}`,
          },
      {
        kind: "readback",
        value: `transport_status=${input.receipt.status}; message=${input.receipt.message}`,
      },
    ],
    blocked_reason: null,
    next_safe_action:
      "Route the packet through a receiver-handoff return before claiming receiver work completion.",
    source_hashes_used: sourceHashes as Record<string, string>,
  };

  return {
    receipt,
    contract_write: summarizeReceiptWrite(
      await writeOrganismReceiptRecord(receipt, { detected_by: "SoleDashAeyeTransportReceiptMirror@Werkles" }),
      packetId,
    ),
  };
}
