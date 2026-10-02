import assert from "node:assert/strict";
import test from "node:test";

import { bindStewartDisneyBackgroundIdentityObservation, bindStewartDisneyRecoveryIdentityObservation, compileStewartDisneyLiveSurfaceProbe } from "../../../lib/harvey/stewart-disney-live-surface-probe.mjs";

const control = (patch = {}) => ({ tag: "INPUT", id: "lookupValue", name: "lookupValue", type: "text", text: null, disabled: false, visible: true, width: 387, height: 60, opacity: "1", tabIndex: 0, hasValue: false, ...patch });
const observation = (patch = {}) => ({
  schema: "pookakind.live-provider-surface-observation/v1",
  provider_id: "DISNEY_MYDISNEY",
  origin: "https://login.disney.com",
  pathname: "/en-US/US/DTCI-MY.ACCOUNT.WEB/interaction",
  route_epoch_sha256: null,
  observed_at: "2026-09-21T15:00:00.000Z",
  controls: [
    control({ id: "INTERACTION_TOKEN", name: "interaction_token", type: "hidden", visible: false, width: 0, height: 0, opacity: "1", tabIndex: -1 }),
    control({ type: "" }),
    control({ tag: "BUTTON", id: "close", name: null, type: "submit", text: "Close", width: 32, height: 32 }),
    control({ tag: "BUTTON", id: "id-flow", name: null, type: "submit", text: "Continue", width: 387, height: 48 }),
    control({ id: "session-id", name: null, visible: false, width: 2, height: 2, opacity: "0", tabIndex: -1 }),
  ],
  ...patch,
});

test("classifies the exact current Disney identity surface without treating hidden controls as fields", () => {
  const receipt = compileStewartDisneyLiveSurfaceProbe(observation());
  assert.equal(receipt.classification, "IDENTITY_LOOKUP_OBSERVED__ROUTE_EPOCH_REQUIRED");
  assert.equal(receipt.identity_field_count, 1);
  assert.equal(receipt.password_field_count, 0);
  assert.equal(receipt.continue_control_count, 1);
  assert.equal(receipt.hidden_control_count, 2);
  assert.equal(receipt.live_execution_ready, false);
  assert.equal(receipt.live_action_performed, false);
  assert.equal(receipt.secret_material_present, false);
});

test("exact route custody upgrades observation readiness without performing an action", () => {
  const receipt = compileStewartDisneyLiveSurfaceProbe(observation({ route_epoch_sha256: "a".repeat(64) }));
  assert.equal(receipt.classification, "IDENTITY_LOOKUP_READY");
  assert.equal(receipt.live_execution_ready, true);
  assert.equal(receipt.live_action_performed, false);
  const bound = bindStewartDisneyRecoveryIdentityObservation(receipt, {
    account_ref_sha256: "b".repeat(64),
    provider_response_contract_sha256: "c".repeat(64),
    retained_identity_match_count: 1,
    tab_id_sha256: "d".repeat(64),
  });
  assert.equal(bound.schema, "pookakind.stewart-recovery-identity-observation/v1");
  assert.equal(bound.route_epoch_sha256, "a".repeat(64));
  assert.equal(bound.identity_field_count, 1);
  assert.equal(bound.continue_control_count, 1);
  assert.equal(bound.secret_material_present, false);
  const generalized = bindStewartDisneyBackgroundIdentityObservation(receipt, {
    account_ref_sha256: "b".repeat(64),
    provider_response_contract_sha256: "c".repeat(64),
    retained_identity_match_count: 1,
    tab_id_sha256: "d".repeat(64),
  });
  assert.equal(generalized.schema, "pookakind.stewart-background-credential-observation/v1");
  assert.deepEqual(generalized.field_controls, [{ role: "IDENTITY", control_sha256: receipt.identity_field_role_sha256 }]);
  assert.equal(generalized.final_control_sha256, receipt.continue_control_sha256);
  assert.equal(generalized.final_control_count, 1);
  assert.equal(generalized.secret_material_present, false);
});

test("binding cannot upgrade an incomplete, drifted, populated, or unproved surface", () => {
  const binding = { account_ref_sha256: "b".repeat(64), provider_response_contract_sha256: "c".repeat(64), retained_identity_match_count: 1, tab_id_sha256: "d".repeat(64) };
  const incomplete = compileStewartDisneyLiveSurfaceProbe(observation());
  assert.throws(() => bindStewartDisneyRecoveryIdentityObservation(incomplete, binding), /NOT_BINDABLE/);
  const ready = compileStewartDisneyLiveSurfaceProbe(observation({ route_epoch_sha256: "a".repeat(64) }));
  assert.throws(() => bindStewartDisneyRecoveryIdentityObservation(ready, { ...binding, retained_identity_match_count: 0 }), /NOT_BINDABLE/);
  assert.throws(() => bindStewartDisneyRecoveryIdentityObservation(ready, { ...binding, tab_id_sha256: "bad" }), /BINDING_INVALID/);
  assert.throws(() => bindStewartDisneyRecoveryIdentityObservation({ ...ready, live_action_performed: true }, binding), /NOT_BINDABLE/);
});

test("rejects value-bearing observations so identity or secrets cannot enter receipts", () => {
  const controls = observation().controls.map((item) => item.id === "lookupValue" ? { ...item, hasValue: true } : item);
  assert.throws(() => compileStewartDisneyLiveSurfaceProbe(observation({ controls })), /VALUE_BEARING/);
});

test("fails closed on duplicate, wrong, hidden, disabled, or unexpected controls", () => {
  const base = observation().controls;
  for (const controls of [
    [...base, control()],
    base.map((item) => item.id === "lookupValue" ? { ...item, id: "email" } : item),
    base.map((item) => item.id === "lookupValue" ? { ...item, visible: false } : item),
    base.map((item) => item.id === "id-flow" ? { ...item, disabled: true } : item),
    [...base, control({ id: "other", name: "other" })],
  ]) {
    const receipt = compileStewartDisneyLiveSurfaceProbe(observation({ controls }));
    assert.equal(receipt.live_execution_ready, false);
    assert.notEqual(receipt.classification, "IDENTITY_LOOKUP_READY");
  }
});

test("rejects origin, provider, path, schema, digest, timestamp, and shape drift", () => {
  for (const patch of [
    { origin: "https://example.invalid" },
    { provider_id: "OTHER" },
    { pathname: "/other" },
    { schema: "wrong" },
    { route_epoch_sha256: "no" },
    { observed_at: "not-time" },
    { extra: true },
  ]) assert.throws(() => compileStewartDisneyLiveSurfaceProbe(observation(patch)), /OBSERVATION/);
});
