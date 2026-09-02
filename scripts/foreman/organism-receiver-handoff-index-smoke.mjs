#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const TARGET_PACKET_ID = "td_packet_bridge_execute_mr8te4jp_srhdov";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_INDEX_V0_RECEIPT_20260706.json",
);
const COMPILE_FILES = [
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/storage.ts",
  "lib/organism/contracts/receiver-handoff-index.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  "app/api/organism/contracts/receiver-handoffs/route.ts",
  "scripts/foreman/organism-receiver-handoff-index-smoke.mjs",
];

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

function runTsc(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    ...COMPILE_FILES,
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--esModuleInterop",
    "--strict",
    "--skipLibCheck",
    "--outDir",
    outDir,
    "--rootDir",
    path.join(ROOT, "lib", "organism", "contracts"),
  ];
  const proc = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (proc.status !== 0) {
    throw new Error(`tsc failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
  };
}

async function fileHashes(files) {
  const entries = [];
  for (const relativePath of files) {
    const absolutePath = path.join(ROOT, relativePath);
    const raw = await readFile(absolutePath, "utf8");
    entries.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    });
  }
  return entries;
}

async function tryLiveApi() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=10`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const result = await response.json();
    return {
      attempted: true,
      ok: response.ok && result.ok === true,
      status: response.status,
      result,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-receiver-handoff-index-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const { readReceiverHandoffIndex } = require(path.join(outDir, "receiver-handoff-index.js"));
    const index = await readReceiverHandoffIndex(25);
    const target = index.records.find((record) => record.packet_id === TARGET_PACKET_ID);

    assertPass(index.ok === true, "handoff index did not return ok");
    assertPass(index.count >= 1, "handoff index has no records");
    assertPass(target, `handoff index missing target packet ${TARGET_PACKET_ID}`);
    assertPass(target.state === "posted", `target handoff state is ${target.state}, expected posted`);
    assertPass(target.returned_status === "partial", "target returned receipt status is not partial");
    assertPass(target.returned_receipt_path.endsWith("/returned-receipt.json"), "returned receipt path missing");
    assertPass(target.contract_receipt_path !== "NO_CONTRACT_RECEIPT", "contract receipt path missing");
    assertPass(existsSync(path.join(ROOT, target.contract_receipt_path)), "contract receipt artifact missing");
    assertPass(target.contract_event_joined === true, "contract event is not joined to returned receipt");
    assertPass(target.truth_boundary.length > 0, "truth boundary missing");

    const routeSource = await readFile(path.join(ROOT, "app", "api", "organism", "contracts", "receiver-handoffs", "route.ts"), "utf8");
    assertPass(routeSource.includes("readReceiverHandoffIndex"), "receiver handoff API route does not call index reader");
    assertPass(routeSource.includes("receiver handoff index read failed"), "receiver handoff API route does not expose failure text");

    const liveApi = await tryLiveApi();
    assertPass(liveApi.ok === true, `live receiver handoff API read failed: ${JSON.stringify(liveApi)}`);
    assertPass(
      liveApi.result.records.some((record) => record.packet_id === TARGET_PACKET_ID && record.state === "posted"),
      "live receiver handoff API does not show posted target handoff",
    );

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_INDEX_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: TARGET_PACKET_ID,
      receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_INDEX_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/organism-receiver-handoff-index-smoke.mjs",
      files_changed: [
        "lib/organism/contracts/receiver-handoff-index.ts",
        "app/api/organism/contracts/receiver-handoffs/route.ts",
        "scripts/foreman/organism-receiver-handoff-index-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_INDEX_V0_RECEIPT_20260706.json",
      ],
      validation: {
        tsc_compile: "passed",
        handoff_index_ok: true,
        record_count: index.count,
        posted_count: index.posted_count,
        pending_count: index.pending_count,
        returned_unposted_count: index.returned_unposted_count,
        invalid_count: index.invalid_count,
        malformed_count: index.malformed_count,
        target_packet_visible: true,
        target_state: target.state,
        target_returned_status: target.returned_status,
        target_contract_receipt_path: target.contract_receipt_path,
        target_contract_event_joined: target.contract_event_joined,
        api_route_calls_reader: true,
        live_api_readback_ok: true,
        truth_boundary: "Receiver handoff observability reports posted/returned/pending state without upgrading partial proof to completion.",
      },
      receiver_handoff_record: target,
      live_api_readback: {
        status: liveApi.status,
        count: liveApi.result.count,
        posted_count: liveApi.result.posted_count,
        pending_count: liveApi.result.pending_count,
        invalid_count: liveApi.result.invalid_count,
        malformed_count: liveApi.result.malformed_count,
      },
      file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "read-only index except receipt artifact",
        "no synthetic completion receipt",
      ],
      next_safe_action: "Surface receiver handoff state in the TinkerDen proof rail or route real separate-Aeye handoffs into this index.",
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          receipt_path: repoRel(RECEIPT_PATH),
          receipt_sha256: sha256(finalRaw),
          count: index.count,
          posted_count: index.posted_count,
          target_packet_id: target.packet_id,
          target_state: target.state,
          target_contract_receipt_path: target.contract_receipt_path,
          validation: outputReceipt.validation,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
