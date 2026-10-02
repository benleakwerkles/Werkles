import { createHash } from "node:crypto";

import {
  projectDisneyMyDisneyPasswordConversion,
  runDisneyMyDisneyEmailOtpTransaction,
} from "./disney-mydisney-email-otp-transaction.mjs";
import { compileStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { runStewartGeneralizedNativeHostOperation } from "./stewart-generalized-native-host.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";
import { compileExactOneVaultCredentialSaveOnce, runExactOneVaultCredentialSaveOnce } from "./vault-exact-one-credential-save-once.mjs";
import { verifyOnePasswordSdkServiceAccountCapability } from "./onepassword-sdk-field-preserving-adapter.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = "DISNEY_MYDISNEY";
const DISNEY_ORIGIN = "https://www.disneyplus.com";
const FORBIDDEN_POSSESSION_TERM = /(?:passkey|webauthn|possession)/i;
const ROUTE_FIELDS = ["canonical_url", "redirect_url", "schema"];
const BLOCKER = "NO_SUPPORTED_ONE_SHOT_OPAQUE_VAULT_CREDENTIAL_SAVE_AND_READBACK_EXECUTOR";
const INPUT_FIELDS = ["account_ref_sha256", "fresh_sign_in", "owned_session_ref_sha256", "password_change_sha256", "password_reset", "provider_id", "schema", "vault_credential_save_input", "vault_sdk_adapter_capability_record"];
const STEP_FIELDS = ["authority_record", "descriptor", "extension_id_sha256", "handles", "observation", "operator_authority", "route"];
const DOSS_HAND_METHODS = [
  "inspectCleanAbsent", "writeNativeHostRegistry", "readNativeHostRegistry", "createUniqueProfile",
  "launchFixedExtension", "runPinnedHttpsSyntheticRoundTrip", "runBoundDisneyTransaction",
  "terminateOwnedSession", "removeNativeHostRegistry", "removeExactProfile", "inspectResidualState",
];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function textDigest(value) { return createHash("sha256").update(String(value), "utf8").digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
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
function assertHash(value, code) { if (!HASH.test(value ?? "")) fail(code); }

export const DISNEY_MYDISNEY_PASSWORD_ONLY_CONTROL_GUARD = 'body:not(:has([id*="passkey" i], [name*="passkey" i], [data-testid*="passkey" i], [aria-label*="passkey" i], [href*="passkey" i], [id*="webauthn" i], [name*="webauthn" i], [data-testid*="webauthn" i], [aria-label*="webauthn" i], [href*="webauthn" i], [id*="possession" i], [name*="possession" i], [data-testid*="possession" i], [aria-label*="possession" i], [href*="possession" i]))';

export const DISNEY_MYDISNEY_PROVIDER_ROUTES = freeze({
  PASSWORD_RESET: { schema: "pookakind.disney-mydisney-provider-route/v1", canonical_url: `${DISNEY_ORIGIN}/identity/password-reset`, redirect_url: `${DISNEY_ORIGIN}/home` },
  SIGN_IN: { schema: "pookakind.disney-mydisney-provider-route/v1", canonical_url: `${DISNEY_ORIGIN}/identity/login`, redirect_url: `${DISNEY_ORIGIN}/home` },
});

function validateDisneyProviderRoute(route, kind, command = null) {
  exact(route, ROUTE_FIELDS, "DISNEY_FULL_CONVERSION_ROUTE_INVALID");
  const expected = DISNEY_MYDISNEY_PROVIDER_ROUTES[kind];
  if (!expected || canonicalJson(route) !== canonicalJson(expected)) fail("DISNEY_FULL_CONVERSION_ROUTE_INVALID");
  let canonical; let redirect;
  try { canonical = new URL(route.canonical_url); redirect = new URL(route.redirect_url); }
  catch { fail("DISNEY_FULL_CONVERSION_ROUTE_INVALID"); }
  if (canonical.origin !== DISNEY_ORIGIN || redirect.origin !== DISNEY_ORIGIN || canonical.username || canonical.password
    || redirect.username || redirect.password || canonical.search || canonical.hash || redirect.search || redirect.hash
    || FORBIDDEN_POSSESSION_TERM.test(canonical.href) || FORBIDDEN_POSSESSION_TERM.test(redirect.href)) fail("DISNEY_FULL_CONVERSION_ROUTE_INVALID");
  if (command && (command.canonical_origin_sha256 !== textDigest(canonical.origin)
    || command.route_epoch_sha256 !== textDigest(canonical.href))) fail("DISNEY_FULL_CONVERSION_ROUTE_CUSTODY_CONFLICT");
}

function validateDisneyPasswordOnlyDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)
    || !Array.isArray(descriptor.field_descriptors) || !Array.isArray(descriptor.readback_descriptors)
    || typeof descriptor.final_control_descriptor?.selector !== "string"
    || !descriptor.final_control_descriptor.selector.startsWith(`${DISNEY_MYDISNEY_PASSWORD_ONLY_CONTROL_GUARD} `)) fail("DISNEY_FULL_CONVERSION_PASSWORD_ONLY_GUARD_REQUIRED");
  const nonGuardSelectors = [
    ...descriptor.field_descriptors.map(({ selector }) => selector),
    ...descriptor.readback_descriptors.map(({ selector }) => selector),
  ];
  if (nonGuardSelectors.some((selector) => typeof selector !== "string" || FORBIDDEN_POSSESSION_TERM.test(selector))) fail("DISNEY_FULL_CONVERSION_POSSESSION_CONTROL_FORBIDDEN");
}

