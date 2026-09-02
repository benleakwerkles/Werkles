#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const WORLD_STATE_PATH = path.join(ROOT, "tinkarden", "nervous_system", "world_state.json");
const ACTIVE_CONTEXT_PATH = path.join(ROOT, "tinkarden", "nervous_system", "active_context.txt");
const WRAPPER_LOG_PATH = path.join(ROOT, "tinkarden", "nervous_system", "aeye-wrapper-events.jsonl");
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0_RECEIPT_20260706.json");

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    command: [command, ...args].join(" "),
    code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function runOk(command, args, options = {}) {
  const result = run(command, args, options);
  assertPass(result.code === 0, `COMMAND_FAILED:${result.command}\nSTDOUT:${result.stdout}\nSTDERR:${result.stderr}`);
  return result;
}

function parseJsonOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`JSON_OUTPUT_PARSE_FAILED:${result.command}:${error.message}:${result.stdout}`);
  }
}

function fileHash(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  return {
    path: relativePath,
    sha256: sha256(readFileSync(absolutePath)),
    bytes: statSync(absolutePath).size,
  };
}

async function main() {
  const beforeWrapperBytes = existsSync(WRAPPER_LOG_PATH) ? statSync(WRAPPER_LOG_PATH).size : 0;
  const wormeyes = runOk(process.execPath, [
    "scripts/foreman/wormeyes-world-state.mjs",
    "--write",
    "--output",
    WORLD_STATE_PATH,
    "--repo",
    ROOT,
  ]);
  const wormeyesReadback = parseJsonOutput(wormeyes);
  assertPass(wormeyesReadback.status === "ARTIFACT", "Wormeyes refresh did not return ARTIFACT");
  assertPass(wormeyesReadback.output_exists === true, "Wormeyes output does not exist");
  assertPass(path.resolve(wormeyesReadback.output_path) === WORLD_STATE_PATH, "Wormeyes did not write bootloader world_state path");

  const worldState = JSON.parse(await readFile(WORLD_STATE_PATH, "utf8"));
  const generatedMs = Date.parse(worldState.generated_at);
  assertPass(Number.isFinite(generatedMs), "world_state generated_at invalid");
  assertPass(Date.now() - generatedMs < 10 * 60 * 1000, "world_state was not freshly generated");
  assertPass(worldState.machine === (process.env.COMPUTERNAME || "UNKNOWN_MACHINE"), "world_state machine does not match current machine");
  assertPass(worldState.repos?.some((repo) => path.resolve(repo.repo) === ROOT), "world_state does not include current repo");

  const bootloader = runOk(process.execPath, ["tinkarden/nervous_system/bootloader.js"]);
  const bootloaderReadback = parseJsonOutput(bootloader);
  assertPass(bootloaderReadback.status === "ACTIVE_CONTEXT_WRITTEN", "bootloader did not write active context");
  assertPass(bootloaderReadback.sources?.some((source) => source.id === "WORMEYES_WORLD_STATE"), "bootloader did not include Wormeyes source");
  assertPass(existsSync(ACTIVE_CONTEXT_PATH), "active_context.txt missing after bootloader");

  const staleBlock = run(process.execPath, ["tinkarden/nervous_system/bootloader.js"], {
    env: { BOOTLOADER_WORLD_STATE_MAX_AGE_MINUTES: "-1" },
  });
  assertPass(staleBlock.code !== 0, "forced stale bootloader run did not block");
  assertPass(/BOOTLOADER_WORLD_STATE_STALE/.test(staleBlock.stderr), "forced stale bootloader block did not report WORLD_STATE_STALE");

  const aeyeDryRun = runOk(process.execPath, [
    "tinkarden/nervous_system/aeye_client.js",
    "--provider",
    "openai",
    "--aeye",
    "Heimerdinker@Betsy",
    "--prompt",
    "Boot context dry run proof only.",
    "--dry-run",
  ]);
  const aeyeReadback = parseJsonOutput(aeyeDryRun);
  assertPass(aeyeReadback.status === "BOOTPACK_INJECTED_DRY_RUN_COMPLETE", "Aeye dry-run did not inject bootpack");
  assertPass(aeyeReadback.system_payload_contains_bootpack === true, "Aeye dry-run payload did not contain bootpack section");
  assertPass(existsSync(WRAPPER_LOG_PATH), "Aeye wrapper JSONL log missing");
  const afterWrapperBytes = statSync(WRAPPER_LOG_PATH).size;
  assertPass(afterWrapperBytes > beforeWrapperBytes, "Aeye wrapper log did not append dry-run event");

  const fileHashes = [
    "scripts/foreman/organism-boot-context-refresh-smoke.mjs",
    "scripts/foreman/wormeyes-world-state.mjs",
    "tinkarden/nervous_system/bootloader.js",
    "tinkarden/nervous_system/aeye_client.js",
    "tinkarden/nervous_system/world_state.json",
    "tinkarden/nervous_system/active_context.txt",
    "tinkarden/nervous_system/aeye-wrapper-events.jsonl",
  ].map(fileHash);

  const receipt = {
    schema: "BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: process.env.COMPUTERNAME || "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0",
    receipt_id: "BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-boot-context-refresh-smoke.mjs",
    validation: {
      wormeyes_refreshed_bootloader_world_state: true,
      world_state_machine_matches_current_machine: true,
      world_state_includes_current_repo: true,
      bootloader_writes_active_context_after_fresh_world_state: true,
      stale_world_state_blocks_bootloader_under_forced_stale_gate: true,
      aeye_dry_run_injects_bootpack_before_response: true,
      aeye_dry_run_logs_to_wrapper_jsonl: true,
      sqlite_logging_degraded_truthfully: aeyeReadback.call_log_backend === "wrapper_jsonl_only",
      truth_boundary:
        "This smoke refreshes local world_state.json, writes active_context.txt, and runs a dry-run Aeye payload. It does not call an external provider, deploy, push, or claim Mack returned a review.",
    },
    readbacks: {
      wormeyes: {
        output_path: repoRel(WORLD_STATE_PATH),
        output_sha256: wormeyesReadback.output_sha256,
        changed_file_count: wormeyesReadback.changed_file_count,
      },
      bootloader: {
        output_path: bootloaderReadback.output_path,
        sha256: bootloaderReadback.sha256,
        source_count: bootloaderReadback.sources?.length || 0,
      },
      stale_block: {
        code: staleBlock.code,
        stderr: staleBlock.stderr.trim(),
      },
      aeye_dry_run: {
        status: aeyeReadback.status,
        bootpack_loaded: aeyeReadback.bootpack_loaded,
        bootpack_path: aeyeReadback.bootpack_path,
        system_payload_contains_bootpack: aeyeReadback.system_payload_contains_bootpack,
        call_log_backend: aeyeReadback.call_log_backend,
        call_log_degraded_reason: aeyeReadback.call_log_degraded_reason,
      },
    },
    file_hashes: fileHashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external provider call",
      "no Mack receipt claim",
    ],
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH);
  console.log(
    JSON.stringify(
      {
        ok: true,
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        world_state_path: repoRel(WORLD_STATE_PATH),
        active_context_path: repoRel(ACTIVE_CONTEXT_PATH),
        aeye_dry_run_status: aeyeReadback.status,
        stale_block_code: staleBlock.code,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
