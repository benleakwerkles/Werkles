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
  "BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0_RECEIPT_20260706.json",
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
    "lib/nerdkle/organism-contract-mirror.ts",
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
  const tempRoot = path.join(os.tmpdir(), `werkles-nerdkle-organism-mirror-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });
  const compile = compileMirror(outDir);
  const require = createRequire(import.meta.url);
  const mirror = require(path.join(outDir, "lib", "nerdkle", "organism-contract-mirror.js"));
  const id = `BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0_${stamp()}`;
  const objectId = `nerdkle_${safeId(id).toLowerCase()}`;
  const objectPath = path.join(ROOT, "data", "organism", "nerdkle", "objects", `${objectId}.json`);
  const packetPath = path.join(ROOT, "foreman", "handoffs", "outbox", `TO_MIRROR_SMOKE_NERDKLE_EXECUTE_${objectId}.md`);
  const legacyReceiptPath = path.join(
    ROOT,
    "data",
    "organism",
    "nerdkle",
    "receipts",
    `execution_receipt_${objectId}_${stamp()}.json`,
  );

  const object = {
    id: objectId,
    object_type: "architecture-proof-smoke",
    operator_intent:
      "Prove Nerdkle legacy packet and receipt records can be mirrored into the canonical organism packet/receipt/event contract.",
    artifact_created: repoRel(objectPath),
    unresolved_fields: [],
    human_gates: ["none"],
    execution_owner: "MirrorSmoke@Betsy",
    next_action: "Write a legacy Nerdkle receipt and mirror it into the organism contract store.",
    evidence_required: [
      "canonical organism packet write exists",
      "canonical organism receipt write exists",
      "packet_receipted event joins packet_id and receipt_id",
    ],
    failure_condition: "Stop if any canonical contract write is schema-invalid.",
    created_at: new Date().toISOString(),
  };
  await writeJson(objectPath, object);
  await mkdir(path.dirname(packetPath), { recursive: true });
  await writeFile(
    packetPath,
    [
      "# TO_MIRROR_SMOKE - Nerdkle Execution Packet",
      "",
      `Object ID: ${object.id}`,
      `Object path: ${repoRel(objectPath)}`,
      "Return proof through the Nerdkle receipt mirror.",
      "",
    ].join("\n"),
    "utf8",
  );

  const packetMirror = await mirror.writeNerdkleOrganismPacketRecord({
    object,
    object_path: objectPath,
    packet_path: packetPath,
  });

  const legacyReceipt = {
    id: path.basename(legacyReceiptPath, ".json"),
    object_id: object.id,
    pass: true,
    outcome: "Fixture Nerdkle work completed and artifact read back.",
    artifact_path: repoRel(objectPath),
    notes: "Smoke fixture only; proves contract mirroring, not external delivery.",
    object_hash: sha256(JSON.stringify(object)),
    created_at: new Date().toISOString(),
  };
  await writeJson(legacyReceiptPath, legacyReceipt);

  const receiptMirror = await mirror.writeNerdkleOrganismReceiptRecord({
    object,
    object_path: objectPath,
    legacy_receipt: legacyReceipt,
    legacy_receipt_path: legacyReceiptPath,
  });

  assertPass(packetMirror.contract_write.ok === true, "packet mirror contract write failed");
  assertPass(receiptMirror.contract_write.ok === true, "receipt mirror contract write failed");
  assertPass(packetMirror.contract_write.packet_id === receiptMirror.contract_write.packet_id, "packet/receipt mirror packet_id mismatch");

  const contractPacket = await readJson(packetMirror.contract_write.artifact_path);
  const contractReceipt = await readJson(receiptMirror.contract_write.artifact_path);
  assertPass(contractPacket.schema === "harvey_nerdkle_packet_v0", "contract packet schema mismatch");
  assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "contract receipt schema mismatch");
  assertPass(contractReceipt.status === "completed", "contract receipt did not stay completed for existing artifact");
  assertPass(contractReceipt.packet_id === contractPacket.packet_id, "contract receipt packet_id mismatch");
  assertPass(
    contractReceipt.proof.some((proof) => proof.value.includes(repoRel(legacyReceiptPath))),
    "contract receipt missing legacy receipt proof",
  );
  assertPass(
    contractReceipt.proof.some((proof) => proof.value.includes(repoRel(objectPath))),
    "contract receipt missing object artifact proof",
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
    "lib/nerdkle/organism-contract-mirror.ts",
    "lib/organism/contracts/receiver-proof-boundary.ts",
    "app/api/nerdkle/packet/route.ts",
    "app/api/nerdkle/receipt/route.ts",
    "scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
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
    schema: "BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: process.env.COMPUTERNAME || "UNKNOWN_MACHINE",
    agent: "Heimerdinker@Betsy",
    packet_id: "BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0",
    receipt_id: "BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
    validation: {
      legacy_nerdkle_object_written: true,
      organism_packet_mirror_written: true,
      legacy_nerdkle_receipt_written: true,
      organism_receipt_mirror_written: true,
      organism_receipt_status_completed_when_artifact_exists: true,
      packet_receipted_event_joins_packet_id_and_receipt_id: true,
      route_responses_expose_receiver_proof_boundary: true,
    },
    fixture_readback: {
      object_id: object.id,
      object_path: repoRel(objectPath),
      packet_path: repoRel(packetPath),
      legacy_receipt_path: repoRel(legacyReceiptPath),
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
      "This smoke proves Nerdkle legacy receipts can be mirrored into the canonical organism packet/receipt/event contract. It does not claim universal receiver proof across every route.",
    stop_conditions_respected: ["no external send", "no deploy", "no push", "fixture-only local writes"],
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

  await rm(tempRoot, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
