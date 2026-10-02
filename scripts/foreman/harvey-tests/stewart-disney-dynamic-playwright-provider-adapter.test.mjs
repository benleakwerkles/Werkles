import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createStewartDisneyDynamicPlaywrightProviderAdapter } from "../../../lib/harvey/stewart-disney-dynamic-playwright-provider-adapter.mjs";
import { canonicalJson } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (value) => createHash("sha256").update(String(value)).digest("hex");
const roles = { recovery: ["IDENTITY"], challenge: Array.from({ length: 6 }, (_, index) => `EMAIL_OTP_DIGIT_${index + 1}`), passwordChange: ["NEW_PASSWORD", "CONFIRM_PASSWORD"], freshIdentity: ["IDENTITY"], freshSignIn: ["IDENTITY", "CURRENT_PASSWORD"] };
const kinds = { recovery: "RECOVERY_IDENTITY_SUBMIT", challenge: "EMAIL_OTP_SUBMIT", passwordChange: "PASSWORD_RESET", freshIdentity: "RECOVERY_IDENTITY_SUBMIT", freshSignIn: "SIGN_IN" };
function fixture() {
  const descriptors = Object.fromEntries(Object.entries(roles).map(([stage, fields]) => [stage, {
    schema: "pookakind.stewart-provider-surface-descriptor/v1",
    field_descriptors: fields.map((role) => ({ role, control_sha256: h(`${stage}:${role}`), selector: `#${stage}-${role}` })),
    final_control_descriptor: { control_sha256: h(`${stage}:go`), selector: `#${stage}-go` },
    readback_descriptors: [{ response_class: "PROVIDER_ACCEPTED", selector: `#${stage}-done` }],
  }]));
  let url = "https://login.disney.com/interaction?token=synthetic"; let tabId = 7; let pages = 1; let workers = 1;
  let state = { cookies: [{ domain: "login.disney.com" }], origins: [{ origin: "https://login.disney.com", localStorage: [] }] };
  let observedOverride = null; let executed = 0; let cleared = 0; let pageEvaluations = 0; let messageFailure = false;
  let routeControls = [];
  const page = { url: () => url, evaluate: async (fn, arg) => {
    pageEvaluations++;
    if (String(fn).includes("querySelectorAll(\"input, button\")")) return routeControls;
    if (!arg) { cleared++; return null; }
    throw new Error("PAGE_WORLD_MUST_NOT_HANDLE_EXTENSION_FIELDS");
  } };
  let descriptor = null;
  const worker = { evaluate: async (_fn, arg) => {
    if (typeof arg === "string") return [{ id: tabId }];
    assert.equal(arg.exactTabId, tabId);
    if (messageFailure) return null;
    const message = arg.exactMessage;
    if (message.schema === "pookakind.stewart-extension-describe/v1") {
      descriptor = message.descriptor;
      return observedOverride ?? { schema: "pookakind.stewart-extension-dom-observation/v1", field_controls: descriptor.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 })), final_control_sha256: descriptor.final_control_descriptor.control_sha256, foreground_unchanged: true, unexpected_field_count: 0, secret_material_present: false };
    }
    if (message.schema === "pookakind.stewart-extension-execute-fields/v1") {
      assert.ok(descriptor); executed++;
      return { schema: "pookakind.stewart-extension-dom-execution/v1", field_count: message.fields.length, field_roles: message.fields.map((field) => field.role), final_control_invoked: true, foreground_changed: false, input_devices_touched: false, secret_material_exposed: false };
    }
    if (message.schema === "pookakind.stewart-extension-bind-readback/v1") { descriptor = message.descriptor; return { schema: "pookakind.stewart-extension-readback-bound/v1" }; }
    if (message.schema === "pookakind.stewart-extension-readback-request/v1") { assert.ok(descriptor); descriptor = null; return { schema: "pookakind.stewart-extension-dom-readback/v1", response_class: "PROVIDER_ACCEPTED", secret_material_exposed: false }; }
    throw new Error("UNEXPECTED_EXTENSION_MESSAGE");
  } };
  const context = { pages: () => Array.from({ length: pages }, () => page), serviceWorkers: () => Array.from({ length: workers }, () => worker), storageState: async () => state, clearCookies: async () => { cleared++; state = { cookies: [], origins: [] }; } };
  const account = h("account"); const session = h("session");
  return { descriptors, context, account, session, setUrl: (value) => { url = value; }, setTab: (value) => { tabId = value; }, setPages: (value) => { pages = value; }, setWorkers: (value) => { workers = value; }, setState: (value) => { state = value; }, setObserved: (value) => { observedOverride = value; }, setRouteControls: (value) => { routeControls = value; }, setMessageFailure: (value) => { messageFailure = value; }, executed: () => executed, cleared: () => cleared, pageEvaluations: () => pageEvaluations };
}
function adapter(f) { return createStewartDisneyDynamicPlaywrightProviderAdapter({ context: f.context, stage_descriptors: f.descriptors, account_ref_sha256: f.account, owned_session_ref_sha256: f.session, now: () => Date.parse("2026-09-23T12:00:00.000Z") }); }

