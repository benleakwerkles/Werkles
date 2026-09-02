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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROVENANCE_DEEPLINK_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "scripts/foreman/tinkerden-receiver-handoff-provenance-deeplink-smoke.mjs",
];
const BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA || ""}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const SURFACES = [
  {
    label: "Bridge",
    path: "/tinkerden",
    rootSelector: "[data-receiver-handoff-panel] [data-receiver-handoff-provenance-filter]",
    itemSelector: "[data-receiver-handoff-panel] [data-receiver-handoff-bridge-card]",
  },
  {
    label: "Receipts",
    path: "/tinkerden/receipts",
    rootSelector: "[data-receiver-handoff-provenance-filter]",
    itemSelector: [
      "[data-receiver-handoff-ready-to-post-card]",
      "[data-receiver-handoff-template-blocked-card]",
      "[data-receiver-handoff-pending-card]",
      "[data-receiver-handoff-posted-card]",
    ].join(", "),
  },
];

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
  const receiptsSource = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");

  assertPass(bridgeSource.includes("receiverHandoffProvenanceModeFromLocation"), "Bridge page missing provenance URL reader");
  assertPass(bridgeSource.includes("syncReceiverHandoffProvenanceModeToLocation"), "Bridge page missing provenance URL writer");
  assertPass(receiptsSource.includes("modeFromLocation"), "Receipts page missing provenance URL reader");
  assertPass(receiptsSource.includes("syncModeToLocation"), "Receipts page missing provenance URL writer");
  assertPass(bridgeSource.includes("handoff_provenance"), "Bridge page missing handoff_provenance param");
  assertPass(receiptsSource.includes("handoff_provenance"), "Receipts page missing handoff_provenance param");
}

async function readSurfaceState(page, surface) {
  return page.evaluate(({ rootSelector, itemSelector }) => {
    const root = document.querySelector(rootSelector);
    const items = Array.from(document.querySelectorAll(itemSelector)).map((item) => ({
      bundle_id: item.getAttribute("data-bundle-id") || "",
      synthetic: item.getAttribute("data-synthetic-proof") === "true",
      hidden: item.hidden,
    }));
    const activeButton = root?.querySelector('[data-provenance-filter-mode][aria-pressed="true"]');
    const params = new URLSearchParams(window.location.search);

    return {
      path: window.location.pathname,
      search: window.location.search,
      param: params.get("handoff_provenance") || "",
      active_filter: root?.getAttribute("data-active-filter") || "",
      active_button: activeButton?.getAttribute("data-provenance-filter-mode") || "",
      visible_summary: root?.querySelector("[data-receiver-handoff-provenance-visible-count]")?.textContent?.trim() || "",
      total_cards: items.length,
      visible_cards: items.filter((item) => !item.hidden).length,
      visible_synthetic_cards: items.filter((item) => !item.hidden && item.synthetic).length,
      visible_operator_cards: items.filter((item) => !item.hidden && !item.synthetic).length,
      hidden_synthetic_cards: items.filter((item) => item.hidden && item.synthetic).length,
      hidden_operator_cards: items.filter((item) => item.hidden && !item.synthetic).length,
    };
  }, surface);
}

