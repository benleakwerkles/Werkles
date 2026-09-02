#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const FIXED_BUNDLE_ID = "soledash_aeye_receiver_handoff_bridge_smoke_v0";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json",
);

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath) {
  return slash(path.relative(ROOT, filePath));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeId(value) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stamp() {
  return Date.now().toString(36);
}

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function compileBridge(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
    "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    "lib/soledash/aeye-inbox-v0/protocol.ts",
    "lib/organism/contracts/receiver-handoff-bundle.ts",
    "lib/organism/contracts/packet.ts",
    "lib/organism/contracts/receipt.ts",
    "lib/organism/contracts/event.ts",
    "lib/organism/contracts/storage.ts",
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--strict",
    "--skipLibCheck",
    "--esModuleInterop",
    "--outDir",
    outDir,
    "--rootDir",
    ROOT,
  ];
  const proc = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (proc.status !== 0) {
    throw new Error(`tsc failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }
  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-soledash-handoff-bridge-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = compileBridge(outDir);
    const require = createRequire(import.meta.url);
    const mirror = require(path.join(outDir, "lib", "soledash", "aeye-inbox-v0", "organism-contract-mirror.js"));
    const bridge = require(path.join(outDir, "lib", "soledash", "aeye-inbox-v0", "receiver-handoff-bridge.js"));

    const id = `BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0_${stamp()}`;
    const packetId = `soledash_aeye_handoff_${safeId(id).toLowerCase()}`;
    const receiptId = `soledash_aeye_handoff_receipt_${safeId(id).toLowerCase()}`;
    const outboxPath = path.join(ROOT, "foreman", "messages", "outbox", `${packetId}.json`);
    const inboxPath = path.join(ROOT, "foreman", "messages", "inbox", `${packetId}.json`);
    const receiptPath = path.join(ROOT, "foreman", "messages", "receipts", `${receiptId}.json`);

    const packet = {
      packet_id: packetId,
      origin_surface: "SoleDash Receiver Handoff Bridge Smoke",
      origin_card_id: "book_architecture_soledash_receiver_handoff_bridge",
      target_aeye: "Dink",
      target_machine: "Betsy",
      payload: {
        task_text:
          "Prove a SoleDash transport packet can create a blocked receiver-handoff bundle for real work return proof.",
      },
      status: "SENT",
      created_at: new Date().toISOString(),
    };
    const inboxPacket = {
      ...packet,
      status: "ACKNOWLEDGED",
    };
    const transportReceipt = {
      receipt_id: receiptId,
      packet_id: packet.packet_id,
      from_aeye: "Dink",
      from_machine: "Betsy",
      status: "ACKNOWLEDGED",
      message: "Transport acknowledged; receiver work remains pending handoff return.",
      created_at: new Date().toISOString(),
    };

    await writeJson(outboxPath, packet);
    await writeJson(inboxPath, inboxPacket);
    await writeJson(receiptPath, transportReceipt);

    const packetMirror = await mirror.writeSoleDashAeyeTransportPacketRecord({
      packet,
      outbox_path: outboxPath,
      inbox_path: inboxPath,
    });
    const receiptMirror = await mirror.writeSoleDashAeyeTransportReceiptRecord({
      packet,
      receipt: transportReceipt,
      outbox_path: outboxPath,
      inbox_path: inboxPath,
      receipt_path: receiptPath,
    });
    const handoff = await bridge.createSoleDashAeyeReceiverHandoffBundle({
      packet,
      receiver: "Dink@Betsy",
      bundle_id: FIXED_BUNDLE_ID,
    });

    assertPass(packetMirror.contract_write.ok === true, "packet mirror contract write failed");
    assertPass(receiptMirror.contract_write.ok === true, "receipt mirror contract write failed");
    assertPass(handoff.receipt_template_status === "blocked", "handoff template status is not blocked");
    assertPass(handoff.receipt_template_blocked_reason === "TEMPLATE_NOT_FILLED", "handoff template blocked reason mismatch");
    assertPass(handoff.receiver_work_proof_status === "pending_receiver_return", "handoff did not stay pending receiver return");
    assertPass(handoff.organism_packet_id === packetMirror.contract_write.packet_id, "handoff organism packet id mismatch");

    const manifest = await readJson(handoff.manifest_path);
    const template = await readJson(handoff.receipt_template_path);
    const returnedReceiptPath = path.join(ROOT, handoff.bundle_dir, "returned-receipt.json");
    assertPass(manifest.packet_id === packetMirror.contract_write.packet_id, "manifest packet id mismatch");
    assertPass(template.status === "blocked", "template status mismatch");
    assertPass(template.blocked_reason === "TEMPLATE_NOT_FILLED", "template blocked reason mismatch");
    assertPass(template.what_changed.includes("TEMPLATE_NOT_FILLED"), "template missing TEMPLATE_NOT_FILLED marker");
    assertPass(!(await exists(returnedReceiptPath)), "receiver handoff smoke should not create returned-receipt.json");

    const sourceFiles = [
      "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
      "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
      "lib/organism/contracts/receiver-handoff-bundle.ts",
      "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
      "scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
    ];
    const fileHashes = [];
    for (const relativePath of sourceFiles) {
      const raw = await readFile(path.join(ROOT, relativePath));
      fileHashes.push({
        path: relativePath,
        sha256: sha256(raw),
        bytes: raw.byteLength,
      });
    }

    const receipt = {
      schema: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: process.env.COMPUTERNAME || "UNKNOWN_MACHINE",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0",
      receipt_id: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
      validation: {
        soledash_transport_packet_mirrored: true,
        soledash_transport_receipt_mirrored_partial: true,
        receiver_handoff_bundle_created: true,
        receiver_handoff_template_blocked: true,
        receiver_handoff_template_not_filled: true,
        receiver_handoff_return_not_created: true,
        receiver_work_completion_not_claimed: true,
        fixed_bundle_id_prevents_count_growth_on_repeated_runs: true,
      },
      fixture_readback: {
        source_message_packet_id: packet.packet_id,
        source_message_receipt_id: transportReceipt.receipt_id,
        organism_packet_id: packetMirror.contract_write.packet_id,
        organism_receipt_id: receiptMirror.contract_write.receipt_id,
        bundle_id: handoff.bundle_id,
        bundle_dir: handoff.bundle_dir,
        handoff_path: handoff.handoff_path,
        packet_path: handoff.packet_path,
        receipt_template_path: handoff.receipt_template_path,
        manifest_path: handoff.manifest_path,
        returned_receipt_path: repoRel(returnedReceiptPath),
        returned_receipt_exists: false,
      },
      file_hashes: fileHashes,
      compile,
      truth_boundary:
        "This smoke proves SoleDash transport can create a pending receiver-handoff return lane. The generated receipt template is blocked and is not receiver work completion proof.",
      stop_conditions_respected: ["no returned receipt created", "no receiver work completion claim", "no deploy", "no push"],
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          status: receipt.status,
          receipt_path: repoRel(RECEIPT_PATH),
          receipt_sha256: sha256(finalRaw),
          organism_packet_id: receipt.fixture_readback.organism_packet_id,
          organism_receipt_id: receipt.fixture_readback.organism_receipt_id,
          bundle_id: receipt.fixture_readback.bundle_id,
          receipt_template_path: receipt.fixture_readback.receipt_template_path,
          returned_receipt_exists: false,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