function compileStep(raw, kind, accountRef, now) {
  const step = clone(raw, "DISNEY_FULL_CONVERSION_STEP_NOT_CLONEABLE");
  exact(step, STEP_FIELDS, "DISNEY_FULL_CONVERSION_STEP_FIELDS_INVALID");
  if (!Array.isArray(step.handles)) fail("DISNEY_FULL_CONVERSION_STEP_HANDLES_INVALID");
  validateDisneyProviderRoute(step.route, kind);
  validateDisneyPasswordOnlyDescriptor(step.descriptor);
  const compiled = compileStewartBackgroundCredentialOperation({
    authorityRecord: step.authority_record,
    operatorAuthority: step.operator_authority,
    observation: step.observation,
    now,
  });
  if (compiled.admission.decision !== "EXECUTE_ONCE" || compiled.admission.command.operation_kind !== kind
    || compiled.admission.command.account_ref_sha256 !== accountRef) fail("DISNEY_FULL_CONVERSION_STEP_CUSTODY_CONFLICT");
  const command = compiled.admission.command;
  validateDisneyProviderRoute(step.route, kind, command);
  if (!HASH.test(step.extension_id_sha256 ?? "") || command.max_uses !== 1) fail("DISNEY_FULL_CONVERSION_STEP_INVALID");
  if (step.handles.length !== command.fields.length) fail("DISNEY_FULL_CONVERSION_STEP_HANDLES_INVALID");
  for (let index = 0; index < step.handles.length; index++) {
    exact(step.handles[index], ["ref_sha256", "schema"], "DISNEY_FULL_CONVERSION_STEP_HANDLE_INVALID");
    if (step.handles[index].schema !== "pookakind.stewart-opaque-credential-handle/v1"
      || step.handles[index].ref_sha256 !== command.fields[index].handle_ref_sha256) fail("DISNEY_FULL_CONVERSION_STEP_HANDLE_CUSTODY_CONFLICT");
  }
  return { ...step, compiled, operation_id_sha256: command.operation_id_sha256 };
}

