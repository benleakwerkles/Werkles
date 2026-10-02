import { createHash } from "node:crypto";

import {
  canonicalJson,
  keyFingerprint,
  verifyDurableRecord,
} from "./station-crypto-core.mjs";
import {
  containsHarveySecretShape,
  containsUnsafeHarveyControlCharacters,
} from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MAX_AGE_MS = 30_000;
const OBSERVATION_SCHEMA = "pookakind.stewart-recovery-identity-observation/v1";
const ADMISSION_SCHEMA = "pookakind.stewart-recovery-identity-admission/v1";
const COMMAND_SCHEMA = "pookakind.stewart-recovery-identity-command/v1";
const WRAPPER_SCHEMA = "pookakind.stewart-recovery-identity-submit/v1";
const RECEIPT_SCHEMA = "pookakind.stewart-recovery-identity-receipt/v1";
const AUTHORITY_PAYLOAD_SCHEMA = "pookakind.stewart-recovery-identity-authority-payload/v1";
const OPERATOR_PIN_SCHEMA = "pookakind.operator-authority-pin/v1";
const AUTHORITY_ISSUER = "pookakind-operator";
const AUTHORITY_AUDIENCE_PREFIX = "stewart-recovery-identity-submit/v1";
const PREPARED_REASON = "DURABLE_LIVE_IDENTITY_TRANSMISSION_AUTHORITY_REQUIRED";
const EXECUTE_REASON = "EXACT_RECOVERY_IDENTITY_SUBMISSION_AUTHORIZED";

const COMPILE_INPUT_FIELDS = ["authorityRecord", "now", "observation", "operatorAuthority"];
const OPERATOR_PIN_FIELDS = ["public_key_pem", "public_key_sha256", "schema"];
const AUTHORITY_PAYLOAD_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256",
  "continue_control_sha256", "expires_at", "form_sha256",
  "identity_field_role_sha256", "identity_handle_ref_sha256", "issued_at",
  "live_identity_transmission_authorized", "max_uses", "operation_id_sha256",
  "provider_response_contract_sha256", "route_epoch_sha256", "schema",
  "tab_id_sha256",
];
const OBSERVATION_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "continue_control_count",
  "continue_control_enabled", "continue_control_sha256", "form_sha256",
  "identity_field_count", "identity_field_role_sha256", "observed_at",
  "provider_response_contract_sha256", "retained_identity_match_count",
  "route_epoch_sha256", "schema", "secret_material_present", "tab_id_sha256",
  "unexpected_field_count",
];
const COMMAND_FIELDS = [
  "account_ref_sha256", "action", "authority_record_sha256",
  "canonical_origin_sha256", "continue_control_sha256", "form_sha256",
  "identity_field_role_sha256", "identity_handle_ref_sha256", "max_uses",
  "operation_id_sha256", "provider_response_contract_sha256",
  "request_sha256", "requires_provider_readback", "route_epoch_sha256",
  "schema", "secret_material_present", "tab_id_sha256",
];
const ADMISSION_FIELDS = ["command", "decision", "reason", "request_sha256", "schema"];
const WRAPPER_FIELDS = [
  "admission", "admission_sha256", "live_action_performed", "organ_name",
  "password_conversion_claimed", "recurring_operation_created", "schema",
  "secret_material_returned",
];
const IDENTITY_HANDLE_FIELDS = ["ref_sha256", "schema"];
const FILL_RECEIPT_FIELDS = [
  "clipboard_touched", "cursor_touched", "field_count", "filled",
  "foreground_changed", "identity_material_exposed", "keyboard_touched",
];
const INVOKE_RECEIPT_FIELDS = [
  "clipboard_touched", "control_count", "cursor_touched", "foreground_changed",
  "identity_material_exposed", "invoked", "keyboard_touched",
];
const READBACK_FIELDS = [
  "canonical_origin_sha256", "provider_response_contract_sha256",
  "provider_state_sha256", "request_sha256", "response_class",
  "route_epoch_sha256", "schema", "tab_id_sha256",
];
const BOUND_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "continue_control_sha256",
  "form_sha256", "identity_field_role_sha256", "provider_response_contract_sha256",
  "route_epoch_sha256", "tab_id_sha256",
];

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function hashes(value, fields, code) {
  for (const field of fields) if (!HASH.test(value[field] ?? "")) fail(code);
}

