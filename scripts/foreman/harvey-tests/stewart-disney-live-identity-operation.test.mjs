import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { bindStewartDisneyBackgroundIdentityObservation, compileStewartDisneyLiveSurfaceProbe } from "../../../lib/harvey/stewart-disney-live-surface-probe.mjs";
import { compileStewartBackgroundCredentialOperation, runStewartBackgroundCredentialOperation } from "../../../lib/harvey/stewart-background-credential-operation.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const hash = (character) => character.repeat(64);
const now = Date.parse("2026-09-21T04:27:00.000Z");
const operator = generateIdentity();
const operatorAuthority = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const surface = compileStewartDisneyLiveSurfaceProbe({
  schema: "pookakind.live-provider-surface-observation/v1",
  provider_id: "DISNEY_MYDISNEY",
  origin: "https://login.disney.com",
  pathname: "/en-US/US/DTCI-MY.ACCOUNT.WEB/interaction",
  route_epoch_sha256: hash("a"),
  observed_at: new Date(now - 500).toISOString(),
  controls: [
    { tag: "INPUT", id: "INTERACTION_TOKEN", name: "interaction_token", type: "hidden", text: null, disabled: false, visible: false, width: 0, height: 0, opacity: "1", tabIndex: 0, hasValue: false },
    { tag: "BUTTON", id: "close", name: null, type: "submit", text: "Close", disabled: false, visible: true, width: 32, height: 32, opacity: "1", tabIndex: 0, hasValue: false },
    { tag: "INPUT", id: "lookupValue", name: "lookupValue", type: "", text: null, disabled: false, visible: true, width: 387, height: 60, opacity: "1", tabIndex: 0, hasValue: false },
    { tag: "BUTTON", id: "id-flow", name: null, type: "submit", text: "Continue", disabled: false, visible: true, width: 387, height: 54, opacity: "1", tabIndex: 0, hasValue: false },
    { tag: "INPUT", id: "session-id", name: null, type: "text", text: null, disabled: false, visible: false, width: 2, height: 2, opacity: "0", tabIndex: -1, hasValue: false },
  ],
});
const observed = bindStewartDisneyBackgroundIdentityObservation(surface, {
  account_ref_sha256: hash("b"),
  provider_response_contract_sha256: hash("c"),
  retained_identity_match_count: 1,
  tab_id_sha256: hash("d"),
});
const payload = {
  schema: "pookakind.stewart-background-credential-authority/v1",
  operation_kind: "RECOVERY_IDENTITY_SUBMIT",
  operation_id_sha256: hash("e"),
  account_ref_sha256: observed.account_ref_sha256,
  canonical_origin_sha256: observed.canonical_origin_sha256,
  route_epoch_sha256: observed.route_epoch_sha256,
  tab_id_sha256: observed.tab_id_sha256,
  form_sha256: observed.form_sha256,
  fields: [{ role: "IDENTITY", control_sha256: surface.identity_field_role_sha256, handle_ref_sha256: hash("f") }],
  final_control_sha256: observed.final_control_sha256,
  provider_response_contract_sha256: observed.provider_response_contract_sha256,
  issued_at: new Date(now - 1_000).toISOString(),
  expires_at: new Date(now + 10_000).toISOString(),
  max_uses: 1,
  live_execution_authorized: true,
};
const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256,
  payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256,
  digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
const authorityRecord = signDurableRecord(operator.private_key_pem, payload, { issuer: "pookakind-operator", audience });

test("live Disney probe compiles into the existing signed one-shot identity executor", async () => {
  const compiled = compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation: observed, now });
  assert.equal(compiled.admission.decision, "EXECUTE_ONCE");
  assert.equal(compiled.admission.command.operation_kind, "RECOVERY_IDENTITY_SUBMIT");
  const calls = [];
  const receipt = await runStewartBackgroundCredentialOperation({
    compiled,
    handles: [{ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: hash("f") }],
    consume: async () => { calls.push("consume"); return true; },
    resolveHandle: async () => { calls.push("resolve"); return { resolved: true, material: "opaque-test-identity@example.invalid" }; },
    executeBackgroundForm: async ({ field_material }) => {
      calls.push("execute");
      assert.deepEqual(field_material.map(({ role }) => role), ["IDENTITY"]);
      return { field_count: 1, field_roles_sha256: digest(["IDENTITY"]), final_control_count: 1, final_control_invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false };
    },
    readback: async (command) => { calls.push("readback"); return { schema: "pookakind.stewart-background-credential-provider-readback/v1", request_sha256: command.request_sha256, canonical_origin_sha256: command.canonical_origin_sha256, route_epoch_sha256: command.route_epoch_sha256, tab_id_sha256: command.tab_id_sha256, provider_response_contract_sha256: command.provider_response_contract_sha256, provider_state_sha256: hash("1"), response_class: "FACTOR_EMAIL" }; },
  });
  assert.deepEqual(calls, ["consume", "resolve", "execute", "readback"]);
  assert.equal(receipt.state, "FACTOR_EMAIL");
  assert.equal(receipt.resolve_calls, 1);
  assert.equal(receipt.execution_calls, 1);
  assert.equal(receipt.password_conversion, false);
  assert.equal(receipt.secret_material_returned, false);
});

test("route, control, account, handle, and provider-contract substitution fail before execution", async () => {
  for (const observation of [
    { ...observed, route_epoch_sha256: hash("1") },
    { ...observed, account_ref_sha256: hash("1") },
    { ...observed, final_control_sha256: hash("1") },
    { ...observed, provider_response_contract_sha256: hash("1") },
  ]) assert.throws(() => compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation, now }), /CUSTODY_CONFLICT/);
  const compiled = compileStewartBackgroundCredentialOperation({ authorityRecord, operatorAuthority, observation: observed, now });
  await assert.rejects(() => runStewartBackgroundCredentialOperation({ compiled, handles: [{ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: hash("1") }], consume: async () => true, resolveHandle: async () => ({ resolved: true, material: "x" }), executeBackgroundForm: async () => ({}), readback: async () => ({}) }), /HANDLE_CUSTODY_CONFLICT/);
});
