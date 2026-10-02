import { createHash } from "node:crypto";

import { createOnePasswordSdkFieldPreservingAdapter, verifyOnePasswordSdkServiceAccountCapability } from "./onepassword-sdk-field-preserving-adapter.mjs";
import { verifyOnePasswordServiceAccountClientReceipt } from "./onepassword-sdk-service-account-client.mjs";
import { canonicalJson, keyFingerprint, signDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ACCOUNT = /^acct_[A-Za-z0-9_-]{22,96}$/;
const ITEM = /^item_[A-Za-z0-9_-]{22,96}$/;
const SCOPE = /^vaultscope_[A-Za-z0-9_-]{22,96}$/;
const PERMISSIONS = ["READ_ITEMS", "REVEAL_ITEM_PASSWORD", "UPDATE_ITEMS"];
const PROVIDER_ID = "DISNEY_MYDISNEY";
const INPUT_FIELDS = ["access_steward_authority", "access_steward_private_key_pem", "account_ref", "client", "client_receipt", "expected_machine_sha256", "machine_sha256", "resolve_opaque_target", "sdk_native_sha256", "sdk_package_sha256", "service_account_ref_sha256", "target_field_ref_sha256", "vault_item_ref", "vault_scope_ref"];
const RECEIPT_FIELDS = ["authentication_mode", "client_instance_sha256", "schema", "secret_material_output", "token_cleared_after_creation", "token_source"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); const actual = Object.keys(value).sort(); const expected = [...fields].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }

