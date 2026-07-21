#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const cliArgs = process.argv.slice(2);
const staged = cliArgs.includes("--staged");
const positionalArgs = cliArgs.filter((arg) => arg !== "--staged");
assert.ok(positionalArgs.length <= 1, "usage: j-ownership-guard-vpg30.mjs [manifest.json] [--staged]");
const manifestPath = positionalArgs[0] || "foreman/receipts/WERKLES_VPG30_J_OWNERSHIP_MANIFEST_20260721.json";
const repoRoot = process.cwd();
const manifest = JSON.parse(readFileSync(path.resolve(repoRoot, manifestPath), "utf8"));

assert.equal(manifest.schema, "werkles.j-ownership-manifest/v1");
assert.equal(manifest.cycle_id, "WERKLES-FLOCK-20260721-034350-ET-BETSY-01");
assert.equal(manifest.legacy_label, "VPG30");
assert.match(manifest.base_sha, /^[0-9a-f]{40}$/);
assert.equal(manifest.branch, "codex/werkles-vpg30-20260721");
assert.match(manifest.phase, /^(product_and_pull|closure)$/);
if (manifest.phase === "product_and_pull") {
  assert.equal(manifest.base_sha, "e698d66cc5a01321dda1f39e0c56e731a8cd9600");
} else {
  assert.ok(manifest.parent_manifest, "closure manifest must name its parent manifest");
}
assert.ok(Array.isArray(manifest.owned_paths) && manifest.owned_paths.length > 0);

const forbidden = [
  /^\.env(?:\.|$)/,
  /^data\//,
  /(?:^|\/)plaid(?:\/|$)/i,
  /(?:^|\/)supabase(?:\/|$)/i,
  /(?:^|\/)rustdesk/i,
  /Promote-Vercel|Apply-MatchingShadowMigration|verification\/(?:identity|funds)/i
];

const expected = new Set([manifestPath, ...manifest.owned_paths.map((entry) => entry.path)]);
assert.equal(expected.size, manifest.owned_paths.length + 1, "manifest paths must be unique");

for (const entry of manifest.owned_paths) {
  assert.match(entry.owner, /^(Heimerdinker|LadyJessica|Ender|Doozer|Thufir|Bean)@Betsy$/);
  assert.equal(entry.source_cycle, manifest.cycle_id);
  assert.ok(entry.origin, `${entry.path}: origin is required`);
  assert.equal(forbidden.some((pattern) => pattern.test(entry.path)), false, `${entry.path}: forbidden J path`);
  const absolute = path.resolve(repoRoot, entry.path);
  assert.equal(existsSync(absolute), true, `${entry.path}: missing`);
  const actualHash = createHash("sha256").update(readFileSync(absolute)).digest("hex");
  assert.equal(actualHash, entry.sha256, `${entry.path}: content hash mismatch`);
}

const args = staged
  ? ["diff", "--cached", "--name-only", manifest.base_sha]
  : ["diff", "--name-only", manifest.base_sha];
const tracked = execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean);
const untracked = staged
  ? []
  : execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: repoRoot, encoding: "utf8" })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
const actual = new Set([...tracked, ...untracked]);

assert.deepEqual([...actual].sort(), [...expected].sort(), `${staged ? "staged" : "working"} J path set differs from manifest`);

console.log(
  JSON.stringify(
    {
      pass: true,
      mode: staged ? "staged" : "working",
      owned_paths: manifest.owned_paths.length,
      base_sha: manifest.base_sha,
      branch: manifest.branch
    },
    null,
    2
  )
);
