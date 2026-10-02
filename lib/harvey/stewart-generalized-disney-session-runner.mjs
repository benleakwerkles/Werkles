import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, realpathSync, statSync, writeFileSync, fsyncSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { canonicalJson, keyFingerprint, verifyDurableRecord } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";
import { STEWART_GENERALIZED_SESSION_RELEASE } from "./stewart-generalized-session-activation.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PACKAGE_SHA256 = "413b5a2741fabdfa349cc2071e6a24d835a8a7a8500343c8a53b6b3b48dfa6c1";
const EXTENSION_ID = "dlkekkfjpgfghllndmdjffnfnpencdge";
const NATIVE_HOST_NAME = "com.werkles.pookakind.stewart_generalized";
const REGISTRY_KEY = "HKCU/Software/Google/Chrome/NativeMessagingHosts/com.werkles.pookakind.stewart_generalized/(Default)";
const GATE_ARTIFACT_SHA256 = "3c4bda5d0329dcb575314941b48487656bf8d20a14b94f7c59c721dc76a2afb4";
const APPROVAL_PHRASE_SHA256 = "2379afbc46e91232e91b6c0121fc04f86a2b061c1e0f281d56d515c2a11066c1";
const ISSUER = "pookakind-operator";
const AUDIENCE = `stewart-generalized-disney-session/v1:DOSS:${PACKAGE_SHA256}`;
const SOURCE_RELEASE_SHA256 = createHash("sha256").update(canonicalJson(STEWART_GENERALIZED_SESSION_RELEASE)).digest("hex");

const PACKAGE_FILES = deepFreeze([
  ["com.werkles.pookakind.stewart_generalized.json", "7b9441fc3e1ad87821b2eb9954187e7cd1819f1d1475697e38c4c96d3b8134ff"],
  ["extension/content-runtime.js", "60d2caf0643d4e44be1213a30dfecb39d89d287c96346f494df378584e73e8cf"],
  ["extension/content-script.js", "6c5d4141a4ee7356be314ad060408a68e49246365852099a18533557ae98a350"],
  ["extension/manifest.json", "ce09af3cdf94626fbe41fc1ce9631743703c60d0277698864dbe5c448e8ebbb0"],
  ["extension/service-worker.js", "d08ae59ff3411a16226e5972ce0d496445bed6333a6a1e3ab65bf53ee43280b6"],
  ["PookaKindStewartGeneralizedHostLauncher.exe", "b9ba643712e5a4557f94fc2f51e89fcdd5caa9d5fc4be284958f5da011c6505c"],
  ["PookaKindStewartGeneralizedHostLauncher.generated.cs", "23c2589a858b3aadf2e9823fd13ea3caf011192c10652cf4ae14e81d27cf6e32"],
  ["PookaKindStewartHandleResolver.exe", "3c2f97280746b02fdef040fbbee7790469bba6f66354808f4bb17442c2ae7802"],
  ["runtime.sha256", "5059a4fa67ab87ad0efa905e04060fe29ff144e3b027125299bf0d827e5d695e"],
].map(([relative_path, sha256]) => ({ relative_path, sha256 })));

const EXCLUSIONS = deepFreeze([
  "CHROME_FORCE_INSTALL_OR_UPDATE_POLICY",
  "GENERIC_INPUT",
  "PERSISTENT_CHROME_PROFILE",
  "POLLING_OR_RETRY",
  "PUSH_MERGE_OR_DEPLOY",
  "SECOND_PROVIDER",
  "SECRET_OUTPUT",
  "SERVICE_SCHEDULER_STARTUP_WATCHER_OR_RECURRENCE",
]);

