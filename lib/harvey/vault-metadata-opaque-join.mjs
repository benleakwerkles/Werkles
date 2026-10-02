import { keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";
import {
  containsHarveySecretShape,
  containsUnsafeHarveyControlCharacters,
} from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = /^[a-z0-9][a-z0-9.-]{1,127}$/;
const ACCOUNT_REF = /^acct_[A-Za-z0-9_-]{22,96}$/;
const ITEM_REF = /^item_[A-Za-z0-9_-]{22,96}$/;
const VAULT_SCOPE_REF = /^vaultscope_[A-Za-z0-9_-]{22,96}$/;
const MAX_OBSERVATION_AGE_MS = 5 * 60 * 1000;
const MAX_OBSERVATION_SKEW_MS = 2 * 60 * 1000;
const ACCOUNT_SCHEMA = "pookakind.vault-opaque-account-custody/v1";
const VISIBILITY_SCHEMA = "pookakind.vault-opaque-visibility/v1";
const RECEIPT_SCHEMA = "pookakind.vault-opaque-join-receipt/v1";
const ACCOUNT_ISSUER = "pookakind-account-custodian";
const VISIBILITY_ISSUER = "pookakind-vault-metadata-sensor";
const REF_KIND = "RANDOM_OPAQUE_NON_SECRET";
const VISIBILITY_LIMITS = new Set([
  "FULL_AUTHORIZED_METADATA_SCOPE",
  "SCOPED_AUTHORIZED_METADATA_SCOPE",
  "UNKNOWN_AUTHORIZED_METADATA_SCOPE",
]);

const INPUT_FIELDS = [
  "account_authority",
  "account_custody_record",
  "expected_vault_scope_ref",
  "now",
  "provider_id",
  "vault_authority",
  "vault_visibility_record",
];
const AUTHORITY_FIELDS = ["public_key_pem", "public_key_sha256"];
const ACCOUNT_FIELDS = [
  "account_ref",
  "account_ref_kind",
  "custody_state",
  "observed_at",
  "provider_id",
  "schema",
  "secret_material_exposed",
  "source_class",
];
const VISIBILITY_FIELDS = [
  "authorization_state",
  "matches",
  "mutation_performed",
  "observed_at",
  "provider_id",
  "schema",
  "secret_fields_read",
  "vault_scope_ref",
  "vault_scope_ref_kind",
  "visibility_limit",
];
const MATCH_FIELDS = ["account_ref", "vault_item_ref", "vault_item_ref_kind"];

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

function plainSnapshot(value, code) {
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
      return plainSnapshot(descriptor.value, code);
    });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const snapshot = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    snapshot[key] = plainSnapshot(descriptor.value, code);
  }
  return snapshot;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function safe(value) {
  if (Array.isArray(value)) {
    for (const item of value) safe(item);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) safe(item);
    return;
  }
  if (typeof value === "string" && (
    containsHarveySecretShape(value)
    || containsUnsafeHarveyControlCharacters(value)
    || /(?:https?:\/\/|@)/i.test(value)
  )) fail("VAULT_OPAQUE_JOIN_SECRET_OR_IDENTIFIER_SHAPE_REJECTED");
}

function authority(value, code) {
  exact(value, AUTHORITY_FIELDS, code);
  if (!HASH.test(value.public_key_sha256 ?? "") || keyFingerprint(value.public_key_pem) !== value.public_key_sha256) fail(code);
}

function observedAt(value, now, code) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now || now - parsed > MAX_OBSERVATION_AGE_MS) fail(code);
  return parsed;
}

function accountAudience(providerId, vaultScopeRef) {
  return `vault-opaque-join-account:${providerId}:${vaultScopeRef}`;
}

function visibilityAudience(providerId, vaultScopeRef) {
  return `vault-opaque-join-visibility:${providerId}:${vaultScopeRef}`;
}

