import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { chromium } from "playwright";

import {
  STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR,
  compileStewartAmazonPasswordFallback,
  projectStewartAmazonSessionTerminal,
  runStewartAmazonPasswordFallback,
  validateAmazonCanonicalSignInRoute,
} from "../../../lib/harvey/stewart-generalized-amazon-sign-in.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const hash = (value) => value.repeat(64);
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const textDigest = (value) => createHash("sha256").update(String(value), "utf8").digest("hex");
const now = Date.parse("2026-08-24T04:30:00.000Z");
const operator = generateIdentity();
const operatorAuthority = { schema: "pookakind.operator-authority-pin/v1", public_key_pem: operator.public_key_pem, public_key_sha256: operator.public_key_sha256 };
const accountHandle = { schema: "pookakind.stewart-opaque-account-handle/v1", ref_sha256: hash("a") };
const passwordHandle = { schema: "pookakind.stewart-opaque-credential-handle/v1", ref_sha256: hash("b") };

function routeUrl(patch = {}) {
  const account = new URL("https://www.amazon.com/your-account");
  const destination = new URL("https://www.amazon.com/ap/cnep"); destination.searchParams.set("orig_return_to", account.href);
  const route = new URL("https://www.amazon.com/ap/signin");
  route.searchParams.set("openid.mode", "checkid_setup");
  route.searchParams.set("openid.return_to", destination.href);
  route.searchParams.set("intercept", "false");
  route.searchParams.set("fct", "fresh-current-session-only");
  for (const [key, value] of Object.entries(patch)) value === null ? route.searchParams.delete(key) : route.searchParams.set(key, value);
  return route.href;
}
function fixture({ live = false, route = routeUrl(), payloadPatch = {}, observationPatch = {}, inputPatch = {} } = {}) {
  const routeBinding = validateAmazonCanonicalSignInRoute(route);
  const field = { role: "CURRENT_PASSWORD", control_sha256: STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR.field_descriptors[0].control_sha256, handle_ref_sha256: passwordHandle.ref_sha256 };
  const payload = {
    schema: "pookakind.stewart-background-credential-authority/v1",
    operation_id_sha256: hash("c"), account_ref_sha256: accountHandle.ref_sha256,
    operation_kind: "PASSWORD_FALLBACK_SIGN_IN", canonical_origin_sha256: routeBinding.canonical_origin_sha256,
    route_epoch_sha256: routeBinding.route_epoch_sha256, tab_id_sha256: hash("d"), form_sha256: hash("e"),
    fields: [field], final_control_sha256: STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR.final_control_descriptor.control_sha256,
    provider_response_contract_sha256: digest(STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR),
    issued_at: new Date(now - 1_000).toISOString(), expires_at: new Date(now + 10_000).toISOString(),
    max_uses: 1, live_execution_authorized: live, ...payloadPatch,
  };
  const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256,
    payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256,
    digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
  const authorityRecord = signDurableRecord(operator.private_key_pem, payload, { issuer: "pookakind-operator", audience });
  const observation = {
    schema: "pookakind.stewart-background-credential-observation/v1",
    account_ref_sha256: payload.account_ref_sha256, canonical_origin_sha256: payload.canonical_origin_sha256,
    route_epoch_sha256: payload.route_epoch_sha256, tab_id_sha256: payload.tab_id_sha256, form_sha256: payload.form_sha256,
    field_controls: [{ role: field.role, control_sha256: field.control_sha256 }], final_control_count: 1,
    final_control_enabled: true, final_control_sha256: payload.final_control_sha256, unexpected_field_count: 0,
    provider_response_contract_sha256: payload.provider_response_contract_sha256, secret_material_present: false,
    observed_at: new Date(now - 100).toISOString(), ...observationPatch,
  };
  const input = {
    schema: "pookakind.stewart-amazon-password-fallback-input/v1", provider_id: "AMAZON", route_url: route,
    account_handle: accountHandle, password_handle: passwordHandle, authority_record: authorityRecord,
    operator_authority: operatorAuthority, descriptor: STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR,
    observation, extension_id_sha256: hash("f"), ...inputPatch,
  };
  return { input, observation, transaction: compileStewartAmazonPasswordFallback(input, now) };
}
const syntheticReceipt = { schema: "pookakind.stewart-generalized-session-synthetic-receipt/v1", state: "PASS", provider_contacted: false, secret_material_used: false };