export function compileDisneyMyDisneyFullConversion(rawInput, now = Date.now(), options = {}) {
  const input = clone(rawInput, "DISNEY_FULL_CONVERSION_INPUT_NOT_CLONEABLE");
  exact(input, INPUT_FIELDS, "DISNEY_FULL_CONVERSION_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.disney-mydisney-full-conversion-input/v1" || input.provider_id !== PROVIDER_ID) fail("DISNEY_FULL_CONVERSION_INPUT_INVALID");
  for (const field of ["account_ref_sha256", "password_change_sha256", "owned_session_ref_sha256"]) assertHash(input[field], "DISNEY_FULL_CONVERSION_CUSTODY_INVALID");
  const reset = compileStep(input.password_reset, "PASSWORD_RESET", input.account_ref_sha256, now);
  const signIn = compileStep(input.fresh_sign_in, "SIGN_IN", input.account_ref_sha256, now);
  if (reset.compiled.admission.command.canonical_origin_sha256 !== signIn.compiled.admission.command.canonical_origin_sha256) fail("DISNEY_FULL_CONVERSION_ORIGIN_CUSTODY_CONFLICT");
  if (reset.operation_id_sha256 === signIn.operation_id_sha256) fail("DISNEY_FULL_CONVERSION_OPERATION_REUSE");
  const vaultAdmission = input.vault_credential_save_input === null ? null
    : (options.compileVaultSave ?? compileExactOneVaultCredentialSaveOnce)(input.vault_credential_save_input);
  const resetNewPassword = reset.compiled.admission.command.fields.find((field) => field.role === "NEW_PASSWORD");
  const resetConfirmPassword = reset.compiled.admission.command.fields.find((field) => field.role === "CONFIRM_PASSWORD");
  const signInCurrentPassword = signIn.compiled.admission.command.fields.find((field) => field.role === "CURRENT_PASSWORD");
  if (!resetNewPassword || !resetConfirmPassword || !signInCurrentPassword
    || resetNewPassword.handle_ref_sha256 !== resetConfirmPassword.handle_ref_sha256
    || resetNewPassword.handle_ref_sha256 !== signInCurrentPassword.handle_ref_sha256) fail("DISNEY_FULL_CONVERSION_PASSWORD_HANDLE_CUSTODY_CONFLICT");
  if (vaultAdmission?.decision === "EXECUTE_ONCE") {
    const vaultCommand = vaultAdmission.command;
    if (!vaultCommand || vaultCommand.provider_id !== PROVIDER_ID
      || digest(vaultCommand.account_ref) !== input.account_ref_sha256
      || vaultCommand.credential_change_ref_sha256 !== input.password_change_sha256
      || vaultCommand.credential_handle_ref_sha256 !== resetNewPassword.handle_ref_sha256) fail("DISNEY_FULL_CONVERSION_VAULT_CUSTODY_CONFLICT");
  }
  const vaultTargetBinding = vaultAdmission?.decision === "EXECUTE_ONCE" ? digest({ provider_id: vaultAdmission.command.provider_id, account_ref: vaultAdmission.command.account_ref, vault_scope_ref: vaultAdmission.command.vault_scope_ref, vault_item_ref: vaultAdmission.command.vault_item_ref, target_field_ref_sha256: vaultAdmission.command.target_field_ref_sha256 }) : null;
  let sdkCapability = null;
  if (input.vault_sdk_adapter_capability_record !== null) {
    if (!options.sdkCapabilityAuthority) fail("DISNEY_FULL_CONVERSION_SDK_CAPABILITY_AUTHORITY_UNPINNED");
    sdkCapability = (options.verifySdkCapability ?? verifyOnePasswordSdkServiceAccountCapability)({ record: input.vault_sdk_adapter_capability_record, authority: options.sdkCapabilityAuthority, now });
  }
  const sdkCallable = sdkCapability?.schema === "pookakind.onepassword-sdk-field-preserving-capability/v1"
    && sdkCapability.state === "SERVICE_ACCOUNT_EXACT_SCOPE"
    && sdkCapability.field_preserving_sdk_adapter_callable === true
    && sdkCapability.exact_scope_proved === true
    && sdkCapability.prompt_required === false
    && HASH.test(sdkCapability.capability_record_sha256 ?? "")
    && sdkCapability.target_binding_sha256 === vaultTargetBinding
    && sdkCapability.vault_scope_ref_sha256 === (vaultAdmission?.decision === "EXECUTE_ONCE" ? digest(vaultAdmission.command.vault_scope_ref) : null)
    && sdkCapability.machine_sha256 === vaultAdmission?.command?.machine_sha256;
  const live = vaultAdmission?.decision === "EXECUTE_ONCE" && sdkCallable;
  const body = {
    schema: "pookakind.disney-mydisney-full-conversion-transaction/v1",
    state: live ? "PREPARED_NOT_ACTIVATED" : "BLOCKED_NOT_ACTIVATED",
    blocker: live ? null : BLOCKER,
    provider_id: PROVIDER_ID,
    account_ref_sha256: input.account_ref_sha256,
    password_change_sha256: input.password_change_sha256,
    owned_session_ref_sha256: input.owned_session_ref_sha256,
    password_reset: reset,
    fresh_sign_in: signIn,
    vault_credential_save_admission: vaultAdmission,
    vault_sdk_adapter_capability: sdkCapability,
    ordered_steps: [
      "REQUIRE_LIVE_OPAQUE_VAULT_CREDENTIAL_EXECUTOR_BEFORE_PROVIDER_ACTION",
      "EMAIL_OTP_SUBMIT_ACCEPTED",
      "PASSWORD_RESET_ACCEPTED",
      "CLEAR_PROVIDER_SESSION_IN_OWNED_EPHEMERAL_CONTEXT",
      "FRESH_SIGNED_OUT_BLIND_MASTER_SIGN_IN_ACCEPTED",
      "EXACT_ONE_NON_DUPLICATE_VERIFIED_CURRENT_VAULT_READBACK",
      "PROJECT_THREE_PROOF_PASSWORD_CONVERSION",
    ],
    max_uses: 1,
    fixed: false,
    password_conversion: false,
    secret_material_returned: false,
  };
  return freeze({ ...body, transaction_sha256: digest(body) });
}

