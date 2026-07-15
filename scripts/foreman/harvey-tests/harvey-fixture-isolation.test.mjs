import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const repo = path.resolve(process.env.HARVEY_REPO_PATH || process.cwd());

async function hashTree(root) {
  const rows = [];
  async function walk(directory) {
    let entries = [];
    try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      if (entry.isFile()) {
        const bytes = await fs.readFile(absolute);
        rows.push(`${path.relative(root, absolute).replaceAll("\\", "/")}:${createHash("sha256").update(bytes).digest("hex")}`);
      }
    }
  }
  await walk(root);
  return createHash("sha256").update(rows.join("\n")).digest("hex");
}

test("fixture writes never mutate repo Harvey data", async () => {
  const dataRoot = path.join(repo, "data", "harvey");
  const before = await hashTree(dataRoot);
  const fixture = path.join(os.tmpdir(), "Werkles-Harvey-Tests", randomUUID());
  await fs.mkdir(fixture, { recursive: true });
  const source = await fs.readFile(path.join(repo, "lib", "harvey", "machine-control.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const compiledPath = path.join(fixture, "machine-control.cjs");
  await fs.writeFile(compiledPath, compiled, "utf8");
  const previous = process.cwd();
  process.chdir(fixture);
  try {
    const require = createRequire(import.meta.url);
    const machineControl = require(compiledPath);
    await machineControl.writeHeartbeat({
      machine: "Doss",
      hostname: "DOSS",
      agent_version: "test",
      capabilities: ["PING"]
    }, { role: "machine", machine: "Doss", hostname: "DOSS", agent_id: "fixture-agent" });
    const heartbeatPath = path.join(fixture, "data", "harvey", "machine-control", "machines", "doss.json");
    const fixtureHeartbeat = JSON.parse(await fs.readFile(heartbeatPath, "utf8"));
    assert.equal(fixtureHeartbeat.hostname, "DOSS");
  } finally {
    process.chdir(previous);
  }
  const after = await hashTree(dataRoot);
  assert.equal(after, before, "repo data/harvey changed during fixture-only test");
  assert.notEqual(path.resolve(fixture).toLowerCase(), path.resolve(repo).toLowerCase());
});
