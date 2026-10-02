import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER = "DISNEY_MYDISNEY";
const ORIGIN = "https://login.disney.com";
const PATH = "/en-US/US/DTCI-MY.ACCOUNT.WEB/interaction";
const INPUT_FIELDS = ["controls", "observed_at", "origin", "pathname", "provider_id", "route_epoch_sha256", "schema"];
const CONTROL_FIELDS = ["disabled", "hasValue", "height", "id", "name", "opacity", "tabIndex", "tag", "text", "type", "visible", "width"];
const PROBE_FIELDS = [
  "classification", "continue_control_count", "continue_control_sha256", "form_sha256",
  "hidden_control_count", "identity_field_count", "identity_field_role_sha256",
  "live_action_performed", "live_execution_ready", "observed_at", "origin_sha256",
  "password_field_count", "pathname_sha256", "provider_id", "route_epoch_sha256",
  "schema", "secret_material_present", "unexpected_field_count",
];
const BINDING_FIELDS = ["account_ref_sha256", "provider_response_contract_sha256", "retained_identity_match_count", "tab_id_sha256"];

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
  return createHash("sha256").update(value).digest("hex");
}

function boundedText(value, maximum, code, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) fail(code);
  return value;
}

function normalizeControl(value) {
  exact(value, CONTROL_FIELDS, "STEWART_DISNEY_LIVE_CONTROL_FIELDS_INVALID");
  const tag = boundedText(value.tag, 12, "STEWART_DISNEY_LIVE_CONTROL_INVALID").toUpperCase();
  const id = boundedText(value.id, 80, "STEWART_DISNEY_LIVE_CONTROL_INVALID", true);
  const name = boundedText(value.name, 80, "STEWART_DISNEY_LIVE_CONTROL_INVALID", true);
  const suppliedType = boundedText(value.type, 32, "STEWART_DISNEY_LIVE_CONTROL_INVALID").toLowerCase();
  const type = tag === "INPUT" && suppliedType === "" ? "text" : suppliedType;
  const text = boundedText(value.text, 120, "STEWART_DISNEY_LIVE_CONTROL_INVALID", true);
  if (!["INPUT", "BUTTON"].includes(tag)
    || typeof value.disabled !== "boolean"
    || typeof value.hasValue !== "boolean"
    || typeof value.visible !== "boolean"
    || !Number.isInteger(value.width) || value.width < 0 || value.width > 10_000
    || !Number.isInteger(value.height) || value.height < 0 || value.height > 10_000
    || typeof value.opacity !== "string" || !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(value.opacity)
    || !Number.isInteger(value.tabIndex) || value.tabIndex < -1 || value.tabIndex > 32_767) {
    fail("STEWART_DISNEY_LIVE_CONTROL_INVALID");
  }
  return { tag, id, name, type, text, disabled: value.disabled, visible: value.visible, width: value.width, height: value.height, opacity: value.opacity, tabIndex: value.tabIndex, hasValue: value.hasValue };
}

function descriptor(control) {
  return digest(JSON.stringify(control));
}

export function compileStewartDisneyLiveSurfaceProbe(input) {
  exact(input, INPUT_FIELDS, "STEWART_DISNEY_LIVE_OBSERVATION_FIELDS_INVALID");
  if (input.schema !== "pookakind.live-provider-surface-observation/v1"
    || input.provider_id !== PROVIDER
    || input.origin !== ORIGIN
    || input.pathname !== PATH
    || (input.route_epoch_sha256 !== null && !HASH.test(input.route_epoch_sha256 ?? ""))
    || !Array.isArray(input.controls) || input.controls.length < 1 || input.controls.length > 20
    || !Number.isFinite(Date.parse(input.observed_at))) {
    fail("STEWART_DISNEY_LIVE_OBSERVATION_INVALID");
  }
  const controls = input.controls.map(normalizeControl);
  if (controls.some((control) => control.hasValue)) fail("STEWART_DISNEY_LIVE_VALUE_BEARING_OBSERVATION_REJECTED");

  const visibleInputs = controls.filter((control) => control.tag === "INPUT" && control.visible);
  const visibleButtons = controls.filter((control) => control.tag === "BUTTON" && control.visible);
  const identity = visibleInputs.filter((control) => control.id === "lookupValue" && control.name === "lookupValue" && control.type === "text");
  const password = visibleInputs.filter((control) => control.type === "password");
  const continuation = visibleButtons.filter((control) => control.id === "id-flow" && control.type === "submit" && control.text === "Continue" && !control.disabled);
  const unexpectedInputs = visibleInputs.filter((control) => !identity.includes(control) && !password.includes(control));
  const routeBound = HASH.test(input.route_epoch_sha256 ?? "");
  const identityPresent = identity.length === 1 && continuation.length === 1 && password.length === 0 && unexpectedInputs.length === 0;
  const classification = identityPresent
    ? routeBound ? "IDENTITY_LOOKUP_READY" : "IDENTITY_LOOKUP_OBSERVED__ROUTE_EPOCH_REQUIRED"
    : password.length > 0 ? "PASSWORD_SURFACE_PRESENT" : "SURFACE_DRIFT";

  return Object.freeze({
    schema: "pookakind.stewart-disney-live-surface-probe/v1",
    provider_id: PROVIDER,
    classification,
    origin_sha256: digest(input.origin),
    pathname_sha256: digest(input.pathname),
    route_epoch_sha256: input.route_epoch_sha256,
    observed_at: new Date(Date.parse(input.observed_at)).toISOString(),
    identity_field_count: identity.length,
    password_field_count: password.length,
    continue_control_count: continuation.length,
    unexpected_field_count: unexpectedInputs.length,
    hidden_control_count: controls.filter((control) => !control.visible).length,
    identity_field_role_sha256: identity.length === 1 ? descriptor(identity[0]) : null,
    continue_control_sha256: continuation.length === 1 ? descriptor(continuation[0]) : null,
    form_sha256: identityPresent ? digest(JSON.stringify([identity[0], continuation[0]])) : null,
    live_execution_ready: identityPresent && routeBound,
    live_action_performed: false,
    secret_material_present: false,
  });
}

