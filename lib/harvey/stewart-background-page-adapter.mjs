import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MAX_OBSERVATION_AGE_MS = 5_000;
const COMMAND_FIELDS = [
  "account_ref_sha256", "action", "authority_record_sha256", "canonical_origin_sha256",
  "fields", "final_control_sha256", "form_sha256", "max_uses", "operation_id_sha256",
  "operation_kind", "provider_response_contract_sha256", "request_sha256",
  "requires_provider_readback", "route_epoch_sha256", "schema", "secret_material_present",
  "tab_id_sha256",
];
const FIELD_FIELDS = ["control_sha256", "handle_ref_sha256", "role"];
const MATERIAL_FIELDS = ["material", "role"];
const OBSERVATION_FIELDS = [
  "canonical_origin_sha256", "field_controls", "final_control_count", "final_control_enabled",
  "final_control_sha256", "form_sha256", "foreground_unchanged", "observed_at",
  "route_epoch_sha256", "schema", "secret_material_present", "tab_id_sha256",
  "unexpected_field_count",
];
const FILL_RECEIPT_FIELDS = [
  "clipboard_touched", "control_sha256", "cursor_touched", "filled", "foreground_changed",
  "keyboard_touched", "role", "secret_material_exposed", "value_committed",
];
const INVOKE_RECEIPT_FIELDS = [
  "clipboard_touched", "control_sha256", "cursor_touched", "foreground_changed", "invoked",
  "keyboard_touched", "secret_material_exposed",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail(code);
}
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function safeReceipt(value) {
  for (const item of Object.values(value)) {
    if (typeof item === "string" && (containsHarveySecretShape(item) || containsUnsafeHarveyControlCharacters(item))) {
      fail("STEWART_BACKGROUND_PAGE_SECRET_OR_CONTROL_SHAPE_REJECTED");
    }
  }
}
function validateCommand(command) {
  exact(command, COMMAND_FIELDS, "STEWART_BACKGROUND_PAGE_COMMAND_INVALID");
  for (const field of ["account_ref_sha256", "authority_record_sha256", "canonical_origin_sha256", "final_control_sha256", "form_sha256", "operation_id_sha256", "provider_response_contract_sha256", "request_sha256", "route_epoch_sha256", "tab_id_sha256"]) {
    if (!HASH.test(command[field] ?? "")) fail("STEWART_BACKGROUND_PAGE_COMMAND_INVALID");
  }
  if (command.schema !== "pookakind.stewart-background-credential-command/v1"
    || command.action !== "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE"
    || command.max_uses !== 1 || command.requires_provider_readback !== true
    || command.secret_material_present !== false || !Array.isArray(command.fields)
    || command.fields.length < 1 || command.fields.length > 6) fail("STEWART_BACKGROUND_PAGE_COMMAND_INVALID");
  for (const field of command.fields) {
    exact(field, FIELD_FIELDS, "STEWART_BACKGROUND_PAGE_COMMAND_INVALID");
    if (!HASH.test(field.control_sha256 ?? "") || !HASH.test(field.handle_ref_sha256 ?? "")) fail("STEWART_BACKGROUND_PAGE_COMMAND_INVALID");
  }
  const { request_sha256: supplied, ...base } = command;
  if (digest(base) !== supplied) fail("STEWART_BACKGROUND_PAGE_COMMAND_CUSTODY_CONFLICT");
}

