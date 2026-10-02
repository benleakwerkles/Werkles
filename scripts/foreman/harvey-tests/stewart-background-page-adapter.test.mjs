import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartBackgroundPageAdapter } from "../../../lib/harvey/stewart-background-page-adapter.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (value) => value.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const now = Date.parse("2026-08-22T21:00:00.000Z");
const fields = [
  { role: "IDENTITY", control_sha256: hash("1"), handle_ref_sha256: hash("2") },
  { role: "CURRENT_PASSWORD", control_sha256: hash("3"), handle_ref_sha256: hash("4") },
];
const base = {
  schema: "pookakind.stewart-background-credential-command/v1", action: "FILL_EXACT_FIELDS_AND_INVOKE_EXACT_CONTROL_ONCE",
  operation_kind: "SIGN_IN", operation_id_sha256: hash("5"), authority_record_sha256: hash("6"), account_ref_sha256: hash("7"),
  canonical_origin_sha256: hash("8"), route_epoch_sha256: hash("9"), tab_id_sha256: hash("a"), form_sha256: hash("b"), fields,
  final_control_sha256: hash("c"), provider_response_contract_sha256: hash("d"), max_uses: 1, requires_provider_readback: true, secret_material_present: false,
};
const command = () => ({ ...base, request_sha256: digest(base) });
const observation = (patch = {}) => ({ schema: "pookakind.stewart-background-page-observation/v1", canonical_origin_sha256: base.canonical_origin_sha256, route_epoch_sha256: base.route_epoch_sha256, tab_id_sha256: base.tab_id_sha256, form_sha256: base.form_sha256, field_controls: fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_sha256: base.final_control_sha256, final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, foreground_unchanged: true, secret_material_present: false, observed_at: new Date(now - 100).toISOString(), ...patch });
const fillReceipt = ({ role, control_sha256 }, patch = {}) => ({ role, control_sha256, filled: true, value_committed: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false, ...patch });
const invokeReceipt = (patch = {}) => ({ control_sha256: base.final_control_sha256, invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false, ...patch });
const material = () => [{ role: "IDENTITY", material: "private-identity" }, { role: "CURRENT_PASSWORD", material: "private-password" }];

test("fills exact background fields then invokes one exact control without generic input", async () => {
  const order = [];
  const execute = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => { order.push("observe"); return observation(); }, fillExactField: async (value) => { order.push(`fill:${value.role}`); assert.match(value.material, /^private-/); return fillReceipt(value); }, invokeExactControl: async () => { order.push("invoke"); return invokeReceipt(); } });
  const secrets = material(); const receipt = await execute({ command: command(), field_material: secrets });
  assert.deepEqual(order, ["observe", "fill:IDENTITY", "fill:CURRENT_PASSWORD", "invoke"]);
  assert.equal(receipt.final_control_invoked, true); assert.equal(receipt.foreground_changed, false);
  assert.equal(receipt.cursor_touched, false); assert.equal(receipt.keyboard_touched, false); assert.equal(receipt.clipboard_touched, false);
  assert.deepEqual(secrets.map(({ material: value }) => value), [null, null]);
  assert.doesNotMatch(JSON.stringify(receipt), /private-/);
});

test("tab, origin, route, form, field, final-control drift and stale observation fail before fill", async () => {
  const cases = [
    { tab_id_sha256: hash("e") }, { canonical_origin_sha256: hash("e") }, { route_epoch_sha256: hash("e") },
    { form_sha256: hash("e") }, { final_control_sha256: hash("e") },
    { field_controls: [{ role: "IDENTITY", control_sha256: hash("e") }, observation().field_controls[1]] },
    { observed_at: new Date(now - 5_001).toISOString() }, { foreground_unchanged: false }, { unexpected_field_count: 1 },
  ];
  for (const patch of cases) {
    let fills = 0;
    const execute = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => observation(patch), fillExactField: async () => { fills++; }, invokeExactControl: async () => {} });
    await assert.rejects(execute({ command: command(), field_material: material() }), /CUSTODY_CONFLICT|OBSERVATION_STALE|SCOPE_INVALID/);
    assert.equal(fills, 0);
  }
});

test("unsafe fill or final control aborts without claiming completion", async () => {
  let invokes = 0;
  const badFill = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value, { foreground_changed: true }), invokeExactControl: async () => { invokes++; } });
  await assert.rejects(badFill({ command: command(), field_material: material() }), /FILL_FAILED/); assert.equal(invokes, 0);
  const badInvoke = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value), invokeExactControl: async () => invokeReceipt({ clipboard_touched: true }) });
  await assert.rejects(badInvoke({ command: command(), field_material: material() }), /INVOKE_FAILED/);
});

test("all caller and per-fill plaintext references release on every failure path", async () => {
  const failures = [
    { observePage: async () => observation({ tab_id_sha256: hash("e") }), fillExactField: async () => fillReceipt(fields[0]), invokeExactControl: async () => invokeReceipt() },
    { observePage: async () => observation(), fillExactField: async () => { throw new Error("FILL_THROW"); }, invokeExactControl: async () => invokeReceipt() },
    { observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value, { foreground_changed: true }), invokeExactControl: async () => invokeReceipt() },
    { observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value), invokeExactControl: async () => { throw new Error("INVOKE_THROW"); } },
    { observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value), invokeExactControl: async () => invokeReceipt({ clipboard_touched: true }) },
  ];
  for (const callbacks of failures) {
    const secrets = material();
    const execute = createStewartBackgroundPageAdapter({ now: () => now, ...callbacks });
    await assert.rejects(execute({ command: command(), field_material: secrets }));
    assert.deepEqual(secrets.map((entry) => entry.material), [null, null]);
  }
  const malformed = material();
  const execute = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value), invokeExactControl: async () => invokeReceipt() });
  await assert.rejects(execute({ command: { ...command(), extra: true }, field_material: malformed }), /COMMAND_INVALID/);
  assert.deepEqual(malformed.map((entry) => entry.material), [null, null]);
});

test("malformed commands and reordered or control-shaped material fail closed", async () => {
  const execute = createStewartBackgroundPageAdapter({ now: () => now, observePage: async () => observation(), fillExactField: async (value) => fillReceipt(value), invokeExactControl: async () => invokeReceipt() });
  await assert.rejects(execute({ command: { ...command(), extra: true }, field_material: material() }), /COMMAND_INVALID/);
  await assert.rejects(execute({ command: command(), field_material: [...material()].reverse() }), /MATERIAL_INVALID/);
  await assert.rejects(execute({ command: command(), field_material: [{ role: "IDENTITY", material: "null\u0000byte" }, material()[1]] }), /MATERIAL_INVALID/);
});
