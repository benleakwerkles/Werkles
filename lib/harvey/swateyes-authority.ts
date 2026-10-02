export type HarveySwateyesDecision =
  | "ALLOW_ALREADY_GRANTED_ACTION"
  | "DENY_MISSING_OR_MISMATCHED_AUTHORITY"
  | "HUMAN_GATE";

export type HarveySwateyesPlatform = "CODEX_INTERNAL" | "CURSOR_INTERNAL";

export type HarveySwateyesAuthorityReceipt = {
  schema: "werkles.harvey-swateyes-authority-receipt/v1";
  receipt_id: string;
  status: "APPROVED" | "REVOKED";
  granted_by: "BEN_OPERATOR";
  machine: string;
  project_id: string;
  allowed_actions: string[];
  allowed_operations: HarveySwateyesOperationGrant[];
  issued_at: string;
  expires_at: string;
  recurring_operation_authority: boolean;
};

export type HarveySwateyesOperationGrant = {
  operation_id: string;
  platform: HarveySwateyesPlatform;
  task_thread_id: string;
  action: string;
  executable_sha256: string;
  arguments_sha256: string;
  cwd: string;
  target_paths: string[];
  maximum_uses: 1;
};

export type HarveySwateyesPromptEvidence = {
  schema: "werkles.harvey-swateyes-prompt-evidence/v1";
  prompt_id: string;
  observed_at: string;
  platform: HarveySwateyesPlatform;
  task_thread_id: string;
  machine: string;
  project_id: string;
  action: string;
  executable_sha256: string;
  arguments_sha256: string;
  cwd: string;
  target_paths: string[];
  one_use_nonce: string;
};

export type HarveySwateyesPromptPolicyDecision = {
  schema: "werkles.harvey-swateyes-prompt-policy-decision/v1";
  prompt_id: string;
  state: "POLICY_ELIGIBLE_NOT_EXECUTABLE" | "DENIED";
  reason_codes: string[];
  authority: HarveySwateyesAuthorityDecision;
  execution_authorized: false;
};

export type HarveySwateyesPermissionRequest = {
  schema: "werkles.harvey-swateyes-permission-request/v1";
  request_id: string;
  requested_at: string;
  machine: string;
  project_id: string;
  action: string;
  platform_permission_prompt: boolean;
  requires_secret: boolean;
  requires_provider_sign_in: boolean;
  recurring_operation: boolean;
  paid_action: boolean;
  push_or_merge: boolean;
  deploy_or_publish: boolean;
  production_mutation: boolean;
  destructive_or_irreversible: boolean;
};

export type HarveySwateyesAuthorityDecision = {
  schema: "werkles.harvey-swateyes-authority-decision/v1";
  policy_id: "HARVEY_SWATEYES_ALREADY_GRANTED_AUTHORITY_V1";
  request_id: string;
  receipt_id: string | null;
  decision: HarveySwateyesDecision;
  reason_codes: string[];
  platform_prompt_was_human_gate: boolean;
};

