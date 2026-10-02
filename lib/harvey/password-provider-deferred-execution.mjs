import { createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const FORBIDDEN_KEY = /^(?:credential|material|otp|passcode|password|pin|secret|token|value)$/i;
const STAGES = Object.freeze([
  ["observeRoute", "ROUTE_BOUND"],
  ["bindIdentity", "IDENTITY_BOUND"],
  ["requestRecovery", "RECOVERY_REQUEST_ACCEPTED"],
  ["captureChallenge", "CHALLENGE_CAPTURED_OPAQUE"],
  ["submitChallenge", "CHALLENGE_ACCEPTED"],
  ["executeChange", "PASSWORD_CHANGE_ACCEPTED"],
  ["clearSession", "SIGNED_OUT_STATE_CLEARED"],
  ["beginFreshSignIn", "FRESH_SIGN_IN_IDENTITY_ACCEPTED"],
  ["verifyFreshSignIn", "FRESH_SIGNED_OUT_SIGN_IN_ACCEPTED"],
  ["reconcileVault", "EXACT_ONE_VAULT_VERIFIED_CURRENT"],
]);
const RECEIPT_FIELDS = ["operation_sha256", "receipt_sha256", "schema", "secret_material_output", "state"];

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== [...fields].sort().join("|")) fail(code);
}

function rejectPrivate(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (!value || typeof value !== "object") fail("PASSWORD_DEFERRED_EXECUTION_PRIVATE_DATA_INVALID");
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) fail("PASSWORD_DEFERRED_EXECUTION_PRIVATE_DATA_FORBIDDEN");
    rejectPrivate(child);
  }
}

function validatePlan(plan) {
  if (!plan || plan.schema !== "pookakind.password-provider-flow-plan/v1"
    || !HASH.test(plan.plan_sha256 ?? "") || !HASH.test(plan.account_ref_sha256 ?? "")
    || plan.secret_material_present !== false) fail("PASSWORD_DEFERRED_EXECUTION_PLAN_INVALID");
  const body = { ...plan }; delete body.plan_sha256;
  if (digest(body) !== plan.plan_sha256) fail("PASSWORD_DEFERRED_EXECUTION_PLAN_INVALID");
}

function validateStageReceipt(receipt, expectedState, operationSha256) {
  exact(receipt, RECEIPT_FIELDS, "PASSWORD_DEFERRED_EXECUTION_STAGE_RECEIPT_INVALID");
  const body = { ...receipt }; delete body.receipt_sha256;
  if (receipt.schema !== "pookakind.password-provider-stage-receipt/v1"
    || receipt.state !== expectedState || receipt.operation_sha256 !== operationSha256
    || receipt.secret_material_output !== false || !HASH.test(receipt.receipt_sha256 ?? "")
    || digest(body) !== receipt.receipt_sha256) fail("PASSWORD_DEFERRED_EXECUTION_STAGE_RECEIPT_INVALID");
  rejectPrivate(receipt);
  return Object.freeze(structuredClone(receipt));
}

function terminalBody({ operationSha256, bindingSha256, state, counted, proofs, failure }) {
  return {
    schema: "pookakind.password-provider-deferred-terminal/v1",
    operation: operationSha256,
    binding: bindingSha256,
    state,
    counted,
    proofs,
    failure,
    secret_material_output: false,
    automatic_retry: false,
  };
}

function validateTerminal(value, operationSha256, bindingSha256) {
  exact(value, ["automatic_retry", "binding", "counted", "failure", "operation", "proofs", "receipt_sha256", "schema", "secret_material_output", "state"], "PASSWORD_DEFERRED_EXECUTION_TERMINAL_INVALID");
  const body = { ...value }; delete body.receipt_sha256;
  if (value.schema !== "pookakind.password-provider-deferred-terminal/v1"
    || value.operation !== operationSha256 || value.binding !== bindingSha256
    || typeof value.counted !== "boolean" || !Array.isArray(value.proofs)
    || value.proofs.some((proof) => !HASH.test(proof))
    || value.secret_material_output !== false || value.automatic_retry !== false
    || !HASH.test(value.receipt_sha256 ?? "") || digest(body) !== value.receipt_sha256) {
    fail("PASSWORD_DEFERRED_EXECUTION_TERMINAL_INVALID");
  }
  rejectPrivate(value);
  return Object.freeze(structuredClone(value));
}

