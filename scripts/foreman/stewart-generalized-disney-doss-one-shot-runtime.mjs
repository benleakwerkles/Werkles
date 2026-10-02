import { randomBytes, createHash, createPublicKey } from "node:crypto";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { createClient as createOfficialOnePasswordClient } from "@1password/sdk";

import { createDisneyMyDisneyDossDurableDependencyFactory } from "../../lib/harvey/disney-mydisney-doss-durable-dependencies.mjs";
import { createOnePasswordServiceAccountClient } from "../../lib/harvey/onepassword-sdk-service-account-client.mjs";
import { createOnePasswordSdkServiceAccountCapability } from "../../lib/harvey/onepassword-sdk-service-account-capability.mjs";
import { createOnePasswordSdkIdentityHandleCapability } from "../../lib/harvey/onepassword-sdk-identity-handle-capability.mjs";
import { createCompositeDisneyCredentialHandleResolver } from "../../lib/harvey/authenticated-inbox-identity-handle.mjs";
import { bindAuthenticatedInboxIdentityToDpapi } from "../../lib/harvey/authenticated-inbox-identity-dpapi-binding.mjs";
import { createDpapiSecretHandleWriter } from "../../lib/harvey/authenticated-inbox-identity-dpapi-binding.mjs";
import { createStewartPrivateInboxEmailOtpHandle, resolveStewartPrivateInboxEmailOtpHandle } from "../../lib/harvey/private-inbox-email-otp-handle.mjs";
import { createDossPrivateInboxEmailOtpAdapters } from "../../lib/harvey/private-inbox-email-otp-doss-adapter.mjs";
import { canonicalJson, keyFingerprint, signDurableRecord } from "../../lib/harvey/station-crypto-core.mjs";
import { verifyStewartGeneralizedDisneySessionActivation } from "../../lib/harvey/stewart-generalized-disney-session-runner.mjs";
import { createDossWindowsDisneyFullConversionMachineHandsRuntime, verifyDossDisneyApprovalLogEntry } from "./stewart-generalized-doss-machine-hands-runtime.mjs";
import { createPasswordProviderDeferredDurableStore, runPasswordProviderDeferredExecution } from "../../lib/harvey/password-provider-deferred-execution.mjs";
import { createStewartDisneyDeferredLiveStages } from "../../lib/harvey/stewart-disney-deferred-live-adapter.mjs";
import { createStewartDisneyOnePasswordVaultOrgan } from "../../lib/harvey/stewart-disney-onepassword-vault-organ.mjs";
import { createDossImportedCredentialBridge, createDossOpaqueCredentialHandleResolver } from "../../lib/harvey/stewart-doss-opaque-credential-bridge.mjs";

export { createDossOpaqueCredentialHandleResolver } from "../../lib/harvey/stewart-doss-opaque-credential-bridge.mjs";

const HASH = /^[a-f0-9]{64}$/;
const HANDLE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function snapshot(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object" || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value); const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(code);
    return keys.map((key) => { const descriptor = descriptors[key]; if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code); return snapshot(descriptor.value, code); });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    output[key] = snapshot(descriptor.value, code);
  }
  return output;
}
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}
function safeReceipt(value) {
  const serialized = canonicalJson(value);
  if (/"(?:otp_material|signing_private_key_pem|access_steward_private_key_pem|token|vault_id|item_id|field_id)"\s*:/i.test(serialized)) fail("DISNEY_DOSS_ONE_SHOT_PRIVATE_RECEIPT_FORBIDDEN");
  return Object.freeze(value);
}