test("captures all five stages just in time and binds execution to exact current route", async () => {
  const f = fixture(); const a = adapter(f);
  for (const stage of Object.keys(roles)) {
    const { descriptor, observation } = await a.observeStage({ stage, operation_kind: kinds[stage], account_ref_sha256: f.account });
    assert.equal(observation.account_ref_sha256, f.account);
    assert.deepEqual(observation.field_controls.map(({ role }) => role), roles[stage]);
    assert.equal(observation.provider_response_contract_sha256, h(canonicalJson(descriptor)));
    assert.equal((await a.providerAdapter.observeExtension(descriptor)).tab_id_sha256, observation.tab_id_sha256);
    assert.equal((await a.providerAdapter.executeExtension({ descriptor, fields: roles[stage].map((role) => ({ role, material: role.startsWith("EMAIL_OTP_DIGIT_") ? "1" : "synthetic-only" })) })).final_control_invoked, true);
    assert.equal((await a.providerAdapter.readExtension(descriptor)).response_class, "PROVIDER_ACCEPTED");
  }
  assert.equal(f.executed(), 5);
  assert.equal(f.pageEvaluations(), 0);
  assert.equal((await a.providerAdapter.signOutAndClear({ session_ref_sha256: f.session, provider_id: "DISNEY_MYDISNEY" })).state, "SIGNED_OUT_PROVIDER_STATE_CLEARED");
  assert.equal(f.cleared(), 2);
});

test("extension messaging failure closes before submission without page-world fallback", async () => {
  const f = fixture(); const a = adapter(f); f.setMessageFailure(true);
  await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: f.account }), /EXTENSION_MESSAGE_FAILED/);
  assert.equal(f.executed(), 0); assert.equal(f.pageEvaluations(), 0);
});

test("package-owned recovery route sensor classifies only a fresh value-free Disney identity form", async () => {
  const f = fixture(); const a = adapter(f);
  f.setUrl("https://login.disney.com/en-US/US/DTCI-MY.ACCOUNT.WEB/interaction?token=synthetic");
  const input = { tag: "INPUT", id: "lookupValue", name: "lookupValue", type: "text", text: null, disabled: false, hasValue: false, visible: true, width: 200, height: 30, opacity: "1", tabIndex: 0 };
  const button = { tag: "BUTTON", id: "id-flow", name: null, type: "submit", text: "Continue", disabled: false, hasValue: false, visible: true, width: 90, height: 30, opacity: "1", tabIndex: 0 };
  f.setRouteControls([input, button]);
  assert.equal((await a.routeSensor.observeIdentityRoute()).classification, "IDENTITY_LOOKUP_READY");
  f.setRouteControls([{ ...input, hasValue: true }, button]);
  await assert.rejects(a.routeSensor.observeIdentityRoute(), /VALUE_BEARING_OBSERVATION_REJECTED/);
  f.setRouteControls([input, button, { ...input, id: "other" }]);
  assert.equal((await a.routeSensor.observeIdentityRoute()).classification, "SURFACE_DRIFT");
});

