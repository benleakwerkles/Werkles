import { createHash } from "node:crypto";

import { compileStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { runStewartGeneralizedNativeHostOperation } from "./stewart-generalized-native-host.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER = "Disney MyDisney";
const PROVIDER_ID = "DISNEY_MYDISNEY";
const SELECTION_RECEIPT_SHA256 = "1520d8ccaa442b70073b39f74790ae7118273c35f2c316d081fd2d7f79cebcd8";
const OTP_ROLES = Object.freeze(Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`));

const INPUT_FIELDS = ["authority_record", "descriptor", "extension_id_sha256", "observation", "operator_authority", "otp_handle", "provider", "schema", "selection_receipt_sha256"];
const HANDLE_FIELDS = ["ref_sha256", "schema"];
const TRANSACTION_FIELDS = ["authority_record", "descriptor", "extension_id_sha256", "generalized_operation", "observation", "operator_authority", "otp_handle", "provider", "provider_id", "requirements", "schema", "selection_receipt_sha256", "state", "transaction_sha256"];
const COMPLETION_INPUT_FIELDS = ["fresh_sign_in_receipt", "otp_receipt", "password_reset_receipt", "schema", "transaction", "vault_reconciliation_receipt"];
const OTP_RECEIPT_FIELDS = ["password_conversion", "provider_state_sha256", "recurring_operation_created", "schema", "secret_material_returned", "state", "transaction_sha256"];
const RESET_FIELDS = ["account_ref_sha256", "password_change_sha256", "provider_id", "provider_state_sha256", "schema", "state", "transaction_sha256"];
const SIGN_IN_FIELDS = ["account_ref_sha256", "credential_method", "fresh", "observed_at", "password_change_sha256", "provider_id", "provider_state_sha256", "schema", "state"];
const VAULT_FIELDS = ["account_ref_sha256", "credential_status", "duplicate_count", "exact_match_count", "observed_at", "password_change_sha256", "provider_id", "readback_sha256", "schema", "vault_item_ref_sha256"];
const FORBIDDEN_KEYS = new Set(["code", "email", "material", "otp", "passcode", "password", "secret", "token", "username", "value"]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}
function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function snapshot(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object") fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(code);
    return keys.map((key) => {
      const descriptor = descriptors[key];
      if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
      return snapshot(descriptor.value, code);
    });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    output[key] = snapshot(descriptor.value, code);
  }
  return output;
}

function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}

function safe(value) {
  if (typeof value === "string") {
    if (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value)) fail("DISNEY_OTP_SECRET_SHAPED_DATA_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) return value.forEach(safe);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) fail("DISNEY_OTP_PRIVATE_FIELD_FORBIDDEN");
    safe(child);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function hashFields(value, fields, code) {
  for (const field of fields) if (!HASH.test(value[field] ?? "")) fail(code);
}

function validateOrderedOtpScope(authority, observation, descriptor, otpHandle) {
  if (authority.operation_kind !== "EMAIL_OTP_SUBMIT" || authority.max_uses !== 1 || authority.fields.length !== 6) fail("DISNEY_OTP_OPERATION_SCOPE_INVALID");
  const authorityRoles = authority.fields.map(({ role }) => role);
  const observedRoles = observation.field_controls?.map(({ role }) => role);
  const descriptorRoles = descriptor.field_descriptors?.map(({ role }) => role);
  if (canonicalJson(authorityRoles) !== canonicalJson(OTP_ROLES)
    || canonicalJson(observedRoles) !== canonicalJson(OTP_ROLES)
    || canonicalJson(descriptorRoles) !== canonicalJson(OTP_ROLES)) fail("DISNEY_OTP_CONTROL_ORDER_INVALID");
  const refs = new Set(authority.fields.map(({ handle_ref_sha256 }) => handle_ref_sha256));
  if (refs.size !== 1 || !refs.has(otpHandle.ref_sha256)) fail("DISNEY_OTP_HANDLE_SUBSTITUTION");
  if (descriptor.final_control_descriptor?.control_sha256 !== authority.final_control_sha256
    || observation.final_control_sha256 !== authority.final_control_sha256
    || observation.final_control_count !== 1 || observation.final_control_enabled !== true) fail("DISNEY_OTP_CONTINUE_CONTROL_INVALID");
  if (authority.canonical_origin_sha256 !== observation.canonical_origin_sha256
    || authority.tab_id_sha256 !== observation.tab_id_sha256
    || authority.form_sha256 !== observation.form_sha256
    || authority.route_epoch_sha256 !== observation.route_epoch_sha256) fail("DISNEY_OTP_PROVIDER_SURFACE_CUSTODY_CONFLICT");
  if (authority.provider_response_contract_sha256 !== digest(descriptor)) fail("DISNEY_OTP_RESPONSE_CONTRACT_CONFLICT");
}

export function compileDisneyMyDisneyEmailOtpTransaction(rawInput, now = Date.now()) {
  const input = snapshot(rawInput, "DISNEY_OTP_INPUT_NOT_PLAIN");
  safe(input);
  exact(input, INPUT_FIELDS, "DISNEY_OTP_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.disney-mydisney-email-otp-input/v1" || input.provider !== PROVIDER
    || input.selection_receipt_sha256 !== SELECTION_RECEIPT_SHA256 || !HASH.test(input.extension_id_sha256 ?? "")) fail("DISNEY_OTP_PROVIDER_SELECTION_INVALID");
  exact(input.otp_handle, HANDLE_FIELDS, "DISNEY_OTP_HANDLE_INVALID");
  if (input.otp_handle.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(input.otp_handle.ref_sha256 ?? "")) fail("DISNEY_OTP_HANDLE_INVALID");
  const generalized = compileStewartBackgroundCredentialOperation({ authorityRecord: input.authority_record, operatorAuthority: input.operator_authority, observation: input.observation, now });
  validateOrderedOtpScope(input.authority_record.payload, input.observation, input.descriptor, input.otp_handle);
  const body = {
    schema: "pookakind.disney-mydisney-email-otp-transaction/v1",
    state: "SOURCE_ONLY_NOT_ACTIVATED",
    provider: PROVIDER,
    provider_id: PROVIDER_ID,
    selection_receipt_sha256: SELECTION_RECEIPT_SHA256,
    authority_record: input.authority_record,
    operator_authority: input.operator_authority,
    observation: input.observation,
    descriptor: input.descriptor,
    extension_id_sha256: input.extension_id_sha256,
    otp_handle: input.otp_handle,
    generalized_operation: generalized,
    requirements: {
      max_uses: 1,
      atomic_consume_before_handle_resolution: true,
      exact_ordered_one_character_controls: 6,
      exact_continue_controls: 1,
      immediate_sanitized_provider_readback: true,
      fresh_independent_sign_in_required: true,
      exact_nonduplicate_vault_reconciliation_required: true,
      otp_output_hash_storage_forbidden: true,
      reset_acceptance_alone_is_conversion: false,
    },
  };
  return deepFreeze({ ...body, transaction_sha256: digest(body) });
}

function validateTransaction(transaction) {
  exact(transaction, TRANSACTION_FIELDS, "DISNEY_OTP_TRANSACTION_FIELDS_INVALID");
  const body = Object.fromEntries(Object.entries(transaction).filter(([key]) => key !== "transaction_sha256"));
  if (transaction.schema !== "pookakind.disney-mydisney-email-otp-transaction/v1"
    || transaction.state !== "SOURCE_ONLY_NOT_ACTIVATED" || transaction.provider !== PROVIDER
    || transaction.provider_id !== PROVIDER_ID || transaction.selection_receipt_sha256 !== SELECTION_RECEIPT_SHA256
    || !HASH.test(transaction.transaction_sha256 ?? "") || digest(body) !== transaction.transaction_sha256) fail("DISNEY_OTP_TRANSACTION_INVALID");
}

export async function runDisneyMyDisneyEmailOtpTransaction({ transaction: rawTransaction, consume, resolveHandle, observeExtension, executeExtension, readExtension, now, randomBytes }) {
  const transaction = snapshot(rawTransaction, "DISNEY_OTP_TRANSACTION_NOT_PLAIN");
  safe(transaction);
  validateTransaction(transaction);
  const receipt = await runStewartGeneralizedNativeHostOperation({
    authorityRecord: transaction.authority_record,
    operatorAuthority: transaction.operator_authority,
    descriptor: transaction.descriptor,
    extension_id_sha256: transaction.extension_id_sha256,
    handles: [transaction.otp_handle],
    observeExtension, executeExtension, readExtension, consume, resolveHandle, now, randomBytes,
  });
  const result = {
    schema: "pookakind.disney-mydisney-email-otp-receipt/v1",
    state: receipt.state,
    transaction_sha256: transaction.transaction_sha256,
    provider_state_sha256: receipt.provider_state_sha256 ?? null,
    password_conversion: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  };
  safe(result);
  return deepFreeze(result);
}

export function projectDisneyMyDisneyPasswordConversion(rawInput) {
  const input = snapshot(rawInput, "DISNEY_COMPLETION_INPUT_NOT_PLAIN");
  safe(input);
  exact(input, COMPLETION_INPUT_FIELDS, "DISNEY_COMPLETION_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.disney-mydisney-password-completion-input/v1") fail("DISNEY_COMPLETION_SCHEMA_INVALID");
  validateTransaction(input.transaction);
  exact(input.otp_receipt, OTP_RECEIPT_FIELDS, "DISNEY_COMPLETION_OTP_RECEIPT_INVALID");
  exact(input.password_reset_receipt, RESET_FIELDS, "DISNEY_COMPLETION_RESET_RECEIPT_INVALID");
  exact(input.fresh_sign_in_receipt, SIGN_IN_FIELDS, "DISNEY_COMPLETION_SIGN_IN_RECEIPT_INVALID");
  exact(input.vault_reconciliation_receipt, VAULT_FIELDS, "DISNEY_COMPLETION_VAULT_RECEIPT_INVALID");
  const otp = input.otp_receipt;
  const reset = input.password_reset_receipt;
  const signIn = input.fresh_sign_in_receipt;
  const vault = input.vault_reconciliation_receipt;
  hashFields(otp, ["provider_state_sha256", "transaction_sha256"], "DISNEY_COMPLETION_OTP_RECEIPT_INVALID");
  hashFields(reset, ["account_ref_sha256", "password_change_sha256", "provider_state_sha256", "transaction_sha256"], "DISNEY_COMPLETION_RESET_RECEIPT_INVALID");
  hashFields(signIn, ["account_ref_sha256", "password_change_sha256", "provider_state_sha256"], "DISNEY_COMPLETION_SIGN_IN_RECEIPT_INVALID");
  hashFields(vault, ["account_ref_sha256", "password_change_sha256", "readback_sha256", "vault_item_ref_sha256"], "DISNEY_COMPLETION_VAULT_RECEIPT_INVALID");
  if (otp.schema !== "pookakind.disney-mydisney-email-otp-receipt/v1" || otp.state !== "SUBMISSION_ACCEPTED"
    || otp.transaction_sha256 !== input.transaction.transaction_sha256 || otp.password_conversion !== false
    || otp.secret_material_returned !== false || otp.recurring_operation_created !== false) fail("DISNEY_COMPLETION_OTP_NOT_ACCEPTED");
  if (reset.schema !== "pookakind.disney-mydisney-password-reset-receipt/v1" || reset.provider_id !== PROVIDER_ID
    || reset.state !== "PROVIDER_PASSWORD_CHANGE_ACCEPTED" || reset.transaction_sha256 !== input.transaction.transaction_sha256) fail("DISNEY_COMPLETION_RESET_NOT_ACCEPTED");
  if (signIn.schema !== "pookakind.disney-mydisney-fresh-sign-in-receipt/v1" || signIn.provider_id !== PROVIDER_ID
    || signIn.state !== "FRESH_SIGN_IN_ACCEPTED" || signIn.fresh !== true || signIn.credential_method !== "BLIND_MASTER_PASSWORD"
    || signIn.account_ref_sha256 !== reset.account_ref_sha256 || signIn.password_change_sha256 !== reset.password_change_sha256
    || !Number.isFinite(Date.parse(signIn.observed_at))) fail("DISNEY_COMPLETION_FRESH_SIGN_IN_MISSING");
  if (vault.schema !== "pookakind.disney-mydisney-vault-reconciliation-receipt/v1" || vault.provider_id !== PROVIDER_ID
    || vault.account_ref_sha256 !== reset.account_ref_sha256 || vault.password_change_sha256 !== reset.password_change_sha256
    || vault.exact_match_count !== 1 || vault.duplicate_count !== 0 || vault.credential_status !== "VERIFIED_CURRENT"
    || !Number.isFinite(Date.parse(vault.observed_at))) fail("DISNEY_COMPLETION_VAULT_NOT_EXACT_NON_DUPLICATE");
  if (Date.parse(signIn.observed_at) <= Date.parse(input.transaction.authority_record.payload.issued_at)
    || Date.parse(vault.observed_at) < Date.parse(signIn.observed_at)) fail("DISNEY_COMPLETION_EVIDENCE_ORDER_INVALID");
  return deepFreeze({
    schema: "pookakind.disney-mydisney-password-conversion/v1",
    state: "CONVERSION_VERIFIED",
    provider: PROVIDER,
    transaction_sha256: input.transaction.transaction_sha256,
    provider_accepted: true,
    fresh_independent_sign_in: true,
    exact_nonduplicate_vault_reconciliation: true,
    fixed: true,
    password_conversion: true,
    secret_material_returned: false,
  });
}
