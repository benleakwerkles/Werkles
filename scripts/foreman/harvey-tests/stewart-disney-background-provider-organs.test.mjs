import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartDisneyBackgroundProviderOrgans } from "../../../lib/harvey/stewart-disney-background-provider-organs.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const h = (character) => character.repeat(64);
const now = Date.parse("2026-09-22T04:00:00.000Z");
const operator = generateIdentity();
const operatorAuthority = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const identityHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("1") };
const credentialHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: h("2") };
const otpHandle = { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: h("3") };
const rolesFor = {
  RECOVERY_IDENTITY_SUBMIT: ["IDENTITY"],
  EMAIL_OTP_SUBMIT: Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`),
  PASSWORD_RESET: ["NEW_PASSWORD", "CONFIRM_PASSWORD"],
  SIGN_IN: ["IDENTITY", "CURRENT_PASSWORD"],
};
function refFor(role, refs) { return role === "IDENTITY" ? refs.identity : role.startsWith("EMAIL_OTP") ? refs.otp : refs.credential; }
function stage(name, kind, response, refs = { identity: identityHandle.ref_sha256, otp: otpHandle.ref_sha256, credential: credentialHandle.ref_sha256 }) {
  const roles = rolesFor[kind];
  const descriptor = {
    schema: "pookakind.stewart-provider-surface-descriptor/v1",
    field_descriptors: roles.map((role) => ({ role, control_sha256: digest(`${name}:${role}`), selector: `#${name}-${role}` })),
    final_control_descriptor: { control_sha256: digest(`${name}:go`), selector: `#${name}-go` },
    readback_descriptors: [{ response_class: response, selector: `#${name}-result` }],
  };
  const observation = {
    schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256: h("a"), canonical_origin_sha256: h("b"),
    route_epoch_sha256: digest(`${name}:route`), tab_id_sha256: digest(`${name}:tab`), form_sha256: digest(`${name}:form`),
    field_controls: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })),
    final_control_sha256: descriptor.final_control_descriptor.control_sha256, provider_response_contract_sha256: digest(descriptor),
    observed_at: new Date(now - 500).toISOString(), final_control_count: 1, final_control_enabled: true,
    unexpected_field_count: 0, secret_material_present: false,
  };
  const payload = {
    schema: "pookakind.stewart-background-credential-authority/v1", operation_kind: kind,
    operation_id_sha256: digest([h("d"), name]), account_ref_sha256: observation.account_ref_sha256,
    canonical_origin_sha256: observation.canonical_origin_sha256, route_epoch_sha256: observation.route_epoch_sha256,
    tab_id_sha256: observation.tab_id_sha256, form_sha256: observation.form_sha256,
    fields: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256, handle_ref_sha256: refFor(role, refs) })),
    final_control_sha256: observation.final_control_sha256, provider_response_contract_sha256: observation.provider_response_contract_sha256,
    issued_at: new Date(now - 1_000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true,
  };
  const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256,
    payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256,
    digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
  const authorityRecord = signDurableRecord(operator.private_key_pem, payload, { issuer: "pookakind-operator", audience });
  return { descriptor, observation, response, kind, authorityRecord, operatorAuthority };
}
function fixture() {
  const stages = {
    recovery: stage("recovery", "RECOVERY_IDENTITY_SUBMIT", "FACTOR_EMAIL"),
    challenge: stage("challenge", "EMAIL_OTP_SUBMIT", "PROVIDER_ACCEPTED"),
    passwordChange: stage("passwordChange", "PASSWORD_RESET", "PROVIDER_ACCEPTED"),
    freshIdentity: stage("freshIdentity", "RECOVERY_IDENTITY_SUBMIT", "FACTOR_PASSWORD"),
    freshSignIn: stage("freshSignIn", "SIGN_IN", "PROVIDER_ACCEPTED"),
  };
  const byDescriptor = new Map(Object.values(stages).map((entry) => [digest(entry.descriptor), entry]));
  const events = []; let current = null;
  const providerAdapter = {
    observeExtension: async (descriptor) => { current = byDescriptor.get(digest(descriptor)); events.push(`observe:${current.response}`); return current.observation; },
    executeExtension: async ({ fields }) => { events.push("execute"); return { schema: "pookakind.stewart-extension-dom-execution/v1", field_count: fields.length, field_roles: fields.map(({ role }) => role), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false }; },
    readExtension: async () => { events.push("readback"); return { schema: "pookakind.stewart-extension-dom-readback/v1", response_class: current.response, secret_material_exposed: false }; },
    signOutAndClear: async () => ({ state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256: h("9"), provider_cookie_count: 0, provider_storage_count: 0, unrelated_state_touched: false }),
  };
  return { stages, events, providerAdapter };
}
function operationsFor(stages, onPrepare = () => {}) {
  return Object.fromEntries(Object.entries(stages).map(([key, value]) => [key, {
    async prepare({ handles }) {
      onPrepare(key, handles);
      const refs = {
        identity: handles.find((handle) => handle.schema === identityHandle.schema)?.ref_sha256 ?? identityHandle.ref_sha256,
        otp: handles.find((handle) => handle.schema === otpHandle.schema)?.ref_sha256 ?? otpHandle.ref_sha256,
        credential: key === "freshSignIn" ? handles[1].ref_sha256 : key === "passwordChange" ? handles[0].ref_sha256 : credentialHandle.ref_sha256,
      };
      const signed = stage(key, value.kind, value.response, refs);
      return { authorityRecord: signed.authorityRecord, observation: signed.observation, descriptor: signed.descriptor };
    },
  }]));
}
const request = { schema: "pookakind.password-provider-stage-request/v1", operation_sha256: h("d"), binding_sha256: h("e"), plan_sha256: h("f"), prior_receipt_sha256: {} };