const INPUT_FIELDS = ["activation_record", "disney_transaction_sha256", "operator_authority", "package", "recovery_record", "requested_mode", "schema"];
const ACTIVATION_PREFLIGHT_FIELDS = ["activation_record", "operator_authority", "package", "schema"];
const TRANSACTION_FIELDS = ["activation", "activation_record", "activation_record_sha256", "claim_sha256", "disney_transaction_sha256", "max_provider_transactions", "operator_authority", "ordered_steps", "package", "password_conversion_claimed", "recurring_operation_created", "recovery_evidence", "recovery_record", "requested_mode", "schema", "state", "transaction_sha256"];
const PACKAGE_FIELDS = ["extension_bundle_sha256", "extension_id", "file_count", "files", "launcher_sha256", "native_host_name", "native_manifest_sha256", "package_sha256", "resolver_sha256", "runtime_manifest_sha256", "schema"];
const AUTHORITY_FIELDS = ["public_key_pem", "public_key_sha256", "schema"];
const AUTHORITY_PAYLOAD_FIELDS = ["account_ref_sha256", "action", "activation_mode", "allowed_operation", "allowed_provider", "approval_log_entry_sha256", "approval_phrase_sha256", "approved_at", "complete_rollback_required", "decision", "exclusions_sha256", "expires_at", "extension_id", "gate_artifact_sha256", "issued_at", "machine", "max_provider_transactions", "native_host_name", "operation_id_sha256", "package_sha256", "provider_id", "recurrence", "registry_key", "schema", "source_release_sha256", "synthetic_required"];
const RECOVERY_PAYLOAD_FIELDS = ["account_ref_sha256", "claim_sha256", "decision", "extension_state", "machine", "observed_at", "operation_id_sha256", "package_sha256", "profile_state", "provider_id", "reason", "registry_state", "schema", "session_process_count", "unrelated_state_touched"];
const BASELINE_FIELDS = ["approval_log_entry_sha256", "extension_state", "extension_trust_state", "gate_artifact_sha256", "imported_cookie_count", "imported_disney_session_state", "imported_storage_state", "native_manifest_sha256", "observed_at", "package_sha256", "package_state", "policy_state", "profile_owner_process_count", "profile_state", "registry_state", "scheduler_state", "schema", "service_state", "startup_state", "watcher_state"];
const SYNTHETIC_FIELDS = ["extension_id", "foreground_changed", "input_devices_touched", "native_host_name", "package_sha256", "provider_contacted", "schema", "secret_material_used", "state"];
const DISNEY_FIELDS = ["exact_nonduplicate_vault_reconciliation", "fixed", "fresh_independent_sign_in", "password_conversion", "provider", "provider_accepted", "schema", "secret_material_returned", "state", "transaction_sha256"];
const RESIDUAL_FIELDS = ["extension_state", "generalized_process_count", "imported_cookie_count", "imported_disney_session_state", "imported_storage_state", "policy_state", "profile_owner_process_count", "profile_state", "registry_state", "scheduler_state", "schema", "service_state", "startup_state", "unrelated_state_touched", "watcher_state"];
const TERMINAL_RECEIPT_FIELDS = ["disney_state", "failure", "password_conversion", "receipt_sha256", "recurring_operation_created", "residual_state", "rollback_state", "schema", "secret_material_returned", "state", "synthetic_state", "transaction_sha256"];
const FORBIDDEN_KEYS = new Set(["credential", "email", "identity", "material", "otp", "passcode", "password", "pin", "secret", "token", "username", "value"]);

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function digest(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function snapshot(value, code) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object") fail(code);
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype || Object.getOwnPropertySymbols(value).length !== 0) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).filter((key) => key !== "length");
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
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}

