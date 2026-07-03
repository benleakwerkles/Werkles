#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const NERVOUS_SYSTEM_ROOT = __dirname;
const TINKARDEN_ROOT = path.resolve(NERVOUS_SYSTEM_ROOT, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const SALVAGE_QUEUE_DIR = path.join(TINKARDEN_ROOT, "intake", "salvage_queue");
const GRAVEYARD_DIR = path.join(SALVAGE_QUEUE_DIR, "graveyard");

function stamp() {
  return new Date().toISOString();
}

function compactStamp() {
  return stamp().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function ensureDirs() {
  fs.mkdirSync(SALVAGE_QUEUE_DIR, { recursive: true });
  fs.mkdirSync(GRAVEYARD_DIR, { recursive: true });
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? argv[++index] : true;
  }
  return args;
}

function runGit(args, options = {}) {
  if (args[0] === "push" && args.some((arg) => arg === "--force" || arg === "-f" || arg.startsWith("--force-"))) {
    throw new Error("FORCE_PUSH_FORBIDDEN");
  }

  const result = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 40,
    ...options
  });

  return {
    command: `git ${args.join(" ")}`,
    ok: result.status === 0,
    exit_code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

function mustGit(args) {
  const result = runGit(args);
  if (!result.ok) {
    throw new Error(`${result.command} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

function currentBranch() {
  const branch = mustGit(["branch", "--show-current"]);
  if (!branch) throw new Error("DETACHED_HEAD_BLOCKED");
  return branch;
}

function safeSlug(value) {
  return String(value || "unknown")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function writeFile(filePath, value) {
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function generateInventory({ trigger, shadowId, receiptId }) {
  ensureDirs();

  const branch = currentBranch();
  const head = mustGit(["rev-parse", "--short", "HEAD"]);
  const packetId = `salvage_${compactStamp()}_${safeSlug(branch)}`;
  const baseName = `${packetId}`;
  const trackedDiff = runGit(["diff", "--binary", "HEAD", "--"]);
  const status = runGit(["status", "--porcelain=v1", "-uall"]);
  const log = runGit(["log", "--oneline", "--decorate", "-30"]);
  const upstream = runGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);

  const untracked = status.stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3));

  const inventory = {
    schema: "tinkarden_salvage_inventory_v0",
    packet_id: packetId,
    generated_at: stamp(),
    trigger: trigger || "manual",
    shadow_id: shadowId || null,
    receipt_id: receiptId || null,
    branch,
    head,
    upstream: upstream.ok ? upstream.stdout.trim() : null,
    doctrine: {
      push_all_realities: true,
      inventory_before_merge: true,
      salvage_before_delete: true,
      canonical_branch_after_audit: true,
      force_push_allowed: false,
      canonical_merge_requires_operator_signature: true
    },
    files: {
      tracked_diff_path: rel(path.join(SALVAGE_QUEUE_DIR, `${baseName}.diff`)),
      status_path: rel(path.join(SALVAGE_QUEUE_DIR, `${baseName}.status.txt`)),
      thufir_request_path: rel(path.join(SALVAGE_QUEUE_DIR, `${baseName}.THUFIR_VALIDATION_REQUEST.md`)),
      untracked_count: untracked.length,
      untracked_paths: untracked
    }
  };

  const diffBody = [
    `# SALVAGE DIFF ${packetId}`,
    `# branch: ${branch}`,
    `# head: ${head}`,
    `# generated_at: ${inventory.generated_at}`,
    "",
    trackedDiff.stdout || "(no tracked diff against HEAD)",
    "",
    "# UNTRACKED INVENTORY",
    ...untracked.map((file) => `# ?? ${file}`)
  ].join("\n");

  const thufirRequest = [
    `# THUFIR VALIDATION REQUEST - ${packetId}`,
    "",
    "STREAM: GOVERNANCE / SALVAGE",
    "REQUEST: Validate this branch inventory before any canonical merge or branch deletion.",
    "",
    `branch: ${branch}`,
    `head: ${head}`,
    `trigger: ${inventory.trigger}`,
    `shadow_id: ${inventory.shadow_id || "NONE"}`,
    `receipt_id: ${inventory.receipt_id || "NONE"}`,
    "",
    "Required validation:",
    "- Confirm useful mutations are inventoried.",
    "- Identify salvage candidates.",
    "- Identify delete/abandon candidates.",
    "- Do not approve canonical merge without Operator signature.",
    "",
    `diff: ${inventory.files.tracked_diff_path}`,
    `status: ${inventory.files.status_path}`,
    `inventory: tinkarden/intake/salvage_queue/${baseName}.json`
  ].join("\n");

  const diffPath = path.join(SALVAGE_QUEUE_DIR, `${baseName}.diff`);
  const statusPath = path.join(SALVAGE_QUEUE_DIR, `${baseName}.status.txt`);
  const logPath = path.join(SALVAGE_QUEUE_DIR, `${baseName}.log.txt`);
  const requestPath = path.join(SALVAGE_QUEUE_DIR, `${baseName}.THUFIR_VALIDATION_REQUEST.md`);
  const inventoryPath = path.join(SALVAGE_QUEUE_DIR, `${baseName}.json`);

  writeFile(diffPath, diffBody);
  writeFile(statusPath, status.stdout || "(clean)");
  writeFile(logPath, log.stdout || "");
  writeFile(requestPath, thufirRequest);
  writeFile(inventoryPath, JSON.stringify({
    ...inventory,
    files: {
      ...inventory.files,
      log_path: rel(logPath),
      inventory_path: rel(inventoryPath),
      tracked_diff_sha256: sha256(diffBody),
      status_sha256: sha256(status.stdout || "(clean)")
    }
  }, null, 2));

  return {
    packet_id: packetId,
    branch,
    head,
    diff_path: rel(diffPath),
    status_path: rel(statusPath),
    request_path: rel(requestPath),
    inventory_path: rel(inventoryPath),
    untracked_count: untracked.length
  };
}

function pushBranch(branch) {
  const result = runGit(["push", "-u", "origin", `${branch}:${branch}`]);
  return {
    attempted: true,
    forced: false,
    command: result.command,
    ok: result.ok,
    exit_code: result.exit_code,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function capture(args) {
  const inventory = generateInventory({
    trigger: args.trigger,
    shadowId: args.shadowId,
    receiptId: args.receiptId
  });
  const push = pushBranch(inventory.branch);

  return {
    ok: push.ok,
    status: push.ok ? "SALVAGE_CAPTURED_AND_PUSHED" : "SALVAGE_CAPTURED_PUSH_FAILED",
    inventory,
    push
  };
}

function abandon(args) {
  ensureDirs();
  const packet = args.packet || args.packetId;
  if (!packet) throw new Error("ABANDON_REQUIRES_PACKET_ID");

  const moved = [];
  for (const name of fs.readdirSync(SALVAGE_QUEUE_DIR)) {
    if (!name.includes(packet)) continue;
    const from = path.join(SALVAGE_QUEUE_DIR, name);
    if (!fs.statSync(from).isFile()) continue;
    const to = path.join(GRAVEYARD_DIR, name);
    fs.renameSync(from, to);
    moved.push({ from: rel(from), to: rel(to) });
  }

  return {
    ok: moved.length > 0,
    status: moved.length > 0 ? "SALVAGE_MOVED_TO_GRAVEYARD" : "NO_MATCHING_SALVAGE_FILES",
    graveyard_path: rel(GRAVEYARD_DIR),
    moved
  };
}

function assertCanonicalMergeGate(args) {
  if (!args.operatorSignature) {
    throw new Error("HUMAN_GATE: canonical merge requires operator_signature");
  }
  return {
    ok: true,
    status: "CANONICAL_MERGE_GATE_PRESENT_BUT_NOT_AUTOMATED",
    note: "salvage_protocol.js does not execute final canonical merges."
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "capture";

  if (command === "capture") return capture(args);
  if (command === "abandon") return abandon(args);
  if (command === "assert-canonical-merge-gate") return assertCanonicalMergeGate(args);

  throw new Error("Usage: node salvage_protocol.js [capture|abandon|assert-canonical-merge-gate]");
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(main(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      status: "SALVAGE_PROTOCOL_BLOCKED",
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  GRAVEYARD_DIR,
  SALVAGE_QUEUE_DIR,
  capture,
  generateInventory,
  pushBranch
};
