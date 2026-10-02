import { createHash } from "node:crypto";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MAX_AGE_MS = 30_000;
const AUTHORITY_SCHEMA = "pookakind.stewart-background-credential-authority/v1";
const OBSERVATION_SCHEMA = "pookakind.stewart-background-credential-observation/v1";
const COMMAND_SCHEMA = "pookakind.stewart-background-credential-command/v1";
const WRAPPER_SCHEMA = "pookakind.stewart-background-credential-operation/v1";
const RECEIPT_SCHEMA = "pookakind.stewart-background-credential-receipt/v1";
const PIN_SCHEMA = "pookakind.operator-authority-pin/v1";
const ISSUER = "pookakind-operator";
const AUDIENCE_PREFIX = "stewart-background-credential-operation/v1";
const PREPARED_REASON = "LIVE_BACKGROUND_CREDENTIAL_EXECUTOR_AUTHORITY_REQUIRED";
const EXECUTE_REASON = "EXACT_BACKGROUND_CREDENTIAL_OPERATION_AUTHORIZED";
const ALLOWED_OPERATION_KINDS = new Set(["SIGN_IN", "PASSWORD_FALLBACK_SIGN_IN", "RECOVERY_IDENTITY_SUBMIT", "PASSWORD_RESET", "EMAIL_OTP_SUBMIT"]);
const OTP_ROLES = Object.freeze(Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`));
const ALLOWED_FIELD_ROLES = new Set(["IDENTITY", "CURRENT_PASSWORD", "NEW_PASSWORD", "CONFIRM_PASSWORD", ...OTP_ROLES]);

const PIN_FIELDS = ["public_key_pem", "public_key_sha256", "schema"];
const FIELD_FIELDS = ["control_sha256", "handle_ref_sha256", "role"];
const AUTHORITY_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "expires_at", "fields",
  "final_control_sha256", "form_sha256", "issued_at", "live_execution_authorized",
  "max_uses", "operation_id_sha256", "operation_kind", "provider_response_contract_sha256",
  "route_epoch_sha256", "schema", "tab_id_sha256",
];
const OBSERVATION_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "field_controls", "final_control_count",
  "final_control_enabled", "final_control_sha256", "form_sha256", "observed_at",
  "provider_response_contract_sha256", "route_epoch_sha256", "schema",
  "secret_material_present", "tab_id_sha256", "unexpected_field_count",
];
const COMMAND_FIELDS = [
  "account_ref_sha256", "action", "authority_record_sha256", "canonical_origin_sha256",
  "fields", "final_control_sha256", "form_sha256", "max_uses", "operation_id_sha256",
  "operation_kind", "provider_response_contract_sha256", "request_sha256",
  "requires_provider_readback", "route_epoch_sha256", "schema", "secret_material_present",
  "tab_id_sha256",
];
const ADMISSION_FIELDS = ["command", "decision", "reason", "request_sha256", "schema"];
const WRAPPER_FIELDS = [
  "admission", "admission_sha256", "live_action_performed", "organ_name",
  "password_conversion_claimed", "recurring_operation_created", "schema",
  "secret_material_returned",
];
const HANDLE_FIELDS = ["ref_sha256", "schema"];
const EXECUTION_FIELDS = [
  "clipboard_touched", "cursor_touched", "field_count", "field_roles_sha256",
  "final_control_count", "final_control_invoked", "foreground_changed",
  "keyboard_touched", "secret_material_exposed",
];
const READBACK_FIELDS = [
  "canonical_origin_sha256", "provider_response_contract_sha256", "provider_state_sha256",
  "request_sha256", "response_class", "route_epoch_sha256", "schema", "tab_id_sha256",
];
const BOUND_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "final_control_sha256", "form_sha256",
  "provider_response_contract_sha256", "route_epoch_sha256", "tab_id_sha256",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function hashes(value, fields, code) { for (const field of fields) if (!HASH.test(value[field] ?? "")) fail(code); }
function time(value, code) { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) fail(code); return parsed; }
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
function plainSnapshot(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object") fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) fail(code);
    if (Object.getOwnPropertySymbols(value).length !== 0) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(code);
    return keys.map((key) => {
      const descriptor = descriptors[key];
      if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
      return plainSnapshot(descriptor.value, code);
    });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const snapshot = {};
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    snapshot[key] = plainSnapshot(descriptor.value, code);
  }
  return snapshot;
}
function safe(value) {
  if (Array.isArray(value)) { for (const item of value) safe(item); return; }
  if (value && typeof value === "object") { for (const item of Object.values(value)) safe(item); return; }
  if (typeof value === "string" && (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value))) {
    fail("STEWART_BACKGROUND_CREDENTIAL_SECRET_OR_CONTROL_SHAPE_REJECTED");
  }
}
function validateFields(fields, includeHandles, code) {
  if (!Array.isArray(fields) || fields.length < 1 || fields.length > 6) fail(code);
  const roles = new Set();
  for (const field of fields) {
    exact(field, includeHandles ? FIELD_FIELDS : ["control_sha256", "role"], code);
    if (!ALLOWED_FIELD_ROLES.has(field.role) || roles.has(field.role) || !HASH.test(field.control_sha256 ?? "")) fail(code);
    if (includeHandles && !HASH.test(field.handle_ref_sha256 ?? "")) fail(code);
    roles.add(field.role);
  }
  return roles;
}
function validateOperationShape(kind, roles, code) {
  if (!ALLOWED_OPERATION_KINDS.has(kind)) fail(code);
  const exactRoles = [...roles].sort().join(",");
  const expected = {
    SIGN_IN: "CURRENT_PASSWORD,IDENTITY",
    PASSWORD_FALLBACK_SIGN_IN: "CURRENT_PASSWORD",
    RECOVERY_IDENTITY_SUBMIT: "IDENTITY",
    PASSWORD_RESET: "CONFIRM_PASSWORD,NEW_PASSWORD",
    EMAIL_OTP_SUBMIT: [...OTP_ROLES].sort().join(","),
  }[kind];
  if (exactRoles !== expected) fail(code);
}
function expectedHandleRefs(command) {
  const refs = [...new Set(command.fields.map(({ handle_ref_sha256 }) => handle_ref_sha256))];
  if (command.operation_kind === "EMAIL_OTP_SUBMIT" && refs.length !== 1) fail("STEWART_BACKGROUND_CREDENTIAL_OTP_HANDLE_CUSTODY_CONFLICT");
  return refs;
}
function audience(payload) {
  return [AUDIENCE_PREFIX, payload.operation_id_sha256, payload.account_ref_sha256,
    payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256,
    payload.form_sha256, digest(payload.fields), payload.final_control_sha256,
    payload.provider_response_contract_sha256].join(":");
}
function validateAuthority(payload) {
  exact(payload, AUTHORITY_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_FIELDS_INVALID"); safe(payload);
  hashes(payload, [...BOUND_FIELDS, "operation_id_sha256"], "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_DIGEST_INVALID");
  const roles = validateFields(payload.fields, true, "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_FIELDS_INVALID");
  validateOperationShape(payload.operation_kind, roles, "STEWART_BACKGROUND_CREDENTIAL_OPERATION_SHAPE_INVALID");
  expectedHandleRefs(payload);
  if (payload.schema !== AUTHORITY_SCHEMA || payload.max_uses !== 1 || typeof payload.live_execution_authorized !== "boolean") {
    fail("STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_INVALID");
  }
}
function validateCommand(command) {
  exact(command, COMMAND_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_COMMAND_FIELDS_INVALID"); safe(command);
  hashes(command, [...BOUND_FIELDS, "authority_record_sha256", "operation_id_sha256", "request_sha256"], "STEWART_BACKGROUND_CREDENTIAL_COMMAND_DIGEST_INVALID");
  const roles = validateFields(command.fields, true, "STEWART_BACKGROUND_CREDENTIAL_COMMAND_FIELDS_INVALID");
  validateOperationShape(command.operation_kind, roles, "STEWART_BACKGROUND_CREDENTIAL_OPERATION_SHAPE_INVALID");
  expectedHandleRefs(command);
  const { request_sha256: supplied, ...base } = command;
  if (command.schema !== COMMAND_SCHEMA || command.action !== "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE"
    || command.max_uses !== 1 || command.requires_provider_readback !== true
    || command.secret_material_present !== false || digest(base) !== supplied) fail("STEWART_BACKGROUND_CREDENTIAL_COMMAND_INVALID");
}
function validateAdmission(admission) {
  exact(admission, ADMISSION_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_ADMISSION_FIELDS_INVALID"); safe(admission);
  if (admission.schema !== "pookakind.stewart-background-credential-admission/v1" || !HASH.test(admission.request_sha256 ?? "")) fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_INVALID");
  if (admission.decision === "PREPARED_NOT_ACTIVATED") {
    if (admission.reason !== PREPARED_REASON || admission.command !== null) fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_INVALID");
  } else if (admission.decision === "EXECUTE_ONCE") {
    if (admission.reason !== EXECUTE_REASON) fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_INVALID");
    validateCommand(admission.command);
    if (admission.request_sha256 !== admission.command.request_sha256) fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_CUSTODY_CONFLICT");
  } else fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_INVALID");
}

export function compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation, now = Date.now() }) {
  if (!Number.isFinite(now)) fail("STEWART_BACKGROUND_CREDENTIAL_CLOCK_INVALID");
  const pinned = plainSnapshot(operatorAuthority, "STEWART_BACKGROUND_CREDENTIAL_OPERATOR_PIN_INVALID");
  const signedRecord = plainSnapshot(authorityRecord, "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_RECORD_INVALID");
  const observedSurface = plainSnapshot(observation, "STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_FIELDS_INVALID");
  exact(pinned, PIN_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_OPERATOR_PIN_INVALID");
  const pinnedPem = pinned.public_key_pem;
  const pinnedFingerprint = pinned.public_key_sha256;
  if (pinned.schema !== PIN_SCHEMA || !HASH.test(pinnedFingerprint ?? "")
    || keyFingerprint(pinnedPem) !== pinnedFingerprint) fail("STEWART_BACKGROUND_CREDENTIAL_OPERATOR_PIN_INVALID");
  if (signedRecord.signer_public_key_sha256 !== pinnedFingerprint) fail("STEWART_BACKGROUND_CREDENTIAL_SIGNER_PIN_MISMATCH");
  validateAuthority(signedRecord?.payload);
  let authority;
  try { authority = verifyDurableRecord(pinnedPem, signedRecord, { issuer: ISSUER, audience: audience(signedRecord.payload) }); }
  catch { fail("STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_RECORD_INVALID"); }
  validateAuthority(authority);
  exact(observedSurface, OBSERVATION_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_FIELDS_INVALID"); safe(observedSurface);
  hashes(observedSurface, BOUND_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_DIGEST_INVALID");
  const observedRoles = validateFields(observedSurface.field_controls, false, "STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_FIELDS_INVALID");
  validateOperationShape(authority.operation_kind, observedRoles, "STEWART_BACKGROUND_CREDENTIAL_OPERATION_SHAPE_INVALID");
  if (observedSurface.schema !== OBSERVATION_SCHEMA || observedSurface.final_control_count !== 1
    || observedSurface.final_control_enabled !== true || observedSurface.unexpected_field_count !== 0
    || observedSurface.secret_material_present !== false) fail("STEWART_BACKGROUND_CREDENTIAL_SCOPE_INVALID");
  const issued = time(authority.issued_at, "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_TIME_INVALID");
  const expires = time(authority.expires_at, "STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_TIME_INVALID");
  const observed = time(observedSurface.observed_at, "STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_TIME_INVALID");
  if (issued > now || expires < now || expires <= issued || expires - issued > MAX_AGE_MS) fail("STEWART_BACKGROUND_CREDENTIAL_AUTHORITY_STALE");
  if (observed > now || now - observed > MAX_AGE_MS) fail("STEWART_BACKGROUND_CREDENTIAL_OBSERVATION_STALE");
  for (const field of BOUND_FIELDS) if (authority[field] !== observedSurface[field]) fail("STEWART_BACKGROUND_CREDENTIAL_CUSTODY_CONFLICT");
  if (digest(authority.fields.map(({ role, control_sha256 }) => ({ role, control_sha256 }))) !== digest(observedSurface.field_controls)) fail("STEWART_BACKGROUND_CREDENTIAL_FIELD_CUSTODY_CONFLICT");
  const authority_record_sha256 = digest(signedRecord);
  const base = {
    schema: COMMAND_SCHEMA, action: "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE",
    operation_kind: authority.operation_kind, operation_id_sha256: authority.operation_id_sha256,
    authority_record_sha256, account_ref_sha256: authority.account_ref_sha256,
    canonical_origin_sha256: authority.canonical_origin_sha256, route_epoch_sha256: authority.route_epoch_sha256,
    tab_id_sha256: authority.tab_id_sha256, form_sha256: authority.form_sha256,
    fields: structuredClone(authority.fields), final_control_sha256: authority.final_control_sha256,
    provider_response_contract_sha256: authority.provider_response_contract_sha256,
    max_uses: 1, requires_provider_readback: true, secret_material_present: false,
  };
  const request_sha256 = digest(base);
  const admission = authority.live_execution_authorized === true
    ? { schema: "pookakind.stewart-background-credential-admission/v1", decision: "EXECUTE_ONCE", reason: EXECUTE_REASON, request_sha256, command: { ...base, request_sha256 } }
    : { schema: "pookakind.stewart-background-credential-admission/v1", decision: "PREPARED_NOT_ACTIVATED", reason: PREPARED_REASON, request_sha256, command: null };
  validateAdmission(admission);
  return deepFreeze({ schema: WRAPPER_SCHEMA, organ_name: "Stewart", admission, admission_sha256: digest(admission), live_action_performed: false, password_conversion_claimed: false, secret_material_returned: false, recurring_operation_created: false });
}

export async function runStewartBackgroundCredentialOperation({ compiled, handles, consume, resolveHandle, executeBackgroundForm, readback }) {
  exact(compiled, WRAPPER_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_WRAPPER_INVALID");
  if (compiled.schema !== WRAPPER_SCHEMA || compiled.organ_name !== "Stewart" || !HASH.test(compiled.admission_sha256 ?? "")
    || compiled.live_action_performed !== false || compiled.password_conversion_claimed !== false
    || compiled.secret_material_returned !== false || compiled.recurring_operation_created !== false) fail("STEWART_BACKGROUND_CREDENTIAL_WRAPPER_INVALID");
  const admission = structuredClone(compiled.admission); validateAdmission(admission);
  if (digest(admission) !== compiled.admission_sha256) fail("STEWART_BACKGROUND_CREDENTIAL_ADMISSION_CUSTODY_CONFLICT");
  if (admission.decision !== "EXECUTE_ONCE") return Object.freeze({ schema: RECEIPT_SCHEMA, state: "PREPARED_NOT_ACTIVATED", consume_calls: 0, resolve_calls: 0, execution_calls: 0, provider_state_sha256: null, fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
  const expectedRefs = expectedHandleRefs(admission.command);
  if (!Array.isArray(handles) || handles.length !== expectedRefs.length || typeof consume !== "function"
    || typeof resolveHandle !== "function" || typeof executeBackgroundForm !== "function" || typeof readback !== "function") fail("STEWART_BACKGROUND_CREDENTIAL_EXECUTOR_INVALID");
  for (let index = 0; index < handles.length; index++) {
    exact(handles[index], HANDLE_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_HANDLE_INVALID");
    const expectedSchema = admission.command.operation_kind === "EMAIL_OTP_SUBMIT"
      ? "pookakind.stewart-private-inbox-email-otp-handle/v1"
      : "pookakind.stewart-opaque-credential-handle/v1";
    if (handles[index].schema !== expectedSchema || handles[index].ref_sha256 !== expectedRefs[index]) fail("STEWART_BACKGROUND_CREDENTIAL_HANDLE_CUSTODY_CONFLICT");
  }
  if (await consume(admission.command.operation_id_sha256) !== true) return Object.freeze({ schema: RECEIPT_SCHEMA, state: "ALREADY_CONSUMED", consume_calls: 1, resolve_calls: 0, execution_calls: 0, provider_state_sha256: null, fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
  let materials = [];
  let execution;
  try {
    for (let index = 0; index < handles.length; index++) {
      let result;
      try {
        try {
          result = await resolveHandle(structuredClone(handles[index]));
        } catch {
          fail("STEWART_BACKGROUND_CREDENTIAL_RESOLUTION_FAILED");
        }
        exact(result, ["material", "resolved"], "STEWART_BACKGROUND_CREDENTIAL_RESOLUTION_INVALID");
        if (result.resolved !== true || typeof result.material !== "string" || result.material.length < 1 || result.material.length > 4096 || containsUnsafeHarveyControlCharacters(result.material)) fail("STEWART_BACKGROUND_CREDENTIAL_RESOLUTION_FAILED");
        if (admission.command.operation_kind === "EMAIL_OTP_SUBMIT") {
          if (!/^\d{6}$/.test(result.material)) fail("STEWART_BACKGROUND_CREDENTIAL_OTP_RESOLUTION_FAILED");
          for (let digit = 0; digit < OTP_ROLES.length; digit++) materials.push({ role: OTP_ROLES[digit], material: result.material[digit] });
        } else {
          const roles = admission.command.fields.filter(({ handle_ref_sha256 }) => handle_ref_sha256 === handles[index].ref_sha256).map(({ role }) => role);
          if (roles.length < 1) fail("STEWART_BACKGROUND_CREDENTIAL_HANDLE_CUSTODY_CONFLICT");
          for (const role of roles) materials.push({ role, material: result.material });
        }
      } finally {
        if (result && typeof result === "object" && Object.hasOwn(result, "material")) result.material = null;
        result = null;
      }
    }
    const ordered = admission.command.fields.map(({ role }) => materials.find((entry) => entry.role === role));
    if (ordered.some((entry) => !entry)) fail("STEWART_BACKGROUND_CREDENTIAL_HANDLE_CUSTODY_CONFLICT");
    try {
      execution = await executeBackgroundForm({ command: structuredClone(admission.command), field_material: ordered });
    } catch {
      fail("STEWART_BACKGROUND_CREDENTIAL_EXECUTION_FAILED");
    }
  } finally {
    if (Array.isArray(materials)) for (const entry of materials) if (entry && typeof entry === "object") entry.material = null;
    materials = null;
  }
  exact(execution, EXECUTION_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_EXECUTION_RECEIPT_INVALID"); safe(execution);
  if (execution.field_count !== admission.command.fields.length || execution.field_roles_sha256 !== digest(admission.command.fields.map(({ role }) => role))
    || execution.final_control_count !== 1 || execution.final_control_invoked !== true || execution.foreground_changed !== false
    || execution.cursor_touched !== false || execution.keyboard_touched !== false || execution.clipboard_touched !== false
    || execution.secret_material_exposed !== false) fail("STEWART_BACKGROUND_CREDENTIAL_EXECUTION_FAILED");
  let provider;
  try {
    provider = await readback(structuredClone(admission.command));
  } catch {
    fail("STEWART_BACKGROUND_CREDENTIAL_READBACK_FAILED");
  }
  exact(provider, READBACK_FIELDS, "STEWART_BACKGROUND_CREDENTIAL_READBACK_INVALID"); safe(provider);
  hashes(provider, ["canonical_origin_sha256", "provider_response_contract_sha256", "provider_state_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256"], "STEWART_BACKGROUND_CREDENTIAL_READBACK_INVALID");
  for (const field of ["canonical_origin_sha256", "provider_response_contract_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256"]) if (provider[field] !== admission.command[field]) fail("STEWART_BACKGROUND_CREDENTIAL_READBACK_CUSTODY_CONFLICT");
  const state = { PROVIDER_ACCEPTED: "SUBMISSION_ACCEPTED", PROVIDER_REJECTED: "SUBMISSION_REJECTED", FACTOR_EMAIL: "FACTOR_EMAIL", FACTOR_PASSWORD: "FACTOR_PASSWORD", FACTOR_SMS: "FACTOR_SMS", FACTOR_DEVICE: "FACTOR_DEVICE", FACTOR_CAPTCHA: "FACTOR_CAPTCHA", OUTCOME_UNKNOWN: "OUTCOME_UNKNOWN" }[provider.response_class];
  if (!state || provider.schema !== "pookakind.stewart-background-credential-provider-readback/v1") fail("STEWART_BACKGROUND_CREDENTIAL_READBACK_INVALID");
  return Object.freeze({ schema: RECEIPT_SCHEMA, state, consume_calls: 1, resolve_calls: handles.length, execution_calls: 1, provider_state_sha256: provider.provider_state_sha256, fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
}
