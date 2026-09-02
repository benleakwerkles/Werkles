#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const FIXED_BUNDLE_ID = "workspace_relay_receiver_handoff_bridge_smoke_v0";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json",
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
    "lib/tinkerden/workspace-relay-receiver-handoff.ts",
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

async function writeOrganismFixturePacket(packetId, sourcePath) {
  const sourceRel = repoRel(sourcePath);
  const sourceRaw = await readFile(sourcePath);
  const packet = {
    schema: "harvey_nerdkle_packet_v0",
    packet_id: packetId,
    created_at: new Date().toISOString(),
    from: "TinkerDenWorkspaceRelay@Betsy",
    to: "Maker@Betsy",
    lane: "TinkerDen workspace relay",
    operator_intent:
      "Prove Workspace Relay can open a pending receiver-handoff return lane after custody proof.",
    source_paths: [sourceRel],
    source_hashes: {
      [sourceRel]: sha256(sourceRaw),
    },
    cwd: ROOT,
    requested_action:
      "Hand the workspace relay packet to the receiver and require a non-template returned receipt before claiming work completion.",
    allowed_actions: ["read", "write", "dispatch_packet", "readback"],
    forbidden_actions: ["deploy", "push", "secret_access", "production_mutation"],
    stop_conditions: ["receiver_receipt_missing", "source_missing", "contract_schema_invalid"],
    acceptance_criteria: [
      "Workspace relay custody packet is mirrored into the organism contract store.",
      "Receiver handoff bundle is created.",
      "Receipt template remains blocked until receiver proof is returned.",
    ],
    receipt_required: true,
    receipt_destination: "data/organism/contracts/receipts",
    idempotency_key: `workspace-relay-handoff-smoke:${packetId}`,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  const packetPath = path.join(ROOT, "data", "organism", "contracts", "packets", `${packetId}.json`);
  await writeJson(packetPath, packet);
  return {
    packet,
    packet_path: repoRel(packetPath),
  };
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-workspace-relay-handoff-bridge-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = compileBridge(outDir);
    const require = createRequire(import.meta.url);
    const bridge = require(path.join(outDir, "lib", "tinkerden", "workspace-relay-receiver-handoff.js"));

    const id = `BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0_${stamp()}`;
    const packetId = `workspace_relay_handoff_${safeId(id).toLowerCase()}`;
    const relayId = `workspace_relay_handoff_bridge_${stamp()}`;
    const fixtureSourcePath = path.join(
      ROOT,
      "data",
      "tinkerden",
      "executions",
      `${packetId}.json`,
    );
    await writeJson(fixtureSourcePath, {
      schema: "workspace_relay_receiver_handoff_bridge_fixture_v0",
      packet_id: packetId,
      relay_id: relayId,
      receiver: "Maker@Betsy",
      truth_boundary: "fixture custody only; receiver work proof requires handoff return",
      created_at: new Date().toISOString(),
    });
    const organismPacket = await writeOrganismFixturePacket(packetId, fixtureSourcePath);
    const handoff = await bridge.createWorkspaceRelayReceiverHandoffBundle({
      packet_id: packetId,
      relay_id: relayId,
      receiver: "Maker@Betsy",
      bundle_id: FIXED_BUNDLE_ID,
    });

    assertPass(handoff.packet_id === packetId, "handoff packet id mismatch");
    assertPass(handoff.relay_id === relayId, "handoff relay id mismatch");
    assertPass(handoff.receipt_template_status === "blocked", "handoff template status is not blocked");
    assertPass(handoff.receipt_template_blocked_reason === "TEMPLATE_NOT_FILLED", "handoff template blocked reason mismatch");
    assertPass(handoff.receiver_work_proof_status === "pending_receiver_return", "handoff did not stay pending receiver return");

    const manifest = await readJson(handoff.manifest_path);
    const template = await readJson(handoff.receipt_template_path);
    const returnedReceiptPath = path.join(ROOT, handoff.bundle_dir, "returned-receipt.json");
    assertPass(manifest.packet_id === packetId, "manifest packet id mismatch");
    assertPass(template.status === "blocked", "template status mismatch");
    assertPass(template.blocked_reason === "TEMPLATE_NOT_FILLED", "template blocked reason mismatch");
    assertPass(template.what_changed.includes("TEMPLATE_NOT_FILLED"), "template missing TEMPLATE_NOT_FILLED marker");
    assertPass(!(await exists(returnedReceiptPath)), "workspace relay bridge smoke should not create returned-receipt.json");

    const sourceFiles = [
      "lib/tinkerden/workspace-relay-receiver-handoff.ts",
      "app/api/tinkerden/workspace-relay/route.ts",
      "lib/organism/contracts/receiver-handoff-bundle.ts",
      "scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
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
      schema: "BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: process.env.COMPUTERNAME || "UNKNOWN_MACHINE",
      agent: "Heimerdinker@Betsy",
      packet_id: "BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0",
      receipt_id: "BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
      validation: {
        workspace_relay_organism_packet_fixture_written: true,
        receiver_handoff_bundle_created: true,
        receiver_handoff_template_blocked: true,
        receiver_handoff_template_not_filled: true,
        receiver_handoff_return_not_created: true,
        receiver_work_completion_not_claimed: true,
        fixed_bundle_id_prevents_count_growth_on_repeated_runs: true,
      },
      fixture_readback: {
        relay_id: relayId,
        organism_packet_id: packetId,
        organism_packet_path: organismPacket.packet_path,
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
        "This smoke proves Workspace Relay can create a pending receiver-handoff return lane. The generated receipt template is blocked and is not receiver work completion proof.",
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
