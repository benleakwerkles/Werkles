#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve, sep } from "node:path";
import { chromium } from "playwright";

import { composeDisneyMyDisneyFullConversionDossMachineHands } from "../../lib/harvey/disney-mydisney-full-conversion.mjs";
import { runDisneyMyDisneyEmailOtpTransaction } from "../../lib/harvey/disney-mydisney-email-otp-transaction.mjs";
import { createStewartGeneralizedPlaywrightProviderAdapter } from "../../lib/harvey/stewart-generalized-playwright-provider-adapter.mjs";
import {
  STEWART_GENERALIZED_DISNEY_SESSION_PINS,
} from "../../lib/harvey/stewart-generalized-disney-session-runner.mjs";
import {
  STEWART_SYNTHETIC_DESCRIPTOR,
  STEWART_SYNTHETIC_FIXTURE_PINS,
  STEWART_SYNTHETIC_HTML,
  STEWART_SYNTHETIC_URL,
} from "../../lib/harvey/stewart-generalized-https-synthetic-fixture.mjs";
import { canonicalJson, generateIdentity, signDurableRecord } from "../../lib/harvey/station-crypto-core.mjs";

const HOST_REGISTRY_PATH = "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.werkles.pookakind.stewart_generalized";
const SYNTHETIC_EVENT = "pookakind-stewart-synthetic-terminal";
const HASH = /^[a-f0-9]{64}$/;
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const textDigest = (value) => createHash("sha256").update(String(value), "utf8").digest("hex");
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };

function listPackageFiles(root, directory = root) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) fail("STEWART_DOSS_RUNTIME_PACKAGE_LINK_FORBIDDEN");
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listPackageFiles(root, target));
    else if (entry.isFile()) files.push(relative(root, target).replaceAll("\\", "/"));
    else fail("STEWART_DOSS_RUNTIME_PACKAGE_ENTRY_INVALID");
  }
  return files;
}

export function verifyDossStagedPackageRoot(packageRoot, io = {}) {
  const root = (io.realpath ?? realpathSync)(resolve(packageRoot));
  const files = (io.listFiles ?? listPackageFiles)(root).slice().sort();
  const expected = STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map(({ relative_path }) => relative_path).slice().sort();
  if (canonicalJson(files) !== canonicalJson(expected)) fail("STEWART_DOSS_RUNTIME_PACKAGE_TREE_DRIFT");
  const hashFile = io.hashFile ?? ((target) => createHash("sha256").update(readFileSync(target)).digest("hex"));
  for (const pinned of STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files) {
    const target = join(root, ...pinned.relative_path.split("/"));
    let actual; try { actual = hashFile(target); } catch { fail("STEWART_DOSS_RUNTIME_PACKAGE_FILE_DRIFT"); }
    if (actual !== pinned.sha256) fail("STEWART_DOSS_RUNTIME_PACKAGE_FILE_DRIFT");
  }
  const packageSha256 = createHash("sha256").update(STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_files.map(({ relative_path, sha256 }) => `${relative_path}:${sha256}`).join("\n")).digest("hex");
  if (packageSha256 !== STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256) fail("STEWART_DOSS_RUNTIME_PACKAGE_TREE_DRIFT");
  return Object.freeze({ schema: "pookakind.stewart-generalized-doss-package-readback/v1", state: "EXACT_HASH_VERIFIED", package_sha256: packageSha256, file_count: files.length });
}

export function verifyDossDisneyApprovalLogEntry(approvalLogPath, expectedSha256, io = {}) {
  if (!HASH.test(expectedSha256 ?? "")) fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_ENTRY_INVALID");
  let text; try { text = (io.readText ?? ((target) => readFileSync(target, "utf8")))(resolve(approvalLogPath)); }
  catch { fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_UNREADABLE"); }
  if (typeof text !== "string") fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_UNREADABLE");
  const matches = text.split(/\r?\n/).filter((line) => createHash("sha256").update(line, "utf8").digest("hex") === expectedSha256);
  if (matches.length !== 1) fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_ENTRY_NOT_FOUND");
  const line = matches[0];
  const cells = line.startsWith("|") && line.endsWith("|") ? line.slice(1, -1).split("|").map((cell) => cell.trim()) : [];
  if (cells.length !== 4 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[0])
    || cells[1] !== "STEWART GENERALIZED DISNEY FULL CONVERSION V3"
    || cells[2] !== `DOSS package ${STEWART_GENERALIZED_DISNEY_SESSION_PINS.package_sha256}`
    || cells[3] !== "APPROVED") fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_ENTRY_SCOPE_INVALID");
  return Object.freeze({ schema: "pookakind.stewart-generalized-disney-approval-readback/v1", state: "EXACT_APPROVAL_LOG_ENTRY_VERIFIED", approval_log_entry_sha256: expectedSha256, private_material_read: false });
}

