import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { type ContractValidationIssue, type OrganismReceipt, validateOrganismReceipt } from "./receipt";
import { RECEIVER_HANDOFF_ROOT } from "./receiver-handoff-index";
import { writeOrganismReceiptRecord } from "./storage";

type JsonRecord = Record<string, unknown>;

export type ReceiverHandoffReturnPostResult = {
  ok: true;
  bundle_id: string;
  packet_id: string;
  receiver: string;
  receipt_id: string;
  receipt_status: string;
  returned_receipt_path: string;
  returned_receipt_sha256: string;
  contract_write: {
    ok: true;
    artifact_path: string;
    event_path: string;
    sha256: string;
  };
  truth_boundary: string;
};

export class ReceiverHandoffReturnPostError extends Error {
  status: number;
  issues?: ContractValidationIssue[];

  constructor(message: string, status: number, issues?: ContractValidationIssue[]) {
    super(message);
    this.name = "ReceiverHandoffReturnPostError";
    this.status = status;
    this.issues = issues;
  }
}

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

function safeBundleDir(bundleId: string) {
  const cleaned = bundleId.trim();
  if (!cleaned) throw new ReceiverHandoffReturnPostError("BUNDLE_ID_REQUIRED", 400);
  if (!/^[A-Za-z0-9_.-]+$/.test(cleaned)) {
    throw new ReceiverHandoffReturnPostError("BUNDLE_ID_UNSAFE", 400);
  }

  const root = path.resolve(RECEIVER_HANDOFF_ROOT);
  const bundleDir = path.resolve(root, cleaned);
  if (bundleDir !== path.join(root, cleaned) || !bundleDir.startsWith(`${root}${path.sep}`)) {
    throw new ReceiverHandoffReturnPostError("BUNDLE_PATH_ESCAPE", 400);
  }
  return { bundleId: cleaned, bundleDir };
}

async function mustExist(filePath: string, code: string, status: number) {
  try {
    await access(filePath);
  } catch {
    throw new ReceiverHandoffReturnPostError(code, status);
  }
}

async function readJson(filePath: string, code: string, status: number): Promise<JsonRecord> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not object");
    }
    return parsed as JsonRecord;
  } catch {
    throw new ReceiverHandoffReturnPostError(code, status);
  }
}

function unwrapReceipt(value: JsonRecord) {
  const maybeWrapped = value.receipt;
  if (maybeWrapped && typeof maybeWrapped === "object" && !Array.isArray(maybeWrapped)) {
    return maybeWrapped;
  }
  return value;
}

function isUnfilledTemplate(receipt: OrganismReceipt) {
  return (
    receipt.blocked_reason === "TEMPLATE_NOT_FILLED" ||
    receipt.what_changed.includes("TEMPLATE_NOT_FILLED") ||
    receipt.what_was_attempted.includes("TEMPLATE_NOT_FILLED") ||
    receipt.proof.some((proof) => proof.value.includes("TEMPLATE_NOT_FILLED"))
  );
}

export async function postReceiverHandoffReturn(input: {
  bundle_id: string;
  detected_by?: string;
}): Promise<ReceiverHandoffReturnPostResult> {
  const { bundleId, bundleDir } = safeBundleDir(input.bundle_id);
  const manifestPath = path.join(bundleDir, "manifest.json");
  const returnedReceiptPath = path.join(bundleDir, "returned-receipt.json");

  await mustExist(manifestPath, "BUNDLE_NOT_FOUND", 404);
  await mustExist(returnedReceiptPath, "RETURNED_RECEIPT_MISSING", 409);

  const manifest = await readJson(manifestPath, "MANIFEST_MALFORMED", 422);
  const returnedRaw = await readFile(returnedReceiptPath, "utf8");
  let returnedJson: JsonRecord;
  try {
    const parsed = JSON.parse(returnedRaw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not object");
    returnedJson = parsed as JsonRecord;
  } catch {
    throw new ReceiverHandoffReturnPostError("RETURNED_RECEIPT_MALFORMED", 422);
  }

  const validation = validateOrganismReceipt(unwrapReceipt(returnedJson));
  if (!validation.ok) {
    throw new ReceiverHandoffReturnPostError("SCHEMA_INVALID", 422, validation.issues);
  }

  const receipt = validation.value;
  const manifestPacketId = field(manifest.packet_id, "");
  if (manifestPacketId && manifestPacketId !== receipt.packet_id) {
    throw new ReceiverHandoffReturnPostError("RETURNED_PACKET_MISMATCH", 409);
  }

  if (isUnfilledTemplate(receipt)) {
    throw new ReceiverHandoffReturnPostError("TEMPLATE_NOT_FILLED_RETURN_RECEIPT", 409);
  }

  const write = await writeOrganismReceiptRecord(receipt, {
    detected_by: field(input.detected_by, "receiver-handoff-return-post-api"),
  });
  if (!write.ok) {
    throw new ReceiverHandoffReturnPostError("SCHEMA_INVALID", 422, write.issues);
  }

  return {
    ok: true,
    bundle_id: bundleId,
    packet_id: receipt.packet_id,
    receiver: receipt.receiver,
    receipt_id: receipt.receipt_id,
    receipt_status: receipt.status,
    returned_receipt_path: repoRel(returnedReceiptPath),
    returned_receipt_sha256: sha256(returnedRaw),
    contract_write: {
      ok: true,
      artifact_path: write.path,
      event_path: write.event_path,
      sha256: write.sha256,
    },
    truth_boundary: "A local returned-receipt.json was schema-valid, non-template, and posted into the canonical organism receipt store.",
  };
}
