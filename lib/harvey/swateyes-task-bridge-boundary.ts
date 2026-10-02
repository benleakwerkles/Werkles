import { createHash } from "node:crypto";

import {
  readHarveyHeldPromptRegistration,
  type HarveyHeldPromptRegistration,
} from "./held-prompt-registration.ts";
import {
  bindHarveySwateyesPromptPolicy,
  type HarveySwateyesAuthorityReceipt,
  type HarveySwateyesPromptEvidence,
} from "./swateyes-authority.ts";
import {
  classifyHarveySwateyesBackgroundInput,
  type HarveySwateyesBackgroundInputRequest,
} from "./swateyes-background-input.ts";

type TaskBridgeBindingProjection = {
  binding_id: string;
  provider: "Codex";
  host_id: string;
  thread_id: string;
  machine: string;
  physical_hostname: string;
  project_id: string;
  work_id: string;
  state: "BOUND_PROVEN" | "PREPARED_NOT_ACTIVATED" | "REVOKED";
  revoked_at: string | null;
  route_mode: "REAL_PROVEN" | "FIXTURE_TEST_ONLY" | "UNBOUND";
  carrier_mode: "REAL_PROVEN" | "FIXTURE_TEST_ONLY" | "UNBOUND";
  authority: "THREAD_REPLY_ONLY";
  capabilities: string[];
  binding_fingerprint_sha256: string;
  host_match: boolean;
  eligible: boolean;
  blocker: string | null;
};

export type HarveySwateyesTaskBridgeProjection = {
  schema: "werkles.harvey-task-bridge/v1";
  execution_policy: {
    allowed_action_class: "THREAD_REPLY_ONLY";
    real_provider_activation: "AUTHORIZED" | "NOT_AUTHORIZED";
    idle_polling: "FORBIDDEN";
    external_side_effects: "THREAD_REPLY_ONLY_AUTHORIZED" | "FORBIDDEN";
  };
  bindings: TaskBridgeBindingProjection[];
};

export type HarveySwateyesTaskBridgeBackgroundInput = Omit<
  HarveySwateyesBackgroundInputRequest,
  "permission_fingerprint_sha256"
>;

const SHA256 = /^[a-f0-9]{64}$/;
const BINDING_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function promptEvidence(registration: HarveyHeldPromptRegistration): HarveySwateyesPromptEvidence {
  const event = registration.source_event;
  return {
    schema: "werkles.harvey-swateyes-prompt-evidence/v1",
    prompt_id: event.prompt_id,
    observed_at: event.observed_at,
    platform: event.provider === "Codex" ? "CODEX_INTERNAL" : "CURSOR_INTERNAL",
    task_thread_id: event.task_thread_id,
    machine: event.machine,
    project_id: event.project_id,
    action: event.action,
    executable_sha256: event.executable_sha256,
    arguments_sha256: event.arguments_sha256,
    cwd: event.cwd,
    target_paths: [...event.target_paths],
    one_use_nonce: event.one_use_nonce,
  };
}

function continuationBody(registration: HarveyHeldPromptRegistration) {
  const event = registration.source_event;
  return [
    `SWATEYES ONE-SHOT THREAD TURN - ${event.prompt_id}`,
    `Continue only the already-authorized ${event.action} operation described by the durable held-prompt evidence.`,
    `Exact task: ${event.task_thread_id}`,
    `Scoped targets: ${event.target_paths.length ? event.target_paths.join(", ") : "NONE"}`,
    "This is a new provider task-thread turn. It does not approve a provider-internal UI prompt or prove that a held command resumed.",
    "Do not cross any secret, sign-in, spend, push/merge, deploy/publish, production-mutation, destructive, or recurring-operation gate.",
  ].join("\n");
}

