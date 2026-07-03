#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SOURCE_ID = "github-nmclr-proof-body-preserve-v0-20260627";
const MATERIALIZED_ROOT = `foreman/nerdkle/source_intake/materialized/${SOURCE_ID}`;
const SOURCE_BUILD_DIR = `${MATERIALIZED_ROOT}/files/NMCLR/spec/build`;
const OUTPUT_PATH = "foreman/artifacts/nmclr_sandbox_execution_status.json";
const RUNS_ROOT = "foreman/artifacts/nmclr_sandbox_execution";

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function fileSummary(filePath, rootDir) {
  const stat = fs.statSync(filePath);
  return {
    path: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    relative_to_run_build: rootDir ? path.relative(rootDir, filePath).replace(/\\/g, "/") : null,
    byte_count: stat.size,
    sha256: sha256File(filePath),
  };
}

function runId() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function copyBuildTree(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`missing materialized NMCLR build directory: ${sourceDir}`);
  }
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function runNode(scriptPath, cwd, args = []) {
  const result = spawnSync("node", [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing ${label}: ${filePath}`);
  }
}

function validateCausalChain({ packetPath, workPath, receiptPath, nextWorkPath, buildDir }) {
  const packet = readJson(packetPath);
  const work = readJson(workPath);
  const receipt = readJson(receiptPath);
  const nextWork = readJson(nextWorkPath);
  const receiptRel = path.relative(buildDir, receiptPath).replace(/\\/g, "/");
  const missing = [];

  if (work.caused_by_packet !== packet.id) missing.push("work.caused_by_packet");
  if (receipt.packet_id !== packet.id) missing.push("receipt.packet_id");
  if (receipt.output?.work_item?.id !== work.id) missing.push("receipt.output.work_item.id");
  if (nextWork.source_receipt !== receiptRel) {
    missing.push("next_work.source_receipt");
  }
  if (receipt.pass !== true) missing.push("receipt.pass");
  if (nextWork.status !== "queued") missing.push("next_work.status");

  return {
    pass: missing.length === 0,
    missing,
    packet_id: packet.id,
    work_id: work.id,
    receipt_id: receipt.id,
    next_work_id: nextWork.id,
  };
}

function validateMovementChain({ packetPath, artifactPath, receiptPath }) {
  const packet = readJson(packetPath);
  const artifact = readJson(artifactPath);
  const receipt = readJson(receiptPath);
  const missing = [];

  if (receipt.packet_id !== packet.id) missing.push("receipt.packet_id");
  if (receipt.work_id !== packet.work.id) missing.push("receipt.work_id");
  if (receipt.pass !== true) missing.push("receipt.pass");
  if (artifact.result !== packet.work.body.result) missing.push("artifact.result");

  return {
    pass: missing.length === 0,
    missing,
    packet_id: packet.id,
    work_id: packet.work.id,
    receipt_id: receipt.id,
  };
}

function writeSandboxFirstSlicePacket(buildDir) {
  const packetPath = path.join(buildDir, "fixtures", "packet-first-slice-sandbox-001.json");
  const packet = {
    id: "packet-first-slice-sandbox-001",
    cause: {
      type: "sandbox_execution_proof",
      source: "Q1_NMCLR_SANDBOX_EXECUTION_PROOF",
    },
    action: {
      type: "write_work_item",
      work: {
        id: "work-first-slice-sandbox-action",
        title: "Sandbox NMCLR first-slice execution proof",
      },
    },
  };
  writeJson(packetPath, packet);
  return packetPath;
}

function main() {
  const id = `nmclr-sandbox-${runId()}`;
  const runRoot = abs(path.join(RUNS_ROOT, id));
  const buildDir = path.join(runRoot, "NMCLR", "spec", "build");
  copyBuildTree(abs(SOURCE_BUILD_DIR), buildDir);

  const firstSliceScriptPath = path.join(buildDir, "nmclr-first-slice.mjs");
  const firstMovementScriptPath = path.join(buildDir, "first_movement.mjs");
  const movementFixturePath = path.join(buildDir, "fixtures", "packet-causes-action.json");
  const firstSlicePacketPath = writeSandboxFirstSlicePacket(buildDir);
  assertFile(firstSliceScriptPath, "NMCLR first-slice script");
  assertFile(firstMovementScriptPath, "NMCLR first-movement script");
  assertFile(movementFixturePath, "NMCLR first-movement fixture");

  const firstSliceSyntaxResult = spawnSync("node", ["--check", firstSliceScriptPath], {
    cwd: buildDir,
    encoding: "utf8",
    windowsHide: true,
  });
  const firstMovementSyntaxResult = spawnSync("node", ["--check", firstMovementScriptPath], {
    cwd: buildDir,
    encoding: "utf8",
    windowsHide: true,
  });
  if (firstSliceSyntaxResult.status !== 0) {
    throw new Error(`node --check nmclr-first-slice failed: ${(firstSliceSyntaxResult.stderr || firstSliceSyntaxResult.stdout).trim()}`);
  }
  if (firstMovementSyntaxResult.status !== 0) {
    throw new Error(`node --check first_movement failed: ${(firstMovementSyntaxResult.stderr || firstMovementSyntaxResult.stdout).trim()}`);
  }

  const movementExecution = runNode(firstMovementScriptPath, buildDir);
  if (movementExecution.status !== 0) {
    throw new Error(`NMCLR first movement failed: ${(movementExecution.stderr || movementExecution.stdout).trim()}`);
  }
  const firstSliceExecution = runNode(firstSliceScriptPath, buildDir, [firstSlicePacketPath]);
  if (firstSliceExecution.status !== 0) {
    throw new Error(`NMCLR first slice failed: ${(firstSliceExecution.stderr || firstSliceExecution.stdout).trim()}`);
  }

  const movementSummary = JSON.parse(movementExecution.stdout);
  const firstSliceSummary = JSON.parse(firstSliceExecution.stdout);
  const movementArtifactPath = path.join(buildDir, "artifacts", "first-artifact.json");
  const movementReceiptPath = path.join(buildDir, "receipts", "receipt-packet-first-movement-001.json");
  assertFile(movementArtifactPath, "first movement artifact");
  assertFile(movementReceiptPath, "first movement receipt");

  const packetPath = firstSlicePacketPath;
  const sandboxWorkPath = path.join(buildDir, "work", "work-first-slice-sandbox-action.json");
  const receiptPath = path.join(buildDir, "receipts", "receipt-packet-first-slice-sandbox-001.json");
  const nextWorkPath = path.join(buildDir, "work", "next-work-from-receipt.json");
  for (const [filePath, label] of [
    [sandboxWorkPath, "work item"],
    [receiptPath, "receipt"],
    [nextWorkPath, "next work"],
  ]) {
    assertFile(filePath, label);
  }

  const causalChain = validateCausalChain({
    packetPath,
    workPath: sandboxWorkPath,
    receiptPath,
    nextWorkPath,
    buildDir,
  });
  const movementChain = validateMovementChain({
    packetPath: movementFixturePath,
    artifactPath: movementArtifactPath,
    receiptPath: movementReceiptPath,
  });
  const files = {
    first_movement_packet: fileSummary(movementFixturePath, buildDir),
    first_movement_artifact: fileSummary(movementArtifactPath, buildDir),
    first_movement_receipt: fileSummary(movementReceiptPath, buildDir),
    first_slice_packet: fileSummary(packetPath, buildDir),
    first_slice_work: fileSummary(sandboxWorkPath, buildDir),
    first_slice_receipt: fileSummary(receiptPath, buildDir),
    first_slice_next_work: fileSummary(nextWorkPath, buildDir),
  };
  const pass = causalChain.pass && movementChain.pass;
  const report = {
    artifact_id: "NMCLR_SANDBOX_EXECUTION_PROOF",
    run_id: id,
    generated_at: new Date().toISOString(),
    status: pass ? "PASS_NMCLR_SANDBOX_EXECUTION_PROOF" : "FAIL_NMCLR_SANDBOX_EXECUTION_PROOF",
    rule: "Sandbox proof only. This executes a copied materialized GitHub review-branch snapshot and does not promote NMCLR into live root.",
    source_id: SOURCE_ID,
    source_build_dir: SOURCE_BUILD_DIR,
    run_root: path.relative(ROOT, runRoot).replace(/\\/g, "/"),
    build_dir: path.relative(ROOT, buildDir).replace(/\\/g, "/"),
    syntax_check: {
      commands: [
        "node --check first_movement.mjs",
        "node --check nmclr-first-slice.mjs",
      ],
      status: firstMovementSyntaxResult.status === 0 && firstSliceSyntaxResult.status === 0 ? "PASS" : "FAIL",
    },
    execution: {
      commands: [
        "node first_movement.mjs",
        "node nmclr-first-slice.mjs fixtures/packet-first-slice-sandbox-001.json",
      ],
      status: movementExecution.status === 0 && firstSliceExecution.status === 0 ? "PASS" : "FAIL",
      stdout: {
        first_movement: movementSummary,
        first_slice: firstSliceSummary,
      },
    },
    causal_chain: causalChain,
    movement_chain: movementChain,
    files,
    forbidden_observed: {
      promoted_to_live_root: false,
      git_branch_promoted: false,
      production_data_mutated: false,
    },
  };

  writeJson(path.join(runRoot, "NMCLR_SANDBOX_EXECUTION_PROOF.json"), report);
  writeJson(abs(OUTPUT_PATH), report);
  console.log(`${report.status}: wrote ${OUTPUT_PATH}`);
  console.log(`run_id=${report.run_id} packet=${causalChain.packet_id} receipt=${causalChain.receipt_id}`);

  if (!pass) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
