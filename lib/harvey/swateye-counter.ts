type HarveySwateyesPermissionRequest = {
  schema?: string;
  request_id?: string;
  requested_at?: string;
  machine?: string;
  project_id?: string;
  action?: string;
  platform_permission_prompt?: boolean;
  requires_secret?: boolean;
  requires_provider_sign_in?: boolean;
  recurring_operation?: boolean;
  paid_action?: boolean;
  push_or_merge?: boolean;
  deploy_or_publish?: boolean;
  production_mutation?: boolean;
  destructive_or_irreversible?: boolean;
};

export type HarveySwateyeAuthorityReceipt = {
  schema?: string;
  receipt_id?: string;
  status?: string;
  granted_by?: string;
  machine?: string;
  project_id?: string;
  allowed_actions?: string[];
  issued_at?: string;
  expires_at?: string;
  recurring_operation_authority?: boolean;
};

export type HarveySwateyeCounterEvent = {
  event_id?: string;
  created_at?: string;
  class?: "GREEN" | "BLUE" | "RED" | string;
  decision?: string;
  swat_kind?: string;
  summary?: string;
  receipt_path?: string | null;
  machine?: string;
  action?: string;
};

export type HarveySwateyeEventReceipt = {
  schema?: string;
  receipt_id?: string;
  event_id?: string;
  recorded_at?: string;
  event_at?: string;
  machine?: string;
  action?: string;
  decision?: string;
  swat_kind?: string;
  outcome?: string;
  intended_action_completed?: boolean;
  authority_receipt_id?: string;
  platform_prompt_was_human_gate?: boolean;
  true_human_gate_bypassed?: boolean;
  permission_request?: HarveySwateyesPermissionRequest;
};

export type HarveySwateyeCounterStream = {
  schema_version?: string;
  updated_at?: string;
  rule?: string;
  events?: HarveySwateyeCounterEvent[];
};

export type HarveySwateyeCounterProjection = {
  confirmed_swats: number;
  permissions_swatted: number;
  technical_blockers_bypassed: number;
  green: number;
  blue: number;
  red: number;
  latest: HarveySwateyeCounterEvent | null;
  truth: "ONLY_RECEIPT_BACKED_TERMINAL_SWATS_COUNT";
};

