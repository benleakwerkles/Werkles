import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createConnection, createServer } from "node:net";
import test from "node:test";

import { compileCredentialSourceReadiness } from "../../../lib/harvey/credential-source-readiness.mjs";
import { runStewartSwateyesPrivateBroker } from "../../../lib/harvey/stewart-swateyes-private-broker.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const now = Date.parse("2026-08-29T12:00:00.000Z");
const H = (char) => char.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const operator = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const fields = [
  { role: "IDENTITY", control_sha256: H("1"), handle_ref_sha256: H("2") },
  { role: "CURRENT_PASSWORD", control_sha256: H("3"), handle_ref_sha256: H("4") },
];
const shared = { account_ref_sha256: H("5"), canonical_origin_sha256: H("6"), route_epoch_sha256: H("7"), tab_id_sha256: H("8"), form_sha256: H("9"), final_control_sha256: H("a"), provider_response_contract_sha256: H("b") };
const payload = (patch = {}) => ({ schema: "pookakind.stewart-background-credential-authority/v1", ...shared, operation_id_sha256: H("c"), operation_kind: "SIGN_IN", fields, issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true, ...patch });
const audience = (value) => ["stewart-background-credential-operation/v1", value.operation_id_sha256, value.account_ref_sha256, value.canonical_origin_sha256, value.route_epoch_sha256, value.tab_id_sha256, value.form_sha256, digest(value.fields), value.final_control_sha256, value.provider_response_contract_sha256].join(":");
const signed = (patch = {}) => { const value = payload(patch); return signDurableRecord(operator.private_key_pem, value, { issuer: "pookakind-operator", audience: audience(value) }); };
const observation = (value = payload()) => ({ schema: "pookakind.stewart-background-credential-observation/v1", ...shared, field_controls: value.fields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(now - 500).toISOString() });
const envelope = Buffer.from("synthetic-opaque-cms-envelope");
const dispatch = sha(envelope);
const readiness = compileCredentialSourceReadiness({ schema: "pookakind.credential-source-observation/v1", machine: "Doss", browser_profile_sha256: H("d"), provider_scope_sha256: shared.canonical_origin_sha256, account_scope_sha256: shared.account_ref_sha256, observed_at: new Date(now - 500).toISOString(), active_match_count: 1, archived_match_count: 0, cache_state: "FRESH_REBUILT", extension_installed: true, secret_material_present: false, cursor_keyboard_clipboard_touched: false }, now);
const request = (patch = {}) => ({ schema: "werkles.swateyes.password-gate/v2", request_id: "private-broker-001", observed_at: new Date(now - 500).toISOString(), machine: "Doss", project_id: "PookaKind", account_scope_sha256: shared.account_ref_sha256, action: "SIGNED_OUT_PASSWORD_SIGN_IN", gate_class: "PROVIDER_PASSWORD", provider_control_unbypassable: false, windows_security_supported_control_proved: false, opaque_handle: { handle_id_sha256: H("4"), broker_request_sha256: dispatch, kind: "BLIND_PASSWORD", raw_secret_present: false }, credential_source_readiness: readiness, ...patch });
const authority = (patch = {}) => ({ schema: "werkles.swateyes.password-authority/v1", receipt_id: "ben-private-broker-001", status: "APPROVED", granted_by: "BEN_OPERATOR", machine: "Doss", project_id: "PookaKind", account_scope_sha256: shared.account_ref_sha256, action: "SIGNED_OUT_PASSWORD_SIGN_IN", gate_class: "PROVIDER_PASSWORD", issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), maximum_uses: 1, ...patch });
const broker = (patch = {}) => ({ schema: "werkles.blind-broker-proof/v1", broker_id: "PookaKindPrivateCredentialBrokerV1", broker_contract_sha256: H("f"), dispatch_sha256: dispatch, proved: true, one_shot: true, ...patch });
const input = (patch = {}) => ({ authorityRecord: signed(), operatorAuthority: pin, observation: observation(), swateyesRequest: request(), swateyesAuthority: authority(), brokerProof: broker(), unspentAuthorityReceiptIds: ["ben-private-broker-001"], signedEnvelope: envelope, now, ...patch });

