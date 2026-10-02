import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { containsHarveySecretShape, containsUnsafeHarveyControlCharacters } from "./secret-shape-screen.mjs";

const HASH = /^[a-f0-9]{64}$/;
const EXTENSION_ID = "dlkekkfjpgfghllndmdjffnfnpencdge";
const REGISTRY_KEY = "HKCU/Software/Google/Chrome/NativeMessagingHosts/com.werkles.pookakind.stewart_generalized/(Default)";

export const STEWART_GENERALIZED_SESSION_RELEASE = deepFreeze({
  schema: "pookakind.stewart-generalized-session-release/v1",
  source_files: [
    ["scripts/foreman/Build-PookaKindStewartGeneralizedPackage.ps1", "ddeffac567852198b8bfc9f85602870d17c27023261a8a23f8997c9871f1544a"],
    ["scripts/foreman/native/PookaKindCredentialStewardHostLauncher.cs", "acbbe7a85b48dab4eb9a124eb3a3dd05d4c0c0ee2c5610a14cd395b267f858f0"],
    ["scripts/foreman/native/PookaKindStewartHandleResolver.cs", "0d457f9b3d9fcca956ce985093fceb6b578573deaebc2f80c1e747ee62390f43"],
    ["scripts/foreman/stewart-generalized-native-host.template.json", "12b18e0de2be15650f1390477182d670b824f8aaed429b6ce425b4ea333b490f"],
    ["scripts/foreman/stewart-generalized-native-host.mjs", "f8ec89d5ed4bd03102788d85f37e2369cf90c31c2a79dc26592e1fa19e4817ca"],
    ["lib/harvey/stewart-generalized-native-host.mjs", "e07f6e6ebf4af81aad90c5d7fe8fb2771a7db19d13c37eab5dfcae983efe929f"],
    ["lib/harvey/stewart-generalized-extension-bridge.mjs", "8e589f77e06b487d1c77d5c81ff9cce9cf0e42894741336f123cb433937f0e34"],
    ["lib/harvey/stewart-background-credential-operation.mjs", "334cc7cf1c3facd5eab8a5ef82a446f0aea54887fffaa6fdb0e9ec1a41059a92"],
    ["lib/harvey/station-crypto-core.mjs", "32b74d57b72f89dec6e7b799e97564ca2a8e9cf0d6b1691886d3b70bf226d68b"],
    ["lib/harvey/secret-shape-screen.mjs", "9415f6b5e69fa2210fca533a19d0439951870d4d0476cbfc64244415861083be"],
    ["lib/harvey/disney-mydisney-email-otp-transaction.mjs", "0095bb6181e503cc71d94b87379e6d5ae70dedebb1361ada0ee2730fb9f7fdfc"],
    ["lib/harvey/disney-mydisney-full-conversion.mjs", "d03907d6e551593355f99c4912b5ae31e695c57be9fb3eb65352670648ecf481"],
    ["lib/harvey/private-inbox-email-otp-handle.mjs", "5847022e5256f6c7608f920f70daac52b72ce95ede38d74c2d3570f182d5dddd"],
    ["lib/harvey/private-inbox-email-otp-doss-adapter.mjs", "a1edee19923dd71ef17777015d3ac227a1adf87d51a933ed224267e21e3db59f"],
    ["lib/harvey/authenticated-inbox-identity-handle.mjs", "baa601aa5e91e22a46559283b8d041ea5207a74bfca83aebb6404a7fc1313932"],
    ["lib/harvey/authenticated-inbox-identity-dpapi-binding.mjs", "6e911ef20611a0859c178cc325678f906672a3a90f715ded71fb391caf09f097"],
    ["lib/harvey/onepassword-sdk-identity-handle-capability.mjs", "3508dffe70a122c5a5ae6a0fb9fceb0f9fef707e2e5bf6fa4cf260b8f066f68f"],
    ["lib/harvey/stewart-disney-live-surface-probe.mjs", "d0666243aa723acb10e935c6075e8d270fa36be0e9ba678f353a3463917819b9"],
    ["lib/harvey/stewart-generalized-playwright-provider-adapter.mjs", "df5686f7caa7ffde2d8bb32b9316fab46d08a61ac44aeeb3a30b5d6213a40523"],
    ["lib/harvey/disney-mydisney-doss-durable-dependencies.mjs", "4e1dac54ed205f7ea2bb4cf33550173958126cc76bdae796dbe5d6dd06771688"],
    ["lib/harvey/onepassword-sdk-service-account-capability.mjs", "830978820a4a53b12c2da2ef92c8a15e65abcf1cc0da331a7a73c9bb192f597d"],
    ["lib/harvey/onepassword-sdk-service-account-client.mjs", "b3cd39305143267e8ac8caaba57c8e23a0aa3338185fb37eafec739519ac9ac4"],
    ["lib/harvey/onepassword-sdk-field-preserving-adapter.mjs", "ec79467364c8681fa7385be971f02a5a0db56cbfc6e557c5a30142be6d58e421"],
    ["lib/harvey/vault-exact-one-credential-save-once.mjs", "9bfb1ef70da929e958d15252a72ffe828648dc02e4c844082401f2ebc6fabaa7"],
    ["lib/harvey/vault-exact-one-metadata-proposal.mjs", "5ed5af8571f331293b70e487ce5b8c344cdab966d537080ca14290ebc2b07ef4"],
    ["scripts/foreman/stewart-generalized-extension/manifest.json", "ce09af3cdf94626fbe41fc1ce9631743703c60d0277698864dbe5c448e8ebbb0"],
    ["scripts/foreman/stewart-generalized-extension/service-worker.js", "d08ae59ff3411a16226e5972ce0d496445bed6333a6a1e3ab65bf53ee43280b6"],
    ["scripts/foreman/stewart-generalized-extension/content-runtime.js", "60d2caf0643d4e44be1213a30dfecb39d89d287c96346f494df378584e73e8cf"],
    ["scripts/foreman/stewart-generalized-extension/content-script.js", "6c5d4141a4ee7356be314ad060408a68e49246365852099a18533557ae98a350"],
    ["scripts/foreman/harvey-tests/disney-mydisney-email-otp-transaction.test.mjs", "976be904884f4f0eb332aca06c17eb4e2ba01f51255c6cf78e07122934212e89"],
    ["scripts/foreman/harvey-tests/stewart-generalized-native-host.e2e.mjs", "a3714bb1030e9552e84b2125d23fa63276ca91fb9f5422653289d788e5df5b5b"],
    ["scripts/foreman/harvey-tests/stewart-generalized-package.test.mjs", "18cfa44ab781a62d205a27959691c10c0c7a148a92b6bd71572d5b998664fbd3"],
    ["lib/harvey/stewart-generalized-disney-session-runner.mjs", "3e2b2bbaa5baa3595499efe962d24cb411aca5bb703c27d9df60df751b14573a"],
    ["lib/harvey/stewart-generalized-doss-machine-hands.mjs", "fcc344a8a6635577989419abc5c345aa5d06b4b023186513aef39cb7c7313a3a"],
    ["lib/harvey/stewart-generalized-https-synthetic-fixture.mjs", "afa74e94a3598b2ac443e33f4c4e9a3ff8b06fcaab4cfcb60510e5e7c81e331f"],
    ["scripts/foreman/stewart-generalized-doss-machine-hands-runtime.mjs", "a2fb5e773f551c7cb89184340774bcbc72ee663e522da8cc9f5e6cd00c971ae7"],
    ["scripts/foreman/stewart-generalized-disney-doss-one-shot-runtime.mjs", "9d981d8da5d0b228d7617b3185b97f11b6ed8f07dbda77790f0cb9a525fc7a88"],
    ["scripts/foreman/harvey-tests/stewart-generalized-disney-session-runner.test.mjs", "90aee49bd72928121362c5735aa70a81ab82781aa0b7c38ac7f9259bba787cb2"],
    ["scripts/foreman/harvey-tests/stewart-generalized-doss-machine-hands.test.mjs", "97edd00f0f8166299e62b1b53c3c0793e41788da4da44764d22587e2e8440f40"],
    ["scripts/foreman/harvey-tests/disney-mydisney-full-conversion.test.mjs", "eef0e8f104f5d1d0b05f5beb1d27735454b70c06d501d7827160555b9c2b98d6"],
    ["scripts/foreman/harvey-tests/private-inbox-email-otp-doss-adapter.test.mjs", "7c1d91e74105e210082e6aa65700ed36bfb442f7d50ef732880f0f33dd63a647"],
    ["scripts/foreman/harvey-tests/stewart-generalized-playwright-provider-adapter.test.mjs", "59f056be30ce8ce41f9587a2c3e81c84d8734929db08df12b4a7bbeec4e3fd17"],
    ["scripts/foreman/harvey-tests/disney-mydisney-doss-durable-dependencies.test.mjs", "d5eef9b134bb8d5992ed604b73d9b0a1e92aba3628b0d8fe4456b058662c256f"],
    ["scripts/foreman/harvey-tests/stewart-generalized-disney-doss-one-shot-runtime.test.mjs", "2270895f1a8bb3178f971e101ccb2e2a761761f08795cd66c2780933d65e7b8b"],
    ["scripts/foreman/harvey-tests/authenticated-inbox-identity-handle.test.mjs", "5488379718fe60e9e5c59d7d3caa29c4a984f3c84d1777c4bcb3a4c249a0d264"],
    ["scripts/foreman/harvey-tests/authenticated-inbox-identity-dpapi-binding.test.mjs", "3fdcbcecbf8679150371ead50d91bb9dca23c4f8f4d5ece0076d88bc3de63937"],
    ["foreman/reviews/GATE-pookakind-stewart-disney-live-composition-v4-20260921.md", "3c4bda5d0329dcb575314941b48487656bf8d20a14b94f7c59c721dc76a2afb4"],
  ].map(([path, sha256]) => ({ path, sha256 })),
  sanitized_provider_receipts: [
    { path: "foreman/receipts/POOKAKIND_PASSWORD_NO_CURRENT_INSTALLED_EXECUTOR_20260822.json", sha256: "1520d8ccaa442b70073b39f74790ae7118273c35f2c316d081fd2d7f79cebcd8" },
    { path: "foreman/receipts/POOKAKIND_STEWART_GENERALIZED_OTP_STAGING_20260822.json", sha256: "2242ce93e89fe5faa8752ef091e9b6bcbab130bfe6aac76e991be79aa5be5244" },
  ],
});

