import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SWATEYES_PASSWORD_GATE_SCHEMA, decideSwateyesPasswordGate } from "../../../lib/harvey/swateyes-password-gate.mjs";
import { compileCredentialSourceReadiness } from "../../../lib/harvey/credential-source-readiness.mjs";

const NOW = Date.parse("2026-08-29T12:00:00.000Z");
const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const readiness = (overrides = {}) => compileCredentialSourceReadiness({
  schema: "pookakind.credential-source-observation/v1",
  machine: "Doss",
  browser_profile_sha256: "d".repeat(64),
  provider_scope_sha256: "e".repeat(64),
  account_scope_sha256: A,
  observed_at: "2026-08-29T12:00:00.000Z",
  active_match_count: 1,
  archived_match_count: 0,
  cache_state: "FRESH_REBUILT",
  extension_installed: true,
  secret_material_present: false,
  cursor_keyboard_clipboard_touched: false,
  ...overrides,
}, NOW);

const request = (overrides = {}) => ({
  schema: SWATEYES_PASSWORD_GATE_SCHEMA,
  request_id: "password-gate-001",
  observed_at: "2026-08-29T12:00:00.000Z",
  machine: "Doss",
  project_id: "PookaKind",
  account_scope_sha256: A,
  action: "PASSWORD_CHANGE",
  gate_class: "PROVIDER_PASSWORD",
  provider_control_unbypassable: false,
  windows_security_supported_control_proved: false,
  opaque_handle: { handle_id_sha256: B, broker_request_sha256: C, kind: "BLIND_PASSWORD", raw_secret_present: false },
  credential_source_readiness: readiness(),
  ...overrides,
});
const authority = (overrides = {}) => ({
  schema: "werkles.swateyes.password-authority/v1",
  receipt_id: "ben-password-authority-001",
  status: "APPROVED",
  granted_by: "BEN_OPERATOR",
  machine: "Doss",
  project_id: "PookaKind",
  account_scope_sha256: A,
  action: "PASSWORD_CHANGE",
  gate_class: "PROVIDER_PASSWORD",
  issued_at: "2026-08-29T11:00:00.000Z",
  expires_at: "2026-08-29T13:00:00.000Z",
  maximum_uses: 1,
  ...overrides,
});
const broker = (overrides = {}) => ({
  schema: "werkles.blind-broker-proof/v1",
  broker_id: "stewart-blind-broker",
  broker_contract_sha256: "d".repeat(64),
  dispatch_sha256: C,
  proved: true,
  one_shot: true,
  ...overrides,
});

function decide(input) {
  return decideSwateyesPasswordGate({
    unspent_authority_receipt_ids: [input.authority.receipt_id],
    ...input,
  });
}

test("routes one opaque operation under exact prior authority without credential access", () => {
  const decision = decide({ request: request(), authority: authority(), broker: broker(), now: NOW });
  assert.equal(decision.classification, "REDUNDANT_NON_HUMAN_PERMISSION");
  assert.equal(decision.broker_route.maximum_uses, 1);
  assert.equal(decision.broker_route.handle_id_sha256, B);
  assert.equal(decision.broker_route.credential_source_observation_sha256, readiness().observation_sha256);
  assert.deepEqual(new Set(Object.values(decision.authority_boundary)), new Set([false]));
});

test("blocks Stewart dispatch when the provider has zero or multiple current credential candidates", () => {
  for (const [count, state] of [[0, "NO_ACTIVE_CREDENTIAL"], [2, "AMBIGUOUS_ACTIVE_CREDENTIALS"]]) {
    const decision = decide({ request: request({ credential_source_readiness: readiness({ active_match_count: count }) }), authority: authority(), broker: broker(), now: NOW });
    assert.equal(decision.classification, "CREDENTIAL_SOURCE_BLOCKED");
    assert.equal(decision.reason, state);
    assert.equal(decision.broker_route, null);
    assert.equal(decision.authority_boundary.stale_or_ambiguous_credential_selected, false);
  }
});

