import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessSigningInstall, runStewartWindowsSecurityUiAccessSigningInstall, verifyStewartWindowsSecurityUiAccessSigningInstallTransaction, STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release } from "../../../lib/harvey/stewart-windows-security-uiaccess-signing-install.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (c) => c.repeat(64); const identity = generateIdentity(); const attacker = generateIdentity(); const now = Date.parse("2026-08-24T12:00:10Z"); const pin = { public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 };
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const exec = promisify(execFile);
const payload = (overrides = {}) => ({ schema: "pookakind.stewart-windows-security-uiaccess-install-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: h("a"), package_sha256: release.package_sha256, production_executable_sha256: release.production_executable_sha256, certificate_profile: structuredClone(release.certificate_profile), install_root: release.install_root, approved_at: "2026-08-24T12:00:00Z", expires_at: "2026-08-24T12:10:00Z", max_uses: 1, recurrence: false, complete_rollback_required: true, ...overrides });
const signed = (body = payload(), signer = identity) => signDurableRecord(signer.private_key_pem, body, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-install:DOSS:${body.operation_id_sha256}` });

test("exact signed gate binds certificate creation parameters without circular thumbprint prebinding", () => { const tx = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: signed(), now }); assert.equal(tx.package_sha256, release.package_sha256); assert.deepEqual(tx.certificate_profile, release.certificate_profile); assert.equal("certificate_thumbprint" in tx, false); assert.equal(verifyStewartWindowsSecurityUiAccessSigningInstallTransaction(tx, now), true); assert.equal(tx.max_uses, 1); assert.equal(tx.recurrence, false); assert.equal(tx.secret_access_allowed, false); assert.equal(tx.windows_security_allowed, false); });
test("unsigned, attacker, tamper, drift, recurrence, and stale gates fail closed", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: { payload: payload() }, now }), /ACTIVATION_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: signed(payload(), attacker), now }), /ACTIVATION_INVALID/);
  const record = signed(); assert.throws(() => compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: { ...record, payload: { ...record.payload, certificate_profile: { ...record.payload.certificate_profile, key_length: 2048 } } }, now }), /ACTIVATION_INVALID/);
  for (const change of [{ package_sha256: h("f") }, { install_root: "C:\\Temp" }, { certificate_profile: { ...release.certificate_profile, key_export_policy: "EXPORTABLE" } }, { recurrence: true }, { max_uses: 2 }, { expires_at: "2026-08-24T12:20:00Z" }]) assert.throws(() => compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: signed(payload(change)), now }), /SCOPE_INVALID|AUTHORITY_STALE/);
});
test("claim burns once, exact replay is byte-stable, and crash-stranded state invokes nothing", async () => {
  const tx = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: signed(), now }); let claimed = false; let terminal = null; let calls = 0;
  const store = { kind: "DURABLE_APPEND_ONCE_V1", read_terminal: async () => terminal, claim_once: async () => { if (claimed) return false; claimed = true; return true; }, append_terminal_once: async (_id, receipt) => (terminal = receipt) };
  const adapter = { inspect: async () => ({ state: "CLEAN_ABSENT" }), sign_once: async () => ({ state: "SIGNED_EXACT_PE", certificate_thumbprint: "A".repeat(40), certificate_profile_sha256: digest(tx.certificate_profile) }), install_once: async () => ({ state: "INSTALLED_ADMIN_ONLY" }), synthetic_proof_once: async () => { calls += 1; return { state: "UIACCESS_BACKGROUND_SYNTHETIC_PASS", foreground_changed: false, secret_accessed: false }; }, rollback_once: async () => ({ state: "CLEAN_ABSENT_VERIFIED" }) };
  const first = await runStewartWindowsSecurityUiAccessSigningInstall({ transaction: tx, store, adapter, now }); const replay = await runStewartWindowsSecurityUiAccessSigningInstall({ transaction: tx, store, adapter, now }); assert.deepEqual(replay, first); assert.equal(first.state, "SYNTHETIC_PROVED_ROLLED_BACK"); assert.equal(first.generated_certificate_thumbprint, "A".repeat(40)); assert.equal(first.live_callable, false); assert.equal(calls, 1);
  terminal = null; const stranded = await runStewartWindowsSecurityUiAccessSigningInstall({ transaction: tx, store, adapter, now }); assert.equal(stranded.state, "CRASH_STRANDED_CLAIM"); assert.equal(calls, 1);
});
test("failure requires rollback and never claims live callable with residual state", async () => {
  const tx = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: pin, activation_record: signed(), now }); const run = async (rollbackState) => runStewartWindowsSecurityUiAccessSigningInstall({ transaction: tx, now, store: { kind: "DURABLE_APPEND_ONCE_V1", read_terminal: async () => null, claim_once: async () => true, append_terminal_once: async (_id, receipt) => receipt }, adapter: { inspect: async () => ({ state: "CLEAN_ABSENT" }), sign_once: async () => { throw new Error("no signer"); }, rollback_once: async () => ({ state: rollbackState }) } });
  assert.equal((await run("CLEAN_ABSENT_VERIFIED")).state, "FAILED_ROLLED_BACK"); const residual = await run("RESIDUAL"); assert.equal(residual.state, "FAILED_RESIDUAL_STATE"); assert.equal(residual.live_callable, false); assert.equal(residual.secret_accessed, false);
});
test("concrete driver pins V2, proves mutation-free dry run, and implements exact elevated install plus rollback", async () => {
  const path = new URL("../Invoke-PookaKindWindowsSecurityUiAccessActivation.ps1", import.meta.url).pathname.slice(1);
  const dry = await exec("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path, "-Mode", "SelfTest"], { maxBuffer: 1024 * 1024 }); const receipt = JSON.parse(dry.stdout.trim());
  assert.equal(receipt.package_sha256, release.package_sha256); assert.equal(receipt.state, "DRY_RUN_PASS"); assert.equal(receipt.file_hashes.fixture, release.synthetic_fixture_executable_sha256); assert.equal(receipt.mutations_performed, false); assert.equal(receipt.secret_accessed, false); assert.equal(receipt.blocker, null);
  const source = await readFile(path, "utf8");
  for (const required of ["New-SelfSignedCertificate", "KeyExportPolicy NonExportable", "Cert:\\LocalMachine\\Root", "Cert:\\LocalMachine\\TrustedPublisher", "Set-AuthenticodeSignature", "Get-AuthenticodeSignature", "icacls.exe", "SYNTHETIC_HIGHER_INTEGRITY_UIA_PASS", "InternalRollback", "-DeleteKey", "CRASH_STRANDED_CLAIM"]) assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /if\(\(Test-Path -LiteralPath \$installRoot\)-or\(Get-OwnedCertificates\)\.Count-ne0\)/);
  assert.match(source, /internal-install-error\/v1/);
  assert.doesNotMatch(source, /CredentialUIBroker|device-pin|--sealed-operation/);
  await assert.rejects(exec("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path, "-Mode", "Execute"]), /EXACT_ACTIVATION_TRANSACTION_REQUIRED|EXECUTE_PARENT_MUST_BE_NON_ELEVATED/);
});