export function bindDisneyOneShotActivationCustody({ activation, capability_record_sha256, transaction: rawTransaction, otp_transaction: rawOtpTransaction, otp_handle }) {
  const transaction = snapshot(rawTransaction, "DISNEY_DOSS_ONE_SHOT_TRANSACTION_NOT_PLAIN");
  const otpTransaction = snapshot(rawOtpTransaction, "DISNEY_DOSS_ONE_SHOT_OTP_TRANSACTION_NOT_PLAIN");
  const transactionBody = Object.fromEntries(Object.entries(transaction).filter(([key]) => key !== "transaction_sha256"));
  const otpBody = Object.fromEntries(Object.entries(otpTransaction).filter(([key]) => key !== "transaction_sha256"));
  if (activation?.state !== "ACTIVATION_AUTHORITY_VERIFIED_NOT_EXECUTED" || !HASH.test(activation.account_ref_sha256 ?? "")
    || transaction.schema !== "pookakind.disney-mydisney-full-conversion-transaction/v1" || transaction.state !== "PREPARED_NOT_ACTIVATED"
    || transaction.provider_id !== "DISNEY_MYDISNEY" || transaction.account_ref_sha256 !== activation.account_ref_sha256
    || !HASH.test(capability_record_sha256 ?? "") || transaction.vault_sdk_adapter_capability?.capability_record_sha256 !== capability_record_sha256
    || transaction.max_uses !== 1 || transaction.fixed !== false || transaction.password_conversion !== false
    || !HASH.test(transaction.transaction_sha256 ?? "") || createHash("sha256").update(canonicalJson(transactionBody)).digest("hex") !== transaction.transaction_sha256) fail("DISNEY_DOSS_ONE_SHOT_ACTIVATION_TRANSACTION_CUSTODY_CONFLICT");
  if (otpTransaction.schema !== "pookakind.disney-mydisney-email-otp-transaction/v1" || otpTransaction.state !== "SOURCE_ONLY_NOT_ACTIVATED"
    || otpTransaction.provider_id !== "DISNEY_MYDISNEY" || otpTransaction.generalized_operation?.admission?.command?.account_ref_sha256 !== activation.account_ref_sha256
    || otpTransaction.otp_handle?.ref_sha256 !== otp_handle?.ref_sha256 || !HASH.test(otpTransaction.transaction_sha256 ?? "")
    || createHash("sha256").update(canonicalJson(otpBody)).digest("hex") !== otpTransaction.transaction_sha256) fail("DISNEY_DOSS_ONE_SHOT_ACTIVATION_OTP_CUSTODY_CONFLICT");
  return Object.freeze({ transaction: Object.freeze(transaction), otp_transaction: Object.freeze(otpTransaction) });
}

/** Binds the previously imported local Blind Master to one exact account operation. */
export function createDossImportedBlindMasterBridge({ resolver_executable, allowed_root, canonical_origin_sha256, operation_sha256, account_ref_sha256, run = spawnSync }) {
  if (!HASH.test(operation_sha256 ?? "") || !HASH.test(account_ref_sha256 ?? "")) fail("DISNEY_DOSS_BLIND_BRIDGE_INPUT_INVALID");
  return createDossImportedCredentialBridge({ resolver_executable, allowed_root, provider_id: "DISNEY_MYDISNEY",
    canonical_origin_sha256, operation_sha256, account_ref_sha256, action: "PASSWORD_RESET",
    role: "NEW_PASSWORD", handle_name: "blind-master", run });
}

/** Imports one preapproved, authenticated Disney credential directly into
 * Stewart's local DPAPI store. The source callback runs inside the Doss
 * process; neither its material nor its errors are returned in the receipt. */
