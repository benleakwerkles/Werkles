import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OBSERVATION_SCHEMA = "pookakind.stewart-windows-security-uiaccess-observation/v1";
const RECEIPT_SCHEMA = "pookakind.stewart-windows-security-uiaccess-architecture/v1";
const FIELDS = [
  "authenticode_status", "background_synthetic_proved", "broker_count", "build_script_sha256",
  "code_signing_certificates_trusted_with_private_key", "execute_mode_compiled",
  "foreground_activation_present", "generic_input_present", "installation_performed",
  "manifest_embedded", "manifest_requests_uiaccess", "manifest_sha256",
  "machine", "msaa_addressable_controls", "observed_at", "opaque_pin_custody_proved",
  "orphaned_requester_canceled", "provider_owned_pin_api",
  "runner_accepts_signed_one_shot_only", "runner_sha256", "secure_install_acl_admin_only",
  "secure_install_present", "secure_uia_paths_policy_enabled", "secret_accessed",
  "schema", "signtool_present", "uia_invokable_controls", "uiaccess_token_proved",
  "uia_writable_fields",
];

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function plainDataRecord(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code);
  const keys = Reflect.ownKeys(value);
  const expected = [...fields].sort();
  if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length) fail(code);
  const actual = keys.map(String).sort();
  for (let index = 0; index < actual.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, actual[index]);
    if (actual[index] !== expected[index] || !descriptor?.enumerable || !("value" in descriptor)) fail(code);
  }
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function boolean(value, code) {
  if (typeof value !== "boolean") fail(code);
}

function integer(value, code) {
  if (!Number.isSafeInteger(value) || value < 0) fail(code);
}

function frozen(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) frozen(child);
  return Object.freeze(value);
}

