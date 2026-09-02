#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_DRAWER_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "lib/organism/contracts/receiver-handoff-posted-index.ts",
  "scripts/foreman/tinkerden-receipts-posted-handoff-drawer-smoke.mjs",
];
const BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA || ""}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

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

function browserLaunchOptions() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  return executablePath ? { headless: true, executablePath } : { headless: true };
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`GET_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return result;
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
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  assertPass(pageSource.includes("readReceiverHandoffPostedIndex"), "receipts page missing posted handoff reader");
  assertPass(pageSource.includes("data-receiver-handoff-posted-drawer"), "receipts page missing posted drawer hook");
  assertPass(pageSource.includes("data-receiver-handoff-posted-list"), "receipts page missing posted list hook");

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.latest, "posted handoff API has no latest record");
  assertPass(posted.records.length > 0, "posted handoff API returned no records");

  const launchOptions = browserLaunchOptions();
  let drawerReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-posted-drawer]", { timeout: 10000 });
    drawerReadback = await page.locator("[data-receiver-handoff-posted-drawer]").evaluate((node) => ({
      text: node.textContent?.trim() || "",
      latest_bundle_id: node.getAttribute("data-latest-bundle-id"),
      latest_receipt_id: node.getAttribute("data-latest-receipt-id"),
      latest_contract_receipt_path: node.getAttribute("data-latest-contract-receipt-path"),
      posted_count: Number(node.getAttribute("data-posted-count")),
      source_total_count: Number(node.getAttribute("data-source-total-count")),
    }));
    drawerReadback.card_count = await page.locator("[data-receiver-handoff-posted-list] article").count();
  } finally {
    await browser.close();
  }

  assertPass(drawerReadback.latest_bundle_id === posted.latest.bundle_id, "drawer latest bundle mismatch");
  assertPass(drawerReadback.latest_receipt_id === posted.latest.returned_receipt_id, "drawer latest receipt mismatch");
  assertPass(
    drawerReadback.latest_contract_receipt_path === posted.latest.contract_receipt_path,
    "drawer latest contract path mismatch",
  );
  assertPass(drawerReadback.posted_count === posted.posted_count, "drawer posted count mismatch");
  assertPass(drawerReadback.source_total_count === posted.source_total_count, "drawer source total mismatch");
  assertPass(drawerReadback.card_count === posted.records.length, "drawer posted card count mismatch");
  assertPass(drawerReadback.text.includes(posted.latest.bundle_id), "drawer text missing latest bundle");
  assertPass(drawerReadback.text.includes(posted.latest.contract_receipt_path), "drawer text missing contract path");

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "posted handoff drawer changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "posted handoff drawer changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "posted handoff drawer changed pending count");
  assertPass(
    afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count,
    "posted handoff drawer changed returned-unposted count",
  );
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "posted handoff drawer changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "posted handoff drawer changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "posted handoff drawer changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_DRAWER_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: posted.latest.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_DRAWER_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-posted-handoff-drawer-smoke.mjs",
    files_changed: [
      "app/tinkerden/receipts/page.tsx",
      "scripts/foreman/tinkerden-receipts-posted-handoff-drawer-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_DRAWER_V0_RECEIPT_20260706.json",
    ],
    validation: {
      page_imports_posted_reader: true,
      page_has_posted_drawer_hook: true,
      page_has_posted_list_hook: true,
      playwright_read_receipts_page: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      api_path: "/api/organism/contracts/receiver-handoffs/posted?limit=25",
      latest_bundle_id: posted.latest.bundle_id,
      drawer_latest_bundle_id: drawerReadback.latest_bundle_id,
      latest_receipt_id: posted.latest.returned_receipt_id,
      drawer_latest_receipt_id: drawerReadback.latest_receipt_id,
      latest_contract_receipt_path: posted.latest.contract_receipt_path,
      drawer_latest_contract_receipt_path: drawerReadback.latest_contract_receipt_path,
      posted_card_count: drawerReadback.card_count,
      posted_api_record_count: posted.records.length,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_before: beforeMixed.posted_count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary: "The TinkerDen receipts page now renders posted receiver handoff receipts from the posted-only read model; the drawer is read-only and does not mutate handoff state.",
    },
    posted_api_result: posted,
    drawer_readback: drawerReadback,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no handoff created",
      "no returned receipt filled",
      "no contract receipt posted",
    ],
    next_safe_action: "Add a compact link from the TinkerDen Bridge latest-posted drawer to /tinkerden/receipts for operator drill-down.",
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
        packet_id: posted.latest.packet_id,
        latest_bundle_id: posted.latest.bundle_id,
        latest_receipt_id: posted.latest.returned_receipt_id,
        latest_contract_receipt_path: posted.latest.contract_receipt_path,
        posted_card_count: drawerReadback.card_count,
        handoff_count_before: beforeMixed.count,
        handoff_count_after: afterMixed.count,
        posted_count_before: beforeMixed.posted_count,
        posted_count_after: afterMixed.posted_count,
        validation: outputReceipt.validation,
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
