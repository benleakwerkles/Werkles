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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_BLOCKERS_V0_RECEIPT_20260706.json",
);
const RECEIVER = "ReceiverPostReturnBlockerSmoke@Betsy";
const HASH_FILES = [
  "lib/organism/contracts/receiver-handoff-index.ts",
  "lib/organism/contracts/receiver-handoff-return-post.ts",
  "app/api/organism/contracts/receiver-handoffs/post-return/route.ts",
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-receiver-handoff-post-return-blockers-smoke.mjs",
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

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`POST_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return { status: response.status, result };
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

async function selectPacketId() {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/index?limit=50`);
  const records = Array.isArray(index.records) ? index.records : [];
  const tinkerden = records.find((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "));
  const selected = tinkerden || records[0];
  assertPass(selected?.packet_id, "no contract packet available for post-return blocker smoke");
  return selected.packet_id;
}

async function createBundle(packetId, bundleId) {
  const create = await postJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs`, {
    packet_id: packetId,
    receiver: RECEIVER,
    base_url: BASE_URL,
    bundle_id: bundleId,
  });
  assertPass(create.status === 201, `${bundleId} create status ${create.status} was not 201`);
  assertPass(create.result.bundle_id === bundleId, `${bundleId} created bundle id mismatch`);
  return create.result;
}

async function copyTemplateToReturned(bundle) {
  const templatePath = path.join(ROOT, bundle.receipt_template_path);
  const returnedPath = path.join(ROOT, bundle.bundle_dir, "returned-receipt.json");
  const raw = await readFile(templatePath, "utf8");
  await writeFile(returnedPath, raw, "utf8");
  return {
    returned_receipt_path: repoRel(returnedPath),
    returned_receipt_sha256: sha256(raw),
  };
}

async function clickMissingReturnBlocker(bundleId) {
  const launchOptions = browserLaunchOptions();
  let clickReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    const button = page.locator(`[data-post-receiver-handoff-return][data-bundle-id="${bundleId}"]`).first();
    await button.waitFor({ state: "visible", timeout: 10000 });
    await button.click();
    await page.waitForFunction(
      (id) => {
        const button = document.querySelector(`[data-post-receiver-handoff-return][data-bundle-id="${id}"]`);
        const status = button?.parentElement?.querySelector("[data-post-receiver-handoff-status]");
        return status?.textContent?.includes("BLOCKER: RETURNED_RECEIPT_MISSING");
      },
      bundleId,
      { timeout: 10000 },
    );
    const statusText = await page
      .locator(`[data-post-receiver-handoff-return][data-bundle-id="${bundleId}"] + [data-post-receiver-handoff-status]`)
      .first()
      .textContent();
    clickReadback = {
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      status_text: statusText?.trim(),
    };
  } finally {
    await browser.close();
  }

  return clickReadback;
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  const indexSource = await readFile(path.join(ROOT, "lib", "organism", "contracts", "receiver-handoff-index.ts"), "utf8");
  const postHelperSource = await readFile(path.join(ROOT, "lib", "organism", "contracts", "receiver-handoff-return-post.ts"), "utf8");
  assertPass(pageSource.includes("POST RETURNED RECEIPT"), "TinkerDen page missing post returned receipt control");
  assertPass(indexSource.includes("template_return_blocked"), "handoff index missing template_return_blocked state");
  assertPass(postHelperSource.includes("TEMPLATE_NOT_FILLED_RETURN_RECEIPT"), "post helper missing template rejection");

  const packetId = await selectPacketId();
  const stamp = Date.now().toString(36);
  const missingBundleId = `ui_post_missing_return_blocker_${stamp}`;
  const templateBundleId = `ui_post_template_return_blocker_${stamp}`;
  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=100`);

  const missingBundle = await createBundle(packetId, missingBundleId);
  const missingClick = await clickMissingReturnBlocker(missingBundleId);
  assertPass(
    missingClick.status_text === "BLOCKER: RETURNED_RECEIPT_MISSING",
    `missing receipt click did not surface blocker: ${missingClick.status_text}`,
  );

  const templateBundle = await createBundle(packetId, templateBundleId);
  const templateCopy = await copyTemplateToReturned(templateBundle);
  const templatePost = await postJsonExpectFailure(`${BASE_URL}/api/organism/contracts/receiver-handoffs/post-return`, {
    bundle_id: templateBundleId,
    detected_by: "TinkerDenReceiverHandoffBlockerSmoke@Betsy",
  });
  assertPass(templatePost.status === 409, `template post failure status ${templatePost.status} was not 409`);
  assertPass(
    templatePost.result.error === "TEMPLATE_NOT_FILLED_RETURN_RECEIPT",
    `template post error mismatch: ${templatePost.result.error}`,
  );

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=100`);
  const missingRecord = after.records.find((record) => record.bundle_id === missingBundleId);
  const templateRecord = after.records.find((record) => record.bundle_id === templateBundleId);
  assertPass(missingRecord?.state === "pending_receiver", `missing bundle state mismatch: ${missingRecord?.state}`);
  assertPass(templateRecord?.state === "template_return_blocked", `template bundle state mismatch: ${templateRecord?.state}`);
  assertPass(templateRecord?.contract_receipt_path === "NO_CONTRACT_RECEIPT", "template blocker wrote a contract receipt");
  assertPass(after.posted_count === before.posted_count, "blocker smoke changed posted count");
  assertPass(after.invalid_count === 0, "handoff index invalid count not zero after blocker smoke");
  assertPass(after.malformed_count === 0, "handoff index malformed count not zero after blocker smoke");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_BLOCKERS_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: packetId,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_BLOCKERS_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-post-return-blockers-smoke.mjs",
    files_changed: [
      "lib/organism/contracts/receiver-handoff-index.ts",
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-post-return-blockers-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_BLOCKERS_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      missingBundle.packet_path,
      missingBundle.receipt_template_path,
      missingBundle.handoff_path,
      missingBundle.manifest_path,
      templateBundle.packet_path,
      templateBundle.receipt_template_path,
      templateBundle.handoff_path,
      templateBundle.manifest_path,
      templateCopy.returned_receipt_path,
    ],
    validation: {
      page_source_has_post_control: true,
      index_has_template_return_blocked_state: true,
      post_helper_rejects_template_returns: true,
      playwright_clicked_missing_return: true,
      playwright_browser_executable: missingClick.playwright_browser_executable,
      missing_return_status_text: missingClick.status_text,
      missing_bundle_state: missingRecord.state,
      template_post_status: templatePost.status,
      template_post_error: templatePost.result.error,
      template_bundle_state: templateRecord.state,
      template_return_blocked_count_after: after.template_return_blocked_count,
      posted_count_before: before.posted_count,
      posted_count_after: after.posted_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "Missing returned receipts and untouched TEMPLATE_NOT_FILLED returned receipts are both refused; neither path writes a canonical contract receipt.",
    },
    missing_bundle: missingBundle,
    template_bundle: templateBundle,
    template_return_copy: templateCopy,
    missing_record: missingRecord,
    template_record: templateRecord,
    template_post_result: templatePost.result,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no canonical receipt for missing return",
      "no canonical receipt for untouched template return",
    ],
    next_safe_action: "Add a receiver-side fill assistant that writes returned-receipt.json from explicit proof fields while preserving the same template refusal gate.",
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
        missing_bundle_id: missingBundleId,
        missing_status_text: missingClick.status_text,
        template_bundle_id: templateBundleId,
        template_post_error: templatePost.result.error,
        template_bundle_state: templateRecord.state,
        posted_count_before: before.posted_count,
        posted_count_after: after.posted_count,
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
