import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartGeneralizedExtensionBridgeSession } from "../../../lib/harvey/stewart-generalized-extension-bridge.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (c) => c.repeat(64); const digest = (v) => createHash("sha256").update(canonicalJson(v)).digest("hex");
let clock = Date.parse("2026-08-22T22:00:00.000Z");
const fields = [{ role: "IDENTITY", control_sha256: h("1"), handle_ref_sha256: h("2") }, { role: "CURRENT_PASSWORD", control_sha256: h("3"), handle_ref_sha256: h("4") }];
const descriptor = { schema: "pookakind.stewart-provider-surface-descriptor/v1", field_descriptors: [{ role: "IDENTITY", control_sha256: h("1"), selector: "input[type=email]" }, { role: "CURRENT_PASSWORD", control_sha256: h("3"), selector: "input[type=password]" }], final_control_descriptor: { control_sha256: h("5"), selector: "button[type=submit]" }, readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "[data-authenticated=true]" }, { response_class: "PROVIDER_REJECTED", selector: "[role=alert]" }] };
const base = { schema: "pookakind.stewart-background-credential-command/v1", action: "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE", operation_kind: "SIGN_IN", operation_id_sha256: h("6"), authority_record_sha256: h("7"), account_ref_sha256: h("8"), canonical_origin_sha256: h("9"), route_epoch_sha256: h("a"), tab_id_sha256: h("b"), form_sha256: h("c"), fields, final_control_sha256: h("5"), provider_response_contract_sha256: digest(descriptor), max_uses: 1, requires_provider_readback: true, secret_material_present: false };
const command = { ...base, request_sha256: digest(base) };
const make = () => createStewartGeneralizedExtensionBridgeSession({ command, extension_id_sha256: h("d"), descriptor, expires_at: new Date(clock + 10_000).toISOString(), now: () => clock, randomBytes: () => Buffer.alloc(32, 7) });
const scopeFrame = (session) => structuredClone(session.scope);
const observation = (session, patch = {}) => ({ schema: "pookakind.stewart-extension-observation/v1", sequence: 0, scope: scopeFrame(session), field_controls_sha256: digest(descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 }))), final_control_sha256: command.final_control_sha256, foreground_unchanged: true, unexpected_field_count: 0, ...patch });
const execution = (session, patch = {}) => ({ schema: "pookakind.stewart-extension-execution-receipt/v1", sequence: 2, scope: scopeFrame(session), field_count: 2, field_roles_sha256: digest(["IDENTITY", "CURRENT_PASSWORD"]), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false, ...patch });
const readback = (session, patch = {}) => ({ schema: "pookakind.stewart-extension-provider-readback/v1", sequence: 4, scope: scopeFrame(session), response_contract_sha256: command.provider_response_contract_sha256, provider_state_sha256: h("e"), response_class: "PROVIDER_ACCEPTED", ...patch });

test("runs the exact ordered one-operation bridge and returns sanitized terminal custody", async () => {
  const session = make(); assert.equal(session.acceptObservation(observation(session)), true);
  const materials = [{ role: "IDENTITY", material: "private-id" }, { role: "CURRENT_PASSWORD", material: "private-password" }];
  await session.transmitFieldsOnce({ field_material: materials, send: async (frame) => { assert.equal(frame.sequence, 1); assert.equal(frame.fields[0].material, "private-id"); return execution(session); } });
  assert.deepEqual(materials.map((v) => v.material), [null, null]);
  const receipt = await session.requestReadback(async (frame) => { assert.equal(frame.sequence, 3); return readback(session); });
  assert.equal(receipt.state, "TERMINAL"); assert.equal(receipt.fixed, false); assert.equal(receipt.password_conversion, false); assert.equal(session.state, "CLOSED"); assert.doesNotMatch(JSON.stringify(receipt), /private-/);
});

test("rejects reordered, replayed, wrong-scope, and expired frames", async () => {
  const outOfOrder = make(); await assert.rejects(outOfOrder.requestReadback(async () => readback(outOfOrder)), /READBACK_INVALID/);
  const replay = make(); replay.acceptObservation(observation(replay)); assert.throws(() => replay.acceptObservation(observation(replay)), /OUT_OF_ORDER/);
  const wrong = make(); assert.throws(() => wrong.acceptObservation(observation(wrong, { scope: { ...scopeFrame(wrong), tab_id_sha256: h("f") } })), /SCOPE_CONFLICT/);
  const expired = make(); clock += 11_000; assert.throws(() => expired.acceptObservation(observation(expired)), /SESSION_EXPIRED/); clock -= 11_000;
});

test("descriptor substitution and provider-specific executable hard-coding fail at custody boundary", () => {
  const changed = structuredClone(descriptor); changed.final_control_descriptor.selector = "button#other";
  assert.throws(() => createStewartGeneralizedExtensionBridgeSession({ command, extension_id_sha256: h("d"), descriptor: changed, expires_at: new Date(clock + 1000).toISOString(), now: () => clock }), /DESCRIPTOR_CUSTODY_CONFLICT/);
});

test("disconnect or unsafe receipt closes session and releases caller materials", async () => {
  for (const send of [async () => { throw new Error("DISCONNECT"); }, async (_frame, session) => execution(session, { foreground_changed: true })]) {
    const session = make(); session.acceptObservation(observation(session));
    const materials = [{ role: "IDENTITY", material: "private-id" }, { role: "CURRENT_PASSWORD", material: "private-password" }];
    await assert.rejects(session.transmitFieldsOnce({ field_material: materials, send: (frame) => send(frame, session) }));
    assert.deepEqual(materials.map((v) => v.material), [null, null]); assert.equal(session.state, "CLOSED");
  }
});

test("readback mismatch and fabricated Fixed state fail terminally", async () => {
  for (const patch of [{ response_contract_sha256: h("f") }, { response_class: "FIXED" }, { sequence: 3 }]) {
    const session = make(); session.acceptObservation(observation(session));
    await session.transmitFieldsOnce({ field_material: [{ role: "IDENTITY", material: "x" }, { role: "CURRENT_PASSWORD", material: "y" }], send: async () => execution(session) });
    await assert.rejects(session.requestReadback(async () => readback(session, patch)), /READBACK_INVALID/); assert.equal(session.state, "CLOSED");
  }
});
