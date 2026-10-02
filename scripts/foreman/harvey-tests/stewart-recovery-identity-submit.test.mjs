import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartRecoveryIdentitySubmit, runStewartRecoveryIdentitySubmit } from "../../../lib/harvey/stewart-recovery-identity-submit.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (character) => character.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const now = Date.parse("2026-08-22T18:00:00.000Z");
const operator = generateIdentity();
const attacker = generateIdentity();
const operatorAuthority = {
  schema: "pookakind.operator-authority-pin/v1",
  public_key_pem: operator.public_key_pem,
  public_key_sha256: operator.public_key_sha256,
};
const shared = {
  account_ref_sha256: hash("1"),
  canonical_origin_sha256: hash("2"),
  route_epoch_sha256: hash("3"),
  tab_id_sha256: hash("4"),
  form_sha256: hash("5"),
  identity_field_role_sha256: hash("6"),
  continue_control_sha256: hash("7"),
  provider_response_contract_sha256: hash("8"),
};
const authorityPayload = (patch = {}) => ({
  schema: "pookakind.stewart-recovery-identity-authority-payload/v1",
  ...shared,
  operation_id_sha256: hash("9"),
  identity_handle_ref_sha256: hash("b"),
  issued_at: new Date(now - 1_000).toISOString(),
  expires_at: new Date(now + 10_000).toISOString(),
  max_uses: 1,
  live_identity_transmission_authorized: true,
  ...patch,
});
const authorityAudience = (payload) => [
  "stewart-recovery-identity-submit/v1",
  payload.operation_id_sha256,
  payload.account_ref_sha256,
  payload.canonical_origin_sha256,
  payload.route_epoch_sha256,
  payload.tab_id_sha256,
  payload.form_sha256,
  payload.identity_field_role_sha256,
  payload.continue_control_sha256,
  payload.provider_response_contract_sha256,
].join(":");
const authorityRecord = (patch = {}, signingIdentity = operator, audience) => {
  const payload = authorityPayload(patch);
  return signDurableRecord(signingIdentity.private_key_pem, payload, {
    issuer: "pookakind-operator",
    audience: audience ?? authorityAudience(payload),
  });
};
const observation = (patch = {}) => ({
  schema: "pookakind.stewart-recovery-identity-observation/v1",
  ...shared,
  observed_at: new Date(now - 500).toISOString(),
  identity_field_count: 1,
  continue_control_count: 1,
  continue_control_enabled: true,
  unexpected_field_count: 0,
  retained_identity_match_count: 1,
  secret_material_present: false,
  ...patch,
});
const compile = ({ record = authorityRecord(), observed = observation(), pin = operatorAuthority, extra = {} } = {}) => (
  compileStewartRecoveryIdentitySubmit({ authorityRecord: record, operatorAuthority: pin, observation: observed, now, ...extra })
);
const identityHandle = { schema: "pookakind.stewart-opaque-identity-handle/v1", ref_sha256: hash("b") };
const fillReceipt = (patch = {}) => ({
  field_count: 1, filled: true, foreground_changed: false, cursor_touched: false,
  keyboard_touched: false, clipboard_touched: false, identity_material_exposed: false, ...patch,
});
const invokeReceipt = (patch = {}) => ({
  control_count: 1, invoked: true, foreground_changed: false, cursor_touched: false,
  keyboard_touched: false, clipboard_touched: false, identity_material_exposed: false, ...patch,
});
const providerReadback = (command, patch = {}) => ({
  schema: "pookakind.stewart-recovery-provider-readback/v1",
  request_sha256: command.request_sha256,
  tab_id_sha256: command.tab_id_sha256,
  canonical_origin_sha256: command.canonical_origin_sha256,
  route_epoch_sha256: command.route_epoch_sha256,
  provider_response_contract_sha256: command.provider_response_contract_sha256,
  provider_state_sha256: hash("c"),
  response_class: "FACTOR_EMAIL",
  ...patch,
});

