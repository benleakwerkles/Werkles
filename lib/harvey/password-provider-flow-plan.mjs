import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { PASSWORD_PROVIDER_CLASSES } from "./password-provider-class-router.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER = /^[A-Z][A-Z0-9_]{1,63}$/;
const ENTRY_MODES = new Set(["IDENTITY_FIRST", "PASSWORD_FIRST", "FEDERATED_REDIRECT", "PASSWORDLESS"]);
const RECOVERY_MODES = new Set(["NATIVE_API", "CURRENT_PASSWORD_CHANGE", "RESET_EMAIL", "UPSTREAM_IDENTITY_PROVIDER", "HUMAN_SUPPORT", "NONE"]);
export const PASSWORD_CHALLENGE_CLASSES = Object.freeze(["EMAIL_OTP", "TOTP", "PASSKEY_WINDOWS_SECURITY"]);

const exact = (value, fields) => value && typeof value === "object" && !Array.isArray(value)
  && Object.keys(value).sort().join("|") === [...fields].sort().join("|");
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const fail = (code) => { throw new Error(code); };

const requiredRecovery = Object.freeze({
  NATIVE_ADMIN_API: "NATIVE_API",
  NATIVE_SELF_SERVICE_API: "NATIVE_API",
  WEB_CURRENT_PASSWORD_CHANGE: "CURRENT_PASSWORD_CHANGE",
  WEB_EMAIL_RESET: "RESET_EMAIL",
  FEDERATED_IDENTITY_PROVIDER: "UPSTREAM_IDENTITY_PROVIDER",
  PASSWORDLESS_ONLY: "NONE",
  HUMAN_SUPPORT_RECOVERY: "HUMAN_SUPPORT",
});

const recoveryStep = Object.freeze({
  NATIVE_API: "EXECUTE_ONE_BOUND_NATIVE_PASSWORD_CHANGE",
  CURRENT_PASSWORD_CHANGE: "EXECUTE_ONE_BOUND_CURRENT_PASSWORD_CHANGE",
  RESET_EMAIL: "RECOVER_ONE_FRESH_RESET_MESSAGE",
  UPSTREAM_IDENTITY_PROVIDER: "CONTINUE_AT_OWNING_IDENTITY_PROVIDER",
  HUMAN_SUPPORT: "OBTAIN_PROVIDER_SUPPORT_IDENTITY_DECISION",
  NONE: "CONFIRM_NO_PROVIDER_PASSWORD_EXISTS",
});

const challengeStep = Object.freeze({
  EMAIL_OTP: "RETRIEVE_ONE_FRESH_EMAIL_OTP",
  TOTP: "RESOLVE_ONE_OPAQUE_TOTP",
  PASSKEY_WINDOWS_SECURITY: "SATISFY_TRUSTED_LOCAL_USER_PRESENCE",
});

/**
 * Describes the route shape separately from any one provider adapter. Disney,
 * DreamHost, and future providers become catalog entries with a flow plan;
 * none is allowed to define the common conversion contract.
 */
export function compilePasswordProviderFlowPlan(input) {
  if (!exact(input, ["schema", "provider_id", "target", "entry_mode", "recovery_mode", "challenges"])) fail("PASSWORD_PROVIDER_FLOW_INPUT_INVALID");
  if (input.schema !== "pookakind.password-provider-flow-input/v1" || !PROVIDER.test(input.provider_id ?? "")
    || !exact(input.target, ["account", "adapter", "class", "provider", "source"])
    || !HASH.test(input.target.account ?? "") || !HASH.test(input.target.adapter ?? "")
    || !PASSWORD_PROVIDER_CLASSES.includes(input.target.class)
    || typeof input.target.provider !== "string" || !input.target.provider.trim()
    || typeof input.target.source !== "string" || !input.target.source.startsWith("https://")
    || !ENTRY_MODES.has(input.entry_mode) || !RECOVERY_MODES.has(input.recovery_mode)
    || !Array.isArray(input.challenges) || new Set(input.challenges).size !== input.challenges.length
    || input.challenges.some((value) => !PASSWORD_CHALLENGE_CLASSES.includes(value))) fail("PASSWORD_PROVIDER_FLOW_INPUT_INVALID");
  if (requiredRecovery[input.target.class] !== input.recovery_mode) fail("PASSWORD_PROVIDER_FLOW_CLASS_MISMATCH");
  if (input.target.class === "PASSWORDLESS_ONLY" && input.entry_mode !== "PASSWORDLESS") fail("PASSWORD_PROVIDER_FLOW_CLASS_MISMATCH");
  if (input.target.class === "FEDERATED_IDENTITY_PROVIDER" && input.entry_mode !== "FEDERATED_REDIRECT") fail("PASSWORD_PROVIDER_FLOW_CLASS_MISMATCH");
  if (["NATIVE_ADMIN_API", "NATIVE_SELF_SERVICE_API"].includes(input.target.class) && input.challenges.length) fail("PASSWORD_PROVIDER_FLOW_NATIVE_CHALLENGE_INVALID");

  const steps = ["OBSERVE_EXACT_PROVIDER_ROUTE"];
  if (input.entry_mode === "IDENTITY_FIRST") steps.push("BIND_EXACT_ACCOUNT_IDENTITY");
  if (input.entry_mode === "PASSWORD_FIRST") steps.push("BIND_EXACT_PASSWORD_SURFACE");
  if (input.entry_mode === "FEDERATED_REDIRECT") steps.push("BIND_EXACT_UPSTREAM_IDENTITY");
  steps.push(recoveryStep[input.recovery_mode]);
  for (const challenge of input.challenges) steps.push(challengeStep[challenge]);
  if (!["PASSWORDLESS_ONLY", "HUMAN_SUPPORT_RECOVERY", "FEDERATED_IDENTITY_PROVIDER"].includes(input.target.class)) {
    steps.push("PROVE_PROVIDER_PASSWORD_CHANGE_ACCEPTANCE", "PROVE_FRESH_SIGNED_OUT_PASSWORD_SIGN_IN", "PROVE_EXACT_ONE_VAULT_VERIFIED_CURRENT");
  }
  const body = {
    schema: "pookakind.password-provider-flow-plan/v1",
    provider_id: input.provider_id,
    provider: input.target.provider,
    account_ref_sha256: input.target.account,
    adapter_sha256: input.target.adapter,
    provider_class: input.target.class,
    entry_mode: input.entry_mode,
    recovery_mode: input.recovery_mode,
    challenges: [...input.challenges],
    steps,
    conversion_rule: "PROVIDER_CHANGE_ACCEPTANCE__FRESH_SIGNED_OUT_SIGN_IN__EXACT_ONE_VERIFIED_CURRENT_VAULT",
    secret_material_present: false,
  };
  return Object.freeze({ ...body, plan_sha256: digest(body) });
}
