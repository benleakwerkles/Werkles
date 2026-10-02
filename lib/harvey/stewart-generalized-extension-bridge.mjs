import { createHash, randomBytes as nodeRandomBytes } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MAX_SESSION_MS = 30_000;
const ALLOWED_CLASSES = new Set(["PROVIDER_ACCEPTED", "PROVIDER_REJECTED", "FACTOR_EMAIL", "FACTOR_PASSWORD", "FACTOR_SMS", "FACTOR_DEVICE", "FACTOR_CAPTCHA", "OUTCOME_UNKNOWN"]);
const COMMAND_FIELDS = [
  "account_ref_sha256", "action", "authority_record_sha256", "canonical_origin_sha256",
  "fields", "final_control_sha256", "form_sha256", "max_uses", "operation_id_sha256",
  "operation_kind", "provider_response_contract_sha256", "request_sha256",
  "requires_provider_readback", "route_epoch_sha256", "schema", "secret_material_present",
  "tab_id_sha256",
];
const DESCRIPTOR_FIELDS = ["field_descriptors", "final_control_descriptor", "readback_descriptors", "schema"];
const FIELD_DESCRIPTOR_FIELDS = ["control_sha256", "role", "selector"];
const FINAL_DESCRIPTOR_FIELDS = ["control_sha256", "selector"];
const READBACK_DESCRIPTOR_FIELDS = ["response_class", "selector"];
const SCOPE_FIELDS = [
  "canonical_origin_sha256", "channel_nonce_sha256", "extension_id_sha256", "form_sha256",
  "operation_id_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256",
];
const OBSERVATION_FIELDS = ["field_controls_sha256", "final_control_sha256", "foreground_unchanged", "scope", "sequence", "schema", "unexpected_field_count"];
const EXECUTION_FIELDS = ["field_count", "field_roles_sha256", "final_control_invoked", "foreground_changed", "input_devices_touched", "scope", "secret_material_exposed", "sequence", "schema"];
const READBACK_FIELDS = ["provider_state_sha256", "response_class", "response_contract_sha256", "scope", "sequence", "schema"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function safe(value, code) {
  if (Array.isArray(value)) { for (const item of value) safe(item, code); return; }
  if (value && typeof value === "object") { for (const item of Object.values(value)) safe(item, code); return; }
  if (typeof value === "string" && (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value))) fail(code);
}
function validateSelector(value) {
  if (typeof value !== "string" || value.length < 1 || value.length > 512 || containsUnsafeHarveyControlCharacters(value) || containsHarveySecretShape(value)) fail("STEWART_EXTENSION_DESCRIPTOR_SELECTOR_INVALID");
}
function validateCommand(command) {
  exact(command, COMMAND_FIELDS, "STEWART_EXTENSION_COMMAND_INVALID");
  for (const field of ["canonical_origin_sha256", "form_sha256", "operation_id_sha256", "provider_response_contract_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256"]) if (!HASH.test(command[field] ?? "")) fail("STEWART_EXTENSION_COMMAND_INVALID");
  if (command.schema !== "pookakind.stewart-background-credential-command/v1" || command.action !== "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE" || command.max_uses !== 1 || command.requires_provider_readback !== true || command.secret_material_present !== false || !Array.isArray(command.fields) || command.fields.length < 1 || command.fields.length > 6) fail("STEWART_EXTENSION_COMMAND_INVALID");
  const { request_sha256: supplied, ...base } = command;
  if (digest(base) !== supplied) fail("STEWART_EXTENSION_COMMAND_CUSTODY_CONFLICT");
}
function validateDescriptor(descriptor, command) {
  exact(descriptor, DESCRIPTOR_FIELDS, "STEWART_EXTENSION_DESCRIPTOR_INVALID"); safe(descriptor, "STEWART_EXTENSION_DESCRIPTOR_UNSAFE");
  if (descriptor.schema !== "pookakind.stewart-provider-surface-descriptor/v1" || !Array.isArray(descriptor.field_descriptors) || descriptor.field_descriptors.length !== command.fields.length || !Array.isArray(descriptor.readback_descriptors) || descriptor.readback_descriptors.length < 1 || descriptor.readback_descriptors.length > 7) fail("STEWART_EXTENSION_DESCRIPTOR_INVALID");
  for (let index = 0; index < descriptor.field_descriptors.length; index++) {
    const field = descriptor.field_descriptors[index]; exact(field, FIELD_DESCRIPTOR_FIELDS, "STEWART_EXTENSION_DESCRIPTOR_INVALID"); validateSelector(field.selector);
    if (field.role !== command.fields[index].role || field.control_sha256 !== command.fields[index].control_sha256) fail("STEWART_EXTENSION_DESCRIPTOR_CUSTODY_CONFLICT");
  }
  exact(descriptor.final_control_descriptor, FINAL_DESCRIPTOR_FIELDS, "STEWART_EXTENSION_DESCRIPTOR_INVALID"); validateSelector(descriptor.final_control_descriptor.selector);
  if (descriptor.final_control_descriptor.control_sha256 !== command.final_control_sha256) fail("STEWART_EXTENSION_DESCRIPTOR_CUSTODY_CONFLICT");
  const classes = new Set();
  for (const item of descriptor.readback_descriptors) {
    exact(item, READBACK_DESCRIPTOR_FIELDS, "STEWART_EXTENSION_DESCRIPTOR_INVALID"); validateSelector(item.selector);
    if (!ALLOWED_CLASSES.has(item.response_class) || classes.has(item.response_class)) fail("STEWART_EXTENSION_DESCRIPTOR_INVALID");
    classes.add(item.response_class);
  }
  if (digest(descriptor) !== command.provider_response_contract_sha256) fail("STEWART_EXTENSION_DESCRIPTOR_CUSTODY_CONFLICT");
}
function validateScope(scope, expected) {
  exact(scope, SCOPE_FIELDS, "STEWART_EXTENSION_SCOPE_INVALID");
  for (const field of SCOPE_FIELDS) if (scope[field] !== expected[field]) fail("STEWART_EXTENSION_SCOPE_CONFLICT");
}

