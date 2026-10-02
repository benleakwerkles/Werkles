const HASH = /^[a-f0-9]{64}$/;
const THUMBPRINT = /^[A-F0-9]{40,128}$/;
const FIELDS = ["activation_driver_sha256", "certificate_thumbprint", "fixture_sha256", "hwnd", "operation_id_sha256", "package_sha256", "pid", "published_at", "schema", "secret_accessed", "session_nonce_sha256", "state"];

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail("STEWART_WINDOWS_SECURITY_FIXTURE_EVENT_INVALID");
  const actual = Object.keys(value).sort(); const expected = [...FIELDS].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) fail("STEWART_WINDOWS_SECURITY_FIXTURE_EVENT_INVALID");
}

export function verifyStewartWindowsSecurityUiAccessFixtureEvent(value, expected, now = Date.now()) {
  exact(value);
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) fail("STEWART_WINDOWS_SECURITY_FIXTURE_EXPECTATION_INVALID");
  const published = Date.parse(value.published_at);
  const notBefore = Date.parse(expected.not_before);
  if (value.schema !== "pookakind.stewart-windows-security-uiaccess-fixture-launch/v2"
    || value.state !== "ELEVATED_FIXTURE_READY"
    || value.secret_accessed !== false
    || !HASH.test(value.operation_id_sha256 ?? "")
    || !HASH.test(value.package_sha256 ?? "")
    || !HASH.test(value.activation_driver_sha256 ?? "")
    || !HASH.test(value.fixture_sha256 ?? "")
    || !HASH.test(value.session_nonce_sha256 ?? "")
    || !THUMBPRINT.test(value.certificate_thumbprint ?? "")
    || !Number.isSafeInteger(value.pid) || value.pid <= 0
    || typeof value.hwnd !== "string" || !/^[1-9][0-9]{0,19}$/.test(value.hwnd)
    || !Number.isFinite(published) || !Number.isFinite(notBefore)
    || published < notBefore || published > now + 5_000 || now - published > 30_000) fail("STEWART_WINDOWS_SECURITY_FIXTURE_EVENT_INVALID");
  for (const field of ["operation_id_sha256", "package_sha256", "activation_driver_sha256", "fixture_sha256", "session_nonce_sha256", "certificate_thumbprint"]) {
    if (value[field] !== expected[field]) fail("STEWART_WINDOWS_SECURITY_FIXTURE_EVENT_CUSTODY_MISMATCH");
  }
  if (value.pid !== expected.pid || expected.exact_process_count !== 1 || expected.process_path_sha256 !== expected.expected_process_path_sha256) fail("STEWART_WINDOWS_SECURITY_FIXTURE_PROCESS_NOT_EXACT");
  return true;
}