test("fails closed for machine, project, account, action, gate, expiry, and revocation drift", () => {
  for (const changed of [
    authority({ machine: "Spanzee" }), authority({ project_id: "Other" }), authority({ account_scope_sha256: "e".repeat(64) }),
    authority({ action: "SIGNED_OUT_PASSWORD_SIGN_IN" }), authority({ gate_class: "INTERNAL_PERMISSION" }),
  ]) assert.throws(() => decide({ request: request(), authority: changed, broker: broker(), now: NOW }), /SCOPE_OR_TIME_MISMATCH/);
  assert.throws(() => decide({ request: request(), authority: authority({ expires_at: "2026-08-29T12:00:00.000Z" }), broker: broker(), now: NOW }), /EXPIRED_OR_FUTURE/);
  assert.throws(() => decide({ request: request(), authority: authority({ status: "REVOKED" }), broker: broker(), now: NOW }), /AUTHORITY_INVALID/);
});

test("blocks accumulation of individually valid one-use authorities", () => {
  assert.throws(() => decideSwateyesPasswordGate({
    request: request(),
    authority: authority(),
    broker: broker(),
    unspent_authority_receipt_ids: ["ben-password-authority-001", "ben-password-authority-002"],
    now: NOW,
  }), /AGGREGATE_AUTHORITY_BLOCKED/);
  assert.throws(() => decideSwateyesPasswordGate({ request: request(), authority: authority(), broker: broker(), unspent_authority_receipt_ids: [], now: NOW }), /AGGREGATE_AUTHORITY_BLOCKED/);
});

test("preserves Windows Security as a human gate until supported-control proof exists", () => {
  const wsRequest = request({ action: "WINDOWS_SECURITY_PIN", gate_class: "WINDOWS_SECURITY", opaque_handle: { handle_id_sha256: B, broker_request_sha256: C, kind: "BLIND_PIN", raw_secret_present: false } });
  const wsAuthority = authority({ action: "WINDOWS_SECURITY_PIN", gate_class: "WINDOWS_SECURITY" });
  assert.equal(decide({ request: wsRequest, authority: wsAuthority, broker: broker(), now: NOW }).classification, "TRUE_HUMAN_GATE");
  assert.equal(decide({ request: { ...wsRequest, windows_security_supported_control_proved: true }, authority: wsAuthority, broker: broker(), now: NOW }).classification, "REDUNDANT_NON_HUMAN_PERMISSION");
});

test("does not disguise provider-owned controls as redundant permission", () => {
  const decision = decide({ request: request({ provider_control_unbypassable: true }), authority: authority(), broker: broker(), now: NOW });
  assert.equal(decision.classification, "PROVIDER_CONTROL_UNBYPASSABLE");
  assert.equal(decision.broker_route, null);
});

test("rejects raw-secret fields, unproved brokers, wrong binding, and replay", () => {
  assert.throws(() => decide({ request: request({ opaque_handle: { handle_id_sha256: B, broker_request_sha256: C, kind: "BLIND_PASSWORD", raw_secret_present: true } }), authority: authority(), broker: broker(), now: NOW }), /OPAQUE_HANDLE_INVALID/);
  assert.throws(() => decide({ request: { ...request(), password: "not allowed" }, authority: authority(), broker: broker(), now: NOW }), /GATE_INVALID/);
  assert.throws(() => decide({ request: request(), authority: authority(), broker: broker({ proved: false }), now: NOW }), /BROKER_UNPROVED/);
  assert.throws(() => decide({ request: request(), authority: authority(), broker: broker({ dispatch_sha256: "e".repeat(64) }), now: NOW }), /BROKER_BINDING_INVALID/);
  assert.throws(() => decide({ request: request(), authority: authority(), broker: broker(), consumed_dispatch_sha256s: [C], now: NOW }), /BROKER_REPLAY/);
});

test("adapter source contains no live input, consent, Windows Security bypass, or secret-resolution primitive", async () => {
  const source = await readFile(new URL("../../../lib/harvey/swateyes-password-gate.mjs", import.meta.url), "utf8");
  for (const forbidden of ["fetch(", "child_process", "SendKeys", "SendInput", "clipboard", "navigator", "CredentialUIBroker", "DPAPI", "decrypt", "setInterval(", "setTimeout(", "writeFile("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