export function projectHarveySwateyeCounter(
  stream: HarveySwateyeCounterStream,
  receiptsByPath: Readonly<Record<string, HarveySwateyeEventReceipt>> = {},
  authorityReceipts: HarveySwateyeAuthorityReceipt[] = []
): HarveySwateyeCounterProjection {
  const events = Array.isArray(stream?.events) ? stream.events : [];
  const confirmed = events.filter((event) => {
    const decisionMatchesKind =
      (event.swat_kind === "INTERNAL_PERMISSION_PROMPT_CLEARED" && event.decision === "SWATTED_NON_HUMAN_GATE")
      || (event.swat_kind === "TECHNICAL_BLOCKER_BYPASSED" && event.decision === "BYPASSED_NON_HUMAN_BLOCKER");
    if (
      !decisionMatchesKind
      || (event.class !== "GREEN" && event.class !== "BLUE")
      || typeof event.event_id !== "string"
      || typeof event.receipt_path !== "string"
      || event.receipt_path.trim().length === 0
    ) return false;
    const receipt = receiptsByPath[event.receipt_path];
    const eventAt = Date.parse(String(event.created_at ?? ""));
    const receiptEventAt = Date.parse(String(receipt?.event_at ?? ""));
    const receiptRecordedAt = Date.parse(String(receipt?.recorded_at ?? ""));
    if (
      receipt?.schema !== "werkles.harvey-swateye-event-receipt/v1"
      || typeof receipt.receipt_id !== "string"
      || receipt.receipt_id.trim().length === 0
      || receipt.event_id !== event.event_id
      || receipt.decision !== event.decision
      || receipt.swat_kind !== event.swat_kind
      || receipt.machine !== event.machine
      || receipt.action !== event.action
      || receipt.event_at !== event.created_at
      || !Number.isFinite(eventAt)
      || !Number.isFinite(receiptEventAt)
      || !Number.isFinite(receiptRecordedAt)
      || receiptEventAt !== eventAt
      || receiptRecordedAt < receiptEventAt
      || receipt.outcome !== "TERMINAL_SUCCESS"
      || receipt.intended_action_completed !== true
      || receipt.platform_prompt_was_human_gate !== false
      || receipt.true_human_gate_bypassed !== false
      || typeof receipt.authority_receipt_id !== "string"
      || !receipt.permission_request
    ) return false;
    const request = receipt.permission_request;
    const requestedAt = Date.parse(String(request.requested_at ?? ""));
    const safeAction = new Set([
      "READ_REPO",
      "WRITE_SCOPED_FILE",
      "RUN_LOCAL_TEST",
      "RUN_LOCAL_TYPECHECK",
      "RUN_LOCAL_BUILD"
    ]).has(String(request.action ?? ""));
    const trueGateAsserted = [
      request.requires_secret,
      request.requires_provider_sign_in,
      request.recurring_operation,
      request.paid_action,
      request.push_or_merge,
      request.deploy_or_publish,
      request.production_mutation,
      request.destructive_or_irreversible
    ].some((value) => value !== false);
    if (
      request.schema !== "werkles.harvey-swateyes-permission-request/v1"
      || !safeAction
      || trueGateAsserted
      || !Number.isFinite(requestedAt)
      || request.machine !== event.machine
      || request.action !== event.action
      || requestedAt !== eventAt
      || (event.swat_kind === "INTERNAL_PERMISSION_PROMPT_CLEARED" && request.platform_permission_prompt !== true)
      || (event.swat_kind === "TECHNICAL_BLOCKER_BYPASSED" && request.platform_permission_prompt !== false)
    ) return false;
    return authorityReceipts.some((authority) => {
      const issuedAt = Date.parse(String(authority.issued_at ?? ""));
      const expiresAt = Date.parse(String(authority.expires_at ?? ""));
      return authority.schema === "werkles.harvey-swateyes-authority-receipt/v1"
        && authority.receipt_id === receipt.authority_receipt_id
        && authority.status === "APPROVED"
        && authority.granted_by === "BEN_OPERATOR"
        && authority.machine === request.machine
        && authority.project_id === request.project_id
        && Array.isArray(authority.allowed_actions)
        && authority.allowed_actions.includes(String(request.action))
        && authority.recurring_operation_authority === false
        && Number.isFinite(issuedAt)
        && Number.isFinite(expiresAt)
        && issuedAt < expiresAt
        && requestedAt >= issuedAt
        && requestedAt <= expiresAt;
    });
  }).filter((event, index, all) =>
    all.findIndex((candidate) =>
      candidate.event_id === event.event_id
      || candidate.receipt_path === event.receipt_path
      || receiptsByPath[String(candidate.receipt_path ?? "")]?.receipt_id
        === receiptsByPath[String(event.receipt_path ?? "")]?.receipt_id
    ) === index
  ).sort((left, right) =>
    Date.parse(String(right.created_at ?? "")) - Date.parse(String(left.created_at ?? ""))
  );
  const countClass = (value: string) => confirmed.filter((event) => event.class === value).length;
  return {
    confirmed_swats: confirmed.length,
    permissions_swatted: confirmed.filter((event) => event.swat_kind === "INTERNAL_PERMISSION_PROMPT_CLEARED").length,
    technical_blockers_bypassed: confirmed.filter((event) => event.swat_kind === "TECHNICAL_BLOCKER_BYPASSED").length,
    green: countClass("GREEN"),
    blue: countClass("BLUE"),
    red: countClass("RED"),
    latest: confirmed[0] ?? null,
    truth: "ONLY_RECEIPT_BACKED_TERMINAL_SWATS_COUNT"
  };
}
