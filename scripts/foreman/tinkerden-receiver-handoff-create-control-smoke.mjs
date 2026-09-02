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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_CREATE_CONTROL_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-bundle.ts",
  "app/api/organism/contracts/receiver-handoffs/route.ts",
  "scripts/foreman/tinkerden-receiver-handoff-create-control-smoke.mjs",
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

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`GET_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return result;
}

function browserLaunchOptions() {
  const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  return executablePath ? { headless: true, executablePath } : { headless: true };
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("data-create-receiver-handoff"), "TinkerDen page missing create handoff button hook");
  assertPass(pageSource.includes("createReceiverHandoffFromContract"), "TinkerDen page missing create handoff function");
  assertPass(pageSource.includes("/api/organism/contracts/receiver-handoffs"), "TinkerDen page missing receiver handoff API path");
  assertPass(pageSource.includes("hydrateReceiverHandoffs();"), "TinkerDen page does not refresh receiver handoffs after create");

  const launchOptions = browserLaunchOptions();
  const browser = await chromium.launch(launchOptions);
  let clickReadback;

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-create-receiver-handoff]", { timeout: 10000 });
    const button = page.locator("[data-create-receiver-handoff]").first();
    const packetId = await button.getAttribute("data-packet-id");
    const receiver = await button.getAttribute("data-receiver");
    assertPass(packetId, "visible create handoff button missing packet id");
    assertPass(receiver, "visible create handoff button missing receiver");
    await button.click();
    await page.waitForFunction(() => {
      const button = document.querySelector("[data-create-receiver-handoff]");
      return button?.textContent?.includes("HANDOFF CREATED") && button?.getAttribute("data-created-bundle-id");
    }, null, { timeout: 15000 });

    const createdBundleId = await button.getAttribute("data-created-bundle-id");
    const createdHandoffPath = await button.getAttribute("data-created-handoff-path");
    const statusText = await page.locator("[data-receiver-handoff-create-status]").first().textContent();
    assertPass(createdBundleId, "created bundle id missing after click");
    assertPass(createdHandoffPath, "created handoff path missing after click");
    assertPass(statusText?.includes("blocked"), "create status does not report blocked template");

    const bodyText = await page.locator("body").textContent();
    assertPass(bodyText?.includes("Receiver Handoff Lane"), "live page missing Receiver Handoff Lane");

    clickReadback = {
      packet_id: packetId,
      receiver,
      created_bundle_id: createdBundleId,
      created_handoff_path: createdHandoffPath,
      status_text: statusText?.trim(),
    };
  } finally {
    await browser.close();
  }

  const index = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=50`);
  const createdRecord = index.records.find((record) => record.bundle_id === clickReadback.created_bundle_id);
  assertPass(createdRecord, `created bundle not found in handoff index: ${clickReadback.created_bundle_id}`);
  assertPass(createdRecord.state === "pending_receiver", `created bundle state ${createdRecord.state} is not pending_receiver`);
  assertPass(createdRecord.template_status === "blocked", "created bundle template is not blocked");
  assertPass(createdRecord.template_blocked_reason === "TEMPLATE_NOT_FILLED", "created bundle template blocked reason mismatch");
  assertPass(createdRecord.returned_receipt_path === "NO_RETURNED_RECEIPT", "created bundle unexpectedly has returned receipt");
  assertPass(createdRecord.contract_receipt_path === "NO_CONTRACT_RECEIPT", "created bundle unexpectedly has contract receipt");
  assertPass(existsSync(path.join(ROOT, createdRecord.handoff_path)), "created handoff artifact missing");
  assertPass(existsSync(path.join(ROOT, createdRecord.receipt_template_path)), "created template artifact missing");

  const template = JSON.parse(await readFile(path.join(ROOT, createdRecord.receipt_template_path), "utf8"));
  assertPass(template.status === "blocked", "created template file is not blocked");
  assertPass(template.blocked_reason === "TEMPLATE_NOT_FILLED", "created template file blocked reason mismatch");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_CREATE_CONTROL_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: clickReadback.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_CREATE_CONTROL_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-create-control-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-create-control-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_CREATE_CONTROL_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      createdRecord.packet_path,
      createdRecord.receipt_template_path,
      createdRecord.handoff_path,
      createdRecord.bundle_path + "/manifest.json",
    ],
    validation: {
      page_source_has_create_button_hook: true,
      page_source_has_create_function: true,
      page_source_refreshes_handoff_lane_after_create: true,
      playwright_clicked_create_handoff: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      created_bundle_id: clickReadback.created_bundle_id,
      created_button_status_text: clickReadback.status_text,
      created_index_state: createdRecord.state,
      created_template_status: createdRecord.template_status,
      created_template_blocked_reason: createdRecord.template_blocked_reason,
      created_has_no_returned_receipt: true,
      created_has_no_contract_receipt: true,
      handoff_index_pending_count: index.pending_count,
      handoff_index_invalid_count: index.invalid_count,
      handoff_index_malformed_count: index.malformed_count,
      truth_boundary: "The UI create control creates pending blocked handoff templates only; it does not post a receiver receipt or claim completion.",
    },
    click_readback: clickReadback,
    created_handoff_record: createdRecord,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no receiver receipt posted",
      "no synthetic completion receipt",
    ],
    next_safe_action: "Hand one pending UI-created bundle to a real separate Aeye and require the returned receipt to travel through the same post client.",
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
        created_bundle_id: clickReadback.created_bundle_id,
        created_packet_id: clickReadback.packet_id,
        created_handoff_path: createdRecord.handoff_path,
        created_template_path: createdRecord.receipt_template_path,
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
