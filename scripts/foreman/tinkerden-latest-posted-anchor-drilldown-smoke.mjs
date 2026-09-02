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
  "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_ANCHOR_DRILLDOWN_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "scripts/foreman/tinkerden-latest-posted-anchor-drilldown-smoke.mjs",
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
    bridgeSource.includes("receiver-handoff-posted-${receiverHandoffLatestPosted.bundleId}"),
    "Bridge page missing latest posted bundle fragment href",
  );
  assertPass(
    bridgeSource.includes("postedReceiptHref(record)"),
    "Bridge hydration missing posted receipt href helper",
  );
  assertPass(
    receiptsSource.includes("id=\"receiver-handoff-posted\""),
    "Receipts page missing posted section anchor",
  );
  assertPass(
    receiptsSource.includes("data-receiver-handoff-posted-card"),
    "Receipts page missing posted card hook",
  );

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.latest, "posted handoff API has no latest record");
  const targetHash = `#receiver-handoff-posted-${posted.latest.bundle_id}`;

  const launchOptions = browserLaunchOptions();
  let bridgeReadback;
  let receiptsCardReadback;
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
    assertPass(
      bridgeReadback.link_href === `/tinkerden/receipts${targetHash}`,
      `unexpected anchor href: ${bridgeReadback.link_href}`,
    );

    await page.locator("[data-receiver-handoff-latest-posted-link]").first().click();
    await page.waitForURL((url) => url.pathname === "/tinkerden/receipts" && url.hash === targetHash, {
      timeout: 10000,
    });
    await page.waitForSelector(targetHash, { timeout: 10000 });
    receiptsCardReadback = await page.locator(targetHash).evaluate((node) => ({
      id: node.id,
      bundle_id: node.getAttribute("data-bundle-id"),
      receipt_id: node.getAttribute("data-receipt-id"),
      contract_receipt_path: node.getAttribute("data-contract-receipt-path"),
      text: node.textContent?.trim() || "",
      location_hash: window.location.hash,
    }));
  } finally {
    await browser.close();
  }

  assertPass(bridgeReadback.bundle_id === posted.latest.bundle_id, "Bridge bundle mismatch");
  assertPass(bridgeReadback.receipt_id === posted.latest.returned_receipt_id, "Bridge receipt mismatch");
  assertPass(bridgeReadback.contract_receipt_path === posted.latest.contract_receipt_path, "Bridge contract path mismatch");
  assertPass(receiptsCardReadback.location_hash === targetHash, "receipts page location hash mismatch");
  assertPass(receiptsCardReadback.id === targetHash.slice(1), "receipts card id mismatch");
  assertPass(receiptsCardReadback.bundle_id === posted.latest.bundle_id, "receipts card bundle mismatch");
  assertPass(receiptsCardReadback.receipt_id === posted.latest.returned_receipt_id, "receipts card receipt mismatch");
  assertPass(
    receiptsCardReadback.contract_receipt_path === posted.latest.contract_receipt_path,
    "receipts card contract path mismatch",
  );
  assertPass(receiptsCardReadback.text.includes(posted.latest.contract_receipt_path), "receipts card text missing contract path");

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "anchor drilldown changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "anchor drilldown changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "anchor drilldown changed pending count");
  assertPass(afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count, "anchor drilldown changed returned-unposted count");
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "anchor drilldown changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "anchor drilldown changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "anchor drilldown changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_ANCHOR_DRILLDOWN_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: posted.latest.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_ANCHOR_DRILLDOWN_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-latest-posted-anchor-drilldown-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/tinkerden/receipts/page.tsx",
      "scripts/foreman/tinkerden-latest-posted-anchor-drilldown-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_LATEST_POSTED_ANCHOR_DRILLDOWN_V0_RECEIPT_20260706.json",
    ],
    validation: {
      bridge_has_latest_bundle_fragment_href: true,
      bridge_hydration_has_posted_href_helper: true,
      receipts_page_has_posted_section_anchor: true,
      receipts_page_has_posted_card_hook: true,
      playwright_clicked_anchor_drilldown: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      expected_hash: targetHash,
      bridge_link_href: bridgeReadback.link_href,
      receipts_location_hash: receiptsCardReadback.location_hash,
      bridge_bundle_id: bridgeReadback.bundle_id,
      receipts_card_bundle_id: receiptsCardReadback.bundle_id,
      api_latest_bundle_id: posted.latest.bundle_id,
      bridge_receipt_id: bridgeReadback.receipt_id,
      receipts_card_receipt_id: receiptsCardReadback.receipt_id,
      api_latest_receipt_id: posted.latest.returned_receipt_id,
      bridge_contract_receipt_path: bridgeReadback.contract_receipt_path,
      receipts_card_contract_receipt_path: receiptsCardReadback.contract_receipt_path,
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
      truth_boundary: "The latest posted drilldown now lands on the specific posted receiver handoff card and remains read-only.",
    },
    posted_api_result: posted,
    bridge_readback: bridgeReadback,
    receipts_card_readback: receiptsCardReadback,
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
    next_safe_action: "Add posted handoff anchors to the receipts page nav or search surface if the posted list grows beyond quick visual scan size.",
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
        bridge_link_href: bridgeReadback.link_href,
        receipts_location_hash: receiptsCardReadback.location_hash,
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
