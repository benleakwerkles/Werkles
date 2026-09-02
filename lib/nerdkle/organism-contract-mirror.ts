import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { HARVEY_NERDKLE_PACKET_SCHEMA, type OrganismPacket } from "../organism/contracts/packet";
import {
  HARVEY_NERDKLE_RECEIPT_SCHEMA,
  type OrganismReceipt,
  type OrganismTerminalStatus,
} from "../organism/contracts/receipt";
import {
  writeOrganismPacketRecord,
  writeOrganismReceiptRecord,
  type OrganismWriteResult,
} from "../organism/contracts/storage";

export type NerdkleMirrorObject = {
  id: string;
  operator_intent: string;
  artifact_created: string;
  unresolved_fields?: string[];
  human_gates?: string[];
  execution_owner: string;
  next_action: string;
  evidence_required?: string[];
  failure_condition: string;
  created_at: string;
};

export type NerdkleLegacyReceipt = {
  id: string;
  object_id: string;
  pass: boolean;
  outcome: string;
  artifact_path: string;
  notes: string;
  object_hash: string;
  created_at: string;
};

export type NerdkleOrganismContractMirror = {
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

function isoOrNow(value: string) {
  return Number.isNaN(Date.parse(value)) ? new Date().toISOString() : value;
}

function expiresInDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sourceProof(filePath: string) {
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

function summarizePacketWrite(result: OrganismWriteResult<OrganismPacket>, packetId: string): NerdkleOrganismContractMirror {
  if (!result.ok) {
    throw new Error(`NERDKLE_ORGANISM_PACKET_SCHEMA_INVALID:${JSON.stringify(result.issues)}`);
  }

  return {
    ok: true,
    packet_id: packetId,
    artifact_path: result.path,
    event_path: result.event_path,
    sha256: result.sha256,
  };
}

function summarizeReceiptWrite(result: OrganismWriteResult<OrganismReceipt>, packetId: string): NerdkleOrganismContractMirror {
  if (!result.ok) {
    throw new Error(`NERDKLE_ORGANISM_RECEIPT_SCHEMA_INVALID:${JSON.stringify(result.issues)}`);
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

export function nerdkleOrganismPacketId(objectId: string) {
  return `nerdkle_execution_${safeId(objectId, "object")}`;
}

export async function writeNerdkleOrganismPacketRecord(input: {
  object: NerdkleMirrorObject;
  object_path: string;
  packet_path: string;
}) {
  const objectProof = await sourceProof(input.object_path);
  const packetProof = await sourceProof(input.packet_path);
  const sourceProofs = [objectProof, packetProof].filter((proof) => proof.exists);
  const sourceHashes = Object.fromEntries(sourceProofs.map((proof) => [proof.path, proof.sha256]));
  const packetId = nerdkleOrganismPacketId(input.object.id);

  const packet: OrganismPacket = {
    schema: HARVEY_NERDKLE_PACKET_SCHEMA,
    packet_id: packetId,
    created_at: new Date().toISOString(),
    from: "Nerdkle@Werkles",
    to: input.object.execution_owner || "NerdkleReceiver@Unknown",
    lane: "Nerdkle execution",
    operator_intent: input.object.operator_intent || "Execute the Nerdkle object and return proof.",
    source_paths: sourceProofs.map((proof) => proof.path),
    source_hashes: sourceHashes as Record<string, string>,
    cwd: ROOT,
    requested_action: input.object.next_action || "Execute the Nerdkle object and return proof.",
    allowed_actions: ["read", "write", "readback"],
    forbidden_actions: ["deploy", "push", "secret_access", "production_mutation"],
    stop_conditions: [
      input.object.failure_condition || "Stop if the Nerdkle object cannot be executed truthfully.",
      "Stop if required evidence cannot be produced.",
    ],
    acceptance_criteria:
      input.object.evidence_required && input.object.evidence_required.length > 0
        ? input.object.evidence_required
        : ["A Nerdkle execution receipt is recorded and mirrored into the organism contract store."],
    receipt_required: true,
    receipt_destination: "data/organism/contracts/receipts",
    idempotency_key: `nerdkle:${input.object.id}:organism-packet`,
    expires_at: expiresInDays(7),
  };

  return {
    packet,
    contract_write: summarizePacketWrite(
      await writeOrganismPacketRecord(packet, { detected_by: "NerdkleOrganismPacketMirror@Werkles" }),
      packetId,
    ),
  };
}

export async function writeNerdkleOrganismReceiptRecord(input: {
  object: NerdkleMirrorObject;
  object_path: string;
  legacy_receipt: NerdkleLegacyReceipt;
  legacy_receipt_path: string;
}) {
  const objectProof = await sourceProof(input.object_path);
  const legacyReceiptProof = await sourceProof(input.legacy_receipt_path);
  const artifactProof = await sourceProof(input.legacy_receipt.artifact_path || input.object.artifact_created);
  const packetId = nerdkleOrganismPacketId(input.object.id);
  const sourceProofs = [objectProof, legacyReceiptProof, artifactProof].filter((proof) => proof.exists);
  const sourceHashes = Object.fromEntries(sourceProofs.map((proof) => [proof.path, proof.sha256]));
  const pass = input.legacy_receipt.pass === true;
  const status: OrganismTerminalStatus = pass ? (artifactProof.exists ? "completed" : "source_missing") : "blocked";
  const artifactRel = artifactProof.path;
  const receiptRel = legacyReceiptProof.path;
  const objectRel = objectProof.path;
  const receiptId = `nerdkle_organism_receipt_${safeId(input.legacy_receipt.id, "receipt")}`;

  const receipt: OrganismReceipt = {
    schema: HARVEY_NERDKLE_RECEIPT_SCHEMA,
    receipt_id: receiptId,
    packet_id: packetId,
    created_at: isoOrNow(input.legacy_receipt.created_at),
    receiver: input.object.execution_owner || "NerdkleReceiver@Unknown",
    status,
    what_was_attempted:
      "Mirror a legacy Nerdkle execution receipt into the canonical organism receipt/event contract without changing the legacy Nerdkle object loop.",
    what_changed: [
      objectRel,
      receiptRel,
      artifactRel,
      `data/organism/contracts/receipts/${receiptId}.json`,
      "data/organism/contracts/events.jsonl",
    ],
    what_did_not_change: [
      "The legacy Nerdkle receipt remains the source input.",
      "The legacy Nerdkle object schema was not replaced.",
      "No external send.",
      "No deploy.",
      "No push.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: receiptRel,
      },
      legacyReceiptProof.sha256
        ? {
            kind: "hash",
            value: `${receiptRel} sha256 ${legacyReceiptProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `legacy_receipt_missing=${receiptRel}`,
          },
      {
        kind: "artifact_path",
        value: objectRel,
      },
      objectProof.sha256
        ? {
            kind: "hash",
            value: `${objectRel} sha256 ${objectProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `object_missing=${objectRel}`,
          },
      {
        kind: "artifact_path",
        value: artifactRel,
      },
      artifactProof.sha256
        ? {
            kind: "hash",
            value: `${artifactRel} sha256 ${artifactProof.sha256}`,
          }
        : {
            kind: "readback",
            value: `artifact_missing=${artifactRel}`,
          },
      {
        kind: "readback",
        value: `legacy_receipt_pass=${pass ? "Y" : "N"}; outcome=${input.legacy_receipt.outcome || "execution receipt recorded"}`,
      },
    ],
    blocked_reason:
      status === "source_missing"
        ? `SOURCE_MISSING:${artifactRel}`
        : status === "blocked"
          ? `NERDKLE_LEGACY_RECEIPT_BLOCKED:${input.legacy_receipt.outcome || "blocked"}`
          : null,
    next_safe_action:
      status === "completed"
        ? "Review the mirrored organism receipt and keep using canonical organism receipts for Nerdkle execution proof."
        : "Resolve the blocker or missing artifact, then submit a new Nerdkle execution receipt.",
    source_hashes_used: sourceHashes as Record<string, string>,
  };

  return {
    receipt,
    contract_write: summarizeReceiptWrite(
      await writeOrganismReceiptRecord(receipt, { detected_by: "NerdkleOrganismReceiptMirror@Werkles" }),
      packetId,
    ),
  };
}
