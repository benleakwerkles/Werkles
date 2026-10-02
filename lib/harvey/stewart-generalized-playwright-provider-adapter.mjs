import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const HASH = /^[a-f0-9]{64}$/;
const PROVIDER_ID = "DISNEY_MYDISNEY";

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function digest(value) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }
function textDigest(value) { return createHash("sha256").update(String(value), "utf8").digest("hex"); }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  const actual = Object.keys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function surface(descriptor, observation, label) {
  if (!descriptor || !observation || descriptor.schema !== "pookakind.stewart-provider-surface-descriptor/v1"
    || observation.schema !== "pookakind.stewart-background-credential-observation/v1"
    || !HASH.test(observation.canonical_origin_sha256 ?? "") || !HASH.test(observation.route_epoch_sha256 ?? "")
    || !HASH.test(observation.tab_id_sha256 ?? "") || !HASH.test(observation.provider_response_contract_sha256 ?? "")
    || digest(descriptor) !== observation.provider_response_contract_sha256) fail("STEWART_PLAYWRIGHT_PROVIDER_SURFACE_INVALID");
  return Object.freeze({ descriptor, observation, descriptor_sha256: digest(descriptor), label });
}

export function createStewartGeneralizedPlaywrightProviderAdapter({ context, full_conversion_transaction, otp_transaction, now = () => Date.now() }) {
  if (!context || typeof context.pages !== "function" || typeof context.serviceWorkers !== "function"
    || typeof context.clearCookies !== "function" || typeof context.storageState !== "function" || typeof now !== "function") fail("STEWART_PLAYWRIGHT_PROVIDER_CONTEXT_INVALID");
  if (full_conversion_transaction?.schema !== "pookakind.disney-mydisney-full-conversion-transaction/v1"
    || full_conversion_transaction.provider_id !== PROVIDER_ID || otp_transaction?.schema !== "pookakind.disney-mydisney-email-otp-transaction/v1"
    || otp_transaction.provider_id !== PROVIDER_ID || !HASH.test(full_conversion_transaction.owned_session_ref_sha256 ?? "")) fail("STEWART_PLAYWRIGHT_PROVIDER_TRANSACTION_INVALID");
  const surfaces = [
    surface(otp_transaction.descriptor, otp_transaction.observation, "EMAIL_OTP_SUBMIT"),
    surface(full_conversion_transaction.password_reset?.descriptor, full_conversion_transaction.password_reset?.observation, "PASSWORD_RESET"),
    surface(full_conversion_transaction.fresh_sign_in?.descriptor, full_conversion_transaction.fresh_sign_in?.observation, "SIGN_IN"),
  ];
  const byDescriptor = new Map(surfaces.map((entry) => [entry.descriptor_sha256, entry]));
  if (byDescriptor.size !== 3) fail("STEWART_PLAYWRIGHT_PROVIDER_SURFACE_COLLISION");

  async function select(descriptor) {
    const entry = byDescriptor.get(digest(descriptor));
    if (!entry || canonicalJson(entry.descriptor) !== canonicalJson(descriptor)) fail("STEWART_PLAYWRIGHT_PROVIDER_DESCRIPTOR_UNBOUND");
    const candidates = context.pages().filter((page) => {
      try { return textDigest(page.url()) === entry.observation.route_epoch_sha256 && textDigest(new URL(page.url()).origin) === entry.observation.canonical_origin_sha256; }
      catch { return false; }
    });
    if (candidates.length !== 1 || typeof candidates[0].evaluate !== "function") fail("STEWART_PLAYWRIGHT_PROVIDER_PAGE_NOT_EXACT");
    const workers = context.serviceWorkers(); const worker = workers.length === 1 ? workers[0] : null;
    if (!worker || typeof worker.evaluate !== "function") fail("STEWART_PLAYWRIGHT_PROVIDER_WORKER_NOT_EXACT");
    const tabs = await worker.evaluate((url) => new Promise((resolveTabs) => chrome.tabs.query({ url }, resolveTabs)), candidates[0].url());
    if (!Array.isArray(tabs) || tabs.length !== 1 || !Number.isInteger(tabs[0]?.id)
      || textDigest(String(tabs[0].id)) !== entry.observation.tab_id_sha256) fail("STEWART_PLAYWRIGHT_PROVIDER_TAB_NOT_EXACT");
    return { entry, page: candidates[0] };
  }

  return Object.freeze({
    async observeExtension(descriptor) {
      const { entry, page } = await select(descriptor);
      const observed = await page.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.observe(value), descriptor);
      exact(observed, ["field_controls", "final_control_sha256", "foreground_unchanged", "schema", "secret_material_present", "unexpected_field_count"], "STEWART_PLAYWRIGHT_PROVIDER_OBSERVATION_INVALID");
      if (observed.schema !== "pookakind.stewart-extension-dom-observation/v1"
        || canonicalJson(observed.field_controls) !== canonicalJson(entry.observation.field_controls)
        || observed.final_control_sha256 !== entry.observation.final_control_sha256 || observed.foreground_unchanged !== true
        || observed.unexpected_field_count !== 0 || observed.secret_material_present !== false) fail("STEWART_PLAYWRIGHT_PROVIDER_OBSERVATION_INVALID");
      return { ...entry.observation, observed_at: new Date(now()).toISOString() };
    },
    async executeExtension({ descriptor, fields }) {
      const { page } = await select(descriptor);
      return page.evaluate(({ exactDescriptor, exactFields }) => globalThis.PookaKindStewartExtensionRuntime.execute(exactDescriptor, exactFields), { exactDescriptor: descriptor, exactFields: fields });
    },
    async readExtension(descriptor) {
      const { page } = await select(descriptor);
      return page.evaluate((value) => globalThis.PookaKindStewartExtensionRuntime.readback(value), descriptor);
    },
    async signOutAndClear({ session_ref_sha256, provider_id }) {
      if (session_ref_sha256 !== full_conversion_transaction.owned_session_ref_sha256 || provider_id !== PROVIDER_ID) fail("STEWART_PLAYWRIGHT_PROVIDER_SESSION_CONFLICT");
      const origins = new Set();
      for (const page of context.pages()) {
        let origin; try { origin = new URL(page.url()).origin; } catch { continue; }
        if (!surfaces.some((entry) => textDigest(origin) === entry.observation.canonical_origin_sha256)) continue;
        origins.add(origin);
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      }
      await context.clearCookies();
      const state = await context.storageState();
      const providerOrigins = (state.origins ?? []).filter((entry) => origins.has(entry.origin));
      const providerStorageCount = providerOrigins.reduce((count, entry) => count + (entry.localStorage?.length ?? 0), 0);
      if ((state.cookies?.length ?? 0) !== 0 || providerStorageCount !== 0) fail("STEWART_PLAYWRIGHT_PROVIDER_SIGN_OUT_NOT_CLEAN");
      return Object.freeze({ state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256, provider_cookie_count: 0, provider_storage_count: 0, unrelated_state_touched: false });
    },
  });
}
