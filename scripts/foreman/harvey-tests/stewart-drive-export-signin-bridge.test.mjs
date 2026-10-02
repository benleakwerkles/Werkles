import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { bindDisneyDriveExportToStewartSignIn, bindDisneyDriveFileUriToStewartSignIn, disneyDriveExportSourceRef } from "../../../lib/harvey/stewart-drive-export-signin-bridge.mjs";

const HASH = (char) => char.repeat(64);
const extractor = fileURLToPath(new URL("../stewart-drive-export-private-extract.py", import.meta.url));
const liveCli = fileURLToPath(new URL("../stewart-drive-export-bind-once.mjs", import.meta.url));
const python = "C:\\Users\\BenLeak\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const resolver = process.env.STEWART_TEST_RESOLVER;

test("private XLSX extractor passes its synthetic self-test without real credential output", { skip: process.platform !== "win32" }, () => {
  const result = spawnSync(python, [extractor, "--self-test"], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "STEWART_DRIVE_PRIVATE_EXTRACTOR_SELF_TEST_PASS");
});

test("real parser and native DPAPI helper seal a synthetic workbook without returning its cells", { skip: process.platform !== "win32" || !resolver }, () => {
  const root = process.env.LOCALAPPDATA;
  const suffix = randomUUID().replaceAll("-", "");
  const identityName = `synthetic-drive-identity-${suffix}`;
  const passwordName = `synthetic-drive-password-${suffix}`;
  const handleRoot = join(root, "PookaKind", "Stewart", "SecretHandles");
  const generated = spawnSync(python, [extractor, "--synthetic-export"], { encoding: null, windowsHide: true });
  assert.equal(generated.status, 0);
  try {
    const result = bindDisneyDriveExportToStewartSignIn({
      export_bytes: generated.stdout, export_sha256: createHash("sha256").update(generated.stdout).digest("hex"),
      source_file_id: "A".repeat(40), python_executable: python, extractor_path: extractor,
      resolver_executable: resolver, local_app_data: root,
      operation_sha256: HASH("a"), account_ref_sha256: HASH("b"),
      identity_handle_name: identityName, password_handle_name: passwordName,
      run_extract: (exe, args, options) => {
        const child = spawnSync(exe, args, options);
        assert.equal(child.status, 0, child.stderr.toString("utf8"));
        return child;
      },
    });
    assert.equal(result.handles.length, 2);
    assert.equal(result.resolve_handle, undefined);
    assert.equal(result.receipt.plaintext_to_orchestrator, false);
    assert.doesNotMatch(JSON.stringify(result.receipt), /synthetic@example|synthetic-only/);
  } finally {
    for (const name of [identityName, passwordName]) {
      const path = join(handleRoot, `${name}.dpapi`);
      if (existsSync(path)) unlinkSync(path);
    }
    generated.stdout.fill(0);
  }
});

