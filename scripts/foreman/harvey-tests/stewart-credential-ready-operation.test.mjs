import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileCredentialSourceReadiness } from "../../../lib/harvey/credential-source-readiness.mjs";
import { compileStewartCredentialReadyOperation, runStewartCredentialReadyOperation } from "../../../lib/harvey/stewart-credential-ready-operation.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const NOW = Date.parse("2026-09-19T21:00:00.000Z");
const H = (character) => character.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const operator = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const fields = [{ role: "CURRENT_PASSWORD", control_sha256: H("1"), handle_ref_sha256: H("2") }];
const shared = { account_ref_sha256: H("3"), canonical_origin_sha256: H("4"), route_epoch_sha256: H("5"), tab_id_sha256: H("6"), form_sha256: H("7"), final_control_sha256: H("8"), provider_response_contract_sha256: H("9") };
const payload = { schema: "pookakind.stewart-background-credential-authority/v1", ...shared, operation_id_sha256: H("a"), operation_kind: "PASSWORD_FALLBACK_SIGN_IN", fields, issued_at: new Date(NOW - 1000).toISOString(), expires_at: new Date(NOW + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true };
const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256, payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256, digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
const authorityRecord = signDurableRecord(operator.private_key_pem, payload, { issuer: "pookakind-operator", audience });
const observation = { schema: "pookakind.stewart-background-credential-observation/v1", ...shared, field_controls: fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(NOW - 500).toISOString() };
const source = (count = 1) => compileCredentialSourceReadiness({ schema: "pookakind.credential-source-observation/v1", machine: "Doss", browser_profile_sha256: H("b"), provider_scope_sha256: shared.canonical_origin_sha256, account_scope_sha256: shared.account_ref_sha256, observed_at: new Date(NOW).toISOString(), active_match_count: count, archived_match_count: 0, cache_state: "FRESH_RESET", extension_installed: true, secret_material_present: false, cursor_keyboard_clipboard_touched: false }, NOW);

test("Stewart executes only after exact-one current credential readiness", async () => {
  const compiled = compileStewartCredentialReadyOperation({ credentialSourceReadiness: source(), authorityRecord, operatorAuthority: pin, observation, machine: "Doss", now: NOW });
  const receipt = await runStewartCredentialReadyOperation({ compiled, now: NOW,
    handles: [{ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: H("2") }],
    consume: async () => true,
    resolveHandle: async () => ({ resolved: true, material: "synthetic-private-value" }),
    executeBackgroundForm: async () => ({ field_count: 1, field_roles_sha256: digest(["CURRENT_PASSWORD"]), final_control_count: 1, final_control_invoked: true, foreground_changed: false, cursor_touched: false, keyboard_touched: false, clipboard_touched: false, secret_material_exposed: false }),
    readback: async (command) => ({ schema: "pookakind.stewart-background-credential-provider-readback/v1", request_sha256: command.request_sha256, canonical_origin_sha256: command.canonical_origin_sha256, route_epoch_sha256: command.route_epoch_sha256, tab_id_sha256: command.tab_id_sha256, provider_response_contract_sha256: command.provider_response_contract_sha256, provider_state_sha256: H("c"), response_class: "PROVIDER_ACCEPTED" }),
  });
  assert.equal(receipt.state, "SUBMISSION_ACCEPTED"); assert.equal(receipt.password_conversion, false);
});
test("ambiguous provider items block before Stewart authority or handles are touched", () => {
  assert.throws(() => compileStewartCredentialReadyOperation({ credentialSourceReadiness: source(2), authorityRecord: {}, operatorAuthority: {}, observation: {}, machine: "Doss", now: NOW }), /AMBIGUOUS_ACTIVE_CREDENTIALS/);
});

test("machine, account, provider and readiness digest substitution fail closed", async () => {
  assert.throws(() => compileStewartCredentialReadyOperation({ credentialSourceReadiness: source(), authorityRecord, operatorAuthority: pin, observation, machine: "Spanzee", now: NOW }), /SCOPE_MISMATCH/);
  const compiled = compileStewartCredentialReadyOperation({ credentialSourceReadiness: source(), authorityRecord, operatorAuthority: pin, observation, machine: "Doss", now: NOW });
  await assert.rejects(runStewartCredentialReadyOperation({ compiled: { ...compiled, credential_source_readiness_sha256: H("f") }, now: NOW }), /WRAPPER_INVALID/);
});
