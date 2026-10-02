import { validateCredentialSourceReadiness } from "./credential-source-readiness.mjs";

export const SWATEYES_PASSWORD_GATE_SCHEMA = "werkles.swateyes.password-gate/v2";
export const SWATEYES_PASSWORD_GATE_DECISION_SCHEMA = "werkles.swateyes.password-gate-decision/v2";

const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$/;
const ACTIONS = new Set(["PASSWORD_CHANGE", "SIGNED_OUT_PASSWORD_SIGN_IN", "WINDOWS_SECURITY_PIN", "VAULT_RECONCILIATION"]);
const GATES = new Set(["PROVIDER_PASSWORD", "WINDOWS_SECURITY", "PROVIDER_CONFIRMATION", "INTERNAL_PERMISSION"]);
const HANDLE_KINDS = new Set(["BLIND_PASSWORD", "BLIND_PIN", "BLIND_USERNAME", "BLIND_CONFIRMATION"]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function exact(value, keys, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
  return value;
}

function id(value, code) {
  if (typeof value !== "string" || !ID.test(value)) fail(code);
  return value;
}

function digest(value, code) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(code);
  return value;
}

function instant(value, code) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) fail(code);
  return Date.parse(value);
}

function normalizeAuthority(value, now) {
  exact(value, ["schema", "receipt_id", "status", "granted_by", "machine", "project_id", "account_scope_sha256", "action", "gate_class", "issued_at", "expires_at", "maximum_uses"], "SWATEYES_PASSWORD_AUTHORITY_INVALID");
  if (value.schema !== "werkles.swateyes.password-authority/v1" || value.status !== "APPROVED" || value.granted_by !== "BEN_OPERATOR" || value.maximum_uses !== 1) fail("SWATEYES_PASSWORD_AUTHORITY_INVALID");
  const issued = instant(value.issued_at, "SWATEYES_PASSWORD_AUTHORITY_INVALID");
  const expires = instant(value.expires_at, "SWATEYES_PASSWORD_AUTHORITY_INVALID");
  if (issued > now || expires <= now || issued >= expires) fail("SWATEYES_PASSWORD_AUTHORITY_EXPIRED_OR_FUTURE");
  if (!ACTIONS.has(value.action) || !GATES.has(value.gate_class)) fail("SWATEYES_PASSWORD_AUTHORITY_INVALID");
  return {
    receipt_id: id(value.receipt_id, "SWATEYES_PASSWORD_AUTHORITY_INVALID"),
    machine: id(value.machine, "SWATEYES_PASSWORD_AUTHORITY_INVALID"),
    project_id: id(value.project_id, "SWATEYES_PASSWORD_AUTHORITY_INVALID"),
    account_scope_sha256: digest(value.account_scope_sha256, "SWATEYES_PASSWORD_AUTHORITY_INVALID"),
    action: value.action,
    gate_class: value.gate_class,
  };
}

function normalizeHandle(value) {
  exact(value, ["handle_id_sha256", "broker_request_sha256", "kind", "raw_secret_present"], "SWATEYES_OPAQUE_HANDLE_INVALID");
  if (value.raw_secret_present !== false || !HANDLE_KINDS.has(value.kind)) fail("SWATEYES_OPAQUE_HANDLE_INVALID");
  return {
    handle_id_sha256: digest(value.handle_id_sha256, "SWATEYES_OPAQUE_HANDLE_INVALID"),
    broker_request_sha256: digest(value.broker_request_sha256, "SWATEYES_OPAQUE_HANDLE_INVALID"),
    kind: value.kind,
    raw_secret_present: false,
  };
}

function normalizeRequest(value, now) {
  exact(value, ["schema", "request_id", "observed_at", "machine", "project_id", "account_scope_sha256", "action", "gate_class", "provider_control_unbypassable", "windows_security_supported_control_proved", "opaque_handle", "credential_source_readiness"], "SWATEYES_PASSWORD_GATE_INVALID");
  if (value.schema !== SWATEYES_PASSWORD_GATE_SCHEMA || typeof value.provider_control_unbypassable !== "boolean" || typeof value.windows_security_supported_control_proved !== "boolean") fail("SWATEYES_PASSWORD_GATE_INVALID");
  if (!ACTIONS.has(value.action) || !GATES.has(value.gate_class)) fail("SWATEYES_PASSWORD_GATE_INVALID");
  const machine = id(value.machine, "SWATEYES_PASSWORD_GATE_INVALID");
  const accountScope = digest(value.account_scope_sha256, "SWATEYES_PASSWORD_GATE_INVALID");
  const credentialSourceReadiness = validateCredentialSourceReadiness(value.credential_source_readiness, {
    machine,
    account_scope_sha256: accountScope,
    now,
    requireReady: false,
  });
  return {
    request_id: id(value.request_id, "SWATEYES_PASSWORD_GATE_INVALID"),
    observed_at: instant(value.observed_at, "SWATEYES_PASSWORD_GATE_INVALID"),
    machine,
    project_id: id(value.project_id, "SWATEYES_PASSWORD_GATE_INVALID"),
    account_scope_sha256: accountScope,
    action: value.action,
    gate_class: value.gate_class,
    provider_control_unbypassable: value.provider_control_unbypassable,
    windows_security_supported_control_proved: value.windows_security_supported_control_proved,
    opaque_handle: normalizeHandle(value.opaque_handle),
    credential_source_readiness: credentialSourceReadiness,
  };
}