export function compileVaultMetadataOpaqueJoin(input) {
  const snapshot = plainSnapshot(input, "VAULT_OPAQUE_JOIN_INPUT_NOT_PLAIN");
  exact(snapshot, INPUT_FIELDS, "VAULT_OPAQUE_JOIN_INPUT_FIELDS_INVALID");
  const {
    account_authority: accountAuthority,
    account_custody_record: accountRecord,
    expected_vault_scope_ref: expectedVaultScopeRef,
    now,
    provider_id: providerId,
    vault_authority: vaultAuthority,
    vault_visibility_record: vaultRecord,
  } = snapshot;

  if (!PROVIDER_ID.test(providerId ?? "") || !VAULT_SCOPE_REF.test(expectedVaultScopeRef ?? "") || !Number.isFinite(now)) {
    fail("VAULT_OPAQUE_JOIN_EXPECTED_SCOPE_INVALID");
  }
  authority(accountAuthority, "VAULT_OPAQUE_JOIN_ACCOUNT_AUTHORITY_INVALID");
  authority(vaultAuthority, "VAULT_OPAQUE_JOIN_VAULT_AUTHORITY_INVALID");
  if (accountAuthority.public_key_sha256 === vaultAuthority.public_key_sha256) fail("VAULT_OPAQUE_JOIN_AUTHORITY_SEPARATION_REQUIRED");

  const account = verifyDurableRecord(accountAuthority.public_key_pem, accountRecord, {
    issuer: ACCOUNT_ISSUER,
    audience: accountAudience(providerId, expectedVaultScopeRef),
  });
  const visibility = verifyDurableRecord(vaultAuthority.public_key_pem, vaultRecord, {
    issuer: VISIBILITY_ISSUER,
    audience: visibilityAudience(providerId, expectedVaultScopeRef),
  });
  exact(account, ACCOUNT_FIELDS, "VAULT_OPAQUE_JOIN_ACCOUNT_FIELDS_INVALID");
  exact(visibility, VISIBILITY_FIELDS, "VAULT_OPAQUE_JOIN_VISIBILITY_FIELDS_INVALID");
  safe(account);
  safe(visibility);

  if (
    account.schema !== ACCOUNT_SCHEMA
    || visibility.schema !== VISIBILITY_SCHEMA
    || account.provider_id !== providerId
    || visibility.provider_id !== providerId
    || visibility.vault_scope_ref !== expectedVaultScopeRef
  ) fail("VAULT_OPAQUE_JOIN_SCOPE_CONFLICT");
  if (
    !ACCOUNT_REF.test(account.account_ref ?? "")
    || account.account_ref_kind !== REF_KIND
    || account.custody_state !== "INDEPENDENTLY_BOUND"
    || account.source_class !== "SANITIZED_CANONICAL_ACCOUNT_MAP"
    || account.secret_material_exposed !== false
  ) fail("VAULT_OPAQUE_JOIN_ACCOUNT_CUSTODY_INVALID");
  if (
    visibility.authorization_state !== "AUTHORIZED_METADATA_ONLY"
    || visibility.vault_scope_ref_kind !== REF_KIND
    || !VISIBILITY_LIMITS.has(visibility.visibility_limit)
    || visibility.secret_fields_read !== false
    || visibility.mutation_performed !== false
    || !Array.isArray(visibility.matches)
  ) fail("VAULT_OPAQUE_JOIN_VISIBILITY_INVALID");

  const accountAt = observedAt(account.observed_at, now, "VAULT_OPAQUE_JOIN_ACCOUNT_OBSERVATION_STALE");
  const visibilityAt = observedAt(visibility.observed_at, now, "VAULT_OPAQUE_JOIN_VISIBILITY_OBSERVATION_STALE");
  if (Math.abs(accountAt - visibilityAt) > MAX_OBSERVATION_SKEW_MS) fail("VAULT_OPAQUE_JOIN_OBSERVATION_EPOCH_CONFLICT");

  const seenItemRefs = new Set();
  let exactMatchCount = 0;
  for (const match of visibility.matches) {
    exact(match, MATCH_FIELDS, "VAULT_OPAQUE_JOIN_MATCH_FIELDS_INVALID");
    safe(match);
    if (
      !ACCOUNT_REF.test(match.account_ref ?? "")
      || !ITEM_REF.test(match.vault_item_ref ?? "")
      || match.vault_item_ref_kind !== REF_KIND
    ) fail("VAULT_OPAQUE_JOIN_MATCH_CUSTODY_INVALID");
    if (seenItemRefs.has(match.vault_item_ref)) fail("VAULT_OPAQUE_JOIN_DUPLICATE_ITEM_CUSTODY");
    seenItemRefs.add(match.vault_item_ref);
    if (match.account_ref === account.account_ref) exactMatchCount += 1;
  }

  const classification = exactMatchCount === 0 ? "ZERO_VISIBLE" : exactMatchCount === 1 ? "EXACT_ONE" : "AMBIGUOUS";
  return deepFreeze({
    schema: RECEIPT_SCHEMA,
    provider_id: providerId,
    classification,
    visible_match_count: exactMatchCount,
    observed_at: visibility.observed_at,
    account_source_class: account.source_class,
    vault_scope_ref: expectedVaultScopeRef,
    visibility_limit: visibility.visibility_limit,
    visibility_scope_complete: visibility.visibility_limit === "FULL_AUTHORIZED_METADATA_SCOPE",
    authorized_metadata_only: true,
    account_custody_verified: true,
    vault_item_custody_verified: classification === "EXACT_ONE",
    ambiguity_called_duplicate: false,
    secret_fields_read: false,
    secret_material_returned: false,
    mutation_authorized: false,
    mutation_performed: false,
    allowed_mutations: [],
  });
}
