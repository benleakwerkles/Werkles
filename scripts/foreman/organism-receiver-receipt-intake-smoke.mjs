#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_V0_RECEIPT_20260706.json",
);
const ROUTE_PATH = "app/api/organism/contracts/receiver-receipts/route.ts";
const COMPILE_FILES = [
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/storage.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  ROUTE_PATH,
  "scripts/foreman/organism-receiver-receipt-intake-smoke.mjs",
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

function runTsc(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    ...COMPILE_FILES,
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
  assertPass(latest?.packet?.packet_id, "no TinkerDen contract packet exists for receiver intake smoke");
  assertPass(existsSync(path.join(ROOT, latest.path)), "latest contract packet artifact is missing");
  return latest;
}

function receiverReceiptFor({ packet, packetPath, packetHash, receiptId }) {
  return {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: packet.packet_id,
    created_at: new Date().toISOString(),
    receiver: "ReceiverAeyeFixture@Betsy",
    status: "partial",
    what_was_attempted:
      "Prove that a receiving Aeye can return a canonical Harvey/Nerdkle receipt through the receiver receipt intake contract.",
    what_changed: [
      `data/organism/contracts/receipts/${receiptId}.json`,
      "data/organism/contracts/events.jsonl",
    ],
    what_did_not_change: [
      "This smoke did not claim real downstream Aeye task completion.",
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
        kind: "readback",
        value: "receiver receipt intake accepts schema-valid proof and writes a packet_receipted event; downstream_receiver_proof=fixture",
      },
    ],
    blocked_reason: null,
    next_safe_action: "Have a real receiving Aeye POST its receipt to /api/organism/contracts/receiver-receipts.",
    source_hashes_used: {
      [packetPath]: packetHash,
    },
  };
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-receiver-receipt-intake-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const { writeOrganismReceiptRecord } = require(path.join(outDir, "storage.js"));
    const latest = await latestTinkerDenContractPacket();
    const packetRaw = await readFile(path.join(ROOT, latest.path));
    const packetHash = sha256(packetRaw);
    const receiverReceiptId = `receiver_receipt_intake_smoke_${Date.now().toString(36)}`;
    const receiverReceipt = receiverReceiptFor({
      packet: latest.packet,
      packetPath: latest.path,
      packetHash,
      receiptId: receiverReceiptId,
    });
    const write = await writeOrganismReceiptRecord(receiverReceipt, {
      detected_by: "ReceiverReceiptIntakeSmoke@Betsy",
    });

    assertPass(write.ok === true, "receiver receipt intake write did not pass");
    assertPass(existsSync(path.join(ROOT, write.path)), "receiver receipt contract artifact missing");

    const writtenReceipt = await readJson(write.path);
    assertPass(writtenReceipt.schema === "harvey_nerdkle_receipt_v0", "written receipt schema mismatch");
    assertPass(writtenReceipt.receipt_id === receiverReceiptId, "written receipt_id mismatch");
    assertPass(writtenReceipt.packet_id === latest.packet.packet_id, "written receipt packet_id mismatch");
    assertPass(writtenReceipt.status === "partial", "receiver smoke receipt must remain partial");
    assertPass(
      writtenReceipt.what_did_not_change.includes("This smoke did not claim real downstream Aeye task completion."),
      "truth boundary missing",
    );

    const events = await readJsonl("data/organism/contracts/events.jsonl");
    assertPass(
      events.some((event) => event.event_type === "packet_receipted" && event.receipt_id === receiverReceiptId),
      "receiver receipt packet_receipted event missing",
    );

    const routeSource = await readFile(path.join(ROOT, ROUTE_PATH), "utf8");
    assertPass(routeSource.includes("writeOrganismReceiptRecord"), "receiver receipt route does not call contract writer");
    assertPass(routeSource.includes("SCHEMA_INVALID"), "receiver receipt route does not expose schema invalid state");
    assertPass(routeSource.includes("contract_write"), "receiver receipt route does not return contract_write");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: latest.packet.packet_id,
      receipt_id: "BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/organism-receiver-receipt-intake-smoke.mjs",
      files_changed: [
        ROUTE_PATH,
        "scripts/foreman/organism-receiver-receipt-intake-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_RECEIPT_INTAKE_V0_RECEIPT_20260706.json",
      ],
      runtime_artifacts_written: [
        write.path,
        write.event_path,
      ],
      validation: {
        tsc_compile: "passed",
        receiver_receipt_route_exists: true,
        receiver_receipt_route_calls_contract_writer: true,
        receiver_receipt_route_returns_contract_write: true,
        receiver_receipt_route_exposes_schema_invalid: true,
        receiver_receipt_written: true,
        receiver_receipt_status: writtenReceipt.status,
        packet_receipted_event_written: true,
        truth_boundary: "Receiver intake exists, but the smoke receipt remains fixture proof rather than real downstream completion.",
      },
      attached_to_contract_packet: {
        packet_id: latest.packet.packet_id,
        contract_packet_path: latest.path,
        lane: latest.packet.lane,
      },
      receiver_contract_write: {
        ok: true,
        artifact_path: write.path,
        event_path: write.event_path,
        sha256: write.sha256,
      },
      contract_file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "no account automation",
        "no browser credential control",
      ],
      next_safe_action: "Wire a real receiver client or separate Codex thread to POST its receipt to the intake route.",
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          packet_id: latest.packet.packet_id,
          receiver_receipt_id: receiverReceiptId,
          receipt_path: repoRel(RECEIPT_PATH),
          receiver_contract_receipt_path: write.path,
          contract_event_path: write.event_path,
          receipt_sha256: sha256(finalRaw),
          validation: outputReceipt.validation,
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
