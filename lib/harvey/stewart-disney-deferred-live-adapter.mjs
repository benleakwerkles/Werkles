import { createHash } from "node:crypto";

import { compilePasswordProviderStageReceipt, PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER } from "./password-provider-deferred-execution.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = "DISNEY_MYDISNEY";
const FORBIDDEN_KEY = /^(?:credential|material|otp|passcode|password|pin|secret|token|value)$/i;
const EXPECTED = Object.freeze({
  observeRoute: ["ROUTE_BOUND", 0, "READ_ONLY_ROUTE_OBSERVATION"],
  bindIdentity: ["IDENTITY_BOUND", 0, "OPAQUE_IDENTITY_HANDLE_BOUND"],
  requestRecovery: ["RECOVERY_REQUEST_ACCEPTED", 1, "PROVIDER_RECOVERY_REQUEST_ACCEPTED"],
  captureChallenge: ["CHALLENGE_CAPTURED_OPAQUE", 0, "OPAQUE_EMAIL_CHALLENGE_CAPTURED"],
  submitChallenge: ["CHALLENGE_ACCEPTED", 1, "PROVIDER_EMAIL_CHALLENGE_ACCEPTED"],
  executeChange: ["PASSWORD_CHANGE_ACCEPTED", 1, "PROVIDER_PASSWORD_CHANGE_ACCEPTED"],
  clearSession: ["SIGNED_OUT_STATE_CLEARED", 0, "OWNED_PROVIDER_SESSION_CLEARED"],
  beginFreshSignIn: ["FRESH_SIGN_IN_IDENTITY_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_IDENTITY_ACCEPTED"],
  verifyFreshSignIn: ["FRESH_SIGNED_OUT_SIGN_IN_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_ACCEPTED"],
  reconcileVault: ["EXACT_ONE_VAULT_VERIFIED_CURRENT", 1, "ONEPASSWORD_EXACT_ONE_VERIFIED_CURRENT"],
});
const RESULT_FIELDS = ["binding_sha256", "effect_sha256", "effect_type", "foreground_changed", "input_devices_touched", "operation_sha256", "plan_sha256", "provider_action_count", "result_sha256", "schema", "secret_material_output", "stage", "state"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== [...fields].sort().join("|")) fail(code);
}
function rejectPrivate(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (!value || typeof value !== "object") fail("STEWART_DISNEY_LIVE_PRIVATE_DATA_INVALID");
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) fail("STEWART_DISNEY_LIVE_PRIVATE_DATA_FORBIDDEN");
    rejectPrivate(child);
  }
}
function sourceSha256(name, fn) {
  if (typeof fn !== "function") fail("STEWART_DISNEY_LIVE_STAGE_MISSING");
  return createHash("sha256").update(`${name}\n${Function.prototype.toString.call(fn)}`, "utf8").digest("hex");
}

export function compileStewartDisneyLiveStageResult({ stage, request, state, provider_action_count, effect_type, effect_sha256 }) {
  const expected = EXPECTED[stage];
  if (!expected || state !== expected[0] || provider_action_count !== expected[1] || effect_type !== expected[2]
    || !HASH.test(effect_sha256 ?? "") || !HASH.test(request?.operation_sha256 ?? "")
    || !HASH.test(request?.binding_sha256 ?? "") || !HASH.test(request?.plan_sha256 ?? "")) {
    fail("STEWART_DISNEY_LIVE_STAGE_RESULT_INPUT_INVALID");
  }
  const body = {
    schema: "pookakind.stewart-disney-live-stage-result/v1",
    stage,
    state,
    operation_sha256: request.operation_sha256,
    binding_sha256: request.binding_sha256,
    plan_sha256: request.plan_sha256,
    provider_action_count,
    effect_type,
    effect_sha256,
    foreground_changed: false,
    input_devices_touched: false,
    secret_material_output: false,
  };
  return Object.freeze({ ...body, result_sha256: digest(body) });
}

function validateResult(result, stage, request) {
  exact(result, RESULT_FIELDS, "STEWART_DISNEY_LIVE_STAGE_RESULT_INVALID");
  rejectPrivate(result);
  const [state, providerActions, effectType] = EXPECTED[stage];
  const body = { ...result }; delete body.result_sha256;
  if (result.schema !== "pookakind.stewart-disney-live-stage-result/v1" || result.stage !== stage
    || result.state !== state || result.operation_sha256 !== request.operation_sha256
    || result.binding_sha256 !== request.binding_sha256 || result.plan_sha256 !== request.plan_sha256
    || result.provider_action_count !== providerActions || result.effect_type !== effectType
    || !HASH.test(result.effect_sha256 ?? "") || result.foreground_changed !== false
    || result.input_devices_touched !== false || result.secret_material_output !== false
    || !HASH.test(result.result_sha256 ?? "") || digest(body) !== result.result_sha256) {
    fail("STEWART_DISNEY_LIVE_STAGE_RESULT_INVALID");
  }
  return result;
}

