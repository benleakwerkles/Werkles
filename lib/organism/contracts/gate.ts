export const HARVEY_NERDKLE_GATE_SCHEMA = "harvey_nerdkle_gate_v0" as const;

export type OrganismGateTier = "no_gate_required" | "human_gate_required" | "policy_gate" | "breach_gate";
export type OrganismGateDecision = "allow" | "defer" | "deny" | "needs_human_gate";

export type OrganismGate = {
  schema: typeof HARVEY_NERDKLE_GATE_SCHEMA;
  gate_id: string;
  packet_id: string;
  evaluated_at: string;
  tier: OrganismGateTier;
  decision: OrganismGateDecision;
  reason: string;
  allowed_actions: string[];
  denied_actions: string[];
  human_gate_required: boolean;
  receipt_required: true;
  next_safe_action: string;
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

const GATE_TIERS = new Set<OrganismGateTier>(["no_gate_required", "human_gate_required", "policy_gate", "breach_gate"]);
const GATE_DECISIONS = new Set<OrganismGateDecision>(["allow", "defer", "deny", "needs_human_gate"]);

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

export function validateOrganismGate(value: unknown): ContractValidationResult<OrganismGate> {
  const issues: ContractValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, code: "SCHEMA_INVALID", issues: [issue("$", "gate must be an object")] };
  }

  if (value.schema !== HARVEY_NERDKLE_GATE_SCHEMA) {
    issues.push(issue("schema", `schema must be ${HARVEY_NERDKLE_GATE_SCHEMA}`));
  }

  for (const key of ["gate_id", "packet_id", "reason", "next_safe_action"]) {
    if (!isNonEmptyString(value[key])) issues.push(issue(key, "required non-empty string"));
  }

  if (!isIsoTimestamp(value.evaluated_at)) issues.push(issue("evaluated_at", "required ISO timestamp"));

  if (!GATE_TIERS.has(value.tier as OrganismGateTier)) {
    issues.push(issue("tier", "required recognized gate tier"));
  }

  if (!GATE_DECISIONS.has(value.decision as OrganismGateDecision)) {
    issues.push(issue("decision", "required recognized gate decision"));
  }

  for (const key of ["allowed_actions", "denied_actions"]) {
    if (!isStringArray(value[key])) issues.push(issue(key, "required array of non-empty strings"));
  }

  if (typeof value.human_gate_required !== "boolean") {
    issues.push(issue("human_gate_required", "required boolean"));
  }

  if (value.receipt_required !== true) {
    issues.push(issue("receipt_required", "must be true"));
  }

  if (value.decision === "needs_human_gate" && value.human_gate_required !== true) {
    issues.push(issue("human_gate_required", "must be true when decision needs_human_gate"));
  }

  if (value.decision === "allow" && value.tier === "breach_gate") {
    issues.push(issue("decision", "breach_gate cannot allow mutation"));
  }

  if (issues.length > 0) return { ok: false, code: "SCHEMA_INVALID", issues };

  return { ok: true, value: value as OrganismGate };
}

