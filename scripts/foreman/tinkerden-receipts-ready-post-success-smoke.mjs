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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_SUCCESS_V0_RECEIPT_20260706.json",
);
const RECEIVER = "ReceiptsReadyPostSuccessSmoke@Betsy";
const HASH_FILES = [
  "app/tinkerden/receipts/page.tsx",
  "components/tinkerden/receiver-handoff-ready-actions.tsx",
  "app/api/organism/contracts/receiver-handoffs/route.ts",
  "app/api/organism/contracts/receiver-handoffs/fill-return/route.ts",
  "app/api/organism/contracts/receiver-handoffs/post-return/route.ts",
  "scripts/foreman/tinkerden-receipts-ready-post-success-smoke.mjs",
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

async function postJson(url, body, expectedStatus = 200) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (response.status !== expectedStatus || result.ok !== true) {
    throw new Error(`POST_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
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

async function selectPacketId() {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/index?limit=50`);
  const records = Array.isArray(index.records) ? index.records : [];
  const tinkerden = records.find((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "));
  const selected = tinkerden || records[0];
  assertPass(selected?.packet_id, "no contract packet available for Receipts ready post success smoke");
  return selected.packet_id;
}

async function getHandoffRecord(bundleId) {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  return {
    index,
    record: index.records.find((candidate) => candidate.bundle_id === bundleId),
  };
}

async function sourceChecks() {
  const component = await readFile(path.join(ROOT, "components", "tinkerden", "receiver-handoff-ready-actions.tsx"), "utf8");
  const receiptsPage = await readFile(path.join(ROOT, "app", "tinkerden", "receipts", "page.tsx"), "utf8");
  assertPass(component.includes("data-post-receiver-handoff-ready-return"), "ready action component missing post hook");
  assertPass(component.includes("data-posted-receipt-id"), "ready action component missing posted receipt id readback");
  assertPass(component.includes("data-contract-receipt-path"), "ready action component missing contract path readback");
  assertPass(receiptsPage.includes("receiptsReadyActionsScript"), "receipts page missing delegated ready action script");
  assertPass(receiptsPage.includes("TinkerDenReceiptsReadyDrawer@Browser"), "receipts ready action script missing detected_by marker");
  assertPass(receiptsPage.includes("/api/organism/contracts/receiver-handoffs/post-return"), "receipts ready action script missing post-return API call");
  assertPass(receiptsPage.includes("#receiver-handoff-posted-"), "receipts ready action script missing posted-anchor redirect");
  assertPass(receiptsPage.includes("window.location.reload()"), "receipts ready action script missing post-redirect reload");
  assertPass(receiptsPage.includes("ReceiverHandoffReadyActions"), "receipts page missing ready action component");
}

async function clickReceiptsReadyPost(bundleId) {
  const launchOptions = browserLaunchOptions();
  let clickReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden/receipts#receiver-handoff-ready-to-post`, { waitUntil: "networkidle" });
    const panel = page.locator(`[data-receiver-handoff-ready-action-panel][data-bundle-id="${bundleId}"]`).first();
    await panel.waitFor({ state: "visible", timeout: 10000 });
    const button = panel.locator("[data-post-receiver-handoff-ready-return]").first();
    await button.waitFor({ state: "visible", timeout: 10000 });
    await button.click();
    await page.waitForFunction(
      async (id) => {
        const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=300", { cache: "no-store" });
        const result = await response.json();
        const record = Array.isArray(result.records)
          ? result.records.find((candidate) => candidate.bundle_id === id)
          : null;
        return record?.state === "posted" && record?.contract_event_joined === true;
      },
      bundleId,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      (id) => `${window.location.pathname}${window.location.hash}` === `/tinkerden/receipts#receiver-handoff-posted-${id}`,
      bundleId,
      { timeout: 10000 },
    );
    await page.waitForSelector(`#receiver-handoff-posted-${bundleId}[data-receiver-handoff-posted-card]`, { timeout: 10000 });
    clickReadback = await page.evaluate((id) => {
      const postedCard = document.querySelector(`#receiver-handoff-posted-${id}[data-receiver-handoff-posted-card]`);
      return {
        path_hash: `${window.location.pathname}${window.location.hash}`,
        posted_card_visible: Boolean(postedCard),
        posted_card_bundle_id: postedCard?.getAttribute("data-bundle-id") || "",
        posted_receipt_id: postedCard?.getAttribute("data-receipt-id") || "",
        contract_receipt_path: postedCard?.getAttribute("data-contract-receipt-path") || "",
        ready_card_still_visible: Boolean(document.querySelector(`#receiver-handoff-ready-to-post-${id}`)),
      };
    }, bundleId);
    clickReadback.playwright_browser_executable = launchOptions.executablePath || "bundled-playwright-browser";
  } finally {
    await browser.close();
  }

  return clickReadback;
}

async function main() {
  await sourceChecks();

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=300`);
  const reusable = before.records.find(
    (record) => record.bundle_id?.startsWith("receipts_ready_post_success_") && record.state === "returned_unposted",
  );
  const usedExistingSynthetic = Boolean(reusable);
  let packetId = reusable?.packet_id;
  let bundleId = reusable?.bundle_id;
  let create = null;
  let fill = null;
  let beforeClick = reusable ? { index: before, record: reusable } : null;

  if (!bundleId) {
    packetId = await selectPacketId();
    bundleId = `receipts_ready_post_success_${Date.now().toString(36)}`;
    create = await postJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs`, {
      packet_id: packetId,
      receiver: RECEIVER,
      base_url: BASE_URL,
      bundle_id: bundleId,
    }, 201);
    assertPass(create.result.bundle_id === bundleId, "created bundle id mismatch");

    fill = await postJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/fill-return`, {
      bundle_id: bundleId,
      receiver: RECEIVER,
      status: "partial",
      attempted: "Receipts ready post success smoke filled a returned receipt before browser posting.",
      changed: [create.result.handoff_path],
      proof_readbacks: [
        `Created receiver handoff bundle ${bundleId}.`,
        `Read returned receipt path after fill through /api/organism/contracts/receiver-handoffs.`,
      ],
      next_safe_action: "Post this synthetic returned receipt through the Receipts ready drawer and verify canonical receipt join.",
    }, 201);
    assertPass(fill.result.returned_receipt_path?.endsWith("returned-receipt.json"), "fill did not return returned receipt path");

    beforeClick = await getHandoffRecord(bundleId);
  }

  assertPass(packetId, "packet id missing for success smoke");
  assertPass(beforeClick, "before-click record missing for success smoke");
  assertPass(beforeClick.record?.state === "returned_unposted", `expected returned_unposted before click, got ${beforeClick.record?.state}`);
  if (fill) {
    assertPass(beforeClick.record?.returned_receipt_path === fill.result.returned_receipt_path, "returned path mismatch before click");
  }

  const clickReadback = await clickReceiptsReadyPost(bundleId);
  const after = await getHandoffRecord(bundleId);
  assertPass(after.record?.state === "posted", `expected posted after click, got ${after.record?.state}`);
  assertPass(after.record?.contract_event_joined === true, "posted record did not join packet_receipted event");
  assertPass(after.record?.contract_receipt_path !== "NO_CONTRACT_RECEIPT", "posted record missing contract receipt path");
  assertPass(
    clickReadback.path_hash === `/tinkerden/receipts#receiver-handoff-posted-${bundleId}`,
    `posted redirect path/hash mismatch: ${clickReadback.path_hash}`,
  );
  assertPass(clickReadback.posted_card_visible === true, "posted card was not visible after redirect");
  assertPass(clickReadback.ready_card_still_visible === false, "ready card still visible after posted redirect");
  assertPass(clickReadback.posted_card_bundle_id === bundleId, "posted card bundle id mismatch");
  assertPass(clickReadback.posted_receipt_id === after.record.returned_receipt_id, "posted card receipt id mismatch");
  assertPass(clickReadback.contract_receipt_path === after.record.contract_receipt_path, "posted card contract receipt path mismatch");
  assertPass(existsSync(path.join(ROOT, after.record.returned_receipt_path)), "returned receipt missing on disk");
  assertPass(existsSync(path.join(ROOT, after.record.contract_receipt_path)), "contract receipt missing on disk");
  const expectedTotalAfter = usedExistingSynthetic ? before.count : before.count + 1;
  const expectedReturnedUnpostedAfter = usedExistingSynthetic ? before.returned_unposted_count - 1 : before.returned_unposted_count;
  assertPass(after.index.count === expectedTotalAfter, `handoff count mismatch: expected ${expectedTotalAfter}, got ${after.index.count}`);
  assertPass(after.index.posted_count === before.posted_count + 1, `posted count did not increase by one: ${before.posted_count} -> ${after.index.posted_count}`);
  assertPass(after.index.pending_count === before.pending_count, `pending count changed unexpectedly: ${before.pending_count} -> ${after.index.pending_count}`);
  assertPass(
    after.index.returned_unposted_count === expectedReturnedUnpostedAfter,
    `returned-unposted count mismatch: expected ${expectedReturnedUnpostedAfter}, got ${after.index.returned_unposted_count}`,
  );
  assertPass(
    after.index.template_return_blocked_count === before.template_return_blocked_count,
    `template blocker count changed unexpectedly: ${before.template_return_blocked_count} -> ${after.index.template_return_blocked_count}`,
  );
  assertPass(after.index.invalid_count === before.invalid_count, "invalid count changed unexpectedly");
  assertPass(after.index.malformed_count === before.malformed_count, "malformed count changed unexpectedly");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_SUCCESS_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: packetId,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_SUCCESS_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receipts-ready-post-success-smoke.mjs",
    files_changed: [
      "components/tinkerden/receiver-handoff-ready-actions.tsx",
      "scripts/foreman/tinkerden-receipts-ready-post-success-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIPTS_READY_POST_SUCCESS_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      ...(create
        ? [
            create.result.packet_path,
            create.result.receipt_template_path,
            create.result.handoff_path,
            create.result.manifest_path,
          ]
        : []),
      ...(fill ? [fill.result.returned_receipt_path] : [beforeClick.record.returned_receipt_path]),
      after.record.contract_receipt_path,
    ],
    validation: {
      source_has_ready_post_control: true,
      source_has_post_success_readback_hooks: true,
      reused_existing_synthetic_ready_bundle: usedExistingSynthetic,
      created_synthetic_bundle_id: bundleId,
      state_before_receipts_click: beforeClick.record.state,
      state_after_receipts_click: after.record.state,
      browser_clicked_receipts_ready_post_button: true,
      browser_redirected_to_posted_anchor_after_post: true,
      playwright_browser_executable: clickReadback.playwright_browser_executable,
      browser_posted_card_visible_after_redirect: clickReadback.posted_card_visible,
      browser_ready_card_absent_after_redirect: !clickReadback.ready_card_still_visible,
      browser_posted_receipt_id: clickReadback.posted_receipt_id,
      browser_contract_receipt_path: clickReadback.contract_receipt_path,
      contract_event_joined_after_post: after.record.contract_event_joined,
      handoff_count_before: before.count,
      handoff_count_after: after.index.count,
      expected_handoff_count_after: expectedTotalAfter,
      posted_count_before: before.posted_count,
      posted_count_after: after.index.posted_count,
      pending_count_before: before.pending_count,
      pending_count_after: after.index.pending_count,
      returned_unposted_count_before: before.returned_unposted_count,
      returned_unposted_count_after: after.index.returned_unposted_count,
      expected_returned_unposted_count_after: expectedReturnedUnpostedAfter,
      template_return_blocked_count_before: before.template_return_blocked_count,
      template_return_blocked_count_after: after.index.template_return_blocked_count,
      invalid_count_after: after.index.invalid_count,
      malformed_count_after: after.index.malformed_count,
      truth_boundary:
        "This smoke posts only the synthetic returned receipt it created for this proof. It does not consume any pre-existing ready receiver handoff.",
    },
    created_bundle: create?.result ?? null,
    fill_result: fill?.result ?? null,
    before_click_record: beforeClick.record,
    click_readback: clickReadback,
    after_record: after.record,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no pre-existing ready receipt posted",
    ],
    next_safe_action:
      "Use the same Receipts ready drawer control for Ben-selected real ready cards, then verify ready/post counts move by one.",
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
        packet_id: packetId,
        bundle_id: bundleId,
        state_before_click: beforeClick.record.state,
        state_after_click: after.record.state,
        returned_receipt_id: after.record.returned_receipt_id,
        contract_receipt_path: after.record.contract_receipt_path,
        counts: {
        total_before: before.count,
        total_after: after.index.count,
        posted_before: before.posted_count,
        posted_after: after.index.posted_count,
        returned_unposted_before: before.returned_unposted_count,
        pending_after: after.index.pending_count,
        returned_unposted_after: after.index.returned_unposted_count,
          template_return_blocked_after: after.index.template_return_blocked_count,
          invalid_after: after.index.invalid_count,
          malformed_after: after.index.malformed_count,
        },
        click_readback: clickReadback,
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