test("signed live-authority false stays prepared and invokes nothing", async () => {
  const compiled = compile({ record: authorityRecord({ live_identity_transmission_authorized: false }) });
  assert.equal(compiled.admission.decision, "PREPARED_NOT_ACTIVATED");
  let calls = 0;
  const receipt = await runStewartRecoveryIdentitySubmit({
    compiled, identityHandle,
    consume: () => { calls++; return true; },
    resolveIdentity: async () => { calls++; }, fillField: async () => { calls++; },
    invokeControl: async () => { calls++; }, readback: async () => { calls++; },
  });
  assert.equal(receipt.state, "PREPARED_NOT_ACTIVATED");
  assert.equal(receipt.invoke_calls, 0);
  assert.equal(calls, 0);
});

test("only a pinned, signed durable authority record can admit execution", () => {
  const record = authorityRecord();
  const compiled = compile({ record });
  assert.equal(compiled.admission.decision, "EXECUTE_ONCE");
  assert.equal(compiled.admission.command.authority_record_sha256, digest(record));
  assert.throws(() => compile({ record: record.payload }), /AUTHORITY_(RECORD_INVALID|PAYLOAD_FIELDS_INVALID)/);
  assert.throws(() => compile({ record: authorityRecord({}, attacker) }), /AUTHORITY_RECORD_INVALID/);
  assert.throws(
    () => compile({ pin: { ...operatorAuthority, public_key_sha256: attacker.public_key_sha256 } }),
    /OPERATOR_PIN_MISMATCH/,
  );
  const signatureTamper = {
    ...record,
    signature_ed25519: `${record.signature_ed25519[0] === "A" ? "B" : "A"}${record.signature_ed25519.slice(1)}`,
  };
  assert.throws(() => compile({ record: signatureTamper }), /AUTHORITY_RECORD_INVALID/);
  const payloadTamper = { ...record, payload: { ...record.payload, tab_id_sha256: hash("d") } };
  assert.throws(() => compile({ record: payloadTamper }), /AUTHORITY_RECORD_INVALID/);
});

test("issuer, audience, operation, and full execution scope are signature-bound", () => {
  const wrongAudience = authorityRecord({}, operator, "stewart-recovery-identity-submit/v1:wrong");
  assert.throws(() => compile({ record: wrongAudience }), /AUTHORITY_RECORD_INVALID/);
  const signed = authorityRecord();
  const operationMismatch = { ...signed, payload: { ...signed.payload, operation_id_sha256: hash("d") } };
  assert.throws(() => compile({ record: operationMismatch }), /AUTHORITY_RECORD_INVALID/);
  const payload = authorityPayload();
  const wrongIssuer = signDurableRecord(operator.private_key_pem, payload, {
    issuer: "wrong-issuer", audience: authorityAudience(payload),
  });
  assert.throws(() => compile({ record: wrongIssuer }), /AUTHORITY_RECORD_INVALID/);
});

test("caller-injected authority booleans, fields, and record digests fail closed", () => {
  for (const extra of [
    { standing_authority_verified: true },
    { live_identity_transmission_authorized: true },
    { authority_record_sha256: hash("a") },
    { authority: authorityPayload() },
  ]) assert.throws(() => compile({ extra }), /COMPILE_INPUT_FIELDS_INVALID/);
  for (const patch of [
    { standing_authority_verified: true },
    { authority_record_sha256: hash("a") },
    { smuggled: "value" },
  ]) assert.throws(() => compile({ record: authorityRecord(patch) }), /AUTHORITY_PAYLOAD_FIELDS_INVALID/);
});

test("atomic consume precedes private resolve, one field, one control, and sanitized factor readback", async () => {
  const compiled = compile();
  const order = [];
  const privateIdentity = "private-identity@example.invalid";
  const receipt = await runStewartRecoveryIdentitySubmit({
    compiled, identityHandle,
    consume: async () => { order.push("consume"); return true; },
    resolveIdentity: async () => { order.push("resolve"); return { resolved: true, identity_material: privateIdentity }; },
    fillField: async ({ command, identity_material }) => {
      order.push("fill");
      assert.equal(command.identity_handle_ref_sha256, identityHandle.ref_sha256);
      assert.equal(identity_material, privateIdentity);
      return fillReceipt();
    },
    invokeControl: async () => { order.push("invoke"); return invokeReceipt(); },
    readback: async (command) => { order.push("readback"); return providerReadback(command); },
  });
  assert.deepEqual(order, ["consume", "resolve", "fill", "invoke", "readback"]);
  assert.equal(receipt.state, "FACTOR_EMAIL");
  assert.equal(receipt.password_conversion, false);
  assert.equal(receipt.fixed, false);
  assert.equal(receipt.secret_material_returned, false);
  assert.equal(JSON.stringify(receipt).includes(privateIdentity), false);
  assert.equal(JSON.stringify(compiled).includes(privateIdentity), false);
});

