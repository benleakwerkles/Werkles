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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_CONTROLS_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "app/globals.css",
  "components/tinkerden/receiver-handoff-ready-actions.tsx",
  "scripts/foreman/tinkerden-receipts-ready-post-controls-smoke.mjs",
];
const MISSING_BUNDLE_ID = "receipts_ready_post_controls_missing_bundle_probe";
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

async function postJsonExpectFailure(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({ ok: false, error: "NON_JSON_RESPONSE" }));
  assertPass(response.status >= 400, `expected failure status from ${url}, got ${response.status}`);
  assertPass(result.ok !== true, `expected failed result from ${url}`);
  return { status: response.status, result };
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
  const component = await readFile(path.join(ROOT, "components", "tinkerden", "receiver-handoff-ready-actions.tsx"), "utf8");
  const receipts = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  const css = await readFile(path.join(ROOT, "app", "globals.css"), "utf8");

  assertPass(component.includes("data-post-receiver-handoff-ready-return"), "ready actions missing post button hook");
  assertPass(component.includes("data-copy-receiver-handoff-ready-command"), "ready actions missing copy command hook");
  assertPass(component.includes("data-receiver-handoff-ready-action-status"), "ready actions missing status hook");
  assertPass(receipts.includes("ReceiverHandoffReadyActions"), "receipts page missing ready action component");
  assertPass(receipts.includes("receiptsReadyActionsScript"), "receipts page missing delegated ready action script");
  assertPass(receipts.includes("/api/organism/contracts/receiver-handoffs/post-return"), "receipts ready action script missing post-return API call");
  assertPass(receipts.includes("TinkerDenReceiptsReadyDrawer@Browser"), "receipts ready action script missing detected_by marker");
  assertPass(css.includes(".td-receiver-handoff-actions"), "globals css missing ready action styles");
}

async function readControlState() {
  const launchOptions = browserLaunchOptions();
  let readback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts#receiver-handoff-ready-to-post`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-receiver-handoff-ready-action-panel]", { timeout: 10000 });
    readback = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll("[data-receiver-handoff-ready-action-panel]"));
      return {
        path_hash: `${window.location.pathname}${window.location.hash}`,
        ready_drawer_count: Number(
          document.querySelector("[data-receiver-handoff-ready-to-post-drawer]")?.getAttribute("data-returned-unposted-count") || 0,
        ),
        action_panel_count: panels.length,
        copy_button_count: document.querySelectorAll("[data-copy-receiver-handoff-ready-command]").length,
        post_button_count: document.querySelectorAll("[data-post-receiver-handoff-ready-return]").length,
        statuses: panels.map((panel) => panel.querySelector("[data-receiver-handoff-ready-action-status]")?.textContent || ""),
        controls: panels.map((panel) => {
          const copy = panel.querySelector("[data-copy-receiver-handoff-ready-command]");
          const post = panel.querySelector("[data-post-receiver-handoff-ready-return]");
          return {
            bundle_id: panel.getAttribute("data-bundle-id"),
            copy_command: copy?.getAttribute("data-command") || "",
            post_bundle_id: post?.getAttribute("data-bundle-id") || "",
            post_text: post?.textContent?.trim() || "",
            post_disabled: post?.hasAttribute("disabled") || false,
          };
        }),
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

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const readyRecords = before.records.filter((record) => record.state === "returned_unposted");
  assertPass(readyRecords.length === before.returned_unposted_count, "ready record count mismatch before smoke");

  const controlReadback = await readControlState();
  assertPass(controlReadback.path_hash === "/tinkerden/receipts#receiver-handoff-ready-to-post", "ready control path/hash mismatch");
  assertPass(controlReadback.ready_drawer_count === before.returned_unposted_count, "ready drawer count mismatch");
  assertPass(controlReadback.action_panel_count === before.returned_unposted_count, "ready action panel count mismatch");
  assertPass(controlReadback.copy_button_count === before.returned_unposted_count, "copy button count mismatch");
  assertPass(controlReadback.post_button_count === before.returned_unposted_count, "post button count mismatch");

  for (const control of controlReadback.controls) {
    assertPass(control.bundle_id, "control missing bundle id");
    assertPass(control.bundle_id === control.post_bundle_id, `${control.bundle_id} post bundle id mismatch`);
    assertPass(control.copy_command.includes("organism-receiver-receipt-post.mjs"), `${control.bundle_id} copy command missing post client`);
    assertPass(control.copy_command.includes(control.bundle_id), `${control.bundle_id} copy command missing bundle id`);
    assertPass(control.post_text === "POST RETURNED RECEIPT", `${control.bundle_id} post button text mismatch`);
    assertPass(control.post_disabled === false, `${control.bundle_id} post button should be enabled`);
  }

  const invalidPost = await postJsonExpectFailure(`${BASE_URL}/api/organism/contracts/receiver-handoffs/post-return`, {
    bundle_id: MISSING_BUNDLE_ID,
    detected_by: "TinkerDenReceiptsReadyPostControlsSmoke@Betsy",
  });

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(after.count === before.count, "ready post controls smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "ready post controls smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "ready post controls smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "ready post controls smoke changed returned-unposted count");
  assertPass(
    after.template_return_blocked_count === before.template_return_blocked_count,
    "ready post controls smoke changed template-return-blocked count",
  );
  assertPass(after.invalid_count === before.invalid_count, "ready post controls smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "ready post controls smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_CONTROLS_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: readyRecords[0]?.packet_id ?? "NO_READY_HANDOFF_PACKET",
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_CONTROLS_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-ready-post-controls-smoke.mjs",
    files_changed: [
      "app/tinkerden/receipts/page.tsx",
      "app/globals.css",
      "components/tinkerden/receiver-handoff-ready-actions.tsx",
      "scripts/foreman/tinkerden-receipts-ready-post-controls-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_CONTROLS_V0_RECEIPT_20260706.json",
    ],
    validation: {
      source_has_ready_action_component: true,
      browser_ready_action_panels_match_returned_unposted_count: true,
      browser_copy_buttons_match_returned_unposted_count: true,
      browser_post_buttons_match_returned_unposted_count: true,
      post_buttons_are_enabled_for_ready_cards: true,
      invalid_bundle_post_is_blocked: true,
      invalid_bundle_post_status: invalidPost.status,
      invalid_bundle_post_error: invalidPost.result.error,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary:
        "Ready-post controls are live operator controls, but this smoke does not click a real returned-unposted receipt. It only verifies the controls and a missing-bundle blocker path.",
    },
    ready_records: readyRecords.map((record) => ({
      bundle_id: record.bundle_id,
      packet_id: record.packet_id,
      returned_receipt_id: record.returned_receipt_id,
      returned_receipt_path: record.returned_receipt_path,
      contract_receipt_path: record.contract_receipt_path,
    })),
    control_readback: controlReadback,
    invalid_post_result: invalidPost,
    receiver_handoff_index_before: before,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no handoff created",
      "no returned receipt filled",
      "no real returned-unposted receipt posted",
    ],
    next_safe_action:
      "When Ben chooses, click POST RETURNED RECEIPT on one ready card and verify the ready count decreases while posted count increases.",
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
        ready_count: after.returned_unposted_count,
        action_panel_count: controlReadback.action_panel_count,
        post_button_count: controlReadback.post_button_count,
        invalid_bundle_post_status: invalidPost.status,
        invalid_bundle_post_error: invalidPost.result.error,
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