export function compileStewartWindowsSecurityUiAccessArchitecture(observation, {
  expectedMachine = "DOSS",
  expectedRunnerSha256,
  expectedManifestSha256,
  expectedBuildScriptSha256,
} = {}) {
  plainDataRecord(observation, FIELDS, "STEWART_WINDOWS_SECURITY_UIACCESS_OBSERVATION_INVALID");
  if (observation.schema !== OBSERVATION_SCHEMA) fail("STEWART_WINDOWS_SECURITY_UIACCESS_OBSERVATION_INVALID");
  for (const field of ["runner_sha256", "manifest_sha256", "build_script_sha256"]) {
    if (!HASH.test(observation[field] ?? "")) fail("STEWART_WINDOWS_SECURITY_UIACCESS_HASH_INVALID");
  }
  if (![expectedRunnerSha256, expectedManifestSha256, expectedBuildScriptSha256].every((value) => HASH.test(value ?? ""))) {
    fail("STEWART_WINDOWS_SECURITY_UIACCESS_EXPECTED_HASH_INVALID");
  }
  if (observation.machine !== expectedMachine
    || observation.runner_sha256 !== expectedRunnerSha256
    || observation.manifest_sha256 !== expectedManifestSha256
    || observation.build_script_sha256 !== expectedBuildScriptSha256) {
    fail("STEWART_WINDOWS_SECURITY_UIACCESS_SOURCE_CUSTODY_MISMATCH");
  }
  const observedAt = Date.parse(observation.observed_at);
  if (!Number.isFinite(observedAt)) fail("STEWART_WINDOWS_SECURITY_UIACCESS_TIME_INVALID");
  for (const field of [
    "background_synthetic_proved", "execute_mode_compiled", "foreground_activation_present", "generic_input_present",
    "installation_performed", "manifest_embedded", "manifest_requests_uiaccess",
    "opaque_pin_custody_proved", "orphaned_requester_canceled",
    "runner_accepts_signed_one_shot_only", "secure_install_acl_admin_only",
    "secure_install_present", "secure_uia_paths_policy_enabled", "secret_accessed",
    "signtool_present", "uiaccess_token_proved",
  ]) boolean(observation[field], "STEWART_WINDOWS_SECURITY_UIACCESS_BOOLEAN_INVALID");
  for (const field of [
    "broker_count", "code_signing_certificates_trusted_with_private_key",
    "msaa_addressable_controls", "uia_invokable_controls", "uia_writable_fields",
  ]) integer(observation[field], "STEWART_WINDOWS_SECURITY_UIACCESS_COUNT_INVALID");
  if (!["NOT_SIGNED", "VALID", "INVALID", "UNKNOWN"].includes(observation.authenticode_status)
    || observation.provider_owned_pin_api !== "UNAVAILABLE_FOR_EXISTING_WEBAUTHN_CEREMONY") {
    fail("STEWART_WINDOWS_SECURITY_UIACCESS_PLATFORM_CLASSIFICATION_INVALID");
  }
  if (observation.secret_accessed || observation.generic_input_present || observation.installation_performed) {
    fail("STEWART_WINDOWS_SECURITY_UIACCESS_SOURCE_ONLY_BOUNDARY_VIOLATED");
  }

  const sourceBlockers = [];
  if (!observation.execute_mode_compiled) sourceBlockers.push("WINDOWS_SECURITY_EXECUTE_MODE_NOT_COMPILED");
  if (!observation.runner_accepts_signed_one_shot_only) sourceBlockers.push("SIGNED_ONE_SHOT_NATIVE_ADMISSION_NOT_BOUND");
  if (!observation.opaque_pin_custody_proved) sourceBlockers.push("OPAQUE_PIN_CUSTODY_NOT_PROVED");
  if (!observation.manifest_requests_uiaccess) sourceBlockers.push("UIACCESS_MANIFEST_MISSING");
  if (!observation.manifest_embedded) sourceBlockers.push("UIACCESS_MANIFEST_NOT_EMBEDDED");
  if (!observation.signtool_present) sourceBlockers.push("SIGNTOOL_NOT_AVAILABLE");
  if (observation.foreground_activation_present) sourceBlockers.push("FOREGROUND_STEALING_RUNNER_REJECTED");
  const trustInstallBlockers = [];
  if (observation.code_signing_certificates_trusted_with_private_key !== 1) trustInstallBlockers.push("EXACT_TRUSTED_CODE_SIGNING_IDENTITY_ABSENT");
  if (observation.authenticode_status !== "VALID") trustInstallBlockers.push("AUTHENTICODE_CHAIN_NOT_VALID");
  if (!observation.secure_uia_paths_policy_enabled) trustInstallBlockers.push("SECURE_UIACCESS_PATH_POLICY_NOT_ENABLED");
  if (!observation.secure_install_present || !observation.secure_install_acl_admin_only) trustInstallBlockers.push("ADMIN_ONLY_PROGRAM_FILES_INSTALL_NOT_PROVED");
  if (!observation.uiaccess_token_proved) trustInstallBlockers.push("LIVE_UIACCESS_TOKEN_NOT_PROVED");
  const runtimeProofBlockers = [];
  if (!observation.background_synthetic_proved) runtimeProofBlockers.push("BACKGROUND_UIACCESS_SYNTHETIC_NOT_PROVED");
  if (observation.broker_count !== 0 || !observation.orphaned_requester_canceled) runtimeProofBlockers.push("CREDENTIAL_BROKER_NOT_STABLE_CLEAN");
  const blockers = [...sourceBlockers, ...trustInstallBlockers, ...runtimeProofBlockers];
  const liveCallable = blockers.length === 0;
  const state = sourceBlockers.length
    ? "SOURCE_ARCHITECTURE_DEFINED__ADAPTER_CORRECTION_REQUIRED"
    : trustInstallBlockers.length
      ? "SOURCE_READY__TRUST_INSTALL_GATE_REQUIRED"
      : runtimeProofBlockers.length
        ? "INSTALLED_INACTIVE__ROUTINE_SYNTHETIC_PROOF_REQUIRED"
        : "LIVE_CALLABLE";
  const receipt = {
    schema: RECEIPT_SCHEMA,
    state,
    machine: expectedMachine,
    source_custody_sha256: digest({
      runner_sha256: observation.runner_sha256,
      manifest_sha256: observation.manifest_sha256,
      build_script_sha256: observation.build_script_sha256,
    }),
    selected_route: "SIGNED_UIACCESS_UIA_VALUE_AND_INVOKE_PATTERNS_ON_NORMAL_INTERACTIVE_DESKTOP",
    rejected_routes: [
      "UNSIGNED_POSTMESSAGE",
      "RAW_SENDINPUT_OR_KEYBOARD_OR_CLIPBOARD",
      "CUSTOM_CREDENTIAL_PROVIDER_FOR_BUILT_IN_WEBAUTHN_PIN",
      "PROVIDER_OWNED_PIN_INJECTION_API",
      "FOREGROUND_STEALING_UIA",
    ],
    runtime_contract: {
      signed_access_steward_operation_required: true,
      opaque_pin_handle_only: true,
      atomic_consume_before_dpapi_resolution: true,
      exact_pid_and_hwnd_and_window_class_required: true,
      exact_one_writable_value_pattern_required: true,
      exact_one_invokable_final_control_required: true,
      background_only_no_focus_change: true,
      secret_output_allowed: false,
      immediate_sanitized_provider_readback_required: true,
      submission_is_not_conversion_or_fixed: true,
      max_uses: 1,
    },
    current_capability: {
      live_callable: liveCallable,
      source_only: true,
      uiaccess_token_proved: observation.uiaccess_token_proved,
      trusted_signing_identity_count: observation.code_signing_certificates_trusted_with_private_key,
      provider_owned_pin_api: observation.provider_owned_pin_api,
    },
    source_blockers: sourceBlockers,
    trust_install_blockers: trustInstallBlockers,
    runtime_proof_blockers: runtimeProofBlockers,
    blockers,
    next_human_gate: sourceBlockers.length ? "NONE__SOURCE_CORRECTION_REQUIRED_FIRST" : trustInstallBlockers.length ? "TRUST_AND_INSTALL_SIGNED_UIACCESS_RUNNER_ON_DOSS" : "NONE",
    prepared_human_gate: "TRUST_AND_INSTALL_SIGNED_UIACCESS_RUNNER_ON_DOSS",
    routine_proof_after_gate: "ONE_NONSECRET_BACKGROUND_UIACCESS_SYNTHETIC_WITH_TERMINAL_CLEANUP",
    live_action_performed: false,
    secret_material_accessed: false,
    installation_performed: false,
    recurring_operation_created: false,
  };
  return frozen(receipt);
}
