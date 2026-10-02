import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "../../../lib/harvey/stewart-background-credential-operation.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (value) => value.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const now = Date.parse("2026-08-22T20:30:00.000Z");
const operator = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const fields = [
  { role: "IDENTITY", control_sha256: hash("1"), handle_ref_sha256: hash("2") },
  { role: "CURRENT_PASSWORD", control_sha256: hash("3"), handle_ref_sha256: hash("4") },
];
const shared = { account_ref_sha256: hash("5"), canonical_origin_sha256: hash("6"), route_epoch_sha256: hash("7"), tab_id_sha256: hash("8"), form_sha256: hash("9"), final_control_sha256: hash("a"), provider_response_contract_sha256: hash("b") };
const payload = (patch = {}) => ({ schema: "pookakind.stewart-background-credential-authority/v1", ...shared, operation_id_sha256: hash("c"), operation_kind: "SIGN_IN", fields, issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true, ...patch });
const audience = (value) => ["stewart-background-credential-operation/v1", value.operation_id_sha256, value.account_ref_sha256, value.canonical_origin_sha256, value.route_epoch_sha256, value.tab_id_sha256, value.form_sha256, digest(value.fields), value.final_control_sha256, value.provider_response_contract_sha256].join(":");
const record = (patch = {}) => { const value = payload(patch); return signDurableRecord(operator.private_key_pem, value, { issuer: "pookakind-operator", audience: audience(value) }); };
const observation = (patch = {}) => ({ schema: "pookakind.stewart-background-credential-observation/v1", ...shared, field_controls: fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(now - 500).toISOString(), ...patch });
const compile = (authorityRecord = record(), observed = observation()) => compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority: pin, observation: observed, now });
const handles = fields.map(({ handle_ref_sha256 }) => ({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: handle_ref_sha256 }));
const execution = (patch = {}) => ({ field_count: 2, field_roles_sha256: digest(["IDENTITY", "CURRENT_PASSWORD"]), final_control_count: 1, final_control_invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false, ...patch });
const readback = (command, patch = {}) => ({ schema: "pookakind.stewart-background-credential-provider-readback/v1", request_sha256: command.request_sha256, canonical_origin_sha256: command.canonical_origin_sha256, route_epoch_sha256: command.route_epoch_sha256, tab_id_sha256: command.tab_id_sha256, provider_response_contract_sha256: command.provider_response_contract_sha256, provider_state_sha256: hash("d"), response_class: "PROVIDER_ACCEPTED", ...patch });

test("signed exact background operation executes once without returning secret material", async () => {
  const compiled = compile(); const order = [];
  const receipt = await runStewartBackgroundCredentialOperation({ compiled, handles,
    consume: async () => { order.push("consume"); return true; },
    resolveHandle: async (handle) => { order.push("resolve"); return { resolved: true, material: handle.ref_sha256 === hash("2") ? "private-identity" : "private-password" }; },
    executeBackgroundForm: async ({ command, field_material }) => { order.push("execute"); assert.equal(command.tab_id_sha256, shared.tab_id_sha256); assert.equal(field_material.length, 2); return execution(); },
    readback: async (command) => { order.push("readback"); return readback(command); },
  });
  assert.deepEqual(order, ["consume", "resolve", "resolve", "execute", "readback"]);
  assert.equal(receipt.state, "SUBMISSION_ACCEPTED"); assert.equal(receipt.password_conversion, false); assert.equal(receipt.secret_material_returned, false);
  assert.doesNotMatch(JSON.stringify({ compiled, receipt }), /private-(identity|password)/);
});

test("signed live false remains source-only and calls nothing", async () => {
  const compiled = compile(record({ live_execution_authorized: false })); let calls = 0;
  const receipt = await runStewartBackgroundCredentialOperation({ compiled, handles, consume: () => { calls++; }, resolveHandle: () => { calls++; }, executeBackgroundForm: () => { calls++; }, readback: () => { calls++; } });
  assert.equal(compiled.admission.decision, "PREPARED_NOT_ACTIVATED"); assert.equal(receipt.state, "PREPARED_NOT_ACTIVATED"); assert.equal(calls, 0);
});

test("replay consumes before handle resolution", async () => {
  let calls = 0; const receipt = await runStewartBackgroundCredentialOperation({ compiled: compile(), handles, consume: () => false, resolveHandle: () => { calls++; }, executeBackgroundForm: () => { calls++; }, readback: () => { calls++; } });
  assert.equal(receipt.state, "ALREADY_CONSUMED"); assert.equal(receipt.resolve_calls, 0); assert.equal(calls, 0);
});

test("signature, exact scope, field order, and operation shape fail closed", () => {
  const signed = record();
  assert.throws(() => compile({ ...signed, payload: { ...signed.payload, tab_id_sha256: hash("e") } }), /AUTHORITY_RECORD_INVALID/);
  assert.throws(() => compile(record(), observation({ canonical_origin_sha256: hash("e") })), /CUSTODY_CONFLICT/);
  assert.throws(() => compile(record(), observation({ field_controls: [...observation().field_controls].reverse() })), /FIELD_CUSTODY_CONFLICT/);
  assert.throws(() => compile(record({ fields: [fields[0]] })), /OPERATION_SHAPE_INVALID/);
  assert.throws(() => compile(record(), { ...observation(), smuggled: true }), /OBSERVATION_FIELDS_INVALID/);
});

