#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_V0_RECEIPT_20260706.json",
);
const RECEIVER = "ReceiverPostReturnSmoke@Betsy";
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-return-post.ts",
  "app/api/organism/contracts/receiver-handoffs/post-return/route.ts",
  "scripts/foreman/tinkerden-receiver-handoff-post-return-smoke.mjs",
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

function runReturnHelper(bundleDir) {
  const proc = spawnSync(
    process.execPath,
    [
      "scripts/foreman/organism-receiver-handoff-return.mjs",
      "--bundle-dir",
      bundleDir,
      "--status",
      "partial",
      "--receiver",
      RECEIVER,
      "--attempted",
      "Browser positive-path smoke for posting a real returned receiver handoff receipt.",
      "--changed",
      path.posix.join(bundleDir, "returned-receipt.json"),
      "--proof-readback",
      "Receiver handoff post-return smoke wrote returned-receipt.json before browser posting.",
      "--next-safe-action",
      "Verify the Receiver Handoff Lane changes this bundle from returned_unposted to posted.",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );

  if (proc.status !== 0) {
    throw new Error(`RETURN_HELPER_FAILED\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  const result = JSON.parse(proc.stdout);
  assertPass(result.ok === true, "return helper did not report ok");
  assertPass(result.posted === false, "return helper unexpectedly posted the receipt");
  assertPass(result.returned_receipt_path?.endsWith("returned-receipt.json"), "return helper did not write returned-receipt.json");
  return result;
}

async function selectPacketId() {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/index?limit=50`);
  const records = Array.isArray(index.records) ? index.records : [];
  const tinkerden = records.find((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "));
  const selected = tinkerden || records[0];
  assertPass(selected?.packet_id, "no contract packet available for post-return smoke");
  return selected.packet_id;
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  const routeSource = await readFile(
    path.join(ROOT, "app", "api", "organism", "contracts", "receiver-handoffs", "post-return", "route.ts"),
    "utf8",
  );
  assertPass(pageSource.includes("POST RETURNED RECEIPT"), "TinkerDen page missing post returned receipt label");
  assertPass(pageSource.includes("data-post-receiver-handoff-return"), "TinkerDen page missing post return hook");
  assertPass(pageSource.includes("data-post-receiver-handoff-status"), "TinkerDen page missing post return status hook");
  assertPass(routeSource.includes("postReceiverHandoffReturn"), "post-return route missing helper call");

  const packetId = await selectPacketId();
  const bundleId = `ui_post_return_smoke_${Date.now().toString(36)}`;
  const create = await postJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs`, {
    packet_id: packetId,
    receiver: RECEIVER,
    base_url: BASE_URL,
    bundle_id: bundleId,
  });
  assertPass(create.status === 201, `handoff create status ${create.status} was not 201`);
  assertPass(create.result.bundle_id === bundleId, "created bundle id mismatch");

  const returned = runReturnHelper(create.result.bundle_dir);
  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=100`);
  const beforeRecord = before.records.find((record) => record.bundle_id === bundleId);
  assertPass(beforeRecord?.state === "returned_unposted", `expected returned_unposted before click, got ${beforeRecord?.state}`);
  assertPass(beforeRecord?.returned_receipt_path === returned.returned_receipt_path, "index returned receipt path mismatch before click");

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
        return button?.textContent?.includes("RETURN POSTED") && button?.getAttribute("data-posted-receipt-id");
      },
      bundleId,
      { timeout: 10000 },
    );
    const postedReceiptId = await button.getAttribute("data-posted-receipt-id");
    const contractReceiptPath = await button.getAttribute("data-contract-receipt-path");
    const statusText = await page
      .locator(`[data-post-receiver-handoff-return][data-bundle-id="${bundleId}"] + [data-post-receiver-handoff-status]`)
      .first()
      .textContent();
    clickReadback = {
      posted_receipt_id: postedReceiptId,
      contract_receipt_path: contractReceiptPath,
      status_text: statusText?.trim(),
    };
  } finally {
    await browser.close();
  }

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=100`);
  const afterRecord = after.records.find((record) => record.bundle_id === bundleId);
  assertPass(afterRecord?.state === "posted", `expected posted after click, got ${afterRecord?.state}`);
  assertPass(afterRecord?.contract_event_joined === true, "posted return did not join a packet_receipted event");
  assertPass(afterRecord?.contract_receipt_path !== "NO_CONTRACT_RECEIPT", "posted return missing contract receipt path");
  assertPass(clickReadback.posted_receipt_id === afterRecord.returned_receipt_id, "browser posted receipt id mismatch");
  assertPass(existsSync(path.join(ROOT, afterRecord.contract_receipt_path)), "contract receipt artifact missing on disk");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: packetId,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-post-return-smoke.mjs",
    files_changed: [
      "lib/organism/contracts/receiver-handoff-return-post.ts",
      "app/api/organism/contracts/receiver-handoffs/post-return/route.ts",
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-post-return-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_POST_RETURN_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      create.result.packet_path,
      create.result.receipt_template_path,
      create.result.handoff_path,
      create.result.manifest_path,
      returned.returned_receipt_path,
      afterRecord.contract_receipt_path,
    ],
    validation: {
      page_source_has_post_label: true,
      page_source_has_post_hook: true,
      page_source_has_status_hook: true,
      route_calls_return_post_helper: true,
      playwright_clicked_post_return: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      bundle_state_before_click: beforeRecord.state,
      bundle_state_after_click: afterRecord.state,
      contract_event_joined_after_click: afterRecord.contract_event_joined,
      returned_receipt_path: returned.returned_receipt_path,
      contract_receipt_path: afterRecord.contract_receipt_path,
      click_status_text: clickReadback.status_text,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "The post-return control posts only an existing non-template returned-receipt.json; it does not create receiver proof or claim completion without the returned artifact.",
    },
    created_bundle: create.result,
    return_helper_result: returned,
    before_record: beforeRecord,
    after_record: afterRecord,
    click_readback: clickReadback,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no synthetic receiver proof",
      "no template receipt posted",
    ],
    next_safe_action: "Expose the same post-return route in any non-TinkerDen receiver cockpit, then hand a bundle to a separate Aeye and require a real returned-receipt.json before posting.",
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
        bundle_id: bundleId,
        packet_id: packetId,
        state_before: beforeRecord.state,
        state_after: afterRecord.state,
        contract_receipt_path: afterRecord.contract_receipt_path,
        click_status_text: clickReadback.status_text,
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
