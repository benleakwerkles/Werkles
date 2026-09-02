export const HARVEY_NERDKLE_EVENT_SCHEMA = "harvey_nerdkle_event_v0" as const;

export const ORGANISM_EVENT_TYPES = [
  "packet_dispatched",
  "packet_delivered",
  "packet_receipted",
  "file_created",
  "file_changed",
  "gate_required",
  "breach_denied",
] as const;

export type OrganismEventType = (typeof ORGANISM_EVENT_TYPES)[number];

export type OrganismEvent = {
  schema: typeof HARVEY_NERDKLE_EVENT_SCHEMA;
  event_id: string;
  timestamp: string;
  event_type: OrganismEventType;
  source_path: string;
  sha256: string;
  packet_id: string | null;
  receipt_id: string | null;
  detected_by: string;
  destination_guess: string;
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

const EVENT_TYPE_SET = new Set<string>(ORGANISM_EVENT_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function issue(path: string, message: string): ContractValidationIssue {
  return { path, message };
}

export function validateOrganismEvent(value: unknown): ContractValidationResult<OrganismEvent> {
  const issues: ContractValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, code: "SCHEMA_INVALID", issues: [issue("$", "event must be an object")] };
  }

  if (value.schema !== HARVEY_NERDKLE_EVENT_SCHEMA) {
    issues.push(issue("schema", `schema must be ${HARVEY_NERDKLE_EVENT_SCHEMA}`));
  }

  for (const key of ["event_id", "source_path", "sha256", "detected_by", "destination_guess"]) {
    if (!isNonEmptyString(value[key])) issues.push(issue(key, "required non-empty string"));
  }

  if (!isIsoTimestamp(value.timestamp)) issues.push(issue("timestamp", "required ISO timestamp"));

  if (!isNonEmptyString(value.event_type) || !EVENT_TYPE_SET.has(value.event_type)) {
    issues.push(issue("event_type", `required event type: ${ORGANISM_EVENT_TYPES.join(", ")}`));
  }

  if (!isNullableString(value.packet_id)) issues.push(issue("packet_id", "must be non-empty string or null"));
  if (!isNullableString(value.receipt_id)) issues.push(issue("receipt_id", "must be non-empty string or null"));

  if (value.event_type === "packet_receipted" && !isNonEmptyString(value.receipt_id)) {
    issues.push(issue("receipt_id", "packet_receipted events require receipt_id"));
  }

  if (value.event_type?.toString().startsWith("packet_") && !isNonEmptyString(value.packet_id)) {
    issues.push(issue("packet_id", `${String(value.event_type)} events require packet_id`));
  }

  if (issues.length > 0) return { ok: false, code: "SCHEMA_INVALID", issues };

  return { ok: true, value: value as OrganismEvent };
}

export function eventJoinsPacketAndReceipt(event: OrganismEvent): boolean {
  return Boolean(event.packet_id && event.receipt_id);
}