function run(executable, args, input = undefined) {
  const result = spawnSync(executable, args, { windowsHide: true, encoding: "utf8", input, maxBuffer: 1024 * 1024 });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
function within(root, target, code) {
  const base = resolve(root); const candidate = resolve(target);
  if (candidate !== base && !candidate.startsWith(`${base}${sep}`)) fail(code);
  return candidate;
}
function exactProfileRoot(sessionRoot, profilePath) {
  const target = within(sessionRoot, profilePath, "STEWART_DOSS_RUNTIME_PROFILE_PATH_ESCAPE");
  if (target === resolve(sessionRoot)) fail("STEWART_DOSS_RUNTIME_PROFILE_PATH_ESCAPE");
  return target;
}
function writeJsonExclusive(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canonicalJson(value), { encoding: "utf8", flag: "wx", mode: 0o600 });
}
function queryRegistry() {
  const result = run("reg.exe", ["QUERY", HOST_REGISTRY_PATH, "/ve"]);
  if (result.status !== 0) return { state: "ABSENT", manifest_path: null };
  const match = /REG_SZ\s+(.+)$/m.exec(result.stdout);
  if (!match) fail("STEWART_DOSS_RUNTIME_REGISTRY_QUERY_INVALID");
  return { state: "PRESENT", manifest_path: match[1].trim() };
}
function inspectOwnedWindowsState({ sessionRoot, extensionId }) {
  const script = String.raw`
$ErrorActionPreference='Stop'
$sessionRoot=[IO.Path]::GetFullPath($env:POOKAKIND_STEWART_AUDIT_SESSION_ROOT)
$extensionId=$env:POOKAKIND_STEWART_AUDIT_EXTENSION_ID
$processes=@(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { ($_.CommandLine -like "*$sessionRoot*") -or ($_.CommandLine -like "*$extensionId*") -or ($_.CommandLine -like '*stewart-generalized-native-host*') })
$services=@(Get-CimInstance Win32_Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*Stewart*Generalized*' -or $_.PathName -like '*stewart-generalized*' })
$tasks=@(Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -like '*Stewart*Generalized*' -or $_.Actions.Execute -like '*stewart-generalized*' })
$runValues=@()
foreach($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce')) { if(Test-Path $key){ $item=Get-ItemProperty $key; $runValues += @($item.PSObject.Properties | Where-Object { [string]$_.Value -like '*stewart-generalized*' }) } }
$policy=@()
foreach($key in @('HKCU:\Software\Policies\Google\Chrome\ExtensionInstallForcelist','HKCU:\Software\Policies\Google\Chrome\ExtensionSettings')) { if(Test-Path $key){ $policy += @(Get-ItemProperty $key | ConvertTo-Json -Compress) } }
[ordered]@{process_count=$processes.Count;service_count=$services.Count;scheduler_count=$tasks.Count;startup_count=$runValues.Count;policy_match_count=@($policy | Where-Object { $_ -like "*$extensionId*" }).Count} | ConvertTo-Json -Compress`;
  const env = { ...process.env, POOKAKIND_STEWART_AUDIT_SESSION_ROOT: resolve(sessionRoot), POOKAKIND_STEWART_AUDIT_EXTENSION_ID: extensionId };
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, encoding: "utf8", env, maxBuffer: 64 * 1024 });
  if (result.status !== 0) fail("STEWART_DOSS_RUNTIME_WINDOWS_AUDIT_FAILED");
  try { return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)); } catch { fail("STEWART_DOSS_RUNTIME_WINDOWS_AUDIT_INVALID"); }
}
function protectSyntheticHandle({ handleName, path, material }) {
  const script = String.raw`
$ErrorActionPreference='Stop'
$request=[Console]::In.ReadToEnd() | ConvertFrom-Json
$bytes=[Text.UTF8Encoding]::new($false).GetBytes([string]$request.material)
$entropy=[Text.UTF8Encoding]::new($false).GetBytes('Werkles.PookaKind.Stewart.SecretHandle.v1:'+[string]$request.handle_name)
try { $protected=[Security.Cryptography.ProtectedData]::Protect($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser); [IO.File]::WriteAllBytes([string]$request.path,$protected) }
finally { if($bytes){[Array]::Clear($bytes,0,$bytes.Length)};if($entropy){[Array]::Clear($entropy,0,$entropy.Length)};if($protected){[Array]::Clear($protected,0,$protected.Length)} }`;
  const result = run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], JSON.stringify({ handle_name: handleName, path, material }));
  if (result.status !== 0 || !existsSync(path)) fail("STEWART_DOSS_RUNTIME_SYNTHETIC_HANDLE_FAILED");
}
function syntheticConfig({ tabId, operationRoot, resolverPath }) {
  const now = Date.now(); const authority = generateIdentity();
  const operationId = textDigest(`stewart-synthetic:${randomUUID()}`);
  const accountRef = textDigest(`stewart-synthetic-account:${randomUUID()}`);
  const fields = STEWART_SYNTHETIC_DESCRIPTOR.field_descriptors.map(({ role, control_sha256 }, index) => ({ role, control_sha256, handle_ref_sha256: textDigest(`${operationId}:handle:${index}`) }));
  const payload = {
    schema: "pookakind.stewart-background-credential-authority/v1",
    operation_id_sha256: operationId,
    account_ref_sha256: accountRef,
    operation_kind: "SIGN_IN",
    canonical_origin_sha256: textDigest(STEWART_SYNTHETIC_FIXTURE_PINS.origin),
    route_epoch_sha256: textDigest(STEWART_SYNTHETIC_URL),
    tab_id_sha256: textDigest(String(tabId)),
    form_sha256: textDigest("stewart-generalized-native-round-trip-form/v1"),
    fields,
    final_control_sha256: STEWART_SYNTHETIC_FIXTURE_PINS.final_control_sha256,
    provider_response_contract_sha256: STEWART_SYNTHETIC_FIXTURE_PINS.descriptor_sha256,
    issued_at: new Date(now - 1_000).toISOString(),
    expires_at: new Date(now + 25_000).toISOString(),
    max_uses: 1,
    live_execution_authorized: true,
  };
  const audience = ["stewart-background-credential-operation/v1", payload.operation_id_sha256, payload.account_ref_sha256,
    payload.canonical_origin_sha256, payload.route_epoch_sha256, payload.tab_id_sha256, payload.form_sha256,
    digest(payload.fields), payload.final_control_sha256, payload.provider_response_contract_sha256].join(":");
  const handleRoot = join(process.env.LOCALAPPDATA ?? "", "PookaKind", "Stewart", "SecretHandles"); mkdirSync(handleRoot, { recursive: true });
  const handles = fields.map((field, index) => {
    const handle_name = `stewart-synthetic-${operationId.slice(0, 12)}-${index + 1}`;
    const dpapi_path = join(handleRoot, `${handle_name}.bin`);
    protectSyntheticHandle({ handleName: handle_name, path: dpapi_path, material: index === 0 ? "synthetic-fixture" : "synthetic-proof-only" });
    return { ref_sha256: field.handle_ref_sha256, handle_name, dpapi_path };
  });
  const config = {
    schema: "pookakind.stewart-generalized-native-host-config/v1",
    operator_authority: { schema: "pookakind.operator-authority-pin/v1", public_key_pem: authority.public_key_pem, public_key_sha256: authority.public_key_sha256 },
    authority_record: signDurableRecord(authority.private_key_pem, payload, { issuer: "pookakind-operator", audience }),
    descriptor: STEWART_SYNTHETIC_DESCRIPTOR,
    extension_id_sha256: textDigest(STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id),
    handles,
  };
  const configPath = join(operationRoot, "pending-operation.json"); writeJsonExclusive(configPath, config);
  return { configPath, handlePaths: handles.map(({ dpapi_path }) => dpapi_path), resolverPath };
}

