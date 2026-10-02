import assert from "node:assert/strict";
import test from "node:test";

import { verifyStewartWindowsSecurityUiAccessFixtureEvent } from "../../../lib/harvey/stewart-windows-security-uiaccess-fixture-event.mjs";

const hash = (character) => character.repeat(64);
const now = Date.parse("2026-08-24T07:00:10.000Z");
const expected = {
  operation_id_sha256: hash("a"), package_sha256: hash("b"), activation_driver_sha256: hash("c"), fixture_sha256: hash("d"),
  certificate_thumbprint: "A".repeat(40), session_nonce_sha256: hash("e"), pid: 4321, exact_process_count: 1,
  process_path_sha256: hash("d"), expected_process_path_sha256: hash("d"), not_before: "2026-08-24T07:00:00.000Z",
};
const event = {
  schema: "pookakind.stewart-windows-security-uiaccess-fixture-launch/v2", state: "ELEVATED_FIXTURE_READY",
  operation_id_sha256: hash("a"), package_sha256: hash("b"), activation_driver_sha256: hash("c"), fixture_sha256: hash("d"),
  certificate_thumbprint: "A".repeat(40), session_nonce_sha256: hash("e"), pid: 4321, hwnd: "987654", published_at: "2026-08-24T07:00:05.000Z", secret_accessed: false,
};

test("accepts one fresh package and operation-bound signed fixture process with a nonzero HWND", () => {
  assert.equal(verifyStewartWindowsSecurityUiAccessFixtureEvent(event, expected, now), true);
});

test("rejects zero HWND and duplicate fixture processes", () => {
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, hwnd: "0" }, expected, now), /FIXTURE_EVENT_INVALID/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent(event, { ...expected, exact_process_count: 2 }, now), /FIXTURE_PROCESS_NOT_EXACT/);
});

test("rejects stale, substituted, wrong-operation, wrong-package, and extra-field events", () => {
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, published_at: "2026-08-24T06:59:00.000Z" }, expected, now), /FIXTURE_EVENT_INVALID/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, operation_id_sha256: hash("f") }, expected, now), /FIXTURE_EVENT_CUSTODY_MISMATCH/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, package_sha256: hash("f") }, expected, now), /FIXTURE_EVENT_CUSTODY_MISMATCH/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, fixture_sha256: hash("f") }, expected, now), /FIXTURE_EVENT_CUSTODY_MISMATCH/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, duplicate: true }, expected, now), /FIXTURE_EVENT_INVALID/);
});

test("rejects wrong PID, wrong signed process bytes, and future publication", () => {
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent(event, { ...expected, pid: 4322 }, now), /FIXTURE_PROCESS_NOT_EXACT/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent(event, { ...expected, process_path_sha256: hash("f") }, now), /FIXTURE_PROCESS_NOT_EXACT/);
  assert.throws(() => verifyStewartWindowsSecurityUiAccessFixtureEvent({ ...event, published_at: "2026-08-24T07:00:20.000Z" }, expected, now), /FIXTURE_EVENT_INVALID/);
});