export function createStewartBackgroundPageAdapter({ observePage, fillExactField, invokeExactControl, now = () => Date.now() }) {
  if (typeof observePage !== "function" || typeof fillExactField !== "function"
    || typeof invokeExactControl !== "function" || typeof now !== "function") fail("STEWART_BACKGROUND_PAGE_ADAPTER_INVALID");

  return async function executeBackgroundForm({ command, field_material }) {
    const suppliedMaterials = Array.isArray(field_material) ? field_material : null;
    try {
      validateCommand(command);
      if (!suppliedMaterials || suppliedMaterials.length !== command.fields.length) fail("STEWART_BACKGROUND_PAGE_MATERIAL_INVALID");
      const roles = new Set();
      for (let index = 0; index < suppliedMaterials.length; index++) {
        const entry = suppliedMaterials[index]; exact(entry, MATERIAL_FIELDS, "STEWART_BACKGROUND_PAGE_MATERIAL_INVALID");
        if (entry.role !== command.fields[index].role || roles.has(entry.role) || typeof entry.material !== "string"
          || entry.material.length < 1 || entry.material.length > 4_096 || containsUnsafeHarveyControlCharacters(entry.material)) fail("STEWART_BACKGROUND_PAGE_MATERIAL_INVALID");
        if (command.operation_kind === "EMAIL_OTP_SUBMIT" && (!/^EMAIL_OTP_DIGIT_[1-6]$/.test(entry.role) || !/^\d$/.test(entry.material))) fail("STEWART_BACKGROUND_PAGE_MATERIAL_INVALID");
        roles.add(entry.role);
      }

      const observed = await observePage();
    exact(observed, OBSERVATION_FIELDS, "STEWART_BACKGROUND_PAGE_OBSERVATION_INVALID"); safeReceipt(observed);
    if (observed.schema !== "pookakind.stewart-background-page-observation/v1"
      || observed.foreground_unchanged !== true || observed.final_control_count !== 1
      || observed.final_control_enabled !== true || observed.unexpected_field_count !== 0
      || observed.secret_material_present !== false || !Array.isArray(observed.field_controls)
      || observed.field_controls.length !== command.fields.length) fail("STEWART_BACKGROUND_PAGE_SCOPE_INVALID");
    const observedAt = Date.parse(observed.observed_at); const current = now();
    if (!Number.isFinite(observedAt) || !Number.isFinite(current) || observedAt > current
      || current - observedAt > MAX_OBSERVATION_AGE_MS) fail("STEWART_BACKGROUND_PAGE_OBSERVATION_STALE");
    for (const field of ["canonical_origin_sha256", "final_control_sha256", "form_sha256", "route_epoch_sha256", "tab_id_sha256"]) {
      if (observed[field] !== command[field]) fail("STEWART_BACKGROUND_PAGE_CUSTODY_CONFLICT");
    }
    for (let index = 0; index < observed.field_controls.length; index++) {
      exact(observed.field_controls[index], ["control_sha256", "role"], "STEWART_BACKGROUND_PAGE_OBSERVATION_INVALID");
      if (observed.field_controls[index].role !== command.fields[index].role
        || observed.field_controls[index].control_sha256 !== command.fields[index].control_sha256) fail("STEWART_BACKGROUND_PAGE_CUSTODY_CONFLICT");
    }

      for (let index = 0; index < suppliedMaterials.length; index++) {
        let transfer = {
          tab_id_sha256: command.tab_id_sha256,
          route_epoch_sha256: command.route_epoch_sha256,
          form_sha256: command.form_sha256,
          role: command.fields[index].role,
          control_sha256: command.fields[index].control_sha256,
          material: suppliedMaterials[index].material,
        };
        let receipt;
        try {
          receipt = await fillExactField(transfer);
          exact(receipt, FILL_RECEIPT_FIELDS, "STEWART_BACKGROUND_PAGE_FILL_RECEIPT_INVALID"); safeReceipt(receipt);
          if (receipt.role !== command.fields[index].role || receipt.control_sha256 !== command.fields[index].control_sha256
            || receipt.filled !== true || receipt.value_committed !== true || receipt.foreground_changed !== false
            || receipt.cursor_touched !== false || receipt.keyboard_touched !== false || receipt.clipboard_touched !== false
            || receipt.secret_material_exposed !== false) fail("STEWART_BACKGROUND_PAGE_FILL_FAILED");
        } finally {
          transfer.material = null;
          transfer = null;
          suppliedMaterials[index].material = null;
        }
      }

    const invoked = await invokeExactControl({
      tab_id_sha256: command.tab_id_sha256,
      route_epoch_sha256: command.route_epoch_sha256,
      form_sha256: command.form_sha256,
      control_sha256: command.final_control_sha256,
    });
    exact(invoked, INVOKE_RECEIPT_FIELDS, "STEWART_BACKGROUND_PAGE_INVOKE_RECEIPT_INVALID"); safeReceipt(invoked);
    if (invoked.control_sha256 !== command.final_control_sha256 || invoked.invoked !== true
      || invoked.foreground_changed !== false || invoked.cursor_touched !== false
      || invoked.keyboard_touched !== false || invoked.clipboard_touched !== false
      || invoked.secret_material_exposed !== false) fail("STEWART_BACKGROUND_PAGE_INVOKE_FAILED");

      return Object.freeze({
        field_count: command.fields.length,
        field_roles_sha256: digest(command.fields.map(({ role }) => role)),
        final_control_count: 1,
        final_control_invoked: true,
        foreground_changed: false,
        cursor_touched: false,
        keyboard_touched: false,
        clipboard_touched: false,
        secret_material_exposed: false,
      });
    } finally {
      if (suppliedMaterials) for (const entry of suppliedMaterials) if (entry && typeof entry === "object" && Object.hasOwn(entry, "material")) entry.material = null;
    }
  };
}
