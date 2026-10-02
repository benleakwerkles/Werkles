import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { observeStewartDisneyDynamicPackage, verifyStewartDisneyDynamicActivation, verifyStewartDisneyDynamicApprovalLog } from "../../../lib/harvey/stewart-disney-dynamic-package-custody.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../../lib/harvey/station-crypto-core.mjs";

const h = (value) => createHash("sha256").update(value).digest("hex");
const now = Date.parse("2026-09-21T23:59:00.000Z");

test("observes arbitrary complete package bytes without embedding their future package hash", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-dynamic-package-"));
  try {
    mkdirSync(join(root, "extension"));
    for (let index = 0; index < 9; index++) writeFileSync(index === 0 ? join(root, "extension", "manifest.json") : join(root, `file-${index}.bin`), `bytes-${index}`);
    const observed = observeStewartDisneyDynamicPackage(root);
    assert.equal(observed.state, "EXACT_HASH_VERIFIED"); assert.equal(observed.file_count, 9); assert.match(observed.package_sha256, /^[a-f0-9]{64}$/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("activation binds exact package, entrypoint, ten stages and six provider actions", () => {
  const identity = generateIdentity(); const entrypoint = h("entrypoint");
  const files = Array.from({ length: 9 }, (_, index) => ({ relative_path: `file-${index}`, sha256: h(`file-${index}`) }));
  const packageFiles = createHash("sha256").update(canonicalJson(files)).digest("hex");
  const packageObservation = { schema: "pookakind.stewart-disney-dynamic-package-observation/v1", state: "EXACT_HASH_VERIFIED", package_sha256: h(files.map(({ relative_path, sha256 }) => `${relative_path}:${sha256}`).join("\n")), package_files_sha256: packageFiles, file_count: 9, files };
  const payload = { schema: "pookakind.stewart-disney-dynamic-activation/v1", decision: "APPROVED", issued_at: "2026-09-21T23:58:00.000Z", expires_at: "2026-09-22T00:03:00.000Z", machine: "DOSS", provider_id: "DISNEY_MYDISNEY", package_sha256: packageObservation.package_sha256, package_files_sha256: packageObservation.package_files_sha256, entrypoint_sha256: entrypoint, source_commit: "a".repeat(40), source_release_sha256: h("release"), operation_sha256: h("operation"), account_ref_sha256: h("account"), approval_log_entry_sha256: h("approval"), stage_count: 10, max_provider_actions: 6, one_shot: true, recurrence: false, foreground_changed: false, input_devices_touched: false, secret_material_output: false };
  const record = signDurableRecord(identity.private_key_pem, payload, { issuer: "pookakind-operator", audience: "stewart-disney-dynamic-package/v1" });
  const verified = verifyStewartDisneyDynamicActivation({ package_observation: packageObservation, operator_authority: { schema: "pookakind.operator-authority-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, activation_record: record, entrypoint_sha256: entrypoint, now });
  assert.equal(verified.package_sha256, packageObservation.package_sha256); assert.equal(verified.stage_count, 10);
  assert.throws(() => verifyStewartDisneyDynamicActivation({ package_observation: packageObservation, operator_authority: { schema: "pookakind.operator-authority-pin/v1", public_key_pem: identity.public_key_pem, public_key_sha256: identity.public_key_sha256 }, activation_record: record, entrypoint_sha256: h("drift"), now }), /ACTIVATION_INVALID/);
});

test("approval readback requires one exact hashed approved line containing the package", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-dynamic-approval-"));
  try {
    const packageSha = h("package"); const line = `| 2026-09-21 | Stewart Disney V6 | DOSS package ${packageSha} | APPROVED |`; const path = join(root, "approval.md"); writeFileSync(path, `${line}\n`);
    assert.equal(verifyStewartDisneyDynamicApprovalLog({ approval_log_path: path, approval_log_entry_sha256: h(line), package_sha256: packageSha }).state, "EXACT_APPROVAL_LOG_ENTRY_VERIFIED");
    assert.throws(() => verifyStewartDisneyDynamicApprovalLog({ approval_log_path: path, approval_log_entry_sha256: h("wrong"), package_sha256: packageSha }), /NOT_FOUND/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