export const HARVEY_OVERNIGHT_SWATEYES_RECEIPT_ID =
  "approval.harvey-overnight.doss.20260729";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const SCOPE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ACTION = /^[A-Z][A-Z0-9_]{2,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NONCE = /^[a-f0-9]{32}$/;
const TASK_THREAD_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:\\[^<>:"|?*\u0000-\u001f]+$/;
const RELATIVE_TARGET_PATH = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_. -]+(?:\/[A-Za-z0-9_. -]+)*$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
const REQUEST_CLOCK_SKEW_MS = 5 * 60 * 1000;
const SAFE_BOUND_ACTIONS = new Set([
  "READ_REPO",
  "WRITE_SCOPED_FILE",
  "RUN_LOCAL_TEST",
  "RUN_LOCAL_TYPECHECK",
  "RUN_LOCAL_BUILD"
]);
const REQUEST_KEYS = [
  "action",
  "deploy_or_publish",
  "destructive_or_irreversible",
  "machine",
  "paid_action",
  "platform_permission_prompt",
  "production_mutation",
  "project_id",
  "push_or_merge",
  "recurring_operation",
  "request_id",
  "requested_at",
  "requires_provider_sign_in",
  "requires_secret",
  "schema"
].sort();
const RECEIPT_KEYS = [
  "allowed_actions",
  "expires_at",
  "granted_by",
  "issued_at",
  "machine",
  "project_id",
  "receipt_id",
  "allowed_operations",
  "recurring_operation_authority",
  "schema",
  "status"
].sort();
const OPERATION_KEYS = [
  "action",
  "arguments_sha256",
  "cwd",
  "executable_sha256",
  "maximum_uses",
  "operation_id",
  "platform",
  "target_paths",
  "task_thread_id"
].sort();
const PROMPT_KEYS = [
  "action",
  "arguments_sha256",
  "cwd",
  "executable_sha256",
  "machine",
  "observed_at",
  "one_use_nonce",
  "platform",
  "project_id",
  "prompt_id",
  "schema",
  "target_paths",
  "task_thread_id"
].sort();
const REQUEST_BOOLEAN_KEYS = [
  "platform_permission_prompt",
  "requires_secret",
  "requires_provider_sign_in",
  "recurring_operation",
  "paid_action",
  "push_or_merge",
  "deploy_or_publish",
  "production_mutation",
  "destructive_or_irreversible"
] as const;

function isCanonicalWindowsAbsolutePath(value: string) {
  if (!WINDOWS_ABSOLUTE_PATH.test(value) || value.includes("/")) return false;
  const segments = value.slice(3).split("\\");
  return segments.length > 0 && segments.every((segment) =>
    segment.length > 0
    && segment !== "."
    && segment !== ".."
    && !segment.endsWith(".")
    && !segment.endsWith(" ")
  );
}

const OVERNIGHT_APPROVAL_LOG_PROOFS = [
  "| 2026-07-29T06:14:00-04:00 | Harvey overnight 20-minute build cycle |",
  "APPROVED — 20-MINUTE CODEX HEARTBEAT; 24 WAKES / 8 HOURS;",
  "`[IN PROGRESS: HARVEY_OVERNIGHT_20_MINUTE_BUILD]`"
] as const;
const OVERNIGHT_GATE_PROOFS = [
  "Status: `APPROVED_FOR_BOUNDED_ACTIVATION`",
  "Machine and environment: `Doss`, `CODEX_LOCAL`",
  "at most 24 scheduled wakes over eight hours",
  "No push, merge, deploy, provider sign-in, secrets, production mutation,"
] as const;

export function compileHarveyOvernightSwateyesReceipt(
  approvalLog: string,
  gateContract: string
): HarveySwateyesAuthorityReceipt | null {
  if (
    typeof approvalLog !== "string"
    || typeof gateContract !== "string"
    || !OVERNIGHT_APPROVAL_LOG_PROOFS.every((proof) => approvalLog.includes(proof))
    || !OVERNIGHT_GATE_PROOFS.every((proof) => gateContract.includes(proof))
  ) return null;
  return {
    schema: "werkles.harvey-swateyes-authority-receipt/v1",
    receipt_id: HARVEY_OVERNIGHT_SWATEYES_RECEIPT_ID,
    status: "APPROVED",
    granted_by: "BEN_OPERATOR",
    machine: "Doss",
    project_id: "harvey",
    allowed_actions: [
      "READ_REPO",
      "WRITE_SCOPED_FILE",
      "RUN_LOCAL_TEST",
      "RUN_LOCAL_TYPECHECK",
      "RUN_LOCAL_BUILD"
    ],
    allowed_operations: [],
    issued_at: "2026-07-29T06:14:00-04:00",
    expires_at: "2026-07-29T14:14:00-04:00",
    recurring_operation_authority: false
  };
}


function validateTargetPaths(targetPaths: string[], code: string) {
  if (
    !Array.isArray(targetPaths)
    || targetPaths.length > 64
    || targetPaths.some((target) =>
      typeof target !== "string"
      || !RELATIVE_TARGET_PATH.test(target)
      || target.includes("\\")
    )
    || new Set(targetPaths).size !== targetPaths.length
  ) throw new Error(code);
}

function validateOperationGrant(operation: HarveySwateyesOperationGrant) {
  if (!operation || typeof operation !== "object" || Array.isArray(operation)) {
    throw new Error("SWATEYES_OPERATION_GRANT_INVALID");
  }
  if (Object.keys(operation).sort().join("|") !== OPERATION_KEYS.join("|")) {
    throw new Error("SWATEYES_OPERATION_GRANT_KEYS_INVALID");
  }
  if (
    typeof operation.operation_id !== "string"
    || !ID.test(operation.operation_id)
    || !["CODEX_INTERNAL", "CURSOR_INTERNAL"].includes(operation.platform)
    || typeof operation.task_thread_id !== "string"
    || !TASK_THREAD_ID.test(operation.task_thread_id)
    || typeof operation.action !== "string"
    || !SAFE_BOUND_ACTIONS.has(operation.action)
    || typeof operation.executable_sha256 !== "string"
    || !SHA256.test(operation.executable_sha256)
    || typeof operation.arguments_sha256 !== "string"
    || !SHA256.test(operation.arguments_sha256)
    || typeof operation.cwd !== "string"
    || !isCanonicalWindowsAbsolutePath(operation.cwd)
    || operation.maximum_uses !== 1
  ) throw new Error("SWATEYES_OPERATION_GRANT_INVALID");
  validateTargetPaths(operation.target_paths, "SWATEYES_OPERATION_GRANT_TARGETS_INVALID");
}

function validatePromptEvidence(
  evidence: HarveySwateyesPromptEvidence,
  evaluatedAt: number
) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("SWATEYES_PROMPT_EVIDENCE_INVALID");
  }
  if (Object.keys(evidence).sort().join("|") !== PROMPT_KEYS.join("|")) {
    throw new Error("SWATEYES_PROMPT_EVIDENCE_KEYS_INVALID");
  }
  const observedAt = instant(
    evidence.observed_at,
    "SWATEYES_PROMPT_EVIDENCE_TIME_INVALID"
  );
  if (
    evidence.schema !== "werkles.harvey-swateyes-prompt-evidence/v1"
    || typeof evidence.prompt_id !== "string"
    || !ID.test(evidence.prompt_id)
    || !["CODEX_INTERNAL", "CURSOR_INTERNAL"].includes(evidence.platform)
    || typeof evidence.task_thread_id !== "string"
    || !TASK_THREAD_ID.test(evidence.task_thread_id)
    || typeof evidence.machine !== "string"
    || !SCOPE.test(evidence.machine)
    || typeof evidence.project_id !== "string"
    || !SCOPE.test(evidence.project_id)
    || typeof evidence.action !== "string"
    || !SAFE_BOUND_ACTIONS.has(evidence.action)
    || typeof evidence.executable_sha256 !== "string"
    || !SHA256.test(evidence.executable_sha256)
    || typeof evidence.arguments_sha256 !== "string"
    || !SHA256.test(evidence.arguments_sha256)
    || typeof evidence.cwd !== "string"
    || !isCanonicalWindowsAbsolutePath(evidence.cwd)
    || typeof evidence.one_use_nonce !== "string"
    || !NONCE.test(evidence.one_use_nonce)
    || Math.abs(observedAt - evaluatedAt) > REQUEST_CLOCK_SKEW_MS
  ) throw new Error("SWATEYES_PROMPT_EVIDENCE_INVALID");
  validateTargetPaths(evidence.target_paths, "SWATEYES_PROMPT_EVIDENCE_TARGETS_INVALID");
}