test("replay consumes before resolution and invokes zero controls", async () => {
  const compiled = compile();
  let downstream = 0;
  const receipt = await runStewartRecoveryIdentitySubmit({
    compiled, identityHandle, consume: () => false,
    resolveIdentity: async () => { downstream++; }, fillField: async () => { downstream++; },
    invokeControl: async () => { downstream++; }, readback: async () => { downstream++; },
  });
  assert.equal(receipt.state, "ALREADY_CONSUMED");
  assert.equal(receipt.resolve_calls, 0);
  assert.equal(receipt.invoke_calls, 0);
  assert.equal(downstream, 0);
});

test("wrong custody, extra fields, zero or multiple controls, and retained ambiguity fail closed", () => {
  for (const patch of [
    { tab_id_sha256: hash("d") }, { canonical_origin_sha256: hash("d") },
    { route_epoch_sha256: hash("d") }, { form_sha256: hash("d") },
    { identity_field_role_sha256: hash("d") }, { continue_control_sha256: hash("d") },
    { provider_response_contract_sha256: hash("d") },
  ]) assert.throws(() => compile({ observed: observation(patch) }), /CUSTODY_CONFLICT/);
  for (const patch of [
    { identity_field_count: 0 }, { identity_field_count: 2 }, { continue_control_count: 0 },
    { continue_control_count: 2 }, { unexpected_field_count: 1 },
    { retained_identity_match_count: 0 }, { retained_identity_match_count: 2 },
    { secret_material_present: true },
  ]) assert.throws(() => compile({ observed: observation(patch) }), /SCOPE_INVALID/);
  assert.throws(() => compile({ observed: { ...observation(), smuggled: "value" } }), /OBSERVATION_FIELDS_INVALID/);
});

test("stale, future, overlong, and malformed authority or observation times fail closed", () => {
  assert.throws(
    () => compileStewartRecoveryIdentitySubmit({
      authorityRecord: authorityRecord(), operatorAuthority, observation: observation(), now: Number.NaN,
    }),
    /CLOCK_INVALID/,
  );
  for (const patch of [
    { issued_at: new Date(now + 1).toISOString() }, { expires_at: new Date(now - 1).toISOString() },
    { issued_at: new Date(now - 31_000).toISOString(), expires_at: new Date(now + 1).toISOString() },
    { issued_at: "not-a-time" },
  ]) assert.throws(() => compile({ record: authorityRecord(patch) }), /AUTHORITY_(STALE|TIME_INVALID)/);
  for (const observed_at of [new Date(now + 1).toISOString(), new Date(now - 30_001).toISOString(), "not-a-time"]) {
    assert.throws(() => compile({ observed: observation({ observed_at }) }), /OBSERVATION_(STALE|TIME_INVALID)/);
  }
});

test("malformed wrapper, admission substitution, and nested mutation fail closed", async () => {
  const compiled = compile();
  assert.equal(Object.isFrozen(compiled), true);
  assert.equal(Object.isFrozen(compiled.admission), true);
  assert.equal(Object.isFrozen(compiled.admission.command), true);
  assert.throws(() => { compiled.admission.command.action = "MUTATED"; }, TypeError);
  const args = {
    identityHandle, consume: () => true,
    resolveIdentity: async () => ({ resolved: true, identity_material: "private@example.invalid" }),
    fillField: async () => fillReceipt(), invokeControl: async () => invokeReceipt(),
    readback: async (command) => providerReadback(command),
  };
  await assert.rejects(runStewartRecoveryIdentitySubmit({ compiled: { ...compiled, smuggled: "value" }, ...args }), /WRAPPER_FIELDS_INVALID/);
  const badAdmission = { ...compiled.admission, reason: "password=not-a-receipt" };
  await assert.rejects(
    runStewartRecoveryIdentitySubmit({ compiled: { ...compiled, admission: badAdmission }, ...args }),
    /SECRET_OR_CONTROL_SHAPE_REJECTED|ADMISSION_CUSTODY_CONFLICT/,
  );
  const badCommand = { ...compiled.admission.command, action: "MUTATED" };
  await assert.rejects(
    runStewartRecoveryIdentitySubmit({ compiled: { ...compiled, admission: { ...compiled.admission, command: badCommand } }, ...args }),
    /COMMAND_INVALID|ADMISSION_CUSTODY_CONFLICT/,
  );
});

