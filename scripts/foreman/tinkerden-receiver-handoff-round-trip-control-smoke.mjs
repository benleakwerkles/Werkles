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
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_ROUND_TRIP_CONTROL_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-return-fill.ts",
  "lib/organism/contracts/receiver-handoff-return-post.ts",
  "app/api/organism/contracts/receiver-handoffs/fill-return/route.ts",
  "app/api/organism/contracts/receiver-handoffs/post-return/route.ts",
  "scripts/foreman/tinkerden-receiver-handoff-round-trip-control-smoke.mjs",
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

async function getHandoffRecord(bundleId) {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  return {
    index,
    record: index.records.find((candidate) => candidate.bundle_id === bundleId),
  };
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("CREATE HANDOFF"), "TinkerDen page missing create handoff control");
  assertPass(pageSource.includes("FILL RETURN RECEIPT"), "TinkerDen page missing fill return control");
  assertPass(pageSource.includes("POST RETURNED RECEIPT"), "TinkerDen page missing post return control");
  assertPass(pageSource.includes("data-create-receiver-handoff"), "TinkerDen page missing create hook");
  assertPass(pageSource.includes("data-fill-receiver-handoff-return"), "TinkerDen page missing fill hook");
  assertPass(pageSource.includes("data-post-receiver-handoff-return"), "TinkerDen page missing post hook");

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const launchOptions = browserLaunchOptions();
  let createReadback;
  let fillReadback;
  let postReadback;
  const browser = await chromium.launch(launchOptions);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(`${BASE_URL}/tinkerden`, { waitUntil: "networkidle" });

    const createButton = page.locator("[data-create-receiver-handoff]").first();
    await createButton.waitFor({ state: "visible", timeout: 10000 });
    await createButton.click();
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll("[data-create-receiver-handoff]")).some((button) =>
        button.getAttribute("data-created-bundle-id"),
      ),
      null,
      { timeout: 10000 },
    );
    createReadback = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("[data-create-receiver-handoff]")).find((candidate) =>
        candidate.getAttribute("data-created-bundle-id"),
      );
      return {
        bundle_id: button?.getAttribute("data-created-bundle-id") || "UNKNOWN",
        handoff_path: button?.getAttribute("data-created-handoff-path") || "UNKNOWN",
        packet_id: button?.getAttribute("data-packet-id") || "UNKNOWN",
        receiver: button?.getAttribute("data-receiver") || "UNKNOWN",
        label: button?.textContent?.trim() || "UNKNOWN",
      };
    });
    assertPass(createReadback.bundle_id !== "UNKNOWN", "browser create did not expose created bundle id");
    assertPass(createReadback.handoff_path !== "UNKNOWN", "browser create did not expose handoff path");

    const fillForm = page.locator(`[data-fill-receiver-handoff-return][data-bundle-id="${createReadback.bundle_id}"]`).first();
    await fillForm.waitFor({ state: "visible", timeout: 10000 });
    await fillForm.locator("[data-fill-return-attempted]").fill("Round-trip smoke filled this returned receipt from the cockpit.");
    await fillForm.locator("[data-fill-return-changed]").fill(createReadback.handoff_path);
    await fillForm
      .locator("[data-fill-return-proof]")
      .fill(`Round-trip smoke read the created bundle ${createReadback.bundle_id} and submitted receiver proof through TinkerDen.`);
    await fillForm.locator("button[type='submit']").click();
    await page.waitForFunction(
      async (bundleId) => {
        const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=250", { cache: "no-store" });
        const result = await response.json();
        const record = Array.isArray(result.records)
          ? result.records.find((candidate) => candidate.bundle_id === bundleId)
          : null;
        return record?.state === "returned_unposted";
      },
      createReadback.bundle_id,
      { timeout: 10000 },
    );
    fillReadback = await page.evaluate(async (bundleId) => {
      const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=250", { cache: "no-store" });
      const result = await response.json();
      const record = Array.isArray(result.records)
        ? result.records.find((candidate) => candidate.bundle_id === bundleId)
        : null;
      return {
        state: record?.state || "UNKNOWN",
        returned_receipt_path: record?.returned_receipt_path || "UNKNOWN",
        contract_receipt_path: record?.contract_receipt_path || "UNKNOWN",
      };
    }, createReadback.bundle_id);

    const postButton = page.locator(`[data-post-receiver-handoff-return][data-bundle-id="${createReadback.bundle_id}"]`).first();
    await postButton.waitFor({ state: "visible", timeout: 10000 });
    await postButton.click();
    await page.waitForFunction(
      async (bundleId) => {
        const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=250", { cache: "no-store" });
        const result = await response.json();
        const record = Array.isArray(result.records)
          ? result.records.find((candidate) => candidate.bundle_id === bundleId)
          : null;
        return record?.state === "posted" && record?.contract_event_joined === true;
      },
      createReadback.bundle_id,
      { timeout: 10000 },
    );
    postReadback = await page.evaluate(async (bundleId) => {
      const response = await fetch("/api/organism/contracts/receiver-handoffs?limit=250", { cache: "no-store" });
      const result = await response.json();
      const record = Array.isArray(result.records)
        ? result.records.find((candidate) => candidate.bundle_id === bundleId)
        : null;
      return {
        state: record?.state || "UNKNOWN",
        returned_receipt_id: record?.returned_receipt_id || "UNKNOWN",
        returned_status: record?.returned_status || "UNKNOWN",
        returned_receipt_path: record?.returned_receipt_path || "UNKNOWN",
        contract_receipt_path: record?.contract_receipt_path || "UNKNOWN",
        contract_event_joined: Boolean(record?.contract_event_joined),
      };
    }, createReadback.bundle_id);
  } finally {
    await browser.close();
  }

  const after = await getHandoffRecord(createReadback.bundle_id);
  assertPass(after.record?.state === "posted", `round-trip bundle state mismatch: ${after.record?.state}`);
  assertPass(after.record?.contract_event_joined === true, "round-trip bundle did not join packet_receipted event");
  assertPass(after.record?.contract_receipt_path !== "NO_CONTRACT_RECEIPT", "round-trip bundle missing contract receipt path");
  assertPass(after.record?.returned_receipt_path === postReadback.returned_receipt_path, "round-trip returned path mismatch");
  assertPass(fillReadback.state === "returned_unposted", `fill readback state mismatch: ${fillReadback.state}`);
  assertPass(postReadback.state === "posted", `post readback state mismatch: ${postReadback.state}`);
  assertPass(after.index.count === before.count + 1, `handoff count did not increase by one: ${before.count} -> ${after.index.count}`);
  assertPass(after.index.posted_count === before.posted_count + 1, `posted count did not increase by one: ${before.posted_count} -> ${after.index.posted_count}`);
  assertPass(after.index.invalid_count === 0, "handoff index invalid count not zero after round trip");
  assertPass(after.index.malformed_count === 0, "handoff index malformed count not zero after round trip");
  assertPass(existsSync(path.join(ROOT, after.record.returned_receipt_path)), "round-trip returned receipt missing on disk");
  assertPass(existsSync(path.join(ROOT, after.record.contract_receipt_path)), "round-trip contract receipt missing on disk");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_ROUND_TRIP_CONTROL_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: createReadback.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_ROUND_TRIP_CONTROL_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-round-trip-control-smoke.mjs",
    files_changed: [
      "scripts/foreman/tinkerden-receiver-handoff-round-trip-control-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_ROUND_TRIP_CONTROL_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      after.record.packet_path,
      after.record.receipt_template_path,
      after.record.handoff_path,
      after.record.returned_receipt_path,
      after.record.contract_receipt_path,
    ],
    validation: {
      page_source_has_create_control: true,
      page_source_has_fill_control: true,
      page_source_has_post_control: true,
      playwright_clicked_create_fill_post: true,
      playwright_browser_executable: launchOptions.executablePath || "bundled-playwright-browser",
      bundle_id: createReadback.bundle_id,
      state_after_fill: fillReadback.state,
      state_after_post: postReadback.state,
      contract_event_joined_after_post: postReadback.contract_event_joined,
      returned_receipt_id: postReadback.returned_receipt_id,
      returned_receipt_path: after.record.returned_receipt_path,
      contract_receipt_path: after.record.contract_receipt_path,
      handoff_count_before: before.count,
      handoff_count_after: after.index.count,
      posted_count_before: before.posted_count,
      posted_count_after: after.index.posted_count,
      invalid_count_after: after.index.invalid_count,
      malformed_count_after: after.index.malformed_count,
      truth_boundary: "This smoke proves the cockpit can create, fill, and post one receiver handoff through deliberate browser controls; it does not merge those controls into one operator action.",
    },
    create_readback: createReadback,
    fill_readback: fillReadback,
    post_readback: postReadback,
    final_index_record: after.record,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no synthetic receiver proof",
      "operator UI remains split into create, fill, and post controls",
    ],
    next_safe_action: "Add a compact mission receipt drawer entry for round-trip handoffs so the cockpit can show the newest completed loop without reading raw JSON.",
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
        bundle_id: createReadback.bundle_id,
        packet_id: createReadback.packet_id,
        state_after_fill: fillReadback.state,
        state_after_post: postReadback.state,
        returned_receipt_path: after.record.returned_receipt_path,
        contract_receipt_path: after.record.contract_receipt_path,
        posted_count_before: before.posted_count,
        posted_count_after: after.index.posted_count,
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
