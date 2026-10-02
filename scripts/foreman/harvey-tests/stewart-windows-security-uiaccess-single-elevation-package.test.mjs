import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../../..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const builder = join(root, "scripts/foreman/Build-PookaKindWindowsSecurityUiAccessSingleElevationPackage.ps1");
const driver = join(root, "scripts/foreman/Invoke-PookaKindWindowsSecurityUiAccessSingleElevation.ps1");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("builds and expands the exact inactive one-UAC package from committed bytes", async () => {
  const output = await mkdtemp(join(tmpdir(), "stewart-single-uac-package-"));
  const expanded = await mkdtemp(join(tmpdir(), "stewart-single-uac-expanded-"));
  try {
    const built = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", builder, "-OutputDirectory", output], { cwd: root, encoding: "utf8" });
    assert.equal(built.status, 0, built.stderr || built.stdout);
    const receipt = JSON.parse(built.stdout.trim());
    assert.equal(receipt.state, "SOURCE_READY_FOR_EXACT_ACTIVATION_GATE__UNSIGNED_INACTIVE");
    assert.equal(receipt.machine, "DOSS");
    assert.match(receipt.source_commit, /^[a-f0-9]{40}$/);
    assert.equal(receipt.file_count, 14);
    assert.equal(receipt.driver_contract.transaction_identity, "SIGNED_EXACT_APPROVAL_SCOPE_OPERATION_AND_PACKAGE");
    assert.equal(receipt.driver_contract.approval_scope, "DERIVED_PER_SIGNED_OPERATION_V2");
    assert.equal(receipt.driver_contract.replay, "APPROVAL_SCOPE_APPEND_ONCE_TERMINAL_OR_CRASH_STRANDED_CLAIM");
    assert.equal(receipt.driver_contract.max_uac_prompts, 1);
    assert.equal(receipt.driver_contract.transaction_expiry_seconds, 900);
    assert.equal(receipt.driver_contract.proof, "EVENT_DRIVEN_PROVIDER_NEUTRAL_SYNTHETIC_ONLY");
    assert.equal(receipt.driver_contract.preflight_truth.evidence, "SANITIZED_ELEVATED_EXACT_INSTALL_CERTIFICATE_PROCESS_COUNTS");
    assert.equal(receipt.driver_contract.preflight_truth.receipt, "CREATE_NEW_BEFORE_INSTALL");
    assert.deepEqual(receipt.driver_contract.preflight_truth.collision_classes, ["INSTALL_ROOT", "OWNED_CERTIFICATE", "OWNED_PROCESS"]);
    assert.equal(receipt.driver_contract.preflight_truth.secret_accessed, false);
    assert.equal(receipt.driver_contract.terminal_truth.installed, "EXACT_INSTALL_ROOT_PRESENT_ONLY");
    assert.equal(receipt.driver_contract.terminal_truth.rollback_receipt_missing_does_not_imply_installed, true);
    assert.equal(receipt.driver_contract.terminal_truth.clean_without_receipt, "FAILED_CLEAN_BUT_ROLLBACK_RECEIPT_MISSING");
    assert.equal(receipt.driver_contract.recurrence, false);
    assert.equal(receipt.read_only_probe_contract.target_binding, "EXACT_CURRENT_PID_HWND_CLASS_AND_ROUTE_EPOCH");
    assert.equal(receipt.read_only_probe_contract.identity_binding, "TOKEN_UIACCESS_AUTHENTICODE_SIGNER_SECURE_PROGRAM_FILES_PATH");
    assert.deepEqual(receipt.read_only_probe_contract.classifications, ["EXACT_ONE_VALUE_AND_INVOKE", "ZERO_CONTROLS", "AMBIGUOUS", "DRIFT"]);
    assert.ok(Object.entries(receipt.read_only_probe_contract).filter(([key]) => !["target_binding", "identity_binding", "observation", "classifications"].includes(key)).every(([, value]) => value === false));
    assert.equal(receipt.recovery_evidence_contract.state, "RECOVERY_EVIDENCE_VERIFIED__RETRY_NOT_AUTHORIZED");
    assert.equal(receipt.recovery_evidence_contract.rollback_v2_required, true);
    assert.equal(receipt.recovery_evidence_contract.cleanup_proof_grants_retry, false);
    assert.equal(receipt.recovery_evidence_contract.new_authority_required, true);
    assert.equal(receipt.recovery_evidence_contract.mutation_authority, false);
    assert.equal(receipt.sealed_pin_operation_contract.state, "SOURCE_SUPPORTED__NOT_ACTIVATED");
    assert.equal(receipt.sealed_pin_operation_contract.authority, "SEPARATELY_SIGNED_ACCESS_STEWARD_OPERATION_REQUIRED");
    assert.equal(receipt.sealed_pin_operation_contract.secret_custody, "CURRENTUSER_DPAPI_OPAQUE_HANDLE");
    assert.equal(receipt.sealed_pin_operation_contract.max_uses, 1);
    assert.equal(receipt.sealed_pin_operation_contract.foreground_change, false);
    assert.equal(receipt.sealed_pin_operation_contract.cursor_keyboard_clipboard, false);
    assert.equal(receipt.sealed_pin_operation_contract.provider_readback_required, true);
    assert.equal(receipt.sealed_pin_operation_contract.submission_is_fixed, false);
    assert.equal(receipt.sealed_pin_operation_contract.live_action_authority, false);
    assert.ok(receipt.files.some((file) => file.relative_path === "stewart-windows-security-uiaccess-operation.mjs"));
    assert.ok(receipt.files.some((file) => file.relative_path === "stewart-windows-security-one-shot-composition.mjs"));
    assert.ok(receipt.files.some((file) => file.relative_path === "stewart-windows-security-operation-producer.mjs"));
    assert.ok(Object.values(receipt.authority).every((value) => value === false));
    const unpacked = spawnSync("tar.exe", ["-xf", receipt.archive_path, "-C", expanded], { encoding: "utf8" });
    assert.equal(unpacked.status, 0, unpacked.stderr || unpacked.stdout);
    let index = "";
    for (const file of receipt.files) {
      const bytes = await readFile(join(expanded, file.relative_path));
      assert.equal(sha256(bytes), file.sha256);
      assert.equal(bytes.length, file.bytes);
      index += `${file.relative_path}:${file.sha256}\n`;
    }
    assert.equal(sha256(index), receipt.package_sha256);
    assert.equal(sha256(await readFile(receipt.archive_path)), receipt.archive_sha256);
  } finally {
    await rm(output, { recursive: true, force: true });
    await rm(expanded, { recursive: true, force: true });
  }
});

