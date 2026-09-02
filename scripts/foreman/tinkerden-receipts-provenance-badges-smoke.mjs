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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_BADGES_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "lib/organism/contracts/receiver-handoff-index.ts",
  "app/tinkerden/receipts/page.tsx",
  "app/globals.css",
  "scripts/foreman/tinkerden-receipts-provenance-badges-smoke.mjs",
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

async function sourceChecks() {
  const indexSource = await readFile(path.join(ROOT, "lib", "organism", "contracts", "receiver-handoff-index.ts"), "utf8");
  const receiptsSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  const cssSource = await readFile(path.join(ROOT, "app", "globals.css"), "utf8");

  assertPass(indexSource.includes("synthetic_proof"), "receiver handoff index missing synthetic_proof field");
  assertPass(indexSource.includes("syntheticReason"), "receiver handoff index missing synthetic reason helper");
  assertPass(indexSource.includes("receipt_text_marks_smoke_or_fixture"), "receiver handoff index missing receipt text marker reason");
  assertPass(receiptsSource.includes("ReceiverHandoffProvenance"), "receipts page missing provenance badge helper");
  assertPass(receiptsSource.includes("data-receiver-handoff-provenance-badge"), "receipts page missing provenance badge hook");
  assertPass(receiptsSource.includes("data-synthetic-proof"), "receipts page missing synthetic proof data hook");
  assertPass(cssSource.includes(".td-receipt-pickup__provenance"), "globals css missing provenance badge styles");
}

async function readBrowserProvenance() {
  const launchOptions = browserLaunchOptions();
  let readback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-posted-card], [data-receiver-handoff-pending-card]", { timeout: 10000 });
    readback = await page.evaluate(() => {
      const cardSelector = [
        "[data-receiver-handoff-ready-to-post-card]",
        "[data-receiver-handoff-template-blocked-card]",
        "[data-receiver-handoff-pending-card]",
        "[data-receiver-handoff-posted-card]",
      ].join(", ");
      const cards = Array.from(document.querySelectorAll(cardSelector)).map((card) => {
        const badge = card.querySelector("[data-receiver-handoff-provenance-badge]");
        return {
          bundle_id: card.getAttribute("data-bundle-id") || "",
          synthetic_proof: card.getAttribute("data-synthetic-proof") === "true",
          synthetic_reason: card.getAttribute("data-synthetic-reason") || "",
          badge_present: Boolean(badge),
          badge_text: badge?.textContent?.replace(/\s+/g, " ").trim() || "",
          badge_reason: badge?.getAttribute("data-synthetic-reason") || "",
        };
      });

      return {
        path: window.location.pathname,
        total_cards: cards.length,
        synthetic_cards: cards.filter((card) => card.synthetic_proof).length,
        provenance_badges: document.querySelectorAll("[data-receiver-handoff-provenance-badge]").length,
        cards,
      };
    });
    readback.playwright_browser_executable = launchOptions.executablePath || "bundled-playwright-browser";
  } finally {
    await browser.close();
  }

  return readback;
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  const expectedByBundle = new Map(before.records.map((record) => [record.bundle_id, record]));
  const syntheticRecords = before.records.filter((record) => record.synthetic_proof === true);
  const operatorRecords = before.records.filter((record) => record.synthetic_proof !== true);
  assertPass(syntheticRecords.length > 0, "no synthetic proof records found to badge");
  assertPass(operatorRecords.length > 0, "no operator records found to distinguish from synthetic proof");
  for (const record of before.records) {
    assertPass(typeof record.synthetic_proof === "boolean", `${record.bundle_id} missing boolean synthetic_proof`);
    assertPass(typeof record.synthetic_reason === "string" && record.synthetic_reason, `${record.bundle_id} missing synthetic_reason`);
  }

  const browserReadback = await readBrowserProvenance();
  assertPass(browserReadback.total_cards === before.count, `browser card count ${browserReadback.total_cards} did not match index ${before.count}`);
  assertPass(browserReadback.synthetic_cards === syntheticRecords.length, "browser synthetic card count mismatch");
  assertPass(browserReadback.provenance_badges === syntheticRecords.length, "browser provenance badge count mismatch");

  for (const card of browserReadback.cards) {
    const expected = expectedByBundle.get(card.bundle_id);
    assertPass(expected, `browser card not found in API index: ${card.bundle_id}`);
    assertPass(card.synthetic_proof === expected.synthetic_proof, `${card.bundle_id} synthetic_proof mismatch`);
    assertPass(card.synthetic_reason === expected.synthetic_reason, `${card.bundle_id} synthetic_reason mismatch`);
    if (expected.synthetic_proof) {
      assertPass(card.badge_present, `${card.bundle_id} missing synthetic proof badge`);
      assertPass(card.badge_text === "SYNTHETIC PROOF", `${card.bundle_id} synthetic badge text mismatch`);
      assertPass(card.badge_reason === expected.synthetic_reason, `${card.bundle_id} synthetic badge reason mismatch`);
    } else {
      assertPass(!card.badge_present, `${card.bundle_id} should not show synthetic proof badge`);
    }
  }

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  assertPass(after.count === before.count, "provenance badge smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "provenance badge smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "provenance badge smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "provenance badge smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "provenance badge smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "provenance badge smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "provenance badge smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_BADGES_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: before.records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_BADGES_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-provenance-badges-smoke.mjs",
    files_changed: [
      "lib/organism/contracts/receiver-handoff-index.ts",
      "app/tinkerden/receipts/page.tsx",
      "app/globals.css",
      "scripts/foreman/tinkerden-receipts-provenance-badges-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_BADGES_V0_RECEIPT_20260706.json",
    ],
    validation: {
      api_records_have_synthetic_fields: true,
      browser_cards_match_api_synthetic_flags: true,
      browser_badges_match_api_synthetic_count: true,
      synthetic_record_count: syntheticRecords.length,
      operator_record_count: operatorRecords.length,
      browser_total_cards: browserReadback.total_cards,
      browser_synthetic_cards: browserReadback.synthetic_cards,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary:
        "Synthetic proof badges are read-only provenance labels. They mark smoke, fixture, and synthetic proof bundles so they do not visually masquerade as operator or separate-Aeye work.",
    },
    synthetic_records: syntheticRecords.map((record) => ({
      bundle_id: record.bundle_id,
      state: record.state,
      receiver: record.receiver,
      returned_receiver: record.returned_receiver,
      synthetic_reason: record.synthetic_reason,
    })),
    operator_records: operatorRecords.map((record) => ({
      bundle_id: record.bundle_id,
      state: record.state,
      receiver: record.receiver,
      returned_receiver: record.returned_receiver,
      synthetic_reason: record.synthetic_reason,
    })),
    browser_readback: browserReadback,
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
    next_safe_action:
      "Add a filter control on Receipts to hide synthetic proof bundles when Ben wants to review only operator or separate-Aeye work.",
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
        synthetic_record_count: syntheticRecords.length,
        operator_record_count: operatorRecords.length,
        browser_synthetic_badges: browserReadback.provenance_badges,
        counts: {
          total: after.count,
          posted: after.posted_count,
          pending: after.pending_count,
          returned_unposted: after.returned_unposted_count,
          template_return_blocked: after.template_return_blocked_count,
          invalid: after.invalid_count,
          malformed: after.malformed_count,
        },
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