export function bindStewartDisneyRecoveryIdentityObservation(probe, binding) {
  exact(probe, PROBE_FIELDS, "STEWART_DISNEY_LIVE_PROBE_FIELDS_INVALID");
  exact(binding, BINDING_FIELDS, "STEWART_DISNEY_LIVE_BINDING_FIELDS_INVALID");
  for (const field of ["account_ref_sha256", "provider_response_contract_sha256", "tab_id_sha256"]) {
    if (!HASH.test(binding[field] ?? "")) fail("STEWART_DISNEY_LIVE_BINDING_INVALID");
  }
  if (binding.retained_identity_match_count !== 1
    || probe.schema !== "pookakind.stewart-disney-live-surface-probe/v1"
    || probe.provider_id !== PROVIDER
    || probe.classification !== "IDENTITY_LOOKUP_READY"
    || probe.live_execution_ready !== true
    || probe.live_action_performed !== false
    || probe.secret_material_present !== false
    || !HASH.test(probe.route_epoch_sha256 ?? "")
    || !HASH.test(probe.form_sha256 ?? "")
    || !HASH.test(probe.identity_field_role_sha256 ?? "")
    || !HASH.test(probe.continue_control_sha256 ?? "")
    || probe.identity_field_count !== 1
    || probe.continue_control_count !== 1
    || probe.password_field_count !== 0
    || probe.unexpected_field_count !== 0) {
    fail("STEWART_DISNEY_LIVE_PROBE_NOT_BINDABLE");
  }
  return Object.freeze({
    schema: "pookakind.stewart-recovery-identity-observation/v1",
    account_ref_sha256: binding.account_ref_sha256,
    canonical_origin_sha256: probe.origin_sha256,
    route_epoch_sha256: probe.route_epoch_sha256,
    tab_id_sha256: binding.tab_id_sha256,
    form_sha256: probe.form_sha256,
    identity_field_role_sha256: probe.identity_field_role_sha256,
    continue_control_sha256: probe.continue_control_sha256,
    provider_response_contract_sha256: binding.provider_response_contract_sha256,
    observed_at: probe.observed_at,
    identity_field_count: 1,
    continue_control_count: 1,
    continue_control_enabled: true,
    unexpected_field_count: 0,
    retained_identity_match_count: 1,
    secret_material_present: false,
  });
}

export function bindStewartDisneyBackgroundIdentityObservation(probe, binding) {
  const recovery = bindStewartDisneyRecoveryIdentityObservation(probe, binding);
  return Object.freeze({
    schema: "pookakind.stewart-background-credential-observation/v1",
    account_ref_sha256: recovery.account_ref_sha256,
    canonical_origin_sha256: recovery.canonical_origin_sha256,
    route_epoch_sha256: recovery.route_epoch_sha256,
    tab_id_sha256: recovery.tab_id_sha256,
    form_sha256: recovery.form_sha256,
    field_controls: Object.freeze([Object.freeze({ role: "IDENTITY", control_sha256: recovery.identity_field_role_sha256 })]),
    final_control_sha256: recovery.continue_control_sha256,
    provider_response_contract_sha256: recovery.provider_response_contract_sha256,
    observed_at: recovery.observed_at,
    final_control_count: 1,
    final_control_enabled: true,
    unexpected_field_count: 0,
    secret_material_present: false,
  });
}