test("wrong account, operation, descriptor, duplicate pages or workers fail before execution", async () => {
  const f = fixture(); const a = adapter(f);
  await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: h("other") }), /STAGE_CONFLICT/);
  await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: "SIGN_IN", account_ref_sha256: f.account }), /STAGE_CONFLICT/);
  await assert.rejects(a.providerAdapter.executeExtension({ descriptor: f.descriptors.recovery, fields: [] }), /DESCRIPTOR_UNBOUND/);
  f.setPages(2); await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: f.account }), /PAGE_NOT_EXACT/);
  f.setPages(1); f.setWorkers(2); await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: f.account }), /WORKER_NOT_EXACT/);
  assert.equal(f.executed(), 0);
});

test("route, tab, origin and observed-control drift fail closed", async () => {
  const f = fixture(); const a = adapter(f);
  await a.observeStage({ stage: "passwordChange", operation_kind: kinds.passwordChange, account_ref_sha256: f.account });
  f.setTab(8); await assert.rejects(a.providerAdapter.executeExtension({ descriptor: f.descriptors.passwordChange, fields: [] }), /ROUTE_DRIFT/);
  f.setTab(7); f.setUrl("https://login.disney.com/interaction?token=changed"); await assert.rejects(a.providerAdapter.observeExtension(f.descriptors.passwordChange), /ROUTE_DRIFT/);
  f.setUrl("https://evil.example/interaction"); await assert.rejects(a.providerAdapter.observeExtension(f.descriptors.passwordChange), /PAGE_NOT_EXACT/);
  f.setUrl("https://login.disney.com/interaction?token=synthetic");
  f.setObserved({ schema: "pookakind.stewart-extension-dom-observation/v1", field_controls: [], final_control_sha256: f.descriptors.passwordChange.final_control_descriptor.control_sha256, foreground_unchanged: true, unexpected_field_count: 0, secret_material_present: false });
  await assert.rejects(a.providerAdapter.observeExtension(f.descriptors.passwordChange), /OBSERVATION_DRIFT/);
  assert.equal(f.executed(), 0);
});

test("readback may follow a same-tab Disney navigation only after exact submission", async () => {
  const f = fixture(); const a = adapter(f);
  const { descriptor } = await a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: f.account });
  await assert.rejects(a.providerAdapter.readExtension(descriptor), /READBACK_NOT_SUBMITTED/);
  await a.providerAdapter.executeExtension({ descriptor, fields: [{ role: "IDENTITY", material: "synthetic-only" }] });
  f.setUrl("https://login.disney.com/interaction?token=next-synthetic");
  assert.equal((await a.providerAdapter.readExtension(descriptor)).response_class, "PROVIDER_ACCEPTED");
  await assert.rejects(a.providerAdapter.readExtension(descriptor), /READBACK_NOT_SUBMITTED/);
  await assert.rejects(a.providerAdapter.executeExtension({ descriptor, fields: [] }), /STAGE_ALREADY_SUBMITTED/);
  await assert.rejects(a.observeStage({ stage: "recovery", operation_kind: kinds.recovery, account_ref_sha256: f.account }), /STAGE_ALREADY_SUBMITTED/);
});

test("shared browser state or substituted session cannot be cleared", async () => {
  const f = fixture(); const a = adapter(f);
  await assert.rejects(a.providerAdapter.signOutAndClear({ session_ref_sha256: h("other"), provider_id: "DISNEY_MYDISNEY" }), /SESSION_CONFLICT/);
  f.setState({ cookies: [{ domain: ".example.com" }], origins: [{ origin: "https://login.disney.com", localStorage: [] }] });
  await assert.rejects(a.providerAdapter.signOutAndClear({ session_ref_sha256: f.session, provider_id: "DISNEY_MYDISNEY" }), /CONTEXT_NOT_OWNED/);
  assert.equal(f.cleared(), 0);
});
