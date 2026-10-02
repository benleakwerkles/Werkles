import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { compilePasswordProviderFlowPlan } from "../../../lib/harvey/password-provider-flow-plan.mjs";
import { observeStewartDisneyDynamicPackage } from "../../../lib/harvey/stewart-disney-dynamic-package-custody.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";
import { preflightStewartDisneyOwnedProduction, runStewartDisneyDeferredPackageEntrypoint } from "../stewart-disney-deferred-package-entrypoint.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const now = Date.parse("2026-09-21T23:59:00.000Z");
const entrypointPath = new URL("../stewart-disney-deferred-package-entrypoint.mjs", import.meta.url);
const entrypointSha = createHash("sha256").update(readFileSync(entrypointPath)).digest("hex");

test("owned live preflight rejects absent signer, inbox, vault, and blind binding before browser contact", () => {
  const noop = () => {};
  const full = {
    ownedBrowser: { chrome_executable_path: "chrome", initial_url: "https://login.disney.com/", stage_descriptors: {
      recovery: {}, challenge: {}, passwordChange: {}, freshIdentity: {}, freshSignIn: {},
    } },
    blindMaster: { resolver_executable: "resolver", allowed_root: "root", canonical_origin_sha256: h("origin") },
    resolveHandle: noop, gmail: { getAccessToken: noop, mailbox: "operator@example.invalid" },
    createOpaqueOtpHandle: noop,
    onepassword: { scope: ["target"], target_vault_id: "target", resolveIdentity: noop, resolveCredential: noop },
    identityCustody: { bindOpaqueIdentity: noop }, signStageRecord: noop,
  };
  assert.equal(preflightStewartDisneyOwnedProduction(full).state, "LIVE_ORGAN_SHAPES_BOUND_NOT_EXECUTED");
  assert.throws(() => preflightStewartDisneyOwnedProduction({ ...full, ownedBrowser: { ...full.ownedBrowser, stage_descriptors: {} } }), /BROWSER_PREFLIGHT_INVALID/);
  assert.throws(() => preflightStewartDisneyOwnedProduction({ ...full, blindMaster: null }), /BLIND_PREFLIGHT_INVALID/);
  assert.throws(() => preflightStewartDisneyOwnedProduction({ ...full, gmail: null }), /INBOX_PREFLIGHT_INVALID/);
  assert.throws(() => preflightStewartDisneyOwnedProduction({ ...full, onepassword: null }), /VAULT_PREFLIGHT_INVALID/);
  assert.throws(() => preflightStewartDisneyOwnedProduction({ ...full, signStageRecord: null }), /SIGNER_PREFLIGHT_INVALID/);
});
function production(signer, credentialRef = h("credential-handle")) {
  const flowOperation = h("operation"); const flowAccount = h("account");
  const authority = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 };
  const identityHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("identity-handle") };
  const credentialHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: credentialRef };
  const otpHandle = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("otp-handle") };
  const roles = { RECOVERY_IDENTITY_SUBMIT: ["IDENTITY"], EMAIL_OTP_SUBMIT: Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`), PASSWORD_RESET: ["NEW_PASSWORD", "CONFIRM_PASSWORD"], SIGN_IN: ["IDENTITY", "CURRENT_PASSWORD"] };
  const ref = (role) => role === "IDENTITY" ? identityHandle.ref_sha256 : role.startsWith("EMAIL_OTP") ? otpHandle.ref_sha256 : credentialHandle.ref_sha256;
  function stage(label, operationKind, responseClass) {
    const descriptor = { schema: "pookakind.stewart-provider-surface-descriptor/v1", field_descriptors: roles[operationKind].map((role) => ({ role, control_sha256: h(`${label}:${role}`), selector: `#${label}-${role}` })), final_control_descriptor: { control_sha256: h(`${label}:go`), selector: `#${label}-go` }, readback_descriptors: [{ response_class: responseClass, selector: `#${label}-result` }] };
    const observation = { schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256: flowAccount, canonical_origin_sha256: h("provider-origin"), route_epoch_sha256: h(`${label}:route`), tab_id_sha256: h(`${label}:tab`), form_sha256: h(`${label}:form`), field_controls: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_sha256: descriptor.final_control_descriptor.control_sha256, provider_response_contract_sha256: h(canonicalJson(descriptor)), observed_at: new Date(now - 500).toISOString(), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false };
    const payload = { schema: "pookakind.stewart-background-credential-authority/v1", operation_kind: operationKind, operation_id_sha256: h(canonicalJson([flowOperation, label])), account_ref_sha256: observation.account_ref_sha256, canonical_origin_sha256: observation.canonical_origin_sha256, route_epoch_sha256: observation.route_epoch_sha256, tab_id_sha256: observation.tab_id_sha256, form_sha256: observation.form_sha256, fields: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256, handle_ref_sha256: ref(role) })), final_control_sha256: observation.final_control_sha256, provider_response_contract_sha256: observation.provider_response_contract_sha256, issued_at: new Date(now - 1_000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true };
    const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256, payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256, h(canonicalJson(payload.fields)), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
    return { descriptor, observation, responseClass, operationKind, authorityRecord: signDurableRecord(signer.private_key_pem, payload, { issuer: "pookakind-operator", audience }), operatorAuthority: authority };
  }
  const stageRecords = { recovery: stage("recovery", "RECOVERY_IDENTITY_SUBMIT", "FACTOR_EMAIL"), challenge: stage("challenge", "EMAIL_OTP_SUBMIT", "PROVIDER_ACCEPTED"), passwordChange: stage("passwordChange", "PASSWORD_RESET", "PROVIDER_ACCEPTED"), freshIdentity: stage("freshIdentity", "RECOVERY_IDENTITY_SUBMIT", "FACTOR_PASSWORD"), freshSignIn: stage("freshSignIn", "SIGN_IN", "PROVIDER_ACCEPTED") };
  const byDescriptor = new Map(Object.values(stageRecords).map((entry) => [h(canonicalJson(entry.descriptor)), entry])); let current;
  return {
    routeSensor: { observeIdentityRoute: async () => ({ schema: "pookakind.stewart-disney-live-surface-probe/v1", provider_id: "DISNEY_MYDISNEY", classification: "IDENTITY_LOOKUP_READY", origin_sha256: h("origin"), pathname_sha256: h("path"), route_epoch_sha256: h("route"), form_sha256: h("form"), identity_field_role_sha256: h("identity"), continue_control_sha256: h("continue"), identity_field_count: 1, password_field_count: 0, continue_control_count: 1, unexpected_field_count: 0, live_execution_ready: true, live_action_performed: false, secret_material_present: false }) },
    identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: { state: "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED", mailbox_read_performed: true, secret_material_output: false } }) },
    inbox: { bindRecoveryAcceptance: () => ({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }), captureEmailChallenge: async () => ({ handle: otpHandle, receipt: { state: "CREATED", private_message_count: 1, secret_material_returned: false } }) },
    vault: { reconcileExactOneVault: async () => ({ state: "VERIFIED_CURRENT", exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", readback_sha256: h("readback") }) },
    providerAdapter: {
      observeExtension: async (descriptor) => { current = byDescriptor.get(h(canonicalJson(descriptor))); return current.observation; },
      executeExtension: async ({ fields }) => ({ schema: "pookakind.stewart-extension-dom-execution/v1", field_count: fields.length, field_roles: fields.map(({ role }) => role), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false }),
      readExtension: async () => ({ schema: "pookakind.stewart-extension-dom-readback/v1", response_class: current.responseClass, secret_material_exposed: false }),
      signOutAndClear: async () => ({ state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256: h("session"), provider_cookie_count: 0, provider_storage_count: 0, unrelated_state_touched: false }),
    },
    observeStage: async ({ stage }) => ({ descriptor: stageRecords[stage].descriptor, observation: stageRecords[stage].observation }),
    signStageRecord: async ({ payload, issuer, audience }) => signDurableRecord(signer.private_key_pem, payload, { issuer, audience }),
    credentialHandle,
    resolveHandle: async (handle) => ({ resolved: true, material: handle.schema.includes("email-otp") ? "123456" : handle.ref_sha256 === identityHandle.ref_sha256 ? "person@example.invalid" : "private-credential" }),
    session_ref_sha256: h("session"), now: () => now,
  };
}

test("package-owned entrypoint verifies dynamic custody and returns one exact eight-proof terminal", async () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-entrypoint-"));
  try {
    const packageRoot = join(root, "package");
    mkdirSync(join(packageRoot, "scripts", "foreman"), { recursive: true });
    writeFileSync(join(packageRoot, "scripts", "foreman", "stewart-disney-deferred-package-entrypoint.mjs"), readFileSync(entrypointPath));
    for (let index = 0; index < 9; index++) writeFileSync(join(packageRoot, `file-${index}`), `file-${index}`);
    const packageObservation = observeStewartDisneyDynamicPackage(packageRoot);
    const identity = generateIdentity(); const operation = h("operation"); const account = h("account");
    const approvalLine = `| 2026-09-21 | Stewart Disney V6 | DOSS package ${packageObservation.package_sha256} | APPROVED |`; const approvalPath = join(root, "approval.md"); writeFileSync(approvalPath, `${approvalLine}\n`);
    const payload = { schema: "pookakind.stewart-disney-dynamic-activation/v1", decision: "APPROVED", issued_at: "2026-09-21T23:58:00.000Z", expires_at: "2026-09-22T00:03:00.000Z", machine: "DOSS", provider_id: "DISNEY_MYDISNEY", package_sha256: packageObservation.package_sha256, package_files_sha256: packageObservation.package_files_sha256, entrypoint_sha256: entrypointSha, source_commit: "a".repeat(40), source_release_sha256: h("release"), operation_sha256: operation, account_ref_sha256: account, approval_log_entry_sha256: h(approvalLine), stage_count: 10, max_provider_actions: 6, one_shot: true, recurrence: false, foreground_changed: false, input_devices_touched: false, secret_material_output: false };
    const activationRecord = signDurableRecord(identity.private_key_pem, payload, { issuer: "pookakind-operator", audience: "stewart-disney-dynamic-package/v1" });
    const plan = compilePasswordProviderFlowPlan({ schema: "pookakind.password-provider-flow-input/v1", provider_id: "DISNEY_MYDISNEY", target: { account, adapter: h("adapter"), class: "WEB_EMAIL_RESET", provider: "Disney MyDisney", source: "https://login.disney.com/security" }, entry_mode: "IDENTITY_FIRST", recovery_mode: "RESET_EMAIL", challenges: ["EMAIL_OTP"] });
    const rehearsalBody = { schema: "pookakind.password-provider-deferred-terminal/v1", operation: h("rehearsal-op"), binding: h("rehearsal-binding"), state: "VERIFIED_CONVERSION", counted: true, proofs: Array.from({ length: 8 }, (_, index) => h(`proof-${index}`)), failure: null, secret_material_output: false, automatic_retry: false };
    const rehearsal = { ...rehearsalBody, receipt_sha256: h(canonicalJson(rehearsalBody)) };
    const input = { package_root: packageRoot, operator_authority: { schema: "pookakind.operator-authority-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, activation_record: activationRecord, approval_log_path: approvalPath, durable_root: join(root, "durable"), plan, operation_sha256: operation, binding_sha256: h("binding"), rehearsal_terminal: rehearsal, production: production(identity), now: () => now };
    const result = await runStewartDisneyDeferredPackageEntrypoint(input);
    assert.equal(result.terminal.state, "VERIFIED_CONVERSION"); assert.equal(result.terminal.counted, true); assert.equal(result.terminal.proofs.length, 8); assert.equal(result.custody.package_sha256, packageObservation.package_sha256);
    assert.equal(readdirSync(join(root, "durable", "credential-stages")).filter((name) => name.endsWith(".claim")).length, 5);
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "override-durable"), production: { ...input.production, consume: async () => true } }), /STAGE_CLAIM_OVERRIDE_FORBIDDEN/);
    let gmailReads = 0;
    const gmailProduction = { ...input.production };
    delete gmailProduction.inbox;
    gmailProduction.gmail = {
      mailbox: "person@example.invalid", getAccessToken: async () => "synthetic-gmail-token-that-is-long",
      fetchImpl: async (url) => { gmailReads++;
        return { ok: true, json: async () => url.includes("format=full") ? {
          id: "disney-message-1", internalDate: String(now), labelIds: ["INBOX"], payload: {
            headers: [{ name: "From", value: "Disney <no-reply@email.disney.com>" }, { name: "To", value: "person@example.invalid" }, { name: "Subject", value: "Your verification code" }],
            parts: [{ mimeType: "text/plain", body: { data: Buffer.from("Code: 123456").toString("base64url") } }],
          },
        } : { messages: [{ id: "disney-message-1" }], resultSizeEstimate: 1 } };
      },
    };
    gmailProduction.createOpaqueOtpHandle = async ({ otp_material }) => {
      assert.equal(otp_material, "123456");
      return { handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("otp-handle") }, receipt: { state: "CREATED", secret_material_returned: false } };
    };
    const gmailResult = await runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "gmail-durable"), production: gmailProduction });
    assert.equal(gmailResult.terminal.state, "VERIFIED_CONVERSION");
    assert.equal(gmailReads, 2);
    const blindRoot = join(root, "blind"); mkdirSync(blindRoot);
    writeFileSync(join(blindRoot, "blind-master.dpapi"), "synthetic-sealed-handle");
    const resolver = join(root, "synthetic-resolver.exe"); writeFileSync(resolver, "synthetic-resolver");
    const blindRef = h(canonicalJson(["pookakind.stewart-imported-credential/v1", "DISNEY_MYDISNEY", h("provider-origin"), operation, account, "PASSWORD_RESET", "NEW_PASSWORD", "blind-master"]));
    const blindProduction = production(identity, blindRef);
    delete blindProduction.credentialHandle;
    let blindResolves = 0;
    blindProduction.blindMaster = { resolver_executable: resolver, allowed_root: blindRoot, canonical_origin_sha256: h("provider-origin"),
      run: () => { blindResolves++; const material = Buffer.from("synthetic-blind-master"); const stdout = Buffer.alloc(4 + material.length); stdout.writeUInt32LE(material.length); material.copy(stdout, 4); return { status: 0, stdout }; } };
    const blindResult = await runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "blind-durable"), production: blindProduction });
    assert.equal(blindResult.terminal.state, "VERIFIED_CONVERSION");
    assert.ok(blindResolves > 0);
    const originalObserveStage = blindProduction.observeStage;
    const originDrift = { ...blindProduction, observeStage: async (...args) => {
      const stage = await originalObserveStage(...args);
      return { ...stage, observation: { ...stage.observation, canonical_origin_sha256: h("different-provider-origin") } };
    } };
    const driftResult = await runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "blind-origin-drift"), production: originDrift });
    assert.equal(driftResult.terminal.counted, false);
    assert.match(JSON.stringify(driftResult.terminal), /BLIND_ORIGIN_DRIFT/);
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "blind-ambiguous"), production: { ...blindProduction, credentialHandle: input.production.credentialHandle } }), /CREDENTIAL_BINDING_AMBIGUOUS/);
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint({ ...input, durable_root: join(root, "ambiguous-durable"), production: { ...gmailProduction, inbox: input.production.inbox } }), /INBOX_BINDING_AMBIGUOUS/);
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint({ ...input, production: { ...input.production, playwright: {} } }), /PROVIDER_BINDING_AMBIGUOUS/);
    writeFileSync(join(packageRoot, "file-0"), "changed-after-approval");
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint(input), /ACTIVATION_INVALID/);
    writeFileSync(join(packageRoot, "file-0"), "file-0");
    writeFileSync(join(packageRoot, "scripts", "foreman", "stewart-disney-deferred-package-entrypoint.mjs"), "substituted entrypoint");
    await assert.rejects(() => runStewartDisneyDeferredPackageEntrypoint(input), /ENTRYPOINT_PACKAGE_BYTES_CONFLICT/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
