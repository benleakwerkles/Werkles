import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartGeneralizedPlaywrightProviderAdapter } from "../../../lib/harvey/stewart-generalized-playwright-provider-adapter.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const textDigest = (value) => createHash("sha256").update(String(value), "utf8").digest("hex");
const now = Date.parse("2026-08-23T08:00:00.000Z");
function descriptor(label) {
  return { schema: "pookakind.stewart-provider-surface-descriptor/v1", field_descriptors: [{ role: label, control_sha256: textDigest(`${label}:field`), selector: `#${label}` }], final_control_descriptor: { control_sha256: textDigest(`${label}:go`), selector: "#go" }, readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }] };
}
function surface(label, url, tabId) {
  const d = descriptor(label);
  return { descriptor: d, observation: { schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256: textDigest("account"), canonical_origin_sha256: textDigest(new URL(url).origin), route_epoch_sha256: textDigest(url), tab_id_sha256: textDigest(String(tabId)), form_sha256: textDigest(`${label}:form`), final_control_sha256: d.final_control_descriptor.control_sha256, provider_response_contract_sha256: digest(d), field_controls: d.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false, observed_at: new Date(now - 100).toISOString() } };
}
function fixture() {
  const otp = surface("EMAIL_OTP_DIGIT_1", "https://disney.example/otp", 11);
  const reset = surface("NEW_PASSWORD", "https://disney.example/reset", 12);
  const signIn = surface("CURRENT_PASSWORD", "https://disney.example/sign-in", 13);
  const tabIds = new Map([["https://disney.example/otp", 11], ["https://disney.example/reset", 12], ["https://disney.example/sign-in", 13]]);
  let clears = 0;
  const pages = [otp, reset, signIn].map((entry) => ({
    url: () => [...tabIds.keys()].find((url) => textDigest(url) === entry.observation.route_epoch_sha256),
    evaluate: async (fn, arg) => {
      if (!arg) { clears += 1; return null; }
      if (arg.exactDescriptor) return { schema: "pookakind.stewart-extension-dom-execution/v1", field_count: arg.exactFields.length, field_roles: arg.exactFields.map(({ role }) => role), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false };
      if (String(fn).includes(".observe")) return { schema: "pookakind.stewart-extension-dom-observation/v1", field_controls: arg.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_sha256: arg.final_control_descriptor.control_sha256, foreground_unchanged: true, unexpected_field_count: 0, secret_material_present: false };
      return { schema: "pookakind.stewart-extension-dom-readback/v1", response_class: "PROVIDER_ACCEPTED", secret_material_exposed: false };
    },
  }));
  const worker = { evaluate: async (_fn, url) => [{ id: tabIds.get(url) }] };
  const context = { pages: () => pages, serviceWorkers: () => [worker], clearCookies: async () => { clears += 1; }, storageState: async () => ({ cookies: [], origins: [] }) };
  const full = { schema: "pookakind.disney-mydisney-full-conversion-transaction/v1", provider_id: "DISNEY_MYDISNEY", owned_session_ref_sha256: textDigest("session"), password_reset: reset, fresh_sign_in: signIn };
  const otpTransaction = { schema: "pookakind.disney-mydisney-email-otp-transaction/v1", provider_id: "DISNEY_MYDISNEY", ...otp };
  return { context, full, otpTransaction, otp, reset, signIn, pages, worker, getClears: () => clears };
}

test("binds three exact Disney pages and tabs to observe, execute, readback, and session clear", async () => {
  const f = fixture();
  const adapter = createStewartGeneralizedPlaywrightProviderAdapter({ context: f.context, full_conversion_transaction: f.full, otp_transaction: f.otpTransaction, now: () => now });
  const observed = await adapter.observeExtension(f.reset.descriptor); assert.equal(observed.observed_at, new Date(now).toISOString());
  const execution = await adapter.executeExtension({ descriptor: f.reset.descriptor, fields: [{ role: "NEW_PASSWORD", material: "synthetic-only" }] }); assert.equal(execution.final_control_invoked, true);
  const readback = await adapter.readExtension(f.reset.descriptor); assert.equal(readback.response_class, "PROVIDER_ACCEPTED");
  const cleared = await adapter.signOutAndClear({ session_ref_sha256: f.full.owned_session_ref_sha256, provider_id: "DISNEY_MYDISNEY" });
  assert.equal(cleared.state, "SIGNED_OUT_PROVIDER_STATE_CLEARED"); assert.equal(f.getClears(), 4);
});

test("duplicate page, wrong tab, descriptor substitution, session substitution, and residual state fail closed", async () => {
  const duplicate = fixture(); duplicate.pages.push(duplicate.pages[1]);
  await assert.rejects(createStewartGeneralizedPlaywrightProviderAdapter({ context: duplicate.context, full_conversion_transaction: duplicate.full, otp_transaction: duplicate.otpTransaction }).observeExtension(duplicate.reset.descriptor), /PAGE_NOT_EXACT/);
  const wrongTab = fixture(); wrongTab.context.serviceWorkers = () => [{ evaluate: async () => [{ id: 999 }] }];
  await assert.rejects(createStewartGeneralizedPlaywrightProviderAdapter({ context: wrongTab.context, full_conversion_transaction: wrongTab.full, otp_transaction: wrongTab.otpTransaction }).observeExtension(wrongTab.reset.descriptor), /TAB_NOT_EXACT/);
  const substituted = fixture(); const adapter = createStewartGeneralizedPlaywrightProviderAdapter({ context: substituted.context, full_conversion_transaction: substituted.full, otp_transaction: substituted.otpTransaction });
  await assert.rejects(adapter.observeExtension(descriptor("OTHER")), /DESCRIPTOR_UNBOUND/);
  await assert.rejects(adapter.signOutAndClear({ session_ref_sha256: textDigest("other"), provider_id: "DISNEY_MYDISNEY" }), /SESSION_CONFLICT/);
  const residual = fixture(); residual.context.storageState = async () => ({ cookies: [{ name: "provider" }], origins: [] });
  await assert.rejects(createStewartGeneralizedPlaywrightProviderAdapter({ context: residual.context, full_conversion_transaction: residual.full, otp_transaction: residual.otpTransaction }).signOutAndClear({ session_ref_sha256: residual.full.owned_session_ref_sha256, provider_id: "DISNEY_MYDISNEY" }), /SIGN_OUT_NOT_CLEAN/);
});
