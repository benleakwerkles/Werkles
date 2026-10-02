import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const driverUrl = new URL("../Invoke-PookaKindWindowsSecurityUiAccessSingleElevation.ps1", import.meta.url);
const driverPath = driverUrl.pathname.slice(1);
const baseBuilderPath = new URL("../Build-PookaKindWindowsSecurityUiAccessPackage.ps1", import.meta.url).pathname.slice(1);
const verifierPath = new URL("../../../lib/harvey/stewart-windows-security-uiaccess-single-elevation-signing-install.mjs", import.meta.url).pathname.slice(1);
const fixtureEventVerifierPath = new URL("../../../lib/harvey/stewart-windows-security-uiaccess-fixture-event.mjs", import.meta.url).pathname.slice(1);
const probeCompilerPath = new URL("../../../lib/harvey/stewart-windows-security-read-only-capability-probe.mjs", import.meta.url).pathname.slice(1);
const rollbackEvidenceVerifierPath = new URL("../../../lib/harvey/stewart-windows-security-uiaccess-rollback-evidence.mjs", import.meta.url).pathname.slice(1);
const operationCompilerPath = new URL("../../../lib/harvey/stewart-windows-security-uiaccess-operation.mjs", import.meta.url).pathname.slice(1);
const oneShotCompositionPath = new URL("../../../lib/harvey/stewart-windows-security-one-shot-composition.mjs", import.meta.url).pathname.slice(1);
const operationProducerPath = new URL("../../../lib/harvey/stewart-windows-security-operation-producer.mjs", import.meta.url).pathname.slice(1);
const cryptoPath = new URL("../../../lib/harvey/station-crypto-core.mjs", import.meta.url).pathname.slice(1);

test("single-elevation driver keeps self-test mutation free and package bound", async () => {
  const packageDirectory = await mkdtemp(join(tmpdir(), "stewart-single-elevation-self-test-"));
  try {
    await exec("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", baseBuilderPath, "-OutputDirectory", packageDirectory], { maxBuffer: 1024 * 1024 });
    await copyFile(driverPath, join(packageDirectory, "Invoke-PookaKindWindowsSecurityUiAccessSingleElevation.ps1"));
    await copyFile(verifierPath, join(packageDirectory, "stewart-windows-security-uiaccess-single-elevation-signing-install.mjs"));
    await copyFile(fixtureEventVerifierPath, join(packageDirectory, "stewart-windows-security-uiaccess-fixture-event.mjs"));
    await copyFile(probeCompilerPath, join(packageDirectory, "stewart-windows-security-read-only-capability-probe.mjs"));
    await copyFile(rollbackEvidenceVerifierPath, join(packageDirectory, "stewart-windows-security-uiaccess-rollback-evidence.mjs"));
    await copyFile(operationCompilerPath, join(packageDirectory, "stewart-windows-security-uiaccess-operation.mjs"));
    await copyFile(oneShotCompositionPath, join(packageDirectory, "stewart-windows-security-one-shot-composition.mjs"));
    await copyFile(operationProducerPath, join(packageDirectory, "stewart-windows-security-operation-producer.mjs"));
    await copyFile(cryptoPath, join(packageDirectory, "station-crypto-core.mjs"));
    const result = await exec("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", driverPath, "-Mode", "SelfTest", "-PackageDirectory", packageDirectory], { maxBuffer: 1024 * 1024 });
    const receipt = JSON.parse(result.stdout.trim());
    assert.equal(receipt.state, "DRY_RUN_PASS");
    assert.match(receipt.package_sha256, /^[a-f0-9]{64}$/);
    assert.match(receipt.payload_package_sha256, /^[a-f0-9]{64}$/);
    assert.match(receipt.file_hashes.driver, /^[a-f0-9]{64}$/);
    assert.equal(receipt.mutations_performed, false);
    assert.equal(receipt.secret_accessed, false);
    assert.equal(receipt.recurrence_created, false);
  } finally {
    await rm(packageDirectory, { recursive: true, force: true });
  }
});