test("all Disney provider mutations traverse signed one-shot operations and preserve background input", async () => {
  const f = fixture(); const consumed = []; const resolved = [];
  let recoveryBound = null;
  const organs = createStewartDisneyBackgroundProviderOrgans({
    routeSensor: { observeIdentityRoute: async () => ({ state: "ready" }) },
    identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: { state: "DPAPI_IDENTITY_BRIDGE_BOUND_NOT_EXECUTED", secret_material_output: false } }) },
    inbox: { bindRecoveryAcceptance: (binding) => { recoveryBound = binding; return { state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }; }, captureEmailChallenge: async () => ({ handle: otpHandle, receipt: { state: "CREATED", secret_material_returned: false } }) },
    vault: { reconcileExactOneVault: async () => ({ state: "VERIFIED_CURRENT" }) },
    providerAdapter: f.providerAdapter, operations: operationsFor(f.stages),
    credentialHandle, consume: async (id) => { consumed.push(id); return true; },
    resolveHandle: async (handle) => { resolved.push(handle.ref_sha256); return { resolved: true, material: handle.schema.includes("email-otp") ? "123456" : handle.ref_sha256 === identityHandle.ref_sha256 ? "person@example.invalid" : "private-credential" }; },
    session_ref_sha256: h("9"), flow_operation_sha256: h("d"), account_ref_sha256: h("a"), operatorAuthority, now: () => now,
  });
  await organs.routeSensor.observeIdentityRoute(request); await organs.identityCustody.bindOpaqueIdentity(request);
  assert.equal((await organs.recovery.submitRecoveryIdentity(request)).state, "FACTOR_EMAIL");
  assert.equal(recoveryBound.operation_sha256, request.operation_sha256);
  assert.equal(recoveryBound.binding_sha256, request.binding_sha256);
  await organs.inbox.captureEmailChallenge(request);
  assert.equal((await organs.challenge.submitEmailChallenge(request)).state, "SUBMISSION_ACCEPTED");
  assert.equal((await organs.passwordChange.submitPasswordChange(request)).state, "SUBMISSION_ACCEPTED");
  assert.equal((await organs.session.clearOwnedSession(request)).provider_cookie_count, 0);
  assert.equal((await organs.freshSignIn.submitFreshIdentity(request)).state, "FACTOR_PASSWORD");
  assert.equal((await organs.freshSignIn.submitFreshSignIn(request)).state, "SUBMISSION_ACCEPTED");
  assert.equal(consumed.length, 5); assert.equal(f.events.filter((entry) => entry === "execute").length, 5);
  assert.equal(resolved.length, 6); assert.equal(resolved.filter((ref) => ref === credentialHandle.ref_sha256).length, 2);
});