function instant(value: string, code: string) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) throw new Error(code);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(code);
  return parsed;
}

function validateRequest(request: HarveySwateyesPermissionRequest) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("SWATEYES_REQUEST_INVALID");
  }
  if (Object.keys(request).sort().join("|") !== REQUEST_KEYS.join("|")) {
    throw new Error("SWATEYES_REQUEST_KEYS_INVALID");
  }
  if (request.schema !== "werkles.harvey-swateyes-permission-request/v1") {
    throw new Error("SWATEYES_REQUEST_SCHEMA_INVALID");
  }
  if (
    typeof request.request_id !== "string"
    || !ID.test(request.request_id)
    || typeof request.machine !== "string"
    || !SCOPE.test(request.machine)
    || typeof request.project_id !== "string"
    || !SCOPE.test(request.project_id)
    || typeof request.action !== "string"
    || !ACTION.test(request.action)
    || REQUEST_BOOLEAN_KEYS.some((key) => typeof request[key] !== "boolean")
  ) {
    throw new Error("SWATEYES_REQUEST_INVALID");
  }
  return instant(request.requested_at, "SWATEYES_REQUEST_TIME_INVALID");
}

function validateReceipt(receipt: HarveySwateyesAuthorityReceipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    throw new Error("SWATEYES_RECEIPT_INVALID");
  }
  if (Object.keys(receipt).sort().join("|") !== RECEIPT_KEYS.join("|")) {
    throw new Error("SWATEYES_RECEIPT_KEYS_INVALID");
  }
  if (receipt.schema !== "werkles.harvey-swateyes-authority-receipt/v1") {
    throw new Error("SWATEYES_RECEIPT_SCHEMA_INVALID");
  }
  if (
    typeof receipt.receipt_id !== "string"
    || !ID.test(receipt.receipt_id)
    || (receipt.status !== "APPROVED" && receipt.status !== "REVOKED")
    || receipt.granted_by !== "BEN_OPERATOR"
    || typeof receipt.machine !== "string"
    || !SCOPE.test(receipt.machine)
    || typeof receipt.project_id !== "string"
    || !SCOPE.test(receipt.project_id)
    || !Array.isArray(receipt.allowed_actions)
    || receipt.allowed_actions.length === 0
    || receipt.allowed_actions.length > 64
    || receipt.allowed_actions.some((action) => typeof action !== "string" || !ACTION.test(action))
    || new Set(receipt.allowed_actions).size !== receipt.allowed_actions.length
    || !Array.isArray(receipt.allowed_operations)
    || receipt.allowed_operations.length > 64
    || typeof receipt.recurring_operation_authority !== "boolean"
  ) {
    throw new Error("SWATEYES_RECEIPT_INVALID");
  }
  const operationIds = new Set<string>();
  for (const operation of receipt.allowed_operations) {
    validateOperationGrant(operation);
    if (
      !receipt.allowed_actions.includes(operation.action)
      || operationIds.has(operation.operation_id)
    ) throw new Error("SWATEYES_RECEIPT_OPERATION_INVALID");
    operationIds.add(operation.operation_id);
  }
  const issued = instant(receipt.issued_at, "SWATEYES_RECEIPT_ISSUED_TIME_INVALID");
  const expires = instant(receipt.expires_at, "SWATEYES_RECEIPT_EXPIRY_TIME_INVALID");
  if (issued >= expires) throw new Error("SWATEYES_RECEIPT_WINDOW_INVALID");
  return { issued, expires };
}

