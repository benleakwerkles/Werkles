import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = new URL("../native/PookaKindStewartLegacyBlindImporter.cs", import.meta.url);

test("legacy importer admits only a pinned one-shot local migration and never emits material", () => {
  const code = readFileSync(source, "utf8");
  assert.match(code, /HumanGateBrainPass\.dpapi\.txt/);
  assert.match(code, /SecretHandles/);
  assert.match(code, /FileMode\.CreateNew/);
  assert.match(code, /DataProtectionScope\.CurrentUser/);
  assert.match(code, /--import-once/);
  assert.match(code, /--verify-match/);
  assert.match(code, /STEWART_LEGACY_DESTINATION_EXISTS/);
  assert.match(code, /STEWART_LEGACY_DESTINATION_MISMATCH/);
  assert.doesNotMatch(code, /Console\.WriteLine\([^"\n]*secret|Console\.WriteLine\([^"\n]*utf8/i);
  assert.doesNotMatch(code, /--source|--destination|--handle|--password/i);
});

test("legacy importer compiles and round-trips only synthetic DPAPI material", { skip: process.platform !== "win32" }, () => {
  const compiler = join(process.env.WINDIR ?? "C:\\Windows", "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");
  const directory = mkdtempSync(join(tmpdir(), "stewart-legacy-importer-"));
  const executable = join(directory, "importer.exe");
  try {
    const build = spawnSync(compiler, ["/nologo", "/target:exe", "/optimize+", "/reference:System.Security.dll", `/out:${executable}`, fileURLToPath(source)], { encoding: "utf8", windowsHide: true });
    assert.equal(build.status, 0, build.stderr || build.stdout);
    const synthetic = spawnSync(executable, ["--self-test"], { encoding: "utf8", windowsHide: true });
    assert.equal(synthetic.status, 0, synthetic.stderr);
    assert.equal(synthetic.stdout.trim(), "STEWART_LEGACY_IMPORTER_SELF_TEST_PASS");
    const forbidden = spawnSync(executable, ["--source", "anything"], { encoding: "utf8", windowsHide: true });
    assert.equal(forbidden.status, 1);
    assert.equal(forbidden.stderr.trim(), "STEWART_LEGACY_ARGUMENT_INVALID");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
