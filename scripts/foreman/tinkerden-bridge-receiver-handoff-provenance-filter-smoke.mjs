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
  "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_RECEIVER_HANDOFF_PROVENANCE_FILTER_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/globals.css",
  "scripts/foreman/tinkerden-bridge-receiver-handoff-provenance-filter-smoke.mjs",
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
  const bridgeSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  const cssSource = await readFile(path.join(ROOT, "app", "globals.css"), "utf8");

  assertPass(bridgeSource.includes("receiverHandoffProvenanceCounts"), "Bridge page missing provenance count helper");
  assertPass(bridgeSource.includes("data-receiver-handoff-provenance-filter"), "Bridge page missing provenance filter root");
  assertPass(bridgeSource.includes("data-receiver-handoff-bridge-card"), "Bridge page missing bridge card hook");
  assertPass(bridgeSource.includes("data-receiver-handoff-provenance-badge"), "Bridge page missing provenance badge hook");
  assertPass(bridgeSource.includes("data-provenance-filter-mode"), "Bridge page missing filter mode buttons");
  assertPass(cssSource.includes(".td-provenance-filter--compact"), "globals css missing compact provenance filter style");
}

async function readFilterState(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("[data-receiver-handoff-panel]");
    const root = panel?.querySelector("[data-receiver-handoff-provenance-filter]");
    const cards = Array.from(panel?.querySelectorAll("[data-receiver-handoff-bridge-card]") || []).map((card) => ({
      bundle_id: card.getAttribute("data-bundle-id") || "",
      synthetic: card.getAttribute("data-synthetic-proof") === "true",
      hidden: card.hidden,
      visibleFlag: card.getAttribute("data-provenance-visible") || "",
    }));
    const activeButton = root?.querySelector('[data-provenance-filter-mode][aria-pressed="true"]');

    return {
      path: window.location.pathname,
      active_filter: root?.getAttribute("data-active-filter") || "",
      active_button: activeButton?.getAttribute("data-provenance-filter-mode") || "",
      total_count: Number(root?.getAttribute("data-total-count") || "0"),
      operator_count: Number(root?.getAttribute("data-operator-count") || "0"),
      synthetic_count: Number(root?.getAttribute("data-synthetic-count") || "0"),
      visible_summary: root?.querySelector("[data-receiver-handoff-provenance-visible-count]")?.textContent?.trim() || "",
      total_cards: cards.length,
      visible_cards: cards.filter((card) => !card.hidden).length,
      visible_synthetic_cards: cards.filter((card) => !card.hidden && card.synthetic).length,
      visible_operator_cards: cards.filter((card) => !card.hidden && !card.synthetic).length,
      hidden_synthetic_cards: cards.filter((card) => card.hidden && card.synthetic).length,
      hidden_operator_cards: cards.filter((card) => card.hidden && !card.synthetic).length,
      synthetic_badges: panel?.querySelectorAll("[data-receiver-handoff-provenance-badge]").length || 0,
    };
  });
}