function trueHumanGateReasons(request: HarveySwateyesPermissionRequest) {
  return [
    ...(!SAFE_BOUND_ACTIONS.has(request.action)
      ? ["UNKNOWN_OR_UNBOUND_ACTION_REQUIRES_HUMAN_REVIEW"]
      : []),
    ...(request.requires_secret ? ["SECRET_REQUIRED"] : []),
    ...(request.requires_provider_sign_in ? ["PROVIDER_SIGN_IN_REQUIRED"] : []),
    ...(request.recurring_operation ? ["RECURRING_OPERATION_REQUIRES_EXACT_APPROVAL"] : []),
    ...(request.paid_action ? ["SPEND_REQUIRES_APPROVAL"] : []),
    ...(request.push_or_merge ? ["PUSH_OR_MERGE_REQUIRES_APPROVAL"] : []),
    ...(request.deploy_or_publish ? ["DEPLOY_OR_PUBLISH_REQUIRES_APPROVAL"] : []),
    ...(request.production_mutation ? ["PRODUCTION_MUTATION_REQUIRES_APPROVAL"] : []),
    ...(request.destructive_or_irreversible ? ["DESTRUCTIVE_OR_IRREVERSIBLE_ACTION"] : [])
  ];
}

export function decideHarveySwateyesAuthority(
  request: HarveySwateyesPermissionRequest,
  receipts: HarveySwateyesAuthorityReceipt[],
  evaluatorNow: string | Date = new Date()
): HarveySwateyesAuthorityDecision {
  const requestedAt = validateRequest(request);
  const humanGateReasons = trueHumanGateReasons(request);
  if (humanGateReasons.length > 0) {
    return {
      schema: "werkles.harvey-swateyes-authority-decision/v1",
      policy_id: "HARVEY_SWATEYES_ALREADY_GRANTED_AUTHORITY_V1",
      request_id: request.request_id,
      receipt_id: null,
      decision: "HUMAN_GATE",
      reason_codes: humanGateReasons,
      platform_prompt_was_human_gate: true
    };
  }
  const evaluatedAt = evaluatorNow instanceof Date
    ? evaluatorNow.getTime()
    : instant(evaluatorNow, "SWATEYES_EVALUATOR_TIME_INVALID");
  if (!Number.isFinite(evaluatedAt)) {
    throw new Error("SWATEYES_EVALUATOR_TIME_INVALID");
  }
  if (Math.abs(requestedAt - evaluatedAt) > REQUEST_CLOCK_SKEW_MS) {
    return {
      schema: "werkles.harvey-swateyes-authority-decision/v1",
      policy_id: "HARVEY_SWATEYES_ALREADY_GRANTED_AUTHORITY_V1",
      request_id: request.request_id,
      receipt_id: null,
      decision: "DENY_MISSING_OR_MISMATCHED_AUTHORITY",
      reason_codes: ["REQUEST_TIME_OUTSIDE_TRUSTED_EVALUATOR_WINDOW"],
      platform_prompt_was_human_gate: false
    };
  }

  if (!Array.isArray(receipts) || receipts.length > 64) {
    throw new Error("SWATEYES_RECEIPTS_INVALID");
  }
  const receiptIds = new Set<string>();
  const validatedReceipts = receipts.map((receipt) => {
    const window = validateReceipt(receipt);
    if (receiptIds.has(receipt.receipt_id)) {
      throw new Error("SWATEYES_RECEIPT_ID_DUPLICATE");
    }
    receiptIds.add(receipt.receipt_id);
    return { receipt, window };
  });
  const matchingReceipt = validatedReceipts
    .filter(({ receipt, window }) => receipt.status === "APPROVED"
      && receipt.machine === request.machine
      && receipt.project_id === request.project_id
      && receipt.allowed_actions.includes(request.action)
      && requestedAt >= window.issued
      && requestedAt <= window.expires
      && !receipt.recurring_operation_authority)
    .sort((left, right) =>
      right.window.issued - left.window.issued
      || left.receipt.receipt_id.localeCompare(right.receipt.receipt_id)
    )[0]?.receipt;
  const matchingRevocation = validatedReceipts.some(({ receipt, window }) =>
    receipt.status === "REVOKED"
    && receipt.machine === request.machine
    && receipt.project_id === request.project_id
    && receipt.allowed_actions.includes(request.action)
    && window.issued <= evaluatedAt
  );

  if (!matchingReceipt || matchingRevocation) {
    return {
      schema: "werkles.harvey-swateyes-authority-decision/v1",
      policy_id: "HARVEY_SWATEYES_ALREADY_GRANTED_AUTHORITY_V1",
      request_id: request.request_id,
      receipt_id: null,
      decision: "DENY_MISSING_OR_MISMATCHED_AUTHORITY",
      reason_codes: matchingRevocation
        ? ["MATCHING_AUTHORITY_REVOKED"]
        : ["EXACT_ACTIVE_AUTHORITY_RECEIPT_NOT_FOUND"],
      platform_prompt_was_human_gate: false
    };
  }

  return {
    schema: "werkles.harvey-swateyes-authority-decision/v1",
    policy_id: "HARVEY_SWATEYES_ALREADY_GRANTED_AUTHORITY_V1",
    request_id: request.request_id,
    receipt_id: matchingReceipt.receipt_id,
    decision: "ALLOW_ALREADY_GRANTED_ACTION",
    reason_codes: request.platform_permission_prompt
      ? ["AUTHORITY_ALREADY_GRANTED", "INTERNAL_PLATFORM_PROMPT_IS_NOT_A_HUMAN_GATE"]
      : ["AUTHORITY_ALREADY_GRANTED"],
    platform_prompt_was_human_gate: false
  };
}

