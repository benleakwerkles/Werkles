import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

import {
  STEWART_GENERALIZED_DISNEY_SESSION_PINS,
} from "./stewart-generalized-disney-session-runner.mjs";
import {
  STEWART_SYNTHETIC_FIXTURE_PINS,
  validateStewartSyntheticTerminalProjection,
} from "./stewart-generalized-https-synthetic-fixture.mjs";
import { canonicalJson } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const INPUT_FIELDS = ["approval_log_path", "chrome_executable_path", "gate_artifact_path", "package_root", "schema", "session_root"];
const HAND_METHODS = [
  "inspectCleanAbsent", "writeNativeHostRegistry", "readNativeHostRegistry", "createUniqueProfile",
  "launchFixedExtension", "runPinnedHttpsSyntheticRoundTrip", "runBoundDisneyTransaction",
  "terminateOwnedSession", "removeNativeHostRegistry", "removeExactProfile", "inspectResidualState",
];
const FORBIDDEN_KEYS = new Set(["credential", "email", "identity", "material", "otp", "passcode", "password", "pin", "secret", "token", "username", "value"]);

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digestBytes(value) { return createHash("sha256").update(value).digest("hex"); }
function digest(value) { return digestBytes(canonicalJson(value)); }
function snapshot(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object") fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value); const keys = Object.keys(descriptors).filter((key) => key !== "length");
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(code);
    return keys.map((key) => {
      const descriptor = descriptors[key];
      if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
      return snapshot(descriptor.value, code);
    });
  }
  if (prototype !== Object.prototype && prototype !== null) fail(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(code);
  const output = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
    output[key] = snapshot(descriptor.value, code);
  }
  return output;
}
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function safe(value) {
  if (typeof value === "string") {
    if (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value)) fail("STEWART_DOSS_HANDS_SECRET_SHAPED_DATA_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) return value.forEach(safe);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) fail("STEWART_DOSS_HANDS_PRIVATE_FIELD_FORBIDDEN");
    safe(child);
  }
}
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value)) freeze(child); return Object.freeze(value); }
function exactFile(path, expected, code, hashFile = (target) => digestBytes(readFileSync(target))) {
  let actual; try { actual = hashFile(path); } catch { fail(code); }
  if (actual !== expected) fail(code);
}
function child(root, relative, code) {
  const target = resolve(root, ...relative.split("/"));
  if (!target.startsWith(`${root}${sep}`)) fail(code);
  return target;
}

export function compileStewartGeneralizedDossMachineHands(rawInput, io = {}) {
  const input = snapshot(rawInput, "STEWART_DOSS_HANDS_INPUT_NOT_PLAIN"); safe(input); exact(input, INPUT_FIELDS, "STEWART_DOSS_HANDS_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.stewart-generalized-doss-machine-hands-input/v1") fail("STEWART_DOSS_HANDS_INPUT_INVALID");
  const realpath = io.realpath ?? realpathSync;
  const stat = io.stat ?? statSync;
  const hashFile = io.hashFile ?? ((target) => digestBytes(readFileSync(target)));
  const packageRoot = realpath(resolve(input.package_root));
  const sessionRoot = resolve(input.session_root);
  const chromePath = realpath(resolve(input.chrome_executable_path));
  const gatePath = realpath(resolve(input.gate_artifact_path));
  const approvalPath = realpath(resolve(input.approval_log_path));
  if (!stat(packageRoot).isDirectory() || !stat(chromePath).isFile() || !stat(gatePath).isFile() || !stat(approvalPath).isFile()) fail("STEWART_DOSS_HANDS_PATH_INVALID");
  for (const file of STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files) exactFile(child(packageRoot, file.relative_path, "STEWART_DOSS_HANDS_PACKAGE_PATH_ESCAPE"), file.sha256, "STEWART_DOSS_HANDS_PACKAGE_FILE_DRIFT", hashFile);
  exactFile(gatePath, STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256, "STEWART_DOSS_HANDS_GATE_DRIFT", hashFile);
  const packageTree = digestBytes(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map(({ relative_path, sha256 }) => `${relative_path}:${sha256}`).join("\n"));
  if (packageTree !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256) fail("STEWART_DOSS_HANDS_PACKAGE_TREE_DRIFT");
  const body = {
    schema: "pookakind.stewart-generalized-doss-machine-hands-plan/v1",
    state: "SOURCE_CUSTODIED_NOT_ACTIVATED",
    machine: "DOSS",
    package_root: packageRoot,
    session_root: sessionRoot,
    chrome_executable_path: chromePath,
    gate_artifact_path: gatePath,
    approval_log_path: approvalPath,
    package_sha256: packageTree,
    package_files_sha256: digest(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files),
    extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
    native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name,
    registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key,
    fixture: STEWART_SYNTHETIC_FIXTURE_PINS,
    operation_limit: 1,
    persistent_profile: false,
    provider_contacted: false,
    generic_input_allowed: false,
    recurrence: false,
  };
  return freeze({ ...body, plan_sha256: digest(body) });
}

