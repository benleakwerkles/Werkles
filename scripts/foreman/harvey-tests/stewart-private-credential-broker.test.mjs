import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = new URL("../native/PookaKindPrivateCredentialBroker.cs", import.meta.url);
const ingress = new URL("../native/PookaKindPrivateGoogleSheetIngress.cs", import.meta.url);
const oauth = new URL("../native/PookaKindPrivateGoogleOAuthBootstrap.cs", import.meta.url);
const installer = new URL("../Install-PookaKindPrivateCredentialBroker.ps1", import.meta.url);
const builder = new URL("../Build-PookaKindPrivateCredentialBrokerPackage.ps1", import.meta.url);
const compiler = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";

test("inactive native broker compiles and refuses an untrusted live launch", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only native broker");
  const root = mkdtempSync(join(tmpdir(), "pookakind-private-broker-test-"));
  try {
    const executable = join(root, "broker.exe");
    const built = spawnSync(compiler, ["/nologo", "/target:exe", `/out:${executable}`,
      "/r:System.Security.dll", "/r:System.ServiceProcess.dll", "/r:System.Web.Extensions.dll",
      fileURLToPath(source), fileURLToPath(ingress), fileURLToPath(oauth)], { encoding: "utf8", windowsHide: true });
    assert.equal(built.status, 0, built.stdout + built.stderr);
    const selfTest = spawnSync(executable, ["--self-test"], { encoding: "utf8", windowsHide: true });
    assert.equal(selfTest.status, 0);
    assert.equal(selfTest.stdout.trim(), "PRIVATE_BROKER_SELF_TEST_PASS");
    const syntheticIngress = spawnSync(executable, ["--self-test-google"], { encoding: "utf8", windowsHide: true });
    assert.equal(syntheticIngress.status, 0);
    assert.equal(syntheticIngress.stdout.trim(), "PRIVATE_GOOGLE_SYNTHETIC_PARSE_PASS");
    const hostileIngress = spawnSync(executable, ["--self-test-google-hostile"], { encoding: "utf8", windowsHide: true });
    assert.equal(hostileIngress.status, 0);
    assert.equal(hostileIngress.stdout.trim(), "PRIVATE_GOOGLE_HOSTILE_PARSE_PASS");
    const oauthSynthetic = spawnSync(executable, ["--self-test-google-oauth"], { encoding: "utf8", windowsHide: true });
    assert.equal(oauthSynthetic.status, 0);
    assert.equal(oauthSynthetic.stdout.trim(), "PRIVATE_GOOGLE_OAUTH_SYNTHETIC_PASS");

    const missing = spawnSync(executable, ["--serve"],
      { encoding: "utf8", windowsHide: true });
    assert.equal(missing.status, 1);
    assert.equal(missing.stderr.trim(), "PRIVATE_BROKER_FAILED_CLOSED");
    const importAttempt = spawnSync(executable, ["--import"], { encoding: "utf8", windowsHide: true });
    assert.equal(importAttempt.status, 1);
    assert.equal(importAttempt.stderr.trim(), "PRIVATE_BROKER_FAILED_CLOSED");
    const oauthAttempt = spawnSync(executable, ["--oauth-bootstrap"], { encoding: "utf8", windowsHide: true });
    assert.equal(oauthAttempt.status, 1);
    assert.equal(oauthAttempt.stderr.trim(), "PRIVATE_BROKER_FAILED_CLOSED");

    const unisolated = spawnSync(executable, ["--serve", join(root, "agent-owned.trust")], { encoding: "utf8", windowsHide: true });
    assert.equal(unisolated.status, 1);
    assert.equal(unisolated.stderr.trim(), "PRIVATE_BROKER_ARGS_INVALID");
    assert.doesNotMatch(unisolated.stdout + unisolated.stderr, /agent_sid=|S-1-5-21/);
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pookakind-private-broker-test-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("offline OAuth bootstrap is broker-owned, PKCE-bound, and never returns token material", () => {
  const native = readFileSync(source, "utf8");
  const bootstrap = readFileSync(oauth, "utf8");
  for (const guard of ["code_challenge_method=S256", "access_type=offline", "spreadsheets.readonly",
    "ExactCallbackCode", "PRIVATE_GOOGLE_OAUTH_CALLBACK_DUPLICATE", "DataProtectionScope.CurrentUser",
    "Program.WritePrivateOnce(refreshPath", "IPAddress.Loopback", "FromMinutes(2)"])
    assert.ok(bootstrap.includes(guard), guard);
  assert.ok(native.includes("GOOGLE_OAUTH_BOOTSTRAP_V1"));
  assert.ok(native.includes("google_refresh_path"));
  assert.ok(native.includes("ExitCode = Serve(importOnly, oauthOnly, true)"));
  assert.ok(native.includes("DiagnosticServiceExitCode(code)"));
  for (const diagnostic of ["return 101;", "return 102;", "return 103;", "return 104;", "return 105;", "return 199;"])
    assert.ok(native.includes(diagnostic));
  assert.doesNotMatch(bootstrap, /Console\.(?:Write|Error)|Process\.Start|SendInput|SetCursorPos/);
});

test("one-shot OAuth launcher waits for one service pipe without provider retry", () => {
  const launcher = readFileSync(new URL("../Start-PookaKindPrivateBrokerGoogleOAuthOnce.ps1", import.meta.url), "utf8");
  assert.match(launcher, /NamedPipeClientStream/);
  assert.match(launcher, /\$pipe\.Connect\(20000\)/);
  assert.match(launcher, /GOOGLE_OAUTH_BOOTSTRAP_V1/);
  assert.match(launcher, /PRIVATE_GOOGLE_OAUTH_SEALED_NOT_USED/);
  assert.match(launcher, /'oauth'\) -Verb RunAs/);
  assert.doesNotMatch(launcher, /Start-Sleep|while\s*\([^)]*service|while\s*\([^)]*Connect|SendInput|SetCursorPos|ProtectedData\.Unprotect/);
  if (process.platform === "win32") {
    const parsed = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `$errors=$null; [System.Management.Automation.Language.Parser]::ParseFile(${JSON.stringify(fileURLToPath(new URL("../Start-PookaKindPrivateBrokerGoogleOAuthOnce.ps1", import.meta.url)))},[ref]$null,[ref]$errors)|Out-Null; if($errors.Count){$errors|ForEach-Object{$_.Message};exit 1}`],
    { encoding: "utf8", windowsHide: true });
    assert.equal(parsed.status, 0, parsed.stdout + parsed.stderr);
  }
});

