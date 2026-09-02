#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT_20260706.json");
const CONTRACT_FILES = [
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/gate.ts",
  "lib/organism/contracts/boot-context.ts",
  "lib/organism/contracts/storage.ts",
  "app/api/organism/contracts/packets/route.ts",
  "app/api/organism/contracts/receipts/route.ts",
  "scripts/foreman/organism-contract-write-paths-smoke.mjs",
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

function stampId(prefix) {
  return `${prefix}_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomBytes(3).toString("hex")}`;
}

function runTsc(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    "lib/organism/contracts/packet.ts",
    "lib/organism/contracts/receipt.ts",
    "lib/organism/contracts/event.ts",
    "lib/organism/contracts/gate.ts",
    "lib/organism/contracts/boot-context.ts",
    "lib/organism/contracts/storage.ts",
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--esModuleInterop",
    "--strict",
    "--skipLibCheck",
    "--outDir",
    outDir,
    "--rootDir",
    path.join(ROOT, "lib", "organism", "contracts"),
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

async function fileHashes(files) {
  const entries = [];
  for (const relativePath of files) {
    const absolutePath = path.join(ROOT, relativePath);
    const raw = await readFile(absolutePath, "utf8");
    entries.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    });
  }
  return entries;
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-organism-write-paths-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const packet = require(path.join(outDir, "packet.js"));
    const receipt = require(path.join(outDir, "receipt.js"));
    const event = require(path.join(outDir, "event.js"));
    const storage = require(path.join(outDir, "storage.js"));

    const now = new Date().toISOString();
    const packetId = "BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0";
    const receiptId = "BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT_20260706";
    const sourcePath = "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md";

    const validPacket = {
      schema: packet.HARVEY_NERDKLE_PACKET_SCHEMA,
      packet_id: packetId,
      created_at: now,
      from: "Ben@Betsy",
      to: "Heimerdinker@Betsy",
      lane: "Harvey/Nerdkle architecture",
      operator_intent: "Wire organism contract validators into real packet and receipt write paths.",
      source_paths: [sourcePath],
      source_hashes: {
        [sourcePath]: "822769D5BA324F57618107868567BFADACAB200A9AADECBA12D29AB9B8D1D7BF",
      },
      cwd: ROOT,
      requested_action: "Persist contract-validated packet and receipt records through shared storage.",
      allowed_actions: ["read", "write", "run_safe_command", "readback"],
      forbidden_actions: ["deploy", "push", "enter_secret", "production_mutation"],
      stop_conditions: ["source_missing", "gate_required", "breach_risk"],
      acceptance_criteria: [
        "Valid packet writes through storage.",
        "Invalid packet returns SCHEMA_INVALID and writes blocker receipt.",
        "Valid receipt writes through storage.",
        "Packet write and receipt write append validated events.",
      ],
      receipt_required: true,
      receipt_destination: "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT_20260706.json",
      idempotency_key: "book-architecture-contract-write-paths-v0-20260706",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const invalidPacket = {
      schema: packet.HARVEY_NERDKLE_PACKET_SCHEMA,
      packet_id: "BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_INVALID_PACKET_V0",
      receipt_required: false,
    };

    const packetWrite = await storage.writeOrganismPacketRecord(validPacket, {
      detected_by: "organism-contract-write-paths-smoke",
    });
    const invalidPacketWrite = await storage.writeOrganismPacketRecord(invalidPacket, {
      detected_by: "organism-contract-write-paths-smoke",
    });

    const validReceipt = {
      schema: receipt.HARVEY_NERDKLE_RECEIPT_SCHEMA,
      receipt_id: receiptId,
      packet_id: packetId,
      created_at: new Date().toISOString(),
      receiver: "Heimerdinker@Betsy",
      status: "completed",
      what_was_attempted: "Write validated organism packet and receipt through shared storage.",
      what_changed: [
        "lib/organism/contracts/storage.ts",
        "app/api/organism/contracts/packets/route.ts",
        "app/api/organism/contracts/receipts/route.ts",
        "scripts/foreman/organism-contract-write-paths-smoke.mjs",
        "data/organism/contracts/packets/BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0.json",
        "data/organism/contracts/receipts/BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT_20260706.json",
        "data/organism/contracts/events.jsonl",
      ],
      what_did_not_change: ["No deploy.", "No push.", "No secrets.", "No production mutation."],
      proof: [
        { kind: "artifact_path", value: packetWrite.ok ? packetWrite.path : "PACKET_WRITE_FAILED" },
        { kind: "artifact_path", value: invalidPacketWrite.ok ? "INVALID_PACKET_UNEXPECTEDLY_WROTE" : invalidPacketWrite.receipt_path },
      ],
      blocked_reason: null,
      next_safe_action: "Replace legacy packet/receipt writers lane by lane with these storage helpers.",
      source_hashes_used: validPacket.source_hashes,
    };

    const receiptWrite = await storage.writeOrganismReceiptRecord(validReceipt, {
      detected_by: "organism-contract-write-paths-smoke",
    });

    assertPass(packetWrite.ok, "valid packet did not write");
    assertPass(packet.validateOrganismPacket(packetWrite.value).ok, "written packet did not validate");
    assertPass(packetWrite.event.event_type === "packet_dispatched", "packet write did not append packet_dispatched event");
    assertPass(!invalidPacketWrite.ok && invalidPacketWrite.code === "SCHEMA_INVALID", "invalid packet did not return SCHEMA_INVALID");
    assertPass(invalidPacketWrite.receipt.status === "blocked", "invalid packet did not write blocker receipt");
    assertPass(receiptWrite.ok, "valid receipt did not write");
    assertPass(receipt.validateOrganismReceipt(receiptWrite.value).ok, "written receipt did not validate");
    assertPass(receiptWrite.event.event_type === "packet_receipted", "receipt write did not append packet_receipted event");
    assertPass(event.eventJoinsPacketAndReceipt(receiptWrite.event), "receipt event did not join packet_id and receipt_id");

    const hashes = await fileHashes(CONTRACT_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: packetId,
      receipt_id: receiptId,
      repo: ROOT,
      command: "node scripts/foreman/organism-contract-write-paths-smoke.mjs",
      files_changed: [
        "lib/organism/contracts/storage.ts",
        "app/api/organism/contracts/packets/route.ts",
        "app/api/organism/contracts/receipts/route.ts",
        "scripts/foreman/organism-contract-write-paths-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_WRITE_PATHS_V0_RECEIPT_20260706.json",
      ],
      data_artifacts_written: [
        packetWrite.path,
        invalidPacketWrite.ok ? null : invalidPacketWrite.receipt_path,
        receiptWrite.path,
        receiptWrite.event_path,
      ].filter(Boolean),
      validation: {
        tsc_compile: "passed",
        valid_packet_storage_write: true,
        invalid_packet_returns_schema_invalid: true,
        invalid_packet_writes_blocker_receipt: true,
        valid_receipt_storage_write: true,
        packet_write_appends_validated_event: true,
        receipt_write_appends_validated_event: true,
        receipt_event_joins_packet_id_and_receipt_id: true,
      },
      contract_file_hashes: hashes,
      compile,
      next_safe_action: "Replace legacy packet/receipt writers lane by lane with these storage helpers.",
      stop_conditions_respected: ["no deploy", "no push", "no secrets", "no production mutation"],
    };

    outputReceipt.self_sha256_pending = sha256(JSON.stringify(outputReceipt));
    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(JSON.stringify({
      ok: true,
      packet_id: packetId,
      receipt_id: receiptId,
      packet_path: packetWrite.path,
      invalid_packet_receipt_path: invalidPacketWrite.ok ? null : invalidPacketWrite.receipt_path,
      receipt_path: repoRel(RECEIPT_PATH),
      contract_receipt_path: receiptWrite.ok ? receiptWrite.path : null,
      event_path: receiptWrite.ok ? receiptWrite.event_path : null,
      receipt_sha256: sha256(finalRaw),
      validation: outputReceipt.validation,
    }, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