export function createStewartGeneralizedExtensionBridgeSession({ command, extension_id_sha256, descriptor, expires_at, now = () => Date.now(), randomBytes = nodeRandomBytes }) {
  validateCommand(command); validateDescriptor(descriptor, command);
  if (!HASH.test(extension_id_sha256 ?? "") || typeof now !== "function" || typeof randomBytes !== "function") fail("STEWART_EXTENSION_SESSION_CONFIG_INVALID");
  const createdAt = now(); const expiresAt = Date.parse(expires_at);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt <= createdAt || expiresAt - createdAt > MAX_SESSION_MS) fail("STEWART_EXTENSION_SESSION_EXPIRY_INVALID");
  const nonce = randomBytes(32);
  if (!Buffer.isBuffer(nonce) || nonce.length !== 32) fail("STEWART_EXTENSION_SESSION_NONCE_INVALID");
  const scope = Object.freeze({
    channel_nonce_sha256: createHash("sha256").update(nonce).digest("hex"), extension_id_sha256,
    operation_id_sha256: command.operation_id_sha256, request_sha256: command.request_sha256,
    tab_id_sha256: command.tab_id_sha256, canonical_origin_sha256: command.canonical_origin_sha256,
    route_epoch_sha256: command.route_epoch_sha256, form_sha256: command.form_sha256,
  });
  nonce.fill(0);
  let state = "AWAITING_OBSERVATION"; let closed = false;
  const checkLive = () => { if (closed) fail("STEWART_EXTENSION_SESSION_CLOSED"); if (now() > expiresAt) { closed = true; state = "CLOSED"; fail("STEWART_EXTENSION_SESSION_EXPIRED"); } };
  const close = () => { closed = true; state = "CLOSED"; };

  return Object.freeze({
    get state() { return state; },
    scope,
    descriptor_sha256: command.provider_response_contract_sha256,
    acceptObservation(frame) {
      checkLive(); if (state !== "AWAITING_OBSERVATION") fail("STEWART_EXTENSION_FRAME_OUT_OF_ORDER");
      exact(frame, OBSERVATION_FIELDS, "STEWART_EXTENSION_OBSERVATION_INVALID"); validateScope(frame.scope, scope);
      if (frame.schema !== "pookakind.stewart-extension-observation/v1" || frame.sequence !== 0 || frame.field_controls_sha256 !== digest(descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 }))) || frame.final_control_sha256 !== command.final_control_sha256 || frame.foreground_unchanged !== true || frame.unexpected_field_count !== 0) { close(); fail("STEWART_EXTENSION_OBSERVATION_INVALID"); }
      state = "READY_TO_EXECUTE"; return true;
    },
    async transmitFieldsOnce({ field_material, send }) {
      checkLive(); if (state !== "READY_TO_EXECUTE" || typeof send !== "function" || !Array.isArray(field_material) || field_material.length !== command.fields.length) fail("STEWART_EXTENSION_EXECUTION_INVALID");
      let frame;
      try {
        const fields = field_material.map((entry, index) => {
          exact(entry, ["material", "role"], "STEWART_EXTENSION_EXECUTION_INVALID");
          if (entry.role !== command.fields[index].role || typeof entry.material !== "string" || entry.material.length < 1 || entry.material.length > 4096 || containsUnsafeHarveyControlCharacters(entry.material)) fail("STEWART_EXTENSION_EXECUTION_INVALID");
          if (command.operation_kind === "EMAIL_OTP_SUBMIT" && (!/^EMAIL_OTP_DIGIT_[1-6]$/.test(entry.role) || !/^\d$/.test(entry.material))) fail("STEWART_EXTENSION_EXECUTION_INVALID");
          return { role: entry.role, material: entry.material };
        });
        frame = { schema: "pookakind.stewart-extension-execute-fields/v1", sequence: 1, scope, descriptor_sha256: command.provider_response_contract_sha256, fields };
        state = "AWAITING_EXECUTION_RECEIPT";
        const receipt = await send(frame);
        exact(receipt, EXECUTION_FIELDS, "STEWART_EXTENSION_EXECUTION_RECEIPT_INVALID"); safe(receipt, "STEWART_EXTENSION_EXECUTION_RECEIPT_UNSAFE"); validateScope(receipt.scope, scope);
        if (receipt.schema !== "pookakind.stewart-extension-execution-receipt/v1" || receipt.sequence !== 2 || receipt.field_count !== command.fields.length || receipt.field_roles_sha256 !== digest(command.fields.map(({ role }) => role)) || receipt.final_control_invoked !== true || receipt.foreground_changed !== false || receipt.input_devices_touched !== false || receipt.secret_material_exposed !== false) { close(); fail("STEWART_EXTENSION_EXECUTION_RECEIPT_INVALID"); }
        state = "READY_FOR_READBACK"; return true;
      } catch (error) { close(); throw error; }
      finally {
        if (frame?.fields) for (const entry of frame.fields) entry.material = null;
        if (Array.isArray(field_material)) for (const entry of field_material) if (entry && typeof entry === "object" && Object.hasOwn(entry, "material")) entry.material = null;
        frame = null;
      }
    },
    async requestReadback(send) {
      checkLive(); if (state !== "READY_FOR_READBACK" || typeof send !== "function") fail("STEWART_EXTENSION_READBACK_INVALID");
      state = "AWAITING_PROVIDER_READBACK";
      try {
        const result = await send({ schema: "pookakind.stewart-extension-readback-request/v1", sequence: 3, scope, descriptor_sha256: command.provider_response_contract_sha256 });
        exact(result, READBACK_FIELDS, "STEWART_EXTENSION_READBACK_INVALID"); safe(result, "STEWART_EXTENSION_READBACK_UNSAFE"); validateScope(result.scope, scope);
        if (result.schema !== "pookakind.stewart-extension-provider-readback/v1" || result.sequence !== 4 || result.response_contract_sha256 !== command.provider_response_contract_sha256 || !HASH.test(result.provider_state_sha256 ?? "") || !ALLOWED_CLASSES.has(result.response_class)) fail("STEWART_EXTENSION_READBACK_INVALID");
        close();
        return Object.freeze({ schema: "pookakind.stewart-generalized-extension-bridge-receipt/v1", state: "TERMINAL", response_class: result.response_class, provider_state_sha256: result.provider_state_sha256, terminal_receipt_sha256: digest(result), fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
      } catch (error) { close(); throw error; }
    },
    close,
  });
}
