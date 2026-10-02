import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import {
  containsHarveySecretShape,
  containsUnsafeHarveyControlCharacters,
} from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MAX_AGE_MS = 30_000;
const OBSERVATION_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "final_control_count",
  "final_control_enabled", "final_control_sha256", "form_sha256",
  "observed_at", "password_field_count", "route_epoch_sha256", "schema",
  "secret_material_present", "tab_id_sha256",
];
const AUTHORITY_FIELDS = [
  "account_ref_sha256", "canonical_origin_sha256", "expires_at",
  "extension_id_sha256", "final_control_sha256", "form_sha256",
  "issued_at", "live_provider_mutation_authorized", "max_uses",
  "operation_id_sha256", "route_epoch_sha256", "schema", "tab_id_sha256",
];
const COMMAND_FIELDS = [
  "account_ref_sha256", "action", "canonical_origin_sha256",
  "extension_id_sha256", "final_control_sha256", "form_sha256", "max_uses",
  "operation_id_sha256", "request_sha256", "requires_provider_readback",
  "route_epoch_sha256", "schema", "secret_material_present", "tab_id_sha256",
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

function hashes(value, fields, code) {
  for (const field of fields) if (!HASH.test(value[field] ?? "")) fail(code);
}

function safe(value) {
  for (const item of Object.values(value)) {
    if (typeof item === "string" && (containsHarveySecretShape(item) || containsUnsafeHarveyControlCharacters(item))) {
      fail("BACKGROUND_FINAL_CONTROL_SECRET_OR_CONTROL_SHAPE_REJECTED");
    }
  }
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function time(value, code) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) fail(code);
  return parsed;
}

export function compileBackgroundFinalControl({ authority, observation, now = Date.now() }) {
  exact(authority, AUTHORITY_FIELDS, "BACKGROUND_FINAL_CONTROL_AUTHORITY_FIELDS_INVALID");
  exact(observation, OBSERVATION_FIELDS, "BACKGROUND_FINAL_CONTROL_OBSERVATION_FIELDS_INVALID");
  safe(authority);
  safe(observation);
  hashes(authority, [
    "account_ref_sha256", "canonical_origin_sha256", "extension_id_sha256",
    "final_control_sha256", "form_sha256", "operation_id_sha256",
    "route_epoch_sha256", "tab_id_sha256",
  ], "BACKGROUND_FINAL_CONTROL_AUTHORITY_DIGEST_INVALID");
  hashes(observation, [
    "account_ref_sha256", "canonical_origin_sha256", "final_control_sha256",
    "form_sha256", "route_epoch_sha256", "tab_id_sha256",
  ], "BACKGROUND_FINAL_CONTROL_OBSERVATION_DIGEST_INVALID");
  if (
    authority.schema !== "pookakind.background-final-control-authority/v1"
    || observation.schema !== "pookakind.background-final-control-observation/v1"
    || authority.max_uses !== 1
    || observation.password_field_count !== 2
    || observation.final_control_count !== 1
    || observation.final_control_enabled !== true
    || observation.secret_material_present !== false
  ) fail("BACKGROUND_FINAL_CONTROL_SCOPE_INVALID");
  const issuedAt = time(authority.issued_at, "BACKGROUND_FINAL_CONTROL_AUTHORITY_TIME_INVALID");
  const expiresAt = time(authority.expires_at, "BACKGROUND_FINAL_CONTROL_AUTHORITY_TIME_INVALID");
  const observedAt = time(observation.observed_at, "BACKGROUND_FINAL_CONTROL_OBSERVATION_TIME_INVALID");
  if (issuedAt > now || expiresAt < now || expiresAt <= issuedAt || expiresAt - issuedAt > MAX_AGE_MS) fail("BACKGROUND_FINAL_CONTROL_AUTHORITY_STALE");
  if (observedAt > now || now - observedAt > MAX_AGE_MS) fail("BACKGROUND_FINAL_CONTROL_OBSERVATION_STALE");
  for (const field of [
    "account_ref_sha256", "canonical_origin_sha256", "final_control_sha256",
    "form_sha256", "route_epoch_sha256", "tab_id_sha256",
  ]) if (authority[field] !== observation[field]) fail("BACKGROUND_FINAL_CONTROL_CUSTODY_CONFLICT");
  if (authority.live_provider_mutation_authorized !== true) {
    return {
      schema: "pookakind.background-final-control-admission/v1",
      decision: "PREPARED_NOT_ACTIVATED",
      reason: "LIVE_PROVIDER_MUTATION_AUTHORITY_REQUIRED",
      request_sha256: digest({ authority, observation }),
      command: null,
    };
  }
  const commandBase = {
    schema: "pookakind.background-final-control-command/v1",
    action: "INVOKE_EXACT_BACKGROUND_FINAL_CONTROL_ONCE",
    operation_id_sha256: authority.operation_id_sha256,
    extension_id_sha256: authority.extension_id_sha256,
    tab_id_sha256: authority.tab_id_sha256,
    canonical_origin_sha256: authority.canonical_origin_sha256,
    route_epoch_sha256: authority.route_epoch_sha256,
    account_ref_sha256: authority.account_ref_sha256,
    form_sha256: authority.form_sha256,
    final_control_sha256: authority.final_control_sha256,
    max_uses: 1,
    secret_material_present: false,
    requires_provider_readback: true,
  };
  const requestSha256 = digest(commandBase);
  return {
    schema: "pookakind.background-final-control-admission/v1",
    decision: "EXECUTE_ONCE",
    reason: "EXACT_BACKGROUND_FINAL_CONTROL_AUTHORIZED",
    request_sha256: requestSha256,
    command: { ...commandBase, request_sha256: requestSha256 },
  };
}

