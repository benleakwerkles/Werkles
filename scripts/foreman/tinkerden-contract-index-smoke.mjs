#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_V0_RECEIPT_20260706.json");
const REQUIRED_TINKERDEN_LANES = new Set(["TinkerDen packet relay", "TinkerDen bridge execute"]);
const COMPILE_FILES = [
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/storage.ts",
  "lib/organism/contracts/read-index.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  "app/api/organism/contracts/index/route.ts",
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-contract-index-smoke.mjs",
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

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-tinkerden-contract-index-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const { readOrganismContractIndex } = require(path.join(outDir, "read-index.js"));
    const index = await readOrganismContractIndex(50);
    const tinkerdenRecords = index.records.filter((record) => record.lane.startsWith("TinkerDen "));
    const foundLanes = new Set(tinkerdenRecords.map((record) => record.lane));
    const missingLanes = [...REQUIRED_TINKERDEN_LANES].filter((lane) => !foundLanes.has(lane));

    assertPass(index.ok === true, "index did not return ok");
    assertPass(index.packet_count >= 2, "contract packet count too low");
    assertPass(index.receipt_count >= 2, "contract receipt count too low");
    assertPass(index.event_count >= 2, "contract event count too low");
    assertPass(missingLanes.length === 0, `missing TinkerDen lanes: ${missingLanes.join(", ")}`);
    assertPass(tinkerdenRecords.every((record) => record.receipt_id !== "NO_RECEIPT"), "a TinkerDen contract packet is missing a receipt");
    assertPass(tinkerdenRecords.every((record) => record.joined_event_count > 0), "a TinkerDen contract packet is missing joined packet/receipt event");
    assertPass(tinkerdenRecords.some((record) => record.receipt_status === "partial"), "bridge execute partial receipt not visible");
    assertPass(tinkerdenRecords.some((record) => record.receipt_status === "completed"), "packet relay completed receipt not visible");

    const routeSource = await readFile(path.join(ROOT, "app", "api", "organism", "contracts", "index", "route.ts"), "utf8");
    const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
    assertPass(routeSource.includes("readOrganismContractIndex"), "API route does not call readOrganismContractIndex");
    assertPass(pageSource.includes("Organism Contract Lane"), "TinkerDen page does not render contract lane");
    assertPass(pageSource.includes("/api/organism/contracts/index"), "TinkerDen page does not surface contract index API path");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_V0",
      receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/tinkerden-contract-index-smoke.mjs",
      files_changed: [
        "lib/organism/contracts/read-index.ts",
        "app/api/organism/contracts/index/route.ts",
        "app/tinkerden/page.tsx",
        "scripts/foreman/tinkerden-contract-index-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_V0_RECEIPT_20260706.json"
      ],
      validation: {
        tsc_compile: "passed",
        contract_index_ok: true,
        source_path: index.source_path,
        source_paths: index.source_paths,
        total_records: index.count,
        packet_count: index.packet_count,
        receipt_count: index.receipt_count,
        event_count: index.event_count,
        malformed_count: index.malformed_count,
        invalid_count: index.invalid_count,
        tinkerden_record_count: tinkerdenRecords.length,
        tinkerden_lanes_present: [...foundLanes].sort(),
        joined_events_for_tinkerden_records: tinkerdenRecords.every((record) => record.joined_event_count > 0),
        partial_dispatch_receipt_visible: tinkerdenRecords.some((record) => record.receipt_status === "partial"),
        completed_relay_receipt_visible: tinkerdenRecords.some((record) => record.receipt_status === "completed"),
        api_route_source_calls_reader: true,
        tinkerden_page_renders_contract_lane: true
      },
      latest_tinkerden_records: tinkerdenRecords.slice(0, 10),
      contract_file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "read-only index except receipt artifact"
      ],
      next_safe_action: "Add a compact contract-index refresh endpoint to the TinkerDen client script, or wire the index into another packet producer lane."
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(JSON.stringify({
      ok: true,
      receipt_path: repoRel(RECEIPT_PATH),
      receipt_sha256: sha256(finalRaw),
      tinkerden_record_count: tinkerdenRecords.length,
      tinkerden_lanes_present: [...foundLanes].sort(),
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