function validateTransaction(transaction) {
  if (!transaction || transaction.schema !== "pookakind.disney-mydisney-full-conversion-transaction/v1" || !HASH.test(transaction.transaction_sha256 ?? "")) fail("DISNEY_FULL_CONVERSION_TRANSACTION_INVALID");
  const body = Object.fromEntries(Object.entries(transaction).filter(([key]) => key !== "transaction_sha256"));
  if (digest(body) !== transaction.transaction_sha256 || transaction.fixed !== false || transaction.password_conversion !== false || transaction.secret_material_returned !== false) fail("DISNEY_FULL_CONVERSION_TRANSACTION_INVALID");
  validateDisneyProviderRoute(transaction.password_reset?.route, "PASSWORD_RESET", transaction.password_reset?.compiled?.admission?.command);
  validateDisneyPasswordOnlyDescriptor(transaction.password_reset?.descriptor);
  validateDisneyProviderRoute(transaction.fresh_sign_in?.route, "SIGN_IN", transaction.fresh_sign_in?.compiled?.admission?.command);
  validateDisneyPasswordOnlyDescriptor(transaction.fresh_sign_in?.descriptor);
}

async function runStep(step, dependencies) {
  return runStewartGeneralizedNativeHostOperation({
    authorityRecord: step.authority_record,
    operatorAuthority: step.operator_authority,
    descriptor: step.descriptor,
    extension_id_sha256: step.extension_id_sha256,
    handles: step.handles,
    observeExtension: dependencies.observeExtension,
    executeExtension: dependencies.executeExtension,
    readExtension: dependencies.readExtension,
    consume: dependencies.consumeStep,
    resolveHandle: dependencies.resolveHandle,
    now: dependencies.now,
    randomBytes: dependencies.randomBytes,
  });
}

