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
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_BUNDLE_V0_RECEIPT_20260706.json",
);
const BUNDLE_SCRIPT = path.join(ROOT, "scripts", "foreman", "organism-receiver-handoff-bundle.mjs");

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
  assertPass(latest?.packet?.packet_id, "no TinkerDen contract packet exists for handoff bundle smoke");
  return latest;
}

function runBundle(packetId) {
  const proc = spawnSync(
    process.execPath,
    [
      BUNDLE_SCRIPT,
      "--packet-id",
      packetId,
      "--receiver",
      "ReceiverHandoffFixture@Betsy",
      "--base-url",
      BASE_URL,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );

  if (proc.status !== 0) {
    throw new Error(`handoff bundle failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
    result: JSON.parse(proc.stdout),
  };
}

async function main() {
  const latest = await latestTinkerDenContractPacket();
  const run = runBundle(latest.packet.packet_id);

  assertPass(run.result.ok === true, "handoff bundle did not return ok");
  assertPass(run.result.packet_id === latest.packet.packet_id, "handoff packet_id mismatch");
  assertPass(run.result.receiver === "ReceiverHandoffFixture@Betsy", "handoff receiver mismatch");

  for (const key of ["handoff_path", "packet_path", "receipt_template_path", "manifest_path"]) {
    assertPass(existsSync(path.join(ROOT, run.result[key])), `${key} missing at ${run.result[key]}`);
  }

  const manifest = await readJson(run.result.manifest_path);
  const packetCopy = await readJson(run.result.packet_path);
  const receiptTemplate = await readJson(run.result.receipt_template_path);
  const handoff = await readFile(path.join(ROOT, run.result.handoff_path), "utf8");
  const scriptSource = await readFile(BUNDLE_SCRIPT, "utf8");

  assertPass(manifest.schema === "harvey_nerdkle_receiver_handoff_bundle_v0", "manifest schema mismatch");
  assertPass(manifest.packet_id === latest.packet.packet_id, "manifest packet_id mismatch");
  assertPass(manifest.endpoint === `${BASE_URL}/api/organism/contracts/receiver-receipts`, "manifest endpoint mismatch");
  assertPass(manifest.post_command.includes("organism-receiver-receipt-post.mjs"), "manifest post command missing post client");
  assertPass(packetCopy.packet_id === latest.packet.packet_id, "packet copy packet_id mismatch");
  assertPass(receiptTemplate.schema === "harvey_nerdkle_receipt_v0", "receipt template schema mismatch");
  assertPass(receiptTemplate.status === "blocked", "receipt template must be blocked");
  assertPass(receiptTemplate.blocked_reason === "TEMPLATE_NOT_FILLED", "receipt template blocked_reason mismatch");
  assertPass(
    receiptTemplate.what_did_not_change.includes("No receiver completion proof has been claimed by this template."),
    "template truth boundary missing",
  );
  assertPass(handoff.includes("Return Command"), "handoff markdown missing return command section");
  assertPass(handoff.includes("TEMPLATE_NOT_FILLED"), "handoff markdown missing template warning");
  assertPass(scriptSource.includes("receipt-template.json"), "bundle script does not write receipt-template.json");
  assertPass(scriptSource.includes("HANDOFF.md"), "bundle script does not write HANDOFF.md");
  assertPass(scriptSource.includes("manifest.json"), "bundle script does not write manifest.json");

  const filesToHash = [
    "scripts/foreman/organism-receiver-handoff-bundle.mjs",
    "scripts/foreman/organism-receiver-handoff-bundle-smoke.mjs",
    run.result.handoff_path,
    run.result.packet_path,
    run.result.receipt_template_path,
    run.result.manifest_path,
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
    schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_BUNDLE_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: latest.packet.packet_id,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_BUNDLE_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-receiver-handoff-bundle-smoke.mjs",
    files_changed: [
      "scripts/foreman/organism-receiver-handoff-bundle.mjs",
      "scripts/foreman/organism-receiver-handoff-bundle-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_BUNDLE_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      run.result.packet_path,
      run.result.receipt_template_path,
      run.result.handoff_path,
      run.result.manifest_path,
    ],
    validation: {
      handoff_bundle_returned_ok: true,
      packet_copy_written: true,
      receipt_template_written: true,
      handoff_markdown_written: true,
      manifest_written: true,
      manifest_endpoint_points_to_receiver_intake: true,
      manifest_post_command_uses_receiver_post_client: true,
      receipt_template_status: receiptTemplate.status,
      receipt_template_blocked_reason: receiptTemplate.blocked_reason,
      truth_boundary: "The receiver handoff template is blocked until a receiver adds real proof.",
    },
    handoff_bundle: run.result,
    handoff_manifest: manifest,
    file_hashes: fileHashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "receiver intake route not posted",
      "no synthetic completion receipt",
    ],
    next_safe_action: "Give the handoff folder to a separate Aeye and require it to return a non-template receipt through the post client.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        packet_id: latest.packet.packet_id,
        receipt_path: repoRel(RECEIPT_PATH),
        bundle_dir: run.result.bundle_dir,
        handoff_path: run.result.handoff_path,
        receipt_template_path: run.result.receipt_template_path,
        manifest_path: run.result.manifest_path,
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