function rejectPrivate(value) {
  if (typeof value === "string") {
    if (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value)) fail("STEWART_DISNEY_SESSION_SECRET_SHAPED_DATA_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) return value.forEach(rejectPrivate);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) fail("STEWART_DISNEY_SESSION_PRIVATE_FIELD_FORBIDDEN");
    rejectPrivate(child);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validatePackage(value) {
  exact(value, PACKAGE_FIELDS, "STEWART_DISNEY_SESSION_PACKAGE_FIELDS_INVALID");
  if (value.schema !== "pookakind.stewart-generalized-installable-package-observation/v1"
    || value.package_sha256 !== PACKAGE_SHA256 || value.file_count !== PACKAGE_FILES.length
    || value.extension_id !== EXTENSION_ID || value.native_host_name !== NATIVE_HOST_NAME
    || value.launcher_sha256 !== PACKAGE_FILES[5].sha256 || value.resolver_sha256 !== PACKAGE_FILES[7].sha256
    || value.runtime_manifest_sha256 !== PACKAGE_FILES[8].sha256 || value.native_manifest_sha256 !== PACKAGE_FILES[0].sha256
    || value.extension_bundle_sha256 !== "cc78466b24c3edfbddb8c472c19a7d0b374b85dc71a4fa645ef7269cd78feecb") fail("STEWART_DISNEY_SESSION_PACKAGE_MISMATCH");
  if (canonicalJson(value.files) !== canonicalJson(PACKAGE_FILES)) fail("STEWART_DISNEY_SESSION_PACKAGE_FILE_DRIFT");
}

function validateOperatorAuthority(value) {
  exact(value, AUTHORITY_FIELDS, "STEWART_DISNEY_SESSION_OPERATOR_AUTHORITY_INVALID");
  if (value.schema !== "pookakind.operator-authority-pin/v1" || !HASH.test(value.public_key_sha256 ?? "")) fail("STEWART_DISNEY_SESSION_OPERATOR_AUTHORITY_INVALID");
  let actual;
  try { actual = keyFingerprint(value.public_key_pem); } catch { fail("STEWART_DISNEY_SESSION_OPERATOR_AUTHORITY_INVALID"); }
  if (actual !== value.public_key_sha256) fail("STEWART_DISNEY_SESSION_OPERATOR_AUTHORITY_INVALID");
}

function validateActivationRecord(operatorAuthority, record, now) {
  let payload;
  try { payload = verifyDurableRecord(operatorAuthority.public_key_pem, record, { issuer: ISSUER, audience: AUDIENCE }); }
  catch { fail("STEWART_DISNEY_SESSION_ACTIVATION_AUTHORITY_INVALID"); }
  exact(payload, AUTHORITY_PAYLOAD_FIELDS, "STEWART_DISNEY_SESSION_ACTIVATION_SCOPE_INVALID");
  const issued = Date.parse(payload.issued_at);
  const expires = Date.parse(payload.expires_at);
  if (payload.schema !== "pookakind.stewart-generalized-disney-session-activation-authority/v1"
    || payload.decision !== "APPROVED" || payload.machine !== "DOSS" || payload.package_sha256 !== PACKAGE_SHA256
    || payload.source_release_sha256 !== SOURCE_RELEASE_SHA256
    || payload.gate_artifact_sha256 !== GATE_ARTIFACT_SHA256 || payload.approval_phrase_sha256 !== APPROVAL_PHRASE_SHA256
    || !HASH.test(payload.approval_log_entry_sha256 ?? "") || !Number.isFinite(Date.parse(payload.approved_at))
    || payload.extension_id !== EXTENSION_ID || payload.native_host_name !== NATIVE_HOST_NAME || payload.registry_key !== REGISTRY_KEY
    || payload.activation_mode !== "ONE_SHOT_SESSION_ONLY" || payload.synthetic_required !== true
    || payload.allowed_provider !== "Disney MyDisney" || payload.provider_id !== "DISNEY_MYDISNEY" || payload.allowed_operation !== "FULL_PASSWORD_CONVERSION"
    || payload.action !== "SYNTHETIC_THEN_ONE_DISNEY_FULL_PASSWORD_CONVERSION"
    || !HASH.test(payload.operation_id_sha256 ?? "") || !HASH.test(payload.account_ref_sha256 ?? "")
    || payload.recurrence !== false || !Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued
    || expires - issued > 300_000 || issued > now + 30_000 || expires < now
    || payload.max_provider_transactions !== 1 || payload.complete_rollback_required !== true
    || payload.exclusions_sha256 !== digest(EXCLUSIONS)) fail("STEWART_DISNEY_SESSION_ACTIVATION_SCOPE_INVALID");
  return payload;
}

function claimIdentity(activation) {
  return digest({
    operation_id_sha256: activation.operation_id_sha256,
    package_sha256: activation.package_sha256,
    source_release_sha256: activation.source_release_sha256,
    machine: activation.machine,
    extension_id: activation.extension_id,
    native_host_name: activation.native_host_name,
    provider_id: activation.provider_id,
    account_ref_sha256: activation.account_ref_sha256,
    action: activation.action,
    expires_at: activation.expires_at,
    recurrence: activation.recurrence,
  });
}

function validateRecoveryRecord(operatorAuthority, record, activation, claimSha256) {
  if (record === null) return null;
  let payload;
  try {
    payload = verifyDurableRecord(operatorAuthority.public_key_pem, record, {
      issuer: ISSUER,
      audience: `stewart-generalized-disney-session-recovery/v1:${activation.operation_id_sha256}:${claimSha256}`,
    });
  } catch { fail("STEWART_DISNEY_SESSION_RECOVERY_EVIDENCE_INVALID"); }
  exact(payload, RECOVERY_PAYLOAD_FIELDS, "STEWART_DISNEY_SESSION_RECOVERY_EVIDENCE_INVALID");
  if (payload.schema !== "pookakind.stewart-generalized-disney-session-recovery-evidence/v1"
    || payload.decision !== "RECOVER_STRANDED_CLAIM" || payload.operation_id_sha256 !== activation.operation_id_sha256
    || payload.claim_sha256 !== claimSha256 || payload.package_sha256 !== PACKAGE_SHA256 || payload.machine !== "DOSS"
    || payload.provider_id !== "DISNEY_MYDISNEY" || payload.account_ref_sha256 !== activation.account_ref_sha256
    || payload.reason !== "PROVED_NO_LIVE_SESSION_AND_CLEAN_ABSENT"
    || payload.registry_state !== "ABSENT" || payload.extension_state !== "ABSENT" || payload.profile_state !== "NOT_CREATED"
    || payload.session_process_count !== 0 || payload.unrelated_state_touched !== false
    || !Number.isFinite(Date.parse(payload.observed_at))) fail("STEWART_DISNEY_SESSION_RECOVERY_EVIDENCE_INVALID");
  return payload;
}

function validateBaseline(value, transaction) {
  exact(value, BASELINE_FIELDS, "STEWART_DISNEY_SESSION_PREFLIGHT_INVALID");
  if (value.schema !== "pookakind.stewart-generalized-session-preflight/v1" || !Number.isFinite(Date.parse(value.observed_at))
    || value.package_state !== "EXACT_HASH_VERIFIED" || value.package_sha256 !== PACKAGE_SHA256
    || value.native_manifest_sha256 !== transaction.package.native_manifest_sha256
    || value.gate_artifact_sha256 !== GATE_ARTIFACT_SHA256
    || value.approval_log_entry_sha256 !== transaction.activation.approval_log_entry_sha256
    || value.registry_state !== "ABSENT" || value.policy_state !== "ABSENT" || value.service_state !== "ABSENT"
    || value.scheduler_state !== "ABSENT" || value.startup_state !== "ABSENT" || value.watcher_state !== "ABSENT"
    || value.extension_state !== "ABSENT" || value.extension_trust_state !== "NOT_LOADED" || value.profile_state !== "NOT_CREATED"
    || value.profile_owner_process_count !== 0 || value.imported_disney_session_state !== "ABSENT"
    || value.imported_cookie_count !== 0 || value.imported_storage_state !== "ABSENT") fail("STEWART_DISNEY_SESSION_PREFLIGHT_NOT_CLEAN");
}

function validateSynthetic(value) {
  exact(value, SYNTHETIC_FIELDS, "STEWART_DISNEY_SESSION_SYNTHETIC_RECEIPT_INVALID");
  if (value.schema !== "pookakind.stewart-generalized-session-synthetic-receipt/v1" || value.state !== "PASS"
    || value.package_sha256 !== PACKAGE_SHA256 || value.extension_id !== EXTENSION_ID || value.native_host_name !== NATIVE_HOST_NAME
    || value.provider_contacted !== false || value.secret_material_used !== false || value.input_devices_touched !== false
    || value.foreground_changed !== false) fail("STEWART_DISNEY_SESSION_SYNTHETIC_NOT_TERMINAL_PASS");
}

function validateDisney(value, transactionSha256) {
  exact(value, DISNEY_FIELDS, "STEWART_DISNEY_SESSION_PROVIDER_RECEIPT_INVALID");
  if (value.schema !== "pookakind.disney-mydisney-password-conversion/v1" || value.provider !== "Disney MyDisney"
    || value.transaction_sha256 !== transactionSha256 || value.state !== "CONVERSION_VERIFIED"
    || value.provider_accepted !== true || value.fresh_independent_sign_in !== true
    || value.exact_nonduplicate_vault_reconciliation !== true || value.fixed !== true
    || value.password_conversion !== true || value.secret_material_returned !== false) fail("STEWART_DISNEY_SESSION_PROVIDER_RECEIPT_INVALID");
  return true;
}

function validateResidual(value) {
  exact(value, RESIDUAL_FIELDS, "STEWART_DISNEY_SESSION_RESIDUAL_RECEIPT_INVALID");
  if (value.schema !== "pookakind.stewart-generalized-session-residual-state/v1" || value.registry_state !== "ABSENT"
    || value.policy_state !== "ABSENT" || value.service_state !== "ABSENT" || value.scheduler_state !== "ABSENT"
    || value.startup_state !== "ABSENT" || value.watcher_state !== "ABSENT" || value.extension_state !== "ABSENT"
    || value.profile_state !== "NOT_CREATED" || value.profile_owner_process_count !== 0 || value.generalized_process_count !== 0
    || value.imported_disney_session_state !== "ABSENT" || value.imported_cookie_count !== 0 || value.imported_storage_state !== "ABSENT"
    || value.unrelated_state_touched !== false) fail("STEWART_DISNEY_SESSION_ROLLBACK_INCOMPLETE");
}

function validateDependencies(dependencies) {
  const names = ["now", "claimSession", "appendTerminalReceipt", "inspectPreflight", "registerNativeHost", "launchEphemeralChrome", "runSyntheticProof", "runDisneyTransaction", "terminateSession", "removeRegistry", "removeEphemeralProfile", "inspectResidualState"];
  if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)
    || names.some((name) => typeof dependencies[name] !== "function")) fail("STEWART_DISNEY_SESSION_DEPENDENCY_INVALID");
}

