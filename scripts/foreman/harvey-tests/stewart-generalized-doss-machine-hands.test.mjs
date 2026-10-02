import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

import {
  STEWART_GENERALIZED_DISNEY_SESSION_PINS,
} from "../../../lib/harvey/stewart-generalized-disney-session-runner.mjs";
import {
  compileStewartGeneralizedDossMachineHands,
  createStewartGeneralizedDossRunnerDependencies,
} from "../../../lib/harvey/stewart-generalized-doss-machine-hands.mjs";
import {
  STEWART_SYNTHETIC_FIXTURE_PINS,
  STEWART_SYNTHETIC_HTML,
  STEWART_SYNTHETIC_URL,
  validateStewartSyntheticTerminalProjection,
} from "../../../lib/harvey/stewart-generalized-https-synthetic-fixture.mjs";
import { verifyDossDisneyApprovalLogEntry, verifyDossStagedPackageRoot } from "../stewart-generalized-doss-machine-hands-runtime.mjs";

const h = (value) => value.repeat(64);
const input = (patch = {}) => ({
  schema: "pookakind.stewart-generalized-doss-machine-hands-input/v1",
  package_root: "C:\\pookakind\\package",
  session_root: "C:\\pookakind\\session",
  chrome_executable_path: "C:\\chrome\\chrome.exe",
  gate_artifact_path: "C:\\repo\\gate.md",
  approval_log_path: "C:\\repo\\approval.log",
  ...patch,
});
function fakeIo(patch = {}) {
  const expected = new Map(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map((file) => [file.relative_path.replaceAll("/", "\\"), file.sha256]));
  return {
    realpath: (path) => path,
    stat: (path) => ({ isDirectory: () => path.endsWith("package"), isFile: () => !path.endsWith("package") }),
    hashFile: (path) => {
      if (path.endsWith("gate.md")) return STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256;
      for (const [relative, sha256] of expected) if (path.endsWith(relative)) return sha256;
      throw new Error("UNKNOWN_FILE");
    },
    ...patch,
  };
}
const preflight = {
  schema: "pookakind.stewart-generalized-session-preflight/v1",
  observed_at: "2026-08-23T12:00:00.000Z",
  package_state: "EXACT_HASH_VERIFIED",
  package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256,
  native_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[0].sha256,
  gate_artifact_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256,
  approval_log_entry_sha256: h("a"),
  registry_state: "ABSENT", policy_state: "ABSENT", service_state: "ABSENT", scheduler_state: "ABSENT",
  startup_state: "ABSENT", watcher_state: "ABSENT", extension_state: "ABSENT", extension_trust_state: "NOT_LOADED",
  profile_state: "NOT_CREATED", profile_owner_process_count: 0, imported_disney_session_state: "ABSENT",
  imported_cookie_count: 0, imported_storage_state: "ABSENT",
};
const residual = {
  schema: "pookakind.stewart-generalized-session-residual-state/v1",
  registry_state: "ABSENT", policy_state: "ABSENT", service_state: "ABSENT", scheduler_state: "ABSENT",
  startup_state: "ABSENT", watcher_state: "ABSENT", extension_state: "ABSENT", profile_state: "NOT_CREATED",
  profile_owner_process_count: 0, generalized_process_count: 0, imported_disney_session_state: "ABSENT",
  imported_cookie_count: 0, imported_storage_state: "ABSENT", unrelated_state_touched: false,
};
function hands(events, patch = {}) {
  return {
    inspectCleanAbsent: async () => { events.push("preflight"); return preflight; },
    writeNativeHostRegistry: async () => { events.push("write-registry"); return { state: "WRITTEN", unrelated_state_touched: false }; },
    readNativeHostRegistry: async () => { events.push("read-registry"); return { state: "EXACT_MATCH", native_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[0].sha256 }; },
    createUniqueProfile: async () => { events.push("profile"); return { state: "FRESH_UNIQUE_EMPTY", profile_ref_sha256: h("b"), cookie_count: 0, storage_state: "ABSENT", disney_session_state: "ABSENT" }; },
    launchFixedExtension: async () => { events.push("launch"); return { state: "EXACT_OWNED_HEADLESS_SESSION", profile_ref_sha256: h("b"), session_ref_sha256: h("c"), extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, owner_process_count: 1, foreground_changed: false, input_devices_touched: false, persistent_profile: false }; },
    runPinnedHttpsSyntheticRoundTrip: async () => { events.push("synthetic"); return { state: "PASS", provider_state_sha256: h("d") }; },
    runBoundDisneyTransaction: async ({ transaction_sha256 }) => { events.push("disney"); return { schema: "pookakind.disney-mydisney-email-otp-receipt/v1", provider: "Disney MyDisney", transaction_sha256, state: "SUBMISSION_ACCEPTED", password_conversion: false, secret_material_returned: false }; },
    terminateOwnedSession: async () => { events.push("terminate"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    removeNativeHostRegistry: async () => { events.push("remove-registry"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    removeExactProfile: async () => { events.push("remove-profile"); return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    inspectResidualState: async () => { events.push("residual"); return residual; },
    ...patch,
  };
}
function dependencies(events, patch = {}) {
  const plan = compileStewartGeneralizedDossMachineHands(input(), fakeIo());
  return createStewartGeneralizedDossRunnerDependencies({
    plan,
    hands: hands(events, patch),
    durableStore: { claimSession: async () => ({ state: "CLAIMED", claim_sha256: h("e") }), appendTerminalReceipt: async ({ receipt }) => ({ state: "APPENDED", receipt_sha256: receipt.receipt_sha256 }) },
    now: () => Date.parse("2026-08-23T12:00:00.000Z"),
  });
}

test("pins one provider-neutral HTTPS fixture with no provider contact or secret material", () => {
  assert.equal(STEWART_SYNTHETIC_URL.startsWith("https://"), true);
  assert.equal(STEWART_SYNTHETIC_FIXTURE_PINS.provider_contacted, false);
  assert.equal(STEWART_SYNTHETIC_FIXTURE_PINS.material_class, "FIXED_NONSECRET_SYNTHETIC_ONLY");
  assert.equal(createHash("sha256").update(STEWART_SYNTHETIC_HTML).digest("hex"), STEWART_SYNTHETIC_FIXTURE_PINS.html_sha256);
  assert.equal(STEWART_SYNTHETIC_HTML.includes("http"), false);
});

test("synthetic terminal projection emits only sanitized fixed-false proof", () => {
  const result = validateStewartSyntheticTerminalProjection({ state: "PASS", provider_state_sha256: h("a") });
  assert.equal(result.provider_contacted, false); assert.equal(result.secret_material_used, false);
  assert.throws(() => validateStewartSyntheticTerminalProjection({ state: "PASS", provider_state_sha256: h("a"), password: "x" }), /PROJECTION_INVALID/);
});

test("extension preserves the native port through readback and closes only after synthetic terminal proof", async () => {
  const source = readFileSync("scripts/foreman/stewart-generalized-extension/service-worker.js", "utf8");
  let pageListener; let portListener; let disconnects = 0; const pageMessages = []; const nativePosts = [];
  const port = {
    disconnect: () => { disconnects += 1; },
    postMessage: (value) => nativePosts.push(value),
    onDisconnect: { addListener: () => {} },
    onMessage: { addListener: (listener) => { portListener = listener; } },
  };
  const chrome = {
    runtime: {
      id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id,
      connectNative: () => port,
      onMessage: { addListener: (listener) => { pageListener = listener; } },
    },
    tabs: { sendMessage: async (_tabId, value) => { pageMessages.push(value); return value.schema.endsWith("describe/v1") ? { schema: "pookakind.stewart-extension-dom-observation/v1" } : value.schema.endsWith("execute-fields/v1") ? { schema: "pookakind.stewart-extension-dom-execution/v1" } : { schema: "pookakind.stewart-extension-dom-readback/v1" }; } },
  };
  const crypto = { subtle: { digest: async (_algorithm, bytes) => {
    const value = createHash("sha256").update(bytes).digest();
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  } } };
  runInNewContext(source, { chrome, URL, TextEncoder, crypto, Map, Error });
  pageListener({ schema: "pookakind.stewart-extension-page-ready/v1" }, { tab: { id: 7 }, url: STEWART_SYNTHETIC_URL }, () => {});
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(nativePosts[0].schema, "pookakind.stewart-extension-bootstrap/v1");
  portListener({ schema: "pookakind.stewart-extension-readback-request/v1", scope: {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(disconnects, 0);
  portListener({ schema: "pookakind.stewart-generalized-native-host-receipt/v1", state: "SUBMISSION_ACCEPTED", provider_state_sha256: h("a"), fixed: false, password_conversion: false, secret_material_returned: false, recurring_operation_created: false });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pageMessages.at(-1).schema, "pookakind.stewart-extension-synthetic-terminal/v1");
  assert.equal(disconnects, 1);
});

test("compiles only the exact package tree and gate without activating", () => {
  const plan = compileStewartGeneralizedDossMachineHands(input(), fakeIo());
  assert.equal(plan.state, "SOURCE_CUSTODIED_NOT_ACTIVATED");
  assert.equal(plan.package_sha256, STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256);
  assert.equal(plan.recurrence, false); assert.equal(plan.generic_input_allowed, false); assert.equal(plan.operation_limit, 1);
});

test("package or gate drift fails before any machine hand", () => {
  assert.throws(() => compileStewartGeneralizedDossMachineHands(input(), fakeIo({ hashFile: () => h("f") })), /PACKAGE_FILE_DRIFT/);
  const base = fakeIo();
  assert.throws(() => compileStewartGeneralizedDossMachineHands(input(), { ...base, hashFile: (path) => path.endsWith("gate.md") ? h("f") : base.hashFile(path) }), /GATE_DRIFT/);
});

test("real machine preflight independently rehashes the exact staged package tree", () => {
  const files = STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map(({ relative_path }) => relative_path);
  const hashes = new Map(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map(({ relative_path, sha256 }) => [relative_path.replaceAll("/", "\\"), sha256]));
  const io = { realpath: (value) => value, listFiles: () => files, hashFile: (target) => { for (const [suffix, sha256] of hashes) if (target.endsWith(suffix)) return sha256; throw new Error("MISSING"); } };
  const receipt = verifyDossStagedPackageRoot("C:\\package", io);
  assert.equal(receipt.state, "EXACT_HASH_VERIFIED");
  assert.equal(receipt.file_count, files.length);
  assert.throws(() => verifyDossStagedPackageRoot("C:\\package", { ...io, listFiles: () => [...files, "unexpected.js"] }), /PACKAGE_TREE_DRIFT/);
  assert.throws(() => verifyDossStagedPackageRoot("C:\\package", { ...io, hashFile: () => h("f") }), /PACKAGE_FILE_DRIFT/);
});

test("real machine preflight requires the exact durable V3 approval ledger row", () => {
  const line = `| 2026-08-23 | STEWART GENERALIZED DISNEY FULL CONVERSION V3 | DOSS package ${STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256} | APPROVED |`;
  const sha256 = createHash("sha256").update(line).digest("hex");
  const receipt = verifyDossDisneyApprovalLogEntry("C:\\approval.md", sha256, { readText: () => `${line}\n` });
  assert.equal(receipt.state, "EXACT_APPROVAL_LOG_ENTRY_VERIFIED");
  assert.throws(() => verifyDossDisneyApprovalLogEntry("C:\\approval.md", h("f"), { readText: () => `${line}\n` }), /ENTRY_NOT_FOUND/);
  const wrong = line.replace("APPROVED", "PREPARED"); const wrongHash = createHash("sha256").update(wrong).digest("hex");
  assert.throws(() => verifyDossDisneyApprovalLogEntry("C:\\approval.md", wrongHash, { readText: () => `${wrong}\n` }), /ENTRY_SCOPE_INVALID/);
  for (const hostile of [
    line.replace("APPROVED", "NOT APPROVED"),
    line.replace("DOSS package", "NOT DOSS package"),
    line.replace("STEWART GENERALIZED DISNEY FULL CONVERSION V3", "NOT STEWART GENERALIZED DISNEY FULL CONVERSION V3"),
    line.replace("| APPROVED |", `| APPROVED | ${STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256} |`),
  ]) {
    const hostileHash = createHash("sha256").update(hostile).digest("hex");
    assert.throws(() => verifyDossDisneyApprovalLogEntry("C:\\approval.md", hostileHash, { readText: () => `${hostile}\n` }), /ENTRY_SCOPE_INVALID/);
  }
});

test("registry write requires an immediate exact readback", async () => {
  const events = []; const deps = dependencies(events, { readNativeHostRegistry: async () => { events.push("read-registry"); return { state: "MISMATCH", native_manifest_sha256: h("f") }; } });
  await assert.rejects(deps.registerNativeHost({ registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key, native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name, native_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[0].sha256 }), /READBACK_MISMATCH/);
  assert.deepEqual(events, ["write-registry", "read-registry"]);
});

test("fresh profile, exact owned process, fixed extension, and terminal synthetic proof compose", async () => {
  const events = []; const deps = dependencies(events);
  const session = await deps.launchEphemeralChrome();
  const proof = await deps.runSyntheticProof({ session_ref_sha256: session.session_ref_sha256 });
  assert.equal(proof.state, "PASS"); assert.equal(proof.provider_contacted, false); assert.equal(proof.secret_material_used, false);
  assert.deepEqual(events, ["profile", "launch", "synthetic"]);
});

test("imported state, multiple owner processes, and session substitution fail closed", async () => {
  await assert.rejects(dependencies([], { createUniqueProfile: async () => ({ state: "FRESH_UNIQUE_EMPTY", profile_ref_sha256: h("b"), cookie_count: 1, storage_state: "ABSENT", disney_session_state: "ABSENT" }) }).launchEphemeralChrome(), /PROFILE_NOT_CLEAN/);
  await assert.rejects(dependencies([], { launchFixedExtension: async () => ({ state: "EXACT_OWNED_HEADLESS_SESSION", profile_ref_sha256: h("b"), session_ref_sha256: h("c"), extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, owner_process_count: 2, foreground_changed: false, input_devices_touched: false, persistent_profile: false }) }).launchEphemeralChrome(), /LAUNCH_INVALID/);
  const deps = dependencies([]); await deps.launchEphemeralChrome(); await assert.rejects(deps.runSyntheticProof({ session_ref_sha256: h("f") }), /CUSTODY_CONFLICT/);
});

test("rollback methods preserve exact unrelated-state receipts and residual inspection", async () => {
  const events = []; const deps = dependencies(events); await deps.launchEphemeralChrome();
  assert.equal((await deps.terminateSession()).state, "ROLLED_BACK_OR_ALREADY_ABSENT");
  assert.equal((await deps.removeRegistry()).unrelated_state_touched, false);
  assert.equal((await deps.removeEphemeralProfile()).unrelated_state_touched, false);
  assert.equal((await deps.inspectResidualState()).registry_state, "ABSENT");
  assert.deepEqual(events.slice(-4), ["terminate", "remove-registry", "remove-profile", "residual"]);
});

test("malformed, accessor, symbol, and secret-shaped plans fail closed", () => {
  assert.throws(() => compileStewartGeneralizedDossMachineHands({ ...input(), password: "x" }, fakeIo()), /PRIVATE_FIELD_FORBIDDEN/);
  const accessor = input(); Object.defineProperty(accessor, "schema", { enumerable: true, get: () => input().schema });
  assert.throws(() => compileStewartGeneralizedDossMachineHands(accessor, fakeIo()), /INPUT_NOT_PLAIN/);
  const symbol = input(); symbol[Symbol("smuggle")] = true;
  assert.throws(() => compileStewartGeneralizedDossMachineHands(symbol, fakeIo()), /INPUT_NOT_PLAIN/);
});
