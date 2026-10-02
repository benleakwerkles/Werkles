import { createHash } from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const WINDOW_CLASS = "Credential Dialog Xaml Host";
const FIELDS = ["activation_driver_sha256", "expires_at", "hwnd", "machine_sha256", "observed_at", "operation_id_sha256", "package_sha256", "process_id", "route_epoch_sha256", "schema", "session_nonce_sha256", "window_class"];
const OBSERVATION_FIELDS = ["hwnd", "observed_at", "process_id", "schema", "window_class"];
const RECEIPT_FIELDS = ["activation_driver_sha256", "authenticode_signer_thumbprint", "classification", "control_classes", "controls_invoked", "foreground_changed", "hwnd", "invokable_pattern_count", "names_read", "operation_id_sha256", "package_sha256", "process_id", "route_epoch_sha256", "schema", "secret_accessed", "secure_program_files_path", "session_nonce_sha256", "state", "token_uiaccess", "values_read", "values_written", "window_class", "writable_value_pattern_count"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value) { if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().some((key, index) => key !== [...FIELDS].sort()[index]) || Object.keys(value).length !== FIELDS.length) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_REQUEST_INVALID"); }
function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function routeEpoch(value) { return digest(`pookakind:credential-ui-route:v1|${value.machine_sha256}|${value.process_id}|${value.hwnd}|${value.window_class}|${value.observed_at}`); }

export function compileStewartWindowsSecurityCredentialUiObservation(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("STEWART_WINDOWS_SECURITY_CREDENTIAL_UI_OBSERVATION_INVALID");
  const keys = Object.keys(value).sort(); const expected = [...OBSERVATION_FIELDS].sort(); if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) fail("STEWART_WINDOWS_SECURITY_CREDENTIAL_UI_OBSERVATION_INVALID");
  const observed = Date.parse(value.observed_at);
  if (value.schema !== "pookakind.stewart-windows-security-credential-ui-observation/v1" || !Number.isSafeInteger(value.process_id) || value.process_id <= 0 || typeof value.hwnd !== "string" || !/^[1-9][0-9]{0,19}$/.test(value.hwnd) || value.window_class !== WINDOW_CLASS || !Number.isFinite(observed) || observed > now + 2_000 || now - observed > 15_000) fail("STEWART_WINDOWS_SECURITY_CREDENTIAL_UI_OBSERVATION_INVALID");
  return Object.freeze({ ...value });
}

export function compileStewartWindowsSecurityReadOnlyCapabilityProbeRequest(value, now = Date.now()) {
  exact(value);
  const observed = Date.parse(value.observed_at); const expires = Date.parse(value.expires_at);
  if (value.schema !== "pookakind.stewart-windows-security-read-only-capability-probe-request/v1"
    || ![value.machine_sha256, value.operation_id_sha256, value.package_sha256, value.activation_driver_sha256, value.session_nonce_sha256, value.route_epoch_sha256].every((item) => HASH.test(item ?? ""))
    || !Number.isSafeInteger(value.process_id) || value.process_id <= 0
    || typeof value.hwnd !== "string" || !/^[1-9][0-9]{0,19}$/.test(value.hwnd)
    || value.window_class !== WINDOW_CLASS
    || !Number.isFinite(observed) || !Number.isFinite(expires) || observed > now + 2_000 || expires <= observed || expires - observed > 15_000 || expires <= now
    || value.route_epoch_sha256 !== routeEpoch(value)) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_REQUEST_INVALID");
  return Object.freeze({ ...value });
}

export function createStewartWindowsSecurityReadOnlyCapabilityProbeRequest({ observation, machine_sha256, operation_id_sha256, package_sha256, activation_driver_sha256, session_nonce_sha256, now = Date.now(), ttl_ms = 15_000 }) {
  const observed = compileStewartWindowsSecurityCredentialUiObservation(observation, now); const observed_at = observed.observed_at;
  const value = { schema: "pookakind.stewart-windows-security-read-only-capability-probe-request/v1", machine_sha256, process_id: observed.process_id, hwnd: observed.hwnd, window_class: observed.window_class, route_epoch_sha256: "", operation_id_sha256, package_sha256, activation_driver_sha256, session_nonce_sha256, observed_at, expires_at: new Date(Math.min(Date.parse(observed_at) + 15_000, now + ttl_ms)).toISOString() };
  value.route_epoch_sha256 = routeEpoch(value);
  return compileStewartWindowsSecurityReadOnlyCapabilityProbeRequest(value, now);
}

export function classifyStewartWindowsSecurityReadOnlyCapability({ drift = false, writable_value_pattern_count, invokable_pattern_count }) {
  if (drift === true) return "DRIFT";
  if (!Number.isSafeInteger(writable_value_pattern_count) || writable_value_pattern_count < 0 || !Number.isSafeInteger(invokable_pattern_count) || invokable_pattern_count < 0) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_COUNTS_INVALID");
  if (writable_value_pattern_count === 0 && invokable_pattern_count === 0) return "ZERO_CONTROLS";
  if (writable_value_pattern_count === 1 && invokable_pattern_count === 1) return "EXACT_ONE_VALUE_AND_INVOKE";
  return "AMBIGUOUS";
}

export function verifyStewartWindowsSecurityReadOnlyCapabilityProbeReceipt(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_RECEIPT_INVALID");
  const keys = Object.keys(value).sort(); const fields = [...RECEIPT_FIELDS].sort(); if (keys.length !== fields.length || keys.some((key, index) => key !== fields[index])) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_RECEIPT_INVALID");
  const classes = value.control_classes; if (!classes || typeof classes !== "object" || Array.isArray(classes) || Object.keys(classes).sort().join("|") !== "button|edit|other" || ![classes.edit, classes.button, classes.other].every((count) => Number.isSafeInteger(count) && count >= 0)) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_RECEIPT_INVALID");
  const drift = value.classification === "DRIFT"; const classified = classifyStewartWindowsSecurityReadOnlyCapability({ drift, writable_value_pattern_count: value.writable_value_pattern_count, invokable_pattern_count: value.invokable_pattern_count });
  if (value.schema !== "pookakind.stewart-windows-security-read-only-capability-probe-receipt/v1" || value.state !== "READ_ONLY_CREDENTIAL_UI_CAPABILITY_CLASSIFIED" || value.classification !== classified
    || value.operation_id_sha256 !== expected.operation_id_sha256 || value.package_sha256 !== expected.package_sha256 || value.activation_driver_sha256 !== expected.activation_driver_sha256 || value.session_nonce_sha256 !== expected.session_nonce_sha256 || value.route_epoch_sha256 !== expected.route_epoch_sha256 || value.process_id !== expected.process_id || value.hwnd !== expected.hwnd || value.window_class !== WINDOW_CLASS
    || value.token_uiaccess !== true || value.authenticode_signer_thumbprint !== expected.authenticode_signer_thumbprint || value.secure_program_files_path !== true
    || value.names_read !== false || value.values_read !== false || value.values_written !== false || value.controls_invoked !== false || value.foreground_changed !== false || value.secret_accessed !== false) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_RECEIPT_INVALID");
  if (drift && (classes.edit !== 0 || classes.button !== 0 || classes.other !== 0 || value.writable_value_pattern_count !== 0 || value.invokable_pattern_count !== 0)) fail("STEWART_WINDOWS_SECURITY_READ_ONLY_PROBE_RECEIPT_INVALID");
  return true;
}