function terminalReceipt(body) {
  const receipt = { ...body, receipt_sha256: digest(body) };
  return deepFreeze(receipt);
}

function validateTerminalReceipt(value, transactionSha256) {
  exact(value, TERMINAL_RECEIPT_FIELDS, "STEWART_DISNEY_SESSION_TERMINAL_RECEIPT_INVALID");
  const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "receipt_sha256"));
  if (value.schema !== "pookakind.stewart-generalized-disney-session-receipt/v1"
    || value.transaction_sha256 !== transactionSha256 || !HASH.test(value.receipt_sha256 ?? "")
    || digest(body) !== value.receipt_sha256 || !["SESSION_COMPLETE_ROLLED_BACK", "FAILED_ROLLED_BACK", "FAILED_RESIDUAL_STATE"].includes(value.state)
    || (value.failure !== null && !/^[A-Z0-9_]{3,120}$/.test(value.failure))
    || value.password_conversion !== (value.disney_state === "CONVERSION_VERIFIED")
    || value.secret_material_returned !== false || value.recurring_operation_created !== false) fail("STEWART_DISNEY_SESSION_TERMINAL_RECEIPT_INVALID");
}

function safeFailure(error) {
  const value = String(error?.code || error?.message || "STEWART_DISNEY_SESSION_FAILED_CLOSED");
  return /^[A-Z0-9_]{3,120}$/.test(value) ? value : "STEWART_DISNEY_SESSION_FAILED_CLOSED";
}

function writeExclusive(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const descriptor = openSync(path, "wx", 0o600);
  try {
    writeFileSync(descriptor, canonicalJson(value), "utf8");
    fsyncSync(descriptor);
  } finally { closeSync(descriptor); }
}

function readPlainJson(path, code) {
  let value;
  try { value = JSON.parse(readFileSync(path, "utf8")); } catch { fail(code); }
  const snapped = snapshot(value, code);
  rejectPrivate(snapped);
  return snapped;
}

