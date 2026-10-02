import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  bindDisneyOneShotActivationCustody,
  createDisneyMyDisneyDossOneShotRuntime,
  createDossAuthenticatedInboxIdentityBridge,
  createDossAuthenticatedInboxOtpBridge,
  createDossImportedBlindMasterBridge,
  createDossDisneyPreapprovedCredentialBridge,
  createDossDisneyOnePasswordVaultOrgan,
  createDossOpaqueCredentialHandleResolver,
  createOfficialOnePasswordDisneyVaultBundle,
  runDisneyMyDisneyDeferredDossExecution,
} from "../stewart-generalized-disney-doss-one-shot-runtime.mjs";
import { compilePasswordProviderFlowPlan } from "../../../lib/harvey/password-provider-flow-plan.mjs";
import { PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER } from "../../../lib/harvey/password-provider-deferred-execution.mjs";
import { compileStewartDisneyLiveAdapterCapability, compileStewartDisneyLiveStageResult } from "../../../lib/harvey/stewart-disney-deferred-live-adapter.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";
import { STEWART_GENERALIZED_DISNEY_SESSION_PINS } from "../../../lib/harvey/stewart-generalized-disney-session-runner.mjs";
import { createHash } from "node:crypto";

const h = (character) => character.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const account = `acct_${"a".repeat(24)}`; const scope = `vaultscope_${"v".repeat(24)}`; const itemRef = `item_${"i".repeat(24)}`;
const sdkItem = () => ({ id: "private-item-id", vaultId: "private-vault-id", version: 4, category: "Login", title: "private", fields: [{ id: "identity", purpose: "USERNAME", fieldType: "String", value: "private" }, { id: "password", fieldType: "Concealed", value: "old" }], tags: [], notes: "private", updatedAt: new Date("2026-08-23T08:00:00Z") });
const seal = (body) => ({ ...body, transaction_sha256: digest(body) });

test("deferred Disney vault binds the official private service token without reading items at construction", async () => {
  const env = { OP_SERVICE_ACCOUNT_TOKEN: "synthetic-private-token-long-enough-for-sdk" };
  let itemReads = 0;
  const sdk_create_client = async ({ auth }) => {
    assert.equal(auth, "synthetic-private-token-long-enough-for-sdk");
    return { vaults: { list: async () => [] }, items: {
      list: async () => { itemReads++; return []; }, get: async () => { itemReads++; return {}; },
      create: async () => ({}), put: async () => ({}),
    } };
  };
  const result = await createDossDisneyOnePasswordVaultOrgan({ env, sdk_create_client,
    scope: ["shared-vault"], target_vault_id: "shared-vault",
    resolveIdentity: async () => ({}), resolveCredential: async () => ({}),
  });
  assert.equal(result.receipt.state, "OFFICIAL_CLIENT_BOUND_NOT_EXECUTED");
  assert.equal(result.receipt.vault_mutated, false);
  assert.equal(itemReads, 0);
  assert.equal(Object.hasOwn(env, "OP_SERVICE_ACCOUNT_TOKEN"), false);
  assert.equal(typeof result.organ.reconcileExactOneVault, "function");
});
const fullTransaction = (accountRef = h("7"), capabilityRecordSha256 = h("c")) => seal({ schema: "pookakind.disney-mydisney-full-conversion-transaction/v1", state: "PREPARED_NOT_ACTIVATED", provider_id: "DISNEY_MYDISNEY", account_ref_sha256: accountRef, vault_sdk_adapter_capability: { capability_record_sha256: capabilityRecordSha256 }, max_uses: 1, fixed: false, password_conversion: false });
const otpTransaction = (handleRef = h("8"), accountRef = h("7")) => seal({ schema: "pookakind.disney-mydisney-email-otp-transaction/v1", state: "SOURCE_ONLY_NOT_ACTIVATED", provider_id: "DISNEY_MYDISNEY", otp_handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: handleRef }, generalized_operation: { admission: { command: { account_ref_sha256: accountRef } } } });

