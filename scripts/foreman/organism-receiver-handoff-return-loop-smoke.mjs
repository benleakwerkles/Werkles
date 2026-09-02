#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const BUNDLE_DIR = "foreman/handoffs/receiver-bundles/td_packet_bridge_execute_mr8te4jp_srhdov";
const RETURN_HELPER = path.join(ROOT, "scripts", "foreman", "organism-receiver-handoff-return.mjs");
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_RETURN_LOOP_V0_RECEIPT_20260706.json",
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

function runReturnHelper() {
  const proc = spawnSync(
    process.execPath,
    [
      RETURN_HELPER,
      "--bundle-dir",
      BUNDLE_DIR,
      "--receiver",
      "ReceiverHandoffReturnFixture@Betsy",
      "--status",
      "partial",
      "--attempted",
      "Receiver read the handoff bundle, verified packet hash and stop conditions, and returned non-template partial proof through the receiver post client.",
      "--changed",
      `${BUNDLE_DIR}/returned-receipt.json`,
      "--proof-readback",
      "ReceiverHandoffReturnFixture read HANDOFF.md, packet.json, and manifest.json; source packet hash matched; downstream_receiver_proof=fixture_non_template.",
      "--next-safe-action",
      "Replace this fixture with a real separate-Aeye returned receipt when delegation is live.",
      "--base-url",
      BASE_URL,
      "--detected-by",
      "ReceiverHandoffReturnLoopSmoke@Betsy",
      "--post",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );

  if (proc.status !== 0) {
    throw new Error(`handoff return helper failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
    result: JSON.parse(proc.stdout),
  };
}

async function readContractIndex(limit = 3) {
  const response = await fetch(`${BASE_URL}/api/organism/contracts/index?limit=${limit}`, {
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`contract index read failed ${response.status}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function main() {
  const helperSource = await readFile(RETURN_HELPER, "utf8");
  assertPass(helperSource.includes("ATTEMPTED_STILL_TEMPLATE"), "return helper does not reject template attempted text");
  assertPass(helperSource.includes("PROOF_READBACK_REQUIRED_FOR_NON_BLOCKED_RECEIPT"), "return helper does not require proof readback");
  assertPass(helperSource.includes("organism-receiver-receipt-post.mjs"), "return helper does not call post client");

  const run = runReturnHelper();
  assertPass(run.result.ok === true, "return helper did not return ok");
  assertPass(run.result.posted === true, "return helper did not post");
  assertPass(run.result.post_result?.ok === true, "post result was not ok");
  assertPass(run.result.local_contract_artifact_exists === true, "contract artifact not locally verified");
  assertPass(run.result.status === "partial", "returned receipt status must be partial");

  const returnedReceipt = await readJson(run.result.returned_receipt_path);
  assertPass(returnedReceipt.status === "partial", "returned receipt file status mismatch");
  assertPass(returnedReceipt.blocked_reason === null, "returned receipt should not be blocked");
  assertPass(!JSON.stringify(returnedReceipt).includes("TEMPLATE_NOT_FILLED"), "returned receipt still contains template marker");
  assertPass(
    returnedReceipt.proof.some((proof) => proof.kind === "readback" && proof.value.includes("fixture_non_template")),
    "returned receipt non-template readback missing",
  );

  const contractPath = run.result.post_result.contract_write.artifact_path;
  const contractReceipt = await readJson(contractPath);
  assertPass(contractReceipt.receipt_id === run.result.receipt_id, "contract receipt_id mismatch");
  assertPass(contractReceipt.packet_id === run.result.packet_id, "contract packet_id mismatch");
  assertPass(contractReceipt.receiver === "ReceiverHandoffReturnFixture@Betsy", "contract receiver mismatch");
  assertPass(contractReceipt.status === "partial", "contract receipt status mismatch");

  const events = await readJsonl("data/organism/contracts/events.jsonl");
  assertPass(
    events.some((event) => event.event_type === "packet_receipted" && event.receipt_id === run.result.receipt_id),
    "return loop packet_receipted event missing",
  );

  const index = await readContractIndex(5);
  assertPass(index.receipt_count >= 1, "contract index receipt count missing");
  assertPass(index.event_count >= 1, "contract index event count missing");
  assertPass(index.invalid_count === 0, "contract index invalid count is not zero");
  assertPass(index.malformed_count === 0, "contract index malformed count is not zero");
  assertPass(
    index.records.some((record) => record.receipt_id === run.result.receipt_id && record.joined_event_count > 0),
    "contract index does not show returned receipt joined to packet events",
  );

  const filesToHash = [
    "scripts/foreman/organism-receiver-handoff-return.mjs",
    "scripts/foreman/organism-receiver-handoff-return-loop-smoke.mjs",
    run.result.returned_receipt_path,
    contractPath,
  ];
  const fileHashes = [];
  for (const relativePath of filesToHash) {
    const raw = await readFile(path.join(ROOT, relativePath), "utf8");
    fileHashes.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    });
  }

  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_RETURN_LOOP_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: run.result.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_RETURN_LOOP_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-receiver-handoff-return-loop-smoke.mjs",
    files_changed: [
      "scripts/foreman/organism-receiver-handoff-return.mjs",
      "scripts/foreman/organism-receiver-handoff-return-loop-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_RETURN_LOOP_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      run.result.returned_receipt_path,
      contractPath,
      run.result.post_result.contract_write.event_path,
    ],
    validation: {
      return_helper_rejects_template_attempts: true,
      return_helper_requires_nonblocked_proof: true,
      return_helper_posts_through_receiver_client: true,
      returned_receipt_written: true,
      returned_receipt_status: returnedReceipt.status,
      returned_receipt_has_no_template_marker: true,
      live_post_returned_ok: true,
      contract_receipt_written: true,
      packet_receipted_event_written: true,
      contract_index_receipt_count: index.receipt_count,
      contract_index_event_count: index.event_count,
      contract_index_invalid_count: index.invalid_count,
      contract_index_malformed_count: index.malformed_count,
      contract_index_shows_joined_returned_receipt: true,
      truth_boundary: "This proves the handoff return loop mechanically; the returned receipt remains fixture partial proof, not real separate-Aeye completion.",
    },
    return_helper_output: run.result,
    contract_index_readback: {
      packet_count: index.packet_count,
      receipt_count: index.receipt_count,
      event_count: index.event_count,
      invalid_count: index.invalid_count,
      malformed_count: index.malformed_count,
      latest_records: index.records.slice(0, 5),
    },
    file_hashes: fileHashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no account automation",
      "no browser credential control",
      "no synthetic completed receipt",
    ],
    next_safe_action: "Replace the fixture receiver with a separate Aeye process or thread and require the same returned receipt path plus contract_write readback.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        packet_id: run.result.packet_id,
        returned_receipt_id: run.result.receipt_id,
        receipt_path: repoRel(RECEIPT_PATH),
        returned_receipt_path: run.result.returned_receipt_path,
        contract_receipt_path: contractPath,
        contract_event_path: run.result.post_result.contract_write.event_path,
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