test("compiles a source-only Amazon password fallback with exact account and Blind Master custody", () => {
  const { transaction } = fixture();
  assert.equal(transaction.state, "SOURCE_CUSTODIED_NOT_ACTIVATED");
  assert.equal(transaction.route.canonical_origin, "https://www.amazon.com");
  assert.equal(transaction.route.pathname, "/ap/signin");
  assert.equal(transaction.account_handle.ref_sha256, accountHandle.ref_sha256);
  assert.equal(transaction.password_handle.ref_sha256, passwordHandle.ref_sha256);
  assert.equal(transaction.synthetic_https_required_first, true);
  assert.equal(transaction.max_uses, 1); assert.equal(transaction.recurrence, false);
  assert.equal(transaction.password_conversion, false); assert.equal(transaction.secret_material_output, false);
});

test("wrong origin, route, tab, or account fails before any executor can resolve a handle", () => {
  for (const route of [
    routeUrl({ "openid.mode": "reauth" }),
    routeUrl().replace("www.amazon.com", "amazon.example"),
    routeUrl().replace("/ap/signin", "/ap/forgotpassword"),
  ]) assert.throws(() => validateAmazonCanonicalSignInRoute(route), /ROUTE_INVALID/);
  assert.throws(() => fixture({ observationPatch: { tab_id_sha256: hash("0") } }), /CUSTODY_CONFLICT/);
  assert.throws(() => fixture({ inputPatch: { account_handle: { ...accountHandle, ref_sha256: hash("0") } } }), /AUTHORITY_SCOPE_INVALID/);
});

test("passkey, WebAuthn, and possession routes are rejected before surface admission", () => {
  for (const patch of [
    { "openid.pape.preferred_auth_policies": "SinglefactorWithPossessionChallenge" },
    { auth_method: "passkey" },
    { challenge: "WebAuthn" },
  ]) assert.throws(() => validateAmazonCanonicalSignInRoute(routeUrl(patch)), /ROUTE_INVALID/);
});

test("passkey-only, missing password, extra credential field, and duplicate final control fail closed", () => {
  assert.throws(() => fixture({ observationPatch: { field_controls: [] } }), /SURFACE_INVALID/);
  assert.throws(() => fixture({ observationPatch: { field_controls: [{ role: "CURRENT_PASSWORD", control_sha256: hash("1") }, { role: "IDENTITY", control_sha256: hash("2") }], unexpected_field_count: 1 } }), /SURFACE_INVALID/);
  assert.throws(() => fixture({ observationPatch: { final_control_count: 2 } }), /SURFACE_INVALID/);
  assert.throws(() => fixture({ observationPatch: { final_control_enabled: false } }), /SCOPE_INVALID/);
});

test("provider-neutral DOM runtime admits Amazon's noncredential checkbox but rejects another credential or final control", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent('<input id="ap_password" type="password"><input id="remember" type="checkbox"><input id="signInSubmit" type="submit"><div id="auth-error-message-box" hidden></div>');
  await page.addScriptTag({ path: resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js") });
  const observation = await page.evaluate((descriptor) => globalThis.PookaKindStewartExtensionRuntime.observe(descriptor), STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR);
  assert.equal(observation.field_controls.length, 1); assert.equal(observation.unexpected_field_count, 0);
  await page.evaluate(() => { const extra = document.createElement("input"); extra.type = "password"; extra.id = "hostile-extra"; document.body.append(extra); });
  await assert.rejects(page.evaluate((descriptor) => globalThis.PookaKindStewartExtensionRuntime.observe(descriptor), STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR), /FIELD_SCOPE_NOT_EXACT/);
  await page.evaluate(() => document.querySelector("#hostile-extra").remove());
  await page.evaluate(() => { const duplicate = document.createElement("input"); duplicate.type = "submit"; duplicate.id = "signInSubmit"; document.body.append(duplicate); });
  await assert.rejects(page.evaluate((descriptor) => globalThis.PookaKindStewartExtensionRuntime.observe(descriptor), STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR), /CONTROL_NOT_EXACT/);
});

test("a passkey control makes the password-only final control unavailable", async (t) => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent('<input id="ap_password" type="password"><button id="use-passkey">Use a passkey</button><input id="signInSubmit" type="submit"><div id="auth-error-message-box" hidden></div>');
  await page.addScriptTag({ path: resolve("scripts/foreman/stewart-generalized-extension/content-runtime.js") });
  await assert.rejects(page.evaluate((descriptor) => globalThis.PookaKindStewartExtensionRuntime.observe(descriptor), STEWART_AMAZON_PASSWORD_FALLBACK_DESCRIPTOR), /CONTROL_NOT_EXACT/);
});

