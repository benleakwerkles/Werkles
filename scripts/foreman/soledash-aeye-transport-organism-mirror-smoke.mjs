#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0_RECEIPT_20260706.json",
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

function compileMirror(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    "lib/soledash/aeye-inbox-v0/protocol.ts",
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

async function readJsonl(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8").catch(() => "");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-soledash-aeye-mirror-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = compileMirror(outDir);
    const require = createRequire(import.meta.url);
    const mirror = require(path.join(outDir, "lib", "soledash", "aeye-inbox-v0", "organism-contract-mirror.js"));

    const id = `BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0_${stamp()}`;
    const packetId = `soledash_aeye_${safeId(id).toLowerCase()}`;
    const receiptId = `soledash_aeye_receipt_${safeId(id).toLowerCase()}`;
    const outboxPath = path.join(ROOT, "foreman", "messages", "outbox", `${packetId}.json`);
    const inboxPath = path.join(ROOT, "foreman", "messages", "inbox", `${packetId}.json`);
    const receiptPath = path.join(ROOT, "foreman", "messages", "receipts", `${receiptId}.json`);

    const packet = {
      packet_id: packetId,
      origin_surface: "SoleDash Mirror Smoke",
      origin_card_id: "book_architecture_soledash_transport_mirror",
      target_aeye: "Dink",
      target_machine: "Betsy",
      payload: {
        task_text:
          "Prove SoleDash transport ACKs can be mirrored into the canonical organism packet/receipt/event contract without claiming receiver work completion.",
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
      message: "Dink@Betsy acknowledged transport receipt for smoke fixture.",
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

    assertPass(packetMirror.contract_write.ok === true, "packet mirror contract write failed");
    assertPass(receiptMirror.contract_write.ok === true, "receipt mirror contract write failed");
    assertPass(packetMirror.contract_write.packet_id === receiptMirror.contract_write.packet_id, "packet/receipt mirror packet_id mismatch");

    const contractPacket = await readJson(packetMirror.contract_write.artifact_path);
    const contractReceipt = await readJson(receiptMirror.contract_write.artifact_path);
    assertPass(contractPacket.schema === "harvey_nerdkle_packet_v0", "contract packet schema mismatch");
    assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "contract receipt schema mismatch");
    assertPass(contractReceipt.status === "partial", "transport ACK receipt should remain partial");
    assertPass(contractReceipt.packet_id === contractPacket.packet_id, "contract receipt packet_id mismatch");
    assertPass(
      contractReceipt.what_did_not_change.some((item) => item.includes("Transport ACK was not upgraded")),
      "contract receipt missing no-work-proof boundary",
    );

    const events = await readJsonl("data/organism/contracts/events.jsonl");
    const packetEvent = events.find(
      (event) => event.event_type === "packet_dispatched" && event.packet_id === contractPacket.packet_id,
    );
    const receiptEvent = events.find(
      (event) =>
        event.event_type === "packet_receipted" &&
        event.packet_id === contractPacket.packet_id &&
        event.receipt_id === contractReceipt.receipt_id,
    );
    assertPass(Boolean(packetEvent), "packet_dispatched event missing");
    assertPass(Boolean(receiptEvent), "packet_receipted event missing");

    const sourceFiles = [
      "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
      "lib/organism/contracts/receiver-proof-boundary.ts",
      "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
      "scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
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
      schema: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: process.env.COMPUTERNAME || "UNKNOWN_MACHINE",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0",
      receipt_id: "BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
      validation: {
        soledash_outbox_packet_written: true,
        soledash_inbox_packet_written: true,
        soledash_transport_receipt_written: true,
        organism_packet_mirror_written: true,
        organism_receipt_mirror_written: true,
        organism_receipt_status_partial_for_transport_ack: true,
        packet_receipted_event_joins_packet_id_and_receipt_id: true,
        receiver_work_completion_not_claimed: true,
      },
      fixture_readback: {
        message_packet_id: packet.packet_id,
        message_receipt_id: transportReceipt.receipt_id,
        outbox_path: repoRel(outboxPath),
        inbox_path: repoRel(inboxPath),
        message_receipt_path: repoRel(receiptPath),
        organism_packet_path: packetMirror.contract_write.artifact_path,
        organism_packet_event_path: packetMirror.contract_write.event_path,
        organism_packet_id: packetMirror.contract_write.packet_id,
        organism_receipt_path: receiptMirror.contract_write.artifact_path,
        organism_receipt_event_path: receiptMirror.contract_write.event_path,
        organism_receipt_id: receiptMirror.contract_write.receipt_id,
        packet_event_id: packetEvent.event_id,
        receipt_event_id: receiptEvent.event_id,
      },
      file_hashes: fileHashes,
      compile,
      truth_boundary:
        "This smoke proves SoleDash transport ACKs can be mirrored into canonical organism packet/receipt/event records. The mirrored receipt remains partial and does not claim receiver work completion.",
      stop_conditions_respected: ["no deploy", "no push", "fixture-only local transport writes", "no receiver work completion claim"],
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
          packet_event_id: receipt.fixture_readback.packet_event_id,
          receipt_event_id: receipt.fixture_readback.receipt_event_id,
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
