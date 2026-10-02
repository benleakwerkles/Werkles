import { createHash } from "node:crypto";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";
import { compileExactOneVaultMetadataProposal } from "./vault-exact-one-metadata-proposal.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ACCOUNT = /^acct_[A-Za-z0-9_-]{22,96}$/;
const ITEM = /^item_[A-Za-z0-9_-]{22,96}$/;
const SCOPE = /^vaultscope_[A-Za-z0-9_-]{22,96}$/;
const MAX_AGE = 30_000;
const UNSUPPORTED_CLI = "OP_CLI_HAS_NO_EXACT_SENSITIVE_FIELD_STDIN_API__TEMPLATE_STDIN_REQUIRES_WHOLE_ITEM_AND_CAN_OVERWRITE_PASSKEYS";
const AUTH_FIELDS = ["account_ref", "credential_change_ref_sha256", "credential_handle_ref_sha256", "expected_item_category", "expected_item_version", "expires_at", "issued_at", "live_credential_save_authorized", "machine_sha256", "max_uses", "native_save_control_sha256", "operation_id_sha256", "provider_id", "route_epoch_sha256", "schema", "target_field_ref_sha256", "vault_item_ref", "vault_scope_ref", "work_object_id"];
const INPUT_FIELDS = ["access_steward_authority", "access_steward_record", "credential_handle", "exact_one_proposal_input", "expected_machine_sha256", "expected_route_epoch_sha256", "native_observation_record", "now", "operator_authority", "operator_record", "schema"];
const PIN_FIELDS = ["public_key_pem", "public_key_sha256"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); const a = Object.keys(value).sort(); const e = [...fields].sort(); if (a.length !== e.length || a.some((key, i) => key !== e[i])) fail(code); }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function clone(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object" || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value); const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(code);
    return keys.map((key) => { const descriptor = descriptors[key]; if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code); return clone(descriptor.value, code); });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) { if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code); output[key] = clone(descriptor.value, code); }
  return output;
}
function pin(value, code) { exact(value, PIN_FIELDS, code); if (!HASH.test(value.public_key_sha256 ?? "") || keyFingerprint(value.public_key_pem) !== value.public_key_sha256) fail(code); }
function fresh(payload, now, code) { const issued = Date.parse(payload.issued_at); const expires = Date.parse(payload.expires_at); if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > now || expires < now || expires <= issued || expires - issued > MAX_AGE) fail(code); }
function audience(prefix, payload) { return `${prefix}:${payload.operation_id_sha256}:${payload.provider_id}:${payload.work_object_id}:${payload.vault_scope_ref}:${payload.account_ref}:${payload.vault_item_ref}:${payload.credential_change_ref_sha256}:${payload.machine_sha256}:${payload.route_epoch_sha256}`; }
function validateAuthority(payload, now, code) {
  exact(payload, AUTH_FIELDS, code);
  for (const field of ["credential_change_ref_sha256", "credential_handle_ref_sha256", "machine_sha256", "native_save_control_sha256", "operation_id_sha256", "route_epoch_sha256", "target_field_ref_sha256"]) if (!HASH.test(payload[field] ?? "")) fail(code);
  if (payload.schema !== "pookakind.vault-exact-one-credential-save-authority/v1" || !ACCOUNT.test(payload.account_ref ?? "") || !ITEM.test(payload.vault_item_ref ?? "") || !SCOPE.test(payload.vault_scope_ref ?? "") || payload.max_uses !== 1 || typeof payload.live_credential_save_authorized !== "boolean") fail(code);
  if (!Number.isSafeInteger(payload.expected_item_version) || payload.expected_item_version < 1 || !["Login", "Password"].includes(payload.expected_item_category)) fail(code);
  fresh(payload, now, code);
}
function observationAudience(payload) { return `vault-exact-one-credential-save-observation:${audience("scope", payload)}`; }

