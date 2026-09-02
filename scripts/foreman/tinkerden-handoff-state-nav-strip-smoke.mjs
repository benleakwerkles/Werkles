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
  "BOOK_ARCHITECTURE_TINKERDEN_HANDOFF_STATE_NAV_STRIP_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "app/tinkerden/mission-control/page.tsx",
  "app/tinkerden/human-gates/page.tsx",
  "app/tinkerden/inbox/page.tsx",
  "app/tinkerden/relay-proof/page.tsx",
  "app/thinkit/page.tsx",
  "app/globals.css",
  "components/tinkerden/tinkerden-surface-switcher.tsx",
  "scripts/foreman/tinkerden-posted-handoff-nav-count-all-surfaces-smoke.mjs",
  "scripts/foreman/tinkerden-handoff-state-nav-strip-smoke.mjs",
];
const PAGE_FILES = HASH_FILES.filter((file) => file.startsWith("app/tinkerden/") || file === "app/thinkit/page.tsx");
const SURFACE_SWITCHER_FILE = "components/tinkerden/tinkerden-surface-switcher.tsx";
const SURFACES = [
  { path: "/tinkerden", label: "Bridge" },
  { path: "/tinkerden/receipts", label: "Receipts" },
  { path: "/tinkerden/mission-control", label: "Mission Control" },
  { path: "/tinkerden/human-gates", label: "Human Gates" },
  { path: "/tinkerden/inbox", label: "Inbox" },
  { path: "/tinkerden/relay-proof", label: "Relay Proof" },
  { path: "/thinkit", label: "ThinkIt" },
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

async function sourceUsesSurfaceSwitcher(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return raw.includes("TinkerDenSurfaceSwitcher");
}

async function sourceHasDirectStateStrip(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return raw.includes("data-receiver-handoff-state-strip");
}

async function sharedSwitcherHasStateStrip() {
  const raw = await readFile(path.join(ROOT, SURFACE_SWITCHER_FILE), "utf8");
  return (
    raw.includes("readReceiverHandoffIndex") &&
    raw.includes("data-receiver-handoff-state-strip") &&
    raw.includes("data-receiver-handoff-posted-count-badge") &&
    raw.includes("data-receiver-handoff-pending-count-badge") &&
    raw.includes("data-receiver-handoff-returned-unposted-count-badge") &&
    raw.includes("data-receiver-handoff-template-return-blocked-count-badge") &&
    raw.includes("thinkit")
  );
}

async function cssHasStateStripClasses() {
  const raw = await readFile(path.join(ROOT, "app", "globals.css"), "utf8");
  return (
    raw.includes(".td-surface-switcher__receipt-badges") &&
    raw.includes(".td-surface-switcher__receipt-badge--posted") &&
    raw.includes(".td-surface-switcher__receipt-badge--pending") &&
    raw.includes(".td-surface-switcher__receipt-badge--returned") &&
    raw.includes(".td-surface-switcher__receipt-badge--blocked")
  );
}

async function readSurfaceStateStrip(page, surface) {
  await page.goto(`${BASE_URL}${surface.path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-state-strip]", { timeout: 10000 });
  return page.locator("[data-receiver-handoff-state-strip]").first().evaluate((node) => ({
    path: window.location.pathname,
    posted_count: Number(node.getAttribute("data-posted-count")),
    pending_count: Number(node.getAttribute("data-pending-count")),
    returned_unposted_count: Number(node.getAttribute("data-returned-unposted-count")),
    template_return_blocked_count: Number(node.getAttribute("data-template-return-blocked-count")),
    text: node.textContent?.replace(/\s+/g, " ").trim() || "",
    strip_count: document.querySelectorAll("[data-receiver-handoff-state-strip]").length,
    posted_badge_count: document.querySelectorAll("[data-receiver-handoff-posted-count-badge]").length,
    pending_badge_count: document.querySelectorAll("[data-receiver-handoff-pending-count-badge]").length,
    returned_unposted_badge_count: document.querySelectorAll("[data-receiver-handoff-returned-unposted-count-badge]").length,
    template_return_blocked_badge_count: document.querySelectorAll("[data-receiver-handoff-template-return-blocked-count-badge]").length,
  }));
}

function assertReadbackMatchesIndex(readback, index) {
  assertPass(readback.posted_count === index.posted_count, `${readback.label} posted count mismatch`);
  assertPass(readback.pending_count === index.pending_count, `${readback.label} pending count mismatch`);
  assertPass(
    readback.returned_unposted_count === index.returned_unposted_count,
    `${readback.label} returned-unposted count mismatch`,
  );
  assertPass(
    readback.template_return_blocked_count === index.template_return_blocked_count,
    `${readback.label} template-return-blocked count mismatch`,
  );
  assertPass(readback.text.includes(`${index.posted_count} posted`), `${readback.label} posted text missing`);
  assertPass(readback.text.includes(`${index.pending_count} pending`), `${readback.label} pending text missing`);
  assertPass(readback.text.includes(`${index.returned_unposted_count} ready`), `${readback.label} returned-ready text missing`);
  assertPass(
    readback.text.includes(`${index.template_return_blocked_count} blocked`),
    `${readback.label} blocked text missing`,
  );
  assertPass(readback.strip_count === 1, `${readback.label} state strip count mismatch`);
  assertPass(readback.posted_badge_count === 1, `${readback.label} posted badge count mismatch`);
  assertPass(readback.pending_badge_count === 1, `${readback.label} pending badge count mismatch`);
  assertPass(readback.returned_unposted_badge_count === 1, `${readback.label} returned-unposted badge count mismatch`);
  assertPass(readback.template_return_blocked_badge_count === 1, `${readback.label} blocked badge count mismatch`);
}

async function main() {
  assertPass(await sharedSwitcherHasStateStrip(), `${SURFACE_SWITCHER_FILE} missing shared receiver handoff state strip`);
  assertPass(await cssHasStateStripClasses(), "app/globals.css missing receiver handoff state strip classes");
  for (const relativePath of PAGE_FILES) {
    assertPass(await sourceUsesSurfaceSwitcher(relativePath), `${relativePath} missing shared TinkerDen surface switcher`);
    assertPass(!(await sourceHasDirectStateStrip(relativePath)), `${relativePath} still carries direct state strip markup`);
  }

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const launchOptions = browserLaunchOptions();
  const readbacks = [];
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    for (const surface of SURFACES) {
      readbacks.push({
        requested_path: surface.path,
        ...surface,
        ...(await readSurfaceStateStrip(page, surface)),
      });
    }
  } finally {
    await browser.close();
  }

  for (const readback of readbacks) {
    assertPass(readback.path === readback.requested_path, `${readback.label} path mismatch`);
    assertReadbackMatchesIndex(readback, beforeMixed);
  }

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "handoff state strip smoke changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "handoff state strip smoke changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "handoff state strip smoke changed pending count");
  assertPass(
    afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count,
    "handoff state strip smoke changed returned-unposted count",
  );
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "handoff state strip smoke changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "handoff state strip smoke changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "handoff state strip smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_HANDOFF_STATE_NAV_STRIP_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: beforeMixed.records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_HANDOFF_STATE_NAV_STRIP_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-handoff-state-nav-strip-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/tinkerden/receipts/page.tsx",
      "app/thinkit/page.tsx",
      "app/globals.css",
      "components/tinkerden/tinkerden-surface-switcher.tsx",
      "scripts/foreman/tinkerden-posted-handoff-nav-count-all-surfaces-smoke.mjs",
      "scripts/foreman/tinkerden-handoff-state-nav-strip-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_HANDOFF_STATE_NAV_STRIP_V0_RECEIPT_20260706.json",
    ],
    validation: {
      surfaces_checked: SURFACES.map((surface) => surface.path),
      source_pages_use_shared_surface_switcher: true,
      source_pages_have_no_direct_state_strip_markup: true,
      shared_surface_switcher_has_state_strip: true,
      css_has_state_strip_classes: true,
      playwright_read_all_surface_state_strips: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      all_state_strips_match_receiver_handoff_index: true,
      state_strip_readbacks: readbacks,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary:
        "The shared TinkerDenSurfaceSwitcher renders a read-only receiver-handoff state strip from the canonical receiver handoff index; it does not create handoffs, fill returns, or post receipts.",
    },
    receiver_handoff_index_result: beforeMixed,
    state_strip_readbacks: readbacks,
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
      "Add a receipts-link alert target for returned-unposted work so the shared nav can jump directly to postable returns.",
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
        surfaces_checked: SURFACES.map((surface) => surface.path),
        counts: {
          total: afterMixed.count,
          posted: afterMixed.posted_count,
          pending: afterMixed.pending_count,
          returned_unposted: afterMixed.returned_unposted_count,
          template_return_blocked: afterMixed.template_return_blocked_count,
          invalid: afterMixed.invalid_count,
          malformed: afterMixed.malformed_count,
        },
        state_strip_readbacks: readbacks.map((item) => ({
          path: item.path,
          text: item.text,
          posted_count: item.posted_count,
          pending_count: item.pending_count,
          returned_unposted_count: item.returned_unposted_count,
          template_return_blocked_count: item.template_return_blocked_count,
        })),
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