test("diagnostic upgrade is exact-byte, empty-custody, and recoverably quarantined", () => {
  const upgradeUrl = new URL("../Upgrade-PookaKindPrivateBrokerDiagnosticV3.ps1", import.meta.url);
  const upgrade = readFileSync(upgradeUrl, "utf8");
  for (const guard of ["PRIVATE_BROKER_UPGRADE_NONEMPTY_CUSTODY", "PRIVATE_BROKER_UPGRADE_INSTALLED_BYTES_CONFLICT",
    "PRIVATE_BROKER_UPGRADE_APPROVAL_NOT_RECORDED", "PRIVATE_BROKER_UPGRADE_NEW_SIGNATURE_CONFLICT",
    "Move-Item -LiteralPath $root -Destination $quarantine", "INSTALLED_STOPPED_DIAGNOSTIC_V3__OLD_ROOT_QUARANTINED"])
    assert.ok(upgrade.includes(guard), guard);
  assert.ok(upgrade.indexOf("PRIVATE_BROKER_UPGRADE_APPROVAL_NOT_RECORDED") < upgrade.indexOf("sc.exe\" delete"));
  assert.doesNotMatch(upgrade, /Remove-Item|Start-Service|sc\.exe\s+start|SendInput|SetCursorPos|ProtectedData\.Unprotect/);
  if (process.platform === "win32") {
    const parsed = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `$errors=$null; [System.Management.Automation.Language.Parser]::ParseFile(${JSON.stringify(fileURLToPath(upgradeUrl))},[ref]$null,[ref]$errors)|Out-Null; if($errors.Count){$errors|ForEach-Object{$_.Message};exit 1}`],
    { encoding: "utf8", windowsHide: true });
    assert.equal(parsed.status, 0, parsed.stdout + parsed.stderr);
  }
});