test("accessor-based pinned-key substitution fails closed before signature admission", () => {
  const attacker = generateIdentity();
  const attackerPayload = payload();
  const attackerRecord = signDurableRecord(attacker.private_key_pem, attackerPayload, { issuer: "pookakind-operator", audience: audience(attackerPayload) });
  let pemReads = 0;
  const swappingPin = {
    schema: "pookakind.operator-authority-pin/v1",
    public_key_sha256: operator.public_key_sha256,
    get public_key_pem() { pemReads += 1; return pemReads === 1 ? operator.public_key_pem : attacker.public_key_pem; },
  };
  assert.throws(
    () => compileStewartBackgroundCredentialOperation({ authorityRecord: attackerRecord, operatorAuthority: swappingPin, observation: observation(), now }),
    /OPERATOR_PIN_INVALID|SIGNER_PIN_MISMATCH/,
  );
  assert.equal(pemReads, 0);
});

test("symbol data and accessor smuggling on nested arrays fail closed", () => {
  for (const target of ["authority", "observation"]) {
    for (const accessor of [false, true]) {
      const symbol = Symbol("smuggled");
      let reads = 0;
      const fieldArray = target === "authority" ? [...fields] : [...observation().field_controls];
      Object.defineProperty(fieldArray, symbol, accessor
        ? { enumerable: true, get() { reads += 1; return "secret=smuggled"; } }
        : { enumerable: true, value: "smuggled" });
      if (target === "authority") {
        const value = payload({ fields: fieldArray });
        const signed = signDurableRecord(operator.private_key_pem, value, { issuer: "pookakind-operator", audience: audience(value) });
        // Durable signing ignores symbols; compiler custody must still reject the original signed-record input.
        signed.payload.fields = fieldArray;
        assert.throws(() => compile(signed), /AUTHORITY_RECORD_INVALID/);
      } else {
        assert.throws(() => compile(record(), observation({ field_controls: fieldArray })), /OBSERVATION_FIELDS_INVALID/);
      }
      assert.equal(reads, 0);
    }
  }
});

test("wrong handles and unsafe execution fail before provider readback", async () => {
  let readbacks = 0;
  await assert.rejects(runStewartBackgroundCredentialOperation({ compiled: compile(), handles: [{ ...handles[0], ref_sha256: hash("e") }, handles[1]], consume: () => true, resolveHandle: async () => ({ resolved: true, material: "x" }), executeBackgroundForm: async () => execution(), readback: async () => { readbacks++; } }), /HANDLE_CUSTODY_CONFLICT/);
  await assert.rejects(runStewartBackgroundCredentialOperation({ compiled: compile(), handles, consume: () => true, resolveHandle: async () => ({ resolved: true, material: "x" }), executeBackgroundForm: async () => execution({ foreground_changed: true }), readback: async () => { readbacks++; } }), /EXECUTION_FAILED/);
  assert.equal(readbacks, 0);
});

test("readback must bind the request and never upgrades acceptance to conversion", async () => {
  const run = (patch) => runStewartBackgroundCredentialOperation({ compiled: compile(), handles, consume: () => true, resolveHandle: async () => ({ resolved: true, material: "x" }), executeBackgroundForm: async () => execution(), readback: async (command) => readback(command, patch) });
  await assert.rejects(run({ tab_id_sha256: hash("e") }), /READBACK_CUSTODY_CONFLICT/);
  await assert.rejects(run({ response_class: "FIXED" }), /READBACK_INVALID/);
  const receipt = await run({ response_class: "FACTOR_EMAIL" });
  assert.equal(receipt.state, "FACTOR_EMAIL"); assert.equal(receipt.fixed, false); assert.equal(receipt.password_conversion, false);
  const password = await run({ response_class: "FACTOR_PASSWORD" });
  assert.equal(password.state, "FACTOR_PASSWORD"); assert.equal(password.fixed, false); assert.equal(password.password_conversion, false);
});

test("runner releases resolved material references when background execution throws", async () => {
  const resolved = [];
  let received;
  await assert.rejects(runStewartBackgroundCredentialOperation({
    compiled: compile(), handles, consume: () => true,
    resolveHandle: async (handle) => { const result = { resolved: true, material: handle.ref_sha256 === hash("2") ? "private-identity" : "private-password" }; resolved.push(result); return result; },
    executeBackgroundForm: async ({ field_material }) => { received = field_material; throw new Error("PAGE_ADAPTER_FAILED"); },
    readback: async () => { throw new Error("MUST_NOT_READBACK"); },
  }), /STEWART_BACKGROUND_CREDENTIAL_EXECUTION_FAILED/);
  assert.deepEqual(resolved.map((result) => result.material), [null, null]);
  assert.deepEqual(received.map((entry) => entry.material), [null, null]);
});

test("private dependency errors never carry synthetic secret material to the caller", async () => {
  const marker = "synthetic-private-material-do-not-log";
  const base = { compiled: compile(), handles, consume: () => true };
  const scenarios = [
    { expected: "RESOLUTION_FAILED", options: { resolveHandle: async () => { throw new Error(marker); }, executeBackgroundForm: async () => execution(), readback: async (command) => readback(command) } },
    { expected: "EXECUTION_FAILED", options: { resolveHandle: async () => ({ resolved: true, material: marker }), executeBackgroundForm: async () => { throw new Error(marker); }, readback: async (command) => readback(command) } },
    { expected: "READBACK_FAILED", options: { resolveHandle: async () => ({ resolved: true, material: marker }), executeBackgroundForm: async () => execution(), readback: async () => { throw new Error(marker); } } },
  ];
  for (const { expected, options } of scenarios) {
    await assert.rejects(runStewartBackgroundCredentialOperation({ ...base, ...options }), (error) => {
      assert.match(error.message, new RegExp(`STEWART_BACKGROUND_CREDENTIAL_${expected}`));
      assert.doesNotMatch(String(error.stack), /synthetic-private-material-do-not-log/);
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