export function compileExactOneVaultCredentialSaveOnce(rawInput, options = {}) {
  const input = clone(rawInput, "VAULT_CREDENTIAL_SAVE_INPUT_NOT_CLONEABLE");
  exact(input, INPUT_FIELDS, "VAULT_CREDENTIAL_SAVE_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.vault-exact-one-credential-save-input/v1" || !Number.isFinite(input.now)) fail("VAULT_CREDENTIAL_SAVE_INPUT_INVALID");
  pin(input.operator_authority, "VAULT_CREDENTIAL_SAVE_OPERATOR_PIN_INVALID");
  pin(input.access_steward_authority, "VAULT_CREDENTIAL_SAVE_STEWARD_PIN_INVALID");
  if (input.operator_authority.public_key_sha256 === input.access_steward_authority.public_key_sha256) fail("VAULT_CREDENTIAL_SAVE_AUTHORITY_COLLAPSE");
  const compileProposal = options.compileProposal ?? compileExactOneVaultMetadataProposal;
  const proposal = compileProposal(input.exact_one_proposal_input);
  if (proposal?.schema !== "pookakind.vault-exact-one-metadata-proposal-result/v1" || proposal.candidate?.provider_id === undefined) fail("VAULT_CREDENTIAL_SAVE_EXACT_ONE_PROPOSAL_INVALID");
  const accountOutput = input.exact_one_proposal_input.account_custodian_output;
  const sensorOutput = input.exact_one_proposal_input.vault_metadata_sensor_output;
  const join = input.exact_one_proposal_input.provider_reconciliation_receipt?.join_receipt;
  if (sensorOutput?.visibility_limit !== "FULL_AUTHORIZED_METADATA_SCOPE" || join?.classification !== "EXACT_ONE" || join?.visible_match_count !== 1 || join?.ambiguity_called_duplicate !== false) fail("VAULT_CREDENTIAL_SAVE_FULL_EXACT_ONE_REQUIRED");
  const accountRef = accountOutput?.account_ref;
  const matches = sensorOutput?.vault_visibility_record?.payload?.matches;
  const exactMatches = Array.isArray(matches) ? matches.filter((entry) => entry.account_ref === accountRef) : [];
  if (!ACCOUNT.test(accountRef ?? "") || exactMatches.length !== 1 || !ITEM.test(exactMatches[0].vault_item_ref ?? "") || digest(exactMatches[0].vault_item_ref) !== proposal.candidate.item_ref_sha256) fail("VAULT_CREDENTIAL_SAVE_OPAQUE_BINDING_INVALID");
  const providerId = proposal.candidate.provider_id; const workObjectId = proposal.candidate.work_object_id; const vaultScopeRef = proposal.candidate.vault_scope_ref; const vaultItemRef = exactMatches[0].vault_item_ref;
  const operatorPayload = verifyDurableRecord(input.operator_authority.public_key_pem, input.operator_record, { issuer: "pookakind-operator", audience: audience("vault-exact-one-credential-save-operator", input.operator_record.payload) });
  const stewardPayload = verifyDurableRecord(input.access_steward_authority.public_key_pem, input.access_steward_record, { issuer: "pookakind-access-steward", audience: audience("vault-exact-one-credential-save-steward", input.access_steward_record.payload) });
  validateAuthority(operatorPayload, input.now, "VAULT_CREDENTIAL_SAVE_OPERATOR_AUTHORITY_INVALID"); validateAuthority(stewardPayload, input.now, "VAULT_CREDENTIAL_SAVE_STEWARD_AUTHORITY_INVALID");
  if (canonicalJson(operatorPayload) !== canonicalJson(stewardPayload) || operatorPayload.provider_id !== providerId || operatorPayload.work_object_id !== workObjectId || operatorPayload.vault_scope_ref !== vaultScopeRef || operatorPayload.account_ref !== accountRef || operatorPayload.vault_item_ref !== vaultItemRef || operatorPayload.machine_sha256 !== input.expected_machine_sha256 || operatorPayload.route_epoch_sha256 !== input.expected_route_epoch_sha256) fail("VAULT_CREDENTIAL_SAVE_AUTHORITY_SCOPE_CONFLICT");
  exact(input.credential_handle, ["ref_sha256", "schema"], "VAULT_CREDENTIAL_SAVE_HANDLE_INVALID");
  if (input.credential_handle.schema !== "pookakind.stewart-opaque-credential-handle/v1" || input.credential_handle.ref_sha256 !== operatorPayload.credential_handle_ref_sha256) fail("VAULT_CREDENTIAL_SAVE_HANDLE_CUSTODY_CONFLICT");
  const observation = verifyDurableRecord(input.access_steward_authority.public_key_pem, input.native_observation_record, { issuer: "pookakind-access-steward", audience: observationAudience(operatorPayload) });
  exact(observation, ["account_ref", "credential_field_count", "foreground_changed", "generic_input_devices_used", "machine_sha256", "native_save_control_sha256", "observed_at", "operation_id_sha256", "prompt_free", "provider_id", "route_epoch_sha256", "save_control_count", "save_control_enabled", "schema", "secret_material_output", "vault_item_ref", "vault_scope_ref", "work_object_id"], "VAULT_CREDENTIAL_SAVE_OBSERVATION_INVALID");
  const observedAt = Date.parse(observation.observed_at);
  if (observation.schema !== "pookakind.vault-exact-one-credential-save-observation/v1" || observation.account_ref !== accountRef || observation.vault_item_ref !== vaultItemRef || observation.provider_id !== providerId || observation.work_object_id !== workObjectId || observation.vault_scope_ref !== vaultScopeRef || observation.operation_id_sha256 !== operatorPayload.operation_id_sha256 || observation.machine_sha256 !== input.expected_machine_sha256 || observation.route_epoch_sha256 !== input.expected_route_epoch_sha256 || observation.native_save_control_sha256 !== operatorPayload.native_save_control_sha256 || observation.credential_field_count !== 1 || observation.save_control_count !== 1 || observation.save_control_enabled !== true || observation.prompt_free !== true || observation.foreground_changed !== false || observation.generic_input_devices_used !== false || observation.secret_material_output !== false || !Number.isFinite(observedAt) || observedAt > input.now || input.now - observedAt > MAX_AGE) fail("VAULT_CREDENTIAL_SAVE_OBSERVATION_INVALID");
  const live = operatorPayload.live_credential_save_authorized === true;
  const command = live ? { schema: "pookakind.vault-exact-one-credential-save-command/v1", operation_id_sha256: operatorPayload.operation_id_sha256, provider_id: providerId, work_object_id: workObjectId, vault_scope_ref: vaultScopeRef, account_ref: accountRef, vault_item_ref: vaultItemRef, credential_change_ref_sha256: operatorPayload.credential_change_ref_sha256, credential_handle_ref_sha256: operatorPayload.credential_handle_ref_sha256, target_field_ref_sha256: operatorPayload.target_field_ref_sha256, expected_item_version: operatorPayload.expected_item_version, expected_item_category: operatorPayload.expected_item_category, machine_sha256: operatorPayload.machine_sha256, route_epoch_sha256: operatorPayload.route_epoch_sha256, native_save_control_sha256: operatorPayload.native_save_control_sha256, max_uses: 1 } : null;
  const body = { schema: "pookakind.vault-exact-one-credential-save-admission/v1", decision: live ? "EXECUTE_ONCE" : "PREPARED_NOT_ACTIVATED", reason: live ? "SEPARATE_OPERATOR_AND_ACCESS_STEWARD_AUTHORITY_VERIFIED" : "LIVE_CREDENTIAL_SAVE_NOT_AUTHORIZED", command, exact_one_proposal_sha256: digest(proposal), operator_record_sha256: digest(input.operator_record), access_steward_record_sha256: digest(input.access_steward_record), observation_record_sha256: digest(input.native_observation_record), fixed: false, password_conversion_claimed: false, secret_material_returned: false };
  return freeze({ ...body, admission_sha256: digest(body) });
}