test("driver binds its own bytes and the release tree while keeping one elevation and event-driven proof", async () => {
  const source = await readFile(driver, "utf8");
  assert.match(source, /activation_driver_sha256-ne\$package\.hashes\.driver/);
  assert.match(source, /tx\.package_sha256-ne\$package\.package_sha256/);
  assert.match(source, /stewart-windows-security-uiaccess-single-elevation-signing-install\.mjs/);
  const execute = source.slice(source.indexOf("if($Mode-ne'Execute')"));
  assert.equal((execute.match(/-Verb RunAs/g) ?? []).length, 1);
  assert.match(execute, /'InternalLifecycle'/);
  assert.match(source, /FileSystemWatcher/);
  assert.match(source, /WaitForChanged/);
  assert.match(source, /stewart-windows-security-uiaccess-fixture-event\.mjs/);
  assert.match(source, /stewart-windows-security-read-only-capability-probe\.mjs/);
  assert.match(source, /stewart-windows-security-uiaccess-rollback-evidence\.mjs/);
  assert.match(source, /stewart-windows-security-uiaccess-operation\.mjs/);
  assert.match(source, /stewart-windows-security-one-shot-composition\.mjs/);
  assert.match(source, /stewart-windows-security-operation-producer\.mjs/);
  assert.match(source, /STEWART_WINDOWS_SECURITY_FIXTURE_EVENT_PREEXISTING/);
  assert.match(source, /finally\{if\(\$fixture/);
  assert.match(source, /'CLEAN_ABSENT_VERIFIED'/);
  assert.match(source, /--sealed-operation/);
  assert.match(source, /New-SignedSealedOperation/);
  assert.match(source, /SEALED_OPERATION_SUBMITTED_ROLLED_BACK/);
  assert.match(source, /windows_security_opened=\$sealedSubmitted/);
  assert.doesNotMatch(source, /Start-Sleep|Register-ScheduledTask|New-Service|CredentialUIBroker|device-pin/);
});

test("release custody rejects an uncommitted external transaction generator", async () => {
  const source = await readFile(builder, "utf8");
  assert.match(source, /scripts\/foreman\/New-PookaKindWindowsSecurityUiAccessV3Transaction\.mjs/);
  assert.match(source, /STEWART_WINDOWS_SECURITY_PACKAGE_SOURCE_NOT_COMMITTED/);
});