function safeReceiptData(value) {
  if (Array.isArray(value)) {
    for (const item of value) safeReceiptData(item);
    return;
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value))) {
      fail("STEWART_RECOVERY_IDENTITY_SECRET_OR_CONTROL_SHAPE_REJECTED");
    }
    return;
  }
  for (const item of Object.values(value)) safeReceiptData(item);
}

function parseTime(value, code) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) fail(code);
  return parsed;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function authorityAudience(payload) {
  return [
    AUTHORITY_AUDIENCE_PREFIX,
    payload.operation_id_sha256,
    payload.account_ref_sha256,
    payload.canonical_origin_sha256,
    payload.route_epoch_sha256,
    payload.tab_id_sha256,
    payload.form_sha256,
    payload.identity_field_role_sha256,
    payload.continue_control_sha256,
    payload.provider_response_contract_sha256,
  ].join(":");
}

function validateAuthorityPayload(payload) {
  exact(payload, AUTHORITY_PAYLOAD_FIELDS, "STEWART_RECOVERY_IDENTITY_AUTHORITY_PAYLOAD_FIELDS_INVALID");
  safeReceiptData(payload);
  hashes(payload, [
    "account_ref_sha256", "canonical_origin_sha256", "continue_control_sha256",
    "form_sha256", "identity_field_role_sha256", "identity_handle_ref_sha256",
    "operation_id_sha256", "provider_response_contract_sha256",
    "route_epoch_sha256", "tab_id_sha256",
  ], "STEWART_RECOVERY_IDENTITY_AUTHORITY_DIGEST_INVALID");
  if (
    payload.schema !== AUTHORITY_PAYLOAD_SCHEMA
    || typeof payload.live_identity_transmission_authorized !== "boolean"
    || payload.max_uses !== 1
  ) fail("STEWART_RECOVERY_IDENTITY_AUTHORITY_PAYLOAD_INVALID");
}

function validateCommand(command) {
  exact(command, COMMAND_FIELDS, "STEWART_RECOVERY_IDENTITY_COMMAND_FIELDS_INVALID");
  safeReceiptData(command);
  hashes(command, [
    "account_ref_sha256", "authority_record_sha256", "canonical_origin_sha256",
    "continue_control_sha256", "form_sha256", "identity_field_role_sha256",
    "identity_handle_ref_sha256", "operation_id_sha256",
    "provider_response_contract_sha256", "request_sha256", "route_epoch_sha256",
    "tab_id_sha256",
  ], "STEWART_RECOVERY_IDENTITY_COMMAND_DIGEST_INVALID");
  const { request_sha256: suppliedRequest, ...unsigned } = command;
  if (
    command.schema !== COMMAND_SCHEMA
    || command.action !== "SUBMIT_EXACT_RECOVERY_IDENTITY_ONCE"
    || command.max_uses !== 1
    || command.requires_provider_readback !== true
    || command.secret_material_present !== false
    || digest(unsigned) !== suppliedRequest
  ) fail("STEWART_RECOVERY_IDENTITY_COMMAND_INVALID");
}

function validateAdmission(admission) {
  exact(admission, ADMISSION_FIELDS, "STEWART_RECOVERY_IDENTITY_ADMISSION_FIELDS_INVALID");
  safeReceiptData(admission);
  if (admission.schema !== ADMISSION_SCHEMA || !HASH.test(admission.request_sha256 ?? "")) {
    fail("STEWART_RECOVERY_IDENTITY_ADMISSION_INVALID");
  }
  if (admission.decision === "PREPARED_NOT_ACTIVATED") {
    if (admission.reason !== PREPARED_REASON || admission.command !== null) {
      fail("STEWART_RECOVERY_IDENTITY_ADMISSION_INVALID");
    }
    return;
  }
  if (admission.decision === "EXECUTE_ONCE") {
    if (admission.reason !== EXECUTE_REASON) fail("STEWART_RECOVERY_IDENTITY_ADMISSION_INVALID");
    validateCommand(admission.command);
    if (admission.request_sha256 !== admission.command.request_sha256) {
      fail("STEWART_RECOVERY_IDENTITY_ADMISSION_CUSTODY_CONFLICT");
    }
    return;
  }
  fail("STEWART_RECOVERY_IDENTITY_ADMISSION_INVALID");
}

