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
  "BOOK_ARCHITECTURE_TINKERDEN_WORKSPACE_RELAY_CONTRACT_V0_RECEIPT_20260706.json",
);
const COMPILE_FILES = [
  "lib/tinkerden/workspace-relay-contract.ts",
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/storage.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  "app/api/tinkerden/workspace-relay/route.ts",
  "app/tinkerden/page.tsx",
  "scripts/foreman/tinkerden-workspace-relay-contract-smoke.mjs",
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
    path.join(ROOT, "lib"),
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

async function latestTinkerDenRelayPacket() {
  const packetDir = path.join(ROOT, "data", "organism", "contracts", "packets");
  const names = await readdir(packetDir);
  const packets = [];

  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const relativePath = slash(path.join("data", "organism", "contracts", "packets", name));
    const packet = await readJson(relativePath);
    if (packet?.lane !== "TinkerDen packet relay") continue;
    packets.push({ packet, path: relativePath });
  }

  packets.sort((left, right) => Date.parse(right.packet.created_at) - Date.parse(left.packet.created_at));
  const latest = packets[0];
  assertPass(latest?.packet?.packet_id, "no TinkerDen packet relay contract packet exists to attach runner receipt smoke");
  assertPass(Array.isArray(latest.packet.source_paths) && latest.packet.source_paths[0], "latest contract packet has no source path");
  assertPass(existsSync(path.join(ROOT, latest.packet.source_paths[0])), "latest contract packet source path is missing");
  return latest;
}

