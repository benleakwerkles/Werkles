export const HARVEY_NERDKLE_RECEIPT_SCHEMA = "harvey_nerdkle_receipt_v0" as const;

export const ORGANISM_TERMINAL_STATUSES = [
  "completed",
  "partial",
  "blocked",
  "source_missing",
  "breach_denied",
  "interrupted",
  "superseded",
  "needs_human_gate",
] as const;

export type OrganismTerminalStatus = (typeof ORGANISM_TERMINAL_STATUSES)[number];

export type OrganismProofKind =
  | "artifact_path"
  | "hash"
  | "screenshot"
  | "url"
  | "command_output"
  | "readback";

export type OrganismReceiptProof = {
  kind: OrganismProofKind;
  value: string;
};

export type OrganismReceipt = {
  schema: typeof HARVEY_NERDKLE_RECEIPT_SCHEMA;
  receipt_id: string;
  packet_id: string;
  created_at: string;
  receiver: string;
  status: OrganismTerminalStatus;
  what_was_attempted: string;
  what_changed: string[];
  what_did_not_change: string[];
  proof: OrganismReceiptProof[];
  blocked_reason: string | null;
  next_safe_action: string;
  source_hashes_used: Record<string, string>;
};

export type ContractValidationIssue = {
  path: string;
  message: string;
};

export type ContractValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      code: "SCHEMA_INVALID";
      issues: ContractValidationIssue[];
    };

const TERMINAL_STATUS_SET = new Set<string>(ORGANISM_TERMINAL_STATUSES);
const PROOF_KIND_SET = new Set<OrganismProofKind>([
  "artifact_path",
  "hash",
  "screenshot",
  "url",
  "command_output",
  "readback",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isIsoTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function issue(path: string, message: string): ContractValidationIssue {
  return { path, message };
}

export function validateOrganismReceipt(value: unknown): ContractValidationResult<OrganismReceipt> {
  const issues: ContractValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, code: "SCHEMA_INVALID", issues: [issue("$", "receipt must be an object")] };
  }

  if (value.schema !== HARVEY_NERDKLE_RECEIPT_SCHEMA) {
    issues.push(issue("schema", `schema must be ${HARVEY_NERDKLE_RECEIPT_SCHEMA}`));
  }

  for (const key of ["receipt_id", "packet_id", "receiver", "what_was_attempted", "next_safe_action"]) {
    if (!isNonEmptyString(value[key])) issues.push(issue(key, "required non-empty string"));
  }

  if (!isIsoTimestamp(value.created_at)) issues.push(issue("created_at", "required ISO timestamp"));

  if (!isNonEmptyString(value.status) || !TERMINAL_STATUS_SET.has(value.status)) {
    issues.push(issue("status", `required terminal status: ${ORGANISM_TERMINAL_STATUSES.join(", ")}`));
  }

  for (const key of ["what_changed", "what_did_not_change"]) {
    if (!isStringArray(value[key])) issues.push(issue(key, "required array of non-empty strings"));
  }

  if (!Array.isArray(value.proof)) {
    issues.push(issue("proof", "required proof array"));
  } else {
    value.proof.forEach((proof, index) => {
      if (!isRecord(proof)) {
        issues.push(issue(`proof[${index}]`, "proof must be object"));
        return;
      }
      if (!PROOF_KIND_SET.has(proof.kind as OrganismProofKind)) {
        issues.push(issue(`proof[${index}].kind`, "unsupported proof kind"));
      }
      if (!isNonEmptyString(proof.value)) {
        issues.push(issue(`proof[${index}].value`, "required non-empty string"));
      }
    });
  }

  if (value.blocked_reason !== null && value.blocked_reason !== undefined && !isNonEmptyString(value.blocked_reason)) {
    issues.push(issue("blocked_reason", "must be non-empty string or null"));
  }

  if (
    (value.status === "blocked" || value.status === "source_missing" || value.status === "breach_denied") &&
    !isNonEmptyString(value.blocked_reason)
  ) {
    issues.push(issue("blocked_reason", `required when status is ${String(value.status)}`));
  }

  if (value.status === "completed" && Array.isArray(value.proof) && value.proof.length === 0) {
    issues.push(issue("proof", "completed receipt requires at least one proof entry"));
  }

  if (!isRecord(value.source_hashes_used)) {
    issues.push(issue("source_hashes_used", "required object keyed by source path"));
  }

  if (issues.length > 0) return { ok: false, code: "SCHEMA_INVALID", issues };

  return { ok: true, value: value as OrganismReceipt };
}

