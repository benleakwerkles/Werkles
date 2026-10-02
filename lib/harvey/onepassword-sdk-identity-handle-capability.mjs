import { createHash, createPublicKey } from "node:crypto";

import { verifyOnePasswordServiceAccountClientReceipt } from "./onepassword-sdk-service-account-client.mjs";
import { canonicalJson, keyFingerprint, signDurableRecord, verifyDurableRecord } from "./station-crypto-core.mjs";
import { containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ACCOUNT = /^acct_[A-Za-z0-9_-]{22,96}$/;
const ITEM = /^item_[A-Za-z0-9_-]{22,96}$/;
const SCOPE = /^vaultscope_[A-Za-z0-9_-]{22,96}$/;
const PROVIDER_ID = "DISNEY_MYDISNEY";
const PERMISSIONS = Object.freeze(["READ_ITEMS"]);
const INPUT_FIELDS = ["access_steward_authority", "access_steward_private_key_pem", "account_ref", "client", "client_receipt", "expected_machine_sha256", "machine_sha256", "resolve_opaque_target", "sdk_native_sha256", "sdk_package_sha256", "service_account_ref_sha256", "target_field_ref_sha256", "vault_item_ref", "vault_scope_ref"];
const CLIENT_RECEIPT_FIELDS = ["authentication_mode", "client_instance_sha256", "schema", "secret_material_output", "token_cleared_after_creation", "token_source"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); const actual = Object.keys(value).sort(); const expected = [...fields].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

function verifySigner(authority, privateKeyPem) {
  if (authority?.schema !== "pookakind.onepassword-access-steward-pin/v1" || !HASH.test(authority.public_key_sha256 ?? "") || authority.public_key_sha256 !== keyFingerprint(authority.public_key_pem) || typeof privateKeyPem !== "string") fail("ONEPASSWORD_IDENTITY_HANDLE_SIGNER_INVALID");
  let derived;
  try { derived = createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" }); } catch { fail("ONEPASSWORD_IDENTITY_HANDLE_SIGNER_INVALID"); }
  if (typeof derived !== "string" || keyFingerprint(derived) !== authority.public_key_sha256) fail("ONEPASSWORD_IDENTITY_HANDLE_SIGNER_INVALID");
}

function exactIdentityField(item, refs) {
  if (!item || item.id !== refs.item_id || item.vaultId !== refs.vault_id || !Array.isArray(item.fields)) fail("ONEPASSWORD_IDENTITY_HANDLE_TARGET_NOT_EXACT");
  const fields = item.fields.filter((field) => field?.id === refs.field_id);
  if (fields.length !== 1 || fields[0].purpose !== "USERNAME" || fields[0].fieldType !== "String") fail("ONEPASSWORD_IDENTITY_HANDLE_TARGET_NOT_EXACT");
  return fields[0];
}

function validIdentityValue(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= 1_024
    && !/[\u0000-\u001f\u007f]/.test(value)
    && !containsUnsafeHarveyControlCharacters(value);
}

export async function createOnePasswordSdkIdentityHandleCapability(rawInput, now = Date.now()) {
  exact(rawInput, INPUT_FIELDS, "ONEPASSWORD_IDENTITY_HANDLE_INPUT_INVALID");
  if (!Number.isFinite(now) || typeof rawInput.resolve_opaque_target !== "function" || typeof rawInput.client?.vaults?.list !== "function" || typeof rawInput.client?.items?.get !== "function") fail("ONEPASSWORD_IDENTITY_HANDLE_INPUT_INVALID");
  exact(rawInput.client_receipt, CLIENT_RECEIPT_FIELDS, "ONEPASSWORD_IDENTITY_HANDLE_CLIENT_RECEIPT_INVALID");
  verifyOnePasswordServiceAccountClientReceipt(rawInput.client, rawInput.client_receipt);
  if (rawInput.client_receipt.schema !== "pookakind.onepassword-sdk-client-receipt/v1" || rawInput.client_receipt.authentication_mode !== "SERVICE_ACCOUNT" || rawInput.client_receipt.token_source !== "PROCESS_ENVIRONMENT_EPHEMERAL" || rawInput.client_receipt.token_cleared_after_creation !== true || rawInput.client_receipt.secret_material_output !== false || !HASH.test(rawInput.client_receipt.client_instance_sha256 ?? "")) fail("ONEPASSWORD_IDENTITY_HANDLE_CLIENT_RECEIPT_INVALID");
  verifySigner(rawInput.access_steward_authority, rawInput.access_steward_private_key_pem);
  for (const value of [rawInput.expected_machine_sha256, rawInput.machine_sha256, rawInput.sdk_native_sha256, rawInput.sdk_package_sha256, rawInput.service_account_ref_sha256, rawInput.target_field_ref_sha256]) if (!HASH.test(value ?? "")) fail("ONEPASSWORD_IDENTITY_HANDLE_SCOPE_INVALID");
  if (rawInput.machine_sha256 !== rawInput.expected_machine_sha256 || !ACCOUNT.test(rawInput.account_ref ?? "") || !ITEM.test(rawInput.vault_item_ref ?? "") || !SCOPE.test(rawInput.vault_scope_ref ?? "")) fail("ONEPASSWORD_IDENTITY_HANDLE_SCOPE_INVALID");

  let refs = null; let vaults = null; let item = null;
  try {
    refs = await rawInput.resolve_opaque_target(freeze({ provider_id: PROVIDER_ID, account_ref: rawInput.account_ref, vault_scope_ref: rawInput.vault_scope_ref, vault_item_ref: rawInput.vault_item_ref, target_field_ref_sha256: rawInput.target_field_ref_sha256 }));
    exact(refs, ["field_id", "item_id", "service_account_scope_exact", "state", "vault_id"], "ONEPASSWORD_IDENTITY_HANDLE_OPAQUE_BINDING_INVALID");
    if (refs.state !== "EXACT_PRIVATE_BINDING" || refs.service_account_scope_exact !== true || ![refs.vault_id, refs.item_id, refs.field_id].every((value) => typeof value === "string" && value.length > 0)) fail("ONEPASSWORD_IDENTITY_HANDLE_OPAQUE_BINDING_INVALID");
    vaults = await rawInput.client.vaults.list();
    if (!Array.isArray(vaults) || vaults.filter((vault) => vault?.id === refs.vault_id).length !== 1) fail("ONEPASSWORD_IDENTITY_HANDLE_VAULT_SCOPE_NOT_EXACT");
    item = await rawInput.client.items.get(refs.vault_id, refs.item_id);
    const field = exactIdentityField(item, refs);
    if (!validIdentityValue(field.value)) fail("ONEPASSWORD_IDENTITY_HANDLE_VALUE_INVALID");
    const targetBindingSha256 = digest({ provider_id: PROVIDER_ID, account_ref: rawInput.account_ref, vault_scope_ref: rawInput.vault_scope_ref, vault_item_ref: rawInput.vault_item_ref, target_field_ref_sha256: rawInput.target_field_ref_sha256 });
    const payload = {
      schema: "pookakind.onepassword-sdk-identity-handle-capability/v1",
      provider_id: PROVIDER_ID,
      account_ref_sha256: digest(rawInput.account_ref),
      sdk_package_sha256: rawInput.sdk_package_sha256,
      sdk_native_sha256: rawInput.sdk_native_sha256,
      client_instance_sha256: rawInput.client_receipt.client_instance_sha256,
      service_account_ref_sha256: rawInput.service_account_ref_sha256,
      vault_scope_ref_sha256: digest(rawInput.vault_scope_ref),
      target_binding_sha256: targetBindingSha256,
      machine_sha256: rawInput.machine_sha256,
      permissions: PERMISSIONS,
      issued_at: new Date(now).toISOString(),
      expires_at: new Date(now + 299_000).toISOString(),
      max_uses: 1,
    };
    const audience = ["onepassword-sdk-identity-handle-capability/v1", payload.provider_id, payload.account_ref_sha256, payload.client_instance_sha256, payload.service_account_ref_sha256, payload.target_binding_sha256, payload.machine_sha256].join(":");
    const capabilityRecord = signDurableRecord(rawInput.access_steward_private_key_pem, payload, { issuer: "pookakind-onepassword-access-steward", audience });
    verifyDurableRecord(rawInput.access_steward_authority.public_key_pem, capabilityRecord, { issuer: "pookakind-onepassword-access-steward", audience });
    const capabilityRecordSha256 = digest(capabilityRecord);
    const handle = freeze({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: digest({ capability_record_sha256: capabilityRecordSha256, target_binding_sha256: targetBindingSha256, purpose: "IDENTITY" }) });
    const privateBinding = Object.freeze({ vault_id: refs.vault_id, item_id: refs.item_id, field_id: refs.field_id });
    let consumed = false;
    const resolveHandle = async (candidate) => {
      exact(candidate, ["ref_sha256", "schema"], "ONEPASSWORD_IDENTITY_HANDLE_INVALID");
      if (candidate.schema !== handle.schema || candidate.ref_sha256 !== handle.ref_sha256) fail("ONEPASSWORD_IDENTITY_HANDLE_CUSTODY_CONFLICT");
      if (consumed) fail("ONEPASSWORD_IDENTITY_HANDLE_ALREADY_CONSUMED");
      consumed = true;
      let current = await rawInput.client.items.get(privateBinding.vault_id, privateBinding.item_id);
      try {
        const currentField = exactIdentityField(current, privateBinding);
        if (!validIdentityValue(currentField.value)) fail("ONEPASSWORD_IDENTITY_HANDLE_VALUE_INVALID");
        return { resolved: true, material: currentField.value };
      } finally { current = null; }
    };
    return freeze({
      handle,
      capability_record: capabilityRecord,
      resolve_handle: resolveHandle,
      receipt: {
        schema: "pookakind.onepassword-sdk-identity-handle-capability-receipt/v1",
        state: "OPAQUE_IDENTITY_HANDLE_READY",
        provider_id: PROVIDER_ID,
        account_ref_sha256: payload.account_ref_sha256,
        client_instance_sha256: payload.client_instance_sha256,
        target_binding_sha256: payload.target_binding_sha256,
        capability_record_sha256: capabilityRecordSha256,
        handle_ref_sha256: handle.ref_sha256,
        permissions: PERMISSIONS,
        max_uses: 1,
        identity_material_output: false,
        private_refs_output: false,
        secret_material_output: false,
      },
    });
  } finally { refs = null; vaults = null; item = null; }
}
