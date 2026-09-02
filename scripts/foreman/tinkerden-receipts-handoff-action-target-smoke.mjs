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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_HANDOFF_ACTION_TARGET_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "components/tinkerden/tinkerden-surface-switcher.tsx",
  "scripts/foreman/tinkerden-receipts-handoff-action-target-smoke.mjs",
];
const SURFACES = [
  "/tinkerden",
  "/tinkerden/receipts",
  "/tinkerden/mission-control",
  "/tinkerden/human-gates",
  "/tinkerden/inbox",
  "/tinkerden/relay-proof",
  "/thinkit",
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

function expectedTarget(index) {
  if (index.returned_unposted_count > 0) {
    return { state: "returned_unposted", href: "/tinkerden/receipts#receiver-handoff-ready-to-post" };
  }
  if (index.template_return_blocked_count > 0) {
    return { state: "template_return_blocked", href: "/tinkerden/receipts#receiver-handoff-template-blocked" };
  }
  if (index.pending_count > 0) {
    return { state: "pending_receiver", href: "/tinkerden/receipts#receiver-handoff-pending" };
  }
  if (index.posted_count > 0) {
    return { state: "posted", href: "/tinkerden/receipts#receiver-handoff-posted" };
  }
  return { state: "empty", href: "/tinkerden/receipts" };
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
  const switcher = await readFile(path.join(ROOT, "components", "tinkerden", "tinkerden-surface-switcher.tsx"), "utf8");
  const receipts = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");

  assertPass(switcher.includes("receiverHandoffReceiptsHref"), "surface switcher missing target href helper");
  assertPass(switcher.includes("data-receiver-handoff-target-state"), "surface switcher missing target-state data hook");
  assertPass(switcher.includes("#receiver-handoff-ready-to-post"), "surface switcher missing ready-to-post target");
  assertPass(receipts.includes('id="receiver-handoff-ready-to-post"'), "receipts page missing ready-to-post section id");
  assertPass(receipts.includes("data-receiver-handoff-ready-to-post-drawer"), "receipts page missing ready-to-post drawer hook");
  assertPass(receipts.includes("data-receiver-handoff-template-blocked-list"), "receipts page missing template-blocked list hook");
  assertPass(receipts.includes("data-receiver-handoff-pending-list"), "receipts page missing pending list hook");
  assertPass(receipts.includes("readReceiverHandoffIndex(250)"), "receipts page missing full receiver handoff index read");
}

async function readTargetLink(page, surfacePath) {
  await page.goto(`${BASE_URL}${surfacePath}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-target-state]", { timeout: 10000 });
  return page.locator("[data-receiver-handoff-target-state]").first().evaluate((node) => {
    const link = node;
    const url = new URL(link.href);
    return {
      surface_path: window.location.pathname,
      target_state: link.getAttribute("data-receiver-handoff-target-state"),
      target_href: link.getAttribute("data-receiver-handoff-target-href"),
      actual_href: `${url.pathname}${url.hash}`,
      text: link.textContent?.replace(/\s+/g, " ").trim() || "",
    };
  });
}

async function readReceiptsDrawers(page) {
  await page.goto(`${BASE_URL}/tinkerden/receipts`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-ready-to-post-drawer]", { timeout: 10000 });
  return page.evaluate(() => ({
    path: window.location.pathname,
    ready_section_exists: Boolean(document.getElementById("receiver-handoff-ready-to-post")),
    template_blocked_section_exists: Boolean(document.getElementById("receiver-handoff-template-blocked")),
    pending_section_exists: Boolean(document.getElementById("receiver-handoff-pending")),
    posted_section_exists: Boolean(document.getElementById("receiver-handoff-posted")),
    ready_drawer_count: Number(
      document.querySelector("[data-receiver-handoff-ready-to-post-drawer]")?.getAttribute("data-returned-unposted-count") || 0,
    ),
    ready_card_count: document.querySelectorAll("[data-receiver-handoff-ready-to-post-card]").length,
    ready_anchor_count: document.querySelectorAll("[data-receiver-handoff-ready-to-post-anchor-link]").length,
    template_blocked_list_count: Number(
      document.querySelector("[data-receiver-handoff-template-blocked-list]")?.getAttribute("data-template-return-blocked-count") || 0,
    ),
    template_blocked_card_count: document.querySelectorAll("[data-receiver-handoff-template-blocked-card]").length,
    pending_list_count: Number(document.querySelector("[data-receiver-handoff-pending-list]")?.getAttribute("data-pending-count") || 0),
    pending_card_count: document.querySelectorAll("[data-receiver-handoff-pending-card]").length,
  }));
}

async function clickTargetFrom(page, sourcePath, expectedHref) {
  await page.goto(`${BASE_URL}${sourcePath}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-receiver-handoff-target-state]", { timeout: 10000 });
  await page.locator("[data-receiver-handoff-target-state]").first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    (expected) => `${window.location.pathname}${window.location.hash}` === expected,
    expectedHref,
    { timeout: 10000 },
  );
  const targetId = expectedHref.split("#")[1] || "";
  if (targetId) {
    await page.waitForSelector(`#${targetId}`, { timeout: 10000 });
  }
  return page.evaluate(() => ({
    path_hash: `${window.location.pathname}${window.location.hash}`,
    target_visible: Boolean(window.location.hash && document.querySelector(window.location.hash)),
  }));
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const expected = expectedTarget(before);
  const launchOptions = browserLaunchOptions();
  const targetReadbacks = [];
  let drawerReadback;
  let clickReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    for (const surfacePath of SURFACES) {
      targetReadbacks.push(await readTargetLink(page, surfacePath));
    }
    drawerReadback = await readReceiptsDrawers(page);
    clickReadback = await clickTargetFrom(page, "/tinkerden", expected.href);
  } finally {
    await browser.close();
  }

  for (const readback of targetReadbacks) {
    assertPass(readback.target_state === expected.state, `${readback.surface_path} target state mismatch`);
    assertPass(readback.target_href === expected.href, `${readback.surface_path} target href data mismatch`);
    assertPass(readback.actual_href === expected.href, `${readback.surface_path} actual href mismatch`);
  }

  assertPass(drawerReadback.ready_section_exists, "ready-to-post section missing in browser");
  assertPass(drawerReadback.template_blocked_section_exists, "template-blocked section missing in browser");
  assertPass(drawerReadback.pending_section_exists, "pending section missing in browser");
  assertPass(drawerReadback.posted_section_exists, "posted section missing in browser");
  assertPass(drawerReadback.ready_drawer_count === before.returned_unposted_count, "ready drawer count mismatch");
  assertPass(drawerReadback.ready_card_count === before.returned_unposted_count, "ready card count mismatch");
  assertPass(drawerReadback.ready_anchor_count === before.returned_unposted_count, "ready anchor count mismatch");
  assertPass(drawerReadback.template_blocked_list_count === before.template_return_blocked_count, "template blocked list count mismatch");
  assertPass(drawerReadback.template_blocked_card_count === before.template_return_blocked_count, "template blocked card count mismatch");
  assertPass(drawerReadback.pending_list_count === before.pending_count, "pending list count mismatch");
  assertPass(drawerReadback.pending_card_count === before.pending_count, "pending card count mismatch");
  assertPass(clickReadback.path_hash === expected.href, "click target path/hash mismatch");
  assertPass(clickReadback.target_visible, "click target did not land on visible target section");

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(after.count === before.count, "action target smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "action target smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "action target smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "action target smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "action target smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "action target smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "action target smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_HANDOFF_ACTION_TARGET_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: before.records[0]?.packet_id ?? "NO_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_HANDOFF_ACTION_TARGET_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-handoff-action-target-smoke.mjs",
    files_changed: [
      "app/tinkerden/receipts/page.tsx",
      "components/tinkerden/tinkerden-surface-switcher.tsx",
      "scripts/foreman/tinkerden-receipts-handoff-action-target-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_HANDOFF_ACTION_TARGET_V0_RECEIPT_20260706.json",
    ],
    validation: {
      surfaces_checked: SURFACES,
      expected_target_state: expected.state,
      expected_target_href: expected.href,
      target_links_match_expected_action_state: true,
      browser_click_from_bridge_lands_on_expected_target: true,
      receipts_page_has_ready_to_post_drawer: true,
      receipts_page_has_template_blocked_section: true,
      receipts_page_has_pending_section: true,
      ready_card_count: drawerReadback.ready_card_count,
      template_blocked_card_count: drawerReadback.template_blocked_card_count,
      pending_card_count: drawerReadback.pending_card_count,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary:
        "Receipts nav targeting and drawers are read-only. They expose returned-unposted, blocked-template, pending, and posted receiver handoff states without posting or mutating receipts.",
    },
    receiver_handoff_index_result: before,
    target_readbacks: targetReadbacks,
    receipts_drawer_readback: drawerReadback,
    click_readback: clickReadback,
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
      "Add a guarded Receipts-page POST RETURN action for returned-unposted cards, reusing the existing post-return API and blocker checks.",
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
        expected_target_state: expected.state,
        expected_target_href: expected.href,
        counts: {
          total: after.count,
          posted: after.posted_count,
          pending: after.pending_count,
          returned_unposted: after.returned_unposted_count,
          template_return_blocked: after.template_return_blocked_count,
          invalid: after.invalid_count,
          malformed: after.malformed_count,
        },
        click_readback: clickReadback,
        receipts_drawer_readback: drawerReadback,
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
