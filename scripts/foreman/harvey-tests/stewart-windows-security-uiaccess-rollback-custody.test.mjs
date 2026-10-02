import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessSigningInstall, STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release } from "../../../lib/harvey/stewart-windows-security-uiaccess-signing-install.mjs";
import { compileStewartWindowsSecurityUiAccessRollbackCustody } from "../../../lib/harvey/stewart-windows-security-uiaccess-rollback-custody.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const now = Date.parse("2026-08-24T12:00:10Z"); const signer = generateIdentity();
const authority = { public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 };
const payload = { schema: "pookakind.stewart-windows-security-uiaccess-install-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: "a".repeat(64), package_sha256: release.package_sha256, production_executable_sha256: release.production_executable_sha256, certificate_profile: structuredClone(release.certificate_profile), install_root: release.install_root, approved_at: "2026-08-24T12:00:00Z", expires_at: "2026-08-24T12:10:00Z", max_uses: 1, recurrence: false, complete_rollback_required: true };
const record = signDurableRecord(signer.private_key_pem, payload, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-install:DOSS:${payload.operation_id_sha256}` });
const transaction = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: authority, activation_record: record, now });
const thumbprint = "A".repeat(40); const signedAdapter = "b".repeat(64); const signedFixture = "c".repeat(64);
const ownership = { schema: "pookakind.stewart-windows-security-uiaccess-created-identity/v1", operation_id_sha256: transaction.operation_id_sha256, activation_record_sha256: transaction.activation_record_sha256, package_sha256: transaction.package_sha256, certificate_thumbprint: thumbprint, subject: release.certificate_profile.subject, session_nonce_sha256: createHash("sha256").update("nonce").digest("hex") };
const installReceipt = { schema: "pookakind.stewart-windows-security-uiaccess-elevated-install/v1", state: "INSTALLED_ADMIN_ONLY", certificate_thumbprint: thumbprint, adapter_sha256: signedAdapter, fixture_sha256: signedFixture };
const files = [
  ["PookaKindWindowsSecurityUiAccessAdapter.exe", signedAdapter], ["PookaKindWindowsSecurityUiAccessSyntheticFixture.exe", signedFixture],
  ["PookaKindWindowsSecurityUiAccessAdapter.SelfTest.exe", release.self_test_executable_sha256], ["embedded.manifest", release.embedded_manifest_sha256], ["synthetic-fixture.embedded.manifest", release.synthetic_fixture_manifest_sha256],
].map(([name, sha256]) => ({ name, sha256, directory: false, reparse_point: false }));
const observation = { install_root_present: true, files, certificates: ["MY", "ROOT", "TRUSTED_PUBLISHER"].map((store) => ({ store, thumbprint, subject: release.certificate_profile.subject })), processes: [{ name: "PookaKindWindowsSecurityUiAccessSyntheticFixture", path: "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess\\PookaKindWindowsSecurityUiAccessSyntheticFixture.exe" }] };
const fixture = (change = {}) => ({ transaction, ownership, install_receipt: installReceipt, observation, ...change });

test("admits only the exact operation-owned five-file, three-store, process-bound rollback", () => {
  const plan = compileStewartWindowsSecurityUiAccessRollbackCustody(fixture(), now);
  assert.equal(plan.state, "EXACT_OWNED_ROLLBACK_ADMITTED"); assert.equal(plan.files.length, 5); assert.equal(plan.certificate_stores.length, 3); assert.equal(plan.deletes_unrelated_state, false); assert.equal(plan.secret_accessed, false);
});

test("forged ownership, changed transaction, and certificate substitution fail closed", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ ownership: { ...ownership, operation_id_sha256: "d".repeat(64) } }), now), /OWNERSHIP_CONFLICT/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ transaction: { ...transaction, package_sha256: "e".repeat(64) } }), now), /TRANSACTION_INVALID/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, certificates: [{ ...observation.certificates[0], thumbprint: "F".repeat(40) }] } }), now), /CERTIFICATE_INVENTORY_CONFLICT/);
});

test("extra, missing, changed, reparse, directory, accessor, and symbol file state fail closed", () => {
  const variants = [
    [...files, { name: "foreign.dll", sha256: "f".repeat(64), directory: false, reparse_point: false }], files.slice(1), files.map((file, index) => index ? file : { ...file, sha256: "0".repeat(64) }),
    files.map((file, index) => index ? file : { ...file, reparse_point: true }), files.map((file, index) => index ? file : { ...file, directory: true }),
  ];
  for (const changed of variants) assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, files: changed } }), now), /FILE_INVENTORY/);
  const accessor = { ...files[0] }; Object.defineProperty(accessor, "sha256", { get() { throw new Error("GETTER_EXECUTED"); }, enumerable: true });
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, files: [accessor, ...files.slice(1)] } }), now), /FILE_INVENTORY_INVALID/);
  const symbols = [...files]; symbols[Symbol("foreign")] = true; assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, files: symbols } }), now), /FILE_INVENTORY_INVALID/);
});

test("clean partial rollback can remove only the remaining exact owned certificate records", () => {
  const plan = compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ install_receipt: null, observation: { install_root_present: false, files: [], certificates: [observation.certificates[0]], processes: [] } }), now);
  assert.deepEqual(plan.files, []); assert.deepEqual(plan.certificate_stores, ["MY"]); assert.deepEqual(plan.processes, []);
});

test("rollback remains available after the short activation window expires", () => {
  const plan = compileStewartWindowsSecurityUiAccessRollbackCustody(fixture());
  assert.equal(plan.state, "EXACT_OWNED_ROLLBACK_ADMITTED");
});

test("unknown process paths and false clean-root claims fail closed", () => {
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, processes: [{ ...observation.processes[0], path: "C:\\Temp\\fixture.exe" }] } }), now), /PROCESS_INVENTORY_CONFLICT/);
  assert.throws(() => compileStewartWindowsSecurityUiAccessRollbackCustody(fixture({ observation: { ...observation, install_root_present: false } }), now), /INSTALL_RECEIPT_UNEXPECTED/);
});

test("the production driver invokes custody before exact nonrecursive deletion and appends clean proof once", async () => {
  const source = await readFile(new URL("../Invoke-PookaKindWindowsSecurityUiAccessActivation.ps1", import.meta.url), "utf8");
  const rollback = source.slice(source.indexOf("function Invoke-InternalRollback"), source.indexOf("if($Mode-eq'InternalRollback')"));
  assert.match(source, /stewart-windows-security-uiaccess-rollback-custody\.mjs/);
  assert.match(rollback, /Assert-RollbackCustody \$tx \$ownership \$installReceipt \$session/);
  assert.match(rollback, /session_nonce_sha256/);
  assert.match(rollback, /Get-Sha256 \$entry\.FullName/);
  assert.match(rollback, /\[IO\.FileMode\]::CreateNew/);
  assert.doesNotMatch(rollback, /Remove-Item[^\r\n]*-Recurse/);
});
