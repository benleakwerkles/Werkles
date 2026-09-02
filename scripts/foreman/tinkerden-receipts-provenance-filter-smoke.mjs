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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_FILTER_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "app/globals.css",
  "scripts/foreman/tinkerden-receipts-provenance-filter-smoke.mjs",
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
  const receiptsSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  const cssSource = await readFile(path.join(ROOT, "app", "globals.css"), "utf8");

  assertPass(receiptsSource.includes("receiptsProvenanceFilterScript"), "receipts page missing provenance filter script");
  assertPass(receiptsSource.includes("data-receiver-handoff-provenance-filter"), "receipts page missing provenance filter root");
  assertPass(receiptsSource.includes("data-provenance-filter-mode"), "receipts page missing filter mode buttons");
  assertPass(receiptsSource.includes("data-receiver-handoff-provenance-item"), "receipts page missing provenance filter item hook");
  assertPass(receiptsSource.includes("data-receiver-handoff-provenance-visible-count"), "receipts page missing visible count hook");
  assertPass(cssSource.includes(".td-provenance-filter"), "globals css missing provenance filter styles");
}

async function readFilterState(page) {
  return page.evaluate(() => {
    const cardSelector = [
      "[data-receiver-handoff-ready-to-post-card]",
      "[data-receiver-handoff-template-blocked-card]",
      "[data-receiver-handoff-pending-card]",
      "[data-receiver-handoff-posted-card]",
    ].join(", ");
    const anchorSelector = [
      "[data-receiver-handoff-ready-to-post-anchor-link]",
      "[data-receiver-handoff-posted-anchor-link]",
    ].join(", ");
    const cards = Array.from(document.querySelectorAll(cardSelector)).map((card) => ({
      bundle_id: card.getAttribute("data-bundle-id") || "",
      synthetic: card.getAttribute("data-synthetic-proof") === "true",
      hidden: card.hidden,
    }));
    const anchors = Array.from(document.querySelectorAll(anchorSelector)).map((anchor) => ({
      bundle_id: anchor.getAttribute("data-bundle-id") || "",
      synthetic: anchor.getAttribute("data-synthetic-proof") === "true",
      hidden: anchor.hidden,
    }));
    const activeButton = document.querySelector('[data-provenance-filter-mode][aria-pressed="true"]');

    return {
      path: window.location.pathname,
      active_filter: document.querySelector("[data-receiver-handoff-provenance-filter]")?.getAttribute("data-active-filter") || "",
      active_button: activeButton?.getAttribute("data-provenance-filter-mode") || "",
      visible_summary: document.querySelector("[data-receiver-handoff-provenance-visible-count]")?.textContent?.trim() || "",
      total_cards: cards.length,
      visible_cards: cards.filter((card) => !card.hidden).length,
      visible_synthetic_cards: cards.filter((card) => !card.hidden && card.synthetic).length,
      visible_operator_cards: cards.filter((card) => !card.hidden && !card.synthetic).length,
      hidden_synthetic_cards: cards.filter((card) => card.hidden && card.synthetic).length,
      hidden_operator_cards: cards.filter((card) => card.hidden && !card.synthetic).length,
      visible_anchors: anchors.filter((anchor) => !anchor.hidden).length,
      visible_synthetic_anchors: anchors.filter((anchor) => !anchor.hidden && anchor.synthetic).length,
      visible_operator_anchors: anchors.filter((anchor) => !anchor.hidden && !anchor.synthetic).length,
    };
  });
}