test("Execute has exactly one UAC lifecycle and event-driven non-elevated proof", async () => {
  const source = await readFile(driverUrl, "utf8");
  const execute = source.slice(source.indexOf("if($Mode-ne'Execute')"));
  assert.equal((execute.match(/-Verb RunAs/g) ?? []).length, 1);
  assert.match(execute, /-Mode','InternalLifecycle'/);
  assert.doesNotMatch(execute, /-Mode','InternalInstall'|-Mode','InternalLaunchFixture'|-Mode','InternalRollback'/);
  assert.match(source, /FileSystemWatcher/);
  assert.match(source, /WaitForChanged/);
  const waitExactFile = source.slice(source.indexOf("function Wait-ExactFile"), source.indexOf("function Assert-FixtureEvent"));
  assert.ok(waitExactFile.indexOf("if(Test-Path") < waitExactFile.indexOf("FileSystemWatcher"), "event-before-watcher must be admitted");
  assert.ok(waitExactFile.indexOf("EnableRaisingEvents") < waitExactFile.lastIndexOf("if(Test-Path"), "watcher-before-event race must be closed by a second read");
  assert.match(source, /\.approval\.claim/);
  assert.match(source, /\$tx\.approval_scope_sha256/);
  assert.match(source, /synthetic-result\.json/);
  assert.match(source, /Invoke-InternalInstall[\s\S]*fixture-launch\.json[\s\S]*synthetic-result\.json[\s\S]*Invoke-InternalRollback/);
  assert.match(source, /FileMode\]::CreateNew/);
  assert.match(source, /exact_process_count/);
  assert.match(source, /LIFECYCLE_TIMEOUT__ELEVATED_ROLLBACK_NOT_CONFIRMED/);
  assert.match(source, /rollback_verified-ne\$true/);
  assert.match(source, /synthetic-receipt\/v2/);
  assert.match(source, /token_uiaccess-ne\$true/);
  assert.match(source, /authenticode_signer_thumbprint-ne\$installReceipt\.certificate_thumbprint/);
  assert.match(source, /secure_program_files_path-ne\$true/);
  assert.match(source, /adapter_elevated-ne\$false/);
  assert.match(source, /target_elevated-ne\$true/);
  assert.match(source, /--read-only-credential-ui-capability-probe/);
  assert.match(source, /New-ProbeRequest/);
  assert.match(source, /Assert-ProbeReceipt/);
  assert.match(source, /credential_ui_probe/);
  assert.match(source, /--sealed-operation/);
  assert.match(source, /New-SignedSealedOperation/);
  assert.match(source, /SUBMITTED_ONCE_AWAITING_PROVIDER_READBACK/);
  assert.match(source, /provider_outcome-ne'OUTCOME_UNPROVEN'/);
  assert.match(source, /fixed-ne\$false/);
  assert.doesNotMatch(source, /Start-Sleep|CredentialUIBroker|device-pin|schtasks|Register-ScheduledTask|New-Service/);
});

test("cleanup is explicit and never auto-launches from lifecycle", async () => {
  const source = await readFile(driverUrl, "utf8");
  assert.match(source, /if\(\$Mode-eq'Cleanup'\)/);
  assert.match(source, /STEWART_WINDOWS_SECURITY_CLEANUP_CUSTODY_MISSING/);
  assert.match(source, /stewart-windows-security-uiaccess-rollback\/v2/);
  for (const binding of ["approval_scope_sha256", "operation_id_sha256", "package_sha256", "activation_record_sha256"]) assert.match(source, new RegExp(`${binding}=\\$tx\\.${binding}`));
  assert.match(source, /session_nonce_sha256=\(Get-TextSha256 \$SessionNonce\)/);
  assert.match(source, /install_root_present=\$residual\.install_root_present/);
  assert.match(source, /owned_certificate_count=\$residual\.owned_certificate_count/);
  assert.match(source, /owned_process_count=\$residual\.owned_process_count/);
  assert.match(source, /secret_accessed=\$false;windows_security_opened=\$false;recurrence_created=\$false/);
  const lifecycle = source.slice(source.indexOf("function Invoke-InternalLifecycle"), source.indexOf("$package=Get-Package"));
  assert.doesNotMatch(lifecycle, /-Verb RunAs/);
});

test("elevated preflight records sanitized collision truth and terminal state cannot infer installation from a missing rollback receipt", async () => {
  const source = await readFile(driverUrl, "utf8");
  const snapshot = source.slice(source.indexOf("function Get-CleanAbsentSnapshot"), source.indexOf("function Assert-Internal"));
  assert.match(snapshot, /install_root_present/);
  assert.match(snapshot, /owned_certificate_count/);
  assert.match(snapshot, /owned_process_count/);
  assert.match(snapshot, /secret_accessed=\$false/);
  assert.doesNotMatch(snapshot, /\.(?:Thumbprint|Subject|Path|CommandLine|MainWindowTitle)/);
  assert.match(source, /elevated-preflight\.json/);
  assert.match(source, /installed=\$residual\.install_root_present/);
  assert.match(source, /FAILED_CLEAN_BUT_ROLLBACK_RECEIPT_MISSING/);
  assert.doesNotMatch(source, /installed=-not\$rollbackVerified/);
});
