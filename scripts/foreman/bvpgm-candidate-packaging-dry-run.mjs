#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RELEASE_DATE = process.env.WERKLES_RELEASE_DATE || "20260823";
const INVENTORY = path.join(
  ROOT,
  `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_${RELEASE_DATE}.json`
);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: options.encoding ?? "utf8",
    env: { ...process.env, ...options.env },
    maxBuffer: 128 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${String(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function indexFingerprint() {
  const relative = git(["rev-parse", "--git-path", "index"]).trim();
  const absolute = path.resolve(ROOT, relative);
  return fs.existsSync(absolute) ? sha256(fs.readFileSync(absolute)) : "MISSING";
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
const candidateRows = inventory.files.filter((row) =>
  ["candidate_source", "candidate_verification", "candidate_data", "candidate_asset"].includes(
    row.classification
  )
);
const candidatePaths = candidateRows.map((row) => row.path).sort();

if (candidatePaths.length !== inventory.candidateFiles) {
  throw new Error(`Inventory count mismatch: ${candidatePaths.length} rows vs ${inventory.candidateFiles}`);
}

const duplicatePaths = candidatePaths.filter((value, index) => value === candidatePaths[index - 1]);
if (duplicatePaths.length) throw new Error(`Duplicate candidate paths: ${duplicatePaths.join(", ")}`);

const hashMismatches = [];
for (const row of candidateRows) {
  const absolute = path.join(ROOT, row.path);
  if (!fs.existsSync(absolute)) {
    hashMismatches.push({ path: row.path, reason: "missing" });
    continue;
  }
  const actual = sha256(fs.readFileSync(absolute));
  if (actual !== row.sha256) hashMismatches.push({ path: row.path, reason: "sha256_mismatch" });
}
if (hashMismatches.length) {
  throw new Error(`Candidate bytes drifted: ${JSON.stringify(hashMismatches.slice(0, 10))}`);
}

const realIndexBefore = indexFingerprint();
const realStagedBefore = git(["diff", "--cached", "--name-only", "-z"], { encoding: "buffer" });
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "werkles-release-index-"));
const tempIndex = path.join(tempDir, "index");
const pathspecFile = path.join(tempDir, "candidate-paths.nul");
const env = { GIT_INDEX_FILE: tempIndex };

try {
  fs.writeFileSync(pathspecFile, `${candidatePaths.join("\0")}\0`, "utf8");
  git(["read-tree", "HEAD"], { env });
  git(["add", "-A", `--pathspec-from-file=${pathspecFile}`, "--pathspec-file-nul"], { env });

  const stagedRaw = git(["diff", "--cached", "--name-only", "-z"], {
    env,
    encoding: "buffer"
  });
  const stagedPaths = stagedRaw
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();

  const missingFromStage = candidatePaths.filter((value) => !stagedPaths.includes(value));
  const contamination = stagedPaths.filter((value) => !candidatePaths.includes(value));
  const baselineBoundPaths = [];
  const genuinelyMissing = [];
  for (const candidatePath of missingFromStage) {
    const headBlob = git(["rev-parse", `HEAD:${candidatePath}`]).trim();
    const worktreeBlob = git(["hash-object", candidatePath]).trim();
    if (headBlob === worktreeBlob) baselineBoundPaths.push(candidatePath);
    else genuinelyMissing.push(candidatePath);
  }
  if (genuinelyMissing.length || contamination.length) {
    throw new Error(
      `Temp-index boundary failed: ${JSON.stringify({
        missingFromStage: genuinelyMissing.slice(0, 20),
        contamination: contamination.slice(0, 20)
      })}`
    );
  }

  const binaryPatch = git(["diff", "--cached", "--binary", "--full-index"], {
    env,
    encoding: "buffer"
  });
  const realIndexAfter = indexFingerprint();
  const realStagedAfter = git(["diff", "--cached", "--name-only", "-z"], { encoding: "buffer" });

  if (realIndexBefore !== realIndexAfter || !realStagedBefore.equals(realStagedAfter)) {
    throw new Error("Real Git index changed during temp-index dry run");
  }

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        candidateDigest: inventory.candidateDigest,
        candidatePaths: candidatePaths.length,
        changedPayloadPaths: stagedPaths.length,
        baselineBoundPaths: baselineBoundPaths.length,
        contamination: 0,
        missingFromStage: 0,
        candidateBinaryPatchSha256: sha256(binaryPatch),
        realIndexUntouched: true,
        realStagedPaths: realStagedAfter.length === 0 ? 0 : realStagedAfter.toString("utf8").split("\0").filter(Boolean).length
      },
      null,
      2
    )
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