export function compileStewartRecoveryIdentitySubmit(input) {
  exact(input, COMPILE_INPUT_FIELDS, "STEWART_RECOVERY_IDENTITY_COMPILE_INPUT_FIELDS_INVALID");
  const { authorityRecord, operatorAuthority, observation, now } = input;
  if (!Number.isFinite(now)) fail("STEWART_RECOVERY_IDENTITY_CLOCK_INVALID");
  exact(operatorAuthority, OPERATOR_PIN_FIELDS, "STEWART_RECOVERY_IDENTITY_OPERATOR_PIN_FIELDS_INVALID");
  if (
    operatorAuthority.schema !== OPERATOR_PIN_SCHEMA
    || !HASH.test(operatorAuthority.public_key_sha256 ?? "")
    || typeof operatorAuthority.public_key_pem !== "string"
  ) fail("STEWART_RECOVERY_IDENTITY_OPERATOR_PIN_INVALID");
  let actualFingerprint;
  try {
    actualFingerprint = keyFingerprint(operatorAuthority.public_key_pem);
  } catch {
    fail("STEWART_RECOVERY_IDENTITY_OPERATOR_PIN_INVALID");
  }
  if (actualFingerprint !== operatorAuthority.public_key_sha256) {
    fail("STEWART_RECOVERY_IDENTITY_OPERATOR_PIN_MISMATCH");
  }
  if (!authorityRecord || typeof authorityRecord !== "object" || Array.isArray(authorityRecord)) {
    fail("STEWART_RECOVERY_IDENTITY_AUTHORITY_RECORD_INVALID");
  }
  validateAuthorityPayload(authorityRecord.payload);
  let authority;
  try {
    authority = verifyDurableRecord(operatorAuthority.public_key_pem, authorityRecord, {
      issuer: AUTHORITY_ISSUER,
      audience: authorityAudience(authorityRecord.payload),
    });
  } catch {
    fail("STEWART_RECOVERY_IDENTITY_AUTHORITY_RECORD_INVALID");
  }
  validateAuthorityPayload(authority);
  if (authorityRecord.audience !== authorityAudience(authority)) {
    fail("STEWART_RECOVERY_IDENTITY_AUTHORITY_AUDIENCE_MISMATCH");
  }
  const authorityRecordSha256 = digest(authorityRecord);
  exact(observation, OBSERVATION_FIELDS, "STEWART_RECOVERY_IDENTITY_OBSERVATION_FIELDS_INVALID");
  safeReceiptData(observation);
  hashes(observation, BOUND_FIELDS, "STEWART_RECOVERY_IDENTITY_OBSERVATION_DIGEST_INVALID");
  if (
    observation.schema !== OBSERVATION_SCHEMA
    || observation.identity_field_count !== 1
    || observation.continue_control_count !== 1
    || observation.continue_control_enabled !== true
    || observation.unexpected_field_count !== 0
    || observation.retained_identity_match_count !== 1
    || observation.secret_material_present !== false
  ) fail("STEWART_RECOVERY_IDENTITY_SCOPE_INVALID");

  const issuedAt = parseTime(authority.issued_at, "STEWART_RECOVERY_IDENTITY_AUTHORITY_TIME_INVALID");
  const expiresAt = parseTime(authority.expires_at, "STEWART_RECOVERY_IDENTITY_AUTHORITY_TIME_INVALID");
  const observedAt = parseTime(observation.observed_at, "STEWART_RECOVERY_IDENTITY_OBSERVATION_TIME_INVALID");
  if (issuedAt > now || expiresAt < now || expiresAt <= issuedAt || expiresAt - issuedAt > MAX_AGE_MS) {
    fail("STEWART_RECOVERY_IDENTITY_AUTHORITY_STALE");
  }
  if (observedAt > now || now - observedAt > MAX_AGE_MS) {
    fail("STEWART_RECOVERY_IDENTITY_OBSERVATION_STALE");
  }
  for (const field of BOUND_FIELDS) {
    if (authority[field] !== observation[field]) fail("STEWART_RECOVERY_IDENTITY_CUSTODY_CONFLICT");
  }

  let admission;
  if (authority.live_identity_transmission_authorized !== true) {
    admission = {
      schema: ADMISSION_SCHEMA,
      decision: "PREPARED_NOT_ACTIVATED",
      reason: PREPARED_REASON,
      request_sha256: digest({ authority_record_sha256: authorityRecordSha256, observation }),
      command: null,
    };
  } else {
    const commandBase = {
      schema: COMMAND_SCHEMA,
      action: "SUBMIT_EXACT_RECOVERY_IDENTITY_ONCE",
      operation_id_sha256: authority.operation_id_sha256,
      authority_record_sha256: authorityRecordSha256,
      identity_handle_ref_sha256: authority.identity_handle_ref_sha256,
      tab_id_sha256: authority.tab_id_sha256,
      canonical_origin_sha256: authority.canonical_origin_sha256,
      route_epoch_sha256: authority.route_epoch_sha256,
      account_ref_sha256: authority.account_ref_sha256,
      form_sha256: authority.form_sha256,
      identity_field_role_sha256: authority.identity_field_role_sha256,
      continue_control_sha256: authority.continue_control_sha256,
      provider_response_contract_sha256: authority.provider_response_contract_sha256,
      max_uses: 1,
      requires_provider_readback: true,
      secret_material_present: false,
    };
    const requestSha256 = digest(commandBase);
    admission = {
      schema: ADMISSION_SCHEMA,
      decision: "EXECUTE_ONCE",
      reason: EXECUTE_REASON,
      request_sha256: requestSha256,
      command: { ...commandBase, request_sha256: requestSha256 },
    };
  }

  validateAdmission(admission);
  return deepFreeze({
    schema: WRAPPER_SCHEMA,
    organ_name: "Stewart",
    admission,
    admission_sha256: digest(admission),
    live_action_performed: false,
    password_conversion_claimed: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  });
}