export async function createDossDisneyPreapprovedCredentialBridge({
  resolver_executable, allowed_root, local_app_data, operation_sha256,
  account_ref_sha256, source_ref_sha256, handle_name, read_authenticated_credential,
  activation, approval, now = Date.now(),
  run_protect, run_resolve = spawnSync,
}) {
  if (![operation_sha256, account_ref_sha256, source_ref_sha256].every((value) => HASH.test(value ?? ""))
    || !HANDLE_NAME.test(handle_name ?? "") || typeof read_authenticated_credential !== "function"
    || typeof local_app_data !== "string" || !local_app_data || typeof allowed_root !== "string"
    || resolve(allowed_root).toLowerCase() !== resolve(local_app_data, "PookaKind", "Stewart", "SecretHandles").toLowerCase()) {
    fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_INPUT_INVALID");
  }
  try { realpathSync(resolve(resolver_executable)); }
  catch { fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_RESOLVER_UNAVAILABLE"); }
  if (activation?.decision !== "APPROVED" || activation?.provider_id !== "DISNEY_MYDISNEY"
    || activation?.machine !== "DOSS" || activation?.one_shot !== true
    || activation.operation_sha256 !== operation_sha256 || activation.account_ref_sha256 !== account_ref_sha256
    || !HASH.test(activation.activation_record_sha256 ?? "") || !HASH.test(activation.package_sha256 ?? "")
    || approval?.state !== "EXACT_APPROVAL_LOG_ENTRY_VERIFIED"
    || approval.package_sha256 !== activation.package_sha256
    || approval.approval_log_entry_sha256 !== activation.approval_log_entry_sha256
    || !Number.isFinite(now) || !Number.isFinite(Date.parse(activation.expires_at))
    || Date.parse(activation.expires_at) < now) {
    fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_AUTHORITY_INVALID");
  }
  const ref_sha256 = createHash("sha256").update(canonicalJson([
    "DISNEY_MYDISNEY", operation_sha256, account_ref_sha256, source_ref_sha256, "CURRENT_PASSWORD",
  ])).digest("hex");
  let material;
  let sourceResult;
  let binding;
  try {
    try {
      sourceResult = await read_authenticated_credential(Object.freeze({
        provider_id: "DISNEY_MYDISNEY", operation_sha256, account_ref_sha256,
        source_ref_sha256, role: "CURRENT_PASSWORD",
      }));
    } catch { fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_SOURCE_FAILED"); }
    exact(sourceResult, ["account_ref_sha256", "material", "source_ref_sha256"], "DISNEY_DOSS_PREAPPROVED_CREDENTIAL_SOURCE_INVALID");
    if (sourceResult.account_ref_sha256 !== account_ref_sha256 || sourceResult.source_ref_sha256 !== source_ref_sha256
      || typeof sourceResult.material !== "string" || sourceResult.material.length < 1
      || Buffer.byteLength(sourceResult.material, "utf8") > 4096) fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_SOURCE_INVALID");
    material = sourceResult.material;
    const writer = createDpapiSecretHandleWriter({ resolver_path: resolver_executable, local_app_data, run_protect });
    try { binding = writer({ handle_name, material }); }
    catch { fail("DISNEY_DOSS_PREAPPROVED_CREDENTIAL_SEAL_FAILED"); }
  } finally {
    if (sourceResult && typeof sourceResult === "object" && Object.hasOwn(sourceResult, "material")) {
      try { sourceResult.material = null; } catch { /* immutable source result cannot be scrubbed here */ }
    }
    material = null;
    sourceResult = null;
  }
  const resolve_handle = createDossOpaqueCredentialHandleResolver({ resolver_executable, allowed_root,
    bindings: [{ schema: "pookakind.stewart-doss-opaque-credential-binding/v1", ref_sha256,
      handle_name, dpapi_path: binding.dpapi_path }], run: run_resolve });
  return Object.freeze({ handle: Object.freeze({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256 }),
    resolve_handle, receipt: Object.freeze({ schema: "pookakind.disney-doss-preapproved-credential-bridge/v1",
      state: "EXACT_DPAPI_CURRENT_PASSWORD_BOUND_NOT_USED", operation_sha256, account_ref_sha256,
      source_ref_sha256, handle_ref_sha256: ref_sha256, sealed_sha256: binding.sealed_sha256,
      provider_contacted: false, secret_material_output: false }) });
}

export async function createDossAuthenticatedInboxIdentityBridge({ resolver_executable, allowed_root, local_app_data, handle_name, provider_id, account_ref_sha256, route_epoch_sha256, mailbox_provider, read_authenticated_mailbox_identity, now = Date.now(), randomBytes: identityRandomBytes, run_protect, run_resolve = spawnSync }) {
  const prepared = await bindAuthenticatedInboxIdentityToDpapi({ provider_id, account_ref_sha256, route_epoch_sha256, mailbox_provider, handle_name, read_authenticated_mailbox_identity }, { resolver_path: resolver_executable, local_app_data, run_protect, now, randomBytes: identityRandomBytes });
  const resolveHandle = createDossOpaqueCredentialHandleResolver({
    resolver_executable,
    allowed_root,
    bindings: [{ schema: "pookakind.stewart-doss-opaque-credential-binding/v1", ref_sha256: prepared.handle.ref_sha256, handle_name: prepared.binding.handle_name, dpapi_path: prepared.binding.dpapi_path }],
    run: run_resolve,
  });
  return Object.freeze({
    handle: prepared.handle,
    resolve_handle: resolveHandle,
    receipt: safeReceipt({ schema: "pookakind.disney-doss-authenticated-mailbox-identity-bridge-receipt/v1", state: "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED", provider_id, account_ref_sha256, route_epoch_sha256, handle_ref_sha256: prepared.handle.ref_sha256, sealed_sha256: prepared.binding.sealed_sha256, max_uses: 1, mailbox_read_performed: true, provider_contacted: false, secret_material_output: false }),
  });
}

export function createDossAuthenticatedInboxOtpBridge({ root, owner_id, authority, signing_private_key_pem, binding, producer, readAuthenticatedInboxOtp, now = () => Date.now(), run }) {
  if (typeof readAuthenticatedInboxOtp !== "function" || typeof now !== "function" || typeof signing_private_key_pem !== "string") fail("DISNEY_DOSS_OTP_BRIDGE_INPUT_INVALID");
  let derivedPublicKey;
  try { derivedPublicKey = createPublicKey(signing_private_key_pem).export({ type: "spki", format: "pem" }); } catch { fail("DISNEY_DOSS_OTP_SIGNER_INVALID"); }
  if (typeof derivedPublicKey !== "string" || keyFingerprint(derivedPublicKey) !== authority?.public_key_sha256) fail("DISNEY_DOSS_OTP_SIGNER_INVALID");
  const base = createDossPrivateInboxEmailOtpAdapters({ root, owner_id, authority, run });
  const adapters = Object.freeze({
    ...base,
    randomBytes: async (length) => randomBytes(length),
    signRecord: async (payload) => signDurableRecord(signing_private_key_pem, payload, { issuer: authority.issuer, audience: authority.audience }),
  });
  let captured = null; let capturePromise = null;
  return Object.freeze({
    async capture_once() {
      if (!capturePromise) capturePromise = (async () => {
        const inbox = await readAuthenticatedInboxOtp();
        exact(inbox, ["otp_material", "source"], "DISNEY_DOSS_AUTHENTICATED_INBOX_RESULT_INVALID");
        try {
          const created = await createStewartPrivateInboxEmailOtpHandle({ schema: "pookakind.stewart-private-inbox-email-otp-create-input/v1", now: now(), ttl_ms: 120_000, otp_material: inbox.otp_material, binding, producer, source: inbox.source }, adapters);
          captured = Object.freeze({ handle: created.handle, receipt: created.receipt });
          return captured;
        } finally { inbox.otp_material = null; }
      })();
      return capturePromise;
    },
    async resolve(handle) {
      if (!captured || canonicalJson(handle) !== canonicalJson(captured.handle)) fail("DISNEY_DOSS_OTP_HANDLE_NOT_CAPTURED");
      return resolveStewartPrivateInboxEmailOtpHandle(handle, { purpose: "DISNEY_MYDISNEY_EMAIL_OTP", now: now(), binding, producer }, adapters);
    },
  });
}

export async function createOfficialOnePasswordDisneyVaultBundle({ env = process.env, sdk_create_client = createOfficialOnePasswordClient, capability_input, identity_capability_input = null, now = Date.now() }) {
  if (typeof sdk_create_client !== "function" || !capability_input || typeof capability_input !== "object") fail("DISNEY_DOSS_ONEPASSWORD_INPUT_INVALID");
  const clientBundle = await createOnePasswordServiceAccountClient({ createClient: sdk_create_client, env });
  const produced = await createOnePasswordSdkServiceAccountCapability({ ...capability_input, client: clientBundle.client, client_receipt: clientBundle.receipt }, now);
  const identity = identity_capability_input === null ? null : await createOnePasswordSdkIdentityHandleCapability({ ...identity_capability_input, client: clientBundle.client, client_receipt: clientBundle.receipt }, now);
  return Object.freeze({
    adapter: produced.create_adapter(),
    capability_record: produced.capability_record,
    capability_authority: produced.capability_authority,
    identity: identity === null ? null : Object.freeze({ handle: identity.handle, capability_record: identity.capability_record, resolve_handle: identity.resolve_handle }),
    receipt: safeReceipt({ schema: "pookakind.disney-doss-onepassword-vault-bundle-receipt/v1", state: identity === null ? "OFFICIAL_CLIENT_EXACT_TARGET_READY" : "OFFICIAL_CLIENT_PASSWORD_AND_IDENTITY_TARGETS_READY", client_instance_sha256: produced.receipt.client_instance_sha256, capability_record_sha256: produced.receipt.capability_record_sha256, target_binding_sha256: produced.receipt.target_binding_sha256, machine_sha256: produced.receipt.machine_sha256, identity_capability_record_sha256: identity?.receipt.capability_record_sha256 ?? null, identity_handle_ref_sha256: identity?.receipt.handle_ref_sha256 ?? null, service_account_auth_used: true, provider_read_performed: true, vault_mutated: false, secret_material_output: false, private_refs_output: false }),
  });
}

/** Private Doss 1Password service-account path for the deferred live flow.
 * The service token is consumed before provider contact; item reads and writes
 * remain inside the exact-one vault organ after fresh sign-in is proved. */
export async function createDossDisneyOnePasswordVaultOrgan({ env = process.env, sdk_create_client = createOfficialOnePasswordClient, scope, target_vault_id, resolveIdentity, resolveCredential, title = "Disney" }) {
  if (!Array.isArray(scope) || scope.length < 1 || scope.some((id) => typeof id !== "string" || !id)
    || typeof target_vault_id !== "string" || !target_vault_id) fail("DISNEY_DOSS_EXACT_ONE_VAULT_SCOPE_INVALID");
  const { client, receipt } = await createOnePasswordServiceAccountClient({ createClient: sdk_create_client, env });
  const organ = createStewartDisneyOnePasswordVaultOrgan({ client, scope, target_vault_id, resolveIdentity, resolveCredential, title });
  return Object.freeze({ organ, receipt: Object.freeze({ schema: "pookakind.disney-doss-exact-one-vault-organ/v1", state: "OFFICIAL_CLIENT_BOUND_NOT_EXECUTED",
    client_instance_sha256: receipt.client_instance_sha256, target_vault_id_sha256: createHash("sha256").update(target_vault_id).digest("hex"),
    scope_count: scope.length, token_cleared_after_creation: receipt.token_cleared_after_creation,
    vault_read_performed: false, vault_mutated: false, secret_material_output: false }) });
}

export async function createDisneyMyDisneyDossOneShotRuntime({ package_root, session_root, chrome_executable_path, approval_log_path, durable_root, owner_id, activation_preflight, credential_resolver, identity_bridge = null, otp_bridge, onepassword, compile_transaction, compile_otp_transaction, create_runtime = createDossWindowsDisneyFullConversionMachineHandsRuntime, now = () => Date.now() }) {
  if (typeof credential_resolver !== "function" || typeof compile_transaction !== "function" || typeof compile_otp_transaction !== "function" || typeof create_runtime !== "function" || typeof now !== "function"
    || typeof otp_bridge?.capture_once !== "function" || typeof otp_bridge?.resolve !== "function") fail("DISNEY_DOSS_ONE_SHOT_INPUT_INVALID");
  const activation = verifyStewartGeneralizedDisneySessionActivation(activation_preflight, now());
  verifyDossDisneyApprovalLogEntry(approval_log_path, activation.approval_log_entry_sha256);
  const vault = await createOfficialOnePasswordDisneyVaultBundle(onepassword);
  const identity = vault.identity ?? identity_bridge;
  if (identity !== null && (identity?.handle?.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(identity.handle.ref_sha256 ?? "") || typeof identity.resolve_handle !== "function")) fail("DISNEY_DOSS_IDENTITY_BRIDGE_INVALID");
  const transactionCandidate = snapshot(await compile_transaction({ capability_record: vault.capability_record, capability_authority: vault.capability_authority, identity_handle: identity?.handle ?? null }), "DISNEY_DOSS_ONE_SHOT_TRANSACTION_NOT_PLAIN");
  if (transactionCandidate?.account_ref_sha256 !== activation.account_ref_sha256
    || transactionCandidate?.vault_sdk_adapter_capability?.capability_record_sha256 !== vault.receipt.capability_record_sha256) fail("DISNEY_DOSS_ONE_SHOT_ACTIVATION_TRANSACTION_CUSTODY_CONFLICT");
  const otp = await otp_bridge.capture_once();
  const otpTransactionCandidate = await compile_otp_transaction({ otp_handle: otp.handle });
  const { transaction, otp_transaction: otpTransaction } = bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: vault.receipt.capability_record_sha256, transaction: transactionCandidate, otp_transaction: otpTransactionCandidate, otp_handle: otp.handle });
  const resolveCredentialHandle = identity === null ? credential_resolver : createCompositeDisneyCredentialHandleResolver({ identity_handle: identity.handle, identity_resolver: identity.resolve_handle, password_resolver: credential_resolver });
  const createDependencies = createDisneyMyDisneyDossDurableDependencyFactory({ root: durable_root, owner_id, resolveOtpHandle: otp_bridge.resolve, resolveCredentialHandle, vaultAdapter: vault.adapter, now });
  const runtime = create_runtime({ packageRoot: package_root, sessionRoot: session_root, chromeExecutablePath: chrome_executable_path, approvalLogPath: approval_log_path, transaction, otpTransaction, createDependencies });
  return Object.freeze({
    runtime,
    transaction,
    otp_transaction: otpTransaction,
    receipt: safeReceipt({ schema: "pookakind.disney-mydisney-doss-one-shot-runtime-receipt/v1", state: "DEPENDENCIES_BOUND_NOT_EXECUTED", activation_preflight_receipt_sha256: activation.receipt_sha256, onepassword_receipt_sha256: createHash("sha256").update(canonicalJson(vault.receipt)).digest("hex"), otp_custody_receipt_sha256: createHash("sha256").update(canonicalJson(otp.receipt)).digest("hex"), durable_owner_id_sha256: createHash("sha256").update(owner_id).digest("hex"), identity_handle_bound: identity !== null, identity_source: vault.identity ? "ONEPASSWORD_EXACT_ITEM" : identity_bridge ? "AUTHENTICATED_MAILBOX" : null, onepassword_provider_read_performed: true, disney_provider_contacted: false, vault_mutated: false, password_conversion: false, secret_material_output: false }),
  });
}