const INPUT_FIELDS = ["current_state", "intended_state", "package", "requested_claim", "schema", "source_release"];
const PACKAGE_FIELDS = ["extension_bundle_sha256", "file_count", "launcher_sha256", "native_manifest_sha256", "package_sha256", "resolver_sha256", "runtime_manifest_sha256", "schema"];
const STATE_FIELDS = ["chrome_profile_state", "extension_id", "extension_state", "extension_trust_state", "native_manifest_sha256", "observed_at", "package_sha256", "package_state", "registry_manifest_sha256", "registry_state", "schema", "synthetic_proof_state"];
const INTENDED_FIELDS = ["activation_mode", "auto_start", "background_service", "extension_bundle_sha256", "extension_id", "machine", "max_operations", "native_manifest_sha256", "package_sha256", "persistent_chrome_profile", "recurring_operation", "registry_key", "rollback_required", "schema"];
const ACTIVATION_RECEIPT_FIELDS = ["extension_loaded", "live_callable_claimed", "operations_consumed", "package_sha256", "provider_contacted", "registry_written", "rollback_attempted", "schema", "secret_material_used", "session_process_terminated", "state", "synthetic_proof_passed", "transaction_sha256"];
const ROLLBACK_FIELDS = ["activation_receipt", "after_state", "schema", "transaction"];
const FORBIDDEN_KEYS = new Set(["credential", "email", "identity", "otp", "passcode", "password", "pin", "secret", "token", "username", "value"]);

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