async function withServer(response, work) {
  const frames = [];
  const server = createServer((socket) => {
    socket.on("data", (bytes) => {
      frames.push(bytes);
      if (response !== null) socket.end(response);
      else socket.destroy();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try { return await work({ connect: () => createConnection(server.address().port, "127.0.0.1"), frames }); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("one exact opaque request reaches a one-shot broker without plaintext or conversion credit", async () => {
  await withServer("SUBMITTED_ONCE_PROVIDER_UNVERIFIED", async ({ connect, frames }) => {
    const result = await runStewartSwateyesPrivateBroker(input({ connect }));
    assert.equal(result.state, "SUBMITTED_ONCE_PROVIDER_UNVERIFIED");
    assert.equal(result.password_conversion, false);
    const sent = Buffer.concat(frames);
    assert.equal(sent.readInt32LE(0), envelope.length);
    assert.deepEqual(sent.subarray(4), envelope);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-opaque|private-identity|private-password/i);
  });
});

test("mismatched action, account, handle, envelope, and revoked authority never dispatch", async () => {
  let calls = 0;
  const connect = () => { calls++; throw new Error("unexpected dispatch"); };
  for (const changed of [
    { swateyesRequest: request({ action: "PASSWORD_CHANGE" }) },
    { swateyesRequest: request({ account_scope_sha256: H("d") }) },
    { swateyesRequest: request({ credential_source_readiness: { ...readiness, provider_scope_sha256: H("e") } }) },
    { swateyesRequest: request({ opaque_handle: { ...request().opaque_handle, handle_id_sha256: H("d") } }) },
    { signedEnvelope: Buffer.from("different-envelope") },
    { swateyesAuthority: authority({ status: "REVOKED" }) },
    { consumedDispatchSha256s: [dispatch] },
  ]) await assert.rejects(runStewartSwateyesPrivateBroker(input({ ...changed, connect })), /CONFLICT|INVALID|REPLAY/);
  assert.equal(calls, 0);
});

test("unknown broker reply and post-dispatch disconnect remain do-not-resend", async () => {
  await withServer("UNRECOGNIZED", async ({ connect }) => {
    const result = await runStewartSwateyesPrivateBroker(input({ connect }));
    assert.equal(result.state, "SUBMISSION_UNKNOWN_DO_NOT_RESEND");
  });
  await withServer(null, async ({ connect }) => {
    const result = await runStewartSwateyesPrivateBroker(input({ connect }));
    assert.equal(result.state, "SUBMISSION_UNKNOWN_DO_NOT_RESEND");
  });
});

test("unavailable broker is distinct from a submitted attempt", async () => {
  const result = await runStewartSwateyesPrivateBroker(input({ connect: () => { throw new Error("offline"); } }));
  assert.equal(result.state, "BROKER_UNAVAILABLE_NO_DISPATCH");
});

test("password-reset leg requires one shared new/confirm handle and exact change authority", async () => {
  const resetFields = [
    { role: "NEW_PASSWORD", control_sha256: H("1"), handle_ref_sha256: H("4") },
    { role: "CONFIRM_PASSWORD", control_sha256: H("3"), handle_ref_sha256: H("4") },
  ];
  const resetPayload = payload({ operation_kind: "PASSWORD_RESET", fields: resetFields });
  const reset = {
    authorityRecord: signed({ operation_kind: "PASSWORD_RESET", fields: resetFields }),
    observation: observation(resetPayload),
    swateyesRequest: request({ action: "PASSWORD_CHANGE" }),
    swateyesAuthority: authority({ action: "PASSWORD_CHANGE" }),
  };
  await withServer("SUBMITTED_ONCE_PROVIDER_UNVERIFIED", async ({ connect }) => {
    const result = await runStewartSwateyesPrivateBroker(input({ ...reset, connect }));
    assert.equal(result.password_conversion, false);
    assert.equal(result.state, "SUBMITTED_ONCE_PROVIDER_UNVERIFIED");
  });
  const differentConfirm = [...resetFields.slice(0, 1), { ...resetFields[1], handle_ref_sha256: H("d") }];
  let calls = 0;
  await assert.rejects(runStewartSwateyesPrivateBroker(input({
    ...reset, authorityRecord: signed({ operation_kind: "PASSWORD_RESET", fields: differentConfirm }),
    observation: observation(payload({ operation_kind: "PASSWORD_RESET", fields: differentConfirm })),
    connect: () => { calls++; throw new Error("unexpected dispatch"); },
  })), /RESET_HANDLE_CONFLICT/);
  assert.equal(calls, 0);
});
