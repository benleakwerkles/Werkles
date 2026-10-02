import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { observeStewartDisneyDynamicPackage } from "../../../lib/harvey/stewart-disney-dynamic-package-custody.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const treeDigest = (records) => sha256(records.map(({ relative_path, sha256: digest }) => `${relative_path}:${digest}`).join("\n"));

test("builds a pinned inactive native-host and extension package without installation", () => {
  const output = mkdtempSync(join(tmpdir(), "stewart-generalized-package-test-"));
  const script = resolve("scripts/foreman/Build-PookaKindStewartGeneralizedPackage.ps1");
  const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, "-NodeExecutable", process.execPath, "-OutputDirectory", output], { encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const receipt = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(receipt.state, "PINNED_PACKAGE_BUILT_NOT_INSTALLED");
  assert.equal(receipt.runtime_profile, "GENERALIZED");
  assert.equal(receipt.extension_id, "dlkekkfjpgfghllndmdjffnfnpencdge");
  assert.equal(receipt.native_host_name, "com.werkles.pookakind.stewart_generalized");
  assert.equal(receipt.extension_load, "HUMAN_GATE_CHROME_LOAD_UNPACKED");
  assert.equal(receipt.native_host_registry, "PREPARED_NOT_WRITTEN");
  assert.equal(receipt.installs_anything, false);
  assert.equal(receipt.recurring_operation_created, false);
  assert.equal(receipt.package_files.length, receipt.package_file_count);
  assert.equal(receipt.extension_files.length, 4);
  for (const record of receipt.package_files) {
    const bytes = readFileSync(join(output, ...record.relative_path.split("/")));
    assert.equal(sha256(bytes), record.sha256, record.relative_path);
  }
  assert.equal(treeDigest(receipt.package_files), receipt.package_sha256);
  const dynamicObservation = observeStewartDisneyDynamicPackage(output);
  assert.deepEqual(dynamicObservation.files, receipt.package_files);
  assert.equal(dynamicObservation.package_sha256, receipt.package_sha256);
  assert.equal(treeDigest(receipt.extension_files), receipt.extension_bundle_sha256);
  assert.equal(sha256(readFileSync(join(output, "com.werkles.pookakind.stewart_generalized.json"))), receipt.native_manifest_sha256);
  const packagedEntrypoint = join(output, "scripts", "foreman", "stewart-disney-deferred-package-entrypoint.mjs");
  const load = spawnSync(process.execPath, ["--input-type=module", "--eval", `await import(${JSON.stringify(new URL(`file:///${packagedEntrypoint.replaceAll("\\", "/")}`).href)})`], { encoding: "utf8", windowsHide: true });
  assert.equal(load.status, 0, load.stderr || load.stdout);
  const packaged = (relative) => join(output, ...relative.split("/"));
  const disneySource = packaged("lib/harvey/disney-mydisney-email-otp-transaction.mjs");
  const identityBindingSource = packaged("lib/harvey/authenticated-inbox-identity-dpapi-binding.mjs");
  const disneyRuntimeSource = packaged("scripts/foreman/stewart-generalized-disney-doss-one-shot-runtime.mjs");
  const deferredRuntimeSource = packaged("lib/harvey/password-provider-deferred-execution.mjs");
  const deferredLiveAdapterSource = packaged("lib/harvey/stewart-disney-deferred-live-adapter.mjs");
  const deferredConcreteDriverSource = packaged("lib/harvey/stewart-disney-deferred-concrete-driver.mjs");
  const amazonSource = packaged("lib/harvey/stewart-generalized-amazon-sign-in.mjs");
  const runtimeManifest = readFileSync(join(output, "runtime.sha256"), "utf8");
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(disneySource))} ${disneySource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(identityBindingSource))} ${identityBindingSource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(disneyRuntimeSource))} ${disneyRuntimeSource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(deferredRuntimeSource))} ${deferredRuntimeSource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(deferredLiveAdapterSource))} ${deferredLiveAdapterSource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(deferredConcreteDriverSource))} ${deferredConcreteDriverSource.replaceAll("\\", "\\\\")}`));
  assert.match(runtimeManifest, new RegExp(`${sha256(readFileSync(amazonSource))} ${amazonSource.replaceAll("\\", "\\\\")}`));
  assert.doesNotMatch(runtimeManifest, new RegExp(resolve("lib/harvey").replaceAll("\\", "\\\\")));
  for (const relative of [
    "PookaKindStewartGeneralizedHostLauncher.exe",
    "PookaKindStewartHandleResolver.exe",
    "com.werkles.pookakind.stewart_generalized.json",
    "runtime.sha256",
    "extension/manifest.json",
    "extension/service-worker.js",
    "extension/content-runtime.js",
    "extension/content-script.js",
    "scripts/foreman/stewart-generalized-native-host.mjs",
    "scripts/foreman/stewart-disney-deferred-package-entrypoint.mjs",
    "lib/harvey/stewart-disney-dynamic-package-custody.mjs",
    "node_modules/@1password/sdk/package.json",
    "node_modules/@1password/sdk-core/package.json",
    "node_modules/playwright/package.json",
    "node_modules/playwright-core/package.json",
  ]) assert.equal(existsSync(join(output, relative)), true, relative);
  const manifest = JSON.parse(readFileSync(join(output, "extension", "manifest.json"), "utf8"));
  assert.equal(manifest.key.length > 100, true);
  assert.deepEqual(manifest.permissions, ["nativeMessaging"]);
  assert.deepEqual(manifest.host_permissions, ["https://*/*"]);
});

test("builds an Amazon-only package whose runtime pins cannot drift with Disney", () => {
  const output = mkdtempSync(join(tmpdir(), "stewart-amazon-package-test-"));
  const script = resolve("scripts/foreman/Build-PookaKindStewartGeneralizedPackage.ps1");
  const result = spawnSync("pwsh.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, "-NodeExecutable", process.execPath, "-OutputDirectory", output, "-RuntimeProfile", "AMAZON_PASSWORD_FALLBACK"], { encoding: "utf8", windowsHide: true, maxBuffer: 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const receipt = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(receipt.runtime_profile, "AMAZON_PASSWORD_FALLBACK");
  assert.equal(receipt.state, "PINNED_PACKAGE_BUILT_NOT_INSTALLED");
  assert.equal(receipt.installs_anything, false);
  const runtimeManifest = readFileSync(join(output, "runtime.sha256"), "utf8");
  assert.match(runtimeManifest, /stewart-generalized-amazon-sign-in\.mjs/);
  assert.doesNotMatch(runtimeManifest, /disney|onepassword|vault-exact-one/i);
  assert.equal(existsSync(join(output, "lib", "harvey", "stewart-generalized-amazon-sign-in.mjs")), true);
  for (const record of receipt.package_files) {
    const bytes = readFileSync(join(output, ...record.relative_path.split("/")));
    assert.equal(sha256(bytes), record.sha256, record.relative_path);
  }
  assert.equal(treeDigest(receipt.package_files), receipt.package_sha256);
});