test("broker keeps decryption behind identity, signature, ACL and durable claim", () => {
  const text = readFileSync(source, "utf8");
  for (const guard of ["PRIVATE_BROKER_NOT_ISOLATED", "BrokerOnly(secretPath, brokerSid)",
    "BrokerOnly(executable, brokerSid)", "signed.CheckSignature(true)",
    "PRIVATE_BROKER_EXECUTABLE_SIGNER_INVALID", "FileMode.CreateNew",
    "DataProtectionScope.CurrentUser", "pipe.RunAsClient", "RedirectStandardInput = true",
    "SUBMITTED_ONCE_PROVIDER_UNVERIFIED", "BrokerOnlyDirectory(profileRoot, brokerSid)",
    "PRIVATE_BROKER_CHROME_BYTES_CONFLICT", "SUBMISSION_UNKNOWN_DO_NOT_RESEND",
    "SUBMISSION_AMBIGUOUS_DO_NOT_RESEND"])
    assert.ok(text.includes(guard), guard);
  assert.ok(text.indexOf("FileMode.CreateNew") < text.indexOf("ProtectedData.Unprotect"));
  assert.ok(text.indexOf("ValidateWorkerConfiguration(configPath") < text.indexOf("string claimPath"));
  assert.doesNotMatch(text, /Console\.WriteLine\([^\n]*(?:plain|secret|protectedBytes)/);
});

test("authenticated broker hash custody is read-only metadata, not a credential or conversion receipt", () => {
  const native = readFileSync(source, "utf8");
  const inspect = native.slice(native.indexOf("private static string InspectHashCustody"),
    native.indexOf("private static int Serve("));
  assert.match(native, /frame\.Length == 30 &&\s*Encoding\.ASCII\.GetString\(frame\) == "PRIVATE_BROKER_HASH_CUSTODY_V1"/);
  assert.ok(native.indexOf("Require(observedSid == agentSid") < native.indexOf("InspectHashCustody(trust, brokerSid)"));
  for (const field of ["identity_sha256=", "secret_sha256=", "worker_sha256=",
    "worker_script_sha256=", "worker_config_sha256="]) assert.ok(inspect.includes(field), field);
  assert.match(inspect, /BrokerOnly\(path, brokerSid\)/);
  assert.match(inspect, /ShaFile\(identityPath, MaxSecretBytes\)/);
  assert.match(inspect, /ShaFile\(secretPath, MaxSecretBytes\)/);
  assert.doesNotMatch(inspect, /ProtectedData\.Unprotect|Process\.Start|Console\.|ReadBounded\(secretPath/);
  assert.doesNotMatch(inspect, /SUBMITTED_ONCE|PASSWORD_CONVERTED|PROVIDER_ACCEPTED/);
});

test("service installer is exact-package gated and demand-start without automatic execution", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only service installer");
  const path = fileURLToPath(installer);
  const command = `$errors=$null; [System.Management.Automation.Language.Parser]::ParseFile(${JSON.stringify(path)},[ref]$null,[ref]$errors)|Out-Null; if($errors.Count){$errors|ForEach-Object{$_.Message};exit 1}`;
  const parsed = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    command],
  { encoding: "utf8", windowsHide: true });
  assert.equal(parsed.status, 0, parsed.stdout + parsed.stderr);
  const script = readFileSync(installer, "utf8");
  for (const guard of ["PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED",
    "PRIVATE_BROKER_PROVIDER_CONFIG_NOT_BOUND",
    "PRIVATE_BROKER_INSTALLER_HASH_INVALID", "PRIVATE_BROKER_PACKAGE_HASH_INVALID",
    "PRIVATE_BROKER_SIGNATURE_INVALID", "PRIVATE_BROKER_SERVICE_ALREADY_EXISTS",
    "PRIVATE_BROKER_INSTALL_ROOT_NOT_CLEAN", "PRIVATE_BROKER_ADMIN_REQUIRED",
    "NT SERVICE\\$serviceName", "'start=', 'demand'", "PrivateAcl $root $serviceSid $true",
    "PrivateAcl $trustPath $serviceSid $false", "INSTALLED_STOPPED__GOOGLE_CONSENT_NOT_DONE"])
    assert.ok(script.includes(guard), guard);
  for (const guard of ["[Parameter(Mandatory)][string]$GoogleSpreadsheetId",
    "[Parameter(Mandatory)][string]$GoogleExactRange",
    "[Parameter(Mandatory)][string]$GoogleExpectedTitle",
    "PRIVATE_BROKER_GOOGLE_TARGET_INVALID",
    "google_source_target_sha256 = $targetHash",
    "`:$targetHash", "google_spreadsheet_id=$GoogleSpreadsheetId",
    "google_exact_range=$GoogleExactRange", "google_expected_title=$GoogleExpectedTitle",
    "identity_path=$(Join-Path $root 'identity.dpapi')",
    "secret_path=$(Join-Path $root 'secret.dpapi')"])
    assert.ok(script.includes(guard), guard);
  assert.ok(script.indexOf("PRIVATE_BROKER_GOOGLE_TARGET_INVALID") <
    script.indexOf("PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED"));
  assert.ok(script.indexOf("PRIVATE_BROKER_PROVIDER_CONFIG_NOT_BOUND") <
    script.indexOf("PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED"));
  assert.match(script, /Set-Acl -LiteralPath \$path -AclObject \$acl -ErrorAction Stop/);
  assert.doesNotMatch(script, /\[IO\.(?:File|Directory)\]::SetAccessControl/);
  assert.doesNotMatch(script, /Start-Service|sc\.exe\s+start|New-ScheduledTask|Register-ScheduledTask|Start-Process|Invoke-WebRequest|SendInput/);
});

