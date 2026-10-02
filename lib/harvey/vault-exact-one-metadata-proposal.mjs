import { createHash } from "node:crypto";

import { compileVaultMetadataOpaqueJoin } from "./vault-metadata-opaque-join.mjs";
import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = /^[a-z0-9][a-z0-9.-]{1,127}$/;
const WORK_OBJECT_ID = /^work_[a-z0-9][a-z0-9._-]{2,127}$/;
const VAULT_SCOPE_REF = /^vaultscope_[A-Za-z0-9_-]{22,96}$/;
const ACCOUNT_REF = /^acct_[A-Za-z0-9_-]{22,96}$/;
const ITEM_REF = /^item_[A-Za-z0-9_-]{22,96}$/;
const MAX_OBSERVATION_AGE_MS = 5 * 60 * 1000;
const FORBIDDEN_KEYS = new Set(["email", "password", "secret", "title", "url", "username", "workbook", "workbook_row"]);
const MAPPING_STATES = new Set(["ABSENT", "BROAD", "WRONG", "CORRECT"]);

const INPUT_FIELDS = [
  "account_authority", "account_custodian_output", "metadata_observation_record", "now",
  "provider_reconciliation_receipt", "schema", "vault_authority", "vault_metadata_sensor_output",
];
const AUTHORITY_FIELDS = ["public_key_pem", "public_key_sha256"];
const PROVIDER_RECEIPT_FIELDS = [
  "account_authority_public_key_sha256", "account_authority_record_sha256", "join_receipt",
  "mutation_authorized", "mutation_performed", "operation_id", "provider_id", "schema",
  "vault_authority_public_key_sha256", "vault_authority_record_sha256", "work_object_id",
];
const ACCOUNT_OUTPUT_FIELDS = [
  "account_custody_record", "account_ref", "mutation_authorized", "private_input_returned",
  "producer_receipt_record", "provider_id", "schema", "vault_scope_ref", "work_object_id",
];
const SENSOR_OUTPUT_FIELDS = [
  "mutation_authorized", "mutation_performed", "observed_at", "producer_receipt_record", "provider_id",
  "schema", "vault_scope_ref", "vault_visibility_record", "visibility_limit", "work_object_id",
];
const ACCOUNT_PRODUCER_RECEIPT_FIELDS = [
  "account_ref", "account_ref_kind", "authority_record_sha256", "custodian_public_key_sha256",
  "mutation_authorized", "observed_at", "operator_authority_public_key_sha256", "private_input_logged",
  "private_input_returned", "provider_id", "schema", "vault_scope_ref", "work_object_id",
];
const SENSOR_PRODUCER_RECEIPT_FIELDS = [
  "authority_record_sha256", "bindings", "mutation_authorized", "mutation_performed", "observed_at",
  "operator_authority_public_key_sha256", "provider_id", "schema", "scope_enumeration_complete",
  "secret_fields_read", "sensor_public_key_sha256", "vault_scope_ref", "visibility_limit", "work_object_id",
];
const OBSERVATION_FIELDS = [
  "account_ref", "after_state_sha256", "before_state_sha256", "canonical_origin_sha256",
  "exact_host_selected", "mapping_state", "mutation_performed", "observed_at",
  "official_route_proof_sha256", "provider_id", "schema", "secret_fields_read",
  "vault_item_ref", "vault_item_ref_kind", "vault_scope_ref", "work_object_id",
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

function rejectPrivateFields(value) {
  if (Array.isArray(value)) return value.forEach(rejectPrivateFields);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) fail("VAULT_EXACT_ONE_PROPOSAL_PRIVATE_FIELD_FORBIDDEN");
    rejectPrivateFields(child);
  }
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalJson(value)).digest("hex");
}

function authority(value, code) {
  exact(value, AUTHORITY_FIELDS, code);
  if (!HASH.test(value.public_key_sha256 ?? "") || keyFingerprint(value.public_key_pem) !== value.public_key_sha256) fail(code);
}

function observedAt(value, now) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now || now - parsed > MAX_OBSERVATION_AGE_MS) fail("VAULT_EXACT_ONE_PROPOSAL_OBSERVATION_STALE");
}

