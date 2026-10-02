import { createHash } from "node:crypto";

import { compileStewartDisneyLiveStageResult } from "./stewart-disney-deferred-live-adapter.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ACTIONS = ["observeIdentityRoute", "bindOpaqueIdentity", "submitRecoveryIdentity", "captureEmailChallenge", "submitEmailChallenge", "submitPasswordChange", "clearOwnedSession", "submitFreshIdentity", "submitFreshSignIn", "reconcileExactOneVault"];
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function callable(value, name) { if (typeof value?.[name] !== "function") fail("STEWART_DISNEY_CONCRETE_ACTION_MISSING"); return value[name]; }
function hash(value, code) { if (!HASH.test(value ?? "")) fail(code); return value; }
function safeObject(value, code) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(code); return value; }
function liveResult(stage, request, state, provider_action_count, effect_type, evidence) {
  return compileStewartDisneyLiveStageResult({ stage, request, state, provider_action_count, effect_type, effect_sha256: digest(evidence) });
}

/**
 * Concrete Disney adapter over the already-built Stewart, inbox and 1Password
 * organs. Each action has a distinct semantic contract; a caller cannot turn a
 * generic callback returning a desired state into conversion credit.
 */
export function createStewartDisneyConcreteDeferredDriver(actions) {
  if (!actions || typeof actions !== "object" || ACTIONS.some((name) => typeof actions[name] !== "function")) fail("STEWART_DISNEY_CONCRETE_ACTIONS_INVALID");
  const observeIdentityRoute = callable(actions, "observeIdentityRoute");
  const bindOpaqueIdentity = callable(actions, "bindOpaqueIdentity");
  const submitRecoveryIdentity = callable(actions, "submitRecoveryIdentity");
  const captureEmailChallenge = callable(actions, "captureEmailChallenge");
  const submitEmailChallenge = callable(actions, "submitEmailChallenge");
  const submitPasswordChange = callable(actions, "submitPasswordChange");
  const clearOwnedSession = callable(actions, "clearOwnedSession");
  const submitFreshIdentity = callable(actions, "submitFreshIdentity");
  const submitFreshSignIn = callable(actions, "submitFreshSignIn");
  const reconcileExactOneVault = callable(actions, "reconcileExactOneVault");

  return Object.freeze({
    async observeRoute(request) {
      const probe = safeObject(await observeIdentityRoute(request), "STEWART_DISNEY_ROUTE_PROBE_INVALID");
      if (probe.schema !== "pookakind.stewart-disney-live-surface-probe/v1" || probe.provider_id !== "DISNEY_MYDISNEY"
        || probe.classification !== "IDENTITY_LOOKUP_READY" || probe.live_execution_ready !== true
        || probe.live_action_performed !== false || probe.secret_material_present !== false
        || probe.identity_field_count !== 1 || probe.continue_control_count !== 1 || probe.password_field_count !== 0
        || probe.unexpected_field_count !== 0) fail("STEWART_DISNEY_ROUTE_PROBE_INVALID");
      for (const field of ["origin_sha256", "pathname_sha256", "route_epoch_sha256", "form_sha256", "identity_field_role_sha256", "continue_control_sha256"]) hash(probe[field], "STEWART_DISNEY_ROUTE_PROBE_INVALID");
      return liveResult("observeRoute", request, "ROUTE_BOUND", 0, "READ_ONLY_ROUTE_OBSERVATION", { route_epoch_sha256: probe.route_epoch_sha256, form_sha256: probe.form_sha256 });
    },
    async bindIdentity(request) {
      const bound = safeObject(await bindOpaqueIdentity(request), "STEWART_DISNEY_IDENTITY_BINDING_INVALID");
      if (bound.handle?.schema !== "pookakind.stewart-opaque-credential-handle/v1" || !HASH.test(bound.handle.ref_sha256 ?? "")
        || bound.receipt?.state !== "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED" || bound.receipt.secret_material_output !== false) fail("STEWART_DISNEY_IDENTITY_BINDING_INVALID");
      return liveResult("bindIdentity", request, "IDENTITY_BOUND", 0, "OPAQUE_IDENTITY_HANDLE_BOUND", { handle_ref_sha256: bound.handle.ref_sha256, receipt_state: bound.receipt.state });
    },
    async requestRecovery(request) {
      const receipt = safeObject(await submitRecoveryIdentity(request), "STEWART_DISNEY_RECOVERY_RECEIPT_INVALID");
      if (receipt.schema !== "pookakind.stewart-background-credential-receipt/v1" || receipt.state !== "FACTOR_EMAIL"
        || receipt.consume_calls !== 1 || receipt.resolve_calls !== 1 || receipt.execution_calls !== 1
        || receipt.password_conversion !== false || receipt.secret_material_returned !== false) fail("STEWART_DISNEY_RECOVERY_RECEIPT_INVALID");
      return liveResult("requestRecovery", request, "RECOVERY_REQUEST_ACCEPTED", 1, "PROVIDER_RECOVERY_REQUEST_ACCEPTED", { provider_state_sha256: hash(receipt.provider_state_sha256, "STEWART_DISNEY_RECOVERY_RECEIPT_INVALID"), state: receipt.state });
    },
    async captureChallenge(request) {
      const captured = safeObject(await captureEmailChallenge(request), "STEWART_DISNEY_CHALLENGE_RECEIPT_INVALID");
      if (captured.handle?.schema !== "pookakind.stewart-private-inbox-email-otp-handle/v1" || !HASH.test(captured.handle.ref_sha256 ?? "")
        || !["CREATED", "SEALED"].includes(captured.receipt?.state) || captured.receipt.secret_material_returned !== false) fail("STEWART_DISNEY_CHALLENGE_RECEIPT_INVALID");
      return liveResult("captureChallenge", request, "CHALLENGE_CAPTURED_OPAQUE", 0, "OPAQUE_EMAIL_CHALLENGE_CAPTURED", { handle_ref_sha256: captured.handle.ref_sha256, receipt_state: captured.receipt.state });
    },
    async submitChallenge(request) {
      const receipt = safeObject(await submitEmailChallenge(request), "STEWART_DISNEY_CHALLENGE_SUBMISSION_INVALID");
      if (receipt.schema !== "pookakind.stewart-background-credential-receipt/v1" || receipt.state !== "SUBMISSION_ACCEPTED"
        || receipt.consume_calls !== 1 || receipt.resolve_calls !== 1 || receipt.execution_calls !== 1
        || receipt.password_conversion !== false || receipt.secret_material_returned !== false) fail("STEWART_DISNEY_CHALLENGE_SUBMISSION_INVALID");
      return liveResult("submitChallenge", request, "CHALLENGE_ACCEPTED", 1, "PROVIDER_EMAIL_CHALLENGE_ACCEPTED", { provider_state_sha256: hash(receipt.provider_state_sha256, "STEWART_DISNEY_CHALLENGE_SUBMISSION_INVALID"), state: receipt.state });
    },
    async executeChange(request) {
      const receipt = safeObject(await submitPasswordChange(request), "STEWART_DISNEY_PASSWORD_CHANGE_RECEIPT_INVALID");
      if (receipt.schema !== "pookakind.stewart-background-credential-receipt/v1" || receipt.state !== "SUBMISSION_ACCEPTED"
        || receipt.consume_calls !== 1 || receipt.resolve_calls !== 1 || receipt.execution_calls !== 1
        || receipt.password_conversion !== false || receipt.secret_material_returned !== false) fail("STEWART_DISNEY_PASSWORD_CHANGE_RECEIPT_INVALID");
      return liveResult("executeChange", request, "PASSWORD_CHANGE_ACCEPTED", 1, "PROVIDER_PASSWORD_CHANGE_ACCEPTED", { provider_state_sha256: hash(receipt.provider_state_sha256, "STEWART_DISNEY_PASSWORD_CHANGE_RECEIPT_INVALID"), state: receipt.state });
    },
    async clearSession(request) {
      const receipt = safeObject(await clearOwnedSession(request), "STEWART_DISNEY_SESSION_CLEAR_INVALID");
      if (receipt.state !== "SIGNED_OUT_PROVIDER_STATE_CLEARED" || !HASH.test(receipt.session_ref_sha256 ?? "")
        || receipt.provider_cookie_count !== 0 || receipt.provider_storage_count !== 0 || receipt.unrelated_state_touched !== false) fail("STEWART_DISNEY_SESSION_CLEAR_INVALID");
      return liveResult("clearSession", request, "SIGNED_OUT_STATE_CLEARED", 0, "OWNED_PROVIDER_SESSION_CLEARED", { session_ref_sha256: receipt.session_ref_sha256, provider_cookie_count: 0, provider_storage_count: 0 });
    },
    async beginFreshSignIn(request) {
      const receipt = safeObject(await submitFreshIdentity(request), "STEWART_DISNEY_FRESH_IDENTITY_RECEIPT_INVALID");
      if (receipt.schema !== "pookakind.stewart-background-credential-receipt/v1" || receipt.state !== "FACTOR_PASSWORD"
        || receipt.consume_calls !== 1 || receipt.resolve_calls !== 1 || receipt.execution_calls !== 1
        || receipt.password_conversion !== false || receipt.secret_material_returned !== false) fail("STEWART_DISNEY_FRESH_IDENTITY_RECEIPT_INVALID");
      return liveResult("beginFreshSignIn", request, "FRESH_SIGN_IN_IDENTITY_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_IDENTITY_ACCEPTED", { provider_state_sha256: hash(receipt.provider_state_sha256, "STEWART_DISNEY_FRESH_IDENTITY_RECEIPT_INVALID"), state: receipt.state });
    },
    async verifyFreshSignIn(request) {
      const receipt = safeObject(await submitFreshSignIn(request), "STEWART_DISNEY_FRESH_SIGN_IN_RECEIPT_INVALID");
      if (receipt.schema !== "pookakind.stewart-background-credential-receipt/v1" || receipt.state !== "SUBMISSION_ACCEPTED"
        || receipt.consume_calls !== 1 || receipt.resolve_calls !== 2 || receipt.execution_calls !== 1
        || receipt.password_conversion !== false || receipt.secret_material_returned !== false) fail("STEWART_DISNEY_FRESH_SIGN_IN_RECEIPT_INVALID");
      return liveResult("verifyFreshSignIn", request, "FRESH_SIGNED_OUT_SIGN_IN_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_ACCEPTED", { provider_state_sha256: hash(receipt.provider_state_sha256, "STEWART_DISNEY_FRESH_SIGN_IN_RECEIPT_INVALID"), state: receipt.state });
    },
    async reconcileVault(request) {
      const receipt = safeObject(await reconcileExactOneVault(request), "STEWART_DISNEY_VAULT_RECEIPT_INVALID");
      if (receipt.state !== "VERIFIED_CURRENT" || receipt.exact_match_count !== 1 || receipt.duplicate_count !== 0
        || receipt.credential_status !== "VERIFIED_CURRENT" || !HASH.test(receipt.readback_sha256 ?? "")) fail("STEWART_DISNEY_VAULT_RECEIPT_INVALID");
      return liveResult("reconcileVault", request, "EXACT_ONE_VAULT_VERIFIED_CURRENT", 1, "ONEPASSWORD_EXACT_ONE_VERIFIED_CURRENT", { readback_sha256: receipt.readback_sha256, exact_match_count: 1, duplicate_count: 0 });
    },
  });
}