export async function prepareHarveySwateyesTaskBridgeBoundary({
  registrationId,
  authorityReceipts,
  taskBridge,
  backgroundInput,
  bootRevision,
  repositoryRoot = process.cwd(),
  evaluatorNow = new Date(),
}: {
  registrationId: string;
  authorityReceipts: HarveySwateyesAuthorityReceipt[];
  taskBridge: HarveySwateyesTaskBridgeProjection;
  backgroundInput: HarveySwateyesTaskBridgeBackgroundInput;
  bootRevision: string;
  repositoryRoot?: string;
  evaluatorNow?: string | Date;
}) {
  const registration = await readHarveyHeldPromptRegistration(registrationId, repositoryRoot);
  const event = registration.source_event;
  const policy = bindHarveySwateyesPromptPolicy(
    registration.permission_request_claim,
    authorityReceipts,
    promptEvidence(registration),
    new Set(),
    evaluatorNow,
  );
  const permissionFingerprint = digest([
    registration.registration_id,
    event.prompt_id,
    registration.permission_request_claim.request_id,
    policy.authority.receipt_id ?? "NO_RECEIPT",
    event.host_id,
    event.task_thread_id,
    event.machine,
    event.project_id,
    event.action,
    event.executable_sha256,
    event.arguments_sha256,
  ].join("|"));
  const backgroundInputDecision = classifyHarveySwateyesBackgroundInput({
    ...(backgroundInput as HarveySwateyesTaskBridgeBackgroundInput),
    permission_fingerprint_sha256: permissionFingerprint,
  });
  const base = {
    schema: "werkles.harvey-swateyes-task-bridge-boundary/v1" as const,
    registration_id: registration.registration_id,
    prompt_id: event.prompt_id,
    execution_performed: false as const,
    one_use_consumed: false as const,
    effect_claim: "NO_EFFECT" as const,
    background_input_decision: backgroundInputDecision,
    task_bridge_input: null as null | {
      submission_id: string;
      binding_id: string;
      boot_revision: string;
      action_class: "THREAD_REPLY_ONLY";
      body: string;
    },
  };
  if (backgroundInputDecision.state !== "BACKGROUND_SAFE_CANDIDATE") {
    return {
      ...base,
      state: "BLOCKED" as const,
      blocker: "BACKGROUND_ONLY_INPUT_NOT_PROVEN" as const,
      reason_codes: [backgroundInputDecision.blocker ?? "BACKGROUND_ONLY_INPUT_NOT_PROVEN"],
    };
  }
  if (policy.state !== "POLICY_ELIGIBLE_NOT_EXECUTABLE") {
    return { ...base, state: "BLOCKED" as const, blocker: "EXACT_ACTIVE_OPERATION_AUTHORITY_NOT_PROVEN" as const, reason_codes: policy.reason_codes };
  }
  if (
    taskBridge?.schema !== "werkles.harvey-task-bridge/v1"
    || taskBridge.execution_policy?.allowed_action_class !== "THREAD_REPLY_ONLY"
    || taskBridge.execution_policy?.idle_polling !== "FORBIDDEN"
  ) {
    return { ...base, state: "BLOCKED" as const, blocker: "TASK_BRIDGE_PROJECTION_INVALID" as const, reason_codes: ["TASK_BRIDGE_PROJECTION_INVALID"] };
  }
  if (!Array.isArray(taskBridge.bindings)) {
    return { ...base, state: "BLOCKED" as const, blocker: "TASK_BRIDGE_PROJECTION_INVALID" as const, reason_codes: ["TASK_BRIDGE_PROJECTION_INVALID"] };
  }
  const binding = taskBridge.bindings.find((candidate) =>
    candidate.provider === "Codex"
    && event.provider === "Codex"
    && candidate.host_id === event.host_id
    && candidate.thread_id === event.task_thread_id
    && candidate.machine === event.machine
    && candidate.physical_hostname === event.physical_hostname
    && candidate.project_id === event.project_id
  );
  if (!binding) {
    return { ...base, state: "BLOCKED" as const, blocker: "EXACT_TASK_BRIDGE_BINDING_NOT_FOUND" as const, reason_codes: ["EXACT_TASK_BRIDGE_BINDING_NOT_FOUND"] };
  }
  if (
    !BINDING_ID.test(binding.binding_id)
    || binding.state !== "BOUND_PROVEN"
    || binding.revoked_at !== null
    || binding.route_mode !== "REAL_PROVEN"
    || binding.carrier_mode !== "REAL_PROVEN"
    || binding.authority !== "THREAD_REPLY_ONLY"
    || !binding.capabilities.includes("THREAD_REPLY_ONLY")
    || !SHA256.test(binding.binding_fingerprint_sha256)
    || !binding.host_match
  ) {
    return { ...base, state: "BLOCKED" as const, blocker: "TASK_BRIDGE_BINDING_NOT_PROVEN" as const, reason_codes: [binding.blocker ?? "TASK_BRIDGE_BINDING_NOT_PROVEN"] };
  }
  // Caller-supplied authority and bridge projections are useful for a bounded
  // policy preview, but they cannot activate a real provider turn. Activation
  // must load authenticated authority, live route/boot state, and a durable
  // one-use claim internally. Until that adapter exists this seam is inert,
  // even when every caller-provided field says AUTHORIZED.
  void bootRevision;
  void continuationBody;
  return {
    ...base,
    state: "BLOCKED" as const,
    blocker: "DURABLE_PROVENANCE_ADAPTER_REQUIRED" as const,
    reason_codes: [
      "CALLER_AUTHORITY_NOT_EXECUTION_PROOF",
      "CALLER_ROUTE_NOT_EXECUTION_PROOF",
      "DURABLE_ONE_USE_CLAIM_REQUIRED",
    ],
  };
}