export function createDossWindowsMachineHandsRuntime({ packageRoot, sessionRoot, chromeExecutablePath, approvalLogPath, disneyExecutor = null, expectedSessionRefSha256 = null, onOwnedContextChanged = null }) {
  const packagePath = realpathSync(resolve(packageRoot)); const root = resolve(sessionRoot); const chrome = realpathSync(resolve(chromeExecutablePath));
  if (typeof approvalLogPath !== "string" || approvalLogPath.length < 1) fail("STEWART_DOSS_RUNTIME_APPROVAL_LOG_PATH_INVALID");
  if (expectedSessionRefSha256 !== null && !HASH.test(expectedSessionRefSha256)) fail("STEWART_DOSS_RUNTIME_EXPECTED_SESSION_REF_INVALID");
  if (onOwnedContextChanged !== null && typeof onOwnedContextChanged !== "function") fail("STEWART_DOSS_RUNTIME_CONTEXT_OBSERVER_INVALID");
  const extensionPath = join(packagePath, "extension"); const nativeManifestPath = join(packagePath, "com.werkles.pookakind.stewart_generalized.json");
  const resolverPath = join(packagePath, "PookaKindStewartHandleResolver.exe");
  let context = null; let profilePath = null; let sessionRef = null; let operationRoot = null; let syntheticArtifacts = [];
  const inspect = () => inspectOwnedWindowsState({ sessionRoot: root, extensionId: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id });
  return Object.freeze({
    async inspectCleanAbsent({ package: packageObservation, activation }) {
      const packageReadback = verifyDossStagedPackageRoot(packagePath);
      if (packageObservation.package_sha256 !== packageReadback.package_sha256 || packageObservation.file_count !== packageReadback.file_count) fail("STEWART_DOSS_RUNTIME_PACKAGE_OBSERVATION_CONFLICT");
      verifyDossDisneyApprovalLogEntry(approvalLogPath, activation.approval_log_entry_sha256);
      const registry = queryRegistry(); const state = inspect();
      return {
        schema: "pookakind.stewart-generalized-session-preflight/v1", observed_at: new Date().toISOString(),
        package_state: "EXACT_HASH_VERIFIED", package_sha256: packageObservation.package_sha256, native_manifest_sha256: packageObservation.native_manifest_sha256,
        gate_artifact_sha256: STEWART_GENERALIZED_DISNEY_SESSION_PINS.gate_artifact_sha256, approval_log_entry_sha256: activation.approval_log_entry_sha256,
        registry_state: registry.state, policy_state: state.policy_match_count === 0 ? "ABSENT" : "PRESENT",
        service_state: state.service_count === 0 ? "ABSENT" : "PRESENT", scheduler_state: state.scheduler_count === 0 ? "ABSENT" : "PRESENT",
        startup_state: state.startup_count === 0 ? "ABSENT" : "PRESENT", watcher_state: "ABSENT",
        extension_state: state.process_count === 0 ? "ABSENT" : "PRESENT", extension_trust_state: "NOT_LOADED",
        profile_state: existsSync(root) ? "PRESENT" : "NOT_CREATED", profile_owner_process_count: state.process_count,
        imported_disney_session_state: "ABSENT", imported_cookie_count: 0, imported_storage_state: "ABSENT",
      };
    },
    async writeNativeHostRegistry() {
      const result = run("reg.exe", ["ADD", HOST_REGISTRY_PATH, "/ve", "/t", "REG_SZ", "/d", nativeManifestPath, "/f"]);
      if (result.status !== 0) fail("STEWART_DOSS_RUNTIME_REGISTRY_WRITE_FAILED");
      return { state: "WRITTEN", unrelated_state_touched: false };
    },
    async readNativeHostRegistry() {
      const result = queryRegistry();
      return { state: result.state === "PRESENT" && resolve(result.manifest_path) === resolve(nativeManifestPath) ? "EXACT_MATCH" : "MISMATCH", native_manifest_sha256: createHash("sha256").update(readFileSync(nativeManifestPath)).digest("hex") };
    },
    async createUniqueProfile() {
      if (existsSync(root)) fail("STEWART_DOSS_RUNTIME_SESSION_ROOT_ALREADY_EXISTS");
      mkdirSync(root, { recursive: false }); profilePath = join(root, `profile-${randomUUID()}`); mkdirSync(profilePath, { recursive: false }); operationRoot = join(root, "operation"); mkdirSync(operationRoot, { recursive: false });
      return { state: "FRESH_UNIQUE_EMPTY", profile_ref_sha256: textDigest(profilePath), cookie_count: 0, storage_state: "ABSENT", disney_session_state: "ABSENT" };
    },
    async launchFixedExtension({ profile }) {
      if (!profilePath || profile.profile_ref_sha256 !== textDigest(profilePath)) fail("STEWART_DOSS_RUNTIME_PROFILE_CUSTODY_CONFLICT");
      const env = { ...process.env, POOKAKIND_STEWART_GENERALIZED_OPERATION: join(operationRoot, "pending-operation.json"), POOKAKIND_STEWART_GENERALIZED_CONSUMED_ROOT: join(operationRoot, "consumed"), POOKAKIND_STEWART_HANDLE_RESOLVER: resolverPath };
      context = await chromium.launchPersistentContext(profilePath, { executablePath: chrome, headless: true, env, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, "--disable-sync", "--disable-default-apps", "--no-first-run"] });
      onOwnedContextChanged?.(context);
      const storage = await context.storageState(); if (storage.cookies.length !== 0 || storage.origins.length !== 0) fail("STEWART_DOSS_RUNTIME_IMPORTED_STATE_PRESENT");
      const state = inspect(); if (state.process_count < 1) fail("STEWART_DOSS_RUNTIME_PROCESS_OWNERSHIP_UNPROVEN");
      sessionRef = expectedSessionRefSha256 ?? textDigest(`${profilePath}:${randomUUID()}`);
      return { state: "EXACT_OWNED_HEADLESS_SESSION", profile_ref_sha256: profile.profile_ref_sha256, session_ref_sha256: sessionRef, extension_id: STEWART_GENERALIZED_DISNEY_SESSION_PINS.extension_id, owner_process_count: 1, foreground_changed: false, input_devices_touched: false, persistent_profile: false };
    },
    async runPinnedHttpsSyntheticRoundTrip({ session }) {
      if (!context || session.session_ref_sha256 !== sessionRef) fail("STEWART_DOSS_RUNTIME_SESSION_CUSTODY_CONFLICT");
      await context.route(STEWART_SYNTHETIC_URL, async (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: STEWART_SYNTHETIC_HTML, headers: { "Cache-Control": "no-store" } }));
      const page = await context.newPage(); await page.goto(STEWART_SYNTHETIC_URL, { waitUntil: "domcontentloaded" });
      const workers = context.serviceWorkers(); const worker = workers[0] ?? await context.waitForEvent("serviceworker");
      const tabs = await worker.evaluate((url) => new Promise((resolveTabs) => chrome.tabs.query({ url }, resolveTabs)), STEWART_SYNTHETIC_URL);
      if (!Array.isArray(tabs) || tabs.length !== 1 || !Number.isInteger(tabs[0].id)) fail("STEWART_DOSS_RUNTIME_SYNTHETIC_TAB_AMBIGUOUS");
      const prepared = syntheticConfig({ tabId: tabs[0].id, operationRoot, resolverPath }); syntheticArtifacts = [prepared.configPath, ...prepared.handlePaths];
      const terminal = page.evaluate((eventName) => new Promise((resolveTerminal) => document.addEventListener(eventName, () => {
        const marker = document.querySelector('meta[name="pookakind-stewart-synthetic-terminal"]');
        resolveTerminal({ state: marker?.dataset.state ?? "MISSING", provider_state_sha256: marker?.dataset.providerStateSha256 ?? "" });
      }, { once: true })), SYNTHETIC_EVENT);
      await page.evaluate(() => window.postMessage({ schema: "pookakind.stewart-synthetic-start/v1" }, location.origin));
      const result = await terminal; await page.close();
      if (result.state !== "PASS" || !HASH.test(result.provider_state_sha256 ?? "")) fail("STEWART_DOSS_RUNTIME_SYNTHETIC_TERMINAL_INVALID");
      return result;
    },
    async runBoundDisneyTransaction(request) {
      if (typeof disneyExecutor !== "function") fail("STEWART_DOSS_RUNTIME_DISNEY_EXECUTOR_NOT_BOUND");
      return disneyExecutor({ ...request, context, session_ref_sha256: sessionRef });
    },
    async terminateOwnedSession() { if (context) await context.close(); context = null; onOwnedContextChanged?.(null); sessionRef = null; return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    async removeNativeHostRegistry() { const existing = queryRegistry(); if (existing.state === "PRESENT" && resolve(existing.manifest_path) !== resolve(nativeManifestPath)) fail("STEWART_DOSS_RUNTIME_UNRELATED_REGISTRY_PRESENT"); if (existing.state === "PRESENT") { const result = run("reg.exe", ["DELETE", HOST_REGISTRY_PATH, "/f"]); if (result.status !== 0) fail("STEWART_DOSS_RUNTIME_REGISTRY_REMOVE_FAILED"); } return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false }; },
    async removeExactProfile() {
      for (const path of syntheticArtifacts) if (existsSync(path)) rmSync(path, { force: true }); syntheticArtifacts = [];
      if (profilePath && existsSync(profilePath)) { const exact = exactProfileRoot(root, profilePath); rmSync(exact, { recursive: true, force: true }); }
      if (operationRoot && existsSync(operationRoot)) { const exact = exactProfileRoot(root, operationRoot); rmSync(exact, { recursive: true, force: true }); }
      if (existsSync(root)) rmSync(root, { recursive: false, force: true }); profilePath = null; operationRoot = null;
      return { state: "ROLLED_BACK_OR_ALREADY_ABSENT", unrelated_state_touched: false };
    },
    async inspectResidualState() {
      const registry = queryRegistry(); const state = inspect();
      return { schema: "pookakind.stewart-generalized-session-residual-state/v1", registry_state: registry.state, policy_state: state.policy_match_count === 0 ? "ABSENT" : "PRESENT", service_state: state.service_count === 0 ? "ABSENT" : "PRESENT", scheduler_state: state.scheduler_count === 0 ? "ABSENT" : "PRESENT", startup_state: state.startup_count === 0 ? "ABSENT" : "PRESENT", watcher_state: "ABSENT", extension_state: state.process_count === 0 ? "ABSENT" : "PRESENT", profile_state: existsSync(root) ? "PRESENT" : "NOT_CREATED", profile_owner_process_count: state.process_count, generalized_process_count: state.process_count, imported_disney_session_state: "ABSENT", imported_cookie_count: 0, imported_storage_state: "ABSENT", unrelated_state_touched: false };
    },
  });
}

