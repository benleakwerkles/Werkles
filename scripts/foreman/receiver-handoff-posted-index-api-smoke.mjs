#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_POSTED_INDEX_API_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "lib/organism/contracts/receiver-handoff-posted-index.ts",
  "app/api/organism/contracts/receiver-handoffs/posted/route.ts",
  "scripts/foreman/receiver-handoff-posted-index-api-smoke.mjs",
];

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

function latestPosted(records) {
  return records.find((record) => record.state === "posted" && record.contract_event_joined)
    || records.find((record) => record.state === "posted")
    || null;
}

async function main() {
  const helperSource = await readFile(path.join(ROOT, "lib", "organism", "contracts", "receiver-handoff-posted-index.ts"), "utf8");
  const routeSource = await readFile(
    path.join(ROOT, "app", "api", "organism", "contracts", "receiver-handoffs", "posted", "route.ts"),
    "utf8",
  );
  assertPass(helperSource.includes("readReceiverHandoffPostedIndex"), "posted index helper missing exported reader");
  assertPass(helperSource.includes("record.state === \"posted\""), "posted index helper does not filter posted state");
  assertPass(routeSource.includes("readReceiverHandoffPostedIndex"), "posted index route missing helper call");

  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const expectedLatest = latestPosted(before.records);
  assertPass(expectedLatest, "mixed receiver handoff index has no posted records");

  const posted = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs/posted?limit=2`);
  assertPass(posted.count <= 2, `posted route returned too many records: ${posted.count}`);
  assertPass(posted.posted_count === before.posted_count, "posted route posted_count mismatch");
  assertPass(posted.source_total_count === before.count, "posted route source_total_count mismatch");
  assertPass(posted.latest?.bundle_id === expectedLatest.bundle_id, "posted route latest bundle mismatch");
  assertPass(posted.latest?.returned_receipt_id === expectedLatest.returned_receipt_id, "posted route latest receipt mismatch");
  assertPass(posted.latest?.contract_receipt_path === expectedLatest.contract_receipt_path, "posted route latest contract path mismatch");
  assertPass(posted.records.every((record) => record.state === "posted"), "posted route returned non-posted record");
  assertPass(posted.records.every((record) => record.contract_receipt_path !== "NO_CONTRACT_RECEIPT"), "posted route returned missing contract receipt path");
  assertPass(posted.truth_boundary.includes("does not create, fill, or post"), "posted route truth boundary missing no-mutation claim");

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  assertPass(after.count === before.count, "posted index smoke changed handoff count");
  assertPass(after.posted_count === before.posted_count, "posted index smoke changed posted count");
  assertPass(after.pending_count === before.pending_count, "posted index smoke changed pending count");
  assertPass(after.returned_unposted_count === before.returned_unposted_count, "posted index smoke changed returned-unposted count");
  assertPass(after.template_return_blocked_count === before.template_return_blocked_count, "posted index smoke changed template-blocked count");
  assertPass(after.invalid_count === before.invalid_count, "posted index smoke changed invalid count");
  assertPass(after.malformed_count === before.malformed_count, "posted index smoke changed malformed count");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_POSTED_INDEX_API_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: expectedLatest.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_POSTED_INDEX_API_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/receiver-handoff-posted-index-api-smoke.mjs",
    files_changed: [
      "lib/organism/contracts/receiver-handoff-posted-index.ts",
      "app/api/organism/contracts/receiver-handoffs/posted/route.ts",
      "scripts/foreman/receiver-handoff-posted-index-api-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_POSTED_INDEX_API_V0_RECEIPT_20260706.json",
    ],
    validation: {
      helper_exports_posted_reader: true,
      helper_filters_posted_state: true,
      route_calls_posted_reader: true,
      api_path: "/api/organism/contracts/receiver-handoffs/posted?limit=2",
      latest_bundle_id: posted.latest.bundle_id,
      latest_receipt_id: posted.latest.returned_receipt_id,
      latest_contract_receipt_path: posted.latest.contract_receipt_path,
      route_count: posted.count,
      route_posted_count: posted.posted_count,
      mixed_posted_count: before.posted_count,
      records_all_posted: true,
      handoff_count_before: before.count,
      handoff_count_after: after.count,
      posted_count_before: before.posted_count,
      posted_count_after: after.posted_count,
      pending_count_after: after.pending_count,
      returned_unposted_count_after: after.returned_unposted_count,
      template_return_blocked_count_after: after.template_return_blocked_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "The posted-only receiver handoff API is read-only and filters the canonical mixed handoff index to posted records only.",
    },
    posted_index_result: posted,
    expected_latest_from_mixed_index: expectedLatest,
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
    next_safe_action: "Use the posted-only API to feed a dedicated receipt drawer route without teaching UI code how to filter mixed handoff states.",
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
        packet_id: expectedLatest.packet_id,
        latest_bundle_id: posted.latest.bundle_id,
        latest_receipt_id: posted.latest.returned_receipt_id,
        latest_contract_receipt_path: posted.latest.contract_receipt_path,
        route_count: posted.count,
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