test("handle substitution and provider observation drift fail before credited acceptance", async () => {
  const f = fixture();
  const base = { routeSensor: { observeIdentityRoute: async () => ({}) }, identityCustody: { bindOpaqueIdentity: async () => ({ handle: { ...identityHandle, ref_sha256: h("8") }, receipt: {} }) }, inbox: { bindRecoveryAcceptance: () => ({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }), captureEmailChallenge: async () => ({ handle: otpHandle, receipt: {} }) }, vault: { reconcileExactOneVault: async () => ({}) }, providerAdapter: f.providerAdapter, operations: operationsFor(f.stages), credentialHandle, consume: async () => true, resolveHandle: async () => ({ resolved: true, material: "x" }), session_ref_sha256: h("9"), flow_operation_sha256: h("d"), account_ref_sha256: h("a"), operatorAuthority, now: () => now };
  base.operations.recovery.prepare = async () => ({ authorityRecord: f.stages.recovery.authorityRecord, observation: f.stages.recovery.observation, descriptor: f.stages.recovery.descriptor });
  const handles = createStewartDisneyBackgroundProviderOrgans(base); await handles.identityCustody.bindOpaqueIdentity(request);
  await assert.rejects(handles.recovery.submitRecoveryIdentity(request), /HANDLE_CUSTODY/);
  const dynamic = createStewartDisneyBackgroundProviderOrgans({ ...base, operations: operationsFor(f.stages) });
  await dynamic.identityCustody.bindOpaqueIdentity(request);
  assert.equal((await dynamic.recovery.submitRecoveryIdentity(request)).state, "FACTOR_EMAIL");
  const drift = fixture(); drift.providerAdapter.observeExtension = async () => ({ ...drift.stages.recovery.observation, route_epoch_sha256: h("7") });
  const exactOrgans = createStewartDisneyBackgroundProviderOrgans({ ...base, providerAdapter: drift.providerAdapter, identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: {} }) } });
  await exactOrgans.identityCustody.bindOpaqueIdentity(request);
  await assert.rejects(exactOrgans.recovery.submitRecoveryIdentity(request), /STEWART_BACKGROUND_CREDENTIAL_EXECUTION_FAILED/);
});

test("imported credential stage scope failure precedes durable claim and private resolution", async () => {
  const f = fixture(); let claims = 0; let resolutions = 0;
  const organs = createStewartDisneyBackgroundProviderOrgans({
    routeSensor: { observeIdentityRoute: async () => ({}) },
    identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: {} }) },
    inbox: { bindRecoveryAcceptance: () => ({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }), captureEmailChallenge: async () => ({ handle: otpHandle, receipt: {} }) },
    vault: { reconcileExactOneVault: async () => ({}) }, providerAdapter: f.providerAdapter,
    operations: operationsFor(f.stages), credentialHandle,
    assertCredentialStageScope: () => { throw new Error("STEWART_DOSS_CREDENTIAL_STAGE_SCOPE_INVALID"); },
    consume: async () => { claims++; return true; },
    resolveHandle: async () => { resolutions++; return { resolved: true, material: "synthetic" }; },
    session_ref_sha256: h("9"), flow_operation_sha256: h("d"), account_ref_sha256: h("a"), operatorAuthority, now: () => now,
  });
  await assert.rejects(organs.passwordChange.submitPasswordChange(request), /STAGE_SCOPE_INVALID/);
  assert.equal(claims, 0); assert.equal(resolutions, 0);
});

