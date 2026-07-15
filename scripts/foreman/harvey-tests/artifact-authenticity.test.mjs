import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveCockpitArtifactPath } from "../../../lib/harvey/cockpit-artifact-security.ts";

const base = process.env.HARVEY_TEST_BASE_URL;
const workspace = process.env.HARVEY_TEST_WORKSPACE;
assert.ok(base, "HARVEY_TEST_BASE_URL is required");
assert.ok(workspace, "HARVEY_TEST_WORKSPACE is required");

const manifestPath = path.join(workspace, "foreman", "harvey", "HARVEY_COCKPIT_ARTIFACT_MANIFEST_20260713.json");

async function knock() {
  const response = await fetch(`${base}/api/harvey/knock?machine=Sally`);
  return { response, body: await response.json() };
}

test("KNOCK artifacts are bound to the pinned manifest", async () => {
  const result = await knock();
  assert.equal(result.response.status, 200);
  const envelope = result.body.current_cockpit.manifest;
  const manifestBytes = Buffer.from(envelope.content_base64, "base64");
  assert.equal(createHash("sha256").update(manifestBytes).digest("hex"), envelope.sha256);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.packet_id, result.body.current_cockpit.packet_id);
  assert.equal(manifest.artifacts.length, result.body.current_cockpit.artifacts.length);
  for (const artifact of result.body.current_cockpit.artifacts) {
    const pinned = manifest.artifacts.find((entry) => entry.path === artifact.path);
    assert.ok(pinned, artifact.path);
    const content = Buffer.from(artifact.content_base64, "base64");
    assert.equal(content.length, pinned.bytes);
    assert.equal(createHash("sha256").update(content).digest("hex"), pinned.sha256);
  }
});

test("mutating a cockpit artifact fails closed", async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const target = path.join(workspace, ...manifest.artifacts[0].path.split("/"));
  const original = await fs.readFile(target);
  try {
    await fs.writeFile(target, Buffer.concat([original, Buffer.from("\nmutation\n")]));
    const result = await knock();
    assert.equal(result.response.status, 500);
    assert.equal(result.body.error, "COCKPIT_ARTIFACT_HASH_MISMATCH");
  } finally {
    await fs.writeFile(target, original);
  }
});

test("rewriting a manifest fails the compiled manifest pin", async () => {
  const original = await fs.readFile(manifestPath);
  try {
    const manifest = JSON.parse(original.toString("utf8"));
    manifest.artifacts[0].path = "../package.json";
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const result = await knock();
    assert.equal(result.response.status, 500);
    assert.equal(result.body.error, "COCKPIT_MANIFEST_HASH_MISMATCH");
  } finally {
    await fs.writeFile(manifestPath, original);
  }
});

test("secret-shaped content is rejected before KNOCK return", async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const target = path.join(workspace, ...manifest.artifacts[0].path.split("/"));
  const originalArtifact = await fs.readFile(target);
  try {
    const secretFixture = Buffer.from(`fixture ghp_${"A".repeat(36)}\n`, "utf8");
    await fs.writeFile(target, secretFixture);
    const result = await knock();
    assert.equal(result.response.status, 500);
    assert.equal(result.body.error, "COCKPIT_ARTIFACT_SECRET_PATTERN_REJECTED");
  } finally {
    await fs.writeFile(target, originalArtifact);
  }
});

test("oversized cockpit artifacts fail before transport", async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const target = path.join(workspace, ...manifest.artifacts[0].path.split("/"));
  const originalArtifact = await fs.readFile(target);
  try {
    const oversized = Buffer.alloc(129 * 1024, 65);
    await fs.writeFile(target, oversized);
    const result = await knock();
    assert.equal(result.response.status, 500);
    assert.equal(result.body.error, "COCKPIT_ARTIFACT_TOO_LARGE");
  } finally {
    await fs.writeFile(target, originalArtifact);
  }
});

test("realpath containment rejects an in-workspace junction to outside data", async () => {
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "harvey-artifact-outside-"));
  const junction = path.join(workspace, "foreman", "harvey", `artifact-junction-${Date.now()}`);
  try {
    await fs.writeFile(path.join(outside, "payload.txt"), "outside workspace", "utf8");
    await fs.symlink(outside, junction, "junction");
    await assert.rejects(
      resolveCockpitArtifactPath(workspace, path.posix.join("foreman/harvey", path.basename(junction), "payload.txt")),
      /COCKPIT_ARTIFACT_PATH_INVALID|COCKPIT_ARTIFACT_LINK_FORBIDDEN/
    );
  } finally {
    await fs.rm(junction, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  }
});