function normalizeBroker(value) {
  exact(value, ["schema", "broker_id", "broker_contract_sha256", "dispatch_sha256", "proved", "one_shot"], "SWATEYES_BLIND_BROKER_INVALID");
  if (value.schema !== "werkles.blind-broker-proof/v1" || value.proved !== true || value.one_shot !== true) fail("SWATEYES_BLIND_BROKER_UNPROVED");
  return {
    broker_id: id(value.broker_id, "SWATEYES_BLIND_BROKER_INVALID"),
    broker_contract_sha256: digest(value.broker_contract_sha256, "SWATEYES_BLIND_BROKER_INVALID"),
    dispatch_sha256: digest(value.dispatch_sha256, "SWATEYES_BLIND_BROKER_INVALID"),
  };
}

function boundary() {
  return Object.freeze({
    secret_retrieved: false,
    secret_read: false,
    secret_stored: false,
    secret_logged: false,
    secret_hashed: false,
    credential_typed_by_swateyes: false,
    generic_input_used: false,
    consent_auto_accepted: false,
    windows_security_bypassed: false,
    policy_weakened: false,
    stale_or_ambiguous_credential_selected: false,
    provider_completion_claimed: false,
    conversion_claimed: false,
  });
}

export function decideSwateyesPasswordGate({ request, authority, broker, unspent_authority_receipt_ids, consumed_dispatch_sha256s = [], now = Date.now() }) {
  if (!Number.isFinite(now)
    || !Array.isArray(unspent_authority_receipt_ids)
    || unspent_authority_receipt_ids.some((value) => typeof value !== "string" || !ID.test(value))
    || new Set(unspent_authority_receipt_ids).size !== unspent_authority_receipt_ids.length
    || !Array.isArray(consumed_dispatch_sha256s)
    || consumed_dispatch_sha256s.some((value) => typeof value !== "string" || !SHA256.test(value))) fail("SWATEYES_PASSWORD_GATE_INPUT_INVALID");
  if (new Set(consumed_dispatch_sha256s).size !== consumed_dispatch_sha256s.length) fail("SWATEYES_PASSWORD_GATE_INPUT_INVALID");
  const boundedRequest = normalizeRequest(request, now);
  const boundedAuthority = normalizeAuthority(authority, now);
  if (unspent_authority_receipt_ids.length !== 1 || unspent_authority_receipt_ids[0] !== boundedAuthority.receipt_id) {
    fail("SWATEYES_PASSWORD_AGGREGATE_AUTHORITY_BLOCKED");
  }

  const sameScope = boundedRequest.machine === boundedAuthority.machine
    && boundedRequest.project_id === boundedAuthority.project_id
    && boundedRequest.account_scope_sha256 === boundedAuthority.account_scope_sha256
    && boundedRequest.action === boundedAuthority.action
    && boundedRequest.gate_class === boundedAuthority.gate_class;
  if (!sameScope || Math.abs(boundedRequest.observed_at - now) > 5 * 60 * 1000) fail("SWATEYES_PASSWORD_SCOPE_OR_TIME_MISMATCH");

  const common = {
    schema: SWATEYES_PASSWORD_GATE_DECISION_SCHEMA,
    request_id: boundedRequest.request_id,
    authority_receipt_id: boundedAuthority.receipt_id,
    credential_source_observation_sha256: boundedRequest.credential_source_readiness.observation_sha256,
    authority_boundary: boundary(),
  };

  if (!boundedRequest.credential_source_readiness.ready) {
    return Object.freeze({ ...common, classification: "CREDENTIAL_SOURCE_BLOCKED", broker_route: null, reason: boundedRequest.credential_source_readiness.state });
  }

  if (boundedRequest.provider_control_unbypassable) {
    return Object.freeze({ ...common, classification: "PROVIDER_CONTROL_UNBYPASSABLE", broker_route: null, reason: "The provider requires its own non-automatable control; prior permission does not change provider capability." });
  }
  if (boundedRequest.gate_class === "WINDOWS_SECURITY" && !boundedRequest.windows_security_supported_control_proved) {
    return Object.freeze({ ...common, classification: "TRUE_HUMAN_GATE", broker_route: null, reason: "Exact Windows Security supported-control proof is absent." });
  }

  const boundedBroker = normalizeBroker(broker);
  if (consumed_dispatch_sha256s.includes(boundedBroker.dispatch_sha256)) fail("SWATEYES_PASSWORD_BROKER_REPLAY");
  if (boundedRequest.opaque_handle.broker_request_sha256 !== boundedBroker.dispatch_sha256) fail("SWATEYES_PASSWORD_BROKER_BINDING_INVALID");

  return Object.freeze({
    ...common,
    classification: "REDUNDANT_NON_HUMAN_PERMISSION",
    broker_route: Object.freeze({
      broker_id: boundedBroker.broker_id,
      broker_contract_sha256: boundedBroker.broker_contract_sha256,
      dispatch_sha256: boundedBroker.dispatch_sha256,
      handle_id_sha256: boundedRequest.opaque_handle.handle_id_sha256,
      handle_kind: boundedRequest.opaque_handle.kind,
      credential_source_observation_sha256: boundedRequest.credential_source_readiness.observation_sha256,
      maximum_uses: 1,
    }),
    reason: "Exact prior authority exists; Swateyes may route one opaque operation to the proven blind broker without accessing the credential.",
  });
}
