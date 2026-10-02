import assert from "node:assert/strict";
import test from "node:test";

import {
  compileStewartPasswordFinalControl,
  runStewartPasswordFinalControl,
} from "../../../lib/harvey/stewart-password-final-control.mjs";

const hash = (character) => character.repeat(64);
const now = Date.parse("2026-08-22T12:00:00.000Z");
const authority = {
  schema: "pookakind.background-final-control-authority/v1",
  operation_id_sha256: hash("1"), extension_id_sha256: hash("2"), tab_id_sha256: hash("3"),
  canonical_origin_sha256: hash("4"), route_epoch_sha256: hash("5"), account_ref_sha256: hash("6"),
  form_sha256: hash("7"), final_control_sha256: hash("8"), issued_at: "2026-08-22T11:59:50.000Z",
  expires_at: "2026-08-22T12:00:20.000Z", max_uses: 1, live_provider_mutation_authorized: true,
};
const observation = {
  schema: "pookakind.background-final-control-observation/v1",
  tab_id_sha256: hash("3"), canonical_origin_sha256: hash("4"), route_epoch_sha256: hash("5"),
  account_ref_sha256: hash("6"), form_sha256: hash("7"), final_control_sha256: hash("8"),
  password_field_count: 2, final_control_count: 1, final_control_enabled: true,
  observed_at: "2026-08-22T11:59:55.000Z", secret_material_present: false,
};

test("Stewart exposes the existing exact final-control organ under one callable name", async () => {
  const compiled = compileStewartPasswordFinalControl({ authority, observation, now });
  assert.equal(compiled.organ_name, "Stewart");
  assert.equal(compiled.admission.decision, "EXECUTE_ONCE");
  let calls = 0;
  const result = await runStewartPasswordFinalControl({
    compiled,
    consume: () => true,
    invoke: async () => {
      calls++;
      return { control_count: 1, invoked: true, foreground_changed: false, secret_material_exposed: false };
    },
    readback: async () => ({ terminal_state: "PROVIDER_ACCEPTED", provider_state_sha256: hash("9") }),
  });
  assert.equal(result.state, "COMMITTED_VERIFIED");
  assert.equal(result.fixed, false);
  assert.equal(result.secret_material_returned, false);
  assert.equal(calls, 1);
});

test("Stewart preserves the authority gate and invokes nothing", async () => {
  const compiled = compileStewartPasswordFinalControl({
    authority: { ...authority, live_provider_mutation_authorized: false }, observation, now,
  });
  let calls = 0;
  const result = await runStewartPasswordFinalControl({
    compiled,
    consume: () => { calls++; return true; },
    invoke: async () => { calls++; },
    readback: async () => { calls++; },
  });
  assert.equal(result.state, "PREPARED_NOT_ACTIVATED");
  assert.equal(result.invoke_calls, 0);
  assert.equal(calls, 0);
});

test("Stewart exact replay performs no second final-control invocation", async () => {
  const compiled = compileStewartPasswordFinalControl({ authority, observation, now });
  let calls = 0;
  const result = await runStewartPasswordFinalControl({
    compiled,
    consume: () => false,
    invoke: async () => { calls++; },
    readback: async () => { calls++; },
  });
  assert.equal(result.state, "ALREADY_CONSUMED");
  assert.equal(result.invoke_calls, 0);
  assert.equal(calls, 0);
});

test("Stewart fails closed on drifted observation and malformed composition", async () => {
  assert.throws(() => compileStewartPasswordFinalControl({ authority, observation: { ...observation, tab_id_sha256: hash("a") }, now }), /CUSTODY_CONFLICT/);
  await assert.rejects(runStewartPasswordFinalControl({ compiled: {}, consume() {}, invoke() {}, readback() {} }), /COMPOSITION_INVALID/);
});

test("Stewart rejects extra wrapper and admission fields before returning a receipt", async () => {
  const compiled = compileStewartPasswordFinalControl({
    authority: { ...authority, live_provider_mutation_authorized: false }, observation, now,
  });
  await assert.rejects(
    runStewartPasswordFinalControl({ compiled: { ...compiled, smuggled: "value" }, consume() {}, invoke() {}, readback() {} }),
    /COMPOSITION_INVALID/,
  );
  const admission = { ...compiled.admission, smuggled: "value" };
  await assert.rejects(
    runStewartPasswordFinalControl({ compiled: { ...compiled, admission }, consume() {}, invoke() {}, readback() {} }),
    /ADMISSION_FIELDS_INVALID/,
  );
});

test("Stewart rejects secret-shaped or fabricated admission reasons", async () => {
  const compiled = compileStewartPasswordFinalControl({
    authority: { ...authority, live_provider_mutation_authorized: false }, observation, now,
  });
  for (const admission of [
    { ...compiled.admission, reason: "password=not-a-receipt" },
    { ...compiled.admission, decision: "EXECUTE_ONCE", reason: "EXACT_BACKGROUND_FINAL_CONTROL_AUTHORIZED" },
    { ...compiled.admission, decision: "EXECUTE_ONCE", reason: "LIVE_PROVIDER_MUTATION_AUTHORITY_REQUIRED", command: {} },
  ]) {
    await assert.rejects(
      runStewartPasswordFinalControl({ compiled: { ...compiled, admission }, consume() {}, invoke() {}, readback() {} }),
      /ADMISSION_INVALID|ADMISSION_CUSTODY_CONFLICT/,
    );
  }
});

test("Stewart deeply freezes compiler custody and detects reconstructed nested mutation", async () => {
  const compiled = compileStewartPasswordFinalControl({ authority, observation, now });
  assert.equal(Object.isFrozen(compiled), true);
  assert.equal(Object.isFrozen(compiled.admission), true);
  assert.equal(Object.isFrozen(compiled.admission.command), true);
  assert.throws(() => { compiled.admission.reason = "MUTATED"; }, TypeError);
  const admission = { ...compiled.admission, command: { ...compiled.admission.command, action: "MUTATED" } };
  await assert.rejects(
    runStewartPasswordFinalControl({ compiled: { ...compiled, admission }, consume() {}, invoke() {}, readback() {} }),
    /ADMISSION_CUSTODY_CONFLICT/,
  );
});
