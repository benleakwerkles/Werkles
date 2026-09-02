import { createHash, randomBytes } from "node:crypto";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  ORGANISM_TERMINAL_STATUSES,
  type ContractValidationIssue,
  type OrganismProofKind,
  type OrganismReceipt,
  type OrganismReceiptProof,
  type OrganismTerminalStatus,
  validateOrganismReceipt,
} from "./receipt";
import { RECEIVER_HANDOFF_ROOT } from "./receiver-handoff-index";

type JsonRecord = Record<string, unknown>;

export type FillReceiverHandoffReturnInput = {
  bundle_id: string;
  status?: string;
  receiver?: string;
  attempted?: string;
  changed?: string[];
  proof_readbacks?: string[];
  proof?: OrganismReceiptProof[];
  blocked_reason?: string | null;
  next_safe_action?: string;
};

export type FillReceiverHandoffReturnResult = {
  ok: true;
  bundle_id: string;
  packet_id: string;
  receiver: string;
  status: OrganismTerminalStatus;
  receipt_id: string;
  returned_receipt_path: string;
  returned_receipt_sha256: string;
  proof_count: number;
  changed_count: number;
  truth_boundary: string;
};

export class ReceiverHandoffReturnFillError extends Error {
  status: number;
  issues?: ContractValidationIssue[];

  constructor(message: string, status: number, issues?: ContractValidationIssue[]) {
    super(message);
    this.name = "ReceiverHandoffReturnFillError";
    this.status = status;
    this.issues = issues;
  }
}

