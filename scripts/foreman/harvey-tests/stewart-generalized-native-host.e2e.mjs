import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import test from "node:test";
import { chromium } from "playwright";

import { runStewartGeneralizedNativeHostOperation } from "../../../lib/harvey/stewart-generalized-native-host.mjs";
import {
  compileDisneyMyDisneyEmailOtpTransaction,
  projectDisneyMyDisneyPasswordConversion,
  runDisneyMyDisneyEmailOtpTransaction,
} from "../../../lib/harvey/disney-mydisney-email-otp-transaction.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (c) => c.repeat(64); const digest = (v) => createHash("sha256").update(canonicalJson(v)).digest("hex");
const now = Date.parse("2026-08-22T22:30:00.000Z"); const operator = generateIdentity();
const pin = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const fields = [{ role: "IDENTITY", control_sha256: h("1"), handle_ref_sha256: h("2") }, { role: "CURRENT_PASSWORD", control_sha256: h("3"), handle_ref_sha256: h("4") }];
const descriptor = { schema: "pookakind.stewart-provider-surface-descriptor/v1", field_descriptors: [{ role: "IDENTITY", control_sha256: h("1"), selector: "#identity" }, { role: "CURRENT_PASSWORD", control_sha256: h("3"), selector: "#password" }], final_control_descriptor: { control_sha256: h("5"), selector: "#submit" }, readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }, { response_class: "PROVIDER_REJECTED", selector: "#rejected" }] };
const shared = { account_ref_sha256: h("6"), canonical_origin_sha256: h("7"), route_epoch_sha256: h("8"), tab_id_sha256: h("9"), form_sha256: h("a"), final_control_sha256: h("5"), provider_response_contract_sha256: digest(descriptor) };
const payload = { schema: "pookakind.stewart-background-credential-authority/v1", ...shared, operation_id_sha256: h("b"), operation_kind: "SIGN_IN", fields, issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true };
const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256, payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256, digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
const authorityRecord = signDurableRecord(operator.private_key_pem, payload, { issuer: "pookakind-operator", audience });
const observation = { schema: "pookakind.stewart-background-credential-observation/v1", ...shared, field_controls: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(now - 100).toISOString() };
const handles = fields.map((field) => ({ schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: field.handle_ref_sha256 }));

