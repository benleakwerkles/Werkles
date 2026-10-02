import assert from "node:assert/strict";
import test from "node:test";

import { produceStewartWindowsSecurityOperation } from "../../../lib/harvey/stewart-windows-security-operation-producer.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (c) => c.repeat(64); const now = Date.parse("2026-08-24T12:00:10.000Z");
const identity = generateIdentity(); const attacker = generateIdentity();
const authority = { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 };
const observation = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-exact-observation/v1", machine_sha256: h("a"), broker_sid_sha256: h("b"), route_epoch_sha256: h("c"), process_id: 4242, hwnd: "987654", window_class: "Credential Dialog Xaml Host", field_name_sha256: h("d"), final_name_sha256: h("e"), receipt_root_sha256: h("f"), account_ref_sha256: h("2"), canonical_origin_sha256: h("3"), tab_id_sha256: h("4"), provider_response_contract_sha256: h("5"), observed_at: "2026-08-24T12:00:05.000Z", writable_value_pattern_count: 1, invokable_pattern_count: 1, values_read: false, secret_accessed: false, foreground_changed: false, ...overrides });
const signer = (who = identity) => ({ sign_record(payload, options) { return signDurableRecord(who.private_key_pem, payload, options); } });

test("Access Steward produces a fresh signed one-shot operation from exact metadata and an opaque handle", async () => {
  const produced = await produceStewartWindowsSecurityOperation({ authority, observation: observation(), secret_handle_ref_sha256: h("1"), signer: signer(), now });
  assert.equal(produced.state, "SIGNED_EXACT_OPERATION_READY"); assert.equal(produced.command.max_uses, 1); assert.equal(produced.secret_material_exposed, false); assert.equal(produced.signer_self_minted, false);
  assert.match(produced.command.provider_scope_sha256, /^[a-f0-9]{64}$/); assert.equal(produced.command.provider_response_contract_sha256, h("5"));
  assert.match(produced.command.operation_id_sha256, /^[a-f0-9]{64}$/); assert.equal(JSON.stringify(produced).includes("device-pin"), false); assert.equal(JSON.stringify(produced).includes("private_key_pem"), false);
});

test("wrong signer, stale/drifted surface, extra controls, and secret activity fail closed", async () => {
  await assert.rejects(() => produceStewartWindowsSecurityOperation({ authority, observation: observation(), secret_handle_ref_sha256: h("1"), signer: signer(attacker), now }), /AUTHORITY_RECORD_INVALID/);
  for (const changed of [{ observed_at: "2026-08-24T11:59:00.000Z" }, { process_id: 0 }, { hwnd: "0" }, { provider_response_contract_sha256: "bad" }, { writable_value_pattern_count: 2 }, { invokable_pattern_count: 0 }, { values_read: true }, { secret_accessed: true }, { foreground_changed: true }]) {
    await assert.rejects(() => produceStewartWindowsSecurityOperation({ authority, observation: observation(changed), secret_handle_ref_sha256: h("1"), signer: signer(), now }));
  }
});

test("smuggled, accessor, and malformed opaque-handle inputs fail without signing", async () => {
  let calls = 0; const guarded = { sign_record() { calls += 1; throw new Error("unexpected"); } };
  await assert.rejects(() => produceStewartWindowsSecurityOperation({ authority, observation: { ...observation(), injected: true }, secret_handle_ref_sha256: h("1"), signer: guarded, now }), /OBSERVATION_INVALID/);
  const accessor = observation(); Object.defineProperty(accessor, "process_id", { enumerable: true, get() { throw new Error("getter executed"); } });
  await assert.rejects(() => produceStewartWindowsSecurityOperation({ authority, observation: accessor, secret_handle_ref_sha256: h("1"), signer: guarded, now }), /OBSERVATION_INVALID/);
  await assert.rejects(() => produceStewartWindowsSecurityOperation({ authority, observation: observation(), secret_handle_ref_sha256: "not-a-hash", signer: guarded, now }), /OBSERVATION_INVALID/);
  assert.equal(calls, 0);
});
