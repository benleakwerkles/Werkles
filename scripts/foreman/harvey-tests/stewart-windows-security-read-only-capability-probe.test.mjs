import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  classifyStewartWindowsSecurityReadOnlyCapability,
  compileStewartWindowsSecurityCredentialUiObservation,
  compileStewartWindowsSecurityReadOnlyCapabilityProbeRequest,
  createStewartWindowsSecurityReadOnlyCapabilityProbeRequest,
  verifyStewartWindowsSecurityReadOnlyCapabilityProbeReceipt,
} from "../../../lib/harvey/stewart-windows-security-read-only-capability-probe.mjs";

const h = (character) => character.repeat(64);
const now = Date.parse("2026-08-24T07:00:10.000Z");
const observation = { schema: "pookakind.stewart-windows-security-credential-ui-observation/v1", process_id: 4242, hwnd: "987654", window_class: "Credential Dialog Xaml Host", observed_at: "2026-08-24T07:00:05.000Z" };
const request = createStewartWindowsSecurityReadOnlyCapabilityProbeRequest({ observation, machine_sha256: h("a"), operation_id_sha256: h("b"), package_sha256: h("c"), activation_driver_sha256: h("d"), session_nonce_sha256: h("e"), now });
const receipt = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-read-only-capability-probe-receipt/v1", state: "READ_ONLY_CREDENTIAL_UI_CAPABILITY_CLASSIFIED", classification: "EXACT_ONE_VALUE_AND_INVOKE", operation_id_sha256: h("b"), package_sha256: h("c"), activation_driver_sha256: h("d"), session_nonce_sha256: h("e"), route_epoch_sha256: request.route_epoch_sha256, process_id: 4242, hwnd: "987654", window_class: "Credential Dialog Xaml Host", token_uiaccess: true, authenticode_signer_thumbprint: "A".repeat(40), secure_program_files_path: true, control_classes: { edit: 1, button: 1, other: 3 }, writable_value_pattern_count: 1, invokable_pattern_count: 1, names_read: false, values_read: false, values_written: false, controls_invoked: false, foreground_changed: false, secret_accessed: false, ...overrides });
const expected = { operation_id_sha256: h("b"), package_sha256: h("c"), activation_driver_sha256: h("d"), session_nonce_sha256: h("e"), route_epoch_sha256: request.route_epoch_sha256, process_id: 4242, hwnd: "987654", authenticode_signer_thumbprint: "A".repeat(40) };

test("binds a fresh exact PID, HWND, class, route epoch, package, driver, operation, and session", () => {
  assert.equal(compileStewartWindowsSecurityCredentialUiObservation(observation, now).process_id, 4242);
  assert.deepEqual(compileStewartWindowsSecurityReadOnlyCapabilityProbeRequest(request, now), request);
  assert.match(request.route_epoch_sha256, /^[a-f0-9]{64}$/);
});

test("rejects wrong PID, HWND, class, stale observation, changed route epoch, and extra fields", () => {
  for (const changed of [
    { ...observation, process_id: 0 }, { ...observation, hwnd: "0" }, { ...observation, window_class: "Other" },
    { ...observation, observed_at: "2026-08-24T06:59:00.000Z" }, { ...observation, extra: true },
  ]) assert.throws(() => compileStewartWindowsSecurityCredentialUiObservation(changed, now), /OBSERVATION_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityReadOnlyCapabilityProbeRequest({ ...request, route_epoch_sha256: h("f") }, now), /REQUEST_INVALID/);
});

test("classifies exact, zero, ambiguous, and drift without completion inference", () => {
  assert.equal(classifyStewartWindowsSecurityReadOnlyCapability({ writable_value_pattern_count: 1, invokable_pattern_count: 1 }), "EXACT_ONE_VALUE_AND_INVOKE");
  assert.equal(classifyStewartWindowsSecurityReadOnlyCapability({ writable_value_pattern_count: 0, invokable_pattern_count: 0 }), "ZERO_CONTROLS");
  assert.equal(classifyStewartWindowsSecurityReadOnlyCapability({ writable_value_pattern_count: 2, invokable_pattern_count: 1 }), "AMBIGUOUS");
  assert.equal(classifyStewartWindowsSecurityReadOnlyCapability({ drift: true, writable_value_pattern_count: 0, invokable_pattern_count: 0 }), "DRIFT");
});

test("receipt rejects signer, token, path, binding, count, secret, and effect substitutions", () => {
  assert.equal(verifyStewartWindowsSecurityReadOnlyCapabilityProbeReceipt(receipt(), expected), true);
  for (const changed of [
    receipt({ token_uiaccess: false }), receipt({ authenticode_signer_thumbprint: "B".repeat(40) }), receipt({ secure_program_files_path: false }),
    receipt({ package_sha256: h("f") }), receipt({ activation_driver_sha256: h("f") }), receipt({ session_nonce_sha256: h("f") }), receipt({ process_id: 99 }), receipt({ hwnd: "99" }), receipt({ writable_value_pattern_count: 2 }), receipt({ values_read: true }),
    receipt({ values_written: true }), receipt({ controls_invoked: true }), receipt({ foreground_changed: true }), receipt({ secret_accessed: true }),
  ]) assert.throws(() => verifyStewartWindowsSecurityReadOnlyCapabilityProbeReceipt(changed, expected), /RECEIPT_INVALID/);
});

test("adapter probe path is structurally isolated from claims, DPAPI, names, values, writes, invocation, focus, foreground, and generic input", async () => {
  const source = await readFile(new URL("../native/PookaKindWindowsSecurityUiAccessAdapter.cs", import.meta.url), "utf8");
  const start = source.indexOf("private static int ProbeCredentialUiCapability"); const end = source.indexOf("private static string Receipt", start); const probe = source.slice(start, end);
  assert.match(probe, /RequireSecureInstall\(\).*RequireUiAccess\(\).*RequireAuthenticodeSigner\(\)/s);
  assert.match(probe, /GetWindowThreadProcessId/); assert.match(probe, /GetClassName/); assert.match(probe, /CredentialUIBroker/);
  assert.match(probe, /ValuePattern\.Pattern/); assert.match(probe, /InvokePattern\.Pattern/); assert.match(probe, /Current\.IsReadOnly/);
  assert.doesNotMatch(probe, /ClaimsRoot|FileMode\.CreateNew|ProtectedData|SecretPath|device-pin|ReadCommand|Execute\(|SetValue|\.Invoke\(|\.Current\.Name|SetFocus|SetForegroundWindow|SendInput|SendKeys|Clipboard|PostMessage|mouse_event|keybd_event|SetCursorPos/);
  assert.match(source, /--read-only-credential-ui-capability-probe/);
  assert.ok(source.indexOf("--read-only-credential-ui-capability-probe") < source.indexOf("--sealed-operation"));
});

test("sanitized receipt contains no dynamic control name or value fields", () => {
  const json = JSON.stringify(receipt());
  assert.doesNotMatch(json, /operator_message|control_name|field_name|current_value|password|device-pin|dpapi/i);
});
