import { createHash } from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const OPAQUE_CREDENTIAL_HANDLE = /^cred_[a-f0-9]{32}$/;
const REQUEST_KEYS = [
  "captures_keyboard", "changes_foreground_window", "credential_handle",
  "credential_requirement", "delivery_channel", "exposes_secret_to_harvey",
  "injects_keystrokes", "moves_pointer", "permission_fingerprint_sha256",
  "uses_shared_clipboard",
].sort();
const CHANNELS = new Set([
  "PROVIDER_BACKGROUND_API", "OS_CREDENTIAL_BROKER",
  "PASSWORD_MANAGER_BROKER", "FOREGROUND_UI_AUTOMATION",
]);

export type HarveySwateyesBackgroundInputRequest = {
  permission_fingerprint_sha256: string;
  credential_requirement: "NONE" | "OPAQUE_BROKER_HANDLE";
  credential_handle: string | null;
  delivery_channel:
    | "PROVIDER_BACKGROUND_API"
    | "OS_CREDENTIAL_BROKER"
    | "PASSWORD_MANAGER_BROKER"
    | "FOREGROUND_UI_AUTOMATION";
  changes_foreground_window: boolean;
  moves_pointer: boolean;
  captures_keyboard: boolean;
  injects_keystrokes: boolean;
  uses_shared_clipboard: boolean;
  exposes_secret_to_harvey: boolean;
};

export type HarveySwateyesDecisionCapsule = {
  schema: "werkles.harvey-swateyes-decision-capsule/v1";
  policy_version: "swateyes-background-input/20260802.1";
  permission_fingerprint_sha256: string;
  // Stable numeric features are a candidate for compact mathematical memory.
  // No credential value, handle, account identity, or prompt text is included.
  features: readonly [number, number, number, number, number, number, number, number, number];
  decision_code: 0 | 1;
  capsule_sha256: string;
};

export type HarveySwateyesBackgroundInputDecision = {
  schema: "werkles.harvey-swateyes-background-input/v1";
  state: "BLOCKED" | "BACKGROUND_SAFE_CANDIDATE";
  blocker:
    | "INVALID_REQUEST"
    | "OPAQUE_CREDENTIAL_BROKER_REQUIRED"
    | "FOREGROUND_OR_INPUT_INTERFERENCE_FORBIDDEN"
    | "SECRET_EXPOSURE_FORBIDDEN"
    | null;
  execution_authorized: false;
  cursor_or_keyboard_touched: false;
  secret_loaded_by_harvey: false;
  credential_handle_returned: false;
  capsule: HarveySwateyesDecisionCapsule;
};

function capsule(
  request: HarveySwateyesBackgroundInputRequest,
  decisionCode: 0 | 1,
): HarveySwateyesDecisionCapsule {
  const channelCode = {
    PROVIDER_BACKGROUND_API: 0,
    OS_CREDENTIAL_BROKER: 1,
    PASSWORD_MANAGER_BROKER: 2,
    FOREGROUND_UI_AUTOMATION: 3,
  }[request.delivery_channel];
  const features = [
    Number(request.credential_requirement === "OPAQUE_BROKER_HANDLE"),
    Number(request.credential_handle !== null),
    channelCode,
    Number(request.changes_foreground_window),
    Number(request.moves_pointer),
    Number(request.captures_keyboard),
    Number(request.injects_keystrokes),
    Number(request.uses_shared_clipboard),
    Number(request.exposes_secret_to_harvey),
  ] as const;
  const envelope = {
    domain: "WERKLES_HARVEY_SWATEYES_DECISION_CAPSULE",
    schema: "werkles.harvey-swateyes-decision-capsule/v1",
    policy_version: "swateyes-background-input/20260802.1",
    feature_order: [
      "credential_required", "credential_handle_present", "delivery_channel",
      "changes_foreground", "moves_pointer", "captures_keyboard",
      "injects_keystrokes", "uses_shared_clipboard", "exposes_secret_to_harvey",
    ],
    permission_fingerprint_sha256: request.permission_fingerprint_sha256,
    features,
    decision_code: decisionCode,
  };
  const capsuleSha256 = createHash("sha256")
    .update(JSON.stringify(envelope), "utf8")
    .digest("hex");
  return {
    schema: "werkles.harvey-swateyes-decision-capsule/v1",
    policy_version: "swateyes-background-input/20260802.1",
    permission_fingerprint_sha256: request.permission_fingerprint_sha256,
    features,
    decision_code: decisionCode,
    capsule_sha256: capsuleSha256,
  };
}

