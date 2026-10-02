import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withStewartDisneyOwnedBrowser } from "../../../lib/harvey/stewart-disney-owned-browser-session.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "stewart-owned-browser-"));
  const package_root = join(root, "package"); const profile_parent = join(root, "sessions");
  mkdirSync(package_root); mkdirSync(profile_parent); mkdirSync(join(package_root, "extension"));
  const manifest = join(package_root, "com.werkles.pookakind.stewart_generalized.json");
  writeFileSync(manifest, "{}", "utf8");
  const package_observation = { state: "EXACT_HASH_VERIFIED", package_sha256: "a".repeat(64), files: [{ relative_path: "com.werkles.pookakind.stewart_generalized.json", sha256: createHash("sha256").update(readFileSync(manifest)).digest("hex") }] };
  let registered = null; let launched = 0; let closed = 0;
  const registry = { async read() { return registered; }, async write(_key, value) { registered = value; }, async remove() { registered = null; } };
  const page = { current: "about:blank", url() { return this.current; }, async goto(url) { this.current = url; } };
  const context = { pages: () => [page], storageState: async () => ({ cookies: [], origins: [] }), async close() { closed++; } };
  const launch = async ({ headless, args }) => { launched++; assert.equal(headless, true); assert.ok(args.some((arg) => arg.startsWith("--load-extension="))); return context; };
  const input = { package_root, package_observation, profile_parent, chrome_executable_path: manifest, initial_url: "https://login.disney.com/en-US/", registry, launch };
  return { input, registry, context, cleanup: () => rmSync(root, { recursive: true, force: true }), state: () => ({ registered, launched, closed, sessions: readdirSync(profile_parent) }) };
}

test("owned exact headless context returns callback result and rolls back registry/profile", async () => {
  const f = fixture();
  try {
    const result = await withStewartDisneyOwnedBrowser(f.input, ({ session_ref_sha256, initial_url }) => {
      assert.match(session_ref_sha256, /^[a-f0-9]{64}$/); assert.equal(initial_url, f.input.initial_url); return "BOUND";
    });
    assert.equal(result, "BOUND"); assert.deepEqual(f.state(), { registered: null, launched: 1, closed: 1, sessions: [] });
  } finally { f.cleanup(); }
});

test("invalid origin and dirty registry never launch or mutate", async () => {
  const f = fixture();
  try {
    await assert.rejects(() => withStewartDisneyOwnedBrowser({ ...f.input, initial_url: "https://evil.example/" }, () => {}), /ORIGIN_INVALID/);
    const dirty = { ...f.input, registry: { ...f.registry, read: async () => "unrelated" } };
    await assert.rejects(() => withStewartDisneyOwnedBrowser(dirty, () => {}), /REGISTRY_NOT_CLEAN/);
    assert.deepEqual(f.state(), { registered: null, launched: 0, closed: 0, sessions: [] });
  } finally { f.cleanup(); }
});

test("callback failure closes owned context and removes exact registration/profile", async () => {
  const f = fixture();
  try {
    await assert.rejects(() => withStewartDisneyOwnedBrowser(f.input, () => { throw new Error("PROVIDER_FAILED"); }), /PROVIDER_FAILED/);
    assert.deepEqual(f.state(), { registered: null, launched: 1, closed: 1, sessions: [] });
  } finally { f.cleanup(); }
});

test("registry readback mismatch prevents launch and rolls back owned profile", async () => {
  const f = fixture(); let writes = 0;
  try {
    const original = f.registry.write;
    const registry = { ...f.registry, async write(key, value) { writes++; await original(key, value); }, async read() { return writes ? "substituted" : null; } };
    await assert.rejects(() => withStewartDisneyOwnedBrowser({ ...f.input, registry }, () => {}), /REGISTRY_CLEANUP_FAILED/);
    assert.equal(f.state().launched, 0); assert.deepEqual(f.state().sessions, []);
  } finally { f.cleanup(); }
});