function safeFailure(error) {
  const value = String(error?.code || error?.message || "PASSWORD_DEFERRED_EXECUTION_FAILED_CLOSED");
  return /^[A-Z0-9_]{3,120}$/.test(value) ? value : "PASSWORD_DEFERRED_EXECUTION_FAILED_CLOSED";
}

/**
 * Runs a web recovery flow as one claimed operation. The recovery request must
 * complete before challenge capture is even callable, fixing the old eager-OTP
 * composition. Every later stage receives only hashes of prior receipts.
 */
export async function runPasswordProviderDeferredExecution({ plan, operation_sha256, binding_sha256, dependencies }) {
  validatePlan(plan);
  if (!HASH.test(operation_sha256 ?? "") || !HASH.test(binding_sha256 ?? "")
    || !dependencies || typeof dependencies !== "object"
    || typeof dependencies.claimOperation !== "function" || typeof dependencies.appendTerminal !== "function"
    || STAGES.some(([name]) => typeof dependencies[name] !== "function")) fail("PASSWORD_DEFERRED_EXECUTION_INPUT_INVALID");

  const claim = await dependencies.claimOperation(Object.freeze({
    schema: "pookakind.password-provider-deferred-claim/v1",
    operation_sha256,
    binding_sha256,
    plan_sha256: plan.plan_sha256,
  }));
  if (claim?.state === "TERMINAL_REPLAY") return validateTerminal(claim.terminal, operation_sha256, binding_sha256);
  if (claim?.state === "STRANDED") return Object.freeze({
    schema: "pookakind.password-provider-deferred-blocker/v1",
    state: "CRASH_STRANDED_NO_AUTOMATIC_RETRY",
    operation: operation_sha256,
    binding: binding_sha256,
    counted: false,
    proofs: [],
    secret_material_output: false,
    automatic_retry: false,
  });
  if (claim?.state !== "CLAIMED") fail("PASSWORD_DEFERRED_EXECUTION_CLAIM_INVALID");

  const receipts = new Map();
  let terminal;
  try {
    for (const [name, expectedState] of STAGES) {
      const prior_receipt_sha256 = Object.freeze(Object.fromEntries([...receipts].map(([stage, receipt]) => [stage, receipt.receipt_sha256])));
      const receipt = validateStageReceipt(await dependencies[name](Object.freeze({
        schema: "pookakind.password-provider-stage-request/v1",
        operation_sha256,
        binding_sha256,
        plan_sha256: plan.plan_sha256,
        prior_receipt_sha256,
      })), expectedState, operation_sha256);
      receipts.set(name, receipt);
    }
    const proofs = [
      receipts.get("observeRoute").receipt_sha256,
      receipts.get("executeChange").receipt_sha256,
      receipts.get("verifyFreshSignIn").receipt_sha256,
      receipts.get("requestRecovery").receipt_sha256,
      receipts.get("reconcileVault").receipt_sha256,
      receipts.get("captureChallenge").receipt_sha256,
      receipts.get("submitChallenge").receipt_sha256,
      receipts.get("beginFreshSignIn").receipt_sha256,
    ];
    const body = terminalBody({ operationSha256: operation_sha256, bindingSha256: binding_sha256, state: "VERIFIED_CONVERSION", counted: true, proofs, failure: null });
    terminal = Object.freeze({ ...body, receipt_sha256: digest(body) });
  } catch (error) {
    const proofs = [...receipts.values()].map(({ receipt_sha256 }) => receipt_sha256);
    const body = terminalBody({ operationSha256: operation_sha256, bindingSha256: binding_sha256, state: "CHANGE_UNPROVEN_NO_AUTOMATIC_RETRY", counted: false, proofs, failure: safeFailure(error) });
    terminal = Object.freeze({ ...body, receipt_sha256: digest(body) });
  }
  rejectPrivate(terminal);
  const appended = await dependencies.appendTerminal(Object.freeze({ operation_sha256, terminal }));
  if (!appended || !["APPENDED", "EXACT_REPLAY"].includes(appended.state)
    || appended.receipt_sha256 !== terminal.receipt_sha256) fail("PASSWORD_DEFERRED_EXECUTION_TERMINAL_APPEND_FAILED");
  return terminal;
}

