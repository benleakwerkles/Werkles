import { isDeepStrictEqual } from "node:util";
import { createHash, timingSafeEqual } from "node:crypto";
import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const STATES = new Set(["DESKTOP_AUTH_PROMPT_REQUIRED", "SERVICE_ACCOUNT_EXACT_SCOPE", "NOT_INSTALLED"]);
const SERVICE_ACCOUNT_PERMISSIONS = ["READ_ITEMS", "REVEAL_ITEM_PASSWORD", "UPDATE_ITEMS"];
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function clone(value) {
  if (value === null || ["string", "number", "boolean", "undefined"].includes(typeof value)) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (!value || typeof value !== "object" || Object.getOwnPropertySymbols(value).length !== 0) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED");
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED");
    const descriptors = Object.getOwnPropertyDescriptors(value); const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED");
    return keys.map((key) => { const descriptor = descriptors[key]; if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED"); return clone(descriptor.value); });
  }
  if (prototype !== Object.prototype && prototype !== null) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED");
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) { if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail("ONEPASSWORD_SDK_ITEM_SHAPE_UNSUPPORTED"); output[key] = clone(descriptor.value); }
  return output;
}
function constantTimeEqual(left, right) { if (typeof left !== "string" || typeof right !== "string") return false; const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
function readbackDigest(command, refs, item) {
  return createHash("sha256").update(JSON.stringify([
    "pookakind.onepassword-sdk-readback/v1",
    command.provider_id,
    command.work_object_id,
    command.vault_scope_ref,
    command.account_ref,
    command.vault_item_ref,
    command.credential_change_ref_sha256,
    refs.vault_id,
    refs.item_id,
    refs.field_id,
    item.version,
    item.category,
  ])).digest("hex");
}
function normalizeForPreservation(item, targetId, replacement) { const copy = clone(item); copy.version = 0; copy.updatedAt = null; const fields = copy.fields.filter((field) => field.id === targetId); if (fields.length !== 1) fail("ONEPASSWORD_SDK_TARGET_FIELD_AMBIGUOUS"); fields[0].value = replacement; return copy; }

export function classifyOnePasswordSdkCapability({ installed, authentication_mode, authenticated_client_available, service_account_exact_vault_scope }) {
  if (typeof installed !== "boolean" || typeof authenticated_client_available !== "boolean" || typeof service_account_exact_vault_scope !== "boolean" || !["DESKTOP", "SERVICE_ACCOUNT", "NONE"].includes(authentication_mode)) fail("ONEPASSWORD_SDK_CAPABILITY_INPUT_INVALID");
  let state = "NOT_INSTALLED";
  if (installed && authentication_mode === "DESKTOP") state = "DESKTOP_AUTH_PROMPT_REQUIRED";
  // Boolean probes cannot prove the identity, package, client, target, or permissions.
  // A live service-account capability must come from the signed verifier below.
  if (!STATES.has(state)) fail("ONEPASSWORD_SDK_CAPABILITY_INVALID");
  return freeze({ schema: "pookakind.onepassword-sdk-field-preserving-capability/v1", state, field_preserving_sdk_adapter_callable: state === "SERVICE_ACCOUNT_EXACT_SCOPE", prompt_required: state === "DESKTOP_AUTH_PROMPT_REQUIRED", exact_scope_proved: state === "SERVICE_ACCOUNT_EXACT_SCOPE", live_save_performed: false });
}

export function verifyOnePasswordSdkServiceAccountCapability({ record, authority, now = Date.now() }) {
  if (authority?.schema !== "pookakind.onepassword-access-steward-pin/v1" || typeof authority.public_key_pem !== "string" || authority.public_key_sha256 !== keyFingerprint(authority.public_key_pem)) fail("ONEPASSWORD_SDK_CAPABILITY_AUTHORITY_INVALID");
  const payload = verifyDurableRecord(authority.public_key_pem, record, {
    issuer: "pookakind-onepassword-access-steward",
    audience: record?.audience,
  });
  const expected = ["client_instance_sha256", "expires_at", "issued_at", "live_save_authorized", "machine_sha256", "permissions", "schema", "sdk_native_sha256", "sdk_package_sha256", "service_account_ref_sha256", "target_binding_sha256", "vault_scope_ref_sha256"].sort();
  if (Object.keys(payload).sort().join("|") !== expected.join("|") || payload.schema !== "pookakind.onepassword-sdk-service-account-capability/v1") fail("ONEPASSWORD_SDK_CAPABILITY_RECORD_INVALID");
  for (const field of ["client_instance_sha256", "machine_sha256", "sdk_native_sha256", "sdk_package_sha256", "service_account_ref_sha256", "target_binding_sha256", "vault_scope_ref_sha256"]) if (!HASH.test(payload[field] ?? "")) fail("ONEPASSWORD_SDK_CAPABILITY_RECORD_INVALID");
  if (!Array.isArray(payload.permissions) || payload.permissions.length !== SERVICE_ACCOUNT_PERMISSIONS.length || payload.permissions.some((permission, index) => permission !== SERVICE_ACCOUNT_PERMISSIONS[index]) || payload.live_save_authorized !== true) fail("ONEPASSWORD_SDK_CAPABILITY_SCOPE_INVALID");
  const issued = Date.parse(payload.issued_at); const expires = Date.parse(payload.expires_at);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued || expires - issued > 300_000 || issued > now + 30_000 || expires < now) fail("ONEPASSWORD_SDK_CAPABILITY_STALE");
  const expectedAudience = ["onepassword-sdk-service-account-capability/v1", payload.sdk_package_sha256, payload.client_instance_sha256, payload.service_account_ref_sha256, payload.vault_scope_ref_sha256, payload.target_binding_sha256, payload.machine_sha256].join(":");
  if (record.audience !== expectedAudience) fail("ONEPASSWORD_SDK_CAPABILITY_AUDIENCE_INVALID");
  return freeze({ schema: "pookakind.onepassword-sdk-field-preserving-capability/v1", state: "SERVICE_ACCOUNT_EXACT_SCOPE", field_preserving_sdk_adapter_callable: true, prompt_required: false, exact_scope_proved: true, live_save_performed: false, capability_record_sha256: createHash("sha256").update(canonicalJson(record)).digest("hex"), sdk_package_sha256: payload.sdk_package_sha256, client_instance_sha256: payload.client_instance_sha256, service_account_ref_sha256: payload.service_account_ref_sha256, vault_scope_ref_sha256: payload.vault_scope_ref_sha256, target_binding_sha256: payload.target_binding_sha256, machine_sha256: payload.machine_sha256 });
}