test("opaque handle mismatch fails before consume or identity resolution", async () => {
  const compiled = compile();
  let calls = 0;
  await assert.rejects(runStewartRecoveryIdentitySubmit({
    compiled, identityHandle: { ...identityHandle, ref_sha256: hash("d") },
    consume: () => { calls++; return true; }, resolveIdentity: async () => { calls++; },
    fillField: async () => { calls++; }, invokeControl: async () => { calls++; },
    readback: async () => { calls++; },
  }), /HANDLE_CUSTODY_CONFLICT/);
  assert.equal(calls, 0);
});

test("unsafe fill or invoke receipts fail closed before provider readback", async () => {
  for (const fault of [
    { fill: fillReceipt({ field_count: 2 }), invoke: invokeReceipt() },
    { fill: fillReceipt({ foreground_changed: true }), invoke: invokeReceipt() },
    { fill: fillReceipt(), invoke: invokeReceipt({ control_count: 2 }) },
    { fill: fillReceipt(), invoke: invokeReceipt({ clipboard_touched: true }) },
  ]) {
    const compiled = compile();
    let readbackCalls = 0;
    await assert.rejects(runStewartRecoveryIdentitySubmit({
      compiled, identityHandle, consume: () => true,
      resolveIdentity: async () => ({ resolved: true, identity_material: "private@example.invalid" }),
      fillField: async () => fault.fill, invokeControl: async () => fault.invoke,
      readback: async () => { readbackCalls++; },
    }), /FILL_FAILED|INVOKE_FAILED/);
    assert.equal(readbackCalls, 0);
  }
});

test("provider response mismatch, fabricated terminal state, and secret-shaped receipt fail closed", async () => {
  const run = (patch) => runStewartRecoveryIdentitySubmit({
    compiled: compile(), identityHandle, consume: () => true,
    resolveIdentity: async () => ({ resolved: true, identity_material: "private@example.invalid" }),
    fillField: async () => fillReceipt(), invokeControl: async () => invokeReceipt(),
    readback: async (command) => providerReadback(command, patch),
  });
  for (const patch of [
    { request_sha256: hash("d") }, { tab_id_sha256: hash("d") },
    { canonical_origin_sha256: hash("d") }, { route_epoch_sha256: hash("d") },
    { provider_response_contract_sha256: hash("d") },
  ]) await assert.rejects(run(patch), /PROVIDER_RESPONSE_MISMATCH/);
  await assert.rejects(run({ response_class: "FIXED" }), /READBACK_INVALID/);
  await assert.rejects(run({ response_class: "password=secret" }), /SECRET_OR_CONTROL_SHAPE_REJECTED/);
});

test("sanitized provider readback distinguishes accepted, rejected, factor, and unknown without Fixed", async () => {
  const cases = new Map([
    ["PROVIDER_ACCEPTED", "REQUEST_ACCEPTED"], ["PROVIDER_REJECTED", "REQUEST_REJECTED"],
    ["FACTOR_EMAIL", "FACTOR_EMAIL"], ["FACTOR_SMS", "FACTOR_SMS"],
    ["FACTOR_DEVICE", "FACTOR_DEVICE"], ["FACTOR_CAPTCHA", "FACTOR_CAPTCHA"],
    ["OUTCOME_UNKNOWN", "OUTCOME_UNKNOWN"],
  ]);
  for (const [response_class, expected] of cases) {
    const receipt = await runStewartRecoveryIdentitySubmit({
      compiled: compile(), identityHandle, consume: () => true,
      resolveIdentity: async () => ({ resolved: true, identity_material: "private@example.invalid" }),
      fillField: async () => fillReceipt(), invokeControl: async () => invokeReceipt(),
      readback: async (command) => providerReadback(command, { response_class }),
    });
    assert.equal(receipt.state, expected);
    assert.equal(receipt.fixed, false);
    assert.equal(receipt.password_conversion, false);
  }
});
