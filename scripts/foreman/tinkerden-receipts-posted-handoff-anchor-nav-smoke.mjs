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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_ANCHOR_NAV_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "scripts/foreman/tinkerden-receipts-posted-handoff-anchor-nav-smoke.mjs",
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
  assertPass(
    pageSource.includes("data-receiver-handoff-posted-anchor-nav"),
    "receipts page missing posted handoff anchor nav hook",
  );
  assertPass(
    pageSource.includes("data-receiver-handoff-posted-anchor-link"),
    "receipts page missing posted handoff anchor link hook",
  );

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.records.length > 0, "posted handoff API returned no records");
  const target = posted.records[0];
  const targetHash = `#receiver-handoff-posted-${target.bundle_id}`;

  const launchOptions = browserLaunchOptions();
  let navReadback;
  let cardReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-posted-anchor-nav]", { timeout: 10000 });
    navReadback = await page.locator("[data-receiver-handoff-posted-anchor-nav]").evaluate((node) => {
      const links = Array.from(node.querySelectorAll("[data-receiver-handoff-posted-anchor-link]"));
      const first = links[0];
      return {
        posted_count: Number(node.getAttribute("data-posted-count")),
        link_count: links.length,
        first_href: first?.getAttribute("href") || "",
        first_bundle_id: first?.getAttribute("data-bundle-id") || "",
        first_receipt_id: first?.getAttribute("data-receipt-id") || "",
        first_text: first?.textContent?.trim() || "",
      };
    });

    assertPass(navReadback.first_href === targetHash, `unexpected first posted nav href: ${navReadback.first_href}`);
    await page.locator("[data-receiver-handoff-posted-anchor-link]").first().click();
    await page.waitForFunction((hash) => window.location.hash === hash, targetHash, { timeout: 10000 });
    await page.waitForSelector(targetHash, { timeout: 10000 });
    cardReadback = await page.locator(targetHash).evaluate((node) => ({
      id: node.id,
      bundle_id: node.getAttribute("data-bundle-id"),
      receipt_id: node.getAttribute("data-receipt-id"),
      contract_receipt_path: node.getAttribute("data-contract-receipt-path"),
      location_hash: window.location.hash,
      text: node.textContent?.trim() || "",
    }));
  } finally {
    await browser.close();
  }

  assertPass(navReadback.posted_count === posted.records.length, "posted nav count mismatch");
  assertPass(navReadback.link_count === posted.records.length, "posted nav link count mismatch");
  assertPass(navReadback.first_bundle_id === target.bundle_id, "posted nav first bundle mismatch");
  assertPass(navReadback.first_receipt_id === target.returned_receipt_id, "posted nav first receipt mismatch");
  assertPass(cardReadback.location_hash === targetHash, "posted nav click did not set expected hash");
  assertPass(cardReadback.id === targetHash.slice(1), "posted target card id mismatch");
  assertPass(cardReadback.bundle_id === target.bundle_id, "posted target card bundle mismatch");
  assertPass(cardReadback.receipt_id === target.returned_receipt_id, "posted target card receipt mismatch");
  assertPass(cardReadback.contract_receipt_path === target.contract_receipt_path, "posted target card contract mismatch");
  assertPass(cardReadback.text.includes(target.contract_receipt_path), "posted target card missing contract path text");

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "posted anchor nav changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "posted anchor nav changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "posted anchor nav changed pending count");
  assertPass(afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count, "posted anchor nav changed returned-unposted count");
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "posted anchor nav changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "posted anchor nav changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "posted anchor nav changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_ANCHOR_NAV_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: target.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_ANCHOR_NAV_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-posted-handoff-anchor-nav-smoke.mjs",
    files_changed: [
      "app/tinkerden/receipts/page.tsx",
      "scripts/foreman/tinkerden-receipts-posted-handoff-anchor-nav-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_POSTED_HANDOFF_ANCHOR_NAV_V0_RECEIPT_20260706.json",
    ],
    validation: {
      page_has_posted_anchor_nav_hook: true,
      page_has_posted_anchor_link_hook: true,
      playwright_clicked_posted_anchor_nav_link: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      expected_hash: targetHash,
      nav_first_href: navReadback.first_href,
      nav_posted_count: navReadback.posted_count,
      nav_link_count: navReadback.link_count,
      api_posted_record_count: posted.records.length,
      nav_first_bundle_id: navReadback.first_bundle_id,
      target_card_bundle_id: cardReadback.bundle_id,
      api_first_bundle_id: target.bundle_id,
      nav_first_receipt_id: navReadback.first_receipt_id,
      target_card_receipt_id: cardReadback.receipt_id,
      api_first_receipt_id: target.returned_receipt_id,
      target_card_contract_receipt_path: cardReadback.contract_receipt_path,
      api_first_contract_receipt_path: target.contract_receipt_path,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_before: beforeMixed.posted_count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary: "The posted receiver handoff anchor nav is read-only and only jumps to existing posted receipt cards rendered from the posted-only API.",
    },
    posted_api_result: posted,
    nav_readback: navReadback,
    card_readback: cardReadback,
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
    next_safe_action: "Add a small posted-receipt count badge to the TinkerDen surface nav so the operator can see posted receiver handoff volume before opening receipts.",
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
        packet_id: target.packet_id,
        target_bundle_id: target.bundle_id,
        target_receipt_id: target.returned_receipt_id,
        target_contract_receipt_path: target.contract_receipt_path,
        nav_link_count: navReadback.link_count,
        expected_hash: targetHash,
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