export async function runStewartRecoveryIdentitySubmit({
  compiled,
  identityHandle,
  consume,
  resolveIdentity,
  fillField,
  invokeControl,
  readback,
}) {
  exact(compiled, WRAPPER_FIELDS, "STEWART_RECOVERY_IDENTITY_WRAPPER_FIELDS_INVALID");
  if (
    compiled.schema !== WRAPPER_SCHEMA
    || compiled.organ_name !== "Stewart"
    || !HASH.test(compiled.admission_sha256 ?? "")
    || compiled.live_action_performed !== false
    || compiled.password_conversion_claimed !== false
    || compiled.secret_material_returned !== false
    || compiled.recurring_operation_created !== false
  ) fail("STEWART_RECOVERY_IDENTITY_WRAPPER_INVALID");
  const admission = structuredClone(compiled.admission);
  validateAdmission(admission);
  if (digest(admission) !== compiled.admission_sha256) {
    fail("STEWART_RECOVERY_IDENTITY_ADMISSION_CUSTODY_CONFLICT");
  }
  if (admission.decision !== "EXECUTE_ONCE") {
    return Object.freeze({
      schema: RECEIPT_SCHEMA,
      organ_name: "Stewart",
      state: "PREPARED_NOT_ACTIVATED",
      reason: PREPARED_REASON,
      consume_calls: 0,
      resolve_calls: 0,
      fill_calls: 0,
      invoke_calls: 0,
      provider_state_sha256: null,
      fixed: false,
      password_conversion: false,
      secret_material_returned: false,
      recurring_operation_created: false,
    });
  }

  validateCommand(admission.command);
  exact(identityHandle, IDENTITY_HANDLE_FIELDS, "STEWART_RECOVERY_IDENTITY_HANDLE_FIELDS_INVALID");
  if (identityHandle.schema !== "pookakind.stewart-opaque-identity-handle/v1" || !HASH.test(identityHandle.ref_sha256 ?? "")) {
    fail("STEWART_RECOVERY_IDENTITY_HANDLE_INVALID");
  }
  if (identityHandle.ref_sha256 !== admission.command.identity_handle_ref_sha256) {
    fail("STEWART_RECOVERY_IDENTITY_HANDLE_CUSTODY_CONFLICT");
  }
  if (
    typeof consume !== "function"
    || typeof resolveIdentity !== "function"
    || typeof fillField !== "function"
    || typeof invokeControl !== "function"
    || typeof readback !== "function"
  ) fail("STEWART_RECOVERY_IDENTITY_EXECUTOR_INVALID");

  const consumed = await consume(admission.command.operation_id_sha256);
  if (consumed !== true) {
    return Object.freeze({
      schema: RECEIPT_SCHEMA,
      organ_name: "Stewart",
      state: "ALREADY_CONSUMED",
      reason: null,
      consume_calls: 1,
      resolve_calls: 0,
      fill_calls: 0,
      invoke_calls: 0,
      provider_state_sha256: null,
      fixed: false,
      password_conversion: false,
      secret_material_returned: false,
      recurring_operation_created: false,
    });
  }

  let resolved = await resolveIdentity(identityHandle);
  exact(resolved, ["identity_material", "resolved"], "STEWART_RECOVERY_IDENTITY_RESOLUTION_RECEIPT_INVALID");
  if (
    resolved.resolved !== true
    || typeof resolved.identity_material !== "string"
    || resolved.identity_material.length === 0
    || resolved.identity_material.length > 1_024
    || containsUnsafeHarveyControlCharacters(resolved.identity_material)
  ) fail("STEWART_RECOVERY_IDENTITY_RESOLUTION_FAILED");
  let identityMaterial = resolved.identity_material;
  resolved = null;

  const fill = await fillField({
    command: structuredClone(admission.command),
    identity_material: identityMaterial,
  });
  identityMaterial = null;
  exact(fill, FILL_RECEIPT_FIELDS, "STEWART_RECOVERY_IDENTITY_FILL_RECEIPT_INVALID");
  safeReceiptData(fill);
  if (
    fill.field_count !== 1
    || fill.filled !== true
    || fill.foreground_changed !== false
    || fill.cursor_touched !== false
    || fill.keyboard_touched !== false
    || fill.clipboard_touched !== false
    || fill.identity_material_exposed !== false
  ) fail("STEWART_RECOVERY_IDENTITY_FILL_FAILED");

  const invoked = await invokeControl(structuredClone(admission.command));
  exact(invoked, INVOKE_RECEIPT_FIELDS, "STEWART_RECOVERY_IDENTITY_INVOKE_RECEIPT_INVALID");
  safeReceiptData(invoked);
  if (
    invoked.control_count !== 1
    || invoked.invoked !== true
    || invoked.foreground_changed !== false
    || invoked.cursor_touched !== false
    || invoked.keyboard_touched !== false
    || invoked.clipboard_touched !== false
    || invoked.identity_material_exposed !== false
  ) fail("STEWART_RECOVERY_IDENTITY_INVOKE_FAILED");

  const provider = await readback(structuredClone(admission.command));
  exact(provider, READBACK_FIELDS, "STEWART_RECOVERY_IDENTITY_READBACK_FIELDS_INVALID");
  safeReceiptData(provider);
  hashes(provider, [
    "canonical_origin_sha256", "provider_response_contract_sha256",
    "provider_state_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256",
  ], "STEWART_RECOVERY_IDENTITY_READBACK_DIGEST_INVALID");
  if (
    provider.schema !== "pookakind.stewart-recovery-provider-readback/v1"
    || provider.request_sha256 !== admission.command.request_sha256
    || provider.canonical_origin_sha256 !== admission.command.canonical_origin_sha256
    || provider.route_epoch_sha256 !== admission.command.route_epoch_sha256
    || provider.tab_id_sha256 !== admission.command.tab_id_sha256
    || provider.provider_response_contract_sha256 !== admission.command.provider_response_contract_sha256
  ) fail("STEWART_RECOVERY_IDENTITY_PROVIDER_RESPONSE_MISMATCH");
  const state = {
    PROVIDER_ACCEPTED: "REQUEST_ACCEPTED",
    PROVIDER_REJECTED: "REQUEST_REJECTED",
    FACTOR_EMAIL: "FACTOR_EMAIL",
    FACTOR_SMS: "FACTOR_SMS",
    FACTOR_DEVICE: "FACTOR_DEVICE",
    FACTOR_CAPTCHA: "FACTOR_CAPTCHA",
    OUTCOME_UNKNOWN: "OUTCOME_UNKNOWN",
  }[provider.response_class];
  if (!state) fail("STEWART_RECOVERY_IDENTITY_READBACK_INVALID");

  return Object.freeze({
    schema: RECEIPT_SCHEMA,
    organ_name: "Stewart",
    state,
    reason: null,
    consume_calls: 1,
    resolve_calls: 1,
    fill_calls: 1,
    invoke_calls: 1,
    provider_state_sha256: provider.provider_state_sha256,
    fixed: false,
    password_conversion: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  });
}
