import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { deriveStewartWindowsSecurityUiAccessApprovalScope } from "../../../lib/harvey/stewart-windows-security-uiaccess-single-elevation-signing-install.mjs";
import { generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const root = new URL("../../..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const generator = join(root, "scripts/foreman/New-PookaKindWindowsSecurityUiAccessV3Transaction.mjs");
const names = [
  "PookaKindWindowsSecurityUiAccessAdapter.exe",
  "PookaKindWindowsSecurityUiAccessAdapter.SelfTest.exe",
  "embedded.manifest",
  "PookaKindWindowsSecurityUiAccessSyntheticFixture.exe",
  "synthetic-fixture.embedded.manifest",
  "Invoke-PookaKindWindowsSecurityUiAccessSingleElevation.ps1",
  "stewart-windows-security-uiaccess-single-elevation-signing-install.mjs",
  "stewart-windows-security-uiaccess-fixture-event.mjs",
  "stewart-windows-security-read-only-capability-probe.mjs",
  "stewart-windows-security-uiaccess-rollback-evidence.mjs",
  "stewart-windows-security-uiaccess-operation.mjs",
  "stewart-windows-security-one-shot-composition.mjs",
  "stewart-windows-security-operation-producer.mjs",
  "station-crypto-core.mjs",
];

test("transaction generator binds every file in the current fourteen-file one-shot package", async () => {
  const directory = await mkdtemp(join(tmpdir(), "stewart-windows-security-transaction-"));
  const transactionPath = join(directory, "transaction.json");
  try {
    for (const name of names) {
      const source = name === "stewart-windows-security-uiaccess-single-elevation-signing-install.mjs"
        ? join(root, "lib/harvey", name)
        : name === "station-crypto-core.mjs" || name === "stewart-windows-security-uiaccess-rollback-evidence.mjs" || name === "stewart-windows-security-uiaccess-operation.mjs" || name === "stewart-windows-security-one-shot-composition.mjs" || name === "stewart-windows-security-operation-producer.mjs"
          ? join(root, "lib/harvey", name)
          : null;
      if (source) await copyFile(source, join(directory, name));
      else await writeFile(join(directory, name), `synthetic:${name}\n`, "utf8");
    }
    let index = "";
    for (const name of names) index += `${name}:${createHash("sha256").update(await readFile(join(directory, name))).digest("hex")}\n`;
    const expectedPackage = createHash("sha256").update(index).digest("hex");
    const identity = generateIdentity();
    const approved = Date.now();
    const body = { schema: "pookakind.stewart-windows-security-uiaccess-single-elevation-authority/v1", decision: "APPROVED", machine: "DOSS", operation_id_sha256: createHash("sha256").update("operation").digest("hex"), package_sha256: expectedPackage, activation_driver_sha256: createHash("sha256").update(await readFile(join(directory, "Invoke-PookaKindWindowsSecurityUiAccessSingleElevation.ps1"))).digest("hex"), production_executable_sha256: createHash("sha256").update(await readFile(join(directory, "PookaKindWindowsSecurityUiAccessAdapter.exe"))).digest("hex"), certificate_profile: { subject: "CN=PookaKind Stewart Windows Security UIAccess Doss", key_algorithm: "RSA", key_length: 3072, hash_algorithm: "SHA256", eku_oid: "1.3.6.1.5.5.7.3.3", key_export_policy: "NON_EXPORTABLE", not_after_minutes: 60 }, install_root: "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess", approved_at: new Date(approved).toISOString(), expires_at: new Date(approved + 600_000).toISOString(), max_uses: 1, max_uac_prompts: 1, recurrence: false, complete_rollback_required: true };
    const payload = { ...body, approval_scope_sha256: deriveStewartWindowsSecurityUiAccessApprovalScope(body) };
    const authorityPath = join(directory, "operator-authority.json");
    const activationRecordPath = join(directory, "activation-record.json");
    await writeFile(authorityPath, JSON.stringify({ public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }), "utf8");
    await writeFile(activationRecordPath, JSON.stringify(signDurableRecord(identity.private_key_pem, payload, { issuer: "pookakind-operator", audience: `stewart-windows-security-uiaccess-single-elevation:DOSS:${payload.operation_id_sha256}` })), "utf8");
    const result = spawnSync(process.execPath, [generator, directory, authorityPath, activationRecordPath, transactionPath], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const receipt = JSON.parse(result.stdout);
    const transaction = JSON.parse(await readFile(transactionPath, "utf8"));
    assert.equal(receipt.package_sha256, expectedPackage);
    assert.equal(transaction.package_sha256, expectedPackage);
    assert.equal(receipt.authority_self_minted, false);
    assert.equal(receipt.private_key_accessed, false);
    assert.equal(receipt.secret_accessed, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("transaction generator cannot mint or sign its own Operator authority", async () => {
  const source = await readFile(generator, "utf8");
  assert.doesNotMatch(source, /generateIdentity|signDurableRecord|private_key_pem|randomBytes/);
  assert.match(source, /argumentsList\.length !== 4/);
  assert.match(source, /authority_self_minted: false/);
  assert.match(source, /private_key_accessed: false/);
});