export function compileStewartDisneyLiveAdapterCapability({ package_sha256, source_release_sha256, rehearsal_terminal, driver }) {
  if (!HASH.test(package_sha256 ?? "") || !HASH.test(source_release_sha256 ?? "")
    || rehearsal_terminal?.schema !== "pookakind.password-provider-deferred-terminal/v1"
    || rehearsal_terminal.state !== "VERIFIED_CONVERSION" || rehearsal_terminal.counted !== true
    || !HASH.test(rehearsal_terminal.operation ?? "") || !HASH.test(rehearsal_terminal.binding ?? "")
    || !Array.isArray(rehearsal_terminal.proofs) || rehearsal_terminal.proofs.length !== 8
    || rehearsal_terminal.proofs.some((proof) => !HASH.test(proof)) || rehearsal_terminal.failure !== null
    || rehearsal_terminal.secret_material_output !== false || rehearsal_terminal.automatic_retry !== false
    || !HASH.test(rehearsal_terminal.receipt_sha256 ?? "") || digest(Object.fromEntries(Object.entries(rehearsal_terminal).filter(([key]) => key !== "receipt_sha256"))) !== rehearsal_terminal.receipt_sha256
    || !driver || typeof driver !== "object") {
    fail("STEWART_DISNEY_LIVE_CAPABILITY_INPUT_INVALID");
  }
  const implementations = PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER.map((name) => driver[name]);
  if (new Set(implementations).size !== implementations.length) {
    fail("STEWART_DISNEY_LIVE_STAGE_IMPLEMENTATION_REUSE_FORBIDDEN");
  }
  const stages = PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER.map((name) => Object.freeze({ name, implementation_sha256: sourceSha256(name, driver[name]) }));
  const body = {
    schema: "pookakind.stewart-disney-live-adapter-capability/v1",
    state: "LIVE_DOSS_BACKGROUND__COMPLETE_NOT_EXECUTED",
    provider_id: PROVIDER_ID,
    package_sha256,
    source_release_sha256,
    rehearsal_terminal_sha256: rehearsal_terminal.receipt_sha256,
    stages,
    stage_count: stages.length,
    one_shot: true,
    foreground_changed: false,
    input_devices_touched: false,
    secret_material_output: false,
    provider_actions_per_conversion: 6,
  };
  return Object.freeze({ ...body, capability_sha256: digest(body) });
}

export function createStewartDisneyDeferredLiveStages({ capability, package_sha256, source_release_sha256, driver }) {
  exact(capability, ["capability_sha256", "foreground_changed", "input_devices_touched", "one_shot", "package_sha256", "provider_actions_per_conversion", "provider_id", "rehearsal_terminal_sha256", "schema", "secret_material_output", "source_release_sha256", "stage_count", "stages", "state"], "STEWART_DISNEY_LIVE_CAPABILITY_INVALID");
  const body = { ...capability }; delete body.capability_sha256;
  if (capability.schema !== "pookakind.stewart-disney-live-adapter-capability/v1"
    || capability.state !== "LIVE_DOSS_BACKGROUND__COMPLETE_NOT_EXECUTED" || capability.provider_id !== PROVIDER_ID
    || capability.package_sha256 !== package_sha256 || capability.source_release_sha256 !== source_release_sha256
    || !HASH.test(package_sha256 ?? "") || !HASH.test(source_release_sha256 ?? "")
    || capability.one_shot !== true || capability.foreground_changed !== false
    || capability.input_devices_touched !== false || capability.secret_material_output !== false
    || capability.provider_actions_per_conversion !== 6 || capability.stage_count !== PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER.length
    || !HASH.test(capability.rehearsal_terminal_sha256 ?? "") || !HASH.test(capability.capability_sha256 ?? "")
    || digest(body) !== capability.capability_sha256 || !Array.isArray(capability.stages)) fail("STEWART_DISNEY_LIVE_CAPABILITY_INVALID");
  const pinned = new Map(capability.stages.map((entry) => [entry?.name, entry?.implementation_sha256]));
  if (pinned.size !== PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER.length) fail("STEWART_DISNEY_LIVE_CAPABILITY_INVALID");
  const stages = {};
  for (const name of PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER) {
    if (pinned.get(name) !== sourceSha256(name, driver?.[name])) fail("STEWART_DISNEY_LIVE_STAGE_IMPLEMENTATION_DRIFT");
    stages[name] = async (request) => {
      const result = validateResult(await driver[name](request), name, request);
      return compilePasswordProviderStageReceipt({ operation_sha256: request.operation_sha256, state: result.state });
    };
  }
  return Object.freeze(stages);
}

export const STEWART_DISNEY_LIVE_STAGE_NAMES = PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER;
