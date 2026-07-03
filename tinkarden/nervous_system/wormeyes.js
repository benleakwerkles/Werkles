#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, execSync } = require("node:child_process");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const WORLD_STATE_PATH = path.join(__dirname, "world_state.json");
const PORTS_TO_CHECK = [3000, 3001, 3002, 4317];
const SCAN_TARGETS = [
  "handoffs",
  "intake",
  path.join("foreman", "handoffs"),
  path.join("tinkarden", "intake")
];
const STALE_AFTER_HOURS = 48;

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function now() {
  return new Date().toISOString();
}

function runCommand({ command, args = [], shellCommand = null }) {
  const startedAt = now();
  try {
    const stdout = shellCommand
      ? execSync(shellCommand, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
      : execFileSync(command, args, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

    return {
      command: shellCommand || [command, ...args].join(" "),
      ok: true,
      exit_code: 0,
      started_at: startedAt,
      finished_at: now(),
      stdout: stdout.trim(),
      stderr: ""
    };
  } catch (error) {
    return {
      command: shellCommand || [command, ...args].join(" "),
      ok: false,
      exit_code: typeof error.status === "number" ? error.status : null,
      started_at: startedAt,
      finished_at: now(),
      stdout: typeof error.stdout === "string" ? error.stdout.trim() : "",
      stderr: typeof error.stderr === "string" && error.stderr.trim()
        ? error.stderr.trim()
        : error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

function parseBranch(commandResult) {
  return commandResult.ok && commandResult.stdout ? commandResult.stdout.split(/\r?\n/)[0].trim() : "UNKNOWN_BRANCH";
}

function gitStatusSummary(statusResult) {
  const raw = runCommand({ command: "git", args: ["status", "--porcelain=v1"] });
  const lines = raw.stdout ? raw.stdout.split(/\r?\n/).filter(Boolean) : [];
  return {
    dirty: lines.length > 0,
    dirty_count: lines.length,
    modified_count: lines.filter((line) => !line.startsWith("??")).length,
    untracked_count: lines.filter((line) => line.startsWith("??")).length,
    human_status_excerpt: statusResult.stdout.split(/\r?\n/).slice(0, 80)
  };
}

function capturePorts() {
  const probes = [];
  const lsof = runCommand({ command: "lsof", args: ["-i", ":3000"] });
  probes.push(lsof);

  for (const port of PORTS_TO_CHECK) {
    probes.push(runCommand({
      shellCommand: `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,State,OwningProcess | ConvertTo-Json -Compress"`
    }));
  }

  return {
    note: "lsof was attempted first because it was requested; Windows port reality is captured with Get-NetTCPConnection.",
    active_ports_checked: PORTS_TO_CHECK,
    probes
  };
}

function scanDirectory(relativeTarget) {
  const absoluteTarget = path.join(REPO_ROOT, relativeTarget);
  const exists = fs.existsSync(absoluteTarget);
  const staleCutoff = Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000;

  if (!exists) {
    return {
      path: slash(relativeTarget),
      exists: false,
      file_count: 0,
      stale_count: 0,
      orphan_candidates: [],
      stale_candidates: []
    };
  }

  const files = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(absolute);
        continue;
      }

      const stat = fs.statSync(absolute);
      files.push({
        path: rel(absolute),
        bytes: stat.size,
        last_write_time: stat.mtime.toISOString(),
        stale: stat.mtime.getTime() < staleCutoff
      });
    }
  }

  walk(absoluteTarget);

  const orphanCandidates = files
    .filter((file) => /\.(json|md|txt)$/i.test(file.path))
    .filter((file) => !/receipt/i.test(file.path))
    .slice(0, 25);
  const staleCandidates = files.filter((file) => file.stale).slice(0, 25);

  return {
    path: slash(relativeTarget),
    exists: true,
    file_count: files.length,
    stale_count: files.filter((file) => file.stale).length,
    orphan_candidates: orphanCandidates,
    stale_candidates: staleCandidates
  };
}

function captureWorldState() {
  const gitStatus = runCommand({ command: "git", args: ["status"] });
  const branch = runCommand({ command: "git", args: ["branch", "--show-current"] });
  const branchList = runCommand({ command: "git", args: ["branch", "--format=%(refname:short)"] });

  const worldState = {
    schema: "tinkarden_wormeyes_world_state_v0",
    generated_at: now(),
    observer: "Wormeyes@Betsy",
    mode: "observe_only",
    repo_root: REPO_ROOT,
    branch: parseBranch(branch),
    git: {
      status: gitStatus,
      branch_show_current: branch,
      branch_list: branchList,
      summary: gitStatusSummary(gitStatus)
    },
    ports: capturePorts(),
    directory_scans: SCAN_TARGETS.map(scanDirectory),
    doctrine_limits: {
      no_auto_fix: true,
      no_merge: true,
      no_delete: true,
      observe_only: true
    }
  };

  fs.writeFileSync(WORLD_STATE_PATH, `${JSON.stringify(worldState, null, 2)}\n`, "utf8");
  return worldState;
}

async function watch() {
  const cron = require("node-cron");
  const run = () => {
    const state = captureWorldState();
    console.log(JSON.stringify({
      status: "CAPTURED",
      generated_at: state.generated_at,
      world_state_path: rel(WORLD_STATE_PATH),
      branch: state.branch,
      dirty_count: state.git.summary.dirty_count
    }));
  };

  run();
  cron.schedule("*/3 * * * *", run);
  console.log("[wormeyes] scheduled every 3 minutes via node-cron");
}

async function main() {
  const command = process.argv[2] || "once";

  if (command === "once") {
    console.log(JSON.stringify({
      status: "ARTIFACT",
      world_state_path: rel(WORLD_STATE_PATH),
      world_state: captureWorldState()
    }, null, 2));
    return;
  }

  if (command === "watch") {
    await watch();
    return;
  }

  throw new Error("Usage: node wormeyes.js [once|watch]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
