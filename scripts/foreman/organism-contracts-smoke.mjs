#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json");
const CONTRACT_FILES = [
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/gate.ts",
  "lib/organism/contracts/boot-context.ts",
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
    ...CONTRACT_FILES,
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
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

async function fileHashes() {
  const entries = [];
  for (const relativePath of CONTRACT_FILES) {
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
  const tempRoot = path.join(os.tmpdir(), `werkles-organism-contracts-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const packet = require(path.join(outDir, "packet.js"));
    const receipt = require(path.join(outDir, "receipt.js"));
    const event = require(path.join(outDir, "event.js"));
    const gate = require(path.join(outDir, "gate.js"));
    const boot = require(path.join(outDir, "boot-context.js"));

    const now = new Date().toISOString();
    const packetId = "BOOK_ARCHITECTURE_CONTRACT_CANON_V0";
    const receiptId = "BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706";

    const validPacket = {
      schema: packet.HARVEY_NERDKLE_PACKET_SCHEMA,
      packet_id: packetId,
      created_at: now,
      from: "Ben@Betsy",
      to: "Heimerdinker@Betsy",
      lane: "Harvey/Nerdkle architecture",
      operator_intent: "Create shared organism contracts for packet, receipt, event, gate, and boot context.",
      source_paths: ["foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md"],
      source_hashes: {
        "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md": "822769D5BA324F57618107868567BFADACAB200A9AADECBA12D29AB9B8D1D7BF",
      },
      cwd: ROOT,
      requested_action: "Implement contract canon and smoke test.",
      allowed_actions: ["read", "write", "run_safe_command", "readback"],
      forbidden_actions: ["deploy", "push", "enter_secret", "production_mutation"],
      stop_conditions: ["source_missing", "gate_required", "breach_risk"],
      acceptance_criteria: ["Valid packet parses.", "Invalid packet returns SCHEMA_INVALID.", "Receipt requires packet_id and terminal status.", "Event can join packet_id and receipt_id.", "Smoke test writes a receipt."],
      receipt_required: true,
      receipt_destination: "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json",
      idempotency_key: "book-architecture-contract-canon-v0-20260706",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const invalidPacket = {
      schema: packet.HARVEY_NERDKLE_PACKET_SCHEMA,
      packet_id: packetId,
      receipt_required: false,
    };

    const validReceipt = {
      schema: receipt.HARVEY_NERDKLE_RECEIPT_SCHEMA,
      receipt_id: receiptId,
      packet_id: packetId,
      created_at: now,
      receiver: "Heimerdinker@Betsy",
      status: "completed",
      what_was_attempted: "Create and validate contract canon files.",
      what_changed: [...CONTRACT_FILES, "scripts/foreman/organism-contracts-smoke.mjs", "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json"],
      what_did_not_change: ["No deploy.", "No push.", "No secrets.", "No production mutation."],
      proof: [{ kind: "artifact_path", value: "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json" }],
      blocked_reason: null,
      next_safe_action: "Wire contract validators into packet and receipt write paths.",
      source_hashes_used: validPacket.source_hashes,
    };

    const validEvent = {
      schema: event.HARVEY_NERDKLE_EVENT_SCHEMA,
      event_id: stampId("organism_contract_event"),
      timestamp: now,
      event_type: "packet_receipted",
      source_path: "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json",
      sha256: "PENDING_RECEIPT_HASH_WRITTEN_AFTER_VALIDATION",
      packet_id: packetId,
      receipt_id: receiptId,
      detected_by: "organism-contracts-smoke",
      destination_guess: "foreman_receipts",
    };

    const validGate = {
      schema: gate.HARVEY_NERDKLE_GATE_SCHEMA,
      gate_id: "contract_canon_local_safe_gate",
      packet_id: packetId,
      evaluated_at: now,
      tier: "no_gate_required",
      decision: "allow",
      reason: "Local contract files and smoke receipt only; no deploy, push, secrets, production mutation, or external send.",
      allowed_actions: ["read", "write", "run_safe_command"],
      denied_actions: ["deploy", "push", "enter_secret", "production_mutation"],
      human_gate_required: false,
      receipt_required: true,
      next_safe_action: "Run local smoke test and record receipt.",
    };

    const validBootContext = {
      schema: boot.HARVEY_NERDKLE_BOOT_CONTEXT_SCHEMA,
      generated_at: now,
      aeye: "Heimerdinker",
      machine: "Betsy",
      source_truth_pointer: "foreman/source-truth/LOCAL_SOURCE_TRUTH_POINTER.json",
      doctrine_paths: ["docs/tinkularity/PEARL_0000_THE_TINKULARITY.md"],
      frontier_paths: ["docs/tinkularity/ORGANISM_FRONTIER.md"],
      local_readback_path: "foreman/source-truth/readbacks/BETSY_LOCAL_SOURCE_TRUTH_READBACK.json",
      world_state_path: "tinkarden/nervous_system/world_state.json",
      world_state_status: "fresh",
      active_packet_ids: [packetId],
      recent_receipt_ids: [receiptId],
      speaker_bootpack_path: "speaker/bootpacks/out/Heimerdinker.Betsy.BOOTPACK.md",
      forbidden_actions: ["deploy", "push", "enter_secret", "production_mutation"],
      human_gates: ["deploy", "push", "secrets", "production data"],
    };

    const validPacketResult = packet.validateOrganismPacket(validPacket);
    const invalidPacketResult = packet.validateOrganismPacket(invalidPacket);
    const validReceiptResult = receipt.validateOrganismReceipt(validReceipt);
    const validEventResult = event.validateOrganismEvent(validEvent);
    const validGateResult = gate.validateOrganismGate(validGate);
    const validBootResult = boot.validateOrganismBootContext(validBootContext);

    assertPass(validPacketResult.ok, "valid packet did not parse");
    assertPass(!invalidPacketResult.ok && invalidPacketResult.code === "SCHEMA_INVALID", "invalid packet did not return SCHEMA_INVALID");
    assertPass(validReceiptResult.ok, "valid receipt did not parse");
    assertPass(validReceiptResult.value.packet_id === packetId, "receipt did not preserve packet_id");
    assertPass(receipt.validateOrganismReceipt({ ...validReceipt, packet_id: "" }).ok === false, "receipt without packet_id should fail");
    assertPass(receipt.validateOrganismReceipt({ ...validReceipt, status: "" }).ok === false, "receipt without terminal status should fail");
    assertPass(validEventResult.ok && event.eventJoinsPacketAndReceipt(validEventResult.value), "event did not join packet_id and receipt_id");
    assertPass(validGateResult.ok, "valid gate did not parse");
    assertPass(validBootResult.ok && boot.isBootContextUsable(validBootResult.value), "valid boot context was not usable");

    const hashes = await fileHashes();
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: packetId,
      receipt_id: receiptId,
      repo: ROOT,
      command: "node scripts/foreman/organism-contracts-smoke.mjs",
      files_changed: [...CONTRACT_FILES, "scripts/foreman/organism-contracts-smoke.mjs", "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json"],
      validation: {
        tsc_compile: "passed",
        valid_packet_parses: true,
        invalid_packet_returns_schema_invalid: true,
        receipt_requires_packet_id: true,
        receipt_requires_terminal_status: true,
        event_joins_packet_id_and_receipt_id: true,
        gate_parses: true,
        boot_context_parses_and_is_usable: true,
      },
      contract_file_hashes: hashes,
      compile,
      next_safe_action: "Wire contract validators into packet and receipt write paths.",
      stop_conditions_respected: ["no deploy", "no push", "no secrets", "no production mutation"],
    };

    outputReceipt.self_sha256_pending = sha256(JSON.stringify(outputReceipt));
    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");

    const finalRaw = await readFile(RECEIPT_PATH, "utf8");
    const result = {
      ok: true,
      packet_id: packetId,
      receipt_id: receiptId,
      receipt_path: repoRel(RECEIPT_PATH),
      receipt_sha256: sha256(finalRaw),
      validation: outputReceipt.validation,
      files_changed: outputReceipt.files_changed,
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
