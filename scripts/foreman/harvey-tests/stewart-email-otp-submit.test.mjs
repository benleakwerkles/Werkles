import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "../../../lib/harvey/stewart-background-credential-operation.mjs";
import { createStewartBackgroundPageAdapter } from "../../../lib/harvey/stewart-background-page-adapter.mjs";
import { createStewartGeneralizedExtensionBridgeSession } from "../../../lib/harvey/stewart-generalized-extension-bridge.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (value) => value.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const now = Date.parse("2026-08-22T21:30:00.000Z");
const roles = Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`);
const otpHandle = hash("2");
const fields = roles.map((role, index) => ({ role, control_sha256: hash(String(index + 3)), handle_ref_sha256: otpHandle }));
const descriptor = {
  schema: "pookakind.stewart-provider-surface-descriptor/v1",
  field_descriptors: fields.map(({ role, control_sha256 }, index) => ({ role, control_sha256, selector: `input[data-slot='${index + 1}']` })),
  final_control_descriptor: { control_sha256: hash("a"), selector: "button[type=submit]" },
  readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "[data-otp-accepted=true]" }, { response_class: "PROVIDER_REJECTED", selector: "[role=alert]" }],
};
const shared = { account_ref_sha256: hash("b"), canonical_origin_sha256: hash("c"), route_epoch_sha256: hash("d"), tab_id_sha256: hash("e"), form_sha256: hash("f"), final_control_sha256: hash("a"), provider_response_contract_sha256: digest(descriptor) };
const identity = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 };
const payload = (patch = {}) => ({ schema: "pookakind.stewart-background-credential-authority/v1", ...shared, operation_id_sha256: hash("1"), operation_kind: "EMAIL_OTP_SUBMIT", fields, issued_at: new Date(now - 1_000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true, ...patch });
const audience = (value) => ["stewart-background-credential-operation/v1", value.operation_id_sha256, value.account_ref_sha256, value.canonical_origin_sha256, value.route_epoch_sha256, value.tab_id_sha256, value.form_sha256, digest(value.fields), value.final_control_sha256, value.provider_response_contract_sha256].join(":");
const record = (patch = {}) => { const value = payload(patch); return signDurableRecord(identity.private_key_pem, value, { issuer: "pookakind-operator", audience: audience(value) }); };
const observation = { schema: "pookakind.stewart-background-credential-observation/v1", ...shared, field_controls: fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(now - 500).toISOString() };
const compile = (authorityRecord = record()) => compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority: pin, observation, now });
const handle = [{ schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: otpHandle }];
const execution = { field_count: 6, field_roles_sha256: digest(roles), final_control_count: 1, final_control_invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false };
const providerReadback = (command) => ({ schema: "pookakind.stewart-background-credential-provider-readback/v1", request_sha256: command.request_sha256, canonical_origin_sha256: command.canonical_origin_sha256, route_epoch_sha256: command.route_epoch_sha256, tab_id_sha256: command.tab_id_sha256, provider_response_contract_sha256: command.provider_response_contract_sha256, provider_state_sha256: hash("9"), response_class: "PROVIDER_ACCEPTED" });

test("one signed private-inbox OTP handle is atomically consumed and split into six ordered one-character controls", async () => {
  const resolved = { resolved: true, material: "123456" }; let consumed = 0; let executed;
  const receipt = await runStewartBackgroundCredentialOperation({ compiled: compile(), handles: handle,
    consume: async () => { consumed += 1; return true; }, resolveHandle: async () => resolved,
    executeBackgroundForm: async ({ field_material }) => { executed = structuredClone(field_material); return execution; }, readback: providerReadback });
  assert.equal(consumed, 1); assert.deepEqual(executed, roles.map((role, index) => ({ role, material: String(index + 1) })));
  assert.equal(resolved.material, null); assert.equal(receipt.state, "SUBMISSION_ACCEPTED"); assert.equal(receipt.resolve_calls, 1);
  assert.equal(receipt.password_conversion, false); assert.doesNotMatch(JSON.stringify(receipt), /123456/);
});

test("replay consumes no inbox handle and malformed or non-six-digit OTP material fails closed with reference release", async () => {
  let resolves = 0; const replay = await runStewartBackgroundCredentialOperation({ compiled: compile(), handles: handle, consume: async () => false, resolveHandle: async () => { resolves += 1; return { resolved: true, material: "123456" }; }, executeBackgroundForm: async () => execution, readback: providerReadback });
  assert.equal(replay.state, "ALREADY_CONSUMED"); assert.equal(resolves, 0);
  for (const value of ["12345", "1234567", "12x456"]) {
    const resolved = { resolved: true, material: value };
    await assert.rejects(runStewartBackgroundCredentialOperation({ compiled: compile(), handles: handle, consume: async () => true, resolveHandle: async () => resolved, executeBackgroundForm: async () => execution, readback: providerReadback }), /OTP_RESOLUTION_FAILED/);
    assert.equal(resolved.material, null);
  }
  assert.throws(() => compile(record({ fields: fields.map((field, index) => index === 5 ? { ...field, handle_ref_sha256: hash("8") } : field) })), /OTP_HANDLE_CUSTODY_CONFLICT/);
});

test("page adapter fills six ordered digits and releases every reference on success or failure", async () => {
  const command = compile().admission.command;
  const pageObservation = { schema: "pookakind.stewart-background-page-observation/v1", canonical_origin_sha256: command.canonical_origin_sha256, route_epoch_sha256: command.route_epoch_sha256, tab_id_sha256: command.tab_id_sha256, form_sha256: command.form_sha256, field_controls: fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_sha256: command.final_control_sha256, final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, foreground_unchanged: true, secret_material_present: false, observed_at: new Date(now - 100).toISOString() };
  const materials = roles.map((role, index) => ({ role, material: String(index + 1) }));
  const adapter = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => pageObservation, fillExactField: async ({ role, control_sha256 }) => ({ role, control_sha256, filled: true, value_committed: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false }), invokeExactControl: async () => ({ control_sha256: command.final_control_sha256, invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false }) });
  const result = await adapter({ command, field_material: materials }); assert.equal(result.field_count, 6); assert.deepEqual(materials.map(({ material }) => material), Array(6).fill(null));
  const bad = roles.map((role, index) => ({ role, material: index === 3 ? "44" : String(index + 1) }));
  await assert.rejects(adapter({ command, field_material: bad }), /MATERIAL_INVALID/); assert.deepEqual(bad.map(({ material }) => material), Array(6).fill(null));
});

test("ordered bridge accepts six digit-only fields and rejects non-digit substitution", async () => {
  const command = compile().admission.command;
  const make = () => createStewartGeneralizedExtensionBridgeSession({ command, extension_id_sha256: hash("7"), descriptor, expires_at: new Date(now + 10_000).toISOString(), now: () => now, randomBytes: () => Buffer.alloc(32, 1) });
  const accept = (session) => session.acceptObservation({ schema: "pookakind.stewart-extension-observation/v1", sequence: 0, scope: structuredClone(session.scope), field_controls_sha256: digest(descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 }))), final_control_sha256: command.final_control_sha256, foreground_unchanged: true, unexpected_field_count: 0 });
  const session = make(); accept(session); const materials = roles.map((role, index) => ({ role, material: String(index + 1) }));
  await session.transmitFieldsOnce({ field_material: materials, send: async () => ({ schema: "pookakind.stewart-extension-execution-receipt/v1", sequence: 2, scope: structuredClone(session.scope), field_count: 6, field_roles_sha256: digest(roles), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false }) });
  assert.deepEqual(materials.map(({ material }) => material), Array(6).fill(null));
  const badSession = make(); accept(badSession); const bad = roles.map((role, index) => ({ role, material: index === 0 ? "x" : String(index + 1) }));
  await assert.rejects(badSession.transmitFieldsOnce({ field_material: bad, send: async () => { throw new Error("SHOULD_NOT_SEND"); } }), /EXECUTION_INVALID/); assert.deepEqual(bad.map(({ material }) => material), Array(6).fill(null));
});