test("opaque Doss credential resolver binds exact handles, emits no logs, and zeroes captured stdout", async () => {
  const root = mkdtempSync(join(tmpdir(), "disney-credential-"));
  try {
    const executable = join(root, "resolver.exe"); const protectedPath = join(root, "blind.dpapi"); writeFileSync(executable, "synthetic"); writeFileSync(protectedPath, "ciphertext");
    let output; const resolver = createDossOpaqueCredentialHandleResolver({ resolver_executable: executable, allowed_root: root, bindings: [{ schema: "pookakind.stewart-doss-opaque-credential-binding/v1", ref_sha256: h("1"), handle_name: "blind-master", dpapi_path: protectedPath }], run: (_exe, args, options) => { assert.deepEqual(args, ["--handle", "blind-master", "--path", protectedPath]); assert.equal(options.encoding, null); const material = Buffer.from("synthetic-private"); output = Buffer.alloc(material.length + 4); output.writeUInt32LE(material.length); material.copy(output, 4); return { status: 0, stdout: output, stderr: Buffer.alloc(0) }; } });
    assert.deepEqual(await resolver({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("1") }), { resolved: true, material: "synthetic-private" });
    assert.equal(output.every((byte) => byte === 0), true);
    await assert.rejects(resolver({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("2") }), /HANDLE_NOT_BOUND/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("imported Blind Master binds one operation and account without exposing material or accepting substitution", async () => {
  const root = mkdtempSync(join(tmpdir(), "disney-blind-bridge-"));
  try {
    const executable = join(root, "resolver.exe"); const protectedPath = join(root, "blind-master.dpapi");
    writeFileSync(executable, "synthetic"); writeFileSync(protectedPath, "ciphertext");
    let output;
    const bridge = createDossImportedBlindMasterBridge({ resolver_executable: executable, allowed_root: root,
      canonical_origin_sha256: h("a"), operation_sha256: h("1"), account_ref_sha256: h("2"), run: (_exe, args) => {
        assert.deepEqual(args, ["--handle", "blind-master", "--path", protectedPath]);
        const material = Buffer.from("synthetic-only"); output = Buffer.alloc(material.length + 4);
        output.writeUInt32LE(material.length); material.copy(output, 4);
        return { status: 0, stdout: output, stderr: Buffer.alloc(0) };
      } });
    assert.equal(bridge.receipt.state, "EXACT_LOCAL_HANDLE_BOUND_NOT_USED");
    assert.doesNotMatch(JSON.stringify(bridge.receipt), /synthetic-only|ciphertext/);
    const other = createDossImportedBlindMasterBridge({ resolver_executable: executable, allowed_root: root,
      canonical_origin_sha256: h("a"), operation_sha256: h("1"), account_ref_sha256: h("3") });
    assert.notEqual(other.handle.ref_sha256, bridge.handle.ref_sha256);
    const stage = "passwordChange";
    const command = { schema: "pookakind.stewart-background-credential-command/v1", operation_kind: "PASSWORD_RESET",
      account_ref_sha256: h("2"), canonical_origin_sha256: h("a"),
      operation_id_sha256: createHash("sha256").update(canonicalJson([h("1"), stage])).digest("hex"), max_uses: 1,
      fields: ["NEW_PASSWORD", "CONFIRM_PASSWORD"].map((role) => ({ role, handle_ref_sha256: bridge.handle.ref_sha256 })) };
    await assert.rejects(bridge.resolve_for_stage({ provider_id: "DISNEY_MYDISNEY", stage, command, handle: other.handle }), /STAGE_HANDLE_INVALID/);
    assert.deepEqual(await bridge.resolve_for_stage({ provider_id: "DISNEY_MYDISNEY", stage, command, handle: bridge.handle }), { resolved: true, material: "synthetic-only" });
    assert.equal(output.every((byte) => byte === 0), true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("preapproved Disney current credential enters only exact DPAPI custody and rejects source drift", async () => {
  const local = mkdtempSync(join(tmpdir(), "disney-current-bridge-"));
  const secret = "synthetic-current-only";
  try {
    const executable = join(local, "resolver.exe"); writeFileSync(executable, "synthetic");
    const allowedRoot = join(local, "PookaKind", "Stewart", "SecretHandles");
    const source = { account_ref_sha256: h("a"), source_ref_sha256: h("b"), material: secret };
    const activation = { decision: "APPROVED", provider_id: "DISNEY_MYDISNEY", machine: "DOSS", one_shot: true,
      operation_sha256: h("c"), account_ref_sha256: h("a"), activation_record_sha256: h("d"),
      package_sha256: h("e"), approval_log_entry_sha256: h("f"), expires_at: "2099-01-01T00:00:00.000Z" };
    const approval = { state: "EXACT_APPROVAL_LOG_ENTRY_VERIFIED", package_sha256: h("e"), approval_log_entry_sha256: h("f") };
    let sourceCalls = 0; let protectedFrame;
    const input = { resolver_executable: executable, allowed_root: allowedRoot, local_app_data: local,
      operation_sha256: h("c"), account_ref_sha256: h("a"), source_ref_sha256: h("b"),
      activation, approval, now: Date.parse("2026-09-24T00:00:00Z"),
      handle_name: "disney-current-once", read_authenticated_credential: async (scope) => {
        sourceCalls++; assert.equal(scope.role, "CURRENT_PASSWORD"); assert.equal(scope.provider_id, "DISNEY_MYDISNEY");
        return source;
      }, run_protect: ({ dpapi_path, frame }) => {
        protectedFrame = frame; assert.equal(frame.subarray(4).toString("utf8"), secret);
        writeFileSync(dpapi_path, Buffer.alloc(64, 13), { flag: "wx" });
        return { status: 0, stdout: Buffer.from("STEWART_HANDLE_PROTECTED_ONCE\n"), stderr: Buffer.alloc(0) };
      }, run_resolve: () => ({ status: 0, stdout: Buffer.from([1, 0, 0, 0, 120]), stderr: Buffer.alloc(0) }) };
    const bridge = await createDossDisneyPreapprovedCredentialBridge(input);
    assert.equal(sourceCalls, 1); assert.equal(source.material, null);
    assert.equal(protectedFrame.every((byte) => byte === 0), true);
    assert.equal(bridge.receipt.state, "EXACT_DPAPI_CURRENT_PASSWORD_BOUND_NOT_USED");
    assert.doesNotMatch(JSON.stringify(bridge), /synthetic-current-only/);
    assert.deepEqual(await bridge.resolve_handle(bridge.handle), { resolved: true, material: "x" });
    await assert.rejects(bridge.resolve_handle({ ...bridge.handle, ref_sha256: h("d") }), /HANDLE_NOT_BOUND/);
    await assert.rejects(createDossDisneyPreapprovedCredentialBridge({ ...input, activation: { ...activation, account_ref_sha256: h("z") } }), /AUTHORITY_INVALID/);
    await assert.rejects(createDossDisneyPreapprovedCredentialBridge({ ...input, activation: { ...activation, expires_at: "not-a-date" } }), /AUTHORITY_INVALID/);
    await assert.rejects(createDossDisneyPreapprovedCredentialBridge({ ...input, allowed_root: local }), /INPUT_INVALID/);
    assert.equal(sourceCalls, 1);
    await assert.rejects(createDossDisneyPreapprovedCredentialBridge({ ...input, handle_name: "disney-wrong-source",
      read_authenticated_credential: async () => ({ account_ref_sha256: h("a"), source_ref_sha256: h("e"), material: secret }) }), /SOURCE_INVALID/);
    await assert.rejects(createDossDisneyPreapprovedCredentialBridge({ ...input, handle_name: "disney-source-error",
      read_authenticated_credential: async () => { throw new Error(secret); } }), /SOURCE_FAILED/);
  } finally { rmSync(local, { recursive: true, force: true }); }
});

test("authenticated mailbox identity becomes an exact DPAPI-backed Disney bridge consumable by the one-shot runtime", async () => {
  const local = mkdtempSync(join(tmpdir(), "disney-identity-bridge-"));
  try {
    const resolver = join(local, "resolver.exe"); writeFileSync(resolver, "synthetic");
    const allowedRoot = join(local, "PookaKind", "Stewart", "SecretHandles");
    let resolvedOutput;
    const bridge = await createDossAuthenticatedInboxIdentityBridge({
      resolver_executable: resolver,
      allowed_root: allowedRoot,
      local_app_data: local,
      handle_name: "disney-identity",
      provider_id: "DISNEY_MYDISNEY",
      account_ref_sha256: h("a"),
      route_epoch_sha256: h("b"),
      mailbox_provider: "GMAIL_AUTHENTICATED_BROWSER",
      read_authenticated_mailbox_identity: async () => ({ authenticated: true, mailbox_session_sha256: h("c"), observed_at: "2026-09-21T12:00:00.000Z", identity_material: "private@example.invalid", direct_security_message_count: 2, provider_sender_match_count: 1 }),
      now: Date.parse("2026-09-21T12:00:01.000Z"),
      randomBytes: () => Buffer.alloc(32, 7),
      run_protect: ({ dpapi_path, frame }) => { assert.equal(frame.subarray(4).toString("utf8"), "private@example.invalid"); writeFileSync(dpapi_path, Buffer.alloc(64, 19), { flag: "wx" }); return { status: 0, stdout: Buffer.from("STEWART_HANDLE_PROTECTED_ONCE\n"), stderr: Buffer.alloc(0) }; },
      run_resolve: (_exe, args) => { assert.deepEqual(args, ["--handle", "disney-identity", "--path", join(allowedRoot, "disney-identity.dpapi")]); const material = Buffer.from("private@example.invalid"); resolvedOutput = Buffer.alloc(material.length + 4); resolvedOutput.writeUInt32LE(material.length); material.copy(resolvedOutput, 4); return { status: 0, stdout: resolvedOutput, stderr: Buffer.alloc(0) }; },
    });
    assert.equal(bridge.receipt.state, "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED");
    assert.equal(bridge.receipt.secret_material_output, false);
    assert.doesNotMatch(JSON.stringify(bridge.receipt), /private@example/);
    assert.deepEqual(await bridge.resolve_handle(bridge.handle), { resolved: true, material: "private@example.invalid" });
    assert.equal(resolvedOutput.every((byte) => byte === 0), true);
  } finally { rmSync(local, { recursive: true, force: true }); }
});

test("authenticated inbox OTP enters DPAPI custody and only its opaque handle leaves the bridge", async () => {
  const root = mkdtempSync(join(tmpdir(), "disney-otp-")); const identity = generateIdentity(); let inbox = { otp_material: "123456", source: { inbox_provider: "synthetic-authenticated-inbox", message_ref_sha256: h("8"), sender_ref_sha256: null, received_at: "2026-08-23T08:00:00.000Z" } };
  try {
    const authority = { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256, issuer: "doss-authenticated-inbox", audience: "disney-otp-custody" };
    const binding = { operation_id_sha256: h("1"), account_ref_sha256: h("2"), canonical_origin_sha256: h("3"), route_epoch_sha256: h("4"), tab_id_sha256: h("5"), form_sha256: h("6") };
    const producer = { role: "RudolphTheRed@Doss", actual_hostname: "DOSS", windows_user: "DOSS\\Operator" };
    const fakeDpapi = (_exe, _args, options) => { const request = JSON.parse(options.input); return { status: 0, stdout: request.material_base64, stderr: "" }; };
    assert.throws(() => createDossAuthenticatedInboxOtpBridge({ root, owner_id: "RUDOLPH_THE_RED@DOSS", authority, signing_private_key_pem: generateIdentity().private_key_pem, binding, producer, readAuthenticatedInboxOtp: async () => inbox, run: fakeDpapi }), /OTP_SIGNER_INVALID/);
    const bridge = createDossAuthenticatedInboxOtpBridge({ root, owner_id: "RUDOLPH_THE_RED@DOSS", authority, signing_private_key_pem: identity.private_key_pem, binding, producer, readAuthenticatedInboxOtp: async () => inbox, now: () => Date.parse("2026-08-23T08:00:01Z"), run: fakeDpapi });
    const [captured, replay] = await Promise.all([bridge.capture_once(), bridge.capture_once()]); assert.equal(captured, replay); assert.equal(captured.handle.schema, "pookakind.stewart-private-inbox-email-otp-handle/v1"); assert.equal(inbox.otp_material, null); assert.doesNotMatch(JSON.stringify(captured), /123456/);
    assert.deepEqual(await bridge.resolve(captured.handle), { resolved: true, material: "123456" });
    await assert.rejects(bridge.resolve(captured.handle), /ALREADY_CONSUMED|INDETERMINATE/);
  } finally { inbox = null; rmSync(root, { recursive: true, force: true }); }
});

test("official SDK bundle proves exact password and identity targets through one ephemeral client", async () => {
  const identity = generateIdentity(); let stored = sdkItem(); const env = { OP_SERVICE_ACCOUNT_TOKEN: "synthetic-service-account-token-123456789" };
  const client = { vaults: { list: async () => [{ id: "private-vault-id" }] }, items: { get: async () => structuredClone(stored), put: async (next) => { stored = structuredClone(next); stored.version += 1; return structuredClone(stored); } } };
  const shared = { access_steward_authority: { schema: "pookakind.onepassword-access-steward-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, access_steward_private_key_pem: identity.private_key_pem, account_ref: account, expected_machine_sha256: h("9"), machine_sha256: h("9"), sdk_native_sha256: h("5"), sdk_package_sha256: h("4"), service_account_ref_sha256: h("7"), target_field_ref_sha256: h("3"), vault_item_ref: itemRef, vault_scope_ref: scope };
  const result = await createOfficialOnePasswordDisneyVaultBundle({ env, sdk_create_client: async ({ auth }) => { assert.equal(auth.startsWith("synthetic-"), true); return client; }, now: Date.parse("2026-08-23T08:00:00Z"), capability_input: { ...shared, resolve_opaque_target: async () => ({ state: "EXACT_PRIVATE_BINDING", service_account_scope_exact: true, vault_id: "private-vault-id", item_id: "private-item-id", field_id: "password" }) }, identity_capability_input: { ...shared, resolve_opaque_target: async () => ({ state: "EXACT_PRIVATE_BINDING", service_account_scope_exact: true, vault_id: "private-vault-id", item_id: "private-item-id", field_id: "identity" }) } });
  assert.equal(env.OP_SERVICE_ACCOUNT_TOKEN, undefined); assert.equal(result.receipt.state, "OFFICIAL_CLIENT_PASSWORD_AND_IDENTITY_TARGETS_READY"); assert.equal(result.receipt.service_account_auth_used, true); assert.equal(result.receipt.provider_read_performed, true); assert.equal(result.receipt.vault_mutated, false); assert.equal(result.receipt.secret_material_output, false); assert.equal(result.receipt.private_refs_output, false); assert.ok(result.identity); assert.equal(result.identity.handle.ref_sha256, result.receipt.identity_handle_ref_sha256); assert.deepEqual(await result.identity.resolve_handle(result.identity.handle), { resolved: true, material: "private" }); assert.doesNotMatch(JSON.stringify(result.receipt), /private-vault|private-item|synthetic-service|"password"\s*:/);
});

test("one-shot entry binds durable factory, OTP, credential resolver, and vault adapter without executing", async () => {
  const root = mkdtempSync(join(tmpdir(), "disney-entry-")); const identity = generateIdentity(); const env = { OP_SERVICE_ACCOUNT_TOKEN: "synthetic-service-account-token-123456789" }; let runtimeInput; let captures = 0; let identityResolved = 0; let passwordResolved = 0;
  try {
    const stored = sdkItem(); const client = { vaults: { list: async () => [{ id: "private-vault-id" }] }, items: { get: async () => structuredClone(stored), put: async () => { throw new Error("NOT_EXECUTED"); } } };
    const otpHandle = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("8") };
    const identityHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("2") };
    const activationIdentity = generateIdentity();
    const approvalLine = `| 2026-08-23 | STEWART GENERALIZED DISNEY FULL CONVERSION V3 | DOSS package ${STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256} | APPROVED |`;
    const approvalPath = join(root, "approval.md"); writeFileSync(approvalPath, `${approvalLine}\n`);
    const activationPayload = { schema: "pookakind.stewart-generalized-disney-session-activation-authority/v1", decision: "APPROVED", approved_at: "2026-08-23T07:59:00.000Z", issued_at: "2026-08-23T07:59:00.000Z", expires_at: "2026-08-23T08:04:00.000Z", machine: "DOSS", operation_id_sha256: h("6"), account_ref_sha256: h("7"), package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256, source_release_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.source_release_sha256, gate_artifact_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256, approval_phrase_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.approval_phrase_sha256, approval_log_entry_sha256: createHash("sha256").update(approvalLine).digest("hex"), extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name, registry_key: STEWART_GENERALIZED_DISNEY_SESSION_PINS.registry_key, activation_mode: "ONE_SHOT_SESSION_ONLY", synthetic_required: true, allowed_provider: "Disney MyDisney", provider_id: "DISNEY_MYDISNEY", allowed_operation: "FULL_PASSWORD_CONVERSION", action: "SYNTHETIC_THEN_ONE_DISNEY_FULL_PASSWORD_CONVERSION", recurrence: false, max_provider_transactions: 1, complete_rollback_required: true, exclusions_sha256: digest(STEWART_GENERALIZED_DISNEY_SESSION_PINS.exclusions) };
    const activationPreflight = { schema: "pookakind.stewart-generalized-disney-session-activation-preflight-input/v1", package: { schema: "pookakind.stewart-generalized-installable-package-observation/v1", package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256, file_count: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.length, files: structuredClone(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files), extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, native_host_name: STEWART_GENERALIZED_DISNEY_SESSION_PINS.native_host_name, launcher_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[5].sha256, resolver_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[7].sha256, runtime_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[8].sha256, native_manifest_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files[0].sha256, extension_bundle_sha256: "cc78466b24c3edfbddb8c472c19a7d0b374b85dc71a4fa645ef7269cd78feecb" }, operator_authority: { schema: "pookakind.operator-authority-pin/v1", public_key_pem: activationIdentity.public_key_pem, public_key_sha256: activationIdentity.public_key_sha256 }, activation_record: signDurableRecord(activationIdentity.private_key_pem, activationPayload, { issuer: STEWART_GENERALIZED_DISNEY_SESSION_PINS.activation_issuer, audience: STEWART_GENERALIZED_DISNEY_SESSION_PINS.activation_audience }) };
    const result = await createDisneyMyDisneyDossOneShotRuntime({ package_root: join(root, "package"), session_root: join(root, "session"), chrome_executable_path: join(root, "chrome.exe"), approval_log_path: approvalPath, durable_root: join(root, "durable"), owner_id: "RUDOLPH_THE_RED@DOSS", activation_preflight: activationPreflight, credential_resolver: async () => { passwordResolved += 1; return { resolved: true, material: "synthetic" }; }, identity_bridge: { handle: identityHandle, resolve_handle: async () => { identityResolved += 1; return { resolved: true, material: "private@example.invalid" }; } }, otp_bridge: { capture_once: async () => { captures += 1; return { handle: otpHandle, receipt: { state: "CREATED", secret_material_returned: false } }; }, resolve: async () => ({ resolved: true, material: "123456" }) }, onepassword: { env, sdk_create_client: async () => client, now: Date.parse("2026-08-23T08:00:00Z"), capability_input: { access_steward_authority: { schema: "pookakind.onepassword-access-steward-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, access_steward_private_key_pem: identity.private_key_pem, account_ref: account, expected_machine_sha256: h("9"), machine_sha256: h("9"), resolve_opaque_target: async () => ({ state: "EXACT_PRIVATE_BINDING", service_account_scope_exact: true, vault_id: "private-vault-id", item_id: "private-item-id", field_id: "password" }), sdk_native_sha256: h("5"), sdk_package_sha256: h("4"), service_account_ref_sha256: h("7"), target_field_ref_sha256: h("3"), vault_item_ref: itemRef, vault_scope_ref: scope } }, compile_transaction: async ({ capability_record, identity_handle }) => { assert.deepEqual(identity_handle, identityHandle); return fullTransaction(h("7"), digest(capability_record)); }, compile_otp_transaction: async ({ otp_handle }) => otpTransaction(otp_handle.ref_sha256), create_runtime: (input) => { runtimeInput = input; return Object.freeze({ run: async () => "NOT_CALLED" }); }, now: () => Date.parse("2026-08-23T08:00:00Z") });
    const dependencies = await runtimeInput.createDependencies({ schema: "pookakind.disney-mydisney-full-conversion-doss-runtime-request/v1", session_ref_sha256: h("1"), profile_ref_sha256: h("2"), transaction_sha256: h("3"), extension_id: "abcdefghijklmnopabcdefghijklmnop" });
    assert.equal((await dependencies.resolveHandle(identityHandle)).material, "private@example.invalid"); assert.equal((await dependencies.resolveHandle({ schema: identityHandle.schema, ref_sha256: h("4") })).material, "synthetic");
    assert.equal(identityResolved, 1); assert.equal(passwordResolved, 1); assert.equal(captures, 1); assert.equal(result.receipt.state, "DEPENDENCIES_BOUND_NOT_EXECUTED"); assert.equal(result.receipt.identity_handle_bound, true); assert.equal(result.receipt.identity_source, "AUTHENTICATED_MAILBOX"); assert.equal(result.receipt.password_conversion, false); assert.equal(result.receipt.onepassword_provider_read_performed, true); assert.equal(result.receipt.disney_provider_contacted, false); assert.equal(result.receipt.vault_mutated, false); assert.equal(typeof runtimeInput.createDependencies, "function"); assert.equal(runtimeInput.otpTransaction.otp_handle.ref_sha256, h("8")); assert.doesNotMatch(JSON.stringify(result.receipt), /synthetic|private-vault|private-item|123456|private@example/);

    const deferredPlan = compilePasswordProviderFlowPlan({ schema: "pookakind.password-provider-flow-input/v1", provider_id: "DISNEY_MYDISNEY", target: { account: h("7"), adapter: h("b"), class: "WEB_EMAIL_RESET", provider: "Disney MyDisney", source: "https://login.disney.com/security" }, entry_mode: "IDENTITY_FIRST", recovery_mode: "RESET_EMAIL", challenges: ["EMAIL_OTP"] });
    const stageSpecs = { observeRoute: ["ROUTE_BOUND", 0, "READ_ONLY_ROUTE_OBSERVATION"], bindIdentity: ["IDENTITY_BOUND", 0, "OPAQUE_IDENTITY_HANDLE_BOUND"], requestRecovery: ["RECOVERY_REQUEST_ACCEPTED", 1, "PROVIDER_RECOVERY_REQUEST_ACCEPTED"], captureChallenge: ["CHALLENGE_CAPTURED_OPAQUE", 0, "OPAQUE_EMAIL_CHALLENGE_CAPTURED"], submitChallenge: ["CHALLENGE_ACCEPTED", 1, "PROVIDER_EMAIL_CHALLENGE_ACCEPTED"], executeChange: ["PASSWORD_CHANGE_ACCEPTED", 1, "PROVIDER_PASSWORD_CHANGE_ACCEPTED"], clearSession: ["SIGNED_OUT_STATE_CLEARED", 0, "OWNED_PROVIDER_SESSION_CLEARED"], beginFreshSignIn: ["FRESH_SIGN_IN_IDENTITY_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_IDENTITY_ACCEPTED"], verifyFreshSignIn: ["FRESH_SIGNED_OUT_SIGN_IN_ACCEPTED", 1, "PROVIDER_FRESH_SIGN_IN_ACCEPTED"], reconcileVault: ["EXACT_ONE_VAULT_VERIFIED_CURRENT", 1, "ONEPASSWORD_EXACT_ONE_VERIFIED_CURRENT"] };
    const deferredEvents = []; const driver = {};
    PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER.forEach((name, index) => { driver[name] = async function liveStage(request) { deferredEvents.push(name); const [state, provider_action_count, effect_type] = stageSpecs[name]; return compileStewartDisneyLiveStageResult({ stage: name, request, state, provider_action_count, effect_type, effect_sha256: digest({ index, name }) }); }; });
    const rehearsalBody = { schema: "pookakind.password-provider-deferred-terminal/v1", operation: h("1"), binding: h("2"), state: "VERIFIED_CONVERSION", counted: true, proofs: [h("3"), h("4"), h("5"), h("6"), h("7"), h("8"), h("9"), h("a")], failure: null, secret_material_output: false, automatic_retry: false };
    const rehearsalTerminal = { ...rehearsalBody, receipt_sha256: digest(rehearsalBody) };
    const capability = compileStewartDisneyLiveAdapterCapability({ package_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256, source_release_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.source_release_sha256, rehearsal_terminal: rehearsalTerminal, driver });
    const deferred = await runDisneyMyDisneyDeferredDossExecution({ approval_log_path: approvalPath, durable_root: join(root, "deferred"), activation_preflight: activationPreflight, plan: deferredPlan, operation_sha256: h("d"), binding_sha256: h("e"), live_adapter: { capability, driver }, now: () => Date.parse("2026-08-23T08:00:00Z") });
    assert.equal(deferred.state, "VERIFIED_CONVERSION"); assert.deepEqual(deferredEvents, PASSWORD_PROVIDER_DEFERRED_STAGE_ORDER);
    assert.ok(deferredEvents.indexOf("requestRecovery") < deferredEvents.indexOf("captureChallenge"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("invalid outer activation blocks vault and OTP dependencies before either is touched", async () => {
  let vaultReads = 0; let captures = 0;
  await assert.rejects(createDisneyMyDisneyDossOneShotRuntime({ package_root: "x", session_root: "x", chrome_executable_path: "x", durable_root: "x", owner_id: "RUDOLPH_THE_RED@DOSS", activation_preflight: null, credential_resolver: async () => null, otp_bridge: { capture_once: async () => { captures += 1; }, resolve: async () => null }, onepassword: { sdk_create_client: async () => { vaultReads += 1; } }, compile_transaction: async () => null, compile_otp_transaction: async () => null }), /ACTIVATION_PREFLIGHT/);
  assert.equal(vaultReads, 0);
  assert.equal(captures, 0);
  const source = readFileSync("scripts/foreman/stewart-generalized-disney-doss-one-shot-runtime.mjs", "utf8");
  assert.ok(source.indexOf("verifyDossDisneyApprovalLogEntry(approval_log_path") < source.indexOf("createOfficialOnePasswordDisneyVaultBundle(onepassword)"));
});

test("activation, full conversion, and OTP custody must bind the same account and captured handle", () => {
  const activation = { state: "ACTIVATION_AUTHORITY_VERIFIED_NOT_EXECUTED", account_ref_sha256: h("7") };
  const otpHandle = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("8") };
  const bound = bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: h("c"), transaction: fullTransaction(), otp_transaction: otpTransaction(), otp_handle: otpHandle });
  assert.equal(bound.transaction.account_ref_sha256, h("7"));
  assert.throws(() => bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: h("c"), transaction: fullTransaction(h("6")), otp_transaction: otpTransaction(), otp_handle: otpHandle }), /ACTIVATION_TRANSACTION_CUSTODY_CONFLICT/);
  assert.throws(() => bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: h("d"), transaction: fullTransaction(), otp_transaction: otpTransaction(), otp_handle: otpHandle }), /ACTIVATION_TRANSACTION_CUSTODY_CONFLICT/);
  assert.throws(() => bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: h("c"), transaction: fullTransaction(), otp_transaction: otpTransaction(h("9")), otp_handle: otpHandle }), /ACTIVATION_OTP_CUSTODY_CONFLICT/);
  const accessor = fullTransaction(); Object.defineProperty(accessor, "account_ref_sha256", { get() { throw new Error("GETTER_EXECUTED"); }, enumerable: true });
  assert.throws(() => bindDisneyOneShotActivationCustody({ activation, capability_record_sha256: h("c"), transaction: accessor, otp_transaction: otpTransaction(), otp_handle: otpHandle }), /TRANSACTION_NOT_PLAIN/);
});
