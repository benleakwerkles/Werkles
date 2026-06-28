#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const SPEAKER_ROOT = process.env.SPEAKER_ROOT || "C:\\speaker";
const SPEAKER_DB_PATH = process.env.SPEAKER_DB_PATH || path.join(SPEAKER_ROOT, "db", "speaker.sqlite");
const ATLAS_DIR = path.join(SPEAKER_ROOT, "atlas");
const SNAPSHOT_PATH = path.join(ATLAS_DIR, "source_truth_snapshot.json");
const HARVEST_BAY = path.join(SPEAKER_ROOT, "receipts", "staged");
const MIGRATION_RECEIPT_PATH = path.join(HARVEST_BAY, "ATLAS_SQLITE_V0_2_MIGRATION_RECEIPT.json");

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS snapshot_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  tree_hash TEXT NOT NULL,
  git_status_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS trust_anchor (
  key_id TEXT PRIMARY KEY,
  fingerprint TEXT,
  pinned_hash TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cross_verification_log (
  id TEXT PRIMARY KEY,
  verifying_machine TEXT NOT NULL,
  computed_hash TEXT NOT NULL,
  match_verdict TEXT NOT NULL
);
`;

const REPOS = [
  {
    name: "Speaker",
    role: "deterministic memory renderer / receipt gate",
    path: SPEAKER_ROOT,
    remoteBranchesToCheck: ["main"],
  },
  {
    name: "Werkles",
    role: "current GitHub-hosted project surface",
    path: "C:\\Users\\BenLeak\\Desktop\\github\\Werkles",
    remoteBranchesToCheck: [
      "main",
      "snapshot/sally-good-werkles-2026-06-12",
      "salvage/betsy/snapshot/sally-good-werkles-2026-06-12",
      "audit/branch-salvage-map-2026-06-21-180250",
    ],
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function runGit(repoPath, args, options = {}) {
  try {
    return {
      ok: true,
      stdout: execFileSync("git", ["-c", "core.longpaths=true", "-C", repoPath, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
      stderr: "",
    };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout).trim() : "";
    const stderr = error.stderr ? String(error.stderr).trim() : "";
    if (options.allowFailure) {
      return {
        ok: false,
        stdout,
        stderr,
        message: error.message,
      };
    }
    throw error;
  }
}

function parseStatus(statusText) {
  const lines = statusText ? statusText.split(/\r?\n/).filter(Boolean) : [];
  const counts = {
    total: lines.length,
    modified: 0,
    deleted: 0,
    added: 0,
    renamed: 0,
    untracked: 0,
    other: 0,
  };

  for (const line of lines) {
    if (line.startsWith("??")) counts.untracked += 1;
    else if (line.includes("D")) counts.deleted += 1;
    else if (line.includes("M")) counts.modified += 1;
    else if (line.includes("A")) counts.added += 1;
    else if (line.includes("R")) counts.renamed += 1;
    else counts.other += 1;
  }

  return { counts, lines };
}

function remoteRefs(repoPath, remoteName, branches) {
  if (!remoteName) return [];
  const refs = [];

  for (const branch of branches) {
    const exactRef = `refs/heads/${branch}`;
    const result = runGit(repoPath, ["ls-remote", remoteName, exactRef], { allowFailure: true });
    if (!result.ok || !result.stdout) {
      refs.push({
        branch,
        found: false,
        hash: null,
        error: result.stderr || result.message || null,
      });
      continue;
    }

    for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
      const [hash, ref] = line.split(/\s+/);
      refs.push({ branch, found: true, hash, ref });
    }
  }

  return refs;
}

function inspectRepo(repo) {
  const exists = fs.existsSync(repo.path);
  if (!exists) {
    return {
      ...repo,
      exists: false,
      git_repo: false,
      proof_level: "MISSING_PATH",
      blockers: [`Path missing: ${repo.path}`],
    };
  }

  const isInside = runGit(repo.path, ["rev-parse", "--is-inside-work-tree"], { allowFailure: true });
  if (!isInside.ok || isInside.stdout !== "true") {
    return {
      ...repo,
      exists: true,
      git_repo: false,
      proof_level: "LOCAL_FILES_ONLY",
      blockers: ["Not a Git worktree"],
    };
  }

  const branch = runGit(repo.path, ["branch", "--show-current"], { allowFailure: true }).stdout || "DETACHED";
  const head = runGit(repo.path, ["rev-parse", "HEAD"], { allowFailure: true }).stdout || null;
  const status = parseStatus(runGit(repo.path, ["status", "--porcelain=v1"], { allowFailure: true }).stdout || "");
  const remoteText = runGit(repo.path, ["remote", "-v"], { allowFailure: true }).stdout || "";
  const remoteNames = [...new Set(remoteText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/\s+/)[0]))];
  const originPresent = remoteNames.includes("origin");
  const upstream = runGit(repo.path, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { allowFailure: true });

  let aheadBehind = null;
  if (upstream.ok && upstream.stdout) {
    const counts = runGit(repo.path, ["rev-list", "--left-right", "--count", `HEAD...${upstream.stdout}`], { allowFailure: true });
    if (counts.ok && counts.stdout) {
      const [ahead, behind] = counts.stdout.split(/\s+/).map((value) => Number.parseInt(value, 10));
      aheadBehind = { upstream: upstream.stdout, ahead, behind };
    }
  }

  const refs = remoteRefs(repo.path, originPresent ? "origin" : null, repo.remoteBranchesToCheck || []);
  const blockers = [];
  if (!originPresent) blockers.push("No origin remote; cannot prove GitHub source truth for this repo.");
  if (status.counts.total > 0) blockers.push(`Dirty worktree: ${status.counts.total} changed/untracked entries.`);
  if (aheadBehind && (aheadBehind.ahead > 0 || aheadBehind.behind > 0)) {
    blockers.push(`Diverged from upstream ${aheadBehind.upstream}: ahead ${aheadBehind.ahead}, behind ${aheadBehind.behind}.`);
  }
  if (!aheadBehind && originPresent) blockers.push("No upstream tracking branch configured or readable.");

  const originMain = refs.find((ref) => ref.branch === "main" && ref.found);
  const proofLevel = blockers.length === 0 && originMain
    ? "GITHUB_CANONICAL_CANDIDATE"
    : originPresent
      ? "GITHUB_REMOTE_PROVEN_LOCAL_NOT_CANONICAL"
      : "LOCAL_ONLY_NOT_CANONICAL";

  return {
    ...repo,
    exists: true,
    git_repo: true,
    canonical_physical_path: fs.realpathSync.native(repo.path),
    current_branch: branch,
    head,
    remotes: remoteText.split(/\r?\n/).filter(Boolean),
    upstream: aheadBehind,
    status,
    github_remote_refs: refs,
    proof_level: proofLevel,
    blockers,
  };
}

function countDirtyEntries(repos) {
  return repos.reduce((count, repo) => count + (repo.status && repo.status.counts ? repo.status.counts.total : 0), 0);
}

function openAtlasDb() {
  ensureDir(path.dirname(SPEAKER_DB_PATH));
  const db = new DatabaseSync(SPEAKER_DB_PATH);
  db.exec(MIGRATION_SQL);
  return db;
}

function maybeRecordOperatorTrustAnchor(db, timestamp) {
  const pubkeyPath = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.asc");
  if (!fs.existsSync(pubkeyPath)) return null;

  const pinnedHash = sha256File(pubkeyPath);
  let fingerprint = null;
  let status = "PINNED_HASH_ONLY";
  try {
    const output = execFileSync("gpg", ["--show-keys", "--with-colons", pubkeyPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const fprLine = output.split(/\r?\n/).find((line) => line.startsWith("fpr:"));
    if (fprLine) {
      fingerprint = fprLine.split(":")[9] || null;
      if (fingerprint) status = "PINNED_HASH_AND_FINGERPRINT";
    }
  } catch (error) {
    status = "PINNED_HASH_FINGERPRINT_UNREADABLE";
  }

  db.prepare([
    "INSERT OR REPLACE INTO trust_anchor",
    "(key_id, fingerprint, pinned_hash, status)",
    "VALUES (?, ?, ?, ?)",
  ].join(" ")).run(`operator_pubkey:${timestamp}`, fingerprint, pinnedHash, status);

  return {
    key_id: `operator_pubkey:${timestamp}`,
    fingerprint,
    pinned_hash: pinnedHash,
    status,
    source_path: pubkeyPath,
  };
}

function persistSnapshot(snapshot, treeHash) {
  const db = openAtlasDb();
  const gitStatusCount = countDirtyEntries(snapshot.repos);

  try {
    db.prepare([
      "INSERT OR REPLACE INTO snapshot_log",
      "(id, timestamp, tree_hash, git_status_count)",
      "VALUES (?, ?, ?, ?)",
    ].join(" ")).run(snapshot.snapshot_id, snapshot.created_at, treeHash, gitStatusCount);

    db.prepare([
      "INSERT OR REPLACE INTO cross_verification_log",
      "(id, verifying_machine, computed_hash, match_verdict)",
      "VALUES (?, ?, ?, ?)",
    ].join(" ")).run(`SELF_${snapshot.snapshot_id}`, snapshot.machine, treeHash, "SELF_MATCH");

    const trustAnchor = maybeRecordOperatorTrustAnchor(db, snapshot.created_at);
    const snapshotRow = db.prepare("SELECT id, timestamp, tree_hash, git_status_count FROM snapshot_log WHERE id = ?").get(snapshot.snapshot_id);
    const crossCheckRow = db.prepare("SELECT id, verifying_machine, computed_hash, match_verdict FROM cross_verification_log WHERE id = ?").get(`SELF_${snapshot.snapshot_id}`);
    const tables = db.prepare([
      "SELECT name FROM sqlite_master",
      "WHERE type = 'table' AND name IN ('snapshot_log', 'trust_anchor', 'cross_verification_log')",
      "ORDER BY name",
    ].join(" ")).all();

    return {
      db_path: SPEAKER_DB_PATH,
      snapshot_row: snapshotRow,
      cross_verification_row: crossCheckRow,
      trust_anchor_recorded: trustAnchor,
      initialized_tables: tables.map((row) => row.name),
    };
  } finally {
    db.close();
  }
}

function writeMigrationReceipt(snapshot, treeHash, persistence) {
  ensureDir(HARVEST_BAY);
  const receipt = {
    receipt_id: "ATLAS_SQLITE_V0_2_MIGRATION_RECEIPT",
    packet_id: "BIRD_0130_SWANSON_ATLAS_CORE_DEPLOY",
    created_at: new Date().toISOString(),
    machine: "Doss",
    owner: "Swanson@Doss",
    status: "ARTIFACT",
    migration_sql: MIGRATION_SQL.trim(),
    db_path: persistence.db_path,
    initialized_tables: persistence.initialized_tables,
    verified_snapshot_row: persistence.snapshot_row,
    verified_cross_verification_row: persistence.cross_verification_row,
    trust_anchor_recorded: persistence.trust_anchor_recorded,
    snapshot_path: SNAPSHOT_PATH,
    tree_hash: treeHash,
    git_status_count: countDirtyEntries(snapshot.repos),
    canonical_readiness: snapshot.source_truth_ruling === "GITHUB_READY_CANDIDATE" ? "CANDIDATE" : "NO",
  };
  const body = `${JSON.stringify(receipt, null, 2)}\n`;
  fs.writeFileSync(MIGRATION_RECEIPT_PATH, body, "utf8");
  return {
    path: MIGRATION_RECEIPT_PATH,
    sha256: sha256Text(body),
    byte_count: Buffer.byteLength(body, "utf8"),
  };
}

function buildSnapshot() {
  const createdAt = new Date().toISOString();
  const inspectedRepos = REPOS.map(inspectRepo);
  const globalBlockers = inspectedRepos.flatMap((repo) => repo.blockers.map((blocker) => `${repo.name}: ${blocker}`));
  const werkles = inspectedRepos.find((repo) => repo.name === "Werkles");
  const githubMain = werkles && werkles.github_remote_refs
    ? werkles.github_remote_refs.find((ref) => ref.branch === "main" && ref.found)
    : null;

  return {
    snapshot_id: `ATLAS_SOURCE_TRUTH_${createdAt.replace(/[-:.]/g, "").slice(0, 15)}Z`,
    created_at: createdAt,
    machine: "Doss",
    owner: "Swanson@Doss",
    purpose: "Make GitHub-vs-local source truth visible before Nerdkle/Speaker/Atlas promotion.",
    github_main_hash: githubMain ? githubMain.hash : null,
    source_truth_ruling: globalBlockers.length === 0 ? "GITHUB_READY_CANDIDATE" : "NO_GO_GITHUB_CANONICAL_PROMOTION",
    repos: inspectedRepos,
    global_blockers: globalBlockers,
    next_smallest_safe_action: "Choose the GitHub canonical location for Speaker/Atlas, then commit and push only the audited source-truth subset from a clean branch.",
    do_not_claim: [
      "Local Speaker is canonical on GitHub",
      "Dirty Werkles snapshot is canonical",
      "Atlas has solved source truth synchronization",
    ],
  };
}

function main() {
  ensureDir(ATLAS_DIR);
  const snapshot = buildSnapshot();
  const treeHash = sha256Text(stableJson({
    github_main_hash: snapshot.github_main_hash,
    repos: snapshot.repos,
    global_blockers: snapshot.global_blockers,
    source_truth_ruling: snapshot.source_truth_ruling,
  }));

  snapshot.tree_hash = treeHash;
  snapshot.artifact_path = SNAPSHOT_PATH;
  const snapshotBody = `${JSON.stringify(snapshot, null, 2)}\n`;
  fs.writeFileSync(SNAPSHOT_PATH, snapshotBody, "utf8");

  const persistence = persistSnapshot(snapshot, treeHash);
  const migrationReceipt = writeMigrationReceipt(snapshot, treeHash, persistence);

  process.stdout.write(`${JSON.stringify({
    ...snapshot,
    artifact_sha256: sha256Text(snapshotBody),
    sqlite_v0_2: persistence,
    migration_receipt: migrationReceipt,
  }, null, 2)}\n`);
}

main();