test("OTP command is signed only after the actual captured handle exists", async () => {
  const f = fixture(); const actualOtp = { ...otpHandle, ref_sha256: h("6") }; const prepared = [];
  const organs = createStewartDisneyBackgroundProviderOrgans({
    routeSensor: { observeIdentityRoute: async () => ({}) },
    identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: {} }) },
    inbox: { bindRecoveryAcceptance: () => ({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }), captureEmailChallenge: async () => ({ handle: actualOtp, receipt: { state: "CREATED", secret_material_returned: false } }) },
    vault: { reconcileExactOneVault: async () => ({}) }, providerAdapter: f.providerAdapter,
    operations: operationsFor(f.stages, (stageName, handles) => prepared.push([stageName, handles.map((handle) => handle.ref_sha256)])),
    credentialHandle, consume: async () => true,
    resolveHandle: async (handle) => ({ resolved: true, material: handle.schema === otpHandle.schema ? "123456" : "person@example.invalid" }),
    session_ref_sha256: h("9"), flow_operation_sha256: h("d"), account_ref_sha256: h("a"), operatorAuthority, now: () => now,
  });
  await organs.identityCustody.bindOpaqueIdentity(request);
  assert.equal((await organs.recovery.submitRecoveryIdentity(request)).state, "FACTOR_EMAIL");
  assert.equal(prepared.some(([name]) => name === "challenge"), false);
  await organs.inbox.captureEmailChallenge(request);
  assert.equal((await organs.challenge.submitEmailChallenge(request)).state, "SUBMISSION_ACCEPTED");
  assert.deepEqual(prepared.find(([name]) => name === "challenge")[1], [actualOtp.ref_sha256]);
});

test("precompiled future-handle commands and a substituted signer cannot authorize the OTP stage", async () => {
  const f = fixture(); const operations = operationsFor(f.stages);
  const base = {
    routeSensor: { observeIdentityRoute: async () => ({}) },
    identityCustody: { bindOpaqueIdentity: async () => ({ handle: identityHandle, receipt: {} }) },
    inbox: { bindRecoveryAcceptance: () => ({ state: "RECOVERY_ACCEPTANCE_BOUND", secret_material_returned: false }), captureEmailChallenge: async () => ({ handle: otpHandle, receipt: { state: "CREATED", secret_material_returned: false } }) },
    vault: { reconcileExactOneVault: async () => ({}) }, providerAdapter: f.providerAdapter,
    operations, credentialHandle, consume: async () => true,
    resolveHandle: async (handle) => ({ resolved: true, material: handle.schema === otpHandle.schema ? "123456" : "person@example.invalid" }),
    session_ref_sha256: h("9"), flow_operation_sha256: h("d"), account_ref_sha256: h("a"), operatorAuthority, now: () => now,
  };
  const staticOperations = { ...operations, challenge: { compiled: {}, descriptor: f.stages.challenge.descriptor } };
  assert.throws(() => createStewartDisneyBackgroundProviderOrgans({ ...base, operations: staticOperations }), /OPERATIONS_INVALID/);
  const signerMismatch = operationsFor(f.stages);
  signerMismatch.challenge.prepare = async () => ({
    authorityRecord: { ...f.stages.challenge.authorityRecord, signer_public_key_sha256: h("f") },
    observation: f.stages.challenge.observation, descriptor: f.stages.challenge.descriptor,
  });
  const organs = createStewartDisneyBackgroundProviderOrgans({ ...base, operations: signerMismatch });
  await organs.identityCustody.bindOpaqueIdentity(request);
  await organs.recovery.submitRecoveryIdentity(request);
  await organs.inbox.captureEmailChallenge(request);
  const priorExecutions = f.events.filter((event) => event === "execute").length;
  await assert.rejects(organs.challenge.submitEmailChallenge(request), /SIGNER_PIN_MISMATCH/);
  assert.equal(f.events.filter((event) => event === "execute").length, priorExecutions);
});