test("append-only approval history does not veto a later exact-bound replacement", () => {
  const script = readFileSync(installer, "utf8");
  assert.match(script, /\$_\.Contains\(\$marker\) -and \$_\.Contains\('APPROVED — DEMAND_START_ONE_SHOT_SERVICE'\)[\s\S]*?\}\)\.Count -ge 1\) 'PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED'/);
  assert.doesNotMatch(script, /\}\)\.Count -eq 1\) 'PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED'/);
  assert.ok(script.indexOf("PRIVATE_BROKER_SIGNATURE_INVALID") < script.indexOf("PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED"));
  assert.ok(script.indexOf("PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED") < script.indexOf("PRIVATE_BROKER_SERVICE_ALREADY_EXISTS"));
});

test("provider binding packages actual one-page bytes and installs every native worker dependency", () => {
  const build = readFileSync(builder, "utf8");
  const install = readFileSync(installer, "utf8");
  assert.ok(build.indexOf("PRIVATE_BROKER_PROVIDER_CONFIG_NOT_EXACT") < build.indexOf("[System.IO.Directory]::CreateDirectory($bundle)"));
  for (const guard of ["[string]$ProviderConfigPath", "provider_config = $providerState",
    "worker_config_sha256 = $configHash", "private-browser-one-shot/v1",
    "$origin.Host -ne $submit.Host", "$origin.Query -or $submit.Query",
    "PRIVATE_BROKER_PROVIDER_CONFIG_FIELDS_INVALID"])
    assert.ok(build.includes(guard), guard);
  for (const guard of ["PRIVATE_BROKER_WORKER_PACKAGE_HASH_INVALID", "PRIVATE_BROKER_WORKER_CONFIG_CONFLICT",
    "worker_path=$targetNode", "worker_script_path=$targetWorker", "worker_config_path=$targetConfig",
    "claim_root=$claimRoot", "signer_thumbprint=$($ScopeSignerThumbprint.ToUpperInvariant())",
    "PrivateAcl $targetNode $serviceSid $false", "PrivateAcl $targetConfig $serviceSid $false",
    "PrivateAcl $profileRoot $serviceSid $true", "PrivateAcl $claimRoot $serviceSid $true",
    "POOKAKIND_PRIVATE_BROKER_DOSS_V2"])
    assert.ok(install.includes(guard), guard);
  assert.ok(install.indexOf("PRIVATE_BROKER_WORKER_PACKAGE_HASH_INVALID") <
    install.indexOf("PRIVATE_BROKER_EXACT_ACTIVATION_NOT_RECORDED"));
});

