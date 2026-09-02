#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_FRESHNESS_V0_RECEIPT_20260706.json");
const PAGE_PATH = path.join(ROOT, "app", "tinkerden", "page.tsx");
const CONTRACT_API_URL = "http://127.0.0.1:3000/api/organism/contracts/index?limit=25";
const TINKERDEN_URL = "http://127.0.0.1:3000/tinkerden";
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-contract-freshness-smoke.mjs",
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
  const tempRoot = path.join(os.tmpdir(), `werkles-tinkerden-contract-freshness-${process.pid}-${Date.now()}`);
  await mkdir(tempRoot, { recursive: true });

  try {
    const pageSource = await readFile(PAGE_PATH, "utf8");
    const bridgeScript = extractBridgeScript(pageSource);
    const bridgeScriptPath = path.join(tempRoot, "bridge-script.js");
    await writeFile(bridgeScriptPath, bridgeScript, "utf8");
    const bridgeScriptCheck = runNodeCheck(bridgeScriptPath);

    assertPass(pageSource.includes("type ContractFreshness"), "ContractFreshness type missing");
    assertPass(pageSource.includes("function contractFreshnessFor(records, result)"), "client freshness function missing");
    assertPass(pageSource.includes("function setContractFreshness(panel, freshness)"), "client freshness setter missing");
    assertPass(pageSource.includes("function buildContractFreshness("), "server freshness function missing");
    assertPass(pageSource.includes("data-contract-freshness"), "contract freshness data hook missing");
    assertPass(pageSource.includes("setContractFreshness(panel, contractFreshnessFor(records, result))"), "hydrate path does not update freshness");

    const apiResponse = await fetch(CONTRACT_API_URL);
    const api = await apiResponse.json();
    assertPass(apiResponse.ok && api.ok, `contract index API failed: ${JSON.stringify(api)}`);
    const tinkerdenRecords = Array.isArray(api.records)
      ? api.records.filter((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "))
      : [];
    const invalidCount = Number(api.invalid_count ?? 0) + Number(api.malformed_count ?? 0);
    const missingJoins = tinkerdenRecords.filter((record) => Number(record.joined_event_count ?? 0) <= 0).length;
    assertPass(tinkerdenRecords.length >= 2, "expected TinkerDen contract records missing");
    assertPass(invalidCount === 0, "contract index has invalid or malformed records");
    assertPass(missingJoins === 0, "contract index has unjoined TinkerDen records");

    const pageResponse = await fetch(TINKERDEN_URL);
    const pageHtml = await pageResponse.text();
    assertPass(pageResponse.ok, `/tinkerden returned ${pageResponse.status}`);
    assertPass(pageHtml.includes("data-contract-freshness"), "rendered page missing freshness badge hook");
    assertPass(/data-state="(LIVE|STALE|CHECK|NO_MIRRORS)"/.test(pageHtml), "rendered page missing freshness data-state");
    assertPass(pageHtml.includes("Organism Contract Lane"), "rendered page missing contract lane");
    assertPass(pageHtml.includes("TinkerDen bridge execute"), "rendered page missing bridge execute lane");
    assertPass(pageHtml.includes("TinkerDen packet relay"), "rendered page missing packet relay lane");

    const freshnessMatch = pageHtml.match(/<strong data-contract-freshness="(?:true)?" data-state="([^"]+)">([^<]+)<\/strong>/);
    assertPass(Boolean(freshnessMatch), "rendered freshness badge text not found");
    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_FRESHNESS_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_FRESHNESS_V0",
      receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_FRESHNESS_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/tinkerden-contract-freshness-smoke.mjs",
      files_changed: [
        "app/tinkerden/page.tsx",
        "scripts/foreman/tinkerden-contract-freshness-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_CONTRACT_FRESHNESS_V0_RECEIPT_20260706.json"
      ],
      validation: {
        bridge_script_syntax: "passed",
        client_freshness_function_present: true,
        client_freshness_setter_present: true,
        server_freshness_function_present: true,
        freshness_badge_hook_present: true,
        hydrate_updates_freshness: true,
        live_api_url: CONTRACT_API_URL,
        live_api_ok: true,
        tinkerden_record_count: tinkerdenRecords.length,
        invalid_count: invalidCount,
        missing_join_count: missingJoins,
        tinkerden_page_url: TINKERDEN_URL,
        tinkerden_page_status: pageResponse.status,
        rendered_contract_lane: true,
        rendered_freshness_state: freshnessMatch?.[1] ?? "MATCH_NOT_FOUND",
        rendered_freshness_label: freshnessMatch?.[2] ?? "MATCH_NOT_FOUND"
      },
      bridge_script_check: bridgeScriptCheck,
      contract_file_hashes: hashes,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "read-only API/page proof except receipt artifact"
      ],
      next_safe_action: "Wire the next packet producer lane into canonical contract writes."
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(JSON.stringify({
      ok: true,
      receipt_path: repoRel(RECEIPT_PATH),
      receipt_sha256: sha256(finalRaw),
      rendered_freshness_state: outputReceipt.validation.rendered_freshness_state,
      rendered_freshness_label: outputReceipt.validation.rendered_freshness_label,
      tinkerden_record_count: tinkerdenRecords.length,
    }, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
