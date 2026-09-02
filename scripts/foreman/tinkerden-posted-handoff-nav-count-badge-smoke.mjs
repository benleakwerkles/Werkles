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
  "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_BADGE_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "scripts/foreman/tinkerden-posted-handoff-nav-count-badge-smoke.mjs",
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

async function readBadge(page, pathName) {
  await page.goto(`${BASE_URL}${pathName}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-posted-count-badge]", { timeout: 10000 });
  return page.locator("[data-receiver-handoff-posted-count-badge]").first().evaluate((node) => ({
    posted_count: Number(node.getAttribute("data-posted-count")),
    text: node.textContent?.trim() || "",
  }));
}

async function main() {
  const bridgeSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  const receiptsSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  assertPass(
    bridgeSource.includes("data-receiver-handoff-posted-count-badge"),
    "Bridge page missing posted count badge hook",
  );
  assertPass(
    receiptsSource.includes("data-receiver-handoff-posted-count-badge"),
    "Receipts page missing posted count badge hook",
  );

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.posted_count === beforeMixed.posted_count, "posted-only API count does not match mixed index");

  const launchOptions = browserLaunchOptions();
  let bridgeBadge;
  let receiptsBadge;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    bridgeBadge = await readBadge(page, "/tinkerden");
    receiptsBadge = await readBadge(page, "/tinkerden/receipts");
  } finally {
    await browser.close();
  }

  assertPass(bridgeBadge.posted_count === posted.posted_count, "Bridge posted badge count mismatch");
  assertPass(receiptsBadge.posted_count === posted.posted_count, "Receipts posted badge count mismatch");
  assertPass(bridgeBadge.text === `${posted.posted_count} posted`, "Bridge posted badge text mismatch");
  assertPass(receiptsBadge.text === `${posted.posted_count} posted`, "Receipts posted badge text mismatch");

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "posted count badge smoke changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "posted count badge smoke changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "posted count badge smoke changed pending count");
  assertPass(afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count, "posted count badge smoke changed returned-unposted count");
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "posted count badge smoke changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "posted count badge smoke changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "posted count badge smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_BADGE_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: posted.latest?.packet_id ?? "NO_POSTED_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_BADGE_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-posted-handoff-nav-count-badge-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/tinkerden/receipts/page.tsx",
      "scripts/foreman/tinkerden-posted-handoff-nav-count-badge-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_BADGE_V0_RECEIPT_20260706.json",
    ],
    validation: {
      bridge_has_posted_count_badge_hook: true,
      receipts_has_posted_count_badge_hook: true,
      playwright_read_bridge_badge: true,
      playwright_read_receipts_badge: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      posted_api_count: posted.posted_count,
      mixed_posted_count: beforeMixed.posted_count,
      bridge_badge_count: bridgeBadge.posted_count,
      receipts_badge_count: receiptsBadge.posted_count,
      bridge_badge_text: bridgeBadge.text,
      receipts_badge_text: receiptsBadge.text,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_before: beforeMixed.posted_count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary: "The TinkerDen nav posted receiver handoff count badge is read-only and mirrors the posted-only handoff API count.",
    },
    posted_api_result: posted,
    bridge_badge_readback: bridgeBadge,
    receipts_badge_readback: receiptsBadge,
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
    next_safe_action: "Add the same posted-count badge to other TinkerDen nav surfaces if they need posted receiver handoff awareness.",
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
        packet_id: outputReceipt.packet_id,
        posted_api_count: posted.posted_count,
        bridge_badge_count: bridgeBadge.posted_count,
        receipts_badge_count: receiptsBadge.posted_count,
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