async function writeRunnerFixtures(packetId, runnerReceiptId) {
  const receiptPath = path.join(ROOT, "data", "tinkerden", "receipts", `${runnerReceiptId}.json`);
  const requestPath = path.join(ROOT, "tinkerden", "machine-runner", "requests", `${runnerReceiptId}.json`);
  const now = new Date().toISOString();
  const runnerReceipt = {
    schema: "tinkerden_machine_runner_receipt_v0",
    receipt_id: runnerReceiptId,
    packet_id: packetId,
    status: "WORKSPACE_RELAY_CONTRACT_SMOKE",
    runner_mode: "fixture",
    clipboard_set: false,
    clipboard_verified: false,
    workspace_focused: false,
    timestamp: now,
    note: "Smoke fixture only. The workspace relay route was not invoked.",
  };
  const runnerRequest = {
    schema: "tinkerden_workspace_relay_request_v0",
    packet_id: packetId,
    smoke_fixture: true,
    timestamp: now,
  };

  await mkdir(path.dirname(receiptPath), { recursive: true });
  await mkdir(path.dirname(requestPath), { recursive: true });
  await writeFile(receiptPath, `${JSON.stringify(runnerReceipt, null, 2)}\n`, "utf8");
  await writeFile(requestPath, `${JSON.stringify(runnerRequest, null, 2)}\n`, "utf8");

  return {
    receipt_path: repoRel(receiptPath),
    request_path: repoRel(requestPath),
  };
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-tinkerden-workspace-relay-contract-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const { writeWorkspaceRelayRunnerContractReceipt } = require(
      path.join(outDir, "tinkerden", "workspace-relay-contract.js"),
    );
    const relayPacket = await latestTinkerDenRelayPacket();
    const runnerReceiptId = `td_receipt_workspace_relay_contract_smoke_${Date.now().toString(36)}`;
    const relayId = `td_relay_workspace_contract_smoke_${Date.now().toString(36)}`;
    const runnerFixtures = await writeRunnerFixtures(relayPacket.packet.packet_id, runnerReceiptId);

    const contractWrite = await writeWorkspaceRelayRunnerContractReceipt({
      packet_id: relayPacket.packet.packet_id,
      runner_receipt_id: runnerReceiptId,
      relay_id: relayId,
      packet_path: relayPacket.packet.source_paths[0],
      packet_relay_receipt_path: relayPacket.packet.receipt_destination,
      runner_receipt_path: runnerFixtures.receipt_path,
      receipt_path: runnerFixtures.receipt_path,
      runner_request_path: runnerFixtures.request_path,
      event_path: "data/organism/events.jsonl",
      receipt_pickup_path: "data/organism/receipt_pickup.jsonl",
      receiver: "WorkspaceRelayRunner@Betsy",
      runner_mode: "fixture",
      runner_status: "WORKSPACE_RELAY_CONTRACT_SMOKE",
      clipboard_set: false,
      clipboard_verified: false,
      workspace_focused: false,
    });

    assertPass(contractWrite.ok === true, "runner contract receipt write did not pass");
    assertPass(existsSync(path.join(ROOT, contractWrite.artifact_path)), "runner contract receipt artifact missing");

    const contractReceipt = await readJson(contractWrite.artifact_path);
    assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "contract receipt schema mismatch");
    assertPass(contractReceipt.receipt_id === runnerReceiptId, "contract receipt_id mismatch");
    assertPass(contractReceipt.packet_id === relayPacket.packet.packet_id, "contract receipt packet_id mismatch");
    assertPass(contractReceipt.status === "partial", "workspace runner receipt must remain partial");
    assertPass(
      contractReceipt.what_did_not_change.includes(
        "Receiver-side Aeye completion proof was not claimed by this workspace relay receipt.",
      ),
      "truth boundary missing",
    );
    assertPass(
      contractReceipt.proof.some((proof) => proof.kind === "readback" && proof.value.includes("downstream_receiver_proof=required")),
      "downstream receiver proof readback missing",
    );
    assertPass(Object.keys(contractReceipt.source_hashes_used).length === 1, "packet source hash missing");

    const contractEvents = await readJsonl("data/organism/contracts/events.jsonl");
    assertPass(
      contractEvents.some((event) => event.event_type === "packet_receipted" && event.receipt_id === runnerReceiptId),
      "runner contract packet_receipted event missing",
    );

    const routeSource = await readFile(path.join(ROOT, "app", "api", "tinkerden", "workspace-relay", "route.ts"), "utf8");
    const pageSource = await readFile(path.join(ROOT, "app", "tinkerden", "page.tsx"), "utf8");
    assertPass(routeSource.includes("writeWorkspaceRelayRunnerContractReceipt"), "workspace relay route does not call contract receipt writer");
    assertPass(routeSource.includes("runner_receipt: runnerContractWrite"), "workspace relay route does not return runner contract write");
    assertPass(pageSource.includes("runner contract receipt"), "TinkerDen UI does not surface runner contract receipt text");
    assertPass(pageSource.includes("contractRunnerReceiptPath"), "TinkerDen UI does not remember runner contract receipt path");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_TINKERDEN_WORKSPACE_RELAY_CONTRACT_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: relayPacket.packet.packet_id,
      receipt_id: "BOOK_ARCHITECTURE_TINKERDEN_WORKSPACE_RELAY_CONTRACT_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/tinkerden-workspace-relay-contract-smoke.mjs",
      files_changed: [
        "lib/tinkerden/workspace-relay-contract.ts",
        "app/api/tinkerden/workspace-relay/route.ts",
        "app/tinkerden/page.tsx",
        "scripts/foreman/tinkerden-workspace-relay-contract-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_WORKSPACE_RELAY_CONTRACT_V0_RECEIPT_20260706.json",
      ],
      runtime_artifacts_written: [
        runnerFixtures.receipt_path,
        runnerFixtures.request_path,
        contractWrite.artifact_path,
        contractWrite.event_path,
      ],
      validation: {
        tsc_compile: "passed",
        workspace_relay_route_calls_runner_contract_writer: true,
        workspace_relay_route_returns_runner_contract_write: true,
        ui_status_surfaces_runner_contract_receipt: true,
        runner_contract_receipt_written: true,
        runner_contract_receipt_status: contractReceipt.status,
        runner_contract_packet_receipted_event: true,
        truth_boundary: "Workspace Relay custody proof remains partial and does not claim downstream Aeye completion.",
      },
      attached_to_contract_packet: {
        packet_id: relayPacket.packet.packet_id,
        contract_packet_path: relayPacket.path,
        source_path: relayPacket.packet.source_paths[0],
      },
      runner_contract_write: contractWrite,
      contract_file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "workspace relay route not invoked",
        "no clipboard mutation",
        "no workspace focus",
      ],
      next_safe_action: "Add the next non-TinkerDen producer lane to the canonical organism contract store or start a receiver-side receipt intake path.",
    };

    await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
    await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
    const finalRaw = await readFile(RECEIPT_PATH, "utf8");

    console.log(
      JSON.stringify(
        {
          ok: true,
          packet_id: relayPacket.packet.packet_id,
          runner_receipt_id: runnerReceiptId,
          receipt_path: repoRel(RECEIPT_PATH),
          runner_contract_receipt_path: contractWrite.artifact_path,
          contract_event_path: contractWrite.event_path,
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
