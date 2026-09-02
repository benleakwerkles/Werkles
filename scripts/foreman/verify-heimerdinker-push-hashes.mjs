/**
 * Verify Slice A/B files against frozen SHA-256 manifest.
 * Run: node scripts/foreman/verify-heimerdinker-push-hashes.mjs
 * Manifest: foreman/handoffs/outbox/TO_HEIMERDINKER_PUSH_FILE_HASHES_20260725.sha256
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestRel = "foreman/handoffs/outbox/TO_HEIMERDINKER_PUSH_FILE_HASHES_20260725.sha256";
const manifestPath = path.join(root, manifestRel);

assert.equal(existsSync(manifestPath), true, `missing ${manifestRel}`);

const lines = readFileSync(manifestPath, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => /^[0-9a-f]{64}\s+\S/.test(l));

assert.ok(lines.length > 0, "manifest has no hash rows");

const results = [];
for (const line of lines) {
  const match = line.match(/^([0-9a-f]{64})\s+(.+)$/);
  assert.ok(match, `bad row: ${line}`);
  const [, expected, rel] = match;
  const abs = path.join(root, rel);
  assert.equal(existsSync(abs), true, `missing file ${rel}`);
  const actual = createHash("sha256").update(readFileSync(abs)).digest("hex");
  assert.equal(actual, expected, `drift ${rel}\n expected=${expected}\n actual  =${actual}`);
  results.push(rel);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      checked: results.length,
      files: results,
      manifest: manifestRel
    },
    null,
    2
  )
);