export async function runBackgroundFinalControl({ command, consume, invoke, readback }) {
  exact(command, COMMAND_FIELDS, "BACKGROUND_FINAL_CONTROL_COMMAND_FIELDS_INVALID");
  safe(command);
  hashes(command, [
    "account_ref_sha256", "canonical_origin_sha256", "extension_id_sha256",
    "final_control_sha256", "form_sha256", "operation_id_sha256",
    "request_sha256", "route_epoch_sha256", "tab_id_sha256",
  ], "BACKGROUND_FINAL_CONTROL_COMMAND_DIGEST_INVALID");
  const { request_sha256: suppliedRequest, ...unsigned } = command;
  if (
    command.schema !== "pookakind.background-final-control-command/v1"
    || command.action !== "INVOKE_EXACT_BACKGROUND_FINAL_CONTROL_ONCE"
    || command.max_uses !== 1
    || command.secret_material_present !== false
    || command.requires_provider_readback !== true
    || digest(unsigned) !== suppliedRequest
  ) fail("BACKGROUND_FINAL_CONTROL_COMMAND_INVALID");
  if (typeof consume !== "function" || typeof invoke !== "function" || typeof readback !== "function") fail("BACKGROUND_FINAL_CONTROL_EXECUTOR_INVALID");
  if (!consume(command.operation_id_sha256)) return { state: "ALREADY_CONSUMED", invoke_calls: 0, fixed: false };
  const invoked = await invoke(structuredClone(command));
  exact(invoked, ["control_count", "foreground_changed", "invoked", "secret_material_exposed"], "BACKGROUND_FINAL_CONTROL_INVOKE_RECEIPT_INVALID");
  if (invoked.control_count !== 1 || invoked.invoked !== true || invoked.foreground_changed !== false || invoked.secret_material_exposed !== false) {
    fail("BACKGROUND_FINAL_CONTROL_INVOKE_FAILED");
  }
  const provider = await readback();
  exact(provider, ["provider_state_sha256", "terminal_state"], "BACKGROUND_FINAL_CONTROL_READBACK_INVALID");
  hashes(provider, ["provider_state_sha256"], "BACKGROUND_FINAL_CONTROL_READBACK_INVALID");
  const terminal = {
    PROVIDER_ACCEPTED: "COMMITTED_VERIFIED",
    PROVIDER_REJECTED: "COMMITTED_REJECTED",
    OUTCOME_UNPROVEN: "COMMITTED_OUTCOME_UNPROVEN",
  }[provider.terminal_state];
  if (!terminal) fail("BACKGROUND_FINAL_CONTROL_READBACK_INVALID");
  return { state: terminal, invoke_calls: 1, provider_state_sha256: provider.provider_state_sha256, fixed: false };
}
