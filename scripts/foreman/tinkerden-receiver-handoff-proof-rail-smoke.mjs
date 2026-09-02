#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const TARGET_PACKET_ID = "td_packet_bridge_execute_mr8te4jp_srhdov";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROOF_RAIL_V0_RECEIPT_20260706.json",
);
const HASH_FILES = [
  "app/tinkerden/page.tsx",
  "lib/organism/contracts/receiver-handoff-index.ts",
  "app/api/organism/contracts/receiver-handoffs/route.ts",
  "scripts/foreman/tinkerden-receiver-handoff-proof-rail-smoke.mjs",
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
  return {
    status: response.status,
    result,
  };
}

async function getText(url) {
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET_TEXT_FAILED:${response.status}:${url}:${text.slice(0, 500)}`);
  }
  return {
    status: response.status,
    text,
  };
}

async function main() {
  const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
  assertPass(pageSource.includes("readReceiverHandoffIndex"), "TinkerDen page does not import/read receiver handoff index");
  assertPass(pageSource.includes("Receiver Handoff Lane"), "TinkerDen page does not render Receiver Handoff Lane");
  assertPass(pageSource.includes("data-receiver-handoff-panel"), "TinkerDen page missing receiver handoff panel hook");
  assertPass(pageSource.includes("data-receiver-handoff-list"), "TinkerDen page missing receiver handoff list hook");
  assertPass(pageSource.includes("hydrateReceiverHandoffs"), "TinkerDen page missing receiver handoff hydration function");
  assertPass(
    pageSource.includes("/api/organism/contracts/receiver-handoffs?limit=25"),
    "TinkerDen page does not point to receiver handoff API",
  );

  const handoffApi = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=10`);
  const target = handoffApi.result.records.find((record) => record.packet_id === TARGET_PACKET_ID);
  assertPass(target, `receiver handoff API missing target ${TARGET_PACKET_ID}`);
  assertPass(target.state === "posted", `target handoff state ${target.state} is not posted`);
  assertPass(target.returned_status === "partial", `target returned status ${target.returned_status} is not partial`);
  assertPass(target.contract_event_joined === true, "target handoff contract event is not joined");
  assertPass(target.lane === "TinkerDen bridge execute", `target handoff lane ${target.lane} mismatch`);

  const tinkerdenPage = await getText(`${BASE_URL}/tinkerden`);
  assertPass(tinkerdenPage.text.includes("Receiver Handoff Lane"), "live TinkerDen page missing Receiver Handoff Lane");
  assertPass(tinkerdenPage.text.includes("data-receiver-handoff-panel"), "live TinkerDen page missing panel hook");
  assertPass(tinkerdenPage.text.includes("data-receiver-handoff-list"), "live TinkerDen page missing list hook");
  assertPass(tinkerdenPage.text.includes("POSTED / 1 of 1"), "live TinkerDen page missing posted freshness label");
  assertPass(tinkerdenPage.text.includes(TARGET_PACKET_ID), "live TinkerDen page missing target packet id");
  assertPass(tinkerdenPage.text.includes(target.contract_receipt_path), "live TinkerDen page missing contract receipt path");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROOF_RAIL_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: TARGET_PACKET_ID,
    receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROOF_RAIL_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/tinkerden-receiver-handoff-proof-rail-smoke.mjs",
    files_changed: [
      "app/tinkerden/page.tsx",
      "scripts/foreman/tinkerden-receiver-handoff-proof-rail-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROOF_RAIL_V0_RECEIPT_20260706.json",
    ],
    validation: {
      page_source_imports_receiver_handoff_index: true,
      page_source_renders_receiver_handoff_lane: true,
      page_source_has_hydration_hooks: true,
      live_handoff_api_ok: true,
      live_handoff_api_status: handoffApi.status,
      live_handoff_count: handoffApi.result.count,
      live_handoff_posted_count: handoffApi.result.posted_count,
      live_handoff_invalid_count: handoffApi.result.invalid_count,
      live_handoff_malformed_count: handoffApi.result.malformed_count,
      target_state: target.state,
      target_returned_status: target.returned_status,
      target_contract_event_joined: target.contract_event_joined,
      live_tinkerden_page_ok: true,
      live_tinkerden_status: tinkerdenPage.status,
      live_tinkerden_contains_receiver_handoff_lane: true,
      live_tinkerden_contains_posted_freshness: true,
      truth_boundary: "TinkerDen now surfaces receiver handoff state, while preserving returned receipt status as partial.",
    },
    receiver_handoff_record: target,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "read-only UI/API verification except receipt artifact",
      "no synthetic completion receipt",
    ],
    next_safe_action: "Use the visible Receiver Handoff Lane while routing a real separate-Aeye handoff through the same bundle and return loop.",
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
        target_packet_id: target.packet_id,
        target_state: target.state,
        target_returned_status: target.returned_status,
        target_contract_receipt_path: target.contract_receipt_path,
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