function validateReadback(value, command) {
  exact(value, ["account_ref", "credential_change_ref_sha256", "credential_status", "duplicate_count", "exact_match_count", "provider_id", "readback_sha256", "schema", "secret_material_output", "vault_item_ref", "vault_scope_ref", "work_object_id"], "VAULT_CREDENTIAL_SAVE_READBACK_INVALID");
  if (value.schema !== "pookakind.vault-exact-one-credential-save-readback/v1" || value.provider_id !== command.provider_id || value.work_object_id !== command.work_object_id || value.vault_scope_ref !== command.vault_scope_ref || value.account_ref !== command.account_ref || value.vault_item_ref !== command.vault_item_ref || value.credential_change_ref_sha256 !== command.credential_change_ref_sha256 || value.exact_match_count !== 1 || value.duplicate_count !== 0 || value.credential_status !== "VERIFIED_CURRENT" || value.secret_material_output !== false || !HASH.test(value.readback_sha256 ?? "")) fail("VAULT_CREDENTIAL_SAVE_READBACK_INVALID");
}

const TERMINAL_RECEIPT_FIELDS = ["account_ref", "admission_sha256", "credential_change_ref_sha256", "credential_status", "duplicate_count", "exact_match_count", "fixed", "operation_id_sha256", "password_conversion_claimed", "provider_id", "readback_sha256", "schema", "secret_material_returned", "state", "terminal_receipt_sha256", "vault_item_ref", "vault_scope_ref"];

