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
  "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_ALL_SURFACES_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "app/tinkerden/receipts/page.tsx",
  "app/tinkerden/mission-control/page.tsx",
  "app/tinkerden/human-gates/page.tsx",
  "app/tinkerden/inbox/page.tsx",
  "app/tinkerden/relay-proof/page.tsx",
  "components/tinkerden/tinkerden-surface-switcher.tsx",
  "scripts/foreman/tinkerden-posted-handoff-nav-count-all-surfaces-smoke.mjs",
];
const PAGE_FILES = HASH_FILES.filter((file) => file.startsWith("app/tinkerden/"));
const SURFACE_SWITCHER_FILE = "components/tinkerden/tinkerden-surface-switcher.tsx";
const SURFACES = [
  { path: "/tinkerden", label: "Bridge" },
  { path: "/tinkerden/receipts", label: "Receipts" },
  { path: "/tinkerden/mission-control", label: "Mission Control" },
  { path: "/tinkerden/human-gates", label: "Human Gates" },
  { path: "/tinkerden/inbox", label: "Inbox" },
  { path: "/tinkerden/relay-proof", label: "Relay Proof" },
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

async function sourceHasDirectBadge(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return raw.includes("data-receiver-handoff-posted-count-badge");
}

async function sourceHasSharedBadge(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return (
    raw.includes("data-receiver-handoff-posted-count-badge") &&
    raw.includes("readReceiverHandoffIndex") &&
    raw.includes("defaultSurfaceOrder")
  );
}

async function readSurfaceBadge(page, surface) {
  await page.goto(`${BASE_URL}${surface.path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-posted-count-badge]", { timeout: 10000 });
  return page.locator("[data-receiver-handoff-posted-count-badge]").first().evaluate((node) => ({
    path: window.location.pathname,
    posted_count: Number(node.getAttribute("data-posted-count")),
    text: node.textContent?.trim() || "",
  }));
}

async function main() {
  assertPass(await sourceHasSharedBadge(SURFACE_SWITCHER_FILE), `${SURFACE_SWITCHER_FILE} missing shared posted count badge hook`);
  for (const relativePath of PAGE_FILES) {
    assertPass(await sourceUsesSurfaceSwitcher(relativePath), `${relativePath} missing shared TinkerDen surface switcher`);
    assertPass(!(await sourceHasDirectBadge(relativePath)), `${relativePath} still carries direct posted count badge markup`);
  }

  const beforeMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=25`);
  assertPass(posted.posted_count === beforeMixed.posted_count, "posted-only API count does not match mixed index");

  const launchOptions = browserLaunchOptions();
  const readbacks = [];
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    for (const surface of SURFACES) {
      readbacks.push({
        requested_path: surface.path,
        ...surface,
        ...(await readSurfaceBadge(page, surface)),
      });
    }
  } finally {
    await browser.close();
  }

  for (const readback of readbacks) {
    assertPass(readback.path === readback.requested_path, `${readback.label} path mismatch`);
    assertPass(readback.posted_count === posted.posted_count, `${readback.label} badge count mismatch`);
    assertPass(readback.text === `${posted.posted_count} posted`, `${readback.label} badge text mismatch`);
  }

  const afterMixed = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(afterMixed.count === beforeMixed.count, "all-surface badge smoke changed handoff count");
  assertPass(afterMixed.posted_count === beforeMixed.posted_count, "all-surface badge smoke changed posted count");
  assertPass(afterMixed.pending_count === beforeMixed.pending_count, "all-surface badge smoke changed pending count");
  assertPass(afterMixed.returned_unposted_count === beforeMixed.returned_unposted_count, "all-surface badge smoke changed returned-unposted count");
  assertPass(
    afterMixed.template_return_blocked_count === beforeMixed.template_return_blocked_count,
    "all-surface badge smoke changed template-return-blocked count",
  );
  assertPass(afterMixed.invalid_count === beforeMixed.invalid_count, "all-surface badge smoke changed invalid count");
  assertPass(afterMixed.malformed_count === beforeMixed.malformed_count, "all-surface badge smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_ALL_SURFACES_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: posted.latest?.packet_id ?? "NO_POSTED_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_ALL_SURFACES_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-posted-handoff-nav-count-all-surfaces-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "app/tinkerden/receipts/page.tsx",
      "app/tinkerden/mission-control/page.tsx",
      "app/tinkerden/human-gates/page.tsx",
      "app/tinkerden/inbox/page.tsx",
      "app/tinkerden/relay-proof/page.tsx",
      "components/tinkerden/tinkerden-surface-switcher.tsx",
      "scripts/foreman/tinkerden-posted-handoff-nav-count-all-surfaces-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_POSTED_HANDOFF_NAV_COUNT_ALL_SURFACES_V0_RECEIPT_20260706.json",
    ],
    validation: {
      surfaces_checked: SURFACES.map((surface) => surface.path),
      source_pages_use_shared_surface_switcher: true,
      source_pages_have_no_direct_badge_markup: true,
      shared_surface_switcher_has_badge_hook: true,
      playwright_read_all_surface_badges: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      posted_api_count: posted.posted_count,
      mixed_posted_count: beforeMixed.posted_count,
      all_badges_match_posted_api: true,
      badge_readbacks: readbacks,
      handoff_count_before: beforeMixed.count,
      handoff_count_after: afterMixed.count,
      posted_count_before: beforeMixed.posted_count,
      posted_count_after: afterMixed.posted_count,
      pending_count_after: afterMixed.pending_count,
      returned_unposted_count_after: afterMixed.returned_unposted_count,
      template_return_blocked_count_after: afterMixed.template_return_blocked_count,
      invalid_count_after: afterMixed.invalid_count,
      malformed_count_after: afterMixed.malformed_count,
      truth_boundary: "Posted receiver handoff count badges across TinkerDen nav surfaces are read-only, emitted by the shared TinkerDenSurfaceSwitcher, and mirror the posted-only handoff API count.",
    },
    posted_api_result: posted,
    badge_readbacks: readbacks,
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
    next_safe_action: "Factor the repeated TinkerDen posted-count badge into a shared nav component if further surfaces need the same receipt signal.",
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
        posted_api_count: posted.posted_count,
        badge_counts: readbacks.map((item) => ({ path: item.path, posted_count: item.posted_count, text: item.text })),
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