export function createStewartGeneralizedDossRunnerDependencies({ plan: rawPlan, hands, durableStore, now = () => Date.now() }) {
  const plan = snapshot(rawPlan, "STEWART_DOSS_HANDS_PLAN_NOT_PLAIN"); safe(plan);
  if (plan.schema !== "pookakind.stewart-generalized-doss-machine-hands-plan/v1" || plan.state !== "SOURCE_CUSTODIED_NOT_ACTIVATED"
    || plan.machine !== "DOSS" || plan.package_sha256 !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256
    || plan.extension_id !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id || plan.native_host_name !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name
    || plan.registry_key !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key || plan.operation_limit !== 1
    || plan.persistent_profile !== false || plan.provider_contacted !== false || plan.generic_input_allowed !== false || plan.recurrence !== false
    || digest(Object.fromEntries(Object.entries(plan).filter(([key]) => key !== "plan_sha256"))) !== plan.plan_sha256
    || canonicalJson(plan.fixture) !== canonicalJson(STEWART_SYNTHETIC_FIXTURE_PINS)) fail("STEWART_DOSS_HANDS_PLAN_INVALID");
  if (!hands || typeof hands !== "object" || Array.isArray(hands) || HAND_METHODS.some((name) => typeof hands[name] !== "function")) fail("STEWART_DOSS_HANDS_RUNTIME_INVALID");
  if (!durableStore || typeof durableStore.claimSession !== "function" || typeof durableStore.appendTerminalReceipt !== "function" || typeof now !== "function") fail("STEWART_DOSS_HANDS_RUNTIME_INVALID");
  let ownedSession = null;
  return freeze({
    now,
    claimSession: durableStore.claimSession,
    appendTerminalReceipt: durableStore.appendTerminalReceipt,
    async inspectPreflight({ package: packageObservation, activation }) {
      const observed = snapshot(await hands.inspectCleanAbsent(freeze({ plan, package: packageObservation, activation })), "STEWART_DOSS_HANDS_PREFLIGHT_NOT_PLAIN"); safe(observed);
      return observed;
    },
    async registerNativeHost(request) {
      const written = snapshot(await hands.writeNativeHostRegistry(freeze({ ...request, package_root: plan.package_root })), "STEWART_DOSS_HANDS_REGISTRY_WRITE_NOT_PLAIN"); safe(written);
      if (written.state !== "WRITTEN" || written.unrelated_state_touched !== false) fail("STEWART_DOSS_HANDS_REGISTRY_WRITE_FAILED");
      const readback = snapshot(await hands.readNativeHostRegistry(freeze({ registry_key: plan.registry_key })), "STEWART_DOSS_HANDS_REGISTRY_READBACK_NOT_PLAIN"); safe(readback);
      if (readback.state !== "EXACT_MATCH" || readback.native_manifest_sha256 !== request.native_manifest_sha256) fail("STEWART_DOSS_HANDS_REGISTRY_READBACK_MISMATCH");
      return freeze({ state: "EXACT_HKCU_HOST_REGISTERED", registry_key: plan.registry_key, native_manifest_sha256: request.native_manifest_sha256, immediate_readback_state: "EXACT_MATCH", unrelated_state_touched: false });
    },
    async launchEphemeralChrome() {
      const profile = snapshot(await hands.createUniqueProfile(freeze({ session_root: plan.session_root, imported_state_allowed: false })), "STEWART_DOSS_HANDS_PROFILE_NOT_PLAIN"); safe(profile);
      if (profile.state !== "FRESH_UNIQUE_EMPTY" || !HASH.test(profile.profile_ref_sha256 ?? "") || profile.cookie_count !== 0 || profile.storage_state !== "ABSENT" || profile.disney_session_state !== "ABSENT") fail("STEWART_DOSS_HANDS_PROFILE_NOT_CLEAN");
      const launched = snapshot(await hands.launchFixedExtension(freeze({ plan, profile })), "STEWART_DOSS_HANDS_LAUNCH_NOT_PLAIN"); safe(launched);
      if (launched.state !== "EXACT_OWNED_HEADLESS_SESSION" || launched.profile_ref_sha256 !== profile.profile_ref_sha256
        || launched.extension_id !== plan.extension_id || !HASH.test(launched.session_ref_sha256 ?? "") || launched.owner_process_count !== 1
        || launched.foreground_changed !== false || launched.input_devices_touched !== false || launched.persistent_profile !== false) fail("STEWART_DOSS_HANDS_LAUNCH_INVALID");
      ownedSession = freeze({ ...launched, profile_ref_sha256: profile.profile_ref_sha256 });
      return freeze({ state: "EXACT_EPHEMERAL_SESSION_ACTIVE", session_ref_sha256: launched.session_ref_sha256, extension_id: plan.extension_id, persistent_profile: false, imported_cookie_count: 0, imported_storage_state: "ABSENT", imported_disney_session_state: "ABSENT", foreground_changed: false, input_devices_touched: false });
    },
    async runSyntheticProof({ session_ref_sha256 }) {
      if (!ownedSession || ownedSession.session_ref_sha256 !== session_ref_sha256) fail("STEWART_DOSS_HANDS_SESSION_CUSTODY_CONFLICT");
      const projected = snapshot(await hands.runPinnedHttpsSyntheticRoundTrip(freeze({ plan, session: ownedSession })), "STEWART_DOSS_HANDS_SYNTHETIC_NOT_PLAIN"); safe(projected);
      const proof = validateStewartSyntheticTerminalProjection(projected);
      void proof;
      return freeze({ schema: "pookakind.stewart-generalized-session-synthetic-receipt/v1", state: "PASS", package_sha256: plan.package_sha256, extension_id: plan.extension_id, native_host_name: plan.native_host_name, provider_contacted: false, secret_material_used: false, input_devices_touched: false, foreground_changed: false });
    },
    async runDisneyTransaction(request) {
      if (!ownedSession || ownedSession.session_ref_sha256 !== request.session_ref_sha256) fail("STEWART_DOSS_HANDS_SESSION_CUSTODY_CONFLICT");
      const receipt = snapshot(await hands.runBoundDisneyTransaction(freeze({ ...request, session: ownedSession })), "STEWART_DOSS_HANDS_DISNEY_NOT_PLAIN"); safe(receipt); return freeze(receipt);
    },
    async terminateSession() {
      const result = snapshot(await hands.terminateOwnedSession(freeze({ session: ownedSession })), "STEWART_DOSS_HANDS_TERMINATE_NOT_PLAIN"); safe(result); ownedSession = null;
      return result;
    },
    async removeRegistry() { const result = snapshot(await hands.removeNativeHostRegistry(freeze({ registry_key: plan.registry_key })), "STEWART_DOSS_HANDS_REGISTRY_REMOVE_NOT_PLAIN"); safe(result); return result; },
    async removeEphemeralProfile() { const result = snapshot(await hands.removeExactProfile(freeze({ session_root: plan.session_root })), "STEWART_DOSS_HANDS_PROFILE_REMOVE_NOT_PLAIN"); safe(result); return result; },
    async inspectResidualState() { const result = snapshot(await hands.inspectResidualState(freeze({ plan })), "STEWART_DOSS_HANDS_RESIDUAL_NOT_PLAIN"); safe(result); return result; },
  });
}

export const STEWART_GENERALIZED_DOSS_HANDS_CAPABILITY = freeze({
  schema: "pookakind.stewart-generalized-doss-hands-capability/v1",
  state: "SOURCE_CUSTODIED_NOT_ACTIVATED",
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  fixture: STEWART_SYNTHETIC_FIXTURE_PINS,
  live_callable: false,
  password_conversion_claimed: false,
  recurring_operation_created: false,
});