/** New live composition boundary. Unlike the legacy factory above, this does
 * not read 1Password or capture an OTP during construction. The exact Disney
 * recovery request must succeed before the captureChallenge stage can run.
 */
export async function runDisneyMyDisneyDeferredDossExecution({ approval_log_path, durable_root, activation_preflight, plan, operation_sha256, binding_sha256, live_adapter, now = () => Date.now() }) {
  if (typeof now !== "function" || !live_adapter || typeof live_adapter !== "object") fail("DISNEY_DOSS_DEFERRED_INPUT_INVALID");
  const activation = verifyStewartGeneralizedDisneySessionActivation(activation_preflight, now());
  verifyDossDisneyApprovalLogEntry(approval_log_path, activation.approval_log_entry_sha256);
  return runVerifiedDisneyMyDisneyDeferredDossExecution({ activation, durable_root, plan, operation_sha256, binding_sha256, live_adapter });
}

export async function runVerifiedDisneyMyDisneyDeferredDossExecution({ activation, durable_root, plan, operation_sha256, binding_sha256, live_adapter }) {
  if (!activation || typeof activation !== "object" || !live_adapter || typeof live_adapter !== "object") fail("DISNEY_DOSS_DEFERRED_INPUT_INVALID");
  if (plan?.schema !== "pookakind.password-provider-flow-plan/v1"
    || plan.provider_id !== "DISNEY_MYDISNEY" || plan.provider !== "Disney MyDisney"
    || plan.provider_class !== "WEB_EMAIL_RESET" || plan.recovery_mode !== "RESET_EMAIL"
    || plan.account_ref_sha256 !== activation.account_ref_sha256
    || !Array.isArray(plan.challenges) || !plan.challenges.includes("EMAIL_OTP")) fail("DISNEY_DOSS_DEFERRED_PLAN_INVALID");
  const stages = createStewartDisneyDeferredLiveStages({
    capability: live_adapter.capability,
    package_sha256: activation.package_sha256,
    source_release_sha256: activation.source_release_sha256,
    driver: live_adapter.driver,
  });
  const store = createPasswordProviderDeferredDurableStore({ root: durable_root });
  const dependencies = Object.freeze({ ...stages, ...store });
  return runPasswordProviderDeferredExecution({ plan, operation_sha256, binding_sha256, dependencies });
}