async function exerciseFilter(expected) {
  const launchOptions = browserLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  let readback;

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-provenance-filter]", { timeout: 10000 });

    const allInitial = await readFilterState(page);
    await page.locator('[data-provenance-filter-mode="operator"]').click();
    const operator = await readFilterState(page);
    await page.locator('[data-provenance-filter-mode="synthetic"]').click();
    const synthetic = await readFilterState(page);
    await page.locator('[data-provenance-filter-mode="all"]').click();
    const allFinal = await readFilterState(page);

    readback = {
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      all_initial: allInitial,
      operator,
      synthetic,
      all_final: allFinal,
    };
  } finally {
    await browser.close();
  }

  assertPass(readback.all_initial.active_filter === "all", "initial filter was not all");
  assertPass(readback.all_initial.visible_cards === expected.total, "initial all visible card count mismatch");
  assertPass(readback.all_initial.visible_summary === `${expected.total} visible`, "initial all summary mismatch");

  assertPass(readback.operator.active_filter === "operator", "operator filter did not activate");
  assertPass(readback.operator.active_button === "operator", "operator button did not set aria-pressed");
  assertPass(readback.operator.visible_cards === expected.operator, "operator visible card count mismatch");
  assertPass(readback.operator.visible_operator_cards === expected.operator, "operator visible operator card count mismatch");
  assertPass(readback.operator.visible_synthetic_cards === 0, "operator filter left synthetic cards visible");
  assertPass(readback.operator.hidden_synthetic_cards === expected.synthetic, "operator filter did not hide all synthetic cards");
  assertPass(readback.operator.visible_summary === `${expected.operator} visible`, "operator summary mismatch");

  assertPass(readback.synthetic.active_filter === "synthetic", "synthetic filter did not activate");
  assertPass(readback.synthetic.active_button === "synthetic", "synthetic button did not set aria-pressed");
  assertPass(readback.synthetic.visible_cards === expected.synthetic, "synthetic visible card count mismatch");
  assertPass(readback.synthetic.visible_synthetic_cards === expected.synthetic, "synthetic visible synthetic card count mismatch");
  assertPass(readback.synthetic.visible_operator_cards === 0, "synthetic filter left operator cards visible");
  assertPass(readback.synthetic.hidden_operator_cards === expected.operator, "synthetic filter did not hide all operator cards");
  assertPass(readback.synthetic.visible_summary === `${expected.synthetic} visible`, "synthetic summary mismatch");

  assertPass(readback.all_final.active_filter === "all", "final filter did not return to all");
  assertPass(readback.all_final.active_button === "all", "all button did not set aria-pressed");
  assertPass(readback.all_final.visible_cards === expected.total, "final all visible card count mismatch");
  assertPass(readback.all_final.visible_summary === `${expected.total} visible`, "final all summary mismatch");

  return readback;
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  const syntheticRecords = before.records.filter((record) => record.synthetic_proof === true);
  const operatorRecords = before.records.filter((record) => record.synthetic_proof !== true);
  assertPass(syntheticRecords.length > 0, "no synthetic records available for filter smoke");
  assertPass(operatorRecords.length > 0, "no operator records available for filter smoke");

  const browserReadback = await exerciseFilter({
    total: before.count,
    synthetic: syntheticRecords.length,
    operator: operatorRecords.length,
  });

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  assertPass(after.count === before.count, "provenance filter smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "provenance filter smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "provenance filter smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "provenance filter smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "provenance filter smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "provenance filter smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "provenance filter smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_FILTER_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: before.records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_FILTER_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-provenance-filter-smoke.mjs",
    files_changed: [
      "app/tinkerden/receipts/page.tsx",
      "app/globals.css",
      "scripts/foreman/tinkerden-receipts-provenance-filter-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_PROVENANCE_FILTER_V0_RECEIPT_20260706.json",
    ],
    validation: {
      source_has_filter_script: true,
      browser_all_filter_shows_total: true,
      browser_operator_filter_hides_synthetic: true,
      browser_synthetic_filter_hides_operator: true,
      synthetic_record_count: syntheticRecords.length,
      operator_record_count: operatorRecords.length,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary:
        "The provenance filter is read-only browser presentation. It hides or shows already-indexed cards and anchors; it does not mutate handoffs, receipts, or events.",
    },
    browser_readback: browserReadback,
    synthetic_records: syntheticRecords.map((record) => ({
      bundle_id: record.bundle_id,
      state: record.state,
      synthetic_reason: record.synthetic_reason,
    })),
    operator_records: operatorRecords.map((record) => ({
      bundle_id: record.bundle_id,
      state: record.state,
      synthetic_reason: record.synthetic_reason,
    })),
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
      "Carry the same operator/synthetic provenance filter into the Bridge receiver-handoff drawer so the main cockpit can suppress proof scaffolding too.",
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
        operator_visible_cards: browserReadback.operator.visible_cards,
        synthetic_visible_cards: browserReadback.synthetic.visible_cards,
        all_visible_cards: browserReadback.all_final.visible_cards,
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