function rejectSecrets(value) {
  if (typeof value === "string") {
    if (containsHarveySecretShape(value) || containsUnsafeHarveyControlCharacters(value)) fail("STEWART_SESSION_SECRET_SHAPED_DATA_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) return value.forEach(rejectSecrets);
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) fail("STEWART_SESSION_PRIVATE_FIELD_FORBIDDEN");
    rejectSecrets(child);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function validateRelease(value) {
  if (canonicalJson(value) !== canonicalJson(STEWART_GENERALIZED_SESSION_RELEASE)) fail("STEWART_SESSION_SOURCE_RELEASE_MISMATCH");
}

function validatePackage(value) {
  exact(value, PACKAGE_FIELDS, "STEWART_SESSION_PACKAGE_FIELDS_INVALID");
  if (value.schema !== "pookakind.stewart-generalized-package-observation/v1" || value.file_count !== 9) fail("STEWART_SESSION_PACKAGE_INVALID");
  for (const field of PACKAGE_FIELDS.filter((field) => field.endsWith("_sha256"))) if (!HASH.test(value[field] ?? "")) fail("STEWART_SESSION_PACKAGE_INVALID");
  const body = Object.fromEntries(PACKAGE_FIELDS.filter((field) => field !== "package_sha256").map((field) => [field, value[field]]));
  if (digest(body) !== value.package_sha256) fail("STEWART_SESSION_PACKAGE_DIGEST_MISMATCH");
}

function validateState(value, code) {
  exact(value, STATE_FIELDS, `${code}_FIELDS_INVALID`);
  if (value.schema !== "pookakind.stewart-generalized-session-state/v1" || !Number.isFinite(Date.parse(value.observed_at))) fail(`${code}_INVALID`);
  if (!["STAGED_HASH_VERIFIED", "ABSENT", "DRIFTED"].includes(value.package_state)
    || !["ABSENT", "EXACT_INTENDED", "OTHER_PRESENT", "UNPROVEN"].includes(value.registry_state)
    || !["ABSENT", "EXACT_SESSION_ACTIVE", "OTHER_PRESENT", "UNPROVEN"].includes(value.extension_state)
    || !["NOT_LOADED", "FIXED_ID_UNPACKED_SESSION", "UNPROVEN"].includes(value.extension_trust_state)
    || !["NOT_CREATED", "EXACT_EPHEMERAL_SESSION", "UNPROVEN"].includes(value.chrome_profile_state)
    || !["NOT_RUN", "PASSED", "FAILED", "UNPROVEN"].includes(value.synthetic_proof_state)) fail(`${code}_INVALID`);
  for (const field of ["native_manifest_sha256", "package_sha256", "registry_manifest_sha256"]) if (value[field] !== null && !HASH.test(value[field] ?? "")) fail(`${code}_INVALID`);
  if (value.extension_id !== null && value.extension_id !== EXTENSION_ID) fail(`${code}_INVALID`);
}

export function compileStewartGeneralizedSessionActivation(rawInput) {
  const input = snapshot(rawInput, "STEWART_SESSION_INPUT_NOT_PLAIN");
  rejectSecrets(input);
  exact(input, INPUT_FIELDS, "STEWART_SESSION_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.stewart-generalized-session-activation-input/v1") fail("STEWART_SESSION_INPUT_SCHEMA_INVALID");
  validateRelease(input.source_release);
  validatePackage(input.package);
  validateState(input.current_state, "STEWART_SESSION_CURRENT_STATE");
  exact(input.intended_state, INTENDED_FIELDS, "STEWART_SESSION_INTENDED_FIELDS_INVALID");
  const intended = input.intended_state;
  if (intended.schema !== "pookakind.stewart-generalized-session-intent/v1"
    || intended.activation_mode !== "ONE_SHOT_SESSION_ONLY" || intended.machine !== "DOSS"
    || intended.registry_key !== REGISTRY_KEY || intended.extension_id !== EXTENSION_ID
    || intended.package_sha256 !== input.package.package_sha256
    || intended.native_manifest_sha256 !== input.package.native_manifest_sha256
    || intended.extension_bundle_sha256 !== input.package.extension_bundle_sha256
    || intended.max_operations !== 1 || intended.background_service !== false
    || intended.recurring_operation !== false || intended.auto_start !== false
    || intended.persistent_chrome_profile !== false || intended.rollback_required !== true) fail("STEWART_SESSION_INTENT_INVALID");
  if (input.requested_claim !== "PREPARE_ONLY") fail("STEWART_SESSION_LIVE_CALLABLE_CLAIM_FORBIDDEN");

  const current = input.current_state;
  const blockers = [];
  if (current.package_state !== "STAGED_HASH_VERIFIED" || current.package_sha256 !== input.package.package_sha256 || current.native_manifest_sha256 !== input.package.native_manifest_sha256) blockers.push("EXACT_STAGED_PACKAGE_NOT_PROVED");
  if (current.registry_state !== "ABSENT" || current.registry_manifest_sha256 !== null) blockers.push("REGISTRY_BASELINE_NOT_CLEAN");
  if (current.extension_state !== "ABSENT" || current.extension_id !== null || current.extension_trust_state !== "NOT_LOADED") blockers.push("EXTENSION_BASELINE_NOT_CLEAN");
  if (current.chrome_profile_state !== "NOT_CREATED" || current.synthetic_proof_state !== "NOT_RUN") blockers.push("SESSION_BASELINE_NOT_CLEAN");

  const transactionBody = {
    schema: "pookakind.stewart-generalized-session-activation-transaction/v1",
    state: blockers.length === 0 ? "PREPARED_NOT_ACTIVATED" : "BLOCKED",
    source_release_sha256: digest(STEWART_GENERALIZED_SESSION_RELEASE),
    package: input.package,
    baseline: current,
    intended,
    blockers,
    ordered_steps: [
      "REVALIDATE_EXACT_PACKAGE_HASHES",
      "REVALIDATE_REGISTRY_AND_EXTENSION_BASELINE",
      "WRITE_ONE_EXACT_NATIVE_HOST_REGISTRY_VALUE",
      "LAUNCH_ONE_EXACT_EPHEMERAL_CHROME_SESSION_WITH_FIXED_EXTENSION",
      "RUN_ONE_SYNTHETIC_OPERATION_AND_SANITIZED_READBACK",
      "TERMINATE_EXACT_EPHEMERAL_CHROME_SESSION",
      "RESTORE_EXACT_REGISTRY_BASELINE",
      "REMOVE_EXACT_EPHEMERAL_PROFILE",
      "VERIFY_COMPLETE_ROLLBACK",
    ],
    max_operations: 1,
    installs_anything: false,
    activates_anything: false,
    live_callable: false,
    recurring_operation_created: false,
    password_conversion_claimed: false,
    first_provider_transaction_after_activation: {
      provider: "Disney MyDisney",
      operation_kind: "EMAIL_OTP_SUBMIT",
      required_surface: "FRESH_PROVIDER_OWNED_SIX_FIELD_EMAIL_OTP",
      required_private_custody: "AUTHENTICATED_INBOX_OPAQUE_OTP_HANDLE",
      transaction_state: "SELECTED_NOT_STARTED",
      conversion_credit: false,
    },
  };
  return deepFreeze({ ...transactionBody, transaction_sha256: digest(transactionBody) });
}

export function verifyStewartGeneralizedSessionRollback(rawInput) {
  const input = snapshot(rawInput, "STEWART_SESSION_ROLLBACK_INPUT_NOT_PLAIN");
  rejectSecrets(input);
  exact(input, ROLLBACK_FIELDS, "STEWART_SESSION_ROLLBACK_INPUT_FIELDS_INVALID");
  if (input.schema !== "pookakind.stewart-generalized-session-rollback-input/v1") fail("STEWART_SESSION_ROLLBACK_SCHEMA_INVALID");
  const transaction = input.transaction;
  if (!transaction || transaction.schema !== "pookakind.stewart-generalized-session-activation-transaction/v1" || !HASH.test(transaction.transaction_sha256 ?? "")) fail("STEWART_SESSION_TRANSACTION_INVALID");
  const transactionBody = Object.fromEntries(Object.entries(transaction).filter(([key]) => key !== "transaction_sha256"));
  if (digest(transactionBody) !== transaction.transaction_sha256 || transaction.state !== "PREPARED_NOT_ACTIVATED" || transaction.blockers.length !== 0) fail("STEWART_SESSION_TRANSACTION_INVALID");
  exact(input.activation_receipt, ACTIVATION_RECEIPT_FIELDS, "STEWART_SESSION_ACTIVATION_RECEIPT_FIELDS_INVALID");
  const receipt = input.activation_receipt;
  if (receipt.schema !== "pookakind.stewart-generalized-session-activation-receipt/v1"
    || receipt.state !== "SESSION_SYNTHETIC_PROOF_COMPLETE"
    || receipt.transaction_sha256 !== transaction.transaction_sha256
    || receipt.package_sha256 !== transaction.package.package_sha256
    || receipt.registry_written !== true || receipt.extension_loaded !== true
    || receipt.synthetic_proof_passed !== true || receipt.operations_consumed !== 1
    || receipt.provider_contacted !== false || receipt.secret_material_used !== false
    || receipt.session_process_terminated !== true || receipt.rollback_attempted !== true
    || receipt.live_callable_claimed !== false) fail("STEWART_SESSION_ACTIVATION_RECEIPT_INVALID");
  validateState(input.after_state, "STEWART_SESSION_AFTER_STATE");
  const after = input.after_state;
  if (Date.parse(after.observed_at) < Date.parse(transaction.baseline.observed_at)
    || after.package_state !== "STAGED_HASH_VERIFIED"
    || after.package_sha256 !== transaction.package.package_sha256
    || after.native_manifest_sha256 !== transaction.package.native_manifest_sha256
    || after.registry_state !== transaction.baseline.registry_state
    || after.registry_manifest_sha256 !== transaction.baseline.registry_manifest_sha256
    || after.extension_state !== "ABSENT" || after.extension_id !== null
    || after.extension_trust_state !== "NOT_LOADED"
    || after.chrome_profile_state !== "NOT_CREATED"
    || after.synthetic_proof_state !== "PASSED") fail("STEWART_SESSION_ROLLBACK_INCOMPLETE");
  return deepFreeze({
    schema: "pookakind.stewart-generalized-session-rollback-verification/v1",
    state: "ROLLBACK_VERIFIED",
    transaction_sha256: transaction.transaction_sha256,
    package_sha256: transaction.package.package_sha256,
    registry_restored: true,
    extension_removed: true,
    ephemeral_profile_removed: true,
    synthetic_proof_passed: true,
    live_callable: false,
    installed: false,
    recurring_operation_created: false,
    password_conversion_claimed: false,
  });
}