export function createStewartGeneralizedDisneySessionDurableStore({ root }) {
  if (typeof root !== "string" || root.length < 4) fail("STEWART_DISNEY_SESSION_STORE_ROOT_INVALID");
  const candidate = resolve(root);
  mkdirSync(candidate, { recursive: true, mode: 0o700 });
  const provedRoot = realpathSync(candidate);
  if (!statSync(provedRoot).isDirectory()) fail("STEWART_DISNEY_SESSION_STORE_ROOT_INVALID");
  const within = (claimSha256) => {
    if (!HASH.test(claimSha256 ?? "")) fail("STEWART_DISNEY_SESSION_STORE_CLAIM_INVALID");
    const path = resolve(provedRoot, claimSha256);
    if (!path.startsWith(`${provedRoot}${sep}`)) fail("STEWART_DISNEY_SESSION_STORE_PATH_ESCAPE");
    return path;
  };
  return deepFreeze({
    async claimSession(rawClaim) {
      const claim = snapshot(rawClaim, "STEWART_DISNEY_SESSION_STORE_CLAIM_NOT_PLAIN");
      rejectPrivate(claim);
      const claimRoot = within(claim.claim_sha256);
      const claimPath = join(claimRoot, "claim.json");
      const terminalPath = join(claimRoot, "terminal.json");
      if (existsSync(terminalPath)) return { state: "TERMINAL_REPLAY", claim_sha256: claim.claim_sha256, terminal_receipt: readPlainJson(terminalPath, "STEWART_DISNEY_SESSION_STORE_TERMINAL_INVALID") };
      if (!existsSync(claimPath)) {
        try { writeExclusive(claimPath, claim); return { state: "CLAIMED", claim_sha256: claim.claim_sha256 }; }
        catch (error) { if (error?.code !== "EEXIST") throw error; }
      }
      const original = readPlainJson(claimPath, "STEWART_DISNEY_SESSION_STORE_CLAIM_INVALID");
      if (original.claim_sha256 !== claim.claim_sha256 || original.transaction_sha256 !== claim.transaction_sha256) fail("STEWART_DISNEY_SESSION_STORE_CLAIM_CONFLICT");
      if (claim.recovery_evidence === null) return { state: "STRANDED", claim_sha256: claim.claim_sha256 };
      const recoveryPath = join(claimRoot, "recovery.used.json");
      if (existsSync(recoveryPath)) return { state: "STRANDED", claim_sha256: claim.claim_sha256 };
      try { writeExclusive(recoveryPath, claim.recovery_evidence); }
      catch (error) { if (error?.code === "EEXIST") return { state: "STRANDED", claim_sha256: claim.claim_sha256 }; throw error; }
      return { state: "CLAIMED_WITH_RECOVERY", claim_sha256: claim.claim_sha256 };
    },
    async appendTerminalReceipt({ claim_sha256, receipt }) {
      const claimRoot = within(claim_sha256);
      const claimPath = join(claimRoot, "claim.json");
      const terminalPath = join(claimRoot, "terminal.json");
      if (!existsSync(claimPath)) fail("STEWART_DISNEY_SESSION_STORE_CLAIM_MISSING");
      const terminal = snapshot(receipt, "STEWART_DISNEY_SESSION_STORE_TERMINAL_NOT_PLAIN");
      rejectPrivate(terminal);
      if (existsSync(terminalPath)) {
        const existing = readPlainJson(terminalPath, "STEWART_DISNEY_SESSION_STORE_TERMINAL_INVALID");
        if (canonicalJson(existing) !== canonicalJson(terminal)) return { state: "CONFLICT", receipt_sha256: existing.receipt_sha256 ?? null };
        return { state: "EXACT_REPLAY", receipt_sha256: existing.receipt_sha256 };
      }
      try { writeExclusive(terminalPath, terminal); return { state: "APPENDED", receipt_sha256: terminal.receipt_sha256 }; }
      catch (error) {
        if (error?.code !== "EEXIST") throw error;
        const existing = readPlainJson(terminalPath, "STEWART_DISNEY_SESSION_STORE_TERMINAL_INVALID");
        if (canonicalJson(existing) !== canonicalJson(terminal)) return { state: "CONFLICT", receipt_sha256: existing.receipt_sha256 ?? null };
        return { state: "EXACT_REPLAY", receipt_sha256: existing.receipt_sha256 };
      }
    },
  });
}

export const STEWART_GENERALIZED_DISNEY_SESSION_PINS = deepFreeze({
  schema: "pookakind.stewart-generalized-disney-session-pins/v1",
  package_sha256: PACKAGE_SHA256,
  source_release_sha256: SOURCE_RELEASE_SHA256,
  package_files: PACKAGE_FILES,
  extension_id: EXTENSION_ID,
  native_host_name: NATIVE_HOST_NAME,
  registry_key: REGISTRY_KEY,
  gate_artifact_sha256: GATE_ARTIFACT_SHA256,
  approval_phrase_sha256: APPROVAL_PHRASE_SHA256,
  activation_issuer: ISSUER,
  activation_audience: AUDIENCE,
  exclusions: EXCLUSIONS,
});