function result(
  request: HarveySwateyesBackgroundInputRequest,
  state: HarveySwateyesBackgroundInputDecision["state"],
  blocker: HarveySwateyesBackgroundInputDecision["blocker"],
): HarveySwateyesBackgroundInputDecision {
  return {
    schema: "werkles.harvey-swateyes-background-input/v1",
    state,
    blocker,
    execution_authorized: false,
    cursor_or_keyboard_touched: false,
    secret_loaded_by_harvey: false,
    credential_handle_returned: false,
    capsule: capsule(request, state === "BACKGROUND_SAFE_CANDIDATE" ? 1 : 0),
  };
}

function invalidResult(): HarveySwateyesBackgroundInputDecision {
  return result({
    permission_fingerprint_sha256: "0".repeat(64),
    credential_requirement: "NONE",
    credential_handle: null,
    delivery_channel: "FOREGROUND_UI_AUTOMATION",
    changes_foreground_window: true,
    moves_pointer: true,
    captures_keyboard: true,
    injects_keystrokes: true,
    uses_shared_clipboard: true,
    exposes_secret_to_harvey: true,
  }, "BLOCKED", "INVALID_REQUEST");
}

export function classifyHarveySwateyesBackgroundInput(
  request: HarveySwateyesBackgroundInputRequest,
): HarveySwateyesBackgroundInputDecision {
  let normalized: HarveySwateyesBackgroundInputRequest;
  try {
    const runtime = request as unknown as Record<string, unknown>;
    if (
      !runtime
      || typeof runtime !== "object"
      || Array.isArray(runtime)
      || Object.keys(runtime).sort().join("|") !== REQUEST_KEYS.join("|")
      || typeof runtime.permission_fingerprint_sha256 !== "string"
      || !SHA256.test(runtime.permission_fingerprint_sha256)
      || !["NONE", "OPAQUE_BROKER_HANDLE"].includes(String(runtime.credential_requirement))
      || !(runtime.credential_handle === null || typeof runtime.credential_handle === "string")
      || !CHANNELS.has(String(runtime.delivery_channel))
      || [
        "changes_foreground_window", "moves_pointer", "captures_keyboard",
        "injects_keystrokes", "uses_shared_clipboard", "exposes_secret_to_harvey",
      ].some((key) => typeof runtime[key] !== "boolean")
    ) return invalidResult();
    normalized = Object.fromEntries(REQUEST_KEYS.map((key) => [key, runtime[key]])) as HarveySwateyesBackgroundInputRequest;
  } catch {
    return invalidResult();
  }
  request = normalized;
  if (request.exposes_secret_to_harvey) return result(request, "BLOCKED", "SECRET_EXPOSURE_FORBIDDEN");
  if (
    request.delivery_channel === "FOREGROUND_UI_AUTOMATION"
    || request.changes_foreground_window
    || request.moves_pointer
    || request.captures_keyboard
    || request.injects_keystrokes
    || request.uses_shared_clipboard
  ) return result(request, "BLOCKED", "FOREGROUND_OR_INPUT_INTERFERENCE_FORBIDDEN");
  if (
    request.credential_requirement === "OPAQUE_BROKER_HANDLE"
    && (request.credential_handle === null || !OPAQUE_CREDENTIAL_HANDLE.test(request.credential_handle))
  ) return result(request, "BLOCKED", "OPAQUE_CREDENTIAL_BROKER_REQUIRED");
  if (request.credential_requirement === "NONE" && request.credential_handle !== null) {
    return result(request, "BLOCKED", "INVALID_REQUEST");
  }
  return result(request, "BACKGROUND_SAFE_CANDIDATE", null);
}
