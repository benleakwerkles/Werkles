import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";
import { compileStewartDisneyLiveSurfaceProbe } from "./stewart-disney-live-surface-probe.mjs";

const HASH = /^[a-f0-9]{64}$/;
const ROLES = Object.freeze({
  recovery: ["IDENTITY"],
  challenge: Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`),
  passwordChange: ["NEW_PASSWORD", "CONFIRM_PASSWORD"],
  freshIdentity: ["IDENTITY"],
  freshSignIn: ["IDENTITY", "CURRENT_PASSWORD"],
});
const KINDS = Object.freeze({ recovery: "RECOVERY_IDENTITY_SUBMIT", challenge: "EMAIL_OTP_SUBMIT", passwordChange: "PASSWORD_RESET", freshIdentity: "RECOVERY_IDENTITY_SUBMIT", freshSignIn: "SIGN_IN" });
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const textDigest = (value) => createHash("sha256").update(String(value), "utf8").digest("hex");
function fail(code) { const error = new Error(code); error.code = code; throw error; }
function providerUrl(value) {
  try { const url = new URL(value); if (url.protocol === "https:" && url.hostname === "login.disney.com" && !url.username && !url.password) return url; } catch { /* fail closed */ }
  fail("STEWART_DISNEY_DYNAMIC_ORIGIN_INVALID");
}
function checkDescriptor(descriptor, stage) {
  if (descriptor?.schema !== "pookakind.stewart-provider-surface-descriptor/v1"
    || !Array.isArray(descriptor.field_descriptors)
    || canonicalJson(descriptor.field_descriptors.map((field) => field.role)) !== canonicalJson(ROLES[stage])
    || descriptor.field_descriptors.some((field) => !HASH.test(field.control_sha256 ?? "") || typeof field.selector !== "string" || !field.selector)
    || !HASH.test(descriptor.final_control_descriptor?.control_sha256 ?? "")
    || typeof descriptor.final_control_descriptor?.selector !== "string" || !descriptor.final_control_descriptor.selector
    || !Array.isArray(descriptor.readback_descriptors) || descriptor.readback_descriptors.length === 0) fail("STEWART_DISNEY_DYNAMIC_DESCRIPTOR_INVALID");
}

/** Five just-in-time stages in one dedicated Disney-only background context. */
export function createStewartDisneyDynamicPlaywrightProviderAdapter({ context, stage_descriptors, account_ref_sha256, owned_session_ref_sha256, now = () => Date.now() }) {
  if (!context || typeof context.pages !== "function" || typeof context.serviceWorkers !== "function"
    || typeof context.storageState !== "function" || typeof context.clearCookies !== "function"
    || !HASH.test(account_ref_sha256 ?? "") || !HASH.test(owned_session_ref_sha256 ?? "") || typeof now !== "function") fail("STEWART_DISNEY_DYNAMIC_CONTEXT_INVALID");
  if (!stage_descriptors || Object.keys(stage_descriptors).sort().join("|") !== Object.keys(ROLES).sort().join("|")) fail("STEWART_DISNEY_DYNAMIC_DESCRIPTOR_INVALID");
  const byDigest = new Map(); const captures = new Map(); const capturedPages = new Map(); const executed = new Set(); const submitted = new Set();
  for (const stage of Object.keys(ROLES)) {
    const descriptor = stage_descriptors[stage]; checkDescriptor(descriptor, stage);
    const hash = digest(descriptor);
    if (byDigest.has(hash)) fail("STEWART_DISNEY_DYNAMIC_DESCRIPTOR_COLLISION");
    byDigest.set(hash, stage);
  }

  async function exactPage() {
    const pages = context.pages().filter((page) => { try { providerUrl(page.url()); return true; } catch { return false; } });
    if (pages.length !== 1 || context.pages().length !== 1 || typeof pages[0].evaluate !== "function") fail("STEWART_DISNEY_DYNAMIC_PAGE_NOT_EXACT");
    const url = providerUrl(pages[0].url());
    const workers = context.serviceWorkers();
    if (workers.length !== 1 || typeof workers[0].evaluate !== "function") fail("STEWART_DISNEY_DYNAMIC_WORKER_NOT_EXACT");
    const tabs = await workers[0].evaluate((exactUrl) => new Promise((resolveTabs) => chrome.tabs.query({ url: exactUrl }, resolveTabs)), url.href);
    if (!Array.isArray(tabs) || tabs.length !== 1 || !Number.isInteger(tabs[0]?.id)) fail("STEWART_DISNEY_DYNAMIC_TAB_NOT_EXACT");
    return { page: pages[0], url, tabId: tabs[0].id };
  }
  async function extensionMessage(tabId, message) {
    const workers = context.serviceWorkers();
    if (workers.length !== 1 || typeof workers[0].evaluate !== "function") fail("STEWART_DISNEY_DYNAMIC_WORKER_NOT_EXACT");
    const result = await workers[0].evaluate(({ exactTabId, exactMessage }) => new Promise((resolve) => {
      chrome.tabs.sendMessage(exactTabId, exactMessage, (response) => {
        resolve(chrome.runtime.lastError ? null : response);
      });
    }), { exactTabId: tabId, exactMessage: message });
    if (!result || result.schema === "pookakind.stewart-extension-failure/v1") fail("STEWART_DISNEY_DYNAMIC_EXTENSION_MESSAGE_FAILED");
    return result;
  }
  async function select(descriptor) {
    const hash = digest(descriptor); const stage = byDigest.get(hash); const capture = captures.get(stage);
    if (!stage || !capture || canonicalJson(descriptor) !== canonicalJson(stage_descriptors[stage])) fail("STEWART_DISNEY_DYNAMIC_DESCRIPTOR_UNBOUND");
    const selected = await exactPage();
    if (textDigest(selected.url.href) !== capture.route_epoch_sha256 || textDigest(String(selected.tabId)) !== capture.tab_id_sha256) fail("STEWART_DISNEY_DYNAMIC_ROUTE_DRIFT");
    return { ...selected, capture };
  }
  const providerAdapter = Object.freeze({
    async observeExtension(descriptor) {
      const { tabId, capture } = await select(descriptor);
      const observed = await extensionMessage(tabId, { schema: "pookakind.stewart-extension-describe/v1", descriptor });
      if (observed?.schema !== "pookakind.stewart-extension-dom-observation/v1"
        || canonicalJson(observed.field_controls) !== canonicalJson(capture.field_controls)
        || observed.final_control_sha256 !== capture.final_control_sha256 || observed.foreground_unchanged !== true
        || observed.unexpected_field_count !== 0 || observed.secret_material_present !== false) fail("STEWART_DISNEY_DYNAMIC_OBSERVATION_DRIFT");
      return { ...capture, observed_at: new Date(now()).toISOString() };
    },
    async executeExtension({ descriptor, fields }) {
      const stage = byDigest.get(digest(descriptor));
      if (submitted.has(stage)) fail("STEWART_DISNEY_DYNAMIC_STAGE_ALREADY_SUBMITTED");
      const { tabId } = await select(descriptor);
      submitted.add(stage);
      const result = await extensionMessage(tabId, { schema: "pookakind.stewart-extension-execute-fields/v1", fields });
      if (result?.final_control_invoked !== true) fail("STEWART_DISNEY_DYNAMIC_EXECUTION_NOT_SUBMITTED");
      executed.add(stage);
      return result;
    },
    async readExtension(descriptor) {
      const stage = byDigest.get(digest(descriptor));
      if (!stage || !executed.has(stage)) fail("STEWART_DISNEY_DYNAMIC_READBACK_NOT_SUBMITTED");
      const { page, url, tabId } = await exactPage();
      const capture = captures.get(stage);
      if (page !== capturedPages.get(stage) || textDigest(url.origin) !== capture.canonical_origin_sha256
        || textDigest(String(tabId)) !== capture.tab_id_sha256) fail("STEWART_DISNEY_DYNAMIC_READBACK_DRIFT");
      executed.delete(stage);
      await extensionMessage(tabId, { schema: "pookakind.stewart-extension-bind-readback/v1", descriptor });
      return extensionMessage(tabId, { schema: "pookakind.stewart-extension-readback-request/v1" });
    },
    async signOutAndClear({ session_ref_sha256, provider_id }) {
      if (session_ref_sha256 !== owned_session_ref_sha256 || provider_id !== "DISNEY_MYDISNEY") fail("STEWART_DISNEY_DYNAMIC_SESSION_CONFLICT");
      const { page } = await exactPage();
      const before = await context.storageState();
      if ((before.origins ?? []).some((entry) => { try { providerUrl(entry.origin); return false; } catch { return true; } })
        || (before.cookies ?? []).some((cookie) => !/^\.?login\.disney\.com$/.test(cookie.domain ?? ""))) fail("STEWART_DISNEY_DYNAMIC_CONTEXT_NOT_OWNED");
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await context.clearCookies();
      const after = await context.storageState();
      if ((after.cookies ?? []).length || (after.origins ?? []).some((entry) => (entry.localStorage ?? []).length)) fail("STEWART_DISNEY_DYNAMIC_SESSION_NOT_CLEAN");
      return { state: "SIGNED_OUT_PROVIDER_STATE_CLEARED", session_ref_sha256, provider_cookie_count: 0, provider_storage_count: 0, unrelated_state_touched: false };
    },
  });
  const routeSensor = Object.freeze({
    async observeIdentityRoute() {
      const { page, url } = await exactPage();
      const controls = await page.evaluate(() => [...document.querySelectorAll("input, button")].map((element) => {
        const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName, id: element.id || null, name: element.getAttribute("name"),
          type: element.getAttribute("type") || "", text: element.tagName === "BUTTON" ? (element.textContent || "").trim() : null,
          disabled: element.matches(":disabled"), hasValue: element.tagName === "INPUT" && Boolean(element.value),
          visible: style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
          width: Math.round(rect.width), height: Math.round(rect.height), opacity: style.opacity, tabIndex: element.tabIndex,
        };
      }));
      return compileStewartDisneyLiveSurfaceProbe({ schema: "pookakind.live-provider-surface-observation/v1", provider_id: "DISNEY_MYDISNEY",
        origin: url.origin, pathname: url.pathname, route_epoch_sha256: textDigest(url.href), controls, observed_at: new Date(now()).toISOString() });
    },
  });
  return Object.freeze({
    providerAdapter, routeSensor,
    async observeStage({ stage, operation_kind, account_ref_sha256: account }) {
      if (!Object.hasOwn(ROLES, stage) || operation_kind !== KINDS[stage] || account !== account_ref_sha256) fail("STEWART_DISNEY_DYNAMIC_STAGE_CONFLICT");
      if (submitted.has(stage)) fail("STEWART_DISNEY_DYNAMIC_STAGE_ALREADY_SUBMITTED");
      const descriptor = stage_descriptors[stage]; const { page, url, tabId } = await exactPage();
      const observed = await extensionMessage(tabId, { schema: "pookakind.stewart-extension-describe/v1", descriptor });
      if (observed?.schema !== "pookakind.stewart-extension-dom-observation/v1"
        || canonicalJson(observed.field_controls) !== canonicalJson(descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })))
        || observed.final_control_sha256 !== descriptor.final_control_descriptor.control_sha256
        || observed.foreground_unchanged !== true || observed.unexpected_field_count !== 0 || observed.secret_material_present !== false) fail("STEWART_DISNEY_DYNAMIC_SURFACE_INVALID");
      const observation = Object.freeze({ schema: "pookakind.stewart-background-credential-observation/v1", account_ref_sha256,
        canonical_origin_sha256: textDigest(url.origin), route_epoch_sha256: textDigest(url.href), tab_id_sha256: textDigest(String(tabId)),
        form_sha256: digest({ descriptor, field_controls: observed.field_controls, final_control_sha256: observed.final_control_sha256 }),
        field_controls: observed.field_controls, final_control_sha256: observed.final_control_sha256,
        provider_response_contract_sha256: digest(descriptor), observed_at: new Date(now()).toISOString(),
        final_control_count: 1, final_control_enabled: true, unexpected_field_count: 0, secret_material_present: false });
      captures.set(stage, observation);
      capturedPages.set(stage, page);
      executed.delete(stage);
      return Object.freeze({ descriptor, observation });
    },
  });
}