test("package builder rejects an email-first cross-origin config before making a package", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only package builder");
  const signerCheck = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "@(Get-ChildItem -Path 'Cert:\\CurrentUser\\My' -CodeSigningCert | Where-Object { $_.HasPrivateKey -and $_.NotBefore -le (Get-Date) -and $_.NotAfter -gt (Get-Date) }).Count"],
  { encoding: "utf8", windowsHide: true });
  if (signerCheck.status !== 0 || signerCheck.stdout.trim() !== "1") return t.skip("Exact signing identity unavailable");
  const root = mkdtempSync(join(tmpdir(), "pookakind-private-package-test-"));
  try {
    const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const digest = (value) => createHash("sha256").update(value).digest("hex");
    const config = {
      schema: "pookakind.private-browser-one-shot/v1", chrome_executable: chrome,
      chrome_executable_sha256: digest(readFileSync(chrome)),
      profile_root: "C:\\ProgramData\\PookaKind\\PrivateCredentialBroker\\profiles",
      start_url: "https://my.disney.com/", expected_submit_url: "https://login.disney.com/finish-authorize",
      origin_sha256: digest("https://my.disney.com"), account_ref_sha256: digest("synthetic-account"),
      action: "SIGN_IN", identity_selector: "#lookupValue", password_selector: "input[type=password]",
      confirm_selector: null, submit_selector: "#id-flow"
    };
    const configPath = join(root, "config.json");
    const outputRoot = join(root, "out");
    writeFileSync(configPath, JSON.stringify(config));
    const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-File", fileURLToPath(builder),
      "-OutputRoot", outputRoot, "-ProviderConfigPath", configPath], { encoding: "utf8", windowsHide: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /PRIVATE_BROKER_PROVIDER_CONFIG_NOT_EXACT/);
    assert.equal(existsSync(outputRoot), false);
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pookakind-private-package-test-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("package builder binds a synthetic same-origin provider with exact worker bytes", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only package builder");
  const root = mkdtempSync(join(tmpdir(), "pookakind-private-package-test-"));
  try {
    const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const digest = (value) => createHash("sha256").update(value).digest("hex");
    const config = {
      schema: "pookakind.private-browser-one-shot/v1", chrome_executable: chrome,
      chrome_executable_sha256: digest(readFileSync(chrome)),
      profile_root: "C:\\ProgramData\\PookaKind\\PrivateCredentialBroker\\profiles",
      start_url: "https://example.invalid/login", expected_submit_url: "https://example.invalid/submit",
      origin_sha256: digest("https://example.invalid"), account_ref_sha256: digest("synthetic-account"),
      action: "SIGN_IN", identity_selector: "#identity", password_selector: "#password",
      confirm_selector: null, submit_selector: "#submit"
    };
    const configPath = join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(config));
    const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-File", fileURLToPath(builder),
      "-OutputRoot", join(root, "out"), "-ProviderConfigPath", configPath],
    { encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const packageResult = JSON.parse(result.stdout.trim());
    const manifest = JSON.parse(readFileSync(join(packageResult.package_path, "manifest.json"), "utf8"));
    assert.equal(manifest.provider_config, "EXACT_BOUND");
    assert.equal(manifest.provider_origin_sha256, config.origin_sha256);
    assert.equal(manifest.provider_account_ref_sha256, config.account_ref_sha256);
    assert.equal(manifest.provider_action, "SIGN_IN");
    assert.equal(manifest.worker_config_sha256, digest(readFileSync(join(packageResult.package_path, "worker-config.json"))));
    assert.equal(manifest.worker_script_sha256, digest(readFileSync(join(packageResult.package_path, "private-credential-browser-worker.mjs"))));
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pookakind-private-package-test-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("package builder binds a V2 cross-origin identity-first route as exact inactive bytes", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only package builder");
  const root = mkdtempSync(join(tmpdir(), "pookakind-private-package-test-"));
  try {
    const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const digest = (value) => createHash("sha256").update(value).digest("hex");
    const config = {
      schema: "pookakind.private-browser-one-shot/v2", chrome_executable: chrome,
      chrome_executable_sha256: digest(readFileSync(chrome)),
      profile_root: "C:\\ProgramData\\PookaKind\\PrivateCredentialBroker\\profiles",
      start_url: "https://entry.example.invalid/", expected_submit_url: "https://auth.example.invalid/submit",
      origin_sha256: digest("https://auth.example.invalid"), account_ref_sha256: digest("synthetic-account"),
      action: "SIGN_IN", steps: [
        { kind: "PUBLIC_CLICK", selector: "#sign_in", expected_origin: "https://auth.example.invalid",
          expected_path_prefix: "/identify" },
        { kind: "IDENTITY_CONTINUE", identity_selector: "#identity", submit_selector: "#next",
          expected_request_url: "https://auth.example.invalid/identify",
          expected_origin: "https://auth.example.invalid", expected_path_prefix: "/password" }
      ], identity_selector: null, password_selector: "#password", confirm_selector: null,
      submit_selector: "#submit"
    };
    const configPath = join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(config));
    const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-File", fileURLToPath(builder),
      "-OutputRoot", join(root, "out"), "-ProviderConfigPath", configPath],
    { encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const packageResult = JSON.parse(result.stdout.trim());
    const manifest = JSON.parse(readFileSync(join(packageResult.package_path, "manifest.json"), "utf8"));
    assert.equal(manifest.provider_config, "EXACT_BOUND");
    assert.equal(manifest.provider_origin_sha256, config.origin_sha256);
    assert.equal(manifest.worker_config_sha256,
      digest(readFileSync(join(packageResult.package_path, "worker-config.json"))));
    assert.equal(manifest.worker_script_sha256,
      digest(readFileSync(join(packageResult.package_path, "private-credential-browser-worker.mjs"))));
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pookakind-private-package-test-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("package builder binds a separate V2 API submit origin without broadening the page route", (t) => {
  if (process.platform !== "win32") return t.skip("Windows-only package builder");
  const root = mkdtempSync(join(tmpdir(), "pookakind-private-package-test-"));
  try {
    const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const digest = (value) => createHash("sha256").update(value).digest("hex");
    const config = {
      schema: "pookakind.private-browser-one-shot/v2", chrome_executable: chrome,
      chrome_executable_sha256: digest(readFileSync(chrome)),
      profile_root: "C:\\ProgramData\\PookaKind\\PrivateCredentialBroker\\profiles",
      start_url: "https://login.example.invalid/", expected_submit_url: "https://api.example.invalid/token",
      origin_sha256: digest("https://api.example.invalid"), account_ref_sha256: digest("synthetic-account"),
      action: "SIGN_IN", steps: [], identity_selector: "#identity", password_selector: "#password",
      confirm_selector: null, submit_selector: "#submit"
    };
    const configPath = join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(config));
    const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-File", fileURLToPath(builder),
      "-OutputRoot", join(root, "out"), "-ProviderConfigPath", configPath],
    { encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const packageResult = JSON.parse(result.stdout.trim());
    const manifest = JSON.parse(readFileSync(join(packageResult.package_path, "manifest.json"), "utf8"));
    assert.equal(manifest.provider_config, "EXACT_BOUND");
    assert.equal(manifest.provider_origin_sha256, config.origin_sha256);
    assert.equal(manifest.worker_config_sha256,
      digest(readFileSync(join(packageResult.package_path, "worker-config.json"))));
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pookakind-private-package-test-")));
    rmSync(root, { recursive: true, force: true });
  }
});
