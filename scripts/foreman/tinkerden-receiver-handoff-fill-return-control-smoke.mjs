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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_FILL_RETURN_CONTROL_V0_RECEIPT_20260706.json",
);
const RECEIVER = "ReceiverFillReturnControlSmoke@Betsy";
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-return-fill.ts",
  "app/api/organism/contracts/receiver-handoffs/fill-return/route.ts",
  "scripts/foreman/tinkerden-receiver-handoff-fill-return-control-smoke.mjs",
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
  assertPass(selected?.packet_id, "no contract packet available for fill-return control smoke");
  return selected.packet_id;
}

async function createBundle(packetId, bundleId) {
  const create = await postJson(
    `${BASE_URL}/api/organism/contracts/receiver-handoffs`,
    {
      packet_id: packetId,
      receiver: RECEIVER,
      base_url: BASE_URL,
      bundle_id: bundleId,
    },
    201,
  );
  assertPass(create.result.bundle_id === bundleId, `${bundleId} created bundle id mismatch`);
  return create.result;
}

async function getHandoffRecord(bundleId) {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=200`);
  return {
    index,
    record: index.records.find((candidate) => candidate.bundle_id === bundleId),
  };
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("FILL RETURN RECEIPT"), "TinkerDen page missing fill return label");
  assertPass(pageSource.includes("data-fill-receiver-handoff-return"), "TinkerDen page missing fill form hook");
  assertPass(pageSource.includes("data-fill-return-attempted"), "TinkerDen page missing attempted field hook");
  assertPass(pageSource.includes("data-fill-return-proof"), "TinkerDen page missing proof field hook");

  const packetId = await selectPacketId();
  const stamp = Date.now().toString(36);
  const successBundleId = `ui_fill_return_control_${stamp}`;
  const blockerBundleId = `ui_fill_return_blocker_${stamp}`;
  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=200`);
  const successBundle = await createBundle(packetId, successBundleId);
  const blockerBundle = await createBundle(packetId, blockerBundleId);

  const launchOptions = browserLaunchOptions();
  let successClick;
  let blockerClick;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });

    const successForm = page.locator(`[data-fill-receiver-handoff-return][data-bundle-id="${successBundleId}"]`).first();
    await successForm.waitFor({ state: "visible", timeout: 10000 });
    await successForm.locator("[data-fill-return-attempted]").fill("Filled return receipt from the TinkerDen browser proof rail.");
    await successForm.locator("[data-fill-return-changed]").fill(successBundle.handoff_path);
    await successForm
      .locator("[data-fill-return-proof]")
      .fill(`Browser smoke filled returned-receipt.json for ${successBundleId} after reading the visible handoff row.`);
    await successForm.locator("button[type='submit']").click();
    await page.waitForFunction(
      async (id) => {
        const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=200", { cache: "no-store" });
        const result = await response.json();
        const record = Array.isArray(result.records)
          ? result.records.find((candidate) => candidate.bundle_id === id)
          : null;
        return record?.state === "returned_unposted";
      },
      successBundleId,
      { timeout: 10000 },
    );
    successClick = await page.evaluate(async (id) => {
      const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=200", { cache: "no-store" });
      const result = await response.json();
      const record = Array.isArray(result.records)
        ? result.records.find((candidate) => candidate.bundle_id === id)
        : null;
      return {
        state: record?.state || "UNKNOWN",
        returned_receipt_path: record?.returned_receipt_path || "UNKNOWN",
      };
    }, successBundleId);

    const blockerForm = page.locator(`[data-fill-receiver-handoff-return][data-bundle-id="${blockerBundleId}"]`).first();
    await blockerForm.waitFor({ state: "visible", timeout: 10000 });
    await blockerForm.locator("button[type='submit']").click();
    await page.waitForFunction(
      (id) => {
        const form = document.querySelector(`[data-fill-receiver-handoff-return][data-bundle-id="${id}"]`);
        const status = form?.querySelector("[data-fill-receiver-handoff-status]");
        return status?.textContent?.includes("BLOCKER: ATTEMPTED_REQUIRED");
      },
      blockerBundleId,
      { timeout: 10000 },
    );
    blockerClick = {
      status_text: await blockerForm.locator("[data-fill-receiver-handoff-status]").textContent(),
    };
  } finally {
    await browser.close();
  }

  const success = await getHandoffRecord(successBundleId);
  const blocker = await getHandoffRecord(blockerBundleId);
  assertPass(success.record?.state === "returned_unposted", `success bundle state mismatch: ${success.record?.state}`);
  assertPass(successClick.state === "returned_unposted", `browser fill click state mismatch: ${successClick.state}`);
  assertPass(success.record?.returned_receipt_path === successClick.returned_receipt_path, "browser fill returned path mismatch");
  assertPass(success.record?.contract_receipt_path === "NO_CONTRACT_RECEIPT", "browser fill wrote canonical contract receipt");
  assertPass(existsSync(path.join(ROOT, success.record.returned_receipt_path)), "browser fill returned receipt missing on disk");
  assertPass(blocker.record?.state === "pending_receiver", `blocker bundle state mismatch: ${blocker.record?.state}`);
  assertPass(blockerClick.status_text?.trim() === "BLOCKER: ATTEMPTED_REQUIRED", "empty fill blocker status mismatch");
  assertPass(success.index.posted_count === before.posted_count, "browser fill changed posted count");
  assertPass(success.index.invalid_count === 0, "handoff index invalid count not zero after browser fill");
  assertPass(success.index.malformed_count === 0, "handoff index malformed count not zero after browser fill");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_FILL_RETURN_CONTROL_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: packetId,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_FILL_RETURN_CONTROL_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-fill-return-control-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-fill-return-control-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_FILL_RETURN_CONTROL_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      successBundle.packet_path,
      successBundle.receipt_template_path,
      successBundle.handoff_path,
      successBundle.manifest_path,
      success.record.returned_receipt_path,
      blockerBundle.packet_path,
      blockerBundle.receipt_template_path,
      blockerBundle.handoff_path,
      blockerBundle.manifest_path,
    ],
    validation: {
      page_source_has_fill_label: true,
      page_source_has_fill_form_hook: true,
      page_source_has_attempted_field_hook: true,
      page_source_has_proof_field_hook: true,
      playwright_filled_return_form: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      success_bundle_state_after: success.record.state,
      success_returned_receipt_path: success.record.returned_receipt_path,
      success_contract_receipt_path_after: success.record.contract_receipt_path,
      blocker_bundle_state_after: blocker.record.state,
      blocker_status_text: blockerClick.status_text?.trim(),
      posted_count_before: before.posted_count,
      posted_count_after: success.index.posted_count,
      invalid_count_after: success.index.invalid_count,
      malformed_count_after: success.index.malformed_count,
      truth_boundary: "The TinkerDen fill-return form writes a local returned-receipt.json from explicit browser fields; it refuses empty attempted text and does not post canonically.",
    },
    success_bundle: successBundle,
    success_click_readback: successClick,
    success_index_record: success.record,
    blocker_bundle: blockerBundle,
    blocker_click_readback: blockerClick,
    blocker_index_record: blocker.record,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no canonical receipt posted by browser fill",
      "no empty attempted receipt written",
    ],
    next_safe_action: "Wire a one-click fill-then-post smoke only for deliberate test fixtures, while keeping operator UI split into separate fill and post controls.",
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
        success_bundle_id: successBundleId,
        success_state: success.record.state,
        returned_receipt_path: success.record.returned_receipt_path,
        blocker_bundle_id: blockerBundleId,
        blocker_state: blocker.record.state,
        blocker_status_text: blockerClick.status_text?.trim(),
        posted_count_before: before.posted_count,
        posted_count_after: success.index.posted_count,
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