test("private child emits only sealed hashes; orchestrator never receives a credential or resolver", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-drive-bridge-"));
  const source = Buffer.from("synthetic-export-bytes");
  const exportSha = createHash("sha256").update(source).digest("hex");
  const calls = [];
  try {
    const result = bindDisneyDriveExportToStewartSignIn({
      export_bytes: source, export_sha256: exportSha, source_file_id: "A".repeat(40),
      python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
      local_app_data: root, operation_sha256: HASH("a"), account_ref_sha256: HASH("b"),
      identity_handle_name: "test-identity", password_handle_name: "test-current-password",
      run_extract: (_exe, args, options) => {
        assert.deepEqual(args.slice(1, 5), ["--seal-stdin", "Personal", "7", "Disney / Hulu / ESPN"]);
        assert.equal(options.input, source);
        const names = args.slice(7, 9);
        names.forEach((name) => writeFileSync(join(root, "PookaKind", "Stewart", "SecretHandles", `${name}.dpapi`), Buffer.alloc(64, 7)));
        calls.push(...names);
        const sealed = createHash("sha256").update(Buffer.alloc(64, 7)).digest("hex");
        return { status: 0, stdout: Buffer.from(JSON.stringify({ state: "STEWART_DRIVE_SEALED_IN_PRIVATE_PROCESS", sealed_sha256: [sealed, sealed] })), stderr: Buffer.alloc(0) };
      },
    });
    assert.equal(result.handles.length, 2);
    assert.equal(result.receipt.state, "EXACT_DPAPI_SIGN_IN_HANDLES_BOUND_NOT_USED");
    assert.equal(result.receipt.provider_contacted, false);
    assert.equal(result.receipt.secret_material_output, false);
    assert.equal(result.resolve_handle, undefined);
    assert.equal(result.receipt.plaintext_to_orchestrator, false);
    assert.equal(calls.length, 2);
    assert.doesNotMatch(JSON.stringify(result.receipt), /synthetic@example|synthetic-only/);
    assert.deepEqual(calls, ["test-identity", "test-current-password"]);
    assert.equal(readFileSync(join(root, "PookaKind", "Stewart", "SecretHandles", "test-current-password.dpapi")).length, 64);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("source drift rejects before extraction or DPAPI writes", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-drive-drift-"));
  const source = Buffer.from("changed");
  let extracts = 0;
  try {
    assert.throws(() => bindDisneyDriveExportToStewartSignIn({
      export_bytes: source, export_sha256: HASH("a"), source_file_id: "A".repeat(40),
      python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
      local_app_data: root, operation_sha256: HASH("b"), account_ref_sha256: HASH("c"),
      identity_handle_name: "test-identity", password_handle_name: "test-password",
      run_extract: () => { extracts++; throw new Error("must not run"); },
    }), /STEWART_DRIVE_EXPORT_CUSTODY_INVALID/);
    assert.equal(extracts, 0);
    assert.equal(existsSync(join(root, "PookaKind", "Stewart", "SecretHandles")), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("private sealing failure cannot return partial handle success", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-drive-rollback-"));
  const source = Buffer.from("synthetic");
  try {
    assert.throws(() => bindDisneyDriveExportToStewartSignIn({
      export_bytes: source, export_sha256: createHash("sha256").update(source).digest("hex"), source_file_id: "A".repeat(40),
      python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
      local_app_data: root, operation_sha256: HASH("b"), account_ref_sha256: HASH("c"),
      identity_handle_name: "test-identity", password_handle_name: "test-password",
      run_extract: () => ({ status: 1, stdout: Buffer.alloc(0), stderr: Buffer.from("STEWART_DRIVE_SEAL_FAILED_CLOSED") }),
    }), /STEWART_DRIVE_PRIVATE_SEAL_FAILED/);
    assert.equal(existsSync(join(root, "PookaKind", "Stewart", "SecretHandles", "test-identity.dpapi")), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("plaintext or tampered sealed-hash output fails closed", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-drive-output-"));
  const source = Buffer.from("synthetic");
  try {
    assert.throws(() => bindDisneyDriveExportToStewartSignIn({
      export_bytes: source, export_sha256: createHash("sha256").update(source).digest("hex"), source_file_id: "A".repeat(40),
      python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
      local_app_data: root, operation_sha256: HASH("b"), account_ref_sha256: HASH("c"),
      identity_handle_name: "test-identity", password_handle_name: "test-password",
      run_extract: () => ({ status: 0, stdout: Buffer.from("synthetic-only"), stderr: Buffer.alloc(0) }),
    }), /STEWART_DRIVE_PRIVATE_SEAL_FAILED/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("mismatched sealed file is retired before any handle is returned", () => {
  const root = mkdtempSync(join(tmpdir(), "stewart-drive-sealed-drift-"));
  const source = Buffer.from("synthetic");
  const handles = ["test-identity", "test-password"];
  try {
    assert.throws(() => bindDisneyDriveExportToStewartSignIn({
      export_bytes: source, export_sha256: createHash("sha256").update(source).digest("hex"), source_file_id: "A".repeat(40),
      python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
      local_app_data: root, operation_sha256: HASH("b"), account_ref_sha256: HASH("c"),
      identity_handle_name: handles[0], password_handle_name: handles[1],
      run_extract: () => {
        for (const name of handles) writeFileSync(join(root, "PookaKind", "Stewart", "SecretHandles", `${name}.dpapi`), Buffer.alloc(64, 7));
        return { status: 0, stdout: Buffer.from(JSON.stringify({ state: "STEWART_DRIVE_SEALED_IN_PRIVATE_PROCESS",
          sealed_sha256: [HASH("a"), HASH("b")] })), stderr: Buffer.alloc(0) };
      },
    }), /STEWART_DRIVE_SEALED_CUSTODY_INVALID/);
    for (const name of handles) assert.equal(existsSync(join(root, "PookaKind", "Stewart", "SecretHandles", `${name}.dpapi`)), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("orchestration source never decodes credentials or returns a decryption callback", () => {
  const source = readFileSync(fileURLToPath(new URL("../../../lib/harvey/stewart-drive-export-signin-bridge.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(source, /unframe\(|TextDecoder|createDpapiSecretHandleWriter|createDossOpaqueCredentialHandleResolver|resolve_handle/);
  assert.match(source, /plaintext_to_orchestrator: false/);
});

test("live whole-workbook ingress fails before fetch or credential extraction", async () => {
  let fetched = 0;
  await assert.rejects(bindDisneyDriveFileUriToStewartSignIn({ file_uri: {} }, {
    fetch_impl: () => { fetched++; throw new Error("must not fetch"); },
  }), /STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED/);
  assert.equal(fetched, 0);
  const source = Buffer.from("synthetic");
  assert.throws(() => bindDisneyDriveExportToStewartSignIn({
    export_bytes: source, export_sha256: createHash("sha256").update(source).digest("hex"),
    source_file_id: "1yGg4HJQOJxyBkxqly3I4kk3YCeP3oNLDD0JlhCOkqNk",
    python_executable: process.execPath, extractor_path: extractor, resolver_executable: process.execPath,
    local_app_data: tmpdir(), operation_sha256: HASH("b"), account_ref_sha256: HASH("c"),
    identity_handle_name: "test-identity", password_handle_name: "test-password",
    run_extract: () => { throw new Error("must not extract"); },
  }), /STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED/);
});

test("retired live CLI rejects before reading an export URL", () => {
  const result = spawnSync(process.execPath, [liveCli], { input: Buffer.from("synthetic-bearer-url\n"),
    windowsHide: true, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.trim(), "STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED");
});

test("source ref binds file ID and exact export bytes", () => {
  assert.notEqual(disneyDriveExportSourceRef({ file_id: "A".repeat(40), export_sha256: HASH("a") }),
    disneyDriveExportSourceRef({ file_id: "B".repeat(40), export_sha256: HASH("a") }));
  assert.notEqual(disneyDriveExportSourceRef({ file_id: "A".repeat(40), export_sha256: HASH("a") }),
    disneyDriveExportSourceRef({ file_id: "A".repeat(40), export_sha256: HASH("b") }));
});
