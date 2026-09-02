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
  "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_DRILLDOWN_LINK_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "scripts/foreman/tinkerden-latest-posted-drilldown-link-smoke.mjs",
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
  const bridgeSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  const receiptsSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  assertPass(
    bridgeSource.includes("data-receiver-handoff-latest-posted-link"),
    "Bridge page missing latest posted drilldown link hook",
  );
  assertPass(bridgeSource.includes("Open posted receipts"), "Bridge page missing drilldown link label");
  assertPass(
    receiptsSource.includes("data-receiver-handoff-posted-drawer"),
    "Receipts page missing posted drawer target hook",
  );

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.latest, "posted handoff API has no latest record");

  const launchOptions = browserLaunchOptions();
  let bridgeReadback;
  let receiptsReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-latest-posted-link]", { timeout: 10000 });
    await page.waitForFunction(
      (bundleId) => {
        const drawer = document.querySelector("[data-receiver-handoff-latest-posted]");
        return drawer?.getAttribute("data-bundle-id") === bundleId;
      },
      posted.latest.bundle_id,
      { timeout: 10000 },
    );
    bridgeReadback = await page.evaluate(() => {
      const drawer = document.querySelector("[data-receiver-handoff-latest-posted]");
      const link = document.querySelector("[data-receiver-handoff-latest-posted-link]");
      return {
        bundle_id: drawer?.getAttribute("data-bundle-id"),
        receipt_id: drawer?.getAttribute("data-receipt-id"),
        contract_receipt_path: drawer?.getAttribute("data-contract-receipt-path"),
        link_href: link?.getAttribute("href"),
        link_text: link?.textContent?.trim(),
      };
    });

    assertPass(bridgeReadback.link_href === "/tinkerden/receipts", `unexpected drilldown href: ${bridgeReadback.link_href}`);
    await page.locator("[data-receiver-handoff-latest-posted-link]").first().click();
    await page.waitForURL(/\/tinkerden\/receipts(?:$|\?)/, { timeout: 10000 });
    await page.waitForSelector("[data-receiver-handoff-posted-drawer]", { timeout: 10000 });
    receiptsReadback = await page.locator("[data-receiver-handoff-posted-drawer]").evaluate((node) => ({
      latest_bundle_id: node.getAttribute("data-latest-bundle-id"),
      latest_receipt_id: node.getAttribute("data-latest-receipt-id"),
      latest_contract_receipt_path: node.getAttribute("data-latest-contract-receipt-path"),
      posted_count: Number(node.getAttribute("data-posted-count")),
      source_total_count: Number(node.getAttribute("data-source-total-count")),
      text: node.textContent?.trim() || "",
    }));
  } finally {
    await browser.close();
  }

  assertPass(bridgeReadback.bundle_id === posted.latest.bundle_id, "Bridge drawer bundle mismatch");
  assertPass(bridgeReadback.receipt_id === posted.latest.returned_receipt_id, "Bridge drawer receipt mismatch");
  assertPass(bridgeReadback.contract_receipt_path === posted.latest.contract_receipt_path, "Bridge drawer contract path mismatch");
  assertPass(bridgeReadback.link_text === "Open posted receipts", "Bridge drilldown link text mismatch");
  assertPass(receiptsReadback.latest_bundle_id === posted.latest.bundle_id, "Receipts drawer bundle mismatch");
  assertPass(receiptsReadback.latest_receipt_id === posted.latest.returned_receipt_id, "Receipts drawer receipt mismatch");
  assertPass(
    receiptsReadback.latest_contract_receipt_path === posted.latest.contract_receipt_path,
    "Receipts drawer contract path mismatch",
  );
  assertPass(receiptsReadback.posted_count === posted.posted_count, "Receipts drawer posted count mismatch");
  assertPass(receiptsReadback.source_total_count === posted.source_total_count, "Receipts drawer source count mismatch");

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "drilldown link smoke changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "drilldown link smoke changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "drilldown link smoke changed pending count");
  assertPass(afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count, "drilldown link smoke changed returned-unposted count");
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "drilldown link smoke changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "drilldown link smoke changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "drilldown link smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_DRILLDOWN_LINK_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: posted.latest.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_DRILLDOWN_LINK_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-latest-posted-drilldown-link-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-latest-posted-drilldown-link-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_DRILLDOWN_LINK_V0_RECEIPT_20260706.json",
    ],
    validation: {
      bridge_has_drilldown_link_hook: true,
      bridge_has_drilldown_link_label: true,
      receipts_has_posted_drawer_target: true,
      playwright_clicked_drilldown_link: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      link_href: bridgeReadback.link_href,
      bridge_bundle_id: bridgeReadback.bundle_id,
      receipts_bundle_id: receiptsReadback.latest_bundle_id,
      api_latest_bundle_id: posted.latest.bundle_id,
      bridge_receipt_id: bridgeReadback.receipt_id,
      receipts_receipt_id: receiptsReadback.latest_receipt_id,
      api_latest_receipt_id: posted.latest.returned_receipt_id,
      bridge_contract_receipt_path: bridgeReadback.contract_receipt_path,
      receipts_contract_receipt_path: receiptsReadback.latest_contract_receipt_path,
      api_latest_contract_receipt_path: posted.latest.contract_receipt_path,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_before: beforeMixed.posted_count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary: "The Bridge latest-posted drilldown link is read-only and lands on the posted receiver handoff drawer showing the same API-backed posted receipt.",
    },
    posted_api_result: posted,
    bridge_readback: bridgeReadback,
    receipts_readback: receiptsReadback,
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
    next_safe_action: "Add a small status affordance to the Bridge drilldown link when posted receipts are empty, while preserving the same read-only guarantee.",
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
        link_href: bridgeReadback.link_href,
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