export function createOnePasswordSdkFieldPreservingAdapter({ client, capability, resolveOpaqueRefs }) {
  if (capability?.state !== "SERVICE_ACCOUNT_EXACT_SCOPE" || capability?.field_preserving_sdk_adapter_callable !== true || typeof client?.items?.get !== "function" || typeof client?.items?.put !== "function" || typeof resolveOpaqueRefs !== "function") fail("ONEPASSWORD_SDK_ADAPTER_NOT_CALLABLE");
  let custody = null;
  return freeze({
    async saveCredentialOnce({ command, material }) {
      if (!command || !HASH.test(command.target_field_ref_sha256 ?? "") || !Number.isSafeInteger(command.expected_item_version) || typeof material !== "string" || material.length < 1) fail("ONEPASSWORD_SDK_ADAPTER_COMMAND_INVALID");
      let refs; let original; let outbound;
      try {
        refs = await resolveOpaqueRefs({ vault_item_ref: command.vault_item_ref, vault_scope_ref: command.vault_scope_ref, target_field_ref_sha256: command.target_field_ref_sha256 });
        if (refs?.state !== "EXACT_PRIVATE_BINDING" || refs?.service_account_scope_exact !== true || typeof refs.vault_id !== "string" || typeof refs.item_id !== "string" || typeof refs.field_id !== "string") fail("ONEPASSWORD_SDK_OPAQUE_BINDING_INVALID");
        original = clone(await client.items.get(refs.vault_id, refs.item_id));
        if (!original || original.id !== refs.item_id || original.vaultId !== refs.vault_id || original.version !== command.expected_item_version || original.category !== command.expected_item_category || !Array.isArray(original.fields)) fail("ONEPASSWORD_SDK_ITEM_CUSTODY_CONFLICT");
        const targets = original.fields.filter((field) => field.id === refs.field_id && field.fieldType === "Concealed");
        if (targets.length !== 1 || original.fields.filter((field) => field.id === refs.field_id).length !== 1) fail("ONEPASSWORD_SDK_TARGET_FIELD_AMBIGUOUS");
        outbound = clone(original); const target = outbound.fields.find((field) => field.id === refs.field_id); target.value = material;
        if (!isDeepStrictEqual(normalizeForPreservation(original, refs.field_id, material), normalizeForPreservation(outbound, refs.field_id, material))) fail("ONEPASSWORD_SDK_NON_TARGET_DATA_DRIFT");
        const updated = clone(await client.items.put(outbound));
        if (!updated || updated.id !== refs.item_id || updated.vaultId !== refs.vault_id || updated.version <= original.version || !constantTimeEqual(updated.fields?.find((field) => field.id === refs.field_id)?.value, material) || !isDeepStrictEqual(normalizeForPreservation(original, refs.field_id, material), normalizeForPreservation(updated, refs.field_id, material))) fail("ONEPASSWORD_SDK_PUT_DRIFT");
        custody = { refs, command: clone(command), original: clone(original), expected_version: updated.version, material };
        return freeze({ state: "SAVE_ACCEPTED", save_invoked: true, secret_material_output: false });
      } catch (error) { fail(error?.code?.startsWith("ONEPASSWORD_SDK_") ? error.code : "ONEPASSWORD_SDK_OPERATION_FAILED"); }
      finally { refs = null; original = null; outbound = null; }
    },
    async readbackCredential(command) {
      if (!custody || command.operation_id_sha256 !== custody.command.operation_id_sha256) fail("ONEPASSWORD_SDK_READBACK_CUSTODY_CONFLICT");
      try {
        const item = clone(await client.items.get(custody.refs.vault_id, custody.refs.item_id));
        const field = item?.fields?.filter((entry) => entry.id === custody.refs.field_id && entry.fieldType === "Concealed");
        if (item?.version !== custody.expected_version || field?.length !== 1 || !constantTimeEqual(field[0].value, custody.material) || !isDeepStrictEqual(normalizeForPreservation(custody.original, custody.refs.field_id, custody.material), normalizeForPreservation(item, custody.refs.field_id, custody.material))) fail("ONEPASSWORD_SDK_READBACK_DRIFT");
        return freeze({ schema: "pookakind.vault-exact-one-credential-save-readback/v1", provider_id: command.provider_id, work_object_id: command.work_object_id, vault_scope_ref: command.vault_scope_ref, account_ref: command.account_ref, vault_item_ref: command.vault_item_ref, credential_change_ref_sha256: command.credential_change_ref_sha256, exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", readback_sha256: readbackDigest(command, custody.refs, item), secret_material_output: false });
      } finally { if (custody) custody.material = null; custody = null; }
    },
  });
}