export function compilePasswordProviderStageReceipt({ operation_sha256, state }) {
  if (!HASH.test(operation_sha256 ?? "") || !STAGES.some(([, expected]) => expected === state)) fail("PASSWORD_DEFERRED_EXECUTION_STAGE_INPUT_INVALID");
  const body = { schema: "pookakind.password-provider-stage-receipt/v1", operation_sha256, state, secret_material_output: false };
  return Object.freeze({ ...body, receipt_sha256: digest(body) });
}

export const PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER = Object.freeze(STAGES.map(([name]) => name));

function writeExclusive(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const descriptor = openSync(path, "wx", 0o600);
  try { writeFileSync(descriptor, canonicalJson(value), "utf8"); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
}

function readSafeJson(path, code) {
  let value;
  try { value = JSON.parse(readFileSync(path, "utf8")); } catch { fail(code); }
  rejectPrivate(value);
  return value;
}

/** Append-once local custody. A claim without a terminal is deliberately
 * stranded; it is never silently converted into retry authority.
 */
export function createPasswordProviderDeferredDurableStore({ root }) {
  if (typeof root !== "string" || root.length < 4) fail("PASSWORD_DEFERRED_STORE_ROOT_INVALID");
  const candidate = resolve(root); mkdirSync(candidate, { recursive: true, mode: 0o700 });
  const provedRoot = realpathSync(candidate);
  if (!statSync(provedRoot).isDirectory()) fail("PASSWORD_DEFERRED_STORE_ROOT_INVALID");
  const paths = (operationSha256) => {
    if (!HASH.test(operationSha256 ?? "")) fail("PASSWORD_DEFERRED_STORE_OPERATION_INVALID");
    const operationRoot = resolve(provedRoot, operationSha256);
    if (!operationRoot.startsWith(`${provedRoot}${sep}`)) fail("PASSWORD_DEFERRED_STORE_PATH_ESCAPE");
    return { claim: join(operationRoot, "claim.json"), terminal: join(operationRoot, "terminal.json") };
  };
  return Object.freeze({
    async claimOperation(claim) {
      exact(claim, ["binding_sha256", "operation_sha256", "plan_sha256", "schema"], "PASSWORD_DEFERRED_STORE_CLAIM_INVALID");
      if (claim.schema !== "pookakind.password-provider-deferred-claim/v1"
        || !HASH.test(claim.binding_sha256 ?? "") || !HASH.test(claim.plan_sha256 ?? "")) fail("PASSWORD_DEFERRED_STORE_CLAIM_INVALID");
      rejectPrivate(claim);
      const path = paths(claim.operation_sha256);
      if (existsSync(path.terminal)) return { state: "TERMINAL_REPLAY", terminal: readSafeJson(path.terminal, "PASSWORD_DEFERRED_STORE_TERMINAL_INVALID") };
      if (existsSync(path.claim)) {
        const existing = readSafeJson(path.claim, "PASSWORD_DEFERRED_STORE_CLAIM_INVALID");
        if (canonicalJson(existing) !== canonicalJson(claim)) fail("PASSWORD_DEFERRED_STORE_CLAIM_CONFLICT");
        return { state: "STRANDED" };
      }
      try { writeExclusive(path.claim, claim); return { state: "CLAIMED" }; }
      catch (error) { if (error?.code !== "EEXIST") throw error; return { state: "STRANDED" }; }
    },
    async appendTerminal({ operation_sha256, terminal }) {
      const path = paths(operation_sha256);
      if (!existsSync(path.claim)) fail("PASSWORD_DEFERRED_STORE_CLAIM_MISSING");
      if (!HASH.test(terminal?.binding ?? "")) fail("PASSWORD_DEFERRED_STORE_TERMINAL_INVALID");
      validateTerminal(terminal, operation_sha256, terminal.binding);
      if (existsSync(path.terminal)) {
        const existing = readSafeJson(path.terminal, "PASSWORD_DEFERRED_STORE_TERMINAL_INVALID");
        if (canonicalJson(existing) !== canonicalJson(terminal)) return { state: "CONFLICT", receipt_sha256: existing.receipt_sha256 ?? null };
        return { state: "EXACT_REPLAY", receipt_sha256: existing.receipt_sha256 };
      }
      try { writeExclusive(path.terminal, terminal); return { state: "APPENDED", receipt_sha256: terminal.receipt_sha256 }; }
      catch (error) { if (error?.code !== "EEXIST") throw error; return { state: "CONFLICT", receipt_sha256: null }; }
    },
  });
}
