export const HARVEY_NERDKLE_BOOT_CONTEXT_SCHEMA = "harvey_nerdkle_boot_context_v0" as const;

export type BootWorldStateStatus = "fresh" | "stale" | "missing";

export type OrganismBootContext = {
  schema: typeof HARVEY_NERDKLE_BOOT_CONTEXT_SCHEMA;
  generated_at: string;
  aeye: string;
  machine: string;
  source_truth_pointer: string;
  doctrine_paths: string[];
  frontier_paths: string[];
  local_readback_path: string;
  world_state_path: string;
  world_state_status: BootWorldStateStatus;
  active_packet_ids: string[];
  recent_receipt_ids: string[];
  speaker_bootpack_path: string;
  forbidden_actions: string[];
  human_gates: string[];
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

const WORLD_STATE_STATUSES = new Set<BootWorldStateStatus>(["fresh", "stale", "missing"]);

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

export function validateOrganismBootContext(value: unknown): ContractValidationResult<OrganismBootContext> {
  const issues: ContractValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, code: "SCHEMA_INVALID", issues: [issue("$", "boot context must be an object")] };
  }

  if (value.schema !== HARVEY_NERDKLE_BOOT_CONTEXT_SCHEMA) {
    issues.push(issue("schema", `schema must be ${HARVEY_NERDKLE_BOOT_CONTEXT_SCHEMA}`));
  }

  for (const key of [
    "aeye",
    "machine",
    "source_truth_pointer",
    "local_readback_path",
    "world_state_path",
    "speaker_bootpack_path",
  ]) {
    if (!isNonEmptyString(value[key])) issues.push(issue(key, "required non-empty string"));
  }

  if (!isIsoTimestamp(value.generated_at)) issues.push(issue("generated_at", "required ISO timestamp"));

  for (const key of [
    "doctrine_paths",
    "frontier_paths",
    "active_packet_ids",
    "recent_receipt_ids",
    "forbidden_actions",
    "human_gates",
  ]) {
    if (!isStringArray(value[key])) issues.push(issue(key, "required array of non-empty strings"));
  }

  if (!WORLD_STATE_STATUSES.has(value.world_state_status as BootWorldStateStatus)) {
    issues.push(issue("world_state_status", "required fresh, stale, or missing"));
  }

  if (Array.isArray(value.doctrine_paths) && value.doctrine_paths.length === 0) {
    issues.push(issue("doctrine_paths", "at least one doctrine path is required"));
  }

  if (Array.isArray(value.frontier_paths) && value.frontier_paths.length === 0) {
    issues.push(issue("frontier_paths", "at least one frontier path is required"));
  }

  if (issues.length > 0) return { ok: false, code: "SCHEMA_INVALID", issues };

  return { ok: true, value: value as OrganismBootContext };
}

export function isBootContextUsable(context: OrganismBootContext): boolean {
  return context.world_state_status === "fresh";
}

