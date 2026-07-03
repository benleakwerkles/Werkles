#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SOURCE_STATUS_PATH = "foreman/artifacts/nerdkle_github_source_material_status.json";
const OUTPUT_PATH = "foreman/artifacts/nerdkle_materialized_source_status.json";
const MATERIALIZED_ROOT = "foreman/nerdkle/source_intake/materialized";
const DEFAULT_SOURCE_CLONE = "C:\\Users\\benle\\Desktop\\github\\Werkles";

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(abs(relPath), "utf8"));
}

function writeText(relPath, text) {
  fs.mkdirSync(path.dirname(abs(relPath)), { recursive: true });
  fs.writeFileSync(abs(relPath), text, "utf8");
}

function writeJson(relPath, value) {
  writeText(relPath, `${JSON.stringify(value, null, 2)}\n`);
}

function git(clonePath, args) {
  const result = spawnSync("git", args, {
    cwd: clonePath,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(stderr || stdout || `git exited ${result.status}`);
  }
  return result.stdout || "";
}

function safePathSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function materializedFilePath(sourceId, originalPath) {
  const cleanParts = originalPath
    .split(/[\\/]+/)
    .filter(Boolean)
    .map(safePathSegment);
  return path.join(MATERIALIZED_ROOT, sourceId, "files", ...cleanParts).replace(/\\/g, "/");
}

function materializeSource(clonePath, source) {
  const sourceId = safePathSegment(source.source_id);
  const ref = source.branch_ref;
  const paths = [
    source.packet_path,
    ...source.artifact_checks.map((artifact) => artifact.path),
  ];
  const uniquePaths = [...new Set(paths)];
  const files = [];

  for (const originalPath of uniquePaths) {
    const content = git(clonePath, ["show", `${ref}:${originalPath}`]);
    const targetPath = materializedFilePath(sourceId, originalPath);
    writeText(targetPath, content);
    const artifactCheck = source.artifact_checks.find((artifact) => artifact.path === originalPath);
    files.push({
      original_path: originalPath,
      materialized_path: targetPath,
      sha256: artifactCheck?.sha256 || null,
      byte_count: Buffer.byteLength(content, "utf8"),
    });
  }

  const sourceDir = path.join(MATERIALIZED_ROOT, sourceId).replace(/\\/g, "/");
  const manifest = {
    source_id: source.source_id,
    materialized_at: new Date().toISOString(),
    repository_url: source.repository_url,
    branch: source.branch,
    branch_ref: source.branch_ref,
    commit: source.actual_commit,
    canonicality: source.canonicality,
    source_status: source.source_status,
    proof_boundary: source.proof_boundary,
    source_manifest_path: source.manifest_path,
    packet_path: source.packet_path,
    files,
  };
  writeJson(path.join(sourceDir, "manifest.json").replace(/\\/g, "/"), manifest);
  writeJson(path.join(sourceDir, "source.json").replace(/\\/g, "/"), source);

  return {
    source_id: source.source_id,
    status: "MATERIALIZED_SOURCE_SNAPSHOT",
    manifest_path: path.join(sourceDir, "manifest.json").replace(/\\/g, "/"),
    file_count: files.length,
    canonicality: source.canonicality,
    proof_boundary: source.proof_boundary,
  };
}

function main() {
  if (!fs.existsSync(abs(SOURCE_STATUS_PATH))) {
    throw new Error(`missing source status: ${SOURCE_STATUS_PATH}`);
  }

  const sourceStatus = readJson(SOURCE_STATUS_PATH);
  const clonePath = sourceStatus.source_clone_path || process.env.NERDKLE_GITHUB_SOURCE_CLONE || DEFAULT_SOURCE_CLONE;
  const verifiedSources = (sourceStatus.sources || [])
    .filter((source) => source.status === "VERIFIED_GITHUB_SOURCE");
  const materialized = verifiedSources.map((source) => materializeSource(clonePath, source));
  const report = {
    artifact_id: "NERDKLE_MATERIALIZED_GITHUB_SOURCE_STATUS",
    generated_at: new Date().toISOString(),
    status: materialized.length ? "PASS_MATERIALIZED_GITHUB_SOURCE" : "BLOCKED_NO_VERIFIED_GITHUB_SOURCE",
    rule: "Materialized snapshots are local read copies for build planning. They do not promote GitHub review branches.",
    source_status_path: SOURCE_STATUS_PATH,
    materialized_root: MATERIALIZED_ROOT,
    materialized_count: materialized.length,
    materialized,
  };

  writeJson(OUTPUT_PATH, report);
  console.log(`${report.status}: wrote ${OUTPUT_PATH}`);
  console.log(`materialized_count=${report.materialized_count}`);

  if (!materialized.length) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
