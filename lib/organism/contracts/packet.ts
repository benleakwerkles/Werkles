export const HARVEY_NERDKLE_PACKET_SCHEMA = "harvey_nerdkle_packet_v0" as const;

export type OrganismAllowedAction =
  | "read"
  | "write"
  | "run_safe_command"
  | "dispatch_packet"
  | "render_artifact"
  | "readback";

export type OrganismPacket = {
  schema: typeof HARVEY_NERDKLE_PACKET_SCHEMA;
  packet_id: string;
  created_at: string;
  from: string;
  to: string;
  lane: string;
  operator_intent: string;
  source_paths: string[];
  source_hashes: Record<string, string>;
  cwd: string;
  requested_action: string;
  allowed_actions: OrganismAllowedAction[];
  forbidden_actions: string[];
  stop_conditions: string[];
  acceptance_criteria: string[];
  receipt_required: true;
  receipt_destination: string;
  idempotency_key: string;
  expires_at: string;
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

const ALLOWED_ACTIONS = new Set<OrganismAllowedAction>([
  "read",
  "write",
  "run_safe_command",
  "dispatch_packet",
  "render_artifact",
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

export function validateOrganismPacket(value: unknown): ContractValidationResult<OrganismPacket> {
  const issues: ContractValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, code: "SCHEMA_INVALID", issues: [issue("$", "packet must be an object")] };
  }

  if (value.schema !== HARVEY_NERDKLE_PACKET_SCHEMA) {
    issues.push(issue("schema", `schema must be ${HARVEY_NERDKLE_PACKET_SCHEMA}`));
  }

  for (const key of [
    "packet_id",
    "from",
    "to",
    "lane",
    "operator_intent",
    "cwd",
    "requested_action",
    "receipt_destination",
    "idempotency_key",
  ]) {
    if (!isNonEmptyString(value[key])) issues.push(issue(key, "required non-empty string"));
  }

  for (const key of ["created_at", "expires_at"]) {
    if (!isIsoTimestamp(value[key])) issues.push(issue(key, "required ISO timestamp"));
  }

  for (const key of ["source_paths", "forbidden_actions", "stop_conditions", "acceptance_criteria"]) {
    if (!isStringArray(value[key])) issues.push(issue(key, "required array of non-empty strings"));
  }

  if (!Array.isArray(value.allowed_actions) || value.allowed_actions.length === 0) {
    issues.push(issue("allowed_actions", "required non-empty array"));
  } else {
    value.allowed_actions.forEach((action, index) => {
      if (!ALLOWED_ACTIONS.has(action as OrganismAllowedAction)) {
        issues.push(issue(`allowed_actions[${index}]`, `unsupported action ${String(action)}`));
      }
    });
  }

  if (value.receipt_required !== true) {
    issues.push(issue("receipt_required", "must be true"));
  }

  if (!isRecord(value.source_hashes)) {
    issues.push(issue("source_hashes", "required object keyed by source path"));
  } else if (Array.isArray(value.source_paths)) {
    for (const sourcePath of value.source_paths) {
      if (!isNonEmptyString(value.source_hashes[sourcePath])) {
        issues.push(issue(`source_hashes.${sourcePath}`, "missing source hash for declared source path"));
      }
    }
  }

  if (
    Array.isArray(value.allowed_actions) &&
    value.allowed_actions.includes("write") &&
    Array.isArray(value.forbidden_actions) &&
    value.forbidden_actions.includes("write")
  ) {
    issues.push(issue("allowed_actions", "write cannot be both allowed and forbidden"));
  }

  if (issues.length > 0) return { ok: false, code: "SCHEMA_INVALID", issues };

  return { ok: true, value: value as OrganismPacket };
}