test("synthetic proof is mandatory before the one-shot operation and premature native-port close remains fail-closed", async () => {
  const { transaction } = fixture({ live: true }); let calls = 0;
  await assert.rejects(runStewartAmazonPasswordFallback({ transaction, synthetic_receipt: null, observeExtension: () => { calls++; }, executeExtension: () => { calls++; }, readExtension: () => { calls++; }, consume: () => true, resolveHandle: () => { calls++; } }), /SYNTHETIC_PROOF_REQUIRED/);
  assert.equal(calls, 0);
  const worker = readFileSync("scripts/foreman/stewart-generalized-extension/service-worker.js", "utf8");
  assert.match(worker, /readbackSent: false/);
  assert.match(worker, /readback-request\/v1" && !session\.readbackSent[\s\S]*session\.readbackSent = true/);
  assert.match(worker, /session\.url === SYNTHETIC_URL && session\.readbackSent[\s\S]*frame\.state === "SUBMISSION_ACCEPTED"[\s\S]*session\.terminal = true[\s\S]*close\(tabId\)/);
});

test("one opaque password submission returns only sanitized acceptance and replay resolves nothing", async () => {
  const { transaction, observation } = fixture({ live: true }); const secret = "synthetic-blind-master-never-output";
  let consumes = 0; let resolves = 0; let executions = 0; let readbacks = 0; let received;
  const dependencies = {
    transaction, synthetic_receipt: syntheticReceipt,
    observeExtension: async () => observation,
    executeExtension: async ({ fields }) => { executions += 1; received = fields; return { schema: "pookakind.stewart-extension-dom-execution/v1", field_count: 1, field_roles: ["CURRENT_PASSWORD"], final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false }; },
    readExtension: async () => { readbacks += 1; return { schema: "pookakind.stewart-extension-dom-readback/v1", response_class: "PROVIDER_ACCEPTED", secret_material_exposed: false }; },
    consume: async () => { consumes += 1; return consumes === 1; },
    resolveHandle: async () => { resolves += 1; return { resolved: true, material: secret }; },
    now: () => now,
  };
  const receipt = await runStewartAmazonPasswordFallback(dependencies);
  assert.equal(receipt.amazon_sign_in_accepted, true); assert.equal(receipt.password_conversion, false); assert.equal(receipt.conversion_credit, 0);
  assert.equal(resolves, 1); assert.equal(executions, 1); assert.equal(readbacks, 1);
  assert.equal(received[0].material, null);
  assert.doesNotMatch(JSON.stringify({ transaction, receipt }), /synthetic-blind-master-never-output/);
  const replay = await runStewartAmazonPasswordFallback(dependencies);
  assert.equal(replay.state, "ALREADY_CONSUMED"); assert.equal(resolves, 1); assert.equal(executions, 1); assert.equal(readbacks, 1);
});

test("terminal projection requires exact rollback and CLEAN_ABSENT and never awards conversion credit", () => {
  const operation = { schema: "pookakind.stewart-amazon-password-fallback-receipt/v1", state: "SUBMISSION_ACCEPTED", provider_state_sha256: hash("9"), amazon_sign_in_accepted: true, password_conversion: false, conversion_credit: 0, secret_material_output: false, recurring_operation_created: false };
  const cleanup = { schema: "pookakind.stewart-amazon-session-cleanup-receipt/v1", rollback_steps: ["TERMINATE_EXACT_SESSION", "REMOVE_EXACT_REGISTRY_TARGET", "REMOVE_EXACT_EPHEMERAL_PROFILE", "VERIFY_CLEAN_ABSENT"], session_state: "ABSENT", registry_state: "ABSENT", profile_state: "ABSENT", unrelated_state_touched: false };
  const terminal = projectStewartAmazonSessionTerminal({ operation_receipt: operation, cleanup_receipt: cleanup });
  assert.equal(terminal.state, "CLEAN_ABSENT"); assert.equal(terminal.password_conversion, false); assert.equal(terminal.conversion_credit, 0);
  for (const changed of [{ ...cleanup, registry_state: "PRESENT" }, { ...cleanup, profile_state: "PRESENT" }, { ...cleanup, rollback_steps: cleanup.rollback_steps.slice(0, 3) }, { ...cleanup, unrelated_state_touched: true }]) {
    assert.throws(() => projectStewartAmazonSessionTerminal({ operation_receipt: operation, cleanup_receipt: changed }), /CLEANUP_NOT_CLEAN_ABSENT/);
  }
});
