import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../../", import.meta.url);

test("Cursor loads a repository-level Swateyes auto-review policy", async () => {
  const policy = JSON.parse(await readFile(new URL(".cursor/permissions.json", root), "utf8"));
  assert.ok(Array.isArray(policy.autoRun.allow_instructions));
  assert.ok(Array.isArray(policy.autoRun.block_instructions));
  assert.ok(policy.autoRun.allow_instructions.some((rule) => rule.includes("routine read, scoped edit, and local verification")));
  assert.ok(policy.autoRun.block_instructions.some((rule) => rule.includes("passwords, tokens")));
  assert.ok(policy.autoRun.block_instructions.some((rule) => rule.includes("git push, merge")));
  assert.ok(policy.autoRun.block_instructions.some((rule) => rule.includes("recurring operation")));
  assert.ok(policy.autoRun.block_instructions.some((rule) => rule.includes("steals Ben's cursor")));
});

test("only the intentional Cursor policy escapes the local scratch ignore", async () => {
  const ignore = await readFile(new URL(".gitignore", root), "utf8");
  assert.match(ignore, /^\.cursor\/\*$/m);
  assert.match(ignore, /^!\.cursor\/permissions\.json$/m);
  assert.doesNotMatch(ignore, /^\.cursor\/$/m);
});