function validateTerminalReceipt(value, admission, command) {
  exact(value, TERMINAL_RECEIPT_FIELDS, "VAULT_CREDENTIAL_SAVE_REPLAY_INVALID");
  const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "terminal_receipt_sha256"));
  if (value.schema !== "pookakind.vault-exact-one-credential-save-receipt/v1"
    || value.state !== "VERIFIED_CURRENT"
    || value.operation_id_sha256 !== command.operation_id_sha256
    || value.admission_sha256 !== admission.admission_sha256
    || value.provider_id !== command.provider_id
    || value.account_ref !== command.account_ref
    || value.vault_item_ref !== command.vault_item_ref
    || value.vault_scope_ref !== command.vault_scope_ref
    || value.credential_change_ref_sha256 !== command.credential_change_ref_sha256
    || value.exact_match_count !== 1
    || value.duplicate_count !== 0
    || value.credential_status !== "VERIFIED_CURRENT"
    || !HASH.test(value.readback_sha256 ?? "")
    || value.fixed !== false
    || value.password_conversion_claimed !== false
    || value.secret_material_returned !== false
    || !HASH.test(value.terminal_receipt_sha256 ?? "")
    || digest(body) !== value.terminal_receipt_sha256) fail("VAULT_CREDENTIAL_SAVE_REPLAY_INVALID");
}