export function verifyStewartGeneralizedDisneySessionActivation(rawInput, now = Date.now()) {
  const input = snapshot(rawInput, "STEWART_DISNEY_SESSION_ACTIVATION_PREFLIGHT_NOT_PLAIN");
  rejectPrivate(input);
  exact(input, ACTIVATION_PREFLIGHT_FIELDS, "STEWART_DISNEY_SESSION_ACTIVATION_PREFLIGHT_FIELDS_INVALID");
  if (input.schema !== "pookakind.stewart-generalized-disney-session-activation-preflight-input/v1") fail("STEWART_DISNEY_SESSION_ACTIVATION_PREFLIGHT_INVALID");
  validatePackage(input.package);
  validateOperatorAuthority(input.operator_authority);
  const activation = validateActivationRecord(input.operator_authority, input.activation_record, now);
  const body = {
    schema: "pookakind.stewart-generalized-disney-session-activation-preflight-receipt/v1",
    state: "ACTIVATION_AUTHORITY_VERIFIED_NOT_EXECUTED",
    package_sha256: activation.package_sha256,
    source_release_sha256: activation.source_release_sha256,
    approval_log_entry_sha256: activation.approval_log_entry_sha256,
    operation_id_sha256: activation.operation_id_sha256,
    account_ref_sha256: activation.account_ref_sha256,
    activation_record_sha256: digest(input.activation_record),
    claim_sha256: claimIdentity(activation),
    expires_at: activation.expires_at,
    provider_contacted: false,
    secret_material_used: false,
    recurring_operation_created: false,
  };
  return deepFreeze({ ...body, receipt_sha256: digest(body) });
}

export function compileStewartGeneralizedDisneySession(rawInput, now = Date.now()) {
  const input = snapshot(rawInput, "STEWART_DISNEY_SESSION_INPUT_NOT_PLAIN");
  rejectPrivate(input);
  exact(input, INPUT_FIELDS, "STEWART_DISNEY_SESSION_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.stewart-generalized-disney-session-input/v1"
    || !["DRY_RUN", "SYNTHETIC_ONLY", "LIVE_ONE_DISNEY"].includes(input.requested_mode)) fail("STEWART_DISNEY_SESSION_INPUT_INVALID");
  validatePackage(input.package);
  validateOperatorAuthority(input.operator_authority);
  const activation = validateActivationRecord(input.operator_authority, input.activation_record, now);
  const claimSha256 = claimIdentity(activation);
  const recovery = validateRecoveryRecord(input.operator_authority, input.recovery_record, activation, claimSha256);
  if (input.requested_mode === "LIVE_ONE_DISNEY") {
    if (!HASH.test(input.disney_transaction_sha256 ?? "")) fail("STEWART_DISNEY_SESSION_DISNEY_TRANSACTION_REQUIRED");
  } else if (input.disney_transaction_sha256 !== null) fail("STEWART_DISNEY_SESSION_DISNEY_TRANSACTION_FORBIDDEN");
  const body = {
    schema: "pookakind.stewart-generalized-disney-session-transaction/v1",
    state: "PREPARED_NOT_ACTIVATED",
    requested_mode: input.requested_mode,
    package: input.package,
    activation,
    operator_authority: input.operator_authority,
    activation_record: input.activation_record,
    activation_record_sha256: digest(input.activation_record),
    claim_sha256: claimSha256,
    recovery_evidence: recovery,
    recovery_record: input.recovery_record,
    disney_transaction_sha256: input.disney_transaction_sha256,
    ordered_steps: [
      "PREFLIGHT_CLEAN_ABSENT_AND_EXACT_PINS",
      "CONSUME_ONE_SESSION_CLAIM",
      "REGISTER_EXACT_HKCU_NATIVE_HOST",
      "LAUNCH_ONE_EPHEMERAL_FIXED_EXTENSION_CHROME",
      "REQUIRE_TERMINAL_SYNTHETIC_PASS",
      "OPTIONALLY_RUN_ONE_DISNEY_TRANSACTION",
      "TERMINATE_EXACT_SESSION",
      "REMOVE_EXACT_REGISTRY_TARGET",
      "REMOVE_EXACT_EPHEMERAL_PROFILE",
      "VERIFY_CLEAN_ABSENT_RESIDUAL_STATE",
    ],
    max_provider_transactions: input.requested_mode === "LIVE_ONE_DISNEY" ? 1 : 0,
    password_conversion_claimed: false,
    recurring_operation_created: false,
  };
  return deepFreeze({ ...body, transaction_sha256: digest(body) });
}