export async function runDisneyMyDisneyFullConversion({ transaction: rawTransaction, otpTransaction, dependencies }) {
  const transaction = clone(rawTransaction, "DISNEY_FULL_CONVERSION_TRANSACTION_INVALID");
  validateTransaction(transaction);
  if (transaction.state === "BLOCKED_NOT_ACTIVATED") return freeze({
    schema: "pookakind.disney-mydisney-full-conversion-blocker/v1",
    state: transaction.state,
    blocker: transaction.blocker,
    transaction_sha256: transaction.transaction_sha256,
    provider_actions: 0,
    vault_actions: 0,
    fixed: false,
    password_conversion: false,
    secret_material_returned: false,
  });
  const required = ["consumeTransaction", "runOtp", "observeExtension", "executeExtension", "readExtension", "consumeStep", "resolveHandle", "signOutAndClear", "resolveVaultHandle", "now"];
  if (!dependencies || required.some((name) => typeof dependencies[name] !== "function")) fail("DISNEY_FULL_CONVERSION_DEPENDENCY_INVALID");
  if (dependencies.vaultStore?.kind !== "DURABLE_APPEND_ONCE_V1" || typeof dependencies.vaultAdapter?.saveCredentialOnce !== "function" || typeof dependencies.vaultAdapter?.readbackCredential !== "function") fail("DISNEY_FULL_CONVERSION_DEPENDENCY_INVALID");
  if (await dependencies.consumeTransaction(transaction.transaction_sha256) !== true) fail("DISNEY_FULL_CONVERSION_ALREADY_CONSUMED");
  const otpReceipt = await dependencies.runOtp(otpTransaction);
  if (otpReceipt?.state !== "SUBMISSION_ACCEPTED") fail("DISNEY_FULL_CONVERSION_OTP_NOT_ACCEPTED");
  const resetResult = await runStep(transaction.password_reset, dependencies);
  if (resetResult.state !== "SUBMISSION_ACCEPTED") fail("DISNEY_FULL_CONVERSION_RESET_NOT_ACCEPTED");
  const cleared = await dependencies.signOutAndClear({ session_ref_sha256: transaction.owned_session_ref_sha256, provider_id: PROVIDER_ID });
  if (cleared?.state !== "SIGNED_OUT_PROVIDER_STATE_CLEARED" || cleared?.session_ref_sha256 !== transaction.owned_session_ref_sha256
    || cleared?.provider_cookie_count !== 0 || cleared?.provider_storage_count !== 0 || cleared?.unrelated_state_touched !== false) fail("DISNEY_FULL_CONVERSION_SIGN_OUT_NOT_PROVED");
  const signInResult = await runStep(transaction.fresh_sign_in, dependencies);
  if (signInResult.state !== "SUBMISSION_ACCEPTED") fail("DISNEY_FULL_CONVERSION_FRESH_SIGN_IN_NOT_ACCEPTED");
  const credentialHandle = transaction.password_reset.handles.find((handle) => handle.ref_sha256 === transaction.vault_credential_save_admission.command.credential_handle_ref_sha256);
  if (!credentialHandle) fail("DISNEY_FULL_CONVERSION_VAULT_HANDLE_MISSING");
  const exactOneReceipt = await runExactOneVaultCredentialSaveOnce({
    admission: transaction.vault_credential_save_admission,
    credential_handle: credentialHandle,
    store: dependencies.vaultStore,
    resolveHandle: dependencies.resolveVaultHandle,
    adapter: dependencies.vaultAdapter,
  });
  if (exactOneReceipt?.state !== "VERIFIED_CURRENT" || exactOneReceipt.exact_match_count !== 1 || exactOneReceipt.duplicate_count !== 0 || exactOneReceipt.credential_status !== "VERIFIED_CURRENT") fail("DISNEY_FULL_CONVERSION_VAULT_NOT_VERIFIED");
  const vaultReceipt = freeze({
    schema: "pookakind.disney-mydisney-vault-reconciliation-receipt/v1",
    provider_id: PROVIDER_ID,
    account_ref_sha256: transaction.account_ref_sha256,
    password_change_sha256: transaction.password_change_sha256,
    vault_item_ref_sha256: digest(exactOneReceipt.vault_item_ref),
    readback_sha256: exactOneReceipt.readback_sha256,
    exact_match_count: 1,
    duplicate_count: 0,
    credential_status: "VERIFIED_CURRENT",
    observed_at: new Date(dependencies.now()).toISOString(),
  });
  const passwordResetReceipt = {
    schema: "pookakind.disney-mydisney-password-reset-receipt/v1", provider_id: PROVIDER_ID,
    state: "PROVIDER_PASSWORD_CHANGE_ACCEPTED", transaction_sha256: otpTransaction.transaction_sha256,
    account_ref_sha256: transaction.account_ref_sha256, password_change_sha256: transaction.password_change_sha256,
    provider_state_sha256: resetResult.provider_state_sha256,
  };
  const freshSignInReceipt = {
    schema: "pookakind.disney-mydisney-fresh-sign-in-receipt/v1", provider_id: PROVIDER_ID,
    state: "FRESH_SIGN_IN_ACCEPTED", fresh: true, credential_method: "BLIND_MASTER_PASSWORD",
    account_ref_sha256: transaction.account_ref_sha256, password_change_sha256: transaction.password_change_sha256,
    provider_state_sha256: signInResult.provider_state_sha256, observed_at: new Date(dependencies.now()).toISOString(),
  };
  return projectDisneyMyDisneyPasswordConversion({ schema: "pookakind.disney-mydisney-password-completion-input/v1", transaction: otpTransaction, otp_receipt: otpReceipt, password_reset_receipt: passwordResetReceipt, fresh_sign_in_receipt: freshSignInReceipt, vault_reconciliation_receipt: vaultReceipt });
}