async function exerciseFilter(expected) {
  const launchOptions = browserLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  let readback;

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-panel] [data-receiver-handoff-provenance-filter]", { timeout: 10000 });
    await page.waitForSelector("[data-receiver-handoff-panel] [data-receiver-handoff-bridge-card]", { timeout: 10000 });

    const allInitial = await readFilterState(page);
    await page.locator('[data-receiver-handoff-panel] [data-provenance-filter-mode="operator"]').click();
    const operator = await readFilterState(page);
    await page.locator('[data-receiver-handoff-panel] [data-provenance-filter-mode="synthetic"]').click();
    const synthetic = await readFilterState(page);
    await page.locator('[data-receiver-handoff-panel] [data-provenance-filter-mode="all"]').click();
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

  assertPass(readback.all_initial.active_filter === "all", "initial Bridge filter was not all");
  assertPass(readback.all_initial.total_cards === expected.total, "Bridge total card count mismatch");
  assertPass(readback.all_initial.visible_cards === expected.total, "initial Bridge visible card count mismatch");
  assertPass(readback.all_initial.synthetic_badges === expected.synthetic, "Bridge synthetic badge count mismatch");
  assertPass(readback.all_initial.visible_summary === `${expected.total} visible`, "initial Bridge summary mismatch");

  assertPass(readback.operator.active_filter === "operator", "operator Bridge filter did not activate");
  assertPass(readback.operator.active_button === "operator", "operator Bridge button did not set aria-pressed");
  assertPass(readback.operator.visible_cards === expected.operator, "operator Bridge visible card count mismatch");
  assertPass(readback.operator.visible_operator_cards === expected.operator, "operator Bridge visible operator card count mismatch");
  assertPass(readback.operator.visible_synthetic_cards === 0, "operator Bridge filter left synthetic cards visible");
  assertPass(readback.operator.hidden_synthetic_cards === expected.synthetic, "operator Bridge filter did not hide all synthetic cards");
  assertPass(readback.operator.visible_summary === `${expected.operator} visible`, "operator Bridge summary mismatch");

  assertPass(readback.synthetic.active_filter === "synthetic", "synthetic Bridge filter did not activate");
  assertPass(readback.synthetic.active_button === "synthetic", "synthetic Bridge button did not set aria-pressed");
  assertPass(readback.synthetic.visible_cards === expected.synthetic, "synthetic Bridge visible card count mismatch");
  assertPass(readback.synthetic.visible_synthetic_cards === expected.synthetic, "synthetic Bridge visible synthetic card count mismatch");
  assertPass(readback.synthetic.visible_operator_cards === 0, "synthetic Bridge filter left operator cards visible");
  assertPass(readback.synthetic.hidden_operator_cards === expected.operator, "synthetic Bridge filter did not hide all operator cards");
  assertPass(readback.synthetic.visible_summary === `${expected.synthetic} visible`, "synthetic Bridge summary mismatch");

  assertPass(readback.all_final.active_filter === "all", "final Bridge filter did not return to all");
  assertPass(readback.all_final.active_button === "all", "all Bridge button did not set aria-pressed");
  assertPass(readback.all_final.visible_cards === expected.total, "final Bridge all visible card count mismatch");
  assertPass(readback.all_final.visible_summary === `${expected.total} visible`, "final Bridge all summary mismatch");

  return readback;
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=25`);
  const records = Array.isArray(before.records) ? before.records : [];
  const syntheticRecords = records.filter((record) => record.synthetic_proof === true);
  const operatorRecords = records.filter((record) => record.synthetic_proof !== true);
  assertPass(records.length > 0, "no receiver handoff records available for Bridge filter smoke");
  assertPass(syntheticRecords.length > 0, "no synthetic records available for Bridge filter smoke");
  assertPass(operatorRecords.length > 0, "no operator records available for Bridge filter smoke");

  const browserReadback = await exerciseFilter({
    total: records.length,
    synthetic: syntheticRecords.length,
    operator: operatorRecords.length,
  });

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=25`);
  assertPass(after.count === before.count, "Bridge provenance filter smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "Bridge provenance filter smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "Bridge provenance filter smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "Bridge provenance filter smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "Bridge provenance filter smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "Bridge provenance filter smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "Bridge provenance filter smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_RECEIVER_HANDOFF_PROVENANCE_FILTER_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_RECEIVER_HANDOFF_PROVENANCE_FILTER_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-bridge-receiver-handoff-provenance-filter-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/globals.css",
      "scripts/foreman/tinkerden-bridge-receiver-handoff-provenance-filter-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_RECEIVER_HANDOFF_PROVENANCE_FILTER_V0_RECEIPT_20260706.json",
    ],
    validation: {
      source_has_bridge_filter_script: true,
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
        "The Bridge provenance filter is read-only browser presentation inside the Receiver Handoff Lane drawer. It hides or shows already-indexed drawer rows; it does not mutate handoffs, receipts, or events.",
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
      "Add a query-param deep link so Ben can open Bridge or Receipts directly in operator-only scope when the scaffold proofs are noisy.",
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
          rendered: records.length,
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