export function compileExactOneVaultMetadataProposal(rawInput) {
  const input = snapshot(rawInput, "VAULT_EXACT_ONE_PROPOSAL_INPUT_NOT_PLAIN");
  rejectPrivateFields(input);
  exact(input, INPUT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.vault-exact-one-metadata-proposal-input/v1" || !Number.isFinite(input.now)) {
    fail("VAULT_EXACT_ONE_PROPOSAL_INPUT_INVALID");
  }
  authority(input.account_authority, "VAULT_EXACT_ONE_PROPOSAL_ACCOUNT_AUTHORITY_INVALID");
  authority(input.vault_authority, "VAULT_EXACT_ONE_PROPOSAL_VAULT_AUTHORITY_INVALID");
  if (input.account_authority.public_key_sha256 === input.vault_authority.public_key_sha256) fail("VAULT_EXACT_ONE_PROPOSAL_AUTHORITY_COLLAPSE");
  exact(input.provider_reconciliation_receipt, PROVIDER_RECEIPT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_RECONCILIATION_FIELDS_INVALID");
  exact(input.account_custodian_output, ACCOUNT_OUTPUT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_ACCOUNT_OUTPUT_FIELDS_INVALID");
  exact(input.vault_metadata_sensor_output, SENSOR_OUTPUT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_SENSOR_OUTPUT_FIELDS_INVALID");

  const providerReceipt = input.provider_reconciliation_receipt;
  const accountOutput = input.account_custodian_output;
  const sensorOutput = input.vault_metadata_sensor_output;
  const providerId = providerReceipt.provider_id;
  const workObjectId = providerReceipt.work_object_id;
  const vaultScopeRef = accountOutput.vault_scope_ref;
  if (
    providerReceipt.schema !== "pookakind.vault-opaque-reconciliation-provider-receipt/v1"
    || !PROVIDER_ID.test(providerId ?? "")
    || !WORK_OBJECT_ID.test(workObjectId ?? "")
    || !VAULT_SCOPE_REF.test(vaultScopeRef ?? "")
    || providerReceipt.account_authority_public_key_sha256 !== input.account_authority.public_key_sha256
    || providerReceipt.vault_authority_public_key_sha256 !== input.vault_authority.public_key_sha256
    || providerReceipt.mutation_authorized !== false
    || providerReceipt.mutation_performed !== false
    || accountOutput.schema !== "pookakind.vault-opaque-account-producer-output/v1"
    || sensorOutput.schema !== "pookakind.vault-opaque-sensor-producer-output/v1"
    || accountOutput.provider_id !== providerId
    || sensorOutput.provider_id !== providerId
    || accountOutput.work_object_id !== workObjectId
    || sensorOutput.work_object_id !== workObjectId
    || sensorOutput.vault_scope_ref !== vaultScopeRef
    || accountOutput.mutation_authorized !== false
    || accountOutput.private_input_returned !== false
    || sensorOutput.mutation_authorized !== false
    || sensorOutput.mutation_performed !== false
  ) fail("VAULT_EXACT_ONE_PROPOSAL_SCOPE_CONFLICT");

  const accountProducerReceipt = verifyDurableRecord(input.account_authority.public_key_pem, accountOutput.producer_receipt_record, {
    issuer: "pookakind-account-custodian",
    audience: `vault-opaque-account-receipt:${providerId}:${workObjectId}:${vaultScopeRef}`,
  });
  const sensorProducerReceipt = verifyDurableRecord(input.vault_authority.public_key_pem, sensorOutput.producer_receipt_record, {
    issuer: "pookakind-vault-metadata-sensor",
    audience: `vault-opaque-sensor-receipt:${providerId}:${workObjectId}:${vaultScopeRef}`,
  });
  exact(accountProducerReceipt, ACCOUNT_PRODUCER_RECEIPT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_ACCOUNT_PRODUCER_RECEIPT_INVALID");
  exact(sensorProducerReceipt, SENSOR_PRODUCER_RECEIPT_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_SENSOR_PRODUCER_RECEIPT_INVALID");
  if (
    providerReceipt.account_authority_record_sha256 !== accountProducerReceipt.authority_record_sha256
    || providerReceipt.vault_authority_record_sha256 !== sensorProducerReceipt.authority_record_sha256
    || !HASH.test(providerReceipt.account_authority_record_sha256 ?? "")
    || !HASH.test(providerReceipt.vault_authority_record_sha256 ?? "")
  ) fail("VAULT_EXACT_ONE_PROPOSAL_AUTHORITY_PROVENANCE_CONFLICT");

  const recomputedJoin = compileVaultMetadataOpaqueJoin({
    provider_id: providerId,
    expected_vault_scope_ref: vaultScopeRef,
    now: input.now,
    account_authority: input.account_authority,
    vault_authority: input.vault_authority,
    account_custody_record: accountOutput.account_custody_record,
    vault_visibility_record: sensorOutput.vault_visibility_record,
  });
  if (canonicalJson(recomputedJoin) !== canonicalJson(providerReceipt.join_receipt)) fail("VAULT_EXACT_ONE_PROPOSAL_RECONCILIATION_CONFLICT");
  if (
    recomputedJoin.classification !== "EXACT_ONE"
    || recomputedJoin.visible_match_count !== 1
    || recomputedJoin.vault_item_custody_verified !== true
    || recomputedJoin.ambiguity_called_duplicate !== false
  ) fail("VAULT_EXACT_ONE_PROPOSAL_EXACT_ONE_REQUIRED");

  const accountCustody = verifyDurableRecord(input.account_authority.public_key_pem, accountOutput.account_custody_record, {
    issuer: "pookakind-account-custodian",
    audience: `vault-opaque-join-account:${providerId}:${vaultScopeRef}`,
  });
  const vaultVisibility = verifyDurableRecord(input.vault_authority.public_key_pem, sensorOutput.vault_visibility_record, {
    issuer: "pookakind-vault-metadata-sensor",
    audience: `vault-opaque-join-visibility:${providerId}:${vaultScopeRef}`,
  });
  if (
    accountOutput.account_ref !== accountCustody.account_ref
    || accountProducerReceipt.schema !== "pookakind.vault-opaque-account-producer-receipt/v1"
    || accountProducerReceipt.provider_id !== providerId
    || accountProducerReceipt.work_object_id !== workObjectId
    || accountProducerReceipt.vault_scope_ref !== vaultScopeRef
    || accountProducerReceipt.account_ref !== accountCustody.account_ref
    || accountProducerReceipt.account_ref_kind !== "RANDOM_OPAQUE_NON_SECRET"
    || accountProducerReceipt.custodian_public_key_sha256 !== input.account_authority.public_key_sha256
    || !HASH.test(accountProducerReceipt.authority_record_sha256 ?? "")
    || !HASH.test(accountProducerReceipt.operator_authority_public_key_sha256 ?? "")
    || accountProducerReceipt.private_input_logged !== false
    || accountProducerReceipt.private_input_returned !== false
    || accountProducerReceipt.mutation_authorized !== false
    || sensorProducerReceipt.schema !== "pookakind.vault-opaque-sensor-producer-receipt/v1"
    || sensorProducerReceipt.provider_id !== providerId
    || sensorProducerReceipt.work_object_id !== workObjectId
    || sensorProducerReceipt.vault_scope_ref !== vaultScopeRef
    || sensorProducerReceipt.observed_at !== sensorOutput.observed_at
    || sensorProducerReceipt.visibility_limit !== sensorOutput.visibility_limit
    || sensorProducerReceipt.sensor_public_key_sha256 !== input.vault_authority.public_key_sha256
    || !HASH.test(sensorProducerReceipt.authority_record_sha256 ?? "")
    || !HASH.test(sensorProducerReceipt.operator_authority_public_key_sha256 ?? "")
    || !Array.isArray(sensorProducerReceipt.bindings)
    || sensorProducerReceipt.secret_fields_read !== false
    || sensorProducerReceipt.mutation_authorized !== false
    || sensorProducerReceipt.mutation_performed !== false
    || canonicalJson(sensorProducerReceipt.bindings) !== canonicalJson(vaultVisibility.matches)
  ) fail("VAULT_EXACT_ONE_PROPOSAL_PRODUCER_CUSTODY_CONFLICT");
  if (
    (sensorProducerReceipt.visibility_limit === "FULL_AUTHORIZED_METADATA_SCOPE" && sensorProducerReceipt.scope_enumeration_complete !== true)
    || (sensorProducerReceipt.visibility_limit !== "FULL_AUTHORIZED_METADATA_SCOPE" && sensorProducerReceipt.scope_enumeration_complete !== false)
  ) fail("VAULT_EXACT_ONE_PROPOSAL_FALSE_FULL_VISIBILITY");
  const exactMatches = vaultVisibility.matches.filter((match) => match.account_ref === accountCustody.account_ref);
  if (exactMatches.length !== 1) fail("VAULT_EXACT_ONE_PROPOSAL_ITEM_CUSTODY_CONFLICT");
  const selected = exactMatches[0];

  const observation = verifyDurableRecord(input.vault_authority.public_key_pem, input.metadata_observation_record, {
    issuer: "pookakind-vault-metadata-sensor",
    audience: `vault-metadata-observation:${providerId}:${workObjectId}:${vaultScopeRef}`,
  });
  exact(observation, OBSERVATION_FIELDS, "VAULT_EXACT_ONE_PROPOSAL_OBSERVATION_FIELDS_INVALID");
  if (
    observation.schema !== "pookakind.vault-metadata-observation/v1"
    || observation.provider_id !== providerId
    || observation.work_object_id !== workObjectId
    || observation.vault_scope_ref !== vaultScopeRef
    || observation.account_ref !== accountCustody.account_ref
    || observation.vault_item_ref !== selected.vault_item_ref
    || observation.vault_item_ref_kind !== "RANDOM_OPAQUE_NON_SECRET"
    || !ACCOUNT_REF.test(observation.account_ref ?? "")
    || !ITEM_REF.test(observation.vault_item_ref ?? "")
    || !MAPPING_STATES.has(observation.mapping_state)
    || !HASH.test(observation.canonical_origin_sha256 ?? "")
    || !HASH.test(observation.before_state_sha256 ?? "")
    || !HASH.test(observation.after_state_sha256 ?? "")
    || !HASH.test(observation.official_route_proof_sha256 ?? "")
    || observation.secret_fields_read !== false
    || observation.mutation_performed !== false
  ) fail("VAULT_EXACT_ONE_PROPOSAL_OBSERVATION_INVALID");
  observedAt(observation.observed_at, input.now);

  let decision;
  let reason;
  let mutationKind = null;
  if (observation.mapping_state === "CORRECT") {
    if (observation.before_state_sha256 !== observation.after_state_sha256 || observation.exact_host_selected !== true) {
      fail("VAULT_EXACT_ONE_PROPOSAL_CORRECT_STATE_CONFLICT");
    }
    decision = "NO_CHANGE_REQUIRED";
    reason = "EXACT_HOST_MAPPING_ALREADY_CORRECT";
  } else if (observation.mapping_state === "WRONG") {
    decision = "BLOCKED_CONFLICTING_MAPPING";
    reason = "WRONG_MAPPING_REQUIRES_SEPARATE_IDENTITY_REVIEW";
  } else {
    if (observation.before_state_sha256 === observation.after_state_sha256 || observation.exact_host_selected !== true) {
      fail("VAULT_EXACT_ONE_PROPOSAL_DELTA_NOT_EXACT");
    }
    decision = "PREPARED_NOT_AUTHORIZED";
    reason = "SEPARATE_SIGNED_METADATA_MUTATION_AUTHORITY_REQUIRED";
    mutationKind = observation.mapping_state === "ABSENT" ? "ADD_EXACT_HOST_MAPPING" : "RESTRICT_EXISTING_MAPPING_TO_EXACT_HOST";
  }

  const candidate = {
    schema: "pookakind.vault-exact-one-metadata-proposal-candidate/v1",
    provider_id: providerId,
    work_object_id: workObjectId,
    vault_scope_ref: vaultScopeRef,
    item_ref_sha256: sha256(selected.vault_item_ref),
    canonical_origin_sha256: observation.canonical_origin_sha256,
    before_state_sha256: observation.before_state_sha256,
    after_state_sha256: observation.after_state_sha256,
    official_route_proof_sha256: observation.official_route_proof_sha256,
    observed_at: observation.observed_at,
    mapping_state: observation.mapping_state,
    mutation_kind: mutationKind,
  };
  return freeze({
    schema: "pookakind.vault-exact-one-metadata-proposal-result/v1",
    decision,
    reason,
    proposal_ref: `proposal_${sha256(candidate).slice(0, 32)}`,
    candidate,
    required_separate_gate_inputs: mutationKind ? [
      "SIGNED_ONE_USE_OPERATOR_METADATA_MUTATION_AUTHORITY",
      "SIGNED_ACCESS_STEWARD_EXACT_PROPOSAL",
      "FRESH_EXACT_NATIVE_SAVE_CONTROL_OBSERVATION",
      "SUPPORTED_ONE_SHOT_VAULT_CONTROL_EXECUTOR",
      "IMMEDIATE_EXACT_ITEM_READBACK_AND_FRESH_PROVIDER_VERIFICATION",
    ] : [],
    command: null,
    live_save_authorized: false,
    vault_mutation_performed: false,
    reconciliation_claimed: false,
    password_conversion_claimed: false,
    fixed: false,
  });
}
