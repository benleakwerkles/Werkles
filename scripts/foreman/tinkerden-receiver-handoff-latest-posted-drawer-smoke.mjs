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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_LATEST_POSTED_DRAWER_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-receiver-handoff-latest-posted-drawer-smoke.mjs",
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

async function getHandoffIndex() {
  const response = await fetch(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`HANDOFF_INDEX_FAILED:${response.status}:${JSON.stringify(result)}`);
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

function latestPosted(records) {
  return records.find((record) => record.state === "posted" && record.contract_event_joined)
    || records.find((record) => record.state === "posted")
    || null;
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("data-receiver-handoff-latest-posted"), "TinkerDen page missing latest posted drawer hook");
  assertPass(pageSource.includes("Latest posted"), "TinkerDen page missing latest posted drawer label");

  const before = await getHandoffIndex();
  const expected = latestPosted(before.records);
  assertPass(expected, "receiver handoff index has no posted record for latest drawer smoke");
  assertPass(expected.contract_receipt_path !== "NO_CONTRACT_RECEIPT", "expected latest posted record has no contract receipt path");
  assertPass(expected.returned_receipt_id !== "NO_RETURNED_RECEIPT", "expected latest posted record has no returned receipt id");

  const launchOptions = browserLaunchOptions();
  let drawerReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-latest-posted]", { timeout: 10000 });
    await page.waitForFunction(
      (bundleId) => {
        const node = document.querySelector("[data-receiver-handoff-latest-posted]");
        return node?.getAttribute("data-bundle-id") === bundleId;
      },
      expected.bundle_id,
      { timeout: 10000 },
    );
    drawerReadback = await page.locator("[data-receiver-handoff-latest-posted]").evaluate((node) => ({
      text: node.textContent?.trim() || "",
      state: node.getAttribute("data-state"),
      bundle_id: node.getAttribute("data-bundle-id"),
      receipt_id: node.getAttribute("data-receipt-id"),
      contract_receipt_path: node.getAttribute("data-contract-receipt-path"),
    }));
  } finally {
    await browser.close();
  }

  assertPass(drawerReadback.state === expected.state, "drawer state mismatch");
  assertPass(drawerReadback.bundle_id === expected.bundle_id, "drawer bundle id mismatch");
  assertPass(drawerReadback.receipt_id === expected.returned_receipt_id, "drawer receipt id mismatch");
  assertPass(drawerReadback.contract_receipt_path === expected.contract_receipt_path, "drawer contract receipt path mismatch");
  assertPass(drawerReadback.text.includes(expected.bundle_id), "drawer text missing bundle id");
  assertPass(drawerReadback.text.includes(expected.contract_receipt_path), "drawer text missing contract receipt path");

  const after = await getHandoffIndex();
  assertPass(after.count === before.count, "latest posted drawer smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "latest posted drawer smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "latest posted drawer smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "latest posted drawer smoke changed returned-unposted count");
  assertPass(after.template_return_blocked_count === before.template_return_blocked_count, "latest posted drawer smoke changed template-blocked count");
  assertPass(after.invalid_count === before.invalid_count, "latest posted drawer smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "latest posted drawer smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_LATEST_POSTED_DRAWER_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: expected.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_LATEST_POSTED_DRAWER_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-latest-posted-drawer-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-latest-posted-drawer-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_LATEST_POSTED_DRAWER_V0_RECEIPT_20260706.json",
    ],
    validation: {
      page_source_has_latest_posted_hook: true,
      page_source_has_latest_posted_label: true,
      playwright_read_latest_posted_drawer: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      expected_bundle_id: expected.bundle_id,
      drawer_bundle_id: drawerReadback.bundle_id,
      expected_receipt_id: expected.returned_receipt_id,
      drawer_receipt_id: drawerReadback.receipt_id,
      expected_contract_receipt_path: expected.contract_receipt_path,
      drawer_contract_receipt_path: drawerReadback.contract_receipt_path,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_before: before.posted_count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "The latest posted drawer is a read-only cockpit summary backed by the receiver handoff index; it does not create, fill, post, or mutate handoffs.",
    },
    expected_record: expected,
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
    next_safe_action: "Add the same latest posted summary to a dedicated receipt drawer route, or expose a filtered posted-only handoff API for broader cockpit reuse.",
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
        packet_id: expected.packet_id,
        bundle_id: expected.bundle_id,
        receipt_id: expected.returned_receipt_id,
        contract_receipt_path: expected.contract_receipt_path,
        handoff_count_before: before.count,
        handoff_count_after: after.count,
        posted_count_before: before.posted_count,
        posted_count_after: after.posted_count,
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
