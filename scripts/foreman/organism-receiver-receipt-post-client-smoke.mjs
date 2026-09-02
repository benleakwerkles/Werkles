#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_POST_CLIENT_V0_RECEIPT_20260706.json",
);
const FIXTURE_DIR = path.join(ROOT, "foreman", "messages", "receiver-receipts");
const POST_CLIENT = path.join(ROOT, "scripts", "foreman", "organism-receiver-receipt-post.mjs");

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
  assertPass(latest?.packet?.packet_id, "no TinkerDen contract packet exists for post-client smoke");
  assertPass(existsSync(path.join(ROOT, latest.path)), "latest contract packet artifact is missing");
  return latest;
}

function receiverReceiptFor({ packet, packetPath, packetHash, receiptId }) {
  return {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: packet.packet_id,
    created_at: new Date().toISOString(),
    receiver: "ReceiverPostClientFixture@Betsy",
    status: "partial",
    what_was_attempted:
      "Use the receiver receipt post client to send a schema-valid Harvey/Nerdkle receipt to the canonical receiver intake route.",
    what_changed: [
      `data/organism/contracts/receipts/${receiptId}.json`,
      "data/organism/contracts/events.jsonl",
    ],
    what_did_not_change: [
      "This post-client smoke did not claim real downstream Aeye task completion.",
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
        kind: "command_output",
        value: "node scripts/foreman/organism-receiver-receipt-post.mjs --receipt <fixture>",
      },
      {
        kind: "readback",
        value: "receiver post client returned ok=true and contract_write.ok=true; downstream_receiver_proof=fixture",
      },
    ],
    blocked_reason: null,
    next_safe_action: "Use this post client with a non-fixture receipt returned by a separate Aeye.",
    source_hashes_used: {
      [packetPath]: packetHash,
    },
  };
}

async function writeFixtureReceipt(receipt) {
  await mkdir(FIXTURE_DIR, { recursive: true });
  const fixturePath = path.join(FIXTURE_DIR, `${receipt.receipt_id}.json`);
  await writeFile(fixturePath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return repoRel(fixturePath);
}

function runPostClient(fixturePath) {
  const proc = spawnSync(
    process.execPath,
    [
      POST_CLIENT,
      "--receipt",
      fixturePath,
      "--base-url",
      BASE_URL,
      "--detected-by",
      "ReceiverReceiptPostClientSmoke@Betsy",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );

  if (proc.status !== 0) {
    throw new Error(`post client failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
    result: JSON.parse(proc.stdout),
  };
}

async function main() {
  const latest = await latestTinkerDenContractPacket();
  const packetRaw = await readFile(path.join(ROOT, latest.path));
  const packetHash = sha256(packetRaw);
  const clientReceiptId = `receiver_receipt_post_client_${Date.now().toString(36)}`;
  const receiverReceipt = receiverReceiptFor({
    packet: latest.packet,
    packetPath: latest.path,
    packetHash,
    receiptId: clientReceiptId,
  });
  const fixturePath = await writeFixtureReceipt(receiverReceipt);
  const clientRun = runPostClient(fixturePath);

  assertPass(clientRun.result.ok === true, "post client did not return ok");
  assertPass(clientRun.result.receipt_id === clientReceiptId, "post client receipt_id mismatch");
  assertPass(clientRun.result.packet_id === latest.packet.packet_id, "post client packet_id mismatch");
  assertPass(clientRun.result.contract_write?.ok === true, "post client contract_write did not pass");
  assertPass(clientRun.result.local_contract_artifact_exists === true, "post client did not verify local contract artifact");

  const writtenReceipt = await readJson(clientRun.result.contract_write.artifact_path);
  assertPass(writtenReceipt.receiver === "ReceiverPostClientFixture@Betsy", "written receiver mismatch");
  assertPass(writtenReceipt.status === "partial", "post client smoke receipt must remain partial");
  assertPass(
    writtenReceipt.what_did_not_change.includes("This post-client smoke did not claim real downstream Aeye task completion."),
    "truth boundary missing",
  );

  const events = await readJsonl("data/organism/contracts/events.jsonl");
  assertPass(
    events.some((event) => event.event_type === "packet_receipted" && event.receipt_id === clientReceiptId),
    "post client packet_receipted event missing",
  );

  const clientSource = await readFile(POST_CLIENT, "utf8");
  assertPass(clientSource.includes("--receipt"), "post client does not expose --receipt");
  assertPass(clientSource.includes("/api/organism/contracts/receiver-receipts"), "post client does not target receiver intake route");
  assertPass(clientSource.includes("RECEIVER_RECEIPT_POST_FAILED"), "post client does not fail closed on bad response");

  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_POST_CLIENT_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: latest.packet.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_POST_CLIENT_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-receiver-receipt-post-client-smoke.mjs",
    files_changed: [
      "scripts/foreman/organism-receiver-receipt-post.mjs",
      "scripts/foreman/organism-receiver-receipt-post-client-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_RECEIPT_POST_CLIENT_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      fixturePath,
      clientRun.result.contract_write.artifact_path,
      clientRun.result.contract_write.event_path,
    ],
    validation: {
      post_client_helpful_args_present: true,
      post_client_targets_receiver_intake_route: true,
      post_client_fails_closed_on_bad_response: true,
      live_post_client_returned_ok: true,
      receipt_id_round_tripped: true,
      packet_id_round_tripped: true,
      local_contract_artifact_verified: true,
      packet_receipted_event_written: true,
      contract_receipt_status: writtenReceipt.status,
      truth_boundary: "The post client works, but this receipt remains fixture proof rather than real downstream completion.",
    },
    attached_to_contract_packet: {
      packet_id: latest.packet.packet_id,
      contract_packet_path: latest.path,
      lane: latest.packet.lane,
    },
    post_client_output: clientRun.result,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no account automation",
      "no browser credential control",
    ],
    next_safe_action: "Hand a real receiving Aeye the post client command and require its non-fixture receipt artifact path in return.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        packet_id: latest.packet.packet_id,
        post_client_receipt_id: clientReceiptId,
        receipt_path: repoRel(RECEIPT_PATH),
        fixture_receipt_path: fixturePath,
        contract_receipt_path: clientRun.result.contract_write.artifact_path,
        contract_event_path: clientRun.result.contract_write.event_path,
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
