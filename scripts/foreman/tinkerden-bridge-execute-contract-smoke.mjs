#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_EXECUTE_CONTRACT_MIRROR_V0_RECEIPT_20260706.json");
const SOURCE_PACKET = "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md";
const COMPILE_FILES = [
  "lib/tinkerden-return-system-v0/store.ts",
  "lib/tinkerden-return-system-v0/types.ts",
  "lib/tinkerden/execution-records.ts",
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/storage.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  "app/api/tinkerden/bridge/execute/route.ts",
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-bridge-execute-contract-smoke.mjs",
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
    path.join(ROOT, "lib"),
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

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function readJsonl(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-tinkerden-bridge-execute-contract-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const originalLoad = Module._load;
    let store;
    try {
      Module._load = function load(request, parent, isMain) {
        if (request === "server-only") return {};
        return originalLoad.call(this, request, parent, isMain);
      };
      store = require(path.join(outDir, "tinkerden-return-system-v0", "store.js"));
    } finally {
      Module._load = originalLoad;
    }

    const result = await store.createBridgeExecutePacket({
      card_id: "book_architecture_bridge_execute_contract_smoke",
      operator_selection: "KEEP",
      move: "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_EXECUTE_CONTRACT_MIRROR_V0",
      recommendation: "Mirror the TinkerDen bridge-execute lane into the canonical organism packet and receipt contracts.",
      composite_score: 100,
      operator_reason: "Approved by + continuation in the book architecture thread.",
      why_now: "Ben asked for Aeye momentum that keeps building actual cooperating paths.",
      recommended_because: "Bridge execute is the other TinkerDen dispatch lane that must stop living outside the canonical contract store.",
    });

    assertPass(result?.packet?.packet_id, "missing packet_id");
    assertPass(result?.receipt?.receipt_id, "missing receipt_id");
    assertPass(result?.contract_write?.packet?.ok === true, "contract packet mirror did not pass");
    assertPass(result?.contract_write?.receipt?.ok === true, "contract receipt mirror did not pass");
    assertPass(existsSync(path.join(ROOT, result.packet_path)), "legacy packet artifact missing");
    assertPass(existsSync(path.join(ROOT, result.receipt_path)), "legacy receipt artifact missing");
    assertPass(existsSync(path.join(ROOT, result.execution_path)), "execution record missing");
    assertPass(existsSync(path.join(ROOT, result.contract_write.packet.artifact_path)), "contract packet artifact missing");
    assertPass(existsSync(path.join(ROOT, result.contract_write.receipt.artifact_path)), "contract receipt artifact missing");

    const contractPacket = await readJson(result.contract_write.packet.artifact_path);
    const contractReceipt = await readJson(result.contract_write.receipt.artifact_path);
    assertPass(contractPacket.schema === "harvey_nerdkle_packet_v0", "contract packet schema mismatch");
    assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "contract receipt schema mismatch");
    assertPass(contractPacket.packet_id === result.packet.packet_id, "contract packet_id mismatch");
    assertPass(contractReceipt.receipt_id === result.receipt.receipt_id, "contract receipt_id mismatch");
    assertPass(contractReceipt.packet_id === result.packet.packet_id, "contract receipt packet_id mismatch");
    assertPass(contractReceipt.status === "partial", "bridge execute receipt must remain partial");
    assertPass(contractReceipt.what_did_not_change.includes("Receiver-side Aeye completion proof was not claimed by this dispatch receipt."), "truth boundary missing");

    const contractEvents = await readJsonl("data/organism/contracts/events.jsonl");
    const relatedContractEvents = contractEvents.filter((event) => event.packet_id === result.packet.packet_id);
    assertPass(relatedContractEvents.some((event) => event.event_type === "packet_dispatched"), "contract packet_dispatched event missing");
    assertPass(relatedContractEvents.some((event) => event.event_type === "packet_receipted" && event.receipt_id === result.receipt.receipt_id), "contract packet_receipted event missing");

    const uiSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
    assertPass(uiSource.includes("contractProofText(result)"), "TinkerDen UI status does not include contract proof text");
    assertPass(uiSource.includes("contract_write?.packet?.artifact_path"), "TinkerDen UI does not read contract packet path");
    assertPass(uiSource.includes("contract_write?.receipt?.artifact_path"), "TinkerDen UI does not read contract receipt path");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_EXECUTE_CONTRACT_MIRROR_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: result.packet.packet_id,
      receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_EXECUTE_CONTRACT_MIRROR_V0_RECEIPT_20260706",
      source_packet: SOURCE_PACKET,
      repo: ROOT,
      command: "node scripts/foreman/tinkerden-bridge-execute-contract-smoke.mjs",
      files_changed: [
        "lib/tinkerden-return-system-v0/store.ts",
        "app/api/tinkerden/bridge/execute/route.ts",
        "app/tinkerden/page.tsx",
        "scripts/foreman/tinkerden-bridge-execute-contract-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_EXECUTE_CONTRACT_MIRROR_V0_RECEIPT_20260706.json"
      ],
      runtime_artifacts_written: [
        result.packet_path,
        result.receipt_path,
        result.execution_path,
        result.receipt_pickup_path,
        result.dispatch_state_path,
        result.event_path,
        result.contract_write.packet.artifact_path,
        result.contract_write.packet.event_path,
        result.contract_write.receipt.artifact_path,
        result.contract_write.receipt.event_path
      ],
      validation: {
        tsc_compile: "passed",
        legacy_tinkerden_bridge_execute_packet_written: true,
        legacy_tinkerden_dispatch_receipt_written: true,
        canonical_execution_record_written: true,
        contract_packet_mirror_written: true,
        contract_receipt_mirror_written: true,
        contract_packet_schema: contractPacket.schema,
        contract_receipt_schema: contractReceipt.schema,
        contract_receipt_status: contractReceipt.status,
        contract_packet_dispatched_event: true,
        contract_packet_receipted_event: true,
        ui_status_surfaces_contract_packet_path: true,
        ui_status_surfaces_contract_receipt_path: true,
        truth_boundary: "Dispatch custody proof remains partial and does not claim downstream Aeye completion."
      },
      contract_write: result.contract_write,
      contract_file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "no clipboard mutation",
        "no workspace focus"
      ],
      next_safe_action: "Add a read-side contract index for TinkerDen so packet, receipt, and event contract mirrors are visible without opening JSON files."
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(JSON.stringify({
      ok: true,
      packet_id: result.packet.packet_id,
      receipt_id: result.receipt.receipt_id,
      receipt_path: repoRel(RECEIPT_PATH),
      legacy_packet_path: result.packet_path,
      legacy_receipt_path: result.receipt_path,
      contract_packet_path: result.contract_write.packet.artifact_path,
      contract_receipt_path: result.contract_write.receipt.artifact_path,
      contract_event_path: result.contract_write.receipt.event_path,
      receipt_sha256: sha256(finalRaw),
      validation: outputReceipt.validation
    }, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
