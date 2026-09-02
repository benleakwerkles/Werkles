#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_REFRESH_V0_RECEIPT_20260706.json");
const PAGE_PATH = path.join(ROOT, "app", "tinkerden", "page.tsx");
const API_URL = "http://127.0.0.1:3000/api/organism/contracts/index?limit=25";
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-contract-index-refresh-smoke.mjs",
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

function countMatches(value, needle) {
  return value.split(needle).length - 1;
}

function extractBridgeScript(pageSource) {
  const startNeedle = "const bridgeScript = `";
  const start = pageSource.indexOf(startNeedle);
  const clampStart = pageSource.indexOf("function clampScore", start + startNeedle.length);
  const end = pageSource.lastIndexOf("`;", clampStart);
  assertPass(start >= 0, "bridgeScript start not found");
  assertPass(end > start, "bridgeScript end not found");
  return pageSource.slice(start + startNeedle.length, end);
}

function runNodeCheck(filePath) {
  const proc = spawnSync(process.execPath, ["--check", filePath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (proc.status !== 0) {
    throw new Error(`node --check failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }
  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
  };
}

async function fileHashes(files) {
  const entries = [];
  for (const relativePath of files) {
    const raw = await readFile(path.join(ROOT, relativePath), "utf8");
    entries.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    });
  }
  return entries;
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-tinkerden-contract-index-refresh-${process.pid}-${Date.now()}`);
  await mkdir(tempRoot, { recursive: true });

  try {
    const pageSource = await readFile(PAGE_PATH, "utf8");
    const bridgeScript = extractBridgeScript(pageSource);
    const bridgeScriptPath = path.join(tempRoot, "bridge-script.js");
    await writeFile(bridgeScriptPath, bridgeScript, "utf8");
    const bridgeScriptCheck = runNodeCheck(bridgeScriptPath);

    assertPass(pageSource.includes("function hydrateContractIndex()"), "hydrateContractIndex missing");
    assertPass(pageSource.includes("function renderContractRecord(record)"), "renderContractRecord missing");
    assertPass(pageSource.includes("data-contract-index-panel"), "contract index panel hook missing");
    assertPass(pageSource.includes("data-contract-index-list"), "contract index list hook missing");
    assertPass(pageSource.includes("data-contract-index-api=\"/api/organism/contracts/index?limit=25\""), "contract index API hook missing");
    assertPass(countMatches(pageSource, "hydrateContractIndex();") >= 5, "hydrateContractIndex is not called from load and write paths");

    const response = await fetch(API_URL);
    const api = await response.json();
    assertPass(response.ok && api.ok, `contract index API failed: ${JSON.stringify(api)}`);
    const tinkerdenRecords = Array.isArray(api.records)
      ? api.records.filter((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "))
      : [];
    const lanes = [...new Set(tinkerdenRecords.map((record) => record.lane))].sort();

    assertPass(lanes.includes("TinkerDen bridge execute"), "TinkerDen bridge execute lane missing from API");
    assertPass(lanes.includes("TinkerDen packet relay"), "TinkerDen packet relay lane missing from API");
    assertPass(tinkerdenRecords.every((record) => record.joined_event_count > 0), "A TinkerDen contract record is missing joined event proof");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_REFRESH_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_REFRESH_V0",
      receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_REFRESH_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/tinkerden-contract-index-refresh-smoke.mjs",
      files_changed: [
        "app/tinkerden/page.tsx",
        "scripts/foreman/tinkerden-contract-index-refresh-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_INDEX_REFRESH_V0_RECEIPT_20260706.json"
      ],
      validation: {
        bridge_script_syntax: "passed",
        hydrate_contract_index_present: true,
        contract_index_panel_hook_present: true,
        contract_index_list_hook_present: true,
        contract_index_api_hook_present: true,
        hydrate_contract_index_call_count: countMatches(pageSource, "hydrateContractIndex();"),
        live_api_url: API_URL,
        live_api_ok: true,
        live_api_count: api.count,
        live_api_packet_count: api.packet_count,
        live_api_receipt_count: api.receipt_count,
        live_api_event_count: api.event_count,
        tinkerden_record_count: tinkerdenRecords.length,
        tinkerden_lanes_present: lanes,
        joined_event_proof_present: true
      },
      bridge_script_check: bridgeScriptCheck,
      contract_file_hashes: hashes,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "read-only API proof except receipt artifact"
      ],
      next_safe_action: "Wire the next packet producer lane into canonical contract writes, or add a compact visual badge for contract freshness."
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(JSON.stringify({
      ok: true,
      receipt_path: repoRel(RECEIPT_PATH),
      receipt_sha256: sha256(finalRaw),
      hydrate_contract_index_call_count: outputReceipt.validation.hydrate_contract_index_call_count,
      tinkerden_record_count: tinkerdenRecords.length,
      lanes,
    }, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
