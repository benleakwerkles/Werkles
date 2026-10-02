import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessArchitecture } from "../../../lib/harvey/stewart-windows-security-uiaccess-architecture.mjs";

const hash = (letter) => letter.repeat(64);
const pins = { expectedMachine: "DOSS", expectedRunnerSha256: hash("a"), expectedManifestSha256: hash("b"), expectedBuildScriptSha256: hash("c") };
const observation = (overrides = {}) => ({
  schema: "pookakind.stewart-windows-security-uiaccess-observation/v1",
  machine: "DOSS", observed_at: "2026-08-24T04:30:00.000Z",
  runner_sha256: hash("a"), manifest_sha256: hash("b"), build_script_sha256: hash("c"),
  manifest_requests_uiaccess: true, manifest_embedded: true, execute_mode_compiled: true,
  authenticode_status: "VALID", code_signing_certificates_trusted_with_private_key: 1,
  signtool_present: true, secure_uia_paths_policy_enabled: true, secure_install_present: true,
  secure_install_acl_admin_only: true, uiaccess_token_proved: true,
  background_synthetic_proved: true,
  runner_accepts_signed_one_shot_only: true, opaque_pin_custody_proved: true,
  foreground_activation_present: false, generic_input_present: false,
  provider_owned_pin_api: "UNAVAILABLE_FOR_EXISTING_WEBAUTHN_CEREMONY",
  broker_count: 0, orphaned_requester_canceled: true,
  uia_writable_fields: 0, uia_invokable_controls: 0, msaa_addressable_controls: 0,
  secret_accessed: false, installation_performed: false,
  ...overrides,
});

test("selects only a signed background UIAccess route and never calls it conversion", () => {
  const result = compileStewartWindowsSecurityUiAccessArchitecture(observation(), pins);
  assert.equal(result.state, "LIVE_CALLABLE");
  assert.equal(result.current_capability.live_callable, true);
  assert.equal(result.runtime_contract.background_only_no_focus_change, true);
  assert.equal(result.runtime_contract.submission_is_not_conversion_or_fixed, true);
  assert.equal(result.runtime_contract.atomic_consume_before_dpapi_resolution, true);
  assert.ok(result.rejected_routes.includes("PROVIDER_OWNED_PIN_INJECTION_API"));
  assert.equal(Object.isFrozen(result.runtime_contract), true);
});

test("Doss-like unsigned and uninstalled state remains an exact trust/install gate", () => {
  const result = compileStewartWindowsSecurityUiAccessArchitecture(observation({
    manifest_embedded: false, authenticode_status: "NOT_SIGNED",
    code_signing_certificates_trusted_with_private_key: 0,
    secure_install_present: false, secure_install_acl_admin_only: false,
    uiaccess_token_proved: false, runner_accepts_signed_one_shot_only: false,
    foreground_activation_present: true,
  }), pins);
  assert.equal(result.state, "SOURCE_ARCHITECTURE_DEFINED__ADAPTER_CORRECTION_REQUIRED");
  assert.equal(result.next_human_gate, "NONE__SOURCE_CORRECTION_REQUIRED_FIRST");
  assert.equal(result.prepared_human_gate, "TRUST_AND_INSTALL_SIGNED_UIACCESS_RUNNER_ON_DOSS");
  for (const blocker of ["UIACCESS_MANIFEST_NOT_EMBEDDED", "EXACT_TRUSTED_CODE_SIGNING_IDENTITY_ABSENT", "AUTHENTICODE_CHAIN_NOT_VALID", "ADMIN_ONLY_PROGRAM_FILES_INSTALL_NOT_PROVED", "LIVE_UIACCESS_TOKEN_NOT_PROVED", "SIGNED_ONE_SHOT_NATIVE_ADMISSION_NOT_BOUND", "FOREGROUND_STEALING_RUNNER_REJECTED"]) assert.ok(result.blockers.includes(blocker));
});

test("source-only boundary and exact source custody fail closed", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessArchitecture(observation({ secret_accessed: true }), pins), /SOURCE_ONLY_BOUNDARY_VIOLATED/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessArchitecture(observation({ installation_performed: true }), pins), /SOURCE_ONLY_BOUNDARY_VIOLATED/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessArchitecture(observation({ runner_sha256: hash("d") }), pins), /SOURCE_CUSTODY_MISMATCH/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessArchitecture({ ...observation(), extra: true }, pins), /OBSERVATION_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessArchitecture({ ...observation(), [Symbol("secret")]: true }, pins), /OBSERVATION_INVALID/);
});

test("read-only Doss auditor inspects trust and never installs or accesses the PIN", async () => {
  const source = await readFile(new URL("../Get-PookaKindWindowsSecurityUiAccessReadiness.ps1", import.meta.url), "utf8");
  assert.match(source, /Cert:\\CurrentUser\\My/);
  assert.match(source, /1\.3\.6\.1\.5\.5\.7\.3\.3/);
  assert.match(source, /EnableSecureUIAPaths/);
  assert.match(source, /\/win32manifest:/);
  assert.match(source, /provider_owned_pin_api = 'UNAVAILABLE_FOR_EXISTING_WEBAUTHN_CEREMONY'/);
  assert.doesNotMatch(source, /ProtectedData\.Unprotect|SetValue|Invoke\(|Start-Process|New-SelfSignedCertificate|Import-Certificate|Set-ItemProperty|Copy-Item/);
});
