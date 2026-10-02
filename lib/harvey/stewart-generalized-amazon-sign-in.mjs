import { createHash } from "node:crypto";

import { compileStewartBackgroundCredentialOperation } from "./stewart-background-credential-operation.mjs";
import { runStewartGeneralizedNativeHostOperation } from "./stewart-generalized-native-host.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = "AMAZON";
const ORIGIN = "https://www.amazon.com";
const ROUTE_PATH = "/ap/signin";
const FORBIDDEN_POSSESSION_ROUTE_TERM = /(?:passkey|webauthn|possession)/i;
const HANDLE_FIELDS = ["ref_sha256", "schema"];
const INPUT_FIELDS = ["account_handle", "authority_record", "descriptor", "extension_id_sha256", "observation", "operator_authority", "password_handle", "provider_id", "route_url", "schema"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function textDigest(value) { return createHash("sha256").update(String(value), "utf8").digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function validateHandle(handle, schema, code) { exact(handle, HANDLE_FIELDS, code); if (handle.schema !== schema || !HASH.test(handle.ref_sha256 ?? "")) fail(code); }

export const STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR = freeze({
  schema: "pookakind.stewart-provider-surface-descriptor/v1",
  field_descriptors: [{ role: "CURRENT_PASSWORD", control_sha256: textDigest("AMAZON:/ap/signin:CURRENT_PASSWORD:#ap_password"), selector: "#ap_password[type=\"password\"]" }],
  final_control_descriptor: {
    control_sha256: textDigest("AMAZON:/ap/signin:SIGN_IN:PASSWORD_ONLY:#signInSubmit"),
    selector: 'body:not(:has([id*="passkey" i], [name*="passkey" i], [data-testid*="passkey" i], [aria-label*="passkey" i], [id*="webauthn" i], [name*="webauthn" i])) #signInSubmit',
  },
  readback_descriptors: [
    { response_class: "PROVIDER_REJECTED", selector: "#auth-error-message-box" },
    { response_class: "FACTOR_EMAIL", selector: "#auth-mfa-otpcode" },
  ],
});

export const STEWART_AMAZON_PASSWORD_FALLBACK_ROUTE = freeze({
  schema: "pookakind.stewart-amazon-canonical-sign-in-route/v1",
  canonical_origin: ORIGIN,
  pathname: ROUTE_PATH,
  return_origin: ORIGIN,
  return_pathname: "/ap/cnep",
  account_return_pathname: "/your-account",
  max_uses: 1,
  recurrence: false,
});

export function validateAmazonCanonicalSignInRoute(routeUrl) {
  let route; try { route = new URL(routeUrl); } catch { fail("STEWART_AMAZON_ROUTE_INVALID"); }
  if (route.origin !== ORIGIN || route.pathname !== ROUTE_PATH || route.username || route.password || route.hash
    || route.searchParams.get("openid.mode") !== "checkid_setup"
    || route.searchParams.has("openid.pape.preferred_auth_policies")
    || [...route.searchParams].some(([key, value]) => FORBIDDEN_POSSESSION_ROUTE_TERM.test(key) || FORBIDDEN_POSSESSION_ROUTE_TERM.test(value))
    || route.searchParams.get("intercept") !== "false") fail("STEWART_AMAZON_ROUTE_INVALID");
  let returnTo; try { returnTo = new URL(route.searchParams.get("openid.return_to") ?? ""); } catch { fail("STEWART_AMAZON_ROUTE_INVALID"); }
  if (returnTo.origin !== ORIGIN || returnTo.pathname !== "/ap/cnep") fail("STEWART_AMAZON_ROUTE_INVALID");
  let accountReturn; try { accountReturn = new URL(returnTo.searchParams.get("orig_return_to") ?? ""); } catch { fail("STEWART_AMAZON_ROUTE_INVALID"); }
  if (accountReturn.origin !== ORIGIN || accountReturn.pathname !== "/your-account" || accountReturn.search || accountReturn.hash) fail("STEWART_AMAZON_ROUTE_INVALID");
  return freeze({ canonical_origin_sha256: textDigest(ORIGIN), route_epoch_sha256: textDigest(route.href) });
}

export function compileStewartAmazonPasswordFallback(rawInput, now = Date.now()) {
  exact(rawInput, INPUT_FIELDS, "STEWART_AMAZON_INPUT_INVALID");
  if (rawInput.schema !== "pookakind.stewart-amazon-password-fallback-input/v1" || rawInput.provider_id !== PROVIDER_ID || !HASH.test(rawInput.extension_id_sha256 ?? "")) fail("STEWART_AMAZON_INPUT_INVALID");
  validateHandle(rawInput.account_handle, "pookakind.stewart-opaque-account-handle/v1", "STEWART_AMAZON_ACCOUNT_HANDLE_INVALID");
  validateHandle(rawInput.password_handle, "pookakind.stewart-opaque-credential-handle/v1", "STEWART_AMAZON_PASSWORD_HANDLE_INVALID");
  if (canonicalJson(rawInput.descriptor) !== canonicalJson(STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR)) fail("STEWART_AMAZON_DESCRIPTOR_INVALID");
  const route = validateAmazonCanonicalSignInRoute(rawInput.route_url);
  const payload = rawInput.authority_record?.payload;
  if (payload?.operation_kind !== "PASSWORD_FALLBACK_SIGN_IN" || payload?.account_ref_sha256 !== rawInput.account_handle.ref_sha256
    || payload?.canonical_origin_sha256 !== route.canonical_origin_sha256 || payload?.route_epoch_sha256 !== route.route_epoch_sha256
    || payload?.max_uses !== 1 || payload?.fields?.length !== 1 || payload.fields[0]?.role !== "CURRENT_PASSWORD"
    || payload.fields[0]?.handle_ref_sha256 !== rawInput.password_handle.ref_sha256
    || payload?.provider_response_contract_sha256 !== digest(STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR)) fail("STEWART_AMAZON_AUTHORITY_SCOPE_INVALID");
  if (rawInput.observation?.canonical_origin_sha256 !== route.canonical_origin_sha256 || rawInput.observation?.route_epoch_sha256 !== route.route_epoch_sha256
    || rawInput.observation?.account_ref_sha256 !== rawInput.account_handle.ref_sha256
    || rawInput.observation?.final_control_count !== 1 || rawInput.observation?.unexpected_field_count !== 0
    || rawInput.observation?.field_controls?.length !== 1 || rawInput.observation.field_controls[0]?.role !== "CURRENT_PASSWORD") fail("STEWART_AMAZON_SURFACE_INVALID");
  const generalized = compileStewartBackgroundCredentialOperation({ authorityRecord: rawInput.authority_record, operatorAuthority: rawInput.operator_authority, observation: rawInput.observation, now });
  return freeze({
    schema: "pookakind.stewart-amazon-password-fallback-transaction/v1",
    state: generalized.admission.decision === "EXECUTE_ONCE" ? "ACTIVATED_ONE_SHOT" : "SOURCE_CUSTODIED_NOT_ACTIVATED",
    provider_id: PROVIDER_ID,
    route: STEWART_AMAZON_PASSWORD_FALLBACK_ROUTE,
    account_handle: structuredClone(rawInput.account_handle),
    password_handle: structuredClone(rawInput.password_handle),
    descriptor: STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR,
    extension_id_sha256: rawInput.extension_id_sha256,
    authority_record: structuredClone(rawInput.authority_record),
    operator_authority: structuredClone(rawInput.operator_authority),
    generalized,
    synthetic_https_required_first: true,
    immediate_sanitized_readback_required: true,
    rollback_required: ["TERMINATE_EXACT_SESSION", "REMOVE_EXACT_REGISTRY_TARGET", "REMOVE_EXACT_EPHEMERAL_PROFILE", "VERIFY_CLEAN_ABSENT"],
    max_uses: 1,
    recurrence: false,
    password_conversion: false,
    secret_material_output: false,
  });
}

export async function runStewartAmazonPasswordFallback({ transaction, synthetic_receipt, observeExtension, executeExtension, readExtension, consume, resolveHandle, now = () => Date.now(), randomBytes }) {
  if (transaction?.schema !== "pookakind.stewart-amazon-password-fallback-transaction/v1" || transaction.provider_id !== PROVIDER_ID
    || transaction.max_uses !== 1 || transaction.recurrence !== false || transaction.password_conversion !== false
    || transaction.secret_material_output !== false || canonicalJson(transaction.descriptor) !== canonicalJson(STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR)) fail("STEWART_AMAZON_TRANSACTION_INVALID");
  if (synthetic_receipt?.schema !== "pookakind.stewart-generalized-session-synthetic-receipt/v1" || synthetic_receipt.state !== "PASS"
    || synthetic_receipt.provider_contacted !== false || synthetic_receipt.secret_material_used !== false) fail("STEWART_AMAZON_SYNTHETIC_PROOF_REQUIRED");
  const receipt = await runStewartGeneralizedNativeHostOperation({
    authorityRecord: transaction.authority_record, operatorAuthority: transaction.operator_authority,
    descriptor: transaction.descriptor, extension_id_sha256: transaction.extension_id_sha256,
    handles: [transaction.password_handle], observeExtension, executeExtension, readExtension,
    consume, resolveHandle, now, ...(randomBytes ? { randomBytes } : {}),
  });
  return freeze({
    schema: "pookakind.stewart-amazon-password-fallback-receipt/v1",
    state: receipt.state,
    provider_state_sha256: receipt.provider_state_sha256 ?? null,
    amazon_sign_in_accepted: receipt.state === "SUBMISSION_ACCEPTED",
    password_conversion: false,
    conversion_credit: 0,
    secret_material_output: false,
    recurring_operation_created: false,
  });
}

export function projectStewartAmazonSessionTerminal({ operation_receipt, cleanup_receipt }) {
  exact(operation_receipt, ["amazon_sign_in_accepted", "conversion_credit", "password_conversion", "provider_state_sha256", "recurring_operation_created", "schema", "secret_material_output", "state"], "STEWART_AMAZON_OPERATION_RECEIPT_INVALID");
  exact(cleanup_receipt, ["profile_state", "registry_state", "rollback_steps", "schema", "session_state", "unrelated_state_touched"], "STEWART_AMAZON_CLEANUP_RECEIPT_INVALID");
  if (operation_receipt.schema !== "pookakind.stewart-amazon-password-fallback-receipt/v1" || operation_receipt.password_conversion !== false
    || operation_receipt.conversion_credit !== 0 || operation_receipt.secret_material_output !== false || operation_receipt.recurring_operation_created !== false
    || cleanup_receipt.schema !== "pookakind.stewart-amazon-session-cleanup-receipt/v1" || cleanup_receipt.session_state !== "ABSENT"
    || cleanup_receipt.registry_state !== "ABSENT" || cleanup_receipt.profile_state !== "ABSENT" || cleanup_receipt.unrelated_state_touched !== false
    || canonicalJson(cleanup_receipt.rollback_steps) !== canonicalJson(["TERMINATE_EXACT_SESSION", "REMOVE_EXACT_REGISTRY_TARGET", "REMOVE_EXACT_EPHEMERAL_PROFILE", "VERIFY_CLEAN_ABSENT"])) fail("STEWART_AMAZON_CLEANUP_NOT_CLEAN_ABSENT");
  return freeze({
    schema: "pookakind.stewart-amazon-session-terminal/v1",
    state: "CLEAN_ABSENT",
    amazon_sign_in_accepted: operation_receipt.amazon_sign_in_accepted,
    provider_state_sha256: operation_receipt.provider_state_sha256,
    password_conversion: false,
    conversion_credit: 0,
    secret_material_output: false,
    recurring_operation_created: false,
  });
}
