#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");
const outputPath = path.resolve(valueAfter("--output") || process.env.WORMEYES_WORLD_STATE || "C:\\tinkarden\\world_state.json");
const explicitRepos = valuesAfter("--repo");
const defaultRepos = [
  repoRoot,
  "C:\\Users\\BenLeak\\Desktop\\github\\Werkles",
].filter((item, index, all) => all.indexOf(item) === index && existsSync(item));
const repos = explicitRepos.length ? explicitRepos.map((repo) => path.resolve(repo)) : defaultRepos;

function valueAfter(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function valuesAfter(flag) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === flag && process.argv[index + 1]) values.push(process.argv[index + 1]);
    else if (arg.startsWith(`${flag}=`)) values.push(arg.slice(flag.length + 1));
  }
  return values;
}

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").toUpperCase();
}

function git(repo, args) {
  return execFileSync("git", args, {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function repoHead(repo) {
  try {
    return {
      branch: git(repo, ["branch", "--show-current"]) || "DETACHED",
      head: git(repo, ["rev-parse", "HEAD"]),
    };
  } catch (error) {
    return {
      branch: "UNKNOWN",
      head: "UNKNOWN",
      error: error.message,
    };
  }
}

function parsePorcelainLine(line) {
  const indexStatus = line.slice(0, 1);
  const worktreeStatus = line.slice(1, 2);
  const rawPath = line[2] === " " ? line.slice(3) : line.slice(2).trimStart();
  let filePath = rawPath;
  let previousPath = null;
  if (rawPath.includes(" -> ")) {
    const parts = rawPath.split(" -> ");
    previousPath = parts[0];
    filePath = parts[1];
  }
  return { indexStatus, worktreeStatus, path: filePath, previousPath };
}

function normalizeStatus(indexStatus, worktreeStatus) {
  if (indexStatus === "?" && worktreeStatus === "?") return "untracked";
  if (indexStatus === "D" || worktreeStatus === "D") return "deleted";
  if (indexStatus === "R" || worktreeStatus === "R") return "renamed";
  if (indexStatus === "A" || worktreeStatus === "A") return "added";
  if (indexStatus === "M" || worktreeStatus === "M") return "modified";
  return "changed";
}

function fileTiming(repo, relativePath) {
  const absolutePath = path.join(repo, relativePath);
  if (!existsSync(absolutePath)) {
    return {
      exists: false,
      modified_at: null,
      uncommitted_since: new Date().toISOString(),
      byte_count: null,
      sha256: null,
    };
  }
  const stat = statSync(absolutePath);
  const isFile = stat.isFile();
  return {
    exists: true,
    file_type: stat.isDirectory() ? "directory" : isFile ? "file" : "other",
    modified_at: stat.mtime.toISOString(),
    uncommitted_since: stat.mtime.toISOString(),
    byte_count: stat.size,
    sha256: isFile ? sha256File(absolutePath) : null,
  };
}

function readRepo(repo) {
  const head = repoHead(repo);
  let lines = [];
  let error = null;
  try {
    const output = git(repo, ["status", "--porcelain=v1"]);
    lines = output ? output.split(/\r?\n/) : [];
  } catch (err) {
    error = err.message;
  }

  const files = lines.map((line) => {
    const parsed = parsePorcelainLine(line);
    const timing = fileTiming(repo, parsed.path);
    const status = normalizeStatus(parsed.indexStatus, parsed.worktreeStatus);
    return {
      repo,
      repo_label: path.basename(repo),
      branch: head.branch,
      head: head.head,
      path: parsed.path,
      previous_path: parsed.previousPath,
      absolute_path: path.join(repo, parsed.path),
      index_status: parsed.indexStatus,
      worktree_status: parsed.worktreeStatus,
      status,
      git_status: status,
      state: status,
      committed: false,
      uncommitted: true,
      ...timing,
    };
  });

  return {
    repo,
    branch: head.branch,
    head: head.head,
    error: error || head.error || null,
    changed_file_count: files.length,
    files,
  };
}

const repoReadbacks = repos.map(readRepo);
const files = repoReadbacks.flatMap((repo) => repo.files);
const worldState = {
  world_state_id: "WORMEYES_WORLD_STATE_V0",
  generated_at: new Date().toISOString(),
  generated_by: "scripts/foreman/wormeyes-world-state.mjs",
  machine: "Doss",
  output_path: outputPath,
  repos: repoReadbacks.map(({ files: _files, ...repo }) => repo),
  files,
  summary: {
    repo_count: repoReadbacks.length,
    changed_file_count: files.length,
    clean_repo_count: repoReadbacks.filter((repo) => repo.changed_file_count === 0).length,
  },
  rule: "World state is generated from git status and file metadata. It does not invent work or mark changes committed.",
};

let outputHash = null;
let outputBytes = 0;
if (writeMode) {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(worldState, null, 2)}\n`, "utf8");
  outputHash = sha256File(outputPath);
  outputBytes = statSync(outputPath).size;
}

const readback = {
  readback_id: "WORMEYES_WORLD_STATE_READBACK",
  created_at: new Date().toISOString(),
  owner: "Swanson@Doss",
  machine: "Doss",
  status: writeMode ? "ARTIFACT" : "ACK",
  mode: writeMode ? "WRITE" : "READ_ONLY",
  output_path: outputPath,
  output_exists: existsSync(outputPath),
  output_sha256: outputHash || (existsSync(outputPath) ? sha256File(outputPath) : null),
  output_byte_count: outputBytes || (existsSync(outputPath) ? statSync(outputPath).size : 0),
  repo_count: repoReadbacks.length,
  changed_file_count: files.length,
  repos: worldState.repos,
  file_sample: files.slice(0, 20),
  world_state_payload_sha256: sha256Text(JSON.stringify(worldState)),
  false_claim_guard: "This proves world_state was generated from git/file metadata. It does not prove files were committed or work was complete.",
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts", "inputs");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const readbackPath = path.join(readbackDir, "WORMEYES_WORLD_STATE_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(readback, null, 2)}\n`, "utf8");
  const receipt = {
    receipt_id: "WORMEYES_WORLD_STATE_RECEIPT",
    mission: "WORMEYES_WORLD_STATE",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    output_path: outputPath,
    output_hash: outputHash,
    output_byte_count: outputBytes,
    readback_path: rel(readbackPath),
    readback_hash: sha256File(readbackPath),
    changed_file_count: files.length,
    fake_work_created: false,
  };
  const receiptPath = path.join(receiptDir, "WORMEYES_WORLD_STATE_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  readback.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(readback, null, 2)}\n`);