export function createDossWindowsDisneyFullConversionMachineHandsRuntime({
  packageRoot,
  sessionRoot,
  chromeExecutablePath,
  approvalLogPath,
  transaction,
  otpTransaction,
  createDependencies,
}) {
  let ownedContext = null;
  const hands = createDossWindowsMachineHandsRuntime({
    packageRoot,
    sessionRoot,
    chromeExecutablePath,
    approvalLogPath,
    expectedSessionRefSha256: transaction?.owned_session_ref_sha256,
    onOwnedContextChanged: (value) => { ownedContext = value; },
  });
  return composeDisneyMyDisneyFullConversionDossMachineHands({
    hands,
    transaction,
    otp_transaction: otpTransaction,
    create_dependencies: async (request) => {
      if (!ownedContext) fail("STEWART_DOSS_RUNTIME_PROVIDER_CONTEXT_NOT_OWNED");
      const dependencies = await createDependencies(request);
      const provider = createStewartGeneralizedPlaywrightProviderAdapter({
        context: ownedContext,
        full_conversion_transaction: transaction,
        otp_transaction: otpTransaction,
        now: dependencies.now,
      });
      return {
        ...dependencies,
        ...provider,
        runOtp: async (exactOtpTransaction) => runDisneyMyDisneyEmailOtpTransaction({
          transaction: exactOtpTransaction,
          consume: dependencies.consumeOtp,
          resolveHandle: dependencies.resolveOtpHandle,
          observeExtension: provider.observeExtension,
          executeExtension: provider.executeExtension,
          readExtension: provider.readExtension,
          now: dependencies.now,
          randomBytes: dependencies.randomBytes,
        }),
      };
    },
  });
}