test("signed host composition completes a synthetic background Chrome operation end to end", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const context = await browser.newContext(); const target = await context.newPage(); const foreground = await context.newPage();
  await target.setContent('<input id="identity"><input id="password" type="password"><button id="submit">Log in</button><script>submit.onclick=()=>{const x=document.createElement("div");x.id="accepted";document.body.append(x)}</script>');
  await target.addScriptTag({ path: resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js") }); await foreground.setContent("<h1>sentinel</h1>"); await foreground.bringToFront();
  const secrets = new Map([[h("2"), "synthetic@example.invalid"], [h("4"), "synthetic-password"]]); let claims = 0;
  const receipt = await runStewartGeneralizedNativeHostOperation({ authorityRecord, operatorAuthority: pin, descriptor, extension_id_sha256: h("c"), handles, now: () => now, randomBytes: () => Buffer.alloc(32, 9), consume: async () => { claims += 1; return claims === 1; }, resolveHandle: async (handle) => ({ resolved: true, material: secrets.get(handle.ref_sha256) }), observeExtension: async () => observation, executeExtension: async (value) => target.evaluate(({ descriptor: d, fields: f }) => globalThis.PookaKindStewartExtensionRuntime.execute(d, f), value), readExtension: async (value) => target.evaluate((d) => globalThis.PookaKindStewartExtensionRuntime.readback(d), value) });
  assert.equal(receipt.state, "SUBMISSION_ACCEPTED"); assert.equal(receipt.password_conversion, false); assert.equal(receipt.secret_material_returned, false); assert.equal(claims, 1);
  assert.equal((await foreground.locator("h1").textContent()), "sentinel");
});

test("replay and extension drift resolve no additional handles", async () => {
  let resolves = 0; let claimed = false;
  const base = { authorityRecord, operatorAuthority: pin, descriptor, extension_id_sha256: h("c"), handles, now: () => now, randomBytes: () => Buffer.alloc(32, 8), consume: async () => { if (claimed) return false; claimed = true; return true; }, resolveHandle: async () => { resolves += 1; return { resolved: true, material: "x" }; }, observeExtension: async () => observation, executeExtension: async () => { throw new Error("DRIFT"); }, readExtension: async () => ({ response_class: "OUTCOME_UNKNOWN" }) };
  await assert.rejects(runStewartGeneralizedNativeHostOperation(base), /DRIFT/); assert.equal(resolves, 2);
  const replay = await runStewartGeneralizedNativeHostOperation(base); assert.equal(replay.state, "ALREADY_CONSUMED"); assert.equal(resolves, 2);
});

function disneyFixture(at = now) {
  const roles = Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`);
  const handleRef = h("2");
  const scopedFields = roles.map((role, index) => ({ role, control_sha256: String(index + 3).repeat(64), handle_ref_sha256: handleRef }));
  const scopedDescriptor = {
    schema: "pookakind.stewart-provider-surface-descriptor/v1",
    field_descriptors: scopedFields.map(({ role, control_sha256 }, index) => ({ role, control_sha256, selector: `#otp-${index + 1}` })),
    final_control_descriptor: { control_sha256: h("a"), selector: "#continue" },
    readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }, { response_class: "PROVIDER_REJECTED", selector: "#rejected" }],
  };
  const scoped = { account_ref_sha256: h("b"), canonical_origin_sha256: h("c"), route_epoch_sha256: h("d"), tab_id_sha256: h("e"), form_sha256: h("f"), final_control_sha256: h("a"), provider_response_contract_sha256: digest(scopedDescriptor) };
  const scopedPayload = { schema: "pookakind.stewart-background-credential-authority/v1", ...scoped, operation_id_sha256: h("1"), operation_kind: "EMAIL_OTP_SUBMIT", fields: scopedFields, issued_at: new Date(at - 1_000).toISOString(), expires_at: new Date(at + 10_000).toISOString(), max_uses: 1, live_execution_authorized: true };
  const scopedAudience = ["stewart-background-credential-operation/v1", scopedPayload.operation_id_sha256, scopedPayload.account_ref_sha256, scopedPayload.canonical_origin_sha256, scopedPayload.route_epoch_sha256, scopedPayload.tab_id_sha256, scopedPayload.form_sha256, digest(scopedPayload.fields), scopedPayload.final_control_sha256, scopedPayload.provider_response_contract_sha256].join(":");
  const authority_record = signDurableRecord(operator.private_key_pem, scopedPayload, { issuer: "pookakind-operator", audience: scopedAudience });
  const scopedObservation = { schema: "pookakind.stewart-background-credential-observation/v1", ...scoped, field_controls: scopedFields.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(at - 100).toISOString() };
  const transaction = compileDisneyMyDisneyEmailOtpTransaction({ schema: "pookakind.disney-mydisney-email-otp-input/v1", provider: "Disney MyDisney", selection_receipt_sha256: "1520d8ccaa442b70073b39f74790ae7118273c35f2c316d081fd2d7f79cebcd8", authority_record, operator_authority: pin, observation: scopedObservation, descriptor: scopedDescriptor, extension_id_sha256: h("7"), otp_handle: { schema: "pookakind.stewart-private-inbox-email-otp-handle/v1", ref_sha256: handleRef } }, at);
  return { roles, descriptor: scopedDescriptor, observation: scopedObservation, transaction };
}