async function exerciseSurface(page, surface, expected) {
  await page.goto(`${BASE_URL}${surface.path}?handoff_provenance=operator`, { waitUntil: "networkidle" });
  await page.waitForSelector(surface.rootSelector, { timeout: 10000 });
  await page.waitForSelector(surface.itemSelector, { state: "attached", timeout: 10000 });

  const operatorInitial = await readSurfaceState(page, surface);
  assertPass(operatorInitial.path === surface.path, `${surface.label} path mismatch`);
  assertPass(operatorInitial.param === "operator", `${surface.label} operator deep link missing param`);
  assertPass(operatorInitial.active_filter === "operator", `${surface.label} operator deep link did not activate`);
  assertPass(operatorInitial.active_button === "operator", `${surface.label} operator button did not press`);
  assertPass(operatorInitial.visible_cards === expected.operator, `${surface.label} operator visible count mismatch`);
  assertPass(operatorInitial.visible_synthetic_cards === 0, `${surface.label} operator left synthetic visible`);
  assertPass(operatorInitial.hidden_synthetic_cards === expected.synthetic, `${surface.label} operator did not hide synthetic`);

  await page.locator(`${surface.rootSelector} [data-provenance-filter-mode="synthetic"]`).click();
  const syntheticClicked = await readSurfaceState(page, surface);
  assertPass(syntheticClicked.param === "synthetic", `${surface.label} synthetic click did not update URL`);
  assertPass(syntheticClicked.active_filter === "synthetic", `${surface.label} synthetic click did not activate`);
  assertPass(syntheticClicked.visible_cards === expected.synthetic, `${surface.label} synthetic visible count mismatch`);
  assertPass(syntheticClicked.visible_operator_cards === 0, `${surface.label} synthetic left operator visible`);

  await page.locator(`${surface.rootSelector} [data-provenance-filter-mode="all"]`).click();
  const allClicked = await readSurfaceState(page, surface);
  assertPass(allClicked.param === "", `${surface.label} all click did not clear URL param`);
  assertPass(allClicked.active_filter === "all", `${surface.label} all click did not activate`);
  assertPass(allClicked.visible_cards === expected.total, `${surface.label} all visible count mismatch`);
  assertPass(allClicked.visible_summary === `${expected.total} visible`, `${surface.label} all summary mismatch`);

  return {
    surface: surface.label,
    operator_initial: operatorInitial,
    synthetic_clicked: syntheticClicked,
    all_clicked: allClicked,
  };
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=25`);
  const records = Array.isArray(before.records) ? before.records : [];
  const syntheticRecords = records.filter((record) => record.synthetic_proof === true);
  const operatorRecords = records.filter((record) => record.synthetic_proof !== true);
  assertPass(records.length > 0, "no receiver handoff records available for provenance deeplink smoke");
  assertPass(syntheticRecords.length > 0, "no synthetic records available for provenance deeplink smoke");
  assertPass(operatorRecords.length > 0, "no operator records available for provenance deeplink smoke");

  const launchOptions = browserLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  const readbacks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    for (const surface of SURFACES) {
      readbacks.push(
        await exerciseSurface(page, surface, {
          total: records.length,
          synthetic: syntheticRecords.length,
          operator: operatorRecords.length,
        }),
      );
    }
  } finally {
    await browser.close();
  }

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=25`);
  assertPass(after.count === before.count, "provenance deeplink smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "provenance deeplink smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "provenance deeplink smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "provenance deeplink smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "provenance deeplink smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "provenance deeplink smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "provenance deeplink smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROVENANCE_DEEPLINK_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROVENANCE_DEEPLINK_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-provenance-deeplink-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/tinkerden/receipts/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-provenance-deeplink-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROVENANCE_DEEPLINK_V0_RECEIPT_20260706.json",
    ],
    validation: {
      bridge_operator_deeplink_hides_synthetic: true,
      receipts_operator_deeplink_hides_synthetic: true,
      bridge_filter_click_updates_url: true,
      receipts_filter_click_updates_url: true,
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
        "The provenance deep link is read-only browser presentation. It sets initial filter scope from the URL and updates the URL when clicked; it does not mutate handoffs, receipts, or events.",
    },
    browser_readback: {
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      surfaces: readbacks,
    },
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
      "Use the operator-only deep link in Mack-facing review packets so synthetic smoke scaffolding is still inspectable but not the default reading burden.",
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
        surfaces_checked: readbacks.map((readback) => readback.surface),
        synthetic_record_count: syntheticRecords.length,
        operator_record_count: operatorRecords.length,
        bridge_operator_visible_cards: readbacks.find((readback) => readback.surface === "Bridge")?.operator_initial.visible_cards,
        receipts_operator_visible_cards: readbacks.find((readback) => readback.surface === "Receipts")?.operator_initial.visible_cards,
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
