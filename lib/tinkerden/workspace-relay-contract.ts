import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { HARVEY_NERDKLE_RECEIPT_SCHEMA, type OrganismReceipt } from "../organism/contracts/receipt";
import { writeOrganismReceiptRecord, type OrganismWriteResult } from "../organism/contracts/storage";

type ContractWritePointer = {
  ok: boolean;
  artifact_path: string;
  event_path: string;
  sha256?: string;
  code?: "SCHEMA_INVALID";
  issues?: Array<{ path: string; message: string }>;
};

export type WorkspaceRelayRunnerContractInput = {
  packet_id: string;
  runner_receipt_id: string;
  relay_id: string;
  packet_path: string;
  packet_relay_receipt_path?: string;
  runner_receipt_path?: string;
  receipt_path?: string;
  runner_request_path?: string;
  event_path?: string;
  receipt_pickup_path?: string;
  receiver?: string;
  runner_mode?: string;
  runner_status?: string;
  clipboard_set?: boolean;
  clipboard_verified?: boolean;
  workspace_focused?: boolean;
};

const ROOT = process.cwd();

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(ROOT, filePath));
}

function absolutePath(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function sourcePath(filePath: string) {
  return repoRel(absolutePath(filePath));
}

function sha256(contents: string | Buffer) {
  return createHash("sha256").update(contents).digest("hex");
}

function summarizeContractWrite(result: OrganismWriteResult<OrganismReceipt>): ContractWritePointer {
  if (result.ok) {
    return {
      ok: true,
      artifact_path: result.path,
      event_path: result.event_path,
      sha256: result.sha256,
    };
  }

  return {
    ok: false,
    artifact_path: result.receipt_path,
    event_path: result.event_path,
    code: result.code,
    issues: result.issues,
  };
}

function optionalPath(value: string | undefined) {
  if (!value?.trim()) return null;
  return sourcePath(value);
}

function uniqueStrings(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

async function packetSourceProof(packetPath: string) {
  const relPath = sourcePath(packetPath);
  try {
    const raw = await readFile(absolutePath(packetPath));
    return {
      path: relPath,
      sha256: sha256(raw),
      missing: false,
    };
  } catch {
    return {
      path: relPath,
      sha256: null,
      missing: true,
    };
  }
}

export async function writeWorkspaceRelayRunnerContractReceipt(
  input: WorkspaceRelayRunnerContractInput,
): Promise<ContractWritePointer> {
  const packetProof = await packetSourceProof(input.packet_path);
  const status = packetProof.missing ? "source_missing" : "partial";
  const changed = uniqueStrings([
    packetProof.path,
    optionalPath(input.packet_relay_receipt_path),
    optionalPath(input.runner_receipt_path),
    optionalPath(input.receipt_path),
    optionalPath(input.runner_request_path),
    optionalPath(input.event_path),
    optionalPath(input.receipt_pickup_path),
    `data/organism/contracts/receipts/${input.runner_receipt_id}.json`,
    "data/organism/contracts/events.jsonl",
  ]);

  const proof = [
    { kind: "artifact_path" as const, value: packetProof.path },
    packetProof.sha256 ? { kind: "hash" as const, value: `${packetProof.path} sha256 ${packetProof.sha256}` } : null,
    optionalPath(input.runner_receipt_path)
      ? { kind: "artifact_path" as const, value: optionalPath(input.runner_receipt_path)! }
      : null,
    {
      kind: "readback" as const,
      value:
        `relay_id=${input.relay_id}; runner_mode=${input.runner_mode ?? "UNKNOWN"}; ` +
        `runner_status=${input.runner_status ?? "UNKNOWN"}; clipboard_verified=${input.clipboard_verified === true ? "Y" : "N"}; ` +
        `workspace_focused=${input.workspace_focused === true ? "Y" : "N"}; downstream_receiver_proof=required`,
    },
  ].filter((value): value is { kind: "artifact_path" | "hash" | "readback"; value: string } => Boolean(value));

  const receipt: OrganismReceipt = {
    schema: HARVEY_NERDKLE_RECEIPT_SCHEMA,
    receipt_id: input.runner_receipt_id,
    packet_id: input.packet_id,
    created_at: new Date().toISOString(),
    receiver: input.receiver ?? "WorkspaceRelayRunner@Betsy",
    status,
    what_was_attempted:
      "Hand a TinkerDen packet to the verified workspace runner and mirror the runner receipt into the canonical organism contract store.",
    what_changed: changed,
    what_did_not_change: [
      "Receiver-side Aeye completion proof was not claimed by this workspace relay receipt.",
      "Downstream work remains awaiting receiver proof.",
      "No account automation.",
      "No browser credential control.",
      "No deploy.",
      "No push.",
    ],
    proof,
    blocked_reason: packetProof.missing ? `SOURCE_MISSING:${packetProof.path}` : null,
    next_safe_action:
      "Keep the packet visible until the downstream Aeye returns a separate receipt; this runner receipt proves custody only.",
    source_hashes_used: packetProof.sha256 ? { [packetProof.path]: packetProof.sha256 } : {},
  };

  const write = await writeOrganismReceiptRecord(receipt, { detected_by: "TinkerDenWorkspaceRelay@Betsy" });

  if (!write.ok) {
    throw new Error(`ORGANISM_WORKSPACE_RELAY_RECEIPT_BLOCKED:${JSON.stringify(write.issues)}`);
  }

  return summarizeContractWrite(write);
}