test("Disney composition performs one exact six-control background flow and enforces the three-proof completion rule", async (t) => {
  const fixture = disneyFixture();
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const context = await browser.newContext(); const target = await context.newPage(); const foreground = await context.newPage();
  await target.setContent(`<!doctype html>${fixture.roles.map((_role, index) => `<input id="otp-${index + 1}" maxlength="1">`).join("")}<button id="continue">Continue</button><script>document.querySelector("#continue").onclick=()=>{const x=document.createElement("div");x.id="accepted";document.body.append(x);globalThis.submitCount=(globalThis.submitCount||0)+1}</script>`);
  await target.addScriptTag({ path: resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js") });
  await foreground.setContent("<h1>sentinel</h1>"); await foreground.bringToFront();
  const source = { resolved: true, material: "123456" }; let claims = 0; let resolves = 0;
  const receipt = await runDisneyMyDisneyEmailOtpTransaction({ transaction: fixture.transaction,
    consume: async () => { claims += 1; return claims === 1; }, resolveHandle: async () => { resolves += 1; return source; },
    observeExtension: async () => fixture.observation,
    executeExtension: async (value) => target.evaluate(({ descriptor: scopedDescriptor, fields: supplied }) => globalThis.PookaKindStewartExtensionRuntime.execute(scopedDescriptor, supplied), { descriptor: value.descriptor, fields: value.fields }),
    readExtension: async (value) => target.evaluate((scopedDescriptor) => globalThis.PookaKindStewartExtensionRuntime.readback(scopedDescriptor), value),
    now: () => now, randomBytes: () => Buffer.alloc(32, 6),
  });
  assert.equal(receipt.state, "SUBMISSION_ACCEPTED"); assert.equal(receipt.password_conversion, false);
  assert.equal(claims, 1); assert.equal(resolves, 1); assert.equal(source.material, null);
  assert.deepEqual(await target.locator("input").evaluateAll((nodes) => nodes.map(({ value }) => value)), ["1", "2", "3", "4", "5", "6"]);
  assert.equal(await target.evaluate(() => globalThis.submitCount), 1); assert.equal(await foreground.locator("h1").textContent(), "sentinel");
  const replay = await runDisneyMyDisneyEmailOtpTransaction({ transaction: fixture.transaction, consume: async () => false, resolveHandle: async () => { throw new Error("SHOULD_NOT_RESOLVE"); }, observeExtension: async () => fixture.observation, executeExtension: async () => { throw new Error("SHOULD_NOT_EXECUTE"); }, readExtension: async () => { throw new Error("SHOULD_NOT_READ"); }, now: () => now, randomBytes: () => Buffer.alloc(32, 6) });
  assert.equal(replay.state, "ALREADY_CONSUMED"); assert.equal(resolves, 1); assert.equal(await target.evaluate(() => globalThis.submitCount), 1);

  const account = h("b"); const passwordChange = h("6");
  const completion = { schema: "pookakind.disney-mydisney-password-completion-input/v1", transaction: fixture.transaction,
    otp_receipt: receipt,
    password_reset_receipt: { schema: "pookakind.disney-mydisney-password-reset-receipt/v1", provider_id: "DISNEY_MYDISNEY", state: "PROVIDER_PASSWORD_CHANGE_ACCEPTED", transaction_sha256: fixture.transaction.transaction_sha256, account_ref_sha256: account, password_change_sha256: passwordChange, provider_state_sha256: h("4") },
    fresh_sign_in_receipt: { schema: "pookakind.disney-mydisney-fresh-sign-in-receipt/v1", provider_id: "DISNEY_MYDISNEY", state: "FRESH_SIGN_IN_ACCEPTED", fresh: true, credential_method: "BLIND_MASTER_PASSWORD", account_ref_sha256: account, password_change_sha256: passwordChange, provider_state_sha256: h("5"), observed_at: new Date(now + 20_000).toISOString() },
    vault_reconciliation_receipt: { schema: "pookakind.disney-mydisney-vault-reconciliation-receipt/v1", provider_id: "DISNEY_MYDISNEY", account_ref_sha256: account, password_change_sha256: passwordChange, vault_item_ref_sha256: h("7"), readback_sha256: h("8"), exact_match_count: 1, duplicate_count: 0, credential_status: "VERIFIED_CURRENT", observed_at: new Date(now + 21_000).toISOString() } };
  assert.throws(() => projectDisneyMyDisneyPasswordConversion({ ...completion, fresh_sign_in_receipt: { ...completion.fresh_sign_in_receipt, fresh: false } }), /FRESH_SIGN_IN_MISSING/);
  const converted = projectDisneyMyDisneyPasswordConversion(completion); assert.equal(converted.password_conversion, true); assert.equal(converted.fixed, true);
});

test("Disney background failure releases the factor reference before any field or final-control mutation", async (t) => {
  const fixture = disneyFixture();
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(`<!doctype html>${fixture.roles.map((_role, index) => `<input id="otp-${index + 1}" maxlength="1">`).join("")}<button id="continue">Continue</button><script>document.querySelector("#continue").onclick=()=>{globalThis.submitCount=(globalThis.submitCount||0)+1}</script>`);
  await page.addScriptTag({ path: resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js") });
  const source = { resolved: true, material: "12x456" };
  await assert.rejects(runDisneyMyDisneyEmailOtpTransaction({ transaction: fixture.transaction, consume: async () => true, resolveHandle: async () => source, observeExtension: async () => fixture.observation, executeExtension: async (value) => page.evaluate(({ descriptor: scopedDescriptor, fields: supplied }) => globalThis.PookaKindStewartExtensionRuntime.execute(scopedDescriptor, supplied), { descriptor: value.descriptor, fields: value.fields }), readExtension: async () => ({ response_class: "OUTCOME_UNKNOWN" }), now: () => now }), /OTP_RESOLUTION_FAILED/);
  assert.equal(source.material, null);
  assert.deepEqual(await page.locator("input").evaluateAll((nodes) => nodes.map(({ value }) => value)), ["", "", "", "", "", ""]);
  assert.equal(await page.evaluate(() => globalThis.submitCount || 0), 0);
});
