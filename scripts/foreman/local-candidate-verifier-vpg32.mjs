#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function candidateDigest(entries) {
  const normalized = [...entries]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => `${entry.path}\0${entry.sha256}`)
    .join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export function evaluateLocalCandidate(attestation, current) {
  const reasons = [];
  const stop = (reason, detail) => reasons.push({ reason, detail });

  if (attestation.schema !== "werkles.local-candidate-attestation/v1") stop("SCHEMA", attestation.schema);
  if (attestation.base_sha !== current.base_sha) stop("BASE_SHA", current.base_sha);
  if (attestation.branch !== current.branch) stop("BRANCH", current.branch);
  if (attestation.build_id !== current.build_id) stop("BUILD_ID", current.build_id);

  const expectedPaths = [...attestation.owned_paths.map((entry) => entry.path), attestation.attestation_path].sort();
  const actualPaths = [...current.paths].sort();
  if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) stop("PATH_SET", actualPaths);

  const currentHashes = new Map(current.entries.map((entry) => [entry.path, entry.sha256]));
  for (const entry of attestation.owned_paths) {
    if (currentHashes.get(entry.path) !== entry.sha256) stop("FILE_HASH", entry.path);
  }
  if (attestation.candidate_digest !== candidateDigest(attestation.owned_paths)) {
    stop("CANDIDATE_DIGEST", attestation.candidate_digest);
  }

  for (const [name, version] of Object.entries(attestation.versions)) {
    if (current.versions[name] !== version) stop("VERSION", `${name}:${current.versions[name]}`);
  }
  if (!Array.isArray(attestation.qc_results) || attestation.qc_results.length === 0) stop("QC_RESULTS", "missing");
  for (const result of attestation.qc_results ?? []) {
    if (result.status !== "PASS") stop("QC_NOT_PASS", result.name);
  }

  return { pass: reasons.length === 0, reasons };
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function lines(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8" })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function installedVersion(root, packageName) {
  const packagePath = path.join(root, "node_modules", ...packageName.split("/"), "package.json");
  return JSON.parse(readFileSync(packagePath, "utf8")).version;
}

function currentCandidate(root, attestation) {
  const tracked = lines("git", ["diff", "--name-only", attestation.base_sha], root);
  const untracked = lines("git", ["ls-files", "--others", "--exclude-standard"], root);
  const paths = [...new Set([...tracked, ...untracked])].sort();
  const entries = paths
    .filter((entry) => entry !== attestation.attestation_path)
    .map((entry) => ({ path: entry, sha256: sha256File(path.join(root, entry)) }));
  return {
    base_sha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    branch: execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim(),
    build_id: readFileSync(path.join(root, ".next", "BUILD_ID"), "utf8").trim(),
    paths,
    entries,
    versions: {
      next: installedVersion(root, "next"),
      react: installedVersion(root, "react"),
      react_dom: installedVersion(root, "react-dom"),
      eslint: installedVersion(root, "eslint")
    }
  };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const relativePath = process.argv[2] || "foreman/receipts/WERKLES_VPG32_LOCAL_CANDIDATE_ATTESTATION_20260721.json";
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Attestation not found: ${relativePath}`);
  const attestation = JSON.parse(readFileSync(absolutePath, "utf8"));
  const current = currentCandidate(root, attestation);
  const result = evaluateLocalCandidate(attestation, current);
  console.log(JSON.stringify({ ...result, paths: current.paths.length, candidate_digest: attestation.candidate_digest }, null, 2));
  if (!result.pass) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