export async function runExactOneVaultCredentialSaveOnce({ admission, credential_handle, store, resolveHandle, adapter }) {
  if (!admission || admission.schema !== "pookakind.vault-exact-one-credential-save-admission/v1" || !HASH.test(admission.admission_sha256 ?? "")) fail("VAULT_CREDENTIAL_SAVE_ADMISSION_INVALID");
  const body = Object.fromEntries(Object.entries(admission).filter(([key]) => key !== "admission_sha256")); if (digest(body) !== admission.admission_sha256) fail("VAULT_CREDENTIAL_SAVE_ADMISSION_INVALID");
  if (admission.decision !== "EXECUTE_ONCE") return freeze({ schema: "pookakind.vault-exact-one-credential-save-receipt/v1", state: "PREPARED_NOT_ACTIVATED", fixed: false, password_conversion_claimed: false, secret_material_returned: false });
  if (store?.kind !== "DURABLE_APPEND_ONCE_V1" || typeof store.claim_once !== "function" || typeof store.read_terminal !== "function" || typeof store.append_terminal_once !== "function" || typeof resolveHandle !== "function" || typeof adapter?.saveCredentialOnce !== "function" || typeof adapter?.readbackCredential !== "function") fail("VAULT_CREDENTIAL_SAVE_EXECUTOR_INVALID");
  const command = admission.command;
  if (credential_handle?.schema !== "pookakind.stewart-opaque-credential-handle/v1" || credential_handle.ref_sha256 !== command.credential_handle_ref_sha256) fail("VAULT_CREDENTIAL_SAVE_HANDLE_CUSTODY_CONFLICT");
  if (await store.claim_once(command.operation_id_sha256) !== true) {
    const terminal = await store.read_terminal(command.operation_id_sha256);
    if (terminal) {
      const replay = clone(terminal, "VAULT_CREDENTIAL_SAVE_REPLAY_INVALID");
      validateTerminalReceipt(replay, admission, command);
      return freeze(replay);
    }
    return freeze({ schema: "pookakind.vault-exact-one-credential-save-receipt/v1", state: "CRASH_STRANDED_CLAIM", fixed: false, password_conversion_claimed: false, secret_material_returned: false });
  }
  let resolved; let material = null;
  try {
    resolved = await resolveHandle(clone(credential_handle, "VAULT_CREDENTIAL_SAVE_HANDLE_INVALID"));
    if (resolved?.resolved !== true || typeof resolved.material !== "string" || resolved.material.length < 1) fail("VAULT_CREDENTIAL_SAVE_HANDLE_RESOLUTION_FAILED");
    material = resolved.material;
    const saved = await adapter.saveCredentialOnce({ command: freeze(clone(command, "VAULT_CREDENTIAL_SAVE_COMMAND_INVALID")), material });
    exact(saved, ["save_invoked", "secret_material_output", "state"], "VAULT_CREDENTIAL_SAVE_SAVE_RECEIPT_INVALID");
    if (saved.state !== "SAVE_ACCEPTED" || saved.save_invoked !== true || saved.secret_material_output !== false) fail("VAULT_CREDENTIAL_SAVE_SAVE_FAILED");
    const readback = await adapter.readbackCredential(freeze(clone(command, "VAULT_CREDENTIAL_SAVE_COMMAND_INVALID"))); validateReadback(readback, command);
    const receiptBody = { schema: "pookakind.vault-exact-one-credential-save-receipt/v1", state: "VERIFIED_CURRENT", operation_id_sha256: command.operation_id_sha256, admission_sha256: admission.admission_sha256, provider_id: command.provider_id, account_ref: command.account_ref, vault_item_ref: command.vault_item_ref, vault_scope_ref: command.vault_scope_ref, credential_change_ref_sha256: command.credential_change_ref_sha256, exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", readback_sha256: readback.readback_sha256, fixed: false, password_conversion_claimed: false, secret_material_returned: false };
    const receipt = freeze({ ...receiptBody, terminal_receipt_sha256: digest(receiptBody) });
    const append = await store.append_terminal_once(command.operation_id_sha256, receipt);
    if (!append || !["APPENDED", "EXACT_REPLAY"].includes(append.state) || append.receipt_sha256 !== digest(receipt)) fail("VAULT_CREDENTIAL_SAVE_TERMINAL_APPEND_FAILED");
    return receipt;
  } finally {
    material = null;
    if (resolved && typeof resolved === "object" && Object.hasOwn(resolved, "material")) resolved.material = null;
    resolved = null;
  }
}

export function classifyOnePasswordCliCredentialWriteCapability({ version, item_edit_help }) {
  if (typeof version !== "string" || typeof item_edit_help !== "string") fail("VAULT_CREDENTIAL_SAVE_CLI_PROBE_INVALID");
  const hasPipedTemplate = item_edit_help.includes("piped input");
  const passkeyRisk = item_edit_help.includes("passkey") && item_edit_help.includes("overwritten");
  const assignmentExposure = item_edit_help.includes("Command arguments can be visible");
  return freeze({ schema: "pookakind.onepassword-cli-credential-write-capability/v1", version, state: "UNSUPPORTED", blocker: UNSUPPORTED_CLI, exact_sensitive_field_stdin: false, whole_item_template_required: hasPipedTemplate, passkey_overwrite_risk: passkeyRisk, command_argument_secret_exposure: assignmentExposure, live_callable: false });
}

export const ONEPASSWORD_CLI_CREDENTIAL_WRITE_BLOCKER = UNSUPPORTED_CLI;