const STATUS_SET = new Set<string>(ORGANISM_TERMINAL_STATUSES);
const PROOF_KIND_SET = new Set<OrganismProofKind>([
  "artifact_path",
  "hash",
  "screenshot",
  "url",
  "command_output",
  "readback",
]);

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(process.cwd(), filePath));
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function field(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeFileId(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || `${fallback}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

function safeBundleDir(bundleId: string) {
  const cleaned = bundleId.trim();
  if (!cleaned) throw new ReceiverHandoffReturnFillError("BUNDLE_ID_REQUIRED", 400);
  if (!/^[A-Za-z0-9_.-]+$/.test(cleaned)) {
    throw new ReceiverHandoffReturnFillError("BUNDLE_ID_UNSAFE", 400);
  }

  const root = path.resolve(RECEIVER_HANDOFF_ROOT);
  const bundleDir = path.resolve(root, cleaned);
  if (bundleDir !== path.join(root, cleaned) || !bundleDir.startsWith(`${root}${path.sep}`)) {
    throw new ReceiverHandoffReturnFillError("BUNDLE_PATH_ESCAPE", 400);
  }
  return { bundleId: cleaned, bundleDir };
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string, code: string, status: number): Promise<JsonRecord> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not object");
    return parsed as JsonRecord;
  } catch {
    throw new ReceiverHandoffReturnFillError(code, status);
  }
}

function uniqueStrings(values: unknown[]) {
  return [
    ...new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  ];
}

function rejectTemplateText(label: string, values: string[]) {
  const hit = values.find((value) => value.includes("TEMPLATE_NOT_FILLED") || /^TEMPLATE:/i.test(value));
  if (hit) {
    const code = label === "ATTEMPTED" ? "ATTEMPTED_STILL_TEMPLATE" : `${label}_STILL_TEMPLATE`;
    throw new ReceiverHandoffReturnFillError(code, 400);
  }
}

function normalizeStatus(value: string | undefined): OrganismTerminalStatus {
  const status = value?.trim() || "partial";
  if (!STATUS_SET.has(status)) throw new ReceiverHandoffReturnFillError(`UNSUPPORTED_STATUS:${status}`, 400);
  return status as OrganismTerminalStatus;
}

function normalizeProofEntries(input: unknown): OrganismReceiptProof[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new ReceiverHandoffReturnFillError("PROOF_MUST_BE_ARRAY", 400);

  return input.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ReceiverHandoffReturnFillError(`PROOF_${index}_MUST_BE_OBJECT`, 400);
    }
    const kind = field((entry as JsonRecord).kind, "");
    const value = field((entry as JsonRecord).value, "");
    if (!PROOF_KIND_SET.has(kind as OrganismProofKind)) {
      throw new ReceiverHandoffReturnFillError(`PROOF_${index}_UNSUPPORTED_KIND`, 400);
    }
    if (!value) throw new ReceiverHandoffReturnFillError(`PROOF_${index}_VALUE_REQUIRED`, 400);
    rejectTemplateText(`PROOF_${index}`, [value]);
    return { kind: kind as OrganismProofKind, value };
  });
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const tempPath = `${filePath}.${process.pid}.${randomBytes(3).toString("hex")}.tmp`;
  await writeFile(tempPath, raw, "utf8");
  await rename(tempPath, filePath);
  return { raw, sha256: sha256(raw) };
}

export async function fillReceiverHandoffReturn(
  input: FillReceiverHandoffReturnInput,
): Promise<FillReceiverHandoffReturnResult> {
  const { bundleId, bundleDir } = safeBundleDir(input.bundle_id || "");
  const manifestPath = path.join(bundleDir, "manifest.json");
  const packetPath = path.join(bundleDir, "packet.json");
  const returnedReceiptPath = path.join(bundleDir, "returned-receipt.json");

  if (!(await exists(manifestPath))) throw new ReceiverHandoffReturnFillError("BUNDLE_NOT_FOUND", 404);
  if (await exists(returnedReceiptPath)) {
    throw new ReceiverHandoffReturnFillError("RETURNED_RECEIPT_ALREADY_EXISTS", 409);
  }

  const manifest = await readJson(manifestPath, "MANIFEST_MALFORMED", 422);
  const packetRaw = await readFile(packetPath, "utf8").catch(() => null);
  if (!packetRaw) throw new ReceiverHandoffReturnFillError("PACKET_COPY_MISSING", 422);
  const packetHash = sha256(packetRaw);
  const packetRel = repoRel(packetPath);
  const packetId = field(manifest.packet_id, "");
  if (!packetId) throw new ReceiverHandoffReturnFillError("MANIFEST_PACKET_ID_MISSING", 422);

  const status = normalizeStatus(input.status);
  const attempted = field(input.attempted, "");
  const changed = uniqueStrings(input.changed || []);
  const proofReadbacks = uniqueStrings(input.proof_readbacks || []);
  const extraProof = normalizeProofEntries(input.proof);
  const blockedReason = input.blocked_reason === null ? "" : field(input.blocked_reason, "");
  const nextSafeAction = field(
    input.next_safe_action,
    "Post this returned receipt through the canonical organism receiver intake.",
  );

  if (!attempted) throw new ReceiverHandoffReturnFillError("ATTEMPTED_REQUIRED", 400);
  rejectTemplateText("ATTEMPTED", [attempted]);
  rejectTemplateText("CHANGED", changed);
  rejectTemplateText("PROOF_READBACK", proofReadbacks);
  rejectTemplateText("NEXT_SAFE_ACTION", [nextSafeAction]);

  const explicitProofCount = proofReadbacks.length + extraProof.length;
  if (status !== "blocked" && changed.length === 0) {
    throw new ReceiverHandoffReturnFillError("CHANGED_PATH_REQUIRED_FOR_NON_BLOCKED_RECEIPT", 400);
  }
  if (status !== "blocked" && explicitProofCount === 0) {
    throw new ReceiverHandoffReturnFillError("EXPLICIT_PROOF_REQUIRED_FOR_NON_BLOCKED_RECEIPT", 400);
  }
  if ((status === "blocked" || status === "source_missing" || status === "breach_denied") && !blockedReason) {
    throw new ReceiverHandoffReturnFillError(`BLOCKED_REASON_REQUIRED_FOR_${status.toUpperCase()}`, 400);
  }

  const returnedRel = repoRel(returnedReceiptPath);
  const receiver = field(input.receiver, field(manifest.receiver, "Receiver@Unknown"));
  const receipt: OrganismReceipt = {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: `receiver_handoff_return_${safeFileId(packetId, "packet")}_${Date.now().toString(36)}`,
    packet_id: packetId,
    created_at: new Date().toISOString(),
    receiver,
    status,
    what_was_attempted: attempted,
    what_changed: uniqueStrings([...changed, returnedRel]),
    what_did_not_change: [
      "The source packet copy was not rewritten by the fill-return helper.",
      "The returned receipt was not posted to the canonical contract store by the fill-return helper.",
      "No deploy.",
      "No push.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: packetRel,
      },
      {
        kind: "hash",
        value: `${packetRel} sha256 ${packetHash}`,
      },
      ...proofReadbacks.map((value) => ({
        kind: "readback" as const,
        value,
      })),
      ...extraProof,
    ],
    blocked_reason: blockedReason || null,
    next_safe_action: nextSafeAction,
    source_hashes_used: {
      [packetRel]: packetHash,
    },
  };

  const validation = validateOrganismReceipt(receipt);
  if (!validation.ok) throw new ReceiverHandoffReturnFillError("SCHEMA_INVALID", 422, validation.issues);

  const written = await writeJsonAtomic(returnedReceiptPath, receipt);
  return {
    ok: true,
    bundle_id: bundleId,
    packet_id: packetId,
    receiver,
    status,
    receipt_id: receipt.receipt_id,
    returned_receipt_path: returnedRel,
    returned_receipt_sha256: written.sha256,
    proof_count: receipt.proof.length,
    changed_count: receipt.what_changed.length,
    truth_boundary: "fill-return wrote a non-template returned-receipt.json from explicit receiver proof fields and did not post it canonically.",
  };
}
