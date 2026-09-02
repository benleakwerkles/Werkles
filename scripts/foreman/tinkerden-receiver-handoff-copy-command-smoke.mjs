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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_COPY_COMMAND_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-index.ts",
  "scripts/foreman/tinkerden-receiver-handoff-copy-command-smoke.mjs",
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
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("COPY RETURN COMMAND"), "TinkerDen page missing copy return command label");
  assertPass(pageSource.includes("data-copy-receiver-handoff-command"), "TinkerDen page missing copy command hook");
  assertPass(pageSource.includes("data-copy-receiver-handoff-status"), "TinkerDen page missing copy status hook");
  assertPass(pageSource.includes("Command copied."), "TinkerDen page missing copy success status");

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=50`);
  assertPass(before.count > 0, "receiver handoff index has no bundles to copy from");

  const launchOptions = browserLaunchOptions();
  let clickReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-copy-receiver-handoff-command]", { timeout: 10000 });
    const button = page.locator("[data-copy-receiver-handoff-command]").first();
    const command = await button.getAttribute("data-command");
    assertPass(command?.includes("organism-receiver-receipt-post.mjs"), "copy button command does not call post client");
    assertPass(command?.includes("--receipt"), "copy button command missing receipt argument");
    await button.click();
    await page.waitForFunction(() => {
      const status = document.querySelector("[data-copy-receiver-handoff-status]");
      return status?.textContent?.includes("Command copied.");
    }, null, { timeout: 10000 });
    const statusText = await page.locator("[data-copy-receiver-handoff-status]").first().textContent();
    clickReadback = {
      command,
      status_text: statusText?.trim(),
    };
  } finally {
    await browser.close();
  }

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=50`);
  assertPass(after.count === before.count, "copy command changed handoff count");
  assertPass(after.posted_count === before.posted_count, "copy command changed posted count");
  assertPass(after.pending_count === before.pending_count, "copy command changed pending count");
  assertPass(after.invalid_count === before.invalid_count, "copy command changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "copy command changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_COPY_COMMAND_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "RECEIVER_HANDOFF_COPY_COMMAND_UI",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_COPY_COMMAND_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-copy-command-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-copy-command-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_COPY_COMMAND_V0_RECEIPT_20260706.json",
    ],
    validation: {
      page_source_has_copy_command_label: true,
      page_source_has_copy_command_hook: true,
      page_source_has_copy_status_hook: true,
      playwright_clicked_copy_command: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      copied_command_calls_post_client: true,
      copied_command_has_receipt_argument: true,
      click_status_text: clickReadback.status_text,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_before: before.posted_count,
      posted_count_after: after.posted_count,
      pending_count_before: before.pending_count,
      pending_count_after: after.pending_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "The copy command control only copies the return command; it does not create, post, or complete a receiver receipt.",
    },
    click_readback: clickReadback,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no handoff created",
      "no receiver receipt posted",
      "no synthetic completion receipt",
    ],
    next_safe_action: "Use the copied command with a real receiver-edited receipt, then verify the Receiver Handoff Lane changes from pending to posted.",
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
        click_status_text: clickReadback.status_text,
        handoff_count: after.count,
        posted_count: after.posted_count,
        pending_count: after.pending_count,
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