export function bindHarveySwateyesPromptPolicy(
  request: HarveySwateyesPermissionRequest,
  receipts: HarveySwateyesAuthorityReceipt[],
  evidence: HarveySwateyesPromptEvidence,
  consumedPromptTokens: ReadonlySet<string>,
  evaluatorNow: string | Date = new Date()
): HarveySwateyesPromptPolicyDecision {
  const evaluatedAt = evaluatorNow instanceof Date
    ? evaluatorNow.getTime()
    : instant(evaluatorNow, "SWATEYES_EVALUATOR_TIME_INVALID");
  if (!Number.isFinite(evaluatedAt)) {
    throw new Error("SWATEYES_EVALUATOR_TIME_INVALID");
  }
  validatePromptEvidence(evidence, evaluatedAt);
  const authority = decideHarveySwateyesAuthority(
    request,
    receipts,
    evaluatorNow
  );
  const reasons: string[] = [];
  if (authority.decision !== "ALLOW_ALREADY_GRANTED_ACTION") {
    reasons.push("AUTHORITY_DECISION_NOT_ALLOW");
  }
  if (!request.platform_permission_prompt) {
    reasons.push("NO_CODEX_INTERNAL_PROMPT_ASSERTED");
  }
  if (
    evidence.machine !== request.machine
    || evidence.project_id !== request.project_id
    || evidence.action !== request.action
  ) reasons.push("PROMPT_REQUEST_SCOPE_MISMATCH");
  if (
    consumedPromptTokens.has(evidence.prompt_id)
    || consumedPromptTokens.has(evidence.one_use_nonce)
  ) reasons.push("PROMPT_REPLAY_DETECTED");

  const receipt = receipts.find((candidate) =>
    candidate.receipt_id === authority.receipt_id
  );
  const operation = receipt?.allowed_operations.find((candidate) =>
    candidate.platform === evidence.platform
    && candidate.task_thread_id === evidence.task_thread_id
    && candidate.action === evidence.action
    && candidate.executable_sha256 === evidence.executable_sha256
    && candidate.arguments_sha256 === evidence.arguments_sha256
    && candidate.cwd === evidence.cwd
    && candidate.target_paths.length === evidence.target_paths.length
    && candidate.target_paths.every((target, index) =>
      target === evidence.target_paths[index]
    )
    && candidate.maximum_uses === 1
  );
  if (!operation) reasons.push("EXACT_OPERATION_GRANT_NOT_FOUND");

  if (reasons.length > 0) {
    return {
      schema: "werkles.harvey-swateyes-prompt-policy-decision/v1",
      prompt_id: evidence.prompt_id,
      state: "DENIED",
      reason_codes: reasons,
      authority,
      execution_authorized: false
    };
  }
  return {
    schema: "werkles.harvey-swateyes-prompt-policy-decision/v1",
    prompt_id: evidence.prompt_id,
    state: "POLICY_ELIGIBLE_NOT_EXECUTABLE",
    reason_codes: ["POLICY_ONLY_EXECUTION_ADAPTER_NOT_CONNECTED"],
    authority,
    execution_authorized: false
  };
}