export async function createOnePasswordSdkServiceAccountCapability(rawInput, now = Date.now()) {
  exact(rawInput, INPUT_FIELDS, "ONEPASSWORD_SDK_CAPABILITY_PRODUCER_INPUT_INVALID");
  if (!Number.isFinite(now) || typeof rawInput.resolve_opaque_target !== "function"
    || typeof rawInput.client?.vaults?.list !== "function" || typeof rawInput.client?.items?.get !== "function" || typeof rawInput.client?.items?.put !== "function") fail("ONEPASSWORD_SDK_CAPABILITY_PRODUCER_INPUT_INVALID");
  exact(rawInput.client_receipt, RECEIPT_FIELDS, "ONEPASSWORD_SDK_CAPABILITY_CLIENT_RECEIPT_INVALID");
  verifyOnePasswordServiceAccountClientReceipt(rawInput.client, rawInput.client_receipt);
  if (rawInput.client_receipt.schema !== "pookakind.onepassword-sdk-client-receipt/v1" || rawInput.client_receipt.authentication_mode !== "SERVICE_ACCOUNT"
    || rawInput.client_receipt.token_source !== "PROCESS_ENVIRONMENT_EPHEMERAL" || rawInput.client_receipt.token_cleared_after_creation !== true
    || rawInput.client_receipt.secret_material_output !== false || !HASH.test(rawInput.client_receipt.client_instance_sha256 ?? "")) fail("ONEPASSWORD_SDK_CAPABILITY_CLIENT_RECEIPT_INVALID");
  const authority = rawInput.access_steward_authority;
  if (authority?.schema !== "pookakind.onepassword-access-steward-pin/v1" || !HASH.test(authority.public_key_sha256 ?? "")
    || authority.public_key_sha256 !== keyFingerprint(authority.public_key_pem) || typeof rawInput.access_steward_private_key_pem !== "string") fail("ONEPASSWORD_SDK_CAPABILITY_SIGNER_INVALID");
  for (const value of [rawInput.expected_machine_sha256, rawInput.machine_sha256, rawInput.sdk_native_sha256, rawInput.sdk_package_sha256, rawInput.service_account_ref_sha256, rawInput.target_field_ref_sha256]) if (!HASH.test(value ?? "")) fail("ONEPASSWORD_SDK_CAPABILITY_SCOPE_INVALID");
  if (rawInput.machine_sha256 !== rawInput.expected_machine_sha256) fail("ONEPASSWORD_SDK_CAPABILITY_MACHINE_MISMATCH");
  if (!ACCOUNT.test(rawInput.account_ref ?? "") || !ITEM.test(rawInput.vault_item_ref ?? "") || !SCOPE.test(rawInput.vault_scope_ref ?? "")) fail("ONEPASSWORD_SDK_CAPABILITY_SCOPE_INVALID");
  let refs = null; let vaults = null; let item = null;
  try {
    refs = await rawInput.resolve_opaque_target(freeze({ provider_id: PROVIDER_ID, account_ref: rawInput.account_ref, vault_scope_ref: rawInput.vault_scope_ref, vault_item_ref: rawInput.vault_item_ref, target_field_ref_sha256: rawInput.target_field_ref_sha256 }));
    exact(refs, ["field_id", "item_id", "service_account_scope_exact", "state", "vault_id"], "ONEPASSWORD_SDK_CAPABILITY_OPAQUE_BINDING_INVALID");
    if (refs.state !== "EXACT_PRIVATE_BINDING" || refs.service_account_scope_exact !== true
      || ![refs.vault_id, refs.item_id, refs.field_id].every((value) => typeof value === "string" && value.length > 0)) fail("ONEPASSWORD_SDK_CAPABILITY_OPAQUE_BINDING_INVALID");
    vaults = await rawInput.client.vaults.list();
    if (!Array.isArray(vaults) || vaults.filter((vault) => vault?.id === refs.vault_id).length !== 1) fail("ONEPASSWORD_SDK_CAPABILITY_VAULT_SCOPE_NOT_EXACT");
    item = await rawInput.client.items.get(refs.vault_id, refs.item_id);
    if (!item || item.id !== refs.item_id || item.vaultId !== refs.vault_id || !Array.isArray(item.fields)
      || item.fields.filter((field) => field?.id === refs.field_id && field?.fieldType === "Concealed").length !== 1
      || item.fields.filter((field) => field?.id === refs.field_id).length !== 1) fail("ONEPASSWORD_SDK_CAPABILITY_TARGET_NOT_EXACT");
    const targetBindingSha256 = digest({ provider_id: PROVIDER_ID, account_ref: rawInput.account_ref, vault_scope_ref: rawInput.vault_scope_ref, vault_item_ref: rawInput.vault_item_ref, target_field_ref_sha256: rawInput.target_field_ref_sha256 });
    const payload = {
      schema: "pookakind.onepassword-sdk-service-account-capability/v1",
      sdk_package_sha256: rawInput.sdk_package_sha256,
      sdk_native_sha256: rawInput.sdk_native_sha256,
      client_instance_sha256: rawInput.client_receipt.client_instance_sha256,
      service_account_ref_sha256: rawInput.service_account_ref_sha256,
      vault_scope_ref_sha256: digest(rawInput.vault_scope_ref),
      permissions: PERMISSIONS,
      machine_sha256: rawInput.machine_sha256,
      target_binding_sha256: targetBindingSha256,
      issued_at: new Date(now).toISOString(),
      expires_at: new Date(now + 299_000).toISOString(),
      live_save_authorized: true,
    };
    const audience = ["onepassword-sdk-service-account-capability/v1", payload.sdk_package_sha256, payload.client_instance_sha256, payload.service_account_ref_sha256, payload.vault_scope_ref_sha256, payload.target_binding_sha256, payload.machine_sha256].join(":");
    const record = signDurableRecord(rawInput.access_steward_private_key_pem, payload, { issuer: "pookakind-onepassword-access-steward", audience });
    const capability = verifyOnePasswordSdkServiceAccountCapability({ record, authority, now });
    const privateBinding = Object.freeze({ vault_id: refs.vault_id, item_id: refs.item_id, field_id: refs.field_id });
    const exactRequest = canonicalJson({ vault_item_ref: rawInput.vault_item_ref, vault_scope_ref: rawInput.vault_scope_ref, target_field_ref_sha256: rawInput.target_field_ref_sha256 });
    const create_adapter = () => createOnePasswordSdkFieldPreservingAdapter({
      client: rawInput.client,
      capability,
      resolveOpaqueRefs: async (request) => {
        if (canonicalJson(request) !== exactRequest) fail("ONEPASSWORD_SDK_CAPABILITY_RESOLVER_SCOPE_CONFLICT");
        return { state: "EXACT_PRIVATE_BINDING", service_account_scope_exact: true, ...privateBinding };
      },
    });
    return freeze({
      capability_record: record,
      capability_authority: authority,
      capability,
      create_adapter,
      receipt: {
        schema: "pookakind.onepassword-sdk-service-account-capability-producer-receipt/v1",
        state: "SIGNED_EXACT_SERVICE_ACCOUNT_SCOPE",
        provider_id: PROVIDER_ID,
        client_instance_sha256: payload.client_instance_sha256,
        vault_scope_ref_sha256: payload.vault_scope_ref_sha256,
        target_binding_sha256: payload.target_binding_sha256,
        machine_sha256: payload.machine_sha256,
        permissions: PERMISSIONS,
        capability_record_sha256: digest(record),
        private_refs_output: false,
        secret_material_output: false,
      },
    });
  } finally {
    refs = null; vaults = null; item = null;
  }
}

export const ONEPASSWORD_SDK_SERVICE_ACCOUNT_REQUIRED_PERMISSIONS = freeze([...PERMISSIONS]);
