import assert from "node:assert/strict";
import test from "node:test";

import { composeStewartWindowsSecurityOneShot } from "../../../lib/harvey/stewart-windows-security-one-shot-composition.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (character) => character.repeat(64);
const now = Date.parse("2026-08-24T12:00:10.000Z");
const signer = generateIdentity(); const attacker = generateIdentity();
const authority = { public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 };
const payload = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-operation/v1", action: "SUBMIT_OPAQUE_BLIND_PIN_ONCE", operation_id_sha256: h("a"), machine_sha256: h("b"), broker_sid_sha256: h("c"), route_epoch_sha256: h("d"), process_id: 4242, hwnd: "987654", window_class: "Credential Dialog Xaml Host", field_name_sha256: h("e"), final_name_sha256: h("f"), provider_scope_sha256: h("6"), provider_response_contract_sha256: h("7"), secret_handle_ref_sha256: h("1"), receipt_root_sha256: h("2"), issued_at: "2026-08-24T12:00:00.000Z", expires_at: "2026-08-24T12:00:20.000Z", max_uses: 1, ...overrides });
const signed = (body = payload(), identity = signer) => signDurableRecord(identity.private_key_pem, body, { issuer: "pookakind-access-steward", audience: `stewart-windows-security:${body.machine_sha256}:${body.operation_id_sha256}` });
const terminal = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-uiaccess-elevated-lifecycle-terminal/v1", state: "SEALED_OPERATION_SUBMITTED_ROLLED_BACK", approval_scope_sha256: h("3"), operation_id_sha256: h("a"), package_sha256: h("4"), activation_driver_sha256: h("5"), synthetic_state: "SYNTHETIC_HIGHER_INTEGRITY_UIA_PASS", sealed_operation_state: "SUBMITTED_ONCE_AWAITING_PROVIDER_READBACK", provider_outcome: "OUTCOME_UNPROVEN", rollback_verified: true, installed: false, residual_owned_certificate_count: 0, residual_owned_process_count: 0, live_callable: false, windows_security_opened: true, secret_accessed: true, secret_material_exposed: false, recurrence_created: false, fixed: false, failure: null, ...overrides });

function fixture(overrides = {}) {
  let lifecycleCalls = 0; let sealedCalls = 0;
  const value = {
    authority, authority_record: signed(), expected_machine_sha256: h("b"),
    sealed_store: { seal_once(command) { sealedCalls += 1; return { state: "SEALED_ONCE", path: `C:\\owned\\${command.operation_id_sha256}.signing-draft.json` }; } },
    lifecycle: { async run_once(request) { lifecycleCalls += 1; assert.equal(request.max_uses, 1); return terminal(); } },
    ...overrides,
  };
  return { value, counts: () => ({ lifecycleCalls, sealedCalls }) };
}

test("Stewart composes, seals, and runs one exact operation without exposing the PIN or asking for a draft path", async () => {
  const f = fixture(); const receipt = await composeStewartWindowsSecurityOneShot(f.value).run_once(now);
  assert.deepEqual(f.counts(), { lifecycleCalls: 1, sealedCalls: 1 });
  assert.equal(receipt.state, "SUBMITTED_ONCE_AWAITING_PROVIDER_READBACK__ROLLED_BACK");
  assert.equal(receipt.secret_material_exposed, false); assert.equal(receipt.cursor_keyboard_clipboard_touched, false); assert.equal(receipt.fixed, false);
  assert.equal("sealed_operation_draft_path" in receipt, false); assert.equal(JSON.stringify(receipt).includes("987654"), false);
});

test("one composition cannot replay the operation", async () => {
  const f = fixture(); const composition = composeStewartWindowsSecurityOneShot(f.value); await composition.run_once(now);
  await assert.rejects(() => composition.run_once(now), /ALREADY_CONSUMED/); assert.deepEqual(f.counts(), { lifecycleCalls: 1, sealedCalls: 1 });
});

test("unsigned, attacker-signed, stale, and machine-substituted operations fail before lifecycle", async () => {
  for (const authorityRecord of [{ payload: payload() }, signed(payload(), attacker), signed(payload({ expires_at: "2026-08-24T12:02:00.000Z" }))]) {
    const f = fixture({ authority_record: authorityRecord }); await assert.rejects(() => composeStewartWindowsSecurityOneShot(f.value).run_once(now)); assert.deepEqual(f.counts(), { lifecycleCalls: 0, sealedCalls: 0 });
  }
  const f = fixture({ expected_machine_sha256: h("9") }); await assert.rejects(() => composeStewartWindowsSecurityOneShot(f.value).run_once(now), /MACHINE_MISMATCH/); assert.deepEqual(f.counts(), { lifecycleCalls: 0, sealedCalls: 0 });
});

test("false submission, provider acceptance, missing rollback, and secret-shaped terminal claims fail closed", async () => {
  for (const changed of [
    { state: "SYNTHETIC_PROVED_ROLLED_BACK", windows_security_opened: false },
    { provider_outcome: "ACCEPTED", fixed: true },
    { rollback_verified: false },
    { secret_material_exposed: true },
  ]) {
    const f = fixture({ lifecycle: { async run_once() { return terminal(changed); } } });
    await assert.rejects(() => composeStewartWindowsSecurityOneShot(f.value).run_once(now), /TERMINAL_INVALID/);
  }
});

test("accessors, symbol smuggling, and lifecycle/store substitutions fail before use", () => {
  const f = fixture(); const accessor = { ...f.value }; Object.defineProperty(accessor, "expected_machine_sha256", { enumerable: true, get() { throw new Error("getter executed"); } });
  assert.throws(() => composeStewartWindowsSecurityOneShot(accessor), /INPUT_INVALID/);
  assert.throws(() => composeStewartWindowsSecurityOneShot({ ...f.value, [Symbol("secret")]: "smuggled" }), /INPUT_INVALID/);
  assert.throws(() => composeStewartWindowsSecurityOneShot({ ...f.value, sealed_store: { seal_once: "not callable" } }), /STORE_INVALID/);
});