export async function runStewartGeneralizedDisneySession({ transaction: rawTransaction, dependencies }) {
  const transaction = snapshot(rawTransaction, "STEWART_DISNEY_SESSION_TRANSACTION_NOT_PLAIN");
  rejectPrivate(transaction);
  validateDependencies(dependencies);
  exact(transaction, TRANSACTION_FIELDS, "STEWART_DISNEY_SESSION_TRANSACTION_INVALID");
  if (transaction.schema !== "pookakind.stewart-generalized-disney-session-transaction/v1"
    || transaction.state !== "PREPARED_NOT_ACTIVATED" || !HASH.test(transaction.transaction_sha256 ?? "")) fail("STEWART_DISNEY_SESSION_TRANSACTION_INVALID");
  const transactionBody = Object.fromEntries(Object.entries(transaction).filter(([key]) => key !== "transaction_sha256"));
  if (digest(transactionBody) !== transaction.transaction_sha256) fail("STEWART_DISNEY_SESSION_TRANSACTION_INVALID");
  if (!["DRY_RUN", "SYNTHETIC_ONLY", "LIVE_ONE_DISNEY"].includes(transaction.requested_mode)
    || transaction.max_provider_transactions !== (transaction.requested_mode === "LIVE_ONE_DISNEY" ? 1 : 0)
    || transaction.password_conversion_claimed !== false || transaction.recurring_operation_created !== false
    || (transaction.requested_mode === "LIVE_ONE_DISNEY" ? !HASH.test(transaction.disney_transaction_sha256 ?? "") : transaction.disney_transaction_sha256 !== null)) fail("STEWART_DISNEY_SESSION_TRANSACTION_INVALID");
  validatePackage(transaction.package);
  validateOperatorAuthority(transaction.operator_authority);
  const activation = validateActivationRecord(transaction.operator_authority, transaction.activation_record, dependencies.now());
  if (canonicalJson(activation) !== canonicalJson(transaction.activation) || digest(transaction.activation_record) !== transaction.activation_record_sha256
    || claimIdentity(activation) !== transaction.claim_sha256) fail("STEWART_DISNEY_SESSION_TRANSACTION_INVALID");
  const recovery = validateRecoveryRecord(transaction.operator_authority, transaction.recovery_record, activation, transaction.claim_sha256);
  if (canonicalJson(recovery) !== canonicalJson(transaction.recovery_evidence)) fail("STEWART_DISNEY_SESSION_TRANSACTION_INVALID");

  const preflight = snapshot(await dependencies.inspectPreflight(deepFreeze({ package: transaction.package, activation: transaction.activation })), "STEWART_DISNEY_SESSION_PREFLIGHT_NOT_PLAIN");
  rejectPrivate(preflight);
  validateBaseline(preflight, transaction);
  if (transaction.requested_mode === "DRY_RUN") return deepFreeze({
    schema: "pookakind.stewart-generalized-disney-session-receipt/v1", state: "DRY_RUN_READY",
    transaction_sha256: transaction.transaction_sha256, synthetic_state: "NOT_RUN", disney_state: "NOT_RUN",
    rollback_state: "NOT_REQUIRED", residual_state: "CLEAN_ABSENT", password_conversion: false,
    secret_material_returned: false, recurring_operation_created: false,
  });

  const claim = snapshot(await dependencies.claimSession(deepFreeze({
    claim_sha256: transaction.claim_sha256,
    transaction_sha256: transaction.transaction_sha256,
    operation_id_sha256: transaction.activation.operation_id_sha256,
    package_sha256: PACKAGE_SHA256,
    machine: "DOSS",
    extension_id: EXTENSION_ID,
    native_host_name: NATIVE_HOST_NAME,
    provider_id: "DISNEY_MYDISNEY",
    account_ref_sha256: transaction.activation.account_ref_sha256,
    action: transaction.activation.action,
    expires_at: transaction.activation.expires_at,
    recurrence: false,
    recovery_evidence: transaction.recovery_evidence,
  })), "STEWART_DISNEY_SESSION_CLAIM_RECEIPT_NOT_PLAIN");
  rejectPrivate(claim);
  if (claim?.claim_sha256 !== transaction.claim_sha256) fail("STEWART_DISNEY_SESSION_CLAIM_RECEIPT_INVALID");
  if (claim.state === "TERMINAL_REPLAY") {
    const replay = snapshot(claim.terminal_receipt, "STEWART_DISNEY_SESSION_TERMINAL_RECEIPT_NOT_PLAIN");
    rejectPrivate(replay);
    validateTerminalReceipt(replay, transaction.transaction_sha256);
    return deepFreeze(replay);
  }
  if (claim.state === "STRANDED") return deepFreeze({
    schema: "pookakind.stewart-generalized-disney-session-claim-blocker/v1",
    state: "CRASH_STRANDED_CLAIM",
    claim_sha256: transaction.claim_sha256,
    transaction_sha256: transaction.transaction_sha256,
    recovery_evidence_required: true,
    password_conversion: false,
    secret_material_returned: false,
    recurring_operation_created: false,
  });
  if (!["CLAIMED", "CLAIMED_WITH_RECOVERY"].includes(claim.state)
    || (claim.state === "CLAIMED_WITH_RECOVERY" && transaction.recovery_evidence === null)) fail("STEWART_DISNEY_SESSION_CLAIM_RECEIPT_INVALID");

  let session = null;
  let syntheticState = "NOT_RUN";
  let disneyState = "NOT_RUN";
  let passwordConversion = false;
  let operationFailure = null;
  const rollback = [];
  try {
    const registration = await dependencies.registerNativeHost(deepFreeze({ registry_key: REGISTRY_KEY, native_host_name: NATIVE_HOST_NAME, native_manifest_sha256: transaction.package.native_manifest_sha256 }));
    if (registration?.state !== "EXACT_HKCU_HOST_REGISTERED" || registration?.registry_key !== REGISTRY_KEY
      || registration?.native_manifest_sha256 !== transaction.package.native_manifest_sha256
      || registration?.immediate_readback_state !== "EXACT_MATCH" || registration?.unrelated_state_touched !== false) fail("STEWART_DISNEY_SESSION_REGISTRATION_RECEIPT_INVALID");
    session = await dependencies.launchEphemeralChrome(deepFreeze({ package_sha256: PACKAGE_SHA256, extension_id: EXTENSION_ID, persistent_profile: false, force_install_policy: false }));
    if (session?.state !== "EXACT_EPHEMERAL_SESSION_ACTIVE" || !HASH.test(session?.session_ref_sha256 ?? "")
      || session?.extension_id !== EXTENSION_ID || session?.persistent_profile !== false || session?.imported_cookie_count !== 0
      || session?.imported_storage_state !== "ABSENT" || session?.imported_disney_session_state !== "ABSENT" || session?.foreground_changed !== false
      || session?.input_devices_touched !== false) fail("STEWART_DISNEY_SESSION_LAUNCH_RECEIPT_INVALID");
    const synthetic = snapshot(await dependencies.runSyntheticProof(deepFreeze({ session_ref_sha256: session.session_ref_sha256, package_sha256: PACKAGE_SHA256, extension_id: EXTENSION_ID, native_host_name: NATIVE_HOST_NAME })), "STEWART_DISNEY_SESSION_SYNTHETIC_RECEIPT_NOT_PLAIN");
    rejectPrivate(synthetic);
    validateSynthetic(synthetic);
    syntheticState = "PASS";
    if (transaction.requested_mode === "LIVE_ONE_DISNEY") {
      const disney = snapshot(await dependencies.runDisneyTransaction(deepFreeze({ session_ref_sha256: session.session_ref_sha256, transaction_sha256: transaction.disney_transaction_sha256 })), "STEWART_DISNEY_SESSION_PROVIDER_RECEIPT_NOT_PLAIN");
      rejectPrivate(disney);
      passwordConversion = validateDisney(disney, transaction.disney_transaction_sha256);
      disneyState = disney.state;
    }
  } catch (error) {
    operationFailure = safeFailure(error);
  } finally {
    for (const [name, action, argument] of [
      ["TERMINATE_EXACT_SESSION", dependencies.terminateSession, deepFreeze({ session_ref_sha256: session?.session_ref_sha256 ?? null })],
      ["REMOVE_EXACT_REGISTRY_TARGET", dependencies.removeRegistry, deepFreeze({ registry_key: REGISTRY_KEY, native_host_name: NATIVE_HOST_NAME })],
      ["REMOVE_EXACT_EPHEMERAL_PROFILE", dependencies.removeEphemeralProfile, deepFreeze({ session_ref_sha256: session?.session_ref_sha256 ?? null })],
    ]) {
      try {
        const result = await action(argument);
        rollback.push({ step: name, state: result?.state === "ROLLED_BACK_OR_ALREADY_ABSENT" && result?.unrelated_state_touched === false ? "PASS" : "FAIL" });
      } catch { rollback.push({ step: name, state: "FAIL" }); }
    }
  }

  let residual;
  try {
    residual = snapshot(await dependencies.inspectResidualState(), "STEWART_DISNEY_SESSION_RESIDUAL_RECEIPT_NOT_PLAIN");
    rejectPrivate(residual);
    validateResidual(residual);
  } catch (error) {
    const receipt = terminalReceipt({
      schema: "pookakind.stewart-generalized-disney-session-receipt/v1", state: "FAILED_RESIDUAL_STATE",
      transaction_sha256: transaction.transaction_sha256, failure: safeFailure(error), synthetic_state: syntheticState,
      disney_state: disneyState, rollback_state: rollback.every(({ state }) => state === "PASS") ? "ATTEMPTED" : "PARTIAL_FAILURE",
      residual_state: "NOT_CLEAN", password_conversion: passwordConversion, secret_material_returned: false, recurring_operation_created: false,
    });
    const appended = await dependencies.appendTerminalReceipt({ claim_sha256: transaction.claim_sha256, receipt });
    if (!appended || !["APPENDED", "EXACT_REPLAY"].includes(appended.state) || appended.receipt_sha256 !== receipt.receipt_sha256) fail("STEWART_DISNEY_SESSION_TERMINAL_APPEND_FAILED");
    return receipt;
  }
  const rollbackPassed = rollback.length === 3 && rollback.every(({ state }) => state === "PASS");
  const receipt = terminalReceipt({
    schema: "pookakind.stewart-generalized-disney-session-receipt/v1",
    state: operationFailure || !rollbackPassed ? "FAILED_ROLLED_BACK" : "SESSION_COMPLETE_ROLLED_BACK",
    transaction_sha256: transaction.transaction_sha256,
    failure: operationFailure,
    synthetic_state: syntheticState,
    disney_state: disneyState,
    rollback_state: rollbackPassed ? "VERIFIED" : "PARTIAL_FAILURE",
    residual_state: "CLEAN_ABSENT",
    password_conversion: passwordConversion,
    secret_material_returned: false,
    recurring_operation_created: false,
  });
  const appended = await dependencies.appendTerminalReceipt({ claim_sha256: transaction.claim_sha256, receipt });
  if (!appended || !["APPENDED", "EXACT_REPLAY"].includes(appended.state) || appended.receipt_sha256 !== receipt.receipt_sha256) fail("STEWART_DISNEY_SESSION_TERMINAL_APPEND_FAILED");
  return receipt;
}
