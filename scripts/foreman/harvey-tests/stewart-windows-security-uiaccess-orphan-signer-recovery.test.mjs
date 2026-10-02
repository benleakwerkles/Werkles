import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { compileStewartWindowsSecurityUiAccessSigningInstall, STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release } from "../../../lib/harvey/stewart-windows-security-uiaccess-signing-install.mjs";
import { compileStewartWindowsSecurityUiAccessOrphanSignerRecovery } from "../../../lib/harvey/stewart-windows-security-uiaccess-orphan-signer-recovery.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const now = Date.parse("2026-08-24T12:00:10Z"); const signer = generateIdentity(); const h = (value) => value.repeat(64);
const payload = { schema: "pookakind.stewart-windows-security-uiaccess-install-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: h("a"), package_sha256: release.package_sha256, production_executable_sha256: release.production_executable_sha256, certificate_profile: structuredClone(release.certificate_profile), install_root: release.install_root, approved_at: "2026-08-24T12:00:00Z", expires_at: "2026-08-24T12:10:00Z", max_uses: 1, recurrence: false, complete_rollback_required: true };
const record = signDurableRecord(signer.private_key_pem, payload, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-install:DOSS:${payload.operation_id_sha256}` });
const transaction = compileStewartWindowsSecurityUiAccessSigningInstall({ operator_authority: { public_key_pem: signer.public_key_pem, public_key_sha256: signer.public_key_sha256 }, activation_record: record, now });
const issuedAt = "2026-08-24T12:00:11.000Z";
const intent = { schema: "pookakind.stewart-windows-security-uiaccess-certificate-creation-intent/v1", operation_id_sha256: transaction.operation_id_sha256, activation_record_sha256: transaction.activation_record_sha256, package_sha256: transaction.package_sha256, certificate_profile: structuredClone(release.certificate_profile), session_nonce_sha256: createHash("sha256").update("nonce").digest("hex"), issued_at: issuedAt };
const candidate = { thumbprint: "A".repeat(40), subject: release.certificate_profile.subject, has_private_key: true, key_algorithm: "RSA", key_length: 3072, eku_oid: "1.3.6.1.5.5.7.3.3", not_before: "2026-08-24T12:00:10.000Z", not_after: "2026-08-24T13:00:10.000Z" };
const observation = { install_root_present: false, root_trust_count: 0, trusted_publisher_count: 0, owned_process_count: 0, local_machine_my_candidates: [candidate] };
const fixture = (change = {}) => ({ transaction, creation_intent: intent, observation, ...change });

test("admits only the exact lone signer created in the pre-ownership crash window", () => {
  const plan = compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture());
  assert.equal(plan.state, "EXACT_ORPHAN_SIGNER_DELETE_ADMITTED"); assert.equal(plan.store, "LOCAL_MACHINE_MY"); assert.equal(plan.delete_private_key, true); assert.equal(plan.trust_delete_count, 0); assert.equal(plan.deletes_unrelated_state, false);
});

test("signed transaction, operation, nonce, package, and profile substitutions fail closed", () => {
  for (const changed of [{ ...intent, operation_id_sha256: h("b") }, { ...intent, activation_record_sha256: h("b") }, { ...intent, package_sha256: h("b") }, { ...intent, session_nonce_sha256: "short" }, { ...intent, certificate_profile: { ...intent.certificate_profile, key_length: 2048 } }]) {
    assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ creation_intent: changed })), /INTENT/);
  }
  assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ transaction: { ...transaction, package_sha256: h("c") } })), /TRANSACTION_INVALID/);
});

test("zero, multiple, stale, future, wrong-profile, or nonprivate candidates fail closed", () => {
  const invalid = [[], [candidate, { ...candidate, thumbprint: "B".repeat(40) }], [{ ...candidate, not_before: "2026-08-24T11:59:00.000Z" }], [{ ...candidate, not_before: "2026-08-24T12:03:00.000Z" }], [{ ...candidate, key_length: 2048 }], [{ ...candidate, has_private_key: false }]];
  for (const local_machine_my_candidates of invalid) assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ observation: { ...observation, local_machine_my_candidates } })), /CANDIDATE/);
});

test("any trust, install, process, accessor, symbol, or extra field state fails closed", () => {
  for (const changed of [{ ...observation, root_trust_count: 1 }, { ...observation, trusted_publisher_count: 1 }, { ...observation, install_root_present: true }, { ...observation, owned_process_count: 1 }]) assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ observation: changed })), /SCOPE_EXCEEDED/);
  const accessor = { ...candidate }; let reads = 0; Object.defineProperty(accessor, "thumbprint", { enumerable: true, get() { reads += 1; return "A".repeat(40); } });
  assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ observation: { ...observation, local_machine_my_candidates: [accessor] } })), /CANDIDATE_INVALID/); assert.equal(reads, 0);
  const symbols = [candidate]; symbols[Symbol("smuggle")] = true; assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ observation: { ...observation, local_machine_my_candidates: symbols } })), /CANDIDATES_INVALID/);
  const profileAccessor = { ...intent.certificate_profile }; let profileReads = 0; Object.defineProperty(profileAccessor, "subject", { enumerable: true, get() { profileReads += 1; return release.certificate_profile.subject; } });
  assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture({ creation_intent: { ...intent, certificate_profile: profileAccessor } })), /INTENT_INVALID/); assert.equal(profileReads, 0);
  assert.throws(() => compileStewartWindowsSecurityUiAccessOrphanSignerRecovery({ ...fixture(), extra: true }), /INPUT_INVALID/);
});

test("the driver durably records intent before signer creation and invokes exact orphan recovery", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("../Invoke-PookaKindWindowsSecurityUiAccessActivation.ps1", import.meta.url), "utf8");
  assert.ok(source.indexOf("certificate-creation-intent.json") < source.indexOf("New-SelfSignedCertificate"));
  assert.match(source, /\[IO\.FileMode\]::CreateNew/);
  assert.match(source, /stewart-windows-security-uiaccess-orphan-signer-recovery\.mjs/);
  assert.match(source, /Assert-OrphanSignerRecovery \$tx \$intent \$session/);
});

test("sanitized plan never contains certificate material beyond the public thumbprint", () => {
  const plan = compileStewartWindowsSecurityUiAccessOrphanSignerRecovery(fixture());
  assert.deepEqual(Object.keys(plan).sort(), ["certificate_thumbprint", "delete_private_key", "deletes_unrelated_state", "install_file_delete_count", "operation_id_sha256", "schema", "secret_accessed", "state", "store", "trust_delete_count", "windows_security_opened"].sort());
  assert.doesNotMatch(JSON.stringify(plan), /BEGIN |activation_record|session_nonce|certificate_profile|subject/i);
});
