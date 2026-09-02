#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_LIVE_API_V0_RECEIPT_20260706.json",
);

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

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function readJsonl(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function latestTinkerDenContractPacket() {
  const packetDir = path.join(ROOT, "data", "organism", "contracts", "packets");
  const names = await readdir(packetDir);
  const packets = [];

  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const relativePath = slash(path.join("data", "organism", "contracts", "packets", name));
    const packet = await readJson(relativePath);
    if (!String(packet?.lane ?? "").startsWith("TinkerDen ")) continue;
    packets.push({ packet, path: relativePath });
  }

  packets.sort((left, right) => Date.parse(right.packet.created_at) - Date.parse(left.packet.created_at));
  const latest = packets[0];
  assertPass(latest?.packet?.packet_id, "no TinkerDen contract packet exists for receiver intake live API smoke");
  assertPass(existsSync(path.join(ROOT, latest.path)), "latest contract packet artifact is missing");
  return latest;
}

function liveApiReceiptFor({ packet, packetPath, packetHash, receiptId }) {
  return {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: packet.packet_id,
    created_at: new Date().toISOString(),
    receiver: "ReceiverAeyeLiveApiFixture@Betsy",
    status: "partial",
    what_was_attempted:
      "POST a receiving Aeye receipt through the live receiver receipt intake API and prove it writes the canonical contract receipt/event.",
    what_changed: [
      `data/organism/contracts/receipts/${receiptId}.json`,
      "data/organism/contracts/events.jsonl",
    ],
    what_did_not_change: [
      "This live API smoke did not claim real downstream Aeye task completion.",
      "No account automation.",
      "No browser credential control.",
      "No deploy.",
      "No push.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: packetPath,
      },
      {
        kind: "hash",
        value: `${packetPath} sha256 ${packetHash}`,
      },
      {
        kind: "url",
        value: `${BASE_URL}/api/organism/contracts/receiver-receipts`,
      },
      {
        kind: "readback",
        value: "live HTTP receiver receipt intake returned ok=true; downstream_receiver_proof=fixture",
      },
    ],
    blocked_reason: null,
    next_safe_action: "Have a real receiving Aeye POST a non-fixture receipt to the same intake route.",
    source_hashes_used: {
      [packetPath]: packetHash,
    },
  };
}

async function main() {
  const latest = await latestTinkerDenContractPacket();
  const packetRaw = await readFile(path.join(ROOT, latest.path));
  const packetHash = sha256(packetRaw);
  const liveReceiptId = `receiver_receipt_intake_live_api_${Date.now().toString(36)}`;
  const receipt = liveApiReceiptFor({
    packet: latest.packet,
    packetPath: latest.path,
    packetHash,
    receiptId: liveReceiptId,
  });
  const response = await fetch(`${BASE_URL}/api/organism/contracts/receiver-receipts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      detected_by: "ReceiverReceiptLiveApiSmoke@Betsy",
      receipt,
    }),
  });
  const result = await response.json();

  if (!response.ok || result.ok !== true) {
    throw new Error(`receiver receipt live API failed ${response.status}: ${JSON.stringify(result)}`);
  }

  assertPass(result.receipt_id === liveReceiptId, "live API receipt_id mismatch");
  assertPass(result.packet_id === latest.packet.packet_id, "live API packet_id mismatch");
  assertPass(result.contract_write?.ok === true, "live API contract_write did not pass");
  assertPass(existsSync(path.join(ROOT, result.contract_write.artifact_path)), "live API contract receipt artifact missing");

  const writtenReceipt = await readJson(result.contract_write.artifact_path);
  assertPass(writtenReceipt.receiver === "ReceiverAeyeLiveApiFixture@Betsy", "live API written receiver mismatch");
  assertPass(writtenReceipt.status === "partial", "live API receipt must remain partial");

  const events = await readJsonl("data/organism/contracts/events.jsonl");
  assertPass(
    events.some((event) => event.event_type === "packet_receipted" && event.receipt_id === liveReceiptId),
    "live API packet_receipted event missing",
  );

  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_LIVE_API_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: latest.packet.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_LIVE_API_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-receiver-receipt-live-api-smoke.mjs",
    endpoint: `${BASE_URL}/api/organism/contracts/receiver-receipts`,
    files_changed: [
      "scripts/foreman/organism-receiver-receipt-live-api-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_LIVE_API_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      result.contract_write.artifact_path,
      result.contract_write.event_path,
    ],
    validation: {
      live_http_post_returned_ok: true,
      receiver_receipt_id_round_tripped: true,
      packet_id_round_tripped: true,
      contract_receipt_written: true,
      contract_receipt_status: writtenReceipt.status,
      packet_receipted_event_written: true,
      truth_boundary: "Live API intake works, but this receipt remains fixture proof rather than real downstream completion.",
    },
    attached_to_contract_packet: {
      packet_id: latest.packet.packet_id,
      contract_packet_path: latest.path,
      lane: latest.packet.lane,
    },
    live_api_response: result,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no account automation",
      "no browser credential control",
    ],
    next_safe_action: "Point a separate Aeye/client at this endpoint for a real non-fixture receiver receipt.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        packet_id: latest.packet.packet_id,
        live_receiver_receipt_id: liveReceiptId,
        receipt_path: repoRel(RECEIPT_PATH),
        live_contract_receipt_path: result.contract_write.artifact_path,
        contract_event_path: result.contract_write.event_path,
        receipt_sha256: sha256(finalRaw),
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