function callableRecord(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype
    || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const actual = Object.keys(descriptors).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
  for (const field of fields) {
    const descriptor = descriptors[field];
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set
      || descriptor.enumerable !== true || typeof descriptor.value !== "function") fail(code);
  }
  return Object.fromEntries(fields.map((field) => [field, descriptors[field].value]));
}

export function composeDisneyMyDisneyFullConversionDossMachineHands(rawInput) {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)
    || Object.getPrototypeOf(rawInput) !== Object.prototype || Object.getOwnPropertySymbols(rawInput).length !== 0) fail("DISNEY_DOSS_COMPOSITION_INPUT_INVALID");
  const descriptors = Object.getOwnPropertyDescriptors(rawInput);
  const fields = ["create_dependencies", "hands", "otp_transaction", "transaction"];
  if (Object.keys(descriptors).sort().join("|") !== fields.slice().sort().join("|")) fail("DISNEY_DOSS_COMPOSITION_INPUT_INVALID");
  for (const field of fields) if (!("value" in descriptors[field]) || descriptors[field].get || descriptors[field].set || descriptors[field].enumerable !== true) fail("DISNEY_DOSS_COMPOSITION_INPUT_INVALID");
  if (typeof descriptors.create_dependencies.value !== "function") fail("DISNEY_DOSS_COMPOSITION_DEPENDENCY_INVALID");
  const hands = callableRecord(descriptors.hands.value, DOSS_HAND_METHODS, "DISNEY_DOSS_COMPOSITION_HANDS_INVALID");
  const transaction = clone(descriptors.transaction.value, "DISNEY_DOSS_COMPOSITION_TRANSACTION_INVALID");
  validateTransaction(transaction);
  if (transaction.state !== "PREPARED_NOT_ACTIVATED" || transaction.max_uses !== 1) fail("DISNEY_DOSS_COMPOSITION_TRANSACTION_NOT_EXECUTABLE");
  const otpTransaction = clone(descriptors.otp_transaction.value, "DISNEY_DOSS_COMPOSITION_OTP_INVALID");
  const createDependencies = descriptors.create_dependencies.value;
  let claimed = false;
  return freeze({
    ...hands,
    async runBoundDisneyTransaction(rawRequest) {
      const request = clone(rawRequest, "DISNEY_DOSS_COMPOSITION_REQUEST_INVALID");
      exact(request, ["session", "session_ref_sha256", "transaction_sha256"], "DISNEY_DOSS_COMPOSITION_REQUEST_INVALID");
      if (!HASH.test(request.session_ref_sha256 ?? "") || request.session_ref_sha256 !== transaction.owned_session_ref_sha256
        || request.transaction_sha256 !== transaction.transaction_sha256 || request.session?.session_ref_sha256 !== request.session_ref_sha256
        || !HASH.test(request.session?.profile_ref_sha256 ?? "") || typeof request.session?.extension_id !== "string") fail("DISNEY_DOSS_COMPOSITION_SESSION_CUSTODY_CONFLICT");
      if (claimed) fail("DISNEY_DOSS_COMPOSITION_ALREADY_CLAIMED");
      claimed = true;
      const dependencies = await createDependencies(freeze({
        schema: "pookakind.disney-mydisney-full-conversion-doss-runtime-request/v1",
        session_ref_sha256: request.session_ref_sha256,
        profile_ref_sha256: request.session.profile_ref_sha256,
        extension_id: request.session.extension_id,
        transaction_sha256: transaction.transaction_sha256,
      }));
      return runDisneyMyDisneyFullConversion({ transaction, otpTransaction, dependencies });
    },
  });
}

export const DISNEY_MYDISNEY_FULL_CONVERSION_CURRENT_BLOCKER = BLOCKER;
