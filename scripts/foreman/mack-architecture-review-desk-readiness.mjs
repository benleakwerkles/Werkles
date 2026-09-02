#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT_20260706.json",
);
const NEXT_BUILD_PACKET_PATH = path.join(
  ROOT,
  "foreman",
  "source_material",
  "manuscript_workbench",
  "tinkularity",
  "architecture",
  "MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md",
);

const REQUIRED_ARTIFACTS = [
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.docx",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.html",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.json",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.mmd",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.json",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
  "scripts/foreman/mack-architecture-scorecard-return-validator.mjs",
  "scripts/foreman/mack-architecture-scorecard-return-validator-smoke.mjs",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.docx",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.docx",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_STACK_LOCK_V0_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/BEN_PRE_MACK_ARCHITECTURE_BRIEF_AND_AEYE_INPUT_20260706.md",
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/gate.ts",
  "lib/organism/contracts/boot-context.ts",
  "lib/organism/contracts/receiver-proof-boundary.ts",
  "scripts/foreman/organism-contracts-smoke.mjs",
  "scripts/foreman/chokidar-neurocirculymphatic-v0.mjs",
  "scripts/foreman/organism-event-spine-normalization-smoke.mjs",
  "scripts/foreman/organism-boot-context-refresh-smoke.mjs",
  "scripts/foreman/wormeyes-world-state.mjs",
  "tinkarden/nervous_system/bootloader.js",
  "tinkarden/nervous_system/aeye_client.js",
  "tinkarden/nervous_system/world_state.json",
  "tinkarden/nervous_system/active_context.txt",
  "lib/nerdkle/organism-contract-mirror.ts",
  "scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
  "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
  "scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
  "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
  "scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
  "lib/tinkerden/workspace-relay-receiver-handoff.ts",
  "scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_TEMPLATE_20260706.md",
  "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  "foreman/handoffs/outbox/TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md",
  "scripts/foreman/Open-MackArchitectureReviewDesk.ps1",
  "scripts/foreman/mack-architecture-return-intake-validator.mjs",
  "scripts/foreman/mack-architecture-return-intake-validator-smoke.mjs",
  "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1",
  "scripts/foreman/Test-MackArchitectureReturnClipboardImporter.ps1",
  "scripts/foreman/Receive-MackArchitectureReturn.ps1",
  "scripts/foreman/Test-MackArchitectureReturnReceiver.ps1",
  "scripts/foreman/Accept-MackArchitectureReturn.ps1",
  "scripts/foreman/Test-MackArchitectureReturnAcceptance.ps1",
  "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
  "scripts/foreman/Test-MackArchitectureReviewFlowState.ps1",
  "foreman/handoffs/inbox/mack-architecture-return-drop/README.md",
  "scripts/foreman/Process-MackArchitectureReturnDrop.ps1",
  "scripts/foreman/Test-MackArchitectureReturnDropProcessor.ps1",
  "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1",
  "scripts/foreman/Test-MackArchitectureReviewLane.ps1",
  "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1",
  "scripts/foreman/Test-MackArchitectureReturnDropWatcher.ps1",
  "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1",
  "scripts/foreman/Test-MackArchitectureReviewDeskStatus.ps1",
  "scripts/foreman/Test-MackArchitectureSendReturnRoundTrip.ps1",
  "scripts/foreman/Copy-MackArchitecturePasteBlock.ps1",
  "scripts/foreman/Test-MackArchitectureReviewDeskLauncher.ps1",
  "scripts/foreman/Test-MackArchitectureReviewDeskHealth.ps1",
  "scripts/foreman/receiver-proof-everywhere-audit.mjs",
  "scripts/foreman/build-mack-architecture-review-desk-readout.py",
  "scripts/foreman/build-mack-architecture-paste-packet.py",
];

const REQUIRED_RECEIPTS = [
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_V02_REFRESH_RECEIPT_20260706.json",
  "foreman/receipts/BEN_PRE_MACK_ARCHITECTURE_BRIEF_AND_AEYE_INPUT_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_CONNECTION_MAP_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_ATTACK_SCORECARD_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_CONTRACT_CANON_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_EVENT_SPINE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_BOOT_CONTEXT_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_TEAR_APART_RETURN_TEMPLATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_HANDOFF_RECEIPT_20260706.json",
  "foreman/receipts/MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_HANDOFF_TIGHTENING_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_VALIDATOR_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_VALIDATOR_SMOKE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_CLIPBOARD_IMPORT_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_RECEIVER_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_ACCEPTANCE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_FLOW_STATE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_DROP_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_LANE_COORDINATOR_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_DROP_WATCH_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_STATUS_REFRESH_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_BRIDGE_RECEIVER_HANDOFF_PROVENANCE_FILTER_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_TINKERDEN_RECEIVER_HANDOFF_PROVENANCE_DEEPLINK_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RECEIVER_PROOF_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_NERDKLE_MIRROR_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_SOLEDASH_MIRROR_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_SOLEDASH_HANDOFF_BRIDGE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_WORKSPACE_RELAY_HANDOFF_BRIDGE_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_RECEIPT_20260706.json",
  "foreman/receipts/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706_RECEIPT.json",
  "foreman/receipts/MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_PASTE_PACKET_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_PASTE_BLOCK_HELPER_UPDATE_RECEIPT_20260706.json",
  "foreman/receipts/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_SEND_RETURN_ROUNDTRIP_UPDATE_RECEIPT_20260706.json",
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

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

async function readText(relativePath) {
  return stripBom(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function readJsonl(relativePath) {
  const raw = await readText(relativePath);
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

async function hashRequiredFiles(relativePaths) {
  const hashes = [];
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(ROOT, relativePath);
    assertPass(existsSync(absolutePath), `REQUIRED_PATH_MISSING:${relativePath}`);
    const raw = await readFile(absolutePath);
    hashes.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: raw.byteLength,
    });
  }
  return hashes;
}

async function parseRequiredReceipts() {
  const receipts = [];
  for (const relativePath of REQUIRED_RECEIPTS) {
    const absolutePath = path.join(ROOT, relativePath);
    assertPass(existsSync(absolutePath), `REQUIRED_RECEIPT_MISSING:${relativePath}`);
    const rawBuffer = await readFile(absolutePath);
    const raw = stripBom(rawBuffer.toString("utf8"));
    const parsed = JSON.parse(raw);
    receipts.push({
      path: relativePath,
      schema: parsed.schema || "",
      status: parsed.status || "",
      receipt_id: parsed.receipt_id || "",
      sha256: sha256(rawBuffer),
    });
  }
  return receipts;
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`GET_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return result;
}

async function runCommand(command, args) {
  const result = await new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
  assertPass(result.code === 0, `COMMAND_FAILED:${command} ${args.join(" ")}:${result.stderr || result.stdout}`);
  return result;
}

async function runValidatorReadback() {
  const result = await runCommand(process.execPath, ["scripts/foreman/mack-architecture-return-intake-validator.mjs"]);
  const stdout = JSON.parse(result.stdout);
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706.json"));
  assertPass(stdout.status === "BLOCKER", "validator canonical status is not BLOCKER");
  assertPass(stdout.blocker_code === "MACK_RETURN_NOT_RECEIVED", "validator canonical blocker changed");
  assertPass(receipt.classification?.blocker_code === "MACK_RETURN_NOT_RECEIVED", "validator receipt blocker changed");
  return {
    stdout,
    receipt_status: receipt.status,
    blocker_code: receipt.classification?.blocker_code || "",
  };
}

async function runLauncherDryRun() {
  const result = await runCommand("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "scripts\\foreman\\Open-MackArchitectureReviewDesk.ps1",
    "-DryRun",
  ]);
  const readback = JSON.parse(result.stdout);
  assertPass(readback.status === "READY_TO_OPEN", "launcher dry-run not ready");
  assertPass(readback.dry_run === true, "launcher dry-run flag missing");
  assertPass(Array.isArray(readback.proof_links) && readback.proof_links.length === 2, "launcher proof link count mismatch");
  assertPass(String(readback.status_markdown || "").includes("MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"), "launcher dry-run missing status note");
  assertPass(String(readback.readout_html || "").includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html"), "launcher dry-run missing readout");
  assertPass(String(readback.connection_map_html || "").includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"), "launcher dry-run missing connection map");
  assertPass(String(readback.attack_scorecard_html || "").includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"), "launcher dry-run missing attack scorecard");
  assertPass(String(readback.paste_packet_html || "").includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html"), "launcher dry-run missing paste packet");
  assertPass(String(readback.packet_html || "").includes("BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.html"), "launcher dry-run missing packet");
  assertPass(String(readback.scorecard_intake || "").includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md"), "launcher dry-run missing scorecard intake");
  assertPass(String(readback.scorecard_validator_receipt || "").includes("MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"), "launcher dry-run missing scorecard validator receipt");
  assertPass(String(readback.status_refresh || "").includes("Update-MackArchitectureReviewDeskStatus.ps1"), "launcher dry-run missing status refresh script");
  assertPass(readback.refresh_status_requested === false, "launcher dry-run unexpectedly requested status refresh");
  assertPass(readback.refresh_status_committed === false, "launcher dry-run refreshed status by default");
  assertPass(String(readback.copy_helper || "").includes("Copy-MackArchitecturePasteBlock.ps1"), "launcher dry-run missing copy helper");
  assertPass(String(readback.copy_helper_receipt || "").includes("MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"), "launcher dry-run missing copy helper receipt");
  assertPass(readback.copy_mack_block_requested === false, "launcher dry-run unexpectedly requests Mack block copy");
  assertPass(readback.copy_mack_block_committed === false, "launcher dry-run copied Mack block");
  assertPass(Array.isArray(readback.open_order) && readback.open_order.length === 10, "launcher dry-run open order missing");
  assertPass(
    String(readback.open_order[0] || "").includes("MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"),
    "launcher dry-run does not open status note first",
  );
  assertPass(
    String(readback.open_order[1] || "").includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html"),
    "launcher dry-run does not open readout second",
  );
  assertPass(
    String(readback.open_order[2] || "").includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"),
    "launcher dry-run does not open connection map third",
  );
  assertPass(
    String(readback.open_order[3] || "").includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"),
    "launcher dry-run does not open attack scorecard fourth",
  );
  assertPass(
    String(readback.open_order[4] || "").includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html"),
    "launcher dry-run does not open paste packet fifth",
  );
  assertPass(String(readback.truth_boundary || "").includes("does not send anything to Mack"), "launcher dry-run lost no-send boundary");

  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "launcher receipt is not ARTIFACT");
  assertPass(receipt.validation?.dry_run_passed === true, "launcher receipt did not preserve dry-run proof");
  assertPass(receipt.validation?.status_note_opens_first === true, "launcher receipt does not prove status note opens first");
  assertPass(receipt.validation?.readout_opens_second === true, "launcher receipt does not prove readout opens second");
  assertPass(receipt.validation?.connection_map_opens_third === true, "launcher receipt does not prove connection map opens third");
  assertPass(receipt.validation?.attack_scorecard_opens_fourth === true, "launcher receipt does not prove attack scorecard opens fourth");
  assertPass(receipt.validation?.paste_packet_opens_fifth === true, "launcher receipt does not prove paste packet opens fifth");
  assertPass(receipt.validation?.status_refresh_requires_explicit_switch === true, "launcher receipt lost explicit status-refresh switch proof");
  assertPass(receipt.validation?.dry_run_does_not_refresh_status === true, "launcher receipt lost dry-run no-refresh proof");
  assertPass(receipt.validation?.refresh_status_dry_run_does_not_refresh_status === true, "launcher receipt lost refresh dry-run no-refresh proof");
  assertPass(receipt.validation?.copy_mack_block_requires_explicit_switch === true, "launcher receipt lost explicit copy switch proof");
  assertPass(receipt.validation?.dry_run_does_not_copy_mack_block === true, "launcher receipt lost dry-run no-copy proof");
  assertPass(
    receipt.dry_run_readback?.open_order?.[0] ===
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md",
    "launcher receipt open order does not start with status note",
  );
  assertPass(
    receipt.dry_run_readback?.open_order?.[1] ===
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html",
    "launcher receipt open order does not place readout second",
  );
  assertPass(
    receipt.dry_run_readback?.open_order?.[2] ===
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html",
    "launcher receipt open order does not place connection map third",
  );
  assertPass(
    receipt.dry_run_readback?.open_order?.[3] ===
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html",
    "launcher receipt open order does not place attack scorecard fourth",
  );
  assertPass(
    receipt.dry_run_readback?.open_order?.[4] ===
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html",
    "launcher receipt open order does not place paste packet fifth",
  );
  assertPass(receipt.dry_run_readback?.copy_mack_block_requested === false, "launcher receipt dry-run requested copy");
  assertPass(receipt.dry_run_readback?.copy_mack_block_committed === false, "launcher receipt dry-run copied Mack block");
  assertPass(receipt.dry_run_readback?.refresh_status_requested === false, "launcher receipt dry-run requested status refresh");
  assertPass(receipt.dry_run_readback?.refresh_status_committed === false, "launcher receipt dry-run refreshed status");
  assertPass(receipt.refresh_status_dry_run_readback?.refresh_status_requested === true, "launcher receipt refresh dry-run did not request status refresh");
  assertPass(receipt.refresh_status_dry_run_readback?.refresh_status_committed === false, "launcher receipt refresh dry-run refreshed status");
  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  const launcherRaw = await readFile(path.join(ROOT, "scripts/foreman/Open-MackArchitectureReviewDesk.ps1"));
  assertPass(
    receiptHashes.get("scripts/foreman/Open-MackArchitectureReviewDesk.ps1") === sha256(launcherRaw).toLowerCase(),
    "LAUNCHER_RECEIPT_HASH_STALE:scripts/foreman/Open-MackArchitectureReviewDesk.ps1",
  );

  return {
    ...readback,
    launcher_receipt_status: receipt.status,
    launcher_receipt_status_note_opens_first: true,
    launcher_receipt_readout_opens_second: true,
    launcher_receipt_connection_map_opens_third: true,
    launcher_receipt_attack_scorecard_opens_fourth: true,
    launcher_receipt_paste_packet_opens_fifth: true,
    launcher_receipt_status_refresh_requires_explicit_switch: true,
    launcher_receipt_dry_run_does_not_refresh_status: true,
    launcher_receipt_copy_mack_block_requires_explicit_switch: true,
    launcher_receipt_dry_run_does_not_copy_mack_block: true,
    launcher_receipt_hash_current: true,
  };
}

async function verifyLauncherSmokeReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Launcher smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.default_dry_run_ready === true, "Launcher smoke did not prove default dry-run ready");
  assertPass(receipt.validation?.status_note_opens_first === true, "Launcher smoke did not prove status note opens first");
  assertPass(receipt.validation?.readout_opens_second === true, "Launcher smoke did not prove readout opens second");
  assertPass(receipt.validation?.connection_map_opens_third === true, "Launcher smoke did not prove connection map opens third");
  assertPass(receipt.validation?.attack_scorecard_opens_fourth === true, "Launcher smoke did not prove attack scorecard opens fourth");
  assertPass(receipt.validation?.paste_packet_opens_fifth === true, "Launcher smoke did not prove paste packet opens fifth");
  assertPass(
    receipt.validation?.refresh_status_requires_explicit_switch === true,
    "Launcher smoke did not prove explicit refresh switch",
  );
  assertPass(
    receipt.validation?.refresh_status_dry_run_does_not_refresh === true,
    "Launcher smoke refreshed status in dry-run",
  );
  assertPass(
    receipt.validation?.copy_mack_block_requires_explicit_switch === true,
    "Launcher smoke did not prove explicit copy switch",
  );
  assertPass(receipt.validation?.copy_mack_block_dry_run_does_not_copy === true, "Launcher smoke copied in dry-run");
  assertPass(
    receipt.validation?.open_all_proof_dry_run_exposes_four_links === true,
    "Launcher smoke did not prove OpenAllProof dry-run links",
  );
  assertPass(receipt.validation?.status_note_not_mutated === true, "Launcher smoke mutated status note");
  assertPass(receipt.validation?.status_receipt_not_mutated === true, "Launcher smoke mutated status receipt");
  assertPass(receipt.validation?.copy_helper_receipt_not_mutated === true, "Launcher smoke mutated copy helper receipt");
  assertPass(receipt.validation?.no_external_send_claimed === true, "Launcher smoke falsely claims external send");
  assertPass(receipt.validation?.no_clipboard_write_by_smoke === true, "Launcher smoke wrote clipboard");

  const scenarios = new Map((receipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(scenarios.get("default-dry-run")?.refresh_status_requested === false, "Launcher smoke default requested refresh");
  assertPass(scenarios.get("default-dry-run")?.refresh_status_committed === false, "Launcher smoke default refreshed status");
  assertPass(scenarios.get("default-dry-run")?.open_order?.length === 10, "Launcher smoke default open order count mismatch");
  assertPass(
    scenarios.get("default-dry-run")?.open_order?.[2]?.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"),
    "Launcher smoke default did not open connection map third",
  );
  assertPass(
    scenarios.get("default-dry-run")?.open_order?.[3]?.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"),
    "Launcher smoke default did not open attack scorecard fourth",
  );
  assertPass(
    scenarios.get("default-dry-run")?.open_order?.[4]?.includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html"),
    "Launcher smoke default did not open paste packet fifth",
  );
  assertPass(scenarios.get("refresh-status-dry-run")?.refresh_status_requested === true, "Launcher smoke refresh did not request refresh");
  assertPass(scenarios.get("refresh-status-dry-run")?.refresh_status_committed === false, "Launcher smoke refresh dry-run committed");
  assertPass(scenarios.get("copy-mack-block-dry-run")?.copy_mack_block_requested === true, "Launcher smoke copy did not request copy");
  assertPass(scenarios.get("copy-mack-block-dry-run")?.copy_mack_block_committed === false, "Launcher smoke copy dry-run committed");
  assertPass(scenarios.get("open-all-proof-dry-run")?.proof_link_count === 4, "Launcher smoke OpenAllProof link count mismatch");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Open-MackArchitectureReviewDesk.ps1",
    "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1",
    "scripts/foreman/Test-MackArchitectureReviewDeskLauncher.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md",
    "foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json",
    "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json",
    "foreman/receipts/MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `LAUNCHER_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    default_dry_run_ready: true,
    status_note_opens_first: true,
    connection_map_opens_third: true,
    attack_scorecard_opens_fourth: true,
    paste_packet_opens_fifth: true,
    refresh_status_dry_run_does_not_refresh: true,
    copy_mack_block_dry_run_does_not_copy: true,
    open_all_proof_dry_run_exposes_four_links: true,
    status_note_not_mutated: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (receipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyHealthcheckReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT_20260706.json"));
  assertPass(receipt.schema === "MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT", "Healthcheck receipt schema mismatch");
  assertPass(receipt.status === "ARTIFACT", "Healthcheck receipt is not ARTIFACT");
  assertPass(
    String(receipt.command || "").includes("Test-MackArchitectureReviewDeskHealth.ps1"),
    "Healthcheck receipt command missing healthcheck script",
  );

  const validation = receipt.validation || {};
  for (const key of [
    "launcher_smoke_passed",
    "status_refresh_smoke_passed",
    "return_drop_watcher_smoke_passed",
    "review_lane_smoke_passed",
    "readiness_passed",
    "no_external_send_claimed",
    "no_clipboard_write_by_healthcheck",
    "no_canonical_next_build_packet_generated",
    "no_long_running_watcher_left",
  ]) {
    assertPass(validation[key] === true, `Healthcheck validation missing true flag: ${key}`);
  }
  assertPass(
    validation.typecheck_status === "SKIPPED" || validation.typecheck_status === "PASSED",
    "Healthcheck typecheck status must be SKIPPED or PASSED",
  );
  assertPass(
    String(validation.truth_boundary || "").includes("does not open windows") &&
      String(validation.truth_boundary || "").includes("send anything to Mack"),
    "Healthcheck truth boundary missing no-window/no-send statement",
  );

  const checkNames = new Set((receipt.checks || []).map((check) => check.name));
  for (const name of ["launcher-smoke", "status-refresh-smoke", "return-drop-watcher-smoke", "review-lane-smoke", "readiness"]) {
    assertPass(checkNames.has(name), `Healthcheck missing subcheck: ${name}`);
  }
  for (const check of receipt.checks || []) {
    assertPass(check.status === "ARTIFACT" || check.ok === true, `Healthcheck subcheck did not pass: ${check.name}`);
  }
  assertPass(
    (receipt.stop_conditions_respected || []).includes("no external send claim"),
    "Healthcheck stop conditions missing no external send",
  );
  assertPass(
    (receipt.stop_conditions_respected || []).includes("no clipboard write"),
    "Healthcheck stop conditions missing no clipboard write",
  );

  return {
    status: receipt.status,
    launcher_smoke_passed: true,
    status_refresh_smoke_passed: true,
    return_drop_watcher_smoke_passed: true,
    review_lane_smoke_passed: true,
    readiness_passed: true,
    typecheck_status: validation.typecheck_status,
    no_external_send_claimed: true,
    no_clipboard_write_by_healthcheck: true,
    no_canonical_next_build_packet_generated: true,
    no_long_running_watcher_left: true,
    subchecks: [...checkNames],
  };
}

async function verifyConnectionMapReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/BOOK_ARCHITECTURE_CONNECTION_MAP_RECEIPT_20260706.json"));
  assertPass(receipt.schema === "BOOK_ARCHITECTURE_CONNECTION_MAP_RECEIPT", "Connection map receipt schema mismatch");
  assertPass(receipt.status === "ARTIFACT", "Connection map receipt is not ARTIFACT");
  assertPass(receipt.validation?.markdown_written === true, "Connection map receipt missing Markdown proof");
  assertPass(receipt.validation?.html_written === true, "Connection map receipt missing HTML proof");
  assertPass(receipt.validation?.json_manifest_valid === true, "Connection map receipt missing JSON manifest proof");
  assertPass(receipt.validation?.mermaid_written === true, "Connection map receipt missing Mermaid proof");
  assertPass(receipt.validation?.index_points_to_connection_map === true, "Connection map receipt missing index proof");
  assertPass(receipt.validation?.no_mack_return_claimed === true, "Connection map receipt falsely allows Mack return claim");
  assertPass(receipt.validation?.no_external_send_claimed === true, "Connection map receipt falsely allows external send claim");
  assertPass(receipt.validation?.no_universal_receiver_proof_claimed === true, "Connection map receipt falsely allows universal proof claim");
  assertPass(receipt.validation?.no_solved_shared_cognition_claimed === true, "Connection map receipt falsely allows solved shared cognition claim");

  const manifest = JSON.parse(
    await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.json"),
  );
  assertPass(manifest.schema === "BOOK_ARCHITECTURE_CONNECTION_MAP_V0", "Connection map manifest schema mismatch");
  assertPass(Array.isArray(manifest.nodes) && manifest.nodes.length >= 10, "Connection map manifest missing nodes");
  assertPass(Array.isArray(manifest.edges) && manifest.edges.length >= 10, "Connection map manifest missing edges");
  assertPass(String(manifest.next_join || "").includes("packet_id -> gate_decision"), "Connection map manifest missing next join");
  assertPass(
    (manifest.truth_boundary?.does_not_claim || []).includes("Mack has returned a receipt"),
    "Connection map manifest missing Mack-return negative claim",
  );

  const hashes = new Map((receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]));
  for (const relativePath of [
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.json",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.mmd",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(hashes.get(relativePath) === sha256(raw).toLowerCase(), `CONNECTION_MAP_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    markdown_written: true,
    html_written: true,
    json_manifest_valid: true,
    mermaid_written: true,
    index_points_to_connection_map: true,
    file_hashes_current: true,
    node_count: manifest.nodes.length,
    edge_count: manifest.edges.length,
    no_mack_return_claimed: true,
    no_external_send_claimed: true,
    no_universal_receiver_proof_claimed: true,
    no_solved_shared_cognition_claimed: true,
  };
}

async function verifyAttackScorecardReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_ATTACK_SCORECARD_RECEIPT_20260706.json"));
  assertPass(receipt.schema === "MACK_ARCHITECTURE_ATTACK_SCORECARD_RECEIPT", "Attack scorecard receipt schema mismatch");
  assertPass(receipt.status === "ARTIFACT", "Attack scorecard receipt is not ARTIFACT");
  assertPass(receipt.validation?.markdown_written === true, "Attack scorecard receipt missing Markdown proof");
  assertPass(receipt.validation?.html_written === true, "Attack scorecard receipt missing HTML proof");
  assertPass(receipt.validation?.json_manifest_valid === true, "Attack scorecard receipt missing JSON manifest proof");
  assertPass(receipt.validation?.index_points_to_scorecard === true, "Attack scorecard receipt missing index proof");
  assertPass(receipt.validation?.unfilled_template === true, "Attack scorecard receipt should preserve unfilled template boundary");
  assertPass(receipt.validation?.no_mack_scorecard_return_claimed === true, "Attack scorecard falsely claims Mack scorecard return");
  assertPass(receipt.validation?.no_mack_review_return_claimed === true, "Attack scorecard falsely claims Mack review return");
  assertPass(receipt.validation?.ben_gate_required_for_conversion === true, "Attack scorecard missing Ben conversion gate");

  const manifest = JSON.parse(
    await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.json"),
  );
  assertPass(manifest.schema === "MACK_ARCHITECTURE_ATTACK_SCORECARD_V0", "Attack scorecard manifest schema mismatch");
  assertPass(manifest.status === "UNFILLED_TEMPLATE", "Attack scorecard manifest should remain unfilled");
  assertPass(Array.isArray(manifest.dimensions) && manifest.dimensions.length === 12, "Attack scorecard dimensions mismatch");
  assertPass(Array.isArray(manifest.fatal_flags) && manifest.fatal_flags.length >= 8, "Attack scorecard fatal flags missing");
  assertPass(manifest.return_block?.header === "MACK SCORECARD RETURN", "Attack scorecard return block header mismatch");
  assertPass(manifest.conversion_rule?.ben_gate_required === true, "Attack scorecard conversion rule missing Ben gate");
  assertPass(
    (manifest.truth_boundary?.does_not_claim || []).includes("Mack returned a review"),
    "Attack scorecard manifest missing Mack-return negative claim",
  );

  const hashes = new Map((receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]));
  for (const relativePath of [
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.json",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(hashes.get(relativePath) === sha256(raw).toLowerCase(), `ATTACK_SCORECARD_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    markdown_written: true,
    html_written: true,
    json_manifest_valid: true,
    index_points_to_scorecard: true,
    file_hashes_current: true,
    dimension_count: manifest.dimensions.length,
    fatal_flag_count: manifest.fatal_flags.length,
    unfilled_template: true,
    no_mack_scorecard_return_claimed: true,
    no_mack_review_return_claimed: true,
    ben_gate_required_for_conversion: true,
  };
}

async function verifyScorecardReturnReceipts() {
  const intakeReceipt = JSON.parse(
    await readText("foreman/receipts/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_RECEIPT_20260706.json"),
  );
  const liveReceipt = JSON.parse(
    await readText("foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"),
  );
  const smokeReceipt = JSON.parse(
    await readText("foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT_20260706.json"),
  );

  assertPass(intakeReceipt.status === "ARTIFACT", "Scorecard return intake receipt is not ARTIFACT");
  assertPass(intakeReceipt.validation?.waiting_for_mack_scorecard_return === true, "Scorecard return intake receipt missing waiting proof");
  assertPass(intakeReceipt.validation?.no_mack_scorecard_return_claimed === true, "Scorecard return intake receipt falsely claims Mack scorecard return");
  assertPass(liveReceipt.status === "BLOCKER", "Live scorecard validator should be BLOCKER while waiting");
  assertPass(
    liveReceipt.classification?.blocker_code === "MACK_SCORECARD_RETURN_NOT_RECEIVED",
    "Live scorecard validator blocker mismatch",
  );
  assertPass(liveReceipt.validation?.current_state_is_waiting === true, "Live scorecard validator missing waiting proof");
  assertPass(liveReceipt.validation?.no_fake_mack_scorecard_return_claim === true, "Live scorecard validator falsely claims scorecard return");
  assertPass(smokeReceipt.status === "ARTIFACT", "Scorecard validator smoke receipt is not ARTIFACT");
  assertPass(smokeReceipt.validation?.waiting_scorecard_not_received_blocks === true, "Scorecard smoke missing waiting blocker proof");
  assertPass(smokeReceipt.validation?.incomplete_scorecard_blocks === true, "Scorecard smoke missing incomplete blocker proof");
  assertPass(smokeReceipt.validation?.invalid_dimension_score_blocks === true, "Scorecard smoke missing invalid score blocker proof");
  assertPass(smokeReceipt.validation?.total_mismatch_blocks === true, "Scorecard smoke missing total mismatch blocker proof");
  assertPass(smokeReceipt.validation?.complete_scorecard_passes === true, "Scorecard smoke missing complete scorecard proof");
  assertPass(smokeReceipt.validation?.no_next_build_packet_generated === true, "Scorecard smoke generated a next-build packet");

  const liveHashes = new Map((liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]));
  const intakeRaw = await readFile(
    path.join(
      ROOT,
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
    ),
  );
  assertPass(
    liveHashes.get(
      "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
    ) === sha256(intakeRaw).toLowerCase(),
    "SCORECARD_RETURN_VALIDATOR_HASH_STALE:intake",
  );

  const smokeHashes = new Map((smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]));
  for (const relativePath of [
    "scripts/foreman/mack-architecture-scorecard-return-validator.mjs",
    "scripts/foreman/mack-architecture-scorecard-return-validator-smoke.mjs",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `SCORECARD_RETURN_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    intake_receipt_status: intakeReceipt.status,
    live_validator_status: liveReceipt.status,
    live_blocker_code: liveReceipt.classification?.blocker_code || "",
    smoke_receipt_status: smokeReceipt.status,
    waiting_scorecard_not_received_blocks: true,
    incomplete_scorecard_blocks: true,
    invalid_dimension_score_blocks: true,
    total_mismatch_blocks: true,
    complete_scorecard_passes: true,
    no_next_build_packet_generated: true,
    current_script_hashes_match_receipt: true,
  };
}

async function sourceReadbacks() {
  const index = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md");
  const benBrief = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BEN_PRE_MACK_ARCHITECTURE_BRIEF_AND_AEYE_INPUT_20260706.md");
  const mainPacket = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.md");
  const connectionMap = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md");
  const connectionMapHtml = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html");
  const connectionMapMermaid = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.mmd");
  const connectionMapManifest = JSON.parse(
    await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.json"),
  );
  const scorecard = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md");
  const scorecardHtml = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html");
  const scorecardManifest = JSON.parse(
    await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.json"),
  );
  const scorecardIntake = await readText(
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
  );
  const handoff = await readText("foreman/handoffs/outbox/TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md");
  const intake = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md");
  const statusNote = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md");

  assertPass(index.includes("Ben pre-Mack Aeye input brief"), "index missing Ben pre-Mack brief");
  assertPass(index.includes("Connection map Markdown"), "index missing connection map Markdown row");
  assertPass(index.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md"), "index missing connection map Markdown path");
  assertPass(index.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"), "index missing connection map HTML path");
  assertPass(index.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.json"), "index missing connection map JSON path");
  assertPass(index.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.mmd"), "index missing connection map Mermaid path");
  assertPass(index.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_RECEIPT_20260706.json"), "index missing connection map receipt");
  assertPass(index.includes("Connection Map Companion"), "index missing connection map section");
  assertPass(
    index.includes("Read `BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md` when Ben or Mack wants the actual app/language connection map."),
    "index missing connection map next human gate",
  );
  assertPass(connectionMap.includes("## Custody Spine"), "connection map missing custody spine");
  assertPass(connectionMap.includes("## Connection Contracts"), "connection map missing connection contracts");
  assertPass(connectionMap.includes("Aeyes cooperate by sharing body-state"), "connection map missing cooperation claim");
  assertPass(connectionMap.includes("Mack has not reviewed this architecture"), "connection map missing Mack-not-reviewed boundary");
  assertPass(connectionMapHtml.includes("<title>Book Architecture Connection Map</title>"), "connection map HTML title missing");
  assertPass(connectionMapHtml.includes("Truth boundary:"), "connection map HTML truth boundary missing");
  assertPass(connectionMapMermaid.includes("flowchart LR"), "connection map Mermaid missing flowchart");
  assertPass(connectionMapManifest.schema === "BOOK_ARCHITECTURE_CONNECTION_MAP_V0", "connection map JSON schema mismatch");
  assertPass(index.includes("Mack attack scorecard Markdown"), "index missing scorecard Markdown row");
  assertPass(index.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md"), "index missing scorecard Markdown path");
  assertPass(index.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"), "index missing scorecard HTML path");
  assertPass(index.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.json"), "index missing scorecard JSON path");
  assertPass(index.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_RECEIPT_20260706.json"), "index missing scorecard receipt");
  assertPass(index.includes("Mack Attack Scorecard Companion"), "index missing scorecard section");
  assertPass(
    index.includes("Read `MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md` when Ben wants Mack's critique to come back as scored attack data."),
    "index missing scorecard next human gate",
  );
  assertPass(index.includes("MACK SCORECARD RETURN"), "index missing scorecard return block boundary");
  assertPass(scorecard.includes("## Attack Dimensions"), "scorecard missing attack dimensions");
  assertPass(scorecard.includes("## Fatal Flags"), "scorecard missing fatal flags");
  assertPass(scorecard.includes("MACK SCORECARD RETURN"), "scorecard missing return block");
  assertPass(scorecard.includes("No Aeye should convert this scorecard into a next-build packet without Ben's acceptance gate."), "scorecard missing Ben conversion gate");
  assertPass(scorecard.includes("this scorecard has not been filled by Mack"), "scorecard missing unfilled Mack boundary");
  assertPass(scorecardHtml.includes("<title>Mack Architecture Attack Scorecard</title>"), "scorecard HTML title missing");
  assertPass(scorecardManifest.schema === "MACK_ARCHITECTURE_ATTACK_SCORECARD_V0", "scorecard JSON schema mismatch");
  assertPass(scorecardManifest.status === "UNFILLED_TEMPLATE", "scorecard JSON should remain unfilled");
  assertPass(Array.isArray(scorecardManifest.dimensions) && scorecardManifest.dimensions.length === 12, "scorecard JSON dimensions mismatch");
  assertPass(index.includes("Mack attack scorecard return intake"), "index missing scorecard return intake row");
  assertPass(index.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md"), "index missing scorecard return intake path");
  assertPass(index.includes("mack-architecture-scorecard-return-validator.mjs"), "index missing scorecard validator command");
  assertPass(index.includes("mack-architecture-scorecard-return-validator-smoke.mjs"), "index missing scorecard validator smoke command");
  assertPass(
    index.includes("MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"),
    "index missing scorecard validator receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT_20260706.json"),
    "index missing scorecard validator smoke receipt",
  );
  assertPass(index.includes("MACK_SCORECARD_RETURN_NOT_RECEIVED"), "index missing scorecard not-received blocker");
  assertPass(index.includes("overall_score_0_to_36` equals their sum"), "index missing scorecard sum rule");
  assertPass(
    index.includes("Paste Mack's `MACK SCORECARD RETURN` block into `MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md`"),
    "index missing scorecard next human gate",
  );
  assertPass(scorecardIntake.includes("Status: WAITING_FOR_MACK_SCORECARD_RETURN"), "scorecard intake no longer waiting");
  assertPass(scorecardIntake.includes("Mack scorecard has not been received yet."), "scorecard intake missing waiting boundary");
  assertPass(scorecardIntake.includes("overall_score_0_to_36"), "scorecard intake missing overall score field");
  assertPass(scorecardIntake.includes("Do not generate a next-build packet from scorecard data without Ben's acceptance gate."), "scorecard intake missing Ben gate");
  assertPass(index.includes("Contract Canon V0 smoke"), "index missing Contract Canon smoke");
  assertPass(index.includes("Mack review desk readout Markdown"), "index missing Mack review desk readout Markdown");
  assertPass(index.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.docx"), "index missing Mack review desk readout DOCX");
  assertPass(index.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html"), "index missing Mack review desk readout HTML");
  assertPass(index.includes("Mack review desk status Markdown"), "index missing Mack review desk status Markdown");
  assertPass(index.includes("MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"), "index missing Mack review desk status path");
  assertPass(index.includes("Mack copy/paste packet Markdown"), "index missing Mack copy/paste packet Markdown");
  assertPass(index.includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.docx"), "index missing Mack copy/paste packet DOCX");
  assertPass(index.includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html"), "index missing Mack copy/paste packet HTML");
  assertPass(index.includes("Copy-MackArchitecturePasteBlock.ps1"), "index missing Mack paste-block clipboard helper");
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_RECEIPT_20260706.json"),
    "index missing Mack review desk readout receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706_RECEIPT.json"),
    "index missing Mack copy/paste packet receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"),
    "index missing Mack paste-block clipboard helper receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_PASTE_PACKET_UPDATE_RECEIPT_20260706.json"),
    "index missing Mack copy/paste packet update receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_PASTE_BLOCK_HELPER_UPDATE_RECEIPT_20260706.json"),
    "index missing Mack paste-block helper update receipt",
  );
  assertPass(index.includes("organism-contracts-smoke.mjs"), "index missing Contract Canon smoke command");
  assertPass(index.includes("Event Spine normalization smoke"), "index missing Event Spine smoke");
  assertPass(index.includes("organism-event-spine-normalization-smoke.mjs"), "index missing Event Spine smoke command");
  assertPass(index.includes("Boot Context refresh smoke"), "index missing Boot Context smoke");
  assertPass(index.includes("organism-boot-context-refresh-smoke.mjs"), "index missing Boot Context smoke command");
  assertPass(index.includes("Mack return validator smoke"), "index missing validator smoke");
  assertPass(index.includes("Mack return clipboard importer"), "index missing clipboard importer");
  assertPass(index.includes("Mack return receive wrapper"), "index missing Mack return receive wrapper");
  assertPass(index.includes("Receive-MackArchitectureReturn.ps1"), "index missing receive wrapper command");
  assertPass(index.includes("Receive-MackArchitectureReturn.ps1 -Commit"), "index missing receive wrapper commit command");
  assertPass(index.includes("Mack return acceptance wrapper"), "index missing Mack return acceptance wrapper");
  assertPass(index.includes("Accept-MackArchitectureReturn.ps1"), "index missing acceptance wrapper command");
  assertPass(index.includes("Accept-MackArchitectureReturn.ps1 -Commit -BenAccepted"), "index missing acceptance wrapper commit command");
  assertPass(index.includes("Mack review flow state readback"), "index missing Mack review flow state readback");
  assertPass(index.includes("Get-MackArchitectureReviewFlowState.ps1"), "index missing flow-state command");
  assertPass(index.includes("Mack return drop folder"), "index missing Mack return drop folder");
  assertPass(index.includes("mack-architecture-return-drop/README.md"), "index missing Mack return drop README");
  assertPass(index.includes("Process-MackArchitectureReturnDrop.ps1"), "index missing return drop processor command");
  assertPass(index.includes("Process-MackArchitectureReturnDrop.ps1 -Commit"), "index missing return drop processor commit command");
  assertPass(index.includes("Mack review lane coordinator"), "index missing Mack review lane coordinator");
  assertPass(index.includes("Invoke-MackArchitectureReviewLane.ps1"), "index missing lane coordinator command");
  assertPass(index.includes("Invoke-MackArchitectureReviewLane.ps1 -CommitReturn"), "index missing lane coordinator return commit command");
  assertPass(
    index.includes("Invoke-MackArchitectureReviewLane.ps1 -CommitAcceptance -BenAccepted"),
    "index missing lane coordinator acceptance commit command",
  );
  assertPass(index.includes("Mack return drop watcher"), "index missing Mack return drop watcher");
  assertPass(index.includes("Watch-MackArchitectureReturnDrop.ps1 -Once"), "index missing return drop watcher once command");
  assertPass(index.includes("Test-MackArchitectureReturnDropWatcher.ps1"), "index missing return drop watcher smoke");
  assertPass(index.includes("Mack review desk status refresher"), "index missing Mack review desk status refresher");
  assertPass(index.includes("Update-MackArchitectureReviewDeskStatus.ps1"), "index missing status refresh command");
  assertPass(index.includes("Test-MackArchitectureReviewDeskStatus.ps1"), "index missing status refresh smoke");
  assertPass(index.includes("Import-MackArchitectureReturnFromClipboard.ps1 -Commit"), "index missing clipboard importer commit command");
  assertPass(index.includes("Test-MackArchitectureReturnReceiver.ps1"), "index missing receive wrapper smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT_20260706.json"),
    "index missing receive wrapper smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_RECEIVER_UPDATE_RECEIPT_20260706.json"),
    "index missing receive wrapper index update receipt",
  );
  assertPass(index.includes("Test-MackArchitectureReturnAcceptance.ps1"), "index missing acceptance wrapper smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT_20260706.json"),
    "index missing acceptance wrapper smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_ACCEPTANCE_UPDATE_RECEIPT_20260706.json"),
    "index missing acceptance wrapper index update receipt",
  );
  assertPass(index.includes("Test-MackArchitectureReviewFlowState.ps1"), "index missing flow-state smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706.json"),
    "index missing live flow-state receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT_20260706.json"),
    "index missing flow-state smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_FLOW_STATE_UPDATE_RECEIPT_20260706.json"),
    "index missing flow-state index update receipt",
  );
  assertPass(index.includes("Test-MackArchitectureReturnDropProcessor.ps1"), "index missing drop processor smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT_20260706.json"),
    "index missing live drop processor receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT_20260706.json"),
    "index missing drop processor smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_DROP_UPDATE_RECEIPT_20260706.json"),
    "index missing drop processor index update receipt",
  );
  assertPass(index.includes("Test-MackArchitectureReviewLane.ps1"), "index missing lane coordinator smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT_20260706.json"),
    "index missing live lane coordinator receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_SMOKE_RECEIPT_20260706.json"),
    "index missing lane coordinator smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_LANE_COORDINATOR_UPDATE_RECEIPT_20260706.json"),
    "index missing lane coordinator index update receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706.json"),
    "index missing live return drop watcher receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT_20260706.json"),
    "index missing return drop watcher smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_RETURN_DROP_WATCH_UPDATE_RECEIPT_20260706.json"),
    "index missing return drop watcher index update receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"),
    "index missing live status refresh receipt",
  );
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_SMOKE_RECEIPT_20260706.json"),
    "index missing status refresh smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_STATUS_REFRESH_UPDATE_RECEIPT_20260706.json"),
    "index missing status refresh index update receipt",
  );
  assertPass(index.includes("Test-MackArchitectureSendReturnRoundTrip.ps1"), "index missing send/return round-trip smoke");
  assertPass(
    index.includes("MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT_20260706.json"),
    "index missing send/return round-trip smoke receipt",
  );
  assertPass(
    index.includes("BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_SEND_RETURN_ROUNDTRIP_UPDATE_RECEIPT_20260706.json"),
    "index missing send/return round-trip index update receipt",
  );
  assertPass(
    index.includes("Copy-MackArchitecturePasteBlock.ps1 -Copy"),
    "index missing Mack paste-block helper copy command",
  );
  assertPass(index.includes("Receiver Proof Everywhere coverage audit"), "index missing Receiver Proof coverage audit");
  assertPass(index.includes("receiver-proof-everywhere-audit.mjs"), "index missing Receiver Proof coverage audit command");
  assertPass(index.includes("Receiver proof boundary vocabulary"), "index missing Receiver Proof boundary vocabulary");
  assertPass(index.includes("receiver-proof-boundary.ts"), "index missing Receiver Proof boundary helper");
  assertPass(index.includes("ARTIFACT_WITH_BLOCKERS"), "index missing Receiver Proof blockers boundary");
  assertPass(index.includes("universal receiver proof not claimed"), "index missing no-universal-proof boundary");
  assertPass(index.includes("Nerdkle organism receipt mirror smoke"), "index missing Nerdkle mirror smoke");
  assertPass(index.includes("nerdkle-organism-receipt-mirror-smoke.mjs"), "index missing Nerdkle mirror smoke command");
  assertPass(index.includes("organism_receipt_mirrored"), "index missing Nerdkle organism receipt boundary metadata");
  assertPass(index.includes("SoleDash Aeye transport mirror smoke"), "index missing SoleDash mirror smoke");
  assertPass(index.includes("soledash-aeye-transport-organism-mirror-smoke.mjs"), "index missing SoleDash mirror smoke command");
  assertPass(index.includes("transport_receipt_mirrored"), "index missing SoleDash transport receipt boundary metadata");
  assertPass(index.includes("SoleDash Aeye receiver-handoff bridge smoke"), "index missing SoleDash receiver handoff bridge smoke");
  assertPass(index.includes("soledash-aeye-receiver-handoff-bridge-smoke.mjs"), "index missing SoleDash receiver handoff bridge command");
  assertPass(index.includes("receipt template blocked TEMPLATE_NOT_FILLED"), "index missing SoleDash receiver handoff template boundary");
  assertPass(index.includes("Workspace Relay receiver-handoff bridge smoke"), "index missing Workspace Relay receiver handoff bridge smoke");
  assertPass(
    index.includes("workspace-relay-receiver-handoff-bridge-smoke.mjs"),
    "index missing Workspace Relay receiver handoff bridge command",
  );
  assertPass(index.includes("workspace relay organism packet fixture written"), "index missing Workspace Relay fixture boundary");
  assertPass(index.includes("Open-MackArchitectureReviewDesk.ps1"), "index missing launcher");
  assertPass(index.includes("Open the current status note first"), "index missing status-first launcher instruction");
  assertPass(
    index.includes("then the readout, connection map, attack scorecard, Mack copy/paste packet"),
    "index missing readout, connection-map, scorecard, and paste-packet launcher instruction",
  );
  assertPass(index.includes("Open-MackArchitectureReviewDesk.ps1 -RefreshStatus"), "index missing launcher refresh-status option");
  assertPass(index.includes("does not refresh status unless `-RefreshStatus` is explicit"), "index missing explicit status-refresh boundary");
  assertPass(index.includes("Open-MackArchitectureReviewDesk.ps1 -CopyMackBlock"), "index missing launcher copy block option");
  assertPass(index.includes("Local review desk launcher smoke"), "index missing launcher smoke");
  assertPass(index.includes("Test-MackArchitectureReviewDeskLauncher.ps1"), "index missing launcher smoke command");
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT_20260706.json"),
    "index missing launcher smoke receipt",
  );
  assertPass(index.includes("Smoke-proven launcher states"), "index missing launcher smoke-proven states");
  assertPass(index.includes("Mack review desk healthcheck"), "index missing healthcheck row");
  assertPass(index.includes("Test-MackArchitectureReviewDeskHealth.ps1"), "index missing healthcheck command");
  assertPass(index.includes("Test-MackArchitectureReviewDeskHealth.ps1 -WithTypecheck"), "index missing healthcheck typecheck command");
  assertPass(
    index.includes("MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT_20260706.json"),
    "index missing healthcheck receipt",
  );
  assertPass(index.includes("Smoke-proven healthcheck states"), "index missing healthcheck smoke-proven states");
  assertPass(
    index.includes("Read `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md` first."),
    "index missing readout-first next human gate",
  );
  assertPass(
    index.includes("Run `Test-MackArchitectureReviewDeskHealth.ps1` for safe local desk proof"),
    "index missing healthcheck next human gate",
  );
  assertPass(
    index.includes("add `-WithTypecheck` when Ben wants compiler coverage too"),
    "index missing healthcheck typecheck next human gate",
  );
  assertPass(
    index.includes("Open `MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md` as the Ben-facing copy surface."),
    "index missing paste-packet next human gate",
  );
  assertPass(
    index.includes("Run `Copy-MackArchitecturePasteBlock.ps1 -Copy` only if Ben decides"),
    "index missing paste-block helper next human gate",
  );
  assertPass(
    index.includes("Put Mack's returned `.txt` or `.md` file in `foreman/handoffs/inbox/mack-architecture-return-drop/`."),
    "index missing return-drop next human gate",
  );
  assertPass(
    index.includes("Run the lower-level `Receive-MackArchitectureReturn.ps1`, `Process-MackArchitectureReturnDrop.ps1`, or `Accept-MackArchitectureReturn.ps1` commands only when debugging a specific stage."),
    "index missing receive-wrapper fallback gate",
  );
  assertPass(
    index.includes("Run `Invoke-MackArchitectureReviewLane.ps1 -CommitAcceptance -BenAccepted` only after Ben accepts Mack's direction."),
    "index missing coordinator acceptance next human gate",
  );
  assertPass(
    index.includes("Run `Get-MackArchitectureReviewFlowState.ps1` to read the current lane state"),
    "index missing flow-state next human gate",
  );
  assertPass(
    index.includes("Run `Invoke-MackArchitectureReviewLane.ps1` for the default next safe local action."),
    "index missing lane coordinator next human gate",
  );
  assertPass(
    index.includes("Run `Watch-MackArchitectureReturnDrop.ps1 -Once` for a safe single watch tick"),
    "index missing return drop watcher next human gate",
  );
  assertPass(
    index.includes("Run `Update-MackArchitectureReviewDeskStatus.ps1` when Ben wants only the status note"),
    "index missing status refresh next human gate",
  );
  assertPass(
    index.includes("Run `Open-MackArchitectureReviewDesk.ps1 -RefreshStatus` to refresh the status note and open the desk"),
    "index missing launcher refresh-status next human gate",
  );
  assertPass(!index.includes("Read the V0.2 packet first."), "index still has stale V0.2-first next human gate");
  assertPass(index.includes("No external send has been performed"), "index missing no-send boundary");
  assertPass(
    mainPacket.includes("start with `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md`"),
    "main packet missing readout-first front door",
  );
  assertPass(benBrief.includes("The architecture is worth taking to Mack."), "Ben brief missing bottom line");
  assertPass(benBrief.includes("Desk readout: `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md`"), "Ben brief missing desk readout pointer");
  assertPass(
    benBrief.includes("Open `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md` as the desk card"),
    "Ben brief missing readout-first read order",
  );
  assertPass(benBrief.includes("MACK_RETURN_NOT_RECEIVED"), "Ben brief missing Mack-not-received boundary");
  assertPass(benBrief.includes("I would build the contract canon first."), "Ben brief missing next-build recommendation");
  assertPass(handoff.includes("STATUS: READY_TO_PASTE"), "handoff is not ready to paste");
  assertPass(handoff.includes("Read the Mack review desk readout first"), "handoff missing readout-first instruction");
  assertPass(handoff.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md"), "handoff missing readout markdown path");
  assertPass(handoff.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.docx"), "handoff missing readout docx path");
  assertPass(handoff.includes("MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html"), "handoff missing readout html path");
  assertPass(handoff.includes("MACK REVIEW RETURN"), "handoff missing return contract");
  assertPass(handoff.includes("Ben walks away for four hours"), "handoff missing four-hour no-babysitting test");
  assertPass(handoff.includes("Receiver handoffs indexed: 19."), "handoff receiver count stale");
  assertPass(handoff.includes("Synthetic smoke-proof scope retained: 18."), "handoff synthetic count stale");
  assertPass(handoff.includes("Pending receiver: 9."), "handoff pending count stale");
  assertPass(!handoff.includes("Receiver handoffs indexed: 17."), "handoff still contains stale receiver count");
  assertPass(!handoff.includes("Pending receiver: 7."), "handoff still contains stale pending count");
  assertPass(
    handoff.includes("Do not claim universal receiver proof while pending receiver-return lanes still require non-template returned receipts."),
    "handoff missing universal receiver proof boundary",
  );
  assertPass(intake.includes("Status: WAITING_FOR_MACK_RETURN"), "intake no longer waiting");
  assertPass(intake.includes("Mack review has not been received yet."), "intake missing no-review boundary");
  assertPass(statusNote.includes("Status: WAITING_FOR_MACK_RETURN_DROP"), "status note missing waiting status");
  assertPass(statusNote.includes("Canonical Mack blocker | MACK_RETURN_NOT_RECEIVED"), "status note missing canonical blocker");
  assertPass(statusNote.includes("Return drop blocker | MACK_RETURN_DROP_EMPTY"), "status note missing drop blocker");
  assertPass(statusNote.includes("Drop candidates | 0"), "status note missing zero drop candidate readback");
  assertPass(statusNote.includes("Canonical next-build packet exists | False"), "status note missing next-build absence readback");
  assertPass(statusNote.includes("Status refresh receipt: foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"), "status note missing status receipt pointer");
  assertPass(statusNote.includes("Truth Boundary"), "status note missing truth boundary");
  assertPass(!statusNote.includes("MACK REVIEW RETURN"), "status note contains raw Mack return block");

  return {
    index_has_no_send_boundary: true,
    index_has_ben_pre_mack_brief: true,
    index_has_connection_map: true,
    index_has_connection_map_receipt: true,
    connection_map_markdown_valid: true,
    connection_map_html_valid: true,
    connection_map_json_valid: true,
    connection_map_mermaid_valid: true,
    index_has_attack_scorecard: true,
    index_has_attack_scorecard_receipt: true,
    attack_scorecard_markdown_valid: true,
    attack_scorecard_html_valid: true,
    attack_scorecard_json_valid: true,
    attack_scorecard_unfilled_template: true,
    index_has_scorecard_return_intake: true,
    index_has_scorecard_return_validator: true,
    index_has_scorecard_return_validator_smoke: true,
    scorecard_return_intake_waiting: true,
    index_has_mack_review_desk_readout: true,
    index_has_mack_review_desk_status: true,
    index_has_mack_paste_packet: true,
    index_has_mack_paste_packet_update_receipt: true,
    index_has_mack_paste_block_clipboard_helper: true,
    index_has_mack_paste_block_clipboard_helper_receipt: true,
    index_has_mack_paste_block_helper_update_receipt: true,
    index_has_contract_canon: true,
    index_has_event_spine: true,
    index_has_boot_context_refresh: true,
    ben_brief_preserves_mack_not_received_boundary: true,
    index_has_clipboard_importer: true,
    index_has_return_receiver_wrapper: true,
    index_has_return_receiver_smoke: true,
    index_has_return_receiver_smoke_receipt: true,
    index_has_return_receiver_update_receipt: true,
    index_has_return_acceptance_wrapper: true,
    index_has_return_acceptance_smoke: true,
    index_has_return_acceptance_smoke_receipt: true,
    index_has_return_acceptance_update_receipt: true,
    index_has_review_flow_state: true,
    index_has_review_flow_state_smoke: true,
    index_has_review_flow_state_receipt: true,
    index_has_review_flow_state_update_receipt: true,
    index_has_return_drop_folder: true,
    index_has_return_drop_processor: true,
    index_has_return_drop_processor_smoke: true,
    index_has_return_drop_processor_receipt: true,
    index_has_return_drop_processor_update_receipt: true,
    index_has_lane_coordinator: true,
    index_has_lane_coordinator_smoke: true,
    index_has_lane_coordinator_receipt: true,
    index_has_lane_coordinator_update_receipt: true,
    index_has_return_drop_watcher: true,
    index_has_return_drop_watcher_smoke: true,
    index_has_return_drop_watcher_receipt: true,
    index_has_return_drop_watcher_smoke_receipt: true,
    index_has_return_drop_watcher_update_receipt: true,
    index_has_status_refresh: true,
    index_has_status_refresh_smoke: true,
    index_has_status_refresh_receipt: true,
    index_has_status_refresh_smoke_receipt: true,
    index_has_status_refresh_update_receipt: true,
    index_has_send_return_roundtrip_smoke: true,
    index_has_send_return_roundtrip_smoke_receipt: true,
    index_has_send_return_roundtrip_update_receipt: true,
    index_has_receiver_proof_audit: true,
    index_has_receiver_proof_boundary_helper: true,
    index_preserves_receiver_proof_blockers: true,
    index_has_nerdkle_mirror_smoke: true,
    index_has_soledash_mirror_smoke: true,
    index_has_soledash_receiver_handoff_bridge_smoke: true,
    index_has_workspace_relay_receiver_handoff_bridge_smoke: true,
    index_has_status_first_launcher_instruction: true,
    index_has_readout_second_launcher_instruction: true,
    index_has_paste_packet_launcher_instruction: true,
    index_has_launcher_refresh_status_option: true,
    index_has_launcher_copy_mack_block_option: true,
    index_has_launcher_smoke: true,
    index_has_launcher_smoke_receipt: true,
    index_has_healthcheck: true,
    index_has_healthcheck_receipt: true,
    index_has_healthcheck_typecheck_option: true,
    index_next_human_gate_points_to_readout_first: true,
    index_next_human_gate_points_to_healthcheck: true,
    index_next_human_gate_points_to_connection_map: true,
    index_next_human_gate_points_to_attack_scorecard: true,
    index_next_human_gate_points_to_scorecard_return_validator: true,
    index_next_human_gate_points_to_launcher_refresh_status: true,
    index_next_human_gate_points_to_paste_packet: true,
    index_next_human_gate_points_to_paste_block_helper: true,
    index_next_human_gate_points_to_drop_processor: true,
    index_next_human_gate_points_to_return_drop_watcher: true,
    index_next_human_gate_points_to_status_refresh: true,
    index_next_human_gate_points_to_lane_coordinator: true,
    index_next_human_gate_points_to_receive_wrapper: true,
    index_next_human_gate_points_to_acceptance_wrapper: true,
    index_next_human_gate_points_to_flow_state: true,
    main_packet_has_readout_first_front_door: true,
    handoff_ready_to_paste: true,
    ben_brief_has_readout_first_read_order: true,
    handoff_includes_readout_first_instruction: true,
    handoff_counts_current: true,
    handoff_preserves_universal_receiver_proof_boundary: true,
    handoff_includes_four_hour_no_babysitting_test: true,
    intake_waiting_for_mack: true,
    status_note_waiting_for_mack_return_drop: true,
    status_note_has_no_raw_mack_return_block: true,
  };
}

async function verifyContractCanonReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/BOOK_ARCHITECTURE_CONTRACT_CANON_V0_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Contract Canon receipt is not ARTIFACT");
  assertPass(receipt.validation?.tsc_compile === "passed", "Contract Canon did not prove tsc compile");
  assertPass(receipt.validation?.valid_packet_parses === true, "Contract Canon did not prove valid packet parse");
  assertPass(
    receipt.validation?.invalid_packet_returns_schema_invalid === true,
    "Contract Canon did not prove SCHEMA_INVALID for invalid packet",
  );
  assertPass(receipt.validation?.receipt_requires_packet_id === true, "Contract Canon did not prove packet_id receipt requirement");
  assertPass(
    receipt.validation?.receipt_requires_terminal_status === true,
    "Contract Canon did not prove terminal receipt status requirement",
  );
  assertPass(
    receipt.validation?.event_joins_packet_id_and_receipt_id === true,
    "Contract Canon did not prove event id join",
  );
  assertPass(receipt.validation?.gate_parses === true, "Contract Canon did not prove gate parse");
  assertPass(receipt.validation?.boot_context_parses_and_is_usable === true, "Contract Canon did not prove boot context parse");

  const requiredHashPaths = [
    "lib/organism/contracts/packet.ts",
    "lib/organism/contracts/receipt.ts",
    "lib/organism/contracts/event.ts",
    "lib/organism/contracts/gate.ts",
    "lib/organism/contracts/boot-context.ts",
  ];
  const receiptHashes = new Map(
    (receipt.contract_file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of requiredHashPaths) {
    const raw = await readFile(path.join(ROOT, relativePath), "utf8");
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `CONTRACT_CANON_RECEIPT_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    tsc_compile: receipt.validation.tsc_compile,
    valid_packet_parses: true,
    invalid_packet_returns_schema_invalid: true,
    receipt_requires_packet_id: true,
    receipt_requires_terminal_status: true,
    event_joins_packet_id_and_receipt_id: true,
    current_contract_hashes_match_receipt: true,
  };
}

async function verifyEventSpineReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Event Spine receipt is not ARTIFACT");
  assertPass(receipt.validation?.watcher_exports_normalization_helpers === true, "Event Spine did not prove watcher exports helpers");
  assertPass(receipt.validation?.packet_id_extracted_from_packet_json === true, "Event Spine did not prove packet id extraction");
  assertPass(
    receipt.validation?.packet_id_and_receipt_id_extracted_from_receipt_json === true,
    "Event Spine did not prove receipt id extraction",
  );
  assertPass(
    receipt.validation?.packet_event_normalizes_to_packet_dispatched === true,
    "Event Spine did not prove packet_dispatched normalization",
  );
  assertPass(
    receipt.validation?.receipt_event_normalizes_to_packet_receipted === true,
    "Event Spine did not prove packet_receipted normalization",
  );
  assertPass(
    receipt.validation?.normalized_events_include_schema_and_event_id === true,
    "Event Spine did not prove schema/event_id fields",
  );
  assertPass(
    receipt.validation?.normalized_events_join_by_packet_id_and_receipt_id === true,
    "Event Spine did not prove packet/receipt join",
  );

  const expectedHashPaths = [
    "scripts/foreman/chokidar-neurocirculymphatic-v0.mjs",
    "scripts/foreman/organism-event-spine-normalization-smoke.mjs",
  ];
  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of expectedHashPaths) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `EVENT_SPINE_RECEIPT_HASH_STALE:${relativePath}`);
  }

  const eventsPath = receipt.fixture_readback?.events_path || "data/organism/events.jsonl";
  const events = await readJsonl(eventsPath);
  const packetEvent = events.find((event) => event.event_id === receipt.fixture_readback?.packet_event_id);
  const receiptEvent = events.find((event) => event.event_id === receipt.fixture_readback?.receipt_event_id);
  assertPass(packetEvent?.schema === "harvey_nerdkle_event_v0", "Event Spine packet event missing schema in JSONL");
  assertPass(receiptEvent?.schema === "harvey_nerdkle_event_v0", "Event Spine receipt event missing schema in JSONL");
  assertPass(packetEvent?.event_type === "packet_dispatched", "Event Spine packet event type drifted");
  assertPass(receiptEvent?.event_type === "packet_receipted", "Event Spine receipt event type drifted");
  assertPass(packetEvent?.packet_id === receipt.fixture_readback?.packet_id, "Event Spine packet event packet_id mismatch");
  assertPass(receiptEvent?.packet_id === receipt.fixture_readback?.packet_id, "Event Spine receipt event packet_id mismatch");
  assertPass(receiptEvent?.receipt_id === receipt.fixture_readback?.receipt_id, "Event Spine receipt event receipt_id mismatch");

  return {
    status: receipt.status,
    packet_id: receipt.fixture_readback.packet_id,
    receipt_id: receipt.fixture_readback.receipt_id,
    packet_event_id: receipt.fixture_readback.packet_event_id,
    receipt_event_id: receipt.fixture_readback.receipt_event_id,
    current_script_hashes_match_receipt: true,
    fixture_events_still_join: true,
  };
}

async function verifyBootContextRefreshReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/BOOK_ARCHITECTURE_BOOT_CONTEXT_REFRESH_V0_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Boot Context Refresh receipt is not ARTIFACT");
  assertPass(receipt.validation?.wormeyes_refreshed_bootloader_world_state === true, "Boot Context did not prove Wormeyes refresh");
  assertPass(receipt.validation?.world_state_machine_matches_current_machine === true, "Boot Context did not prove machine match");
  assertPass(receipt.validation?.world_state_includes_current_repo === true, "Boot Context did not prove current repo readback");
  assertPass(
    receipt.validation?.bootloader_writes_active_context_after_fresh_world_state === true,
    "Boot Context did not prove active context write",
  );
  assertPass(
    receipt.validation?.stale_world_state_blocks_bootloader_under_forced_stale_gate === true,
    "Boot Context did not prove stale world-state block",
  );
  assertPass(
    receipt.validation?.aeye_dry_run_injects_bootpack_before_response === true,
    "Boot Context did not prove Aeye bootpack dry-run injection",
  );
  assertPass(receipt.validation?.aeye_dry_run_logs_to_wrapper_jsonl === true, "Boot Context did not prove wrapper JSONL logging");

  const expectedHashPaths = [
    "scripts/foreman/organism-boot-context-refresh-smoke.mjs",
    "scripts/foreman/wormeyes-world-state.mjs",
    "tinkarden/nervous_system/bootloader.js",
    "tinkarden/nervous_system/aeye_client.js",
  ];
  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of expectedHashPaths) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `BOOT_CONTEXT_RECEIPT_HASH_STALE:${relativePath}`);
  }

  const worldState = JSON.parse(await readText("tinkarden/nervous_system/world_state.json"));
  const generatedMs = Date.parse(worldState.generated_at);
  assertPass(Number.isFinite(generatedMs), "Boot Context world_state generated_at invalid");
  assertPass(Date.now() - generatedMs < 12 * 60 * 60 * 1000, "Boot Context world_state older than 12 hours");
  assertPass(worldState.machine === (process.env.COMPUTERNAME || "UNKNOWN_MACHINE"), "Boot Context world_state machine drifted");
  assertPass(Array.isArray(worldState.repos) && worldState.repos.some((repo) => path.resolve(repo.repo) === ROOT), "Boot Context world_state current repo missing");

  const activeContext = await readText("tinkarden/nervous_system/active_context.txt");
  assertPass(activeContext.includes("===== WORMEYES_WORLD_STATE BEGIN ====="), "Boot Context active_context missing Wormeyes section");
  assertPass(activeContext.includes("world_state_freshness"), "Boot Context active_context missing freshness manifest");

  return {
    status: receipt.status,
    world_state_path: receipt.readbacks.wormeyes.output_path,
    active_context_path: receipt.readbacks.bootloader.output_path,
    stale_block_code: receipt.readbacks.stale_block.code,
    aeye_dry_run_status: receipt.readbacks.aeye_dry_run.status,
    aeye_call_log_backend: receipt.readbacks.aeye_dry_run.call_log_backend,
    current_script_hashes_match_receipt: true,
    world_state_fresh_under_12h: true,
  };
}

async function verifyClipboardImporterSmokeReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_SMOKE_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "clipboard importer smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.empty_input_blocks === true, "clipboard importer smoke did not prove empty input block");
  assertPass(
    receipt.validation?.unstructured_input_blocks_without_allow_freeform === true,
    "clipboard importer smoke did not prove unstructured input block",
  );
  assertPass(receipt.validation?.structured_dry_run_does_not_write === true, "clipboard importer smoke did not prove dry-run boundary");
  assertPass(
    receipt.validation?.structured_commit_writes_fixture_and_validates === true,
    "clipboard importer smoke did not prove fixture commit validation",
  );
  assertPass(receipt.validation?.canonical_intake_not_mutated === true, "clipboard importer smoke did not preserve canonical intake");

  const expectedHashPaths = [
    "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1",
    "scripts/foreman/Test-MackArchitectureReturnClipboardImporter.ps1",
  ];
  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of expectedHashPaths) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `CLIPBOARD_IMPORTER_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    canonical_intake_not_mutated: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (receipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReturnReceiverSmokeReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Return receiver smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.empty_dry_run_blocks === true, "Return receiver smoke did not prove empty dry-run block");
  assertPass(receipt.validation?.structured_dry_run_does_not_write === true, "Return receiver smoke did not prove dry-run write boundary");
  assertPass(
    receipt.validation?.structured_commit_writes_fixture_and_validates === true,
    "Return receiver smoke did not prove fixture commit validation",
  );
  assertPass(receipt.validation?.canonical_intake_not_mutated === true, "Return receiver smoke mutated canonical intake");
  assertPass(
    receipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Return receiver smoke changed canonical next-build state",
  );
  assertPass(receipt.validation?.real_clipboard_not_read === true, "Return receiver smoke read the real clipboard");
  assertPass(receipt.validation?.external_send_not_claimed === true, "Return receiver smoke falsely claims external send");
  assertPass(
    receipt.validation?.mack_return_not_claimed_for_canonical_intake === true,
    "Return receiver smoke falsely claims canonical Mack return",
  );

  const scenarios = new Map((receipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(scenarios.get("empty-dry-run")?.blocker_code === "MACK_RETURN_INPUT_EMPTY", "Return receiver empty dry-run blocker mismatch");
  assertPass(scenarios.get("structured-dry-run")?.import_committed === false, "Return receiver structured dry-run committed");
  assertPass(scenarios.get("structured-dry-run")?.intake_changed === false, "Return receiver structured dry-run changed fixture intake");
  assertPass(scenarios.get("structured-commit")?.import_committed === true, "Return receiver structured commit did not import");
  assertPass(scenarios.get("structured-commit")?.validator_status === "ARTIFACT", "Return receiver structured commit validator not ARTIFACT");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Receive-MackArchitectureReturn.ps1",
    "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1",
    "scripts/foreman/mack-architecture-return-intake-validator.mjs",
    "scripts/foreman/Test-MackArchitectureReturnReceiver.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_RECEIVER_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    empty_dry_run_blocks: true,
    structured_dry_run_does_not_write: true,
    structured_commit_writes_fixture_and_validates: true,
    real_clipboard_not_read: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (receipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReturnAcceptanceSmokeReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Return acceptance smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.canonical_waiting_dry_run_blocks === true, "Acceptance smoke did not prove canonical waiting block");
  assertPass(
    receipt.validation?.complete_dry_run_requires_ben_acceptance === true,
    "Acceptance smoke did not prove dry-run Ben gate",
  );
  assertPass(
    receipt.validation?.complete_commit_without_ben_accepted_blocks === true,
    "Acceptance smoke did not prove commit without BenAccepted blocks",
  );
  assertPass(
    receipt.validation?.complete_commit_with_ben_accepted_writes_fixture_next_build === true,
    "Acceptance smoke did not prove fixture next-build write",
  );
  assertPass(receipt.validation?.fixture_next_build_packet_contains_gate === true, "Acceptance smoke next-build fixture missing gate");
  assertPass(receipt.validation?.canonical_intake_not_mutated === true, "Acceptance smoke mutated canonical intake");
  assertPass(
    receipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Acceptance smoke wrote canonical next-build packet",
  );
  assertPass(receipt.validation?.external_send_not_claimed === true, "Acceptance smoke falsely claims external send");
  assertPass(
    receipt.validation?.mack_return_not_claimed_for_canonical_intake === true,
    "Acceptance smoke falsely claims canonical Mack return",
  );
  assertPass(
    receipt.validation?.ben_acceptance_not_claimed_for_canonical_intake === true,
    "Acceptance smoke falsely claims canonical Ben acceptance",
  );

  const scenarios = new Map((receipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(
    scenarios.get("canonical-waiting-dry-run")?.blocker_code === "MACK_RETURN_NOT_RECEIVED",
    "Acceptance smoke canonical waiting blocker mismatch",
  );
  assertPass(
    scenarios.get("complete-dry-run")?.blocker_code === "BEN_ACCEPTANCE_GATE_REQUIRED",
    "Acceptance smoke complete dry-run blocker mismatch",
  );
  assertPass(
    scenarios.get("complete-commit-without-ben-accepted")?.next_build_packet_exists === false,
    "Acceptance smoke wrote next-build without BenAccepted",
  );
  assertPass(
    scenarios.get("complete-commit-with-ben-accepted")?.next_build_packet_exists === true,
    "Acceptance smoke did not write fixture next-build with BenAccepted",
  );
  assertPass(
    scenarios.get("complete-commit-with-ben-accepted")?.next_build_packet_contains_gate === true,
    "Acceptance smoke fixture next-build gate mismatch",
  );

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Accept-MackArchitectureReturn.ps1",
    "scripts/foreman/mack-architecture-return-intake-validator.mjs",
    "scripts/foreman/Test-MackArchitectureReturnAcceptance.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_ACCEPTANCE_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    canonical_waiting_dry_run_blocks: true,
    complete_dry_run_requires_ben_acceptance: true,
    complete_commit_without_ben_accepted_blocks: true,
    complete_commit_with_ben_accepted_writes_fixture_next_build: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (receipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReviewFlowStateReceipts() {
  const liveReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706.json"));
  const smokeReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT_20260706.json"));

  assertPass(liveReceipt.status === "ARTIFACT", "Live review flow-state receipt is not ARTIFACT");
  assertPass(liveReceipt.flow_state === "WAITING_FOR_MACK_RETURN", "Live review flow-state is not waiting for Mack");
  assertPass(liveReceipt.blocker_code === "MACK_RETURN_NOT_RECEIVED", "Live review flow-state blocker mismatch");
  assertPass(
    String(liveReceipt.next_legal_command || "").includes("Receive-MackArchitectureReturn.ps1"),
    "Live review flow-state next command does not point to receive wrapper",
  );
  assertPass(liveReceipt.validation?.read_only_state_check === true, "Live review flow-state did not prove read-only check");
  assertPass(liveReceipt.validation?.no_clipboard_read === true, "Live review flow-state read clipboard");
  assertPass(liveReceipt.validation?.no_intake_write === true, "Live review flow-state wrote intake");
  assertPass(liveReceipt.validation?.no_next_build_packet_write === true, "Live review flow-state wrote next-build packet");
  assertPass(liveReceipt.validation?.external_send_not_claimed === true, "Live review flow-state falsely claims external send");
  assertPass(liveReceipt.validation?.ben_acceptance_not_claimed === true, "Live review flow-state falsely claims Ben acceptance");

  assertPass(smokeReceipt.status === "ARTIFACT", "Review flow-state smoke receipt is not ARTIFACT");
  assertPass(smokeReceipt.validation?.waiting_state_blocks === true, "Flow-state smoke did not prove waiting state");
  assertPass(smokeReceipt.validation?.incomplete_state_blocks === true, "Flow-state smoke did not prove incomplete state");
  assertPass(
    smokeReceipt.validation?.complete_state_points_to_acceptance_dry_run === true,
    "Flow-state smoke did not point complete return to acceptance dry-run",
  );
  assertPass(
    smokeReceipt.validation?.next_build_state_detects_existing_packet === true,
    "Flow-state smoke did not detect next-build packet",
  );
  assertPass(smokeReceipt.validation?.state_check_is_read_only === true, "Flow-state smoke did not prove read-only mode");
  assertPass(smokeReceipt.validation?.real_clipboard_not_read === true, "Flow-state smoke read the real clipboard");
  assertPass(smokeReceipt.validation?.canonical_intake_not_mutated === true, "Flow-state smoke mutated canonical intake");
  assertPass(
    smokeReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Flow-state smoke wrote canonical next-build packet",
  );

  const liveHashes = new Map(
    (liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(liveHashes.get(relativePath) === sha256(raw).toLowerCase(), `REVIEW_FLOW_STATE_HASH_STALE:${relativePath}`);
  }

  const smokeHashes = new Map(
    (smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "scripts/foreman/Test-MackArchitectureReviewFlowState.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `REVIEW_FLOW_STATE_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    live_status: liveReceipt.status,
    live_flow_state: liveReceipt.flow_state,
    live_blocker_code: liveReceipt.blocker_code,
    live_next_legal_command: liveReceipt.next_legal_command,
    smoke_status: smokeReceipt.status,
    waiting_state_blocks: true,
    incomplete_state_blocks: true,
    complete_state_points_to_acceptance_dry_run: true,
    next_build_state_detects_existing_packet: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (smokeReceipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReturnDropProcessorReceipts() {
  const liveReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT_20260706.json"));
  const smokeReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT_20260706.json"));

  assertPass(liveReceipt.status === "BLOCKER", "Live return drop processor receipt is not BLOCKER");
  assertPass(liveReceipt.blocker_code === "MACK_RETURN_DROP_EMPTY", "Live return drop processor blocker mismatch");
  assertPass(liveReceipt.candidates_seen === 0, "Live return drop unexpectedly has candidates");
  assertPass(liveReceipt.selected_drop_file === "", "Live return drop selected a file unexpectedly");
  assertPass(liveReceipt.validation?.no_clipboard_read === true, "Live return drop processor read clipboard");
  assertPass(
    liveReceipt.validation?.mack_return_not_claimed_when_drop_empty === true,
    "Live return drop processor claimed Mack return while empty",
  );
  assertPass(
    liveReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Live return drop processor wrote canonical next-build packet",
  );

  assertPass(smokeReceipt.status === "ARTIFACT", "Return drop processor smoke receipt is not ARTIFACT");
  assertPass(smokeReceipt.validation?.empty_drop_blocks === true, "Drop processor smoke did not prove empty drop blocker");
  assertPass(
    smokeReceipt.validation?.structured_dry_run_selects_newest_and_does_not_write === true,
    "Drop processor smoke did not prove newest-file dry-run",
  );
  assertPass(
    smokeReceipt.validation?.structured_commit_writes_fixture_and_validates === true,
    "Drop processor smoke did not prove fixture commit validation",
  );
  assertPass(smokeReceipt.validation?.real_clipboard_not_read === true, "Drop processor smoke read real clipboard");
  assertPass(smokeReceipt.validation?.canonical_intake_not_mutated === true, "Drop processor smoke mutated canonical intake");
  assertPass(
    smokeReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Drop processor smoke wrote canonical next-build packet",
  );

  const scenarios = new Map((smokeReceipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(scenarios.get("empty-drop")?.blocker_code === "MACK_RETURN_DROP_EMPTY", "Drop processor empty scenario blocker mismatch");
  assertPass(scenarios.get("structured-dry-run")?.intake_changed === false, "Drop processor dry-run changed fixture intake");
  assertPass(
    String(scenarios.get("structured-dry-run")?.selected_drop_file || "").includes("mack-return-latest.md"),
    "Drop processor did not select latest fixture file",
  );
  assertPass(scenarios.get("structured-commit")?.import_committed === true, "Drop processor commit did not import fixture");
  assertPass(scenarios.get("structured-commit")?.validator_status === "ARTIFACT", "Drop processor commit validator was not ARTIFACT");

  const liveHashes = new Map(
    (liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Process-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Receive-MackArchitectureReturn.ps1",
    "foreman/handoffs/inbox/mack-architecture-return-drop/README.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(liveHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_DROP_PROCESS_HASH_STALE:${relativePath}`);
  }

  const smokeHashes = new Map(
    (smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Process-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Receive-MackArchitectureReturn.ps1",
    "scripts/foreman/Test-MackArchitectureReturnDropProcessor.ps1",
    "foreman/handoffs/inbox/mack-architecture-return-drop/README.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_DROP_PROCESSOR_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    live_status: liveReceipt.status,
    live_blocker_code: liveReceipt.blocker_code,
    live_candidates_seen: liveReceipt.candidates_seen,
    smoke_status: smokeReceipt.status,
    empty_drop_blocks: true,
    structured_dry_run_selects_newest_and_does_not_write: true,
    structured_commit_writes_fixture_and_validates: true,
    real_clipboard_not_read: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (smokeReceipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReviewLaneCoordinatorReceipts() {
  const liveReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT_20260706.json"));
  const smokeReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_SMOKE_RECEIPT_20260706.json"));

  assertPass(liveReceipt.status === "ARTIFACT_WITH_BLOCKERS", "Live lane coordinator receipt is not ARTIFACT_WITH_BLOCKERS");
  assertPass(liveReceipt.lane_state === "WAITING_FOR_MACK_RETURN_DROP", "Live lane coordinator state mismatch");
  assertPass(liveReceipt.blocker_code === "MACK_RETURN_DROP_EMPTY", "Live lane coordinator blocker mismatch");
  assertPass(
    String(liveReceipt.next_legal_command || "").includes("mack-architecture-return-drop"),
    "Live lane coordinator next command does not point to drop folder",
  );
  assertPass(liveReceipt.validation?.coordinator_default_is_non_mutating === true, "Live lane coordinator lost non-mutating default");
  assertPass(liveReceipt.validation?.no_clipboard_read === true, "Live lane coordinator read clipboard");
  assertPass(liveReceipt.validation?.external_send_not_claimed === true, "Live lane coordinator falsely claims external send");
  assertPass(liveReceipt.validation?.no_raw_mack_text_in_coordinator_receipt === true, "Live lane coordinator receipt contains raw Mack text");

  assertPass(smokeReceipt.status === "ARTIFACT", "Lane coordinator smoke receipt is not ARTIFACT");
  assertPass(smokeReceipt.validation?.empty_lane_reports_drop_empty === true, "Lane smoke did not prove empty lane state");
  assertPass(
    smokeReceipt.validation?.drop_dry_run_selects_file_without_writing === true,
    "Lane smoke did not prove drop dry-run no-write state",
  );
  assertPass(
    smokeReceipt.validation?.commit_return_writes_fixture_intake_only === true,
    "Lane smoke did not prove fixture return commit",
  );
  assertPass(
    smokeReceipt.validation?.commit_acceptance_with_ben_accepted_writes_fixture_next_build === true,
    "Lane smoke did not prove fixture acceptance commit",
  );
  assertPass(smokeReceipt.validation?.real_clipboard_not_read === true, "Lane smoke read real clipboard");
  assertPass(smokeReceipt.validation?.canonical_intake_not_mutated === true, "Lane smoke mutated canonical intake");
  assertPass(
    smokeReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Lane smoke wrote canonical next-build packet",
  );

  const scenarios = new Map((smokeReceipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(scenarios.get("empty-default")?.lane_state === "WAITING_FOR_MACK_RETURN_DROP", "Lane smoke empty state mismatch");
  assertPass(scenarios.get("drop-dry-run")?.lane_state === "RETURN_DROP_READY_FOR_COMMIT", "Lane smoke dry-run state mismatch");
  assertPass(scenarios.get("drop-dry-run")?.intake_changed === false, "Lane smoke dry-run changed fixture intake");
  assertPass(scenarios.get("drop-commit-return")?.lane_state === "MACK_RETURN_READY_FOR_BEN_REVIEW", "Lane smoke return commit state mismatch");
  assertPass(scenarios.get("drop-commit-return")?.next_build_exists === false, "Lane smoke return commit wrote next-build early");
  assertPass(scenarios.get("full-fixture-next-build")?.lane_state === "NEXT_BUILD_PACKET_EXISTS", "Lane smoke full fixture state mismatch");
  assertPass(scenarios.get("full-fixture-next-build")?.next_build_exists === true, "Lane smoke full fixture did not write next-build");

  const liveHashes = new Map(
    (liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1",
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "scripts/foreman/Process-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Accept-MackArchitectureReturn.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(liveHashes.get(relativePath) === sha256(raw).toLowerCase(), `LANE_COORDINATOR_HASH_STALE:${relativePath}`);
  }

  const smokeHashes = new Map(
    (smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1",
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "scripts/foreman/Process-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Accept-MackArchitectureReturn.ps1",
    "scripts/foreman/Test-MackArchitectureReviewLane.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `LANE_COORDINATOR_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    live_status: liveReceipt.status,
    live_lane_state: liveReceipt.lane_state,
    live_blocker_code: liveReceipt.blocker_code,
    smoke_status: smokeReceipt.status,
    empty_lane_reports_drop_empty: true,
    drop_dry_run_selects_file_without_writing: true,
    commit_return_writes_fixture_intake_only: true,
    commit_acceptance_with_ben_accepted_writes_fixture_next_build: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (smokeReceipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyReturnDropWatcherReceipts() {
  const liveReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706.json"));
  const smokeReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT_20260706.json"));

  const liveCycle = liveReceipt.cycles?.[0] || {};
  const liveCoordinator = liveCycle.coordinator || {};
  assertPass(liveReceipt.status === "ARTIFACT", "Live return drop watcher receipt is not ARTIFACT");
  assertPass(liveReceipt.once === true, "Live return drop watcher was not run in -Once mode");
  assertPass(liveReceipt.stop_reason === "ONCE", "Live return drop watcher did not stop because of -Once");
  assertPass(liveReceipt.cycles?.length === 1, "Live return drop watcher ran more than one cycle");
  assertPass(liveReceipt.validation?.coordinator_ran_on_first_iteration === true, "Live return drop watcher did not run coordinator first");
  assertPass(liveReceipt.validation?.no_clipboard_read === true, "Live return drop watcher read clipboard");
  assertPass(liveReceipt.validation?.external_send_not_claimed === true, "Live return drop watcher falsely claims external send");
  assertPass(liveReceipt.validation?.no_raw_mack_text_in_watch_receipt === true, "Live return drop watcher receipt contains raw Mack text");
  assertPass(
    liveReceipt.validation?.no_intake_write_without_commit_return === true,
    "Live return drop watcher mutated intake without -CommitReturn",
  );
  assertPass(
    liveReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Live return drop watcher wrote canonical next-build packet",
  );
  assertPass(liveCycle.snapshot?.candidate_count === 0, "Live return drop watcher saw unexpected candidates");
  assertPass(liveCoordinator.lane_state === "WAITING_FOR_MACK_RETURN_DROP", "Live return drop watcher lane state mismatch");
  assertPass(liveCoordinator.blocker_code === "MACK_RETURN_DROP_EMPTY", "Live return drop watcher blocker mismatch");

  assertPass(smokeReceipt.status === "ARTIFACT", "Return drop watcher smoke receipt is not ARTIFACT");
  assertPass(smokeReceipt.validation?.empty_once_reports_drop_empty === true, "Watcher smoke did not prove empty -Once state");
  assertPass(
    smokeReceipt.validation?.drop_once_reports_ready_for_commit_without_writing === true,
    "Watcher smoke did not prove drop -Once no-write state",
  );
  assertPass(smokeReceipt.validation?.once_mode_exits === true, "Watcher smoke did not prove -Once exits");
  assertPass(
    smokeReceipt.validation?.coordinator_runs_on_first_iteration === true,
    "Watcher smoke did not prove first-iteration coordinator run",
  );
  assertPass(smokeReceipt.validation?.real_clipboard_not_read === true, "Watcher smoke read real clipboard");
  assertPass(
    smokeReceipt.validation?.watcher_receipts_contain_no_raw_mack_text === true,
    "Watcher smoke receipts contain raw Mack text",
  );
  assertPass(smokeReceipt.validation?.canonical_intake_not_mutated === true, "Watcher smoke mutated canonical intake");
  assertPass(
    smokeReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Watcher smoke wrote canonical next-build packet",
  );

  const scenarios = new Map((smokeReceipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(scenarios.get("empty-once")?.last_lane_state === "WAITING_FOR_MACK_RETURN_DROP", "Watcher smoke empty state mismatch");
  assertPass(scenarios.get("empty-once")?.last_blocker_code === "MACK_RETURN_DROP_EMPTY", "Watcher smoke empty blocker mismatch");
  assertPass(scenarios.get("drop-once")?.last_lane_state === "RETURN_DROP_READY_FOR_COMMIT", "Watcher smoke drop state mismatch");
  assertPass(scenarios.get("drop-once")?.intake_changed === false, "Watcher smoke drop scenario changed fixture intake");
  for (const readback of smokeReceipt.readbacks || []) {
    assertPass(readback.stop_reason === "ONCE", `Watcher smoke did not stop once:${readback.name}`);
    assertPass(readback.cycles === 1, `Watcher smoke scenario did not run one cycle:${readback.name}`);
    assertPass(readback.coordinator_ran_on_first_iteration === true, `Watcher smoke did not run coordinator first:${readback.name}`);
    assertPass(readback.no_clipboard_read === true, `Watcher smoke read clipboard:${readback.name}`);
    assertPass(readback.no_raw_mack_text_in_watch_receipt === true, `Watcher smoke raw text leaked:${readback.name}`);
  }

  const liveHashes = new Map(
    (liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(liveHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_DROP_WATCH_HASH_STALE:${relativePath}`);
  }

  const smokeHashes = new Map(
    (smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1",
    "scripts/foreman/Test-MackArchitectureReturnDropWatcher.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `RETURN_DROP_WATCH_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    live_status: liveReceipt.status,
    live_stop_reason: liveReceipt.stop_reason,
    live_last_lane_state: liveCoordinator.lane_state,
    live_last_blocker_code: liveCoordinator.blocker_code,
    smoke_status: smokeReceipt.status,
    empty_once_reports_drop_empty: true,
    drop_once_reports_ready_for_commit_without_writing: true,
    once_mode_exits: true,
    coordinator_runs_on_first_iteration: true,
    real_clipboard_not_read: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (smokeReceipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifyStatusRefreshReceipts() {
  const liveReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"));
  const smokeReceipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_SMOKE_RECEIPT_20260706.json"));
  const statusNote = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md");

  assertPass(liveReceipt.status === "ARTIFACT", "Live status refresh receipt is not ARTIFACT");
  assertPass(liveReceipt.lane_status === "WAITING_FOR_MACK_RETURN_DROP", "Live status refresh lane status mismatch");
  assertPass(liveReceipt.flow_state_readback?.flow_state === "WAITING_FOR_MACK_RETURN", "Live status refresh flow state mismatch");
  assertPass(liveReceipt.flow_state_readback?.blocker_code === "MACK_RETURN_NOT_RECEIVED", "Live status refresh flow blocker mismatch");
  assertPass(liveReceipt.watcher_readback?.stop_reason === "ONCE", "Live status refresh watcher did not stop once");
  assertPass(liveReceipt.watcher_readback?.last_candidate_count === 0, "Live status refresh saw unexpected drop candidates");
  assertPass(
    liveReceipt.watcher_readback?.last_lane_state === "WAITING_FOR_MACK_RETURN_DROP",
    "Live status refresh watcher lane state mismatch",
  );
  assertPass(
    liveReceipt.watcher_readback?.last_blocker_code === "MACK_RETURN_DROP_EMPTY",
    "Live status refresh watcher blocker mismatch",
  );
  assertPass(liveReceipt.validation?.flow_state_read === true, "Live status refresh did not read flow state");
  assertPass(liveReceipt.validation?.watcher_once_run === true, "Live status refresh did not run watcher once");
  assertPass(liveReceipt.validation?.watcher_once_exited === true, "Live status refresh did not prove watcher exit");
  assertPass(liveReceipt.validation?.status_markdown_written === true, "Live status refresh did not write status markdown");
  assertPass(liveReceipt.validation?.no_clipboard_read === true, "Live status refresh read clipboard");
  assertPass(liveReceipt.validation?.external_send_not_claimed === true, "Live status refresh falsely claims external send");
  assertPass(liveReceipt.validation?.canonical_intake_not_mutated === true, "Live status refresh mutated canonical intake");
  assertPass(
    liveReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Live status refresh wrote canonical next-build packet",
  );
  assertPass(liveReceipt.validation?.no_long_running_watcher_left === true, "Live status refresh left watcher running");
  assertPass(liveReceipt.validation?.no_raw_mack_text_in_status === true, "Live status refresh leaked raw Mack text");

  assertPass(statusNote.includes("Status: WAITING_FOR_MACK_RETURN_DROP"), "Status note status mismatch");
  assertPass(statusNote.includes("Drop candidates | 0"), "Status note candidate count mismatch");
  assertPass(statusNote.includes("Watcher stop reason | ONCE"), "Status note missing watcher stop reason");
  assertPass(!statusNote.includes("MACK REVIEW RETURN"), "Status note contains raw Mack return block");

  assertPass(smokeReceipt.status === "ARTIFACT", "Status refresh smoke receipt is not ARTIFACT");
  assertPass(
    smokeReceipt.validation?.empty_status_reports_waiting_for_drop === true,
    "Status smoke did not prove empty-drop status",
  );
  assertPass(
    smokeReceipt.validation?.drop_status_reports_ready_for_commit_without_writing === true,
    "Status smoke did not prove drop-ready no-write status",
  );
  assertPass(smokeReceipt.validation?.status_markdown_written === true, "Status smoke did not write markdown");
  assertPass(smokeReceipt.validation?.watcher_once_exits === true, "Status smoke did not prove watcher once exit");
  assertPass(smokeReceipt.validation?.real_clipboard_not_read === true, "Status smoke read real clipboard");
  assertPass(
    smokeReceipt.validation?.status_markdown_contains_no_raw_mack_text === true,
    "Status smoke markdown contains raw Mack text",
  );
  assertPass(smokeReceipt.validation?.canonical_intake_not_mutated === true, "Status smoke mutated canonical intake");
  assertPass(
    smokeReceipt.validation?.canonical_next_build_packet_absence_preserved === true,
    "Status smoke wrote canonical next-build packet",
  );

  const scenarios = new Map((smokeReceipt.readbacks || []).map((entry) => [entry.name, entry]));
  assertPass(
    scenarios.get("empty-drop-status")?.lane_status === "WAITING_FOR_MACK_RETURN_DROP",
    "Status smoke empty scenario mismatch",
  );
  assertPass(
    scenarios.get("drop-ready-status")?.lane_status === "RETURN_DROP_READY_FOR_COMMIT",
    "Status smoke drop-ready scenario mismatch",
  );
  assertPass(scenarios.get("drop-ready-status")?.intake_changed === false, "Status smoke drop-ready changed fixture intake");

  const liveHashes = new Map(
    (liveReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1",
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(liveHashes.get(relativePath) === sha256(raw).toLowerCase(), `STATUS_REFRESH_HASH_STALE:${relativePath}`);
  }

  const smokeHashes = new Map(
    (smokeReceipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1",
    "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1",
    "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1",
    "scripts/foreman/Test-MackArchitectureReviewDeskStatus.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(smokeHashes.get(relativePath) === sha256(raw).toLowerCase(), `STATUS_REFRESH_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    live_status: liveReceipt.status,
    live_lane_status: liveReceipt.lane_status,
    live_flow_state: liveReceipt.flow_state_readback?.flow_state,
    live_flow_blocker_code: liveReceipt.flow_state_readback?.blocker_code,
    live_return_drop_state: liveReceipt.watcher_readback?.last_lane_state,
    live_return_drop_blocker_code: liveReceipt.watcher_readback?.last_blocker_code,
    live_drop_candidates: liveReceipt.watcher_readback?.last_candidate_count,
    smoke_status: smokeReceipt.status,
    empty_status_reports_waiting_for_drop: true,
    drop_status_reports_ready_for_commit_without_writing: true,
    status_markdown_written: true,
    watcher_once_exits: true,
    real_clipboard_not_read: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
    scenario_names: (smokeReceipt.readbacks || []).map((readback) => readback.name),
  };
}

async function verifySendReturnRoundTripSmokeReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Send/return round-trip smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.outbound_copy_helper_dry_run_passed === true, "Round-trip smoke did not prove outbound copy helper");
  assertPass(receipt.validation?.outbound_copy_helper_did_not_touch_clipboard === true, "Round-trip smoke touched real clipboard");
  assertPass(receipt.validation?.return_importer_fixture_commit_passed === true, "Round-trip smoke did not prove fixture import");
  assertPass(receipt.validation?.return_validator_fixture_artifact_ready === true, "Round-trip smoke validator was not ARTIFACT_READY");
  assertPass(receipt.validation?.canonical_intake_not_mutated === true, "Round-trip smoke mutated canonical intake");
  assertPass(receipt.validation?.canonical_next_build_packet_absence_preserved === true, "Round-trip smoke changed next-build packet state");
  assertPass(receipt.validation?.external_send_not_claimed === true, "Round-trip smoke falsely claims external send");
  assertPass(receipt.validation?.mack_return_not_claimed_for_canonical_intake === true, "Round-trip smoke falsely claims canonical Mack return");
  assertPass(receipt.fixture_readback?.copy_block_line_count >= 60, "Round-trip smoke copy block line count too low");
  assertPass(receipt.fixture_readback?.validator_status === "ARTIFACT", "Round-trip smoke validator receipt not ARTIFACT");
  assertPass(receipt.fixture_readback?.validator_classification === "ARTIFACT_READY", "Round-trip smoke validator classification not ready");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "scripts/foreman/Copy-MackArchitecturePasteBlock.ps1",
    "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1",
    "scripts/foreman/mack-architecture-return-intake-validator.mjs",
    "scripts/foreman/Test-MackArchitectureSendReturnRoundTrip.ps1",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `SEND_RETURN_ROUNDTRIP_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    outbound_copy_helper_dry_run_passed: true,
    outbound_copy_helper_did_not_touch_clipboard: true,
    return_importer_fixture_commit_passed: true,
    return_validator_fixture_artifact_ready: true,
    canonical_intake_not_mutated: true,
    canonical_next_build_packet_absence_preserved: true,
    current_script_hashes_match_receipt: true,
  };
}

async function verifyReceiverProofEverywhereAuditReceipt(currentHandoffIndex) {
  const receipt = JSON.parse(await readText("foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT_WITH_BLOCKERS", "Receiver Proof audit receipt does not preserve blockers status");
  assertPass(receipt.validation?.non_mutating_audit === true, "Receiver Proof audit did not prove non-mutating mode");
  assertPass(receipt.validation?.receiver_handoff_lane_enforced === true, "Receiver Proof audit did not prove handoff lane enforcement");
  assertPass(
    receipt.validation?.posted_handoffs_require_contract_receipt_and_packet_receipted_event === true,
    "Receiver Proof audit did not prove posted handoff event joins",
  );
  assertPass(
    receipt.validation?.pending_handoffs_not_claimed_as_posted === true,
    "Receiver Proof audit did not prove pending handoffs stay pending",
  );
  assertPass(
    receipt.validation?.returned_unposted_handoffs_not_claimed_as_posted === true,
    "Receiver Proof audit did not prove returned_unposted handoffs stay unposted",
  );
  assertPass(
    receipt.validation?.template_return_blocked_handoffs_not_claimed_as_posted === true,
    "Receiver Proof audit did not prove template blocked handoffs stay unposted",
  );
  assertPass(
    receipt.validation?.non_proof_routes_self_label_receiver_boundary === true,
    "Receiver Proof audit did not prove non-proof route boundary labels",
  );
  assertPass(
    receipt.validation?.nerdkle_receipts_mirror_to_organism_contract === true,
    "Receiver Proof audit did not prove Nerdkle organism contract mirroring",
  );
  assertPass(
    receipt.validation?.nerdkle_mirror_packet_receipted_event_joins_packet_id_and_receipt_id === true,
    "Receiver Proof audit did not prove Nerdkle packet_receipted event join",
  );
  assertPass(
    receipt.validation?.soledash_transport_acks_mirror_to_organism_contract === true,
    "Receiver Proof audit did not prove SoleDash transport ACK organism mirroring",
  );
  assertPass(
    receipt.validation?.soledash_mirror_packet_receipted_event_joins_packet_id_and_receipt_id === true,
    "Receiver Proof audit did not prove SoleDash packet_receipted event join",
  );
  assertPass(
    receipt.validation?.soledash_transport_ack_remains_partial_not_completed_work === true,
    "Receiver Proof audit did not prove SoleDash transport ACK remains partial",
  );
  assertPass(
    receipt.validation?.soledash_receiver_handoff_bridge_creates_pending_template === true,
    "Receiver Proof audit did not prove SoleDash receiver-handoff bridge pending template",
  );
  assertPass(
    receipt.validation?.soledash_receiver_handoff_bridge_does_not_claim_completion === true,
    "Receiver Proof audit did not preserve SoleDash receiver-handoff no-completion boundary",
  );
  assertPass(
    receipt.validation?.workspace_relay_receiver_handoff_bridge_creates_pending_template === true,
    "Receiver Proof audit did not prove Workspace Relay receiver-handoff bridge pending template",
  );
  assertPass(
    receipt.validation?.workspace_relay_receiver_handoff_bridge_does_not_claim_completion === true,
    "Receiver Proof audit did not preserve Workspace Relay receiver-handoff no-completion boundary",
  );
  assertPass(
    receipt.nerdkle_mirror_readback?.current_script_hashes_match_receipt === true,
    "Receiver Proof audit did not prove Nerdkle mirror smoke hashes are current",
  );
  assertPass(
    receipt.soledash_mirror_readback?.transport_ack_remains_partial === true,
    "Receiver Proof audit did not preserve SoleDash partial transport boundary",
  );
  assertPass(
    receipt.soledash_receiver_handoff_bridge_readback?.indexed_state === "pending_receiver",
    "Receiver Proof audit did not prove SoleDash bridge is pending_receiver",
  );
  assertPass(
    receipt.soledash_receiver_handoff_bridge_readback?.returned_receipt_exists === false,
    "Receiver Proof audit did not prove SoleDash bridge has no returned receipt",
  );
  assertPass(
    receipt.workspace_relay_receiver_handoff_bridge_readback?.indexed_state === "pending_receiver",
    "Receiver Proof audit did not prove Workspace Relay bridge is pending_receiver",
  );
  assertPass(
    receipt.workspace_relay_receiver_handoff_bridge_readback?.returned_receipt_exists === false,
    "Receiver Proof audit did not prove Workspace Relay bridge has no returned receipt",
  );
  assertPass(receipt.validation?.universal_receiver_proof_claimed === false, "Receiver Proof audit falsely claims universal receiver proof");
  assertPass(receipt.validation?.blockers_remain === true, "Receiver Proof audit missing blockers_remain boundary");
  assertPass(Array.isArray(receipt.blockers) && receipt.blockers.length >= 3, "Receiver Proof audit blockers missing");

  const matrix = Array.isArray(receipt.coverage_matrix) ? receipt.coverage_matrix : [];
  const coverageFor = (surfaceId) => matrix.find((entry) => entry.surface_id === surfaceId);
  assertPass(coverageFor("tinkerden.receiver_handoff")?.coverage_status === "enforced", "Receiver Proof audit missing enforced TinkerDen handoff row");
  assertPass(
    coverageFor("tinkerden.workspace_relay")?.coverage_status === "custody-with-pending-receiver-handoff",
    "Receiver Proof audit missing workspace relay handoff bridge row",
  );
  assertPass(
    coverageFor("soledash.aeye_loop")?.coverage_status === "transport-receipt-mirrored-plus-pending-handoff",
    "Receiver Proof audit missing SoleDash transport mirror row",
  );
  assertPass(
    coverageFor("nerdkle.packet_receipt")?.coverage_status === "organism-receipt-mirrored",
    "Receiver Proof audit missing Nerdkle organism mirror row",
  );

  const readback = receipt.live_receiver_handoff_readback || {};
  assertPass(readback.count === currentHandoffIndex.count, "Receiver Proof audit handoff count stale");
  assertPass(readback.posted_count === currentHandoffIndex.posted_count, "Receiver Proof audit posted count stale");
  assertPass(readback.pending_count === currentHandoffIndex.pending_count, "Receiver Proof audit pending count stale");
  assertPass(readback.returned_unposted_count === currentHandoffIndex.returned_unposted_count, "Receiver Proof audit returned_unposted count stale");
  assertPass(readback.template_return_blocked_count === currentHandoffIndex.template_return_blocked_count, "Receiver Proof audit template_return_blocked count stale");
  assertPass(readback.invalid_count === currentHandoffIndex.invalid_count, "Receiver Proof audit invalid count stale");
  assertPass(readback.malformed_count === currentHandoffIndex.malformed_count, "Receiver Proof audit malformed count stale");

  const expectedHashPaths = [
    "scripts/foreman/receiver-proof-everywhere-audit.mjs",
    "lib/organism/contracts/receiver-proof-boundary.ts",
    "lib/nerdkle/organism-contract-mirror.ts",
    "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
    "lib/tinkerden/workspace-relay-receiver-handoff.ts",
    "lib/organism/contracts/receiver-handoff-bundle.ts",
    "lib/organism/contracts/receiver-handoff-return-fill.ts",
    "lib/organism/contracts/receiver-handoff-return-post.ts",
    "lib/organism/contracts/receiver-handoff-index.ts",
    "lib/tinkerden/workspace-relay-contract.ts",
    "app/api/tinkerden/workspace-relay/route.ts",
    "app/api/tinkerden/bridge/execute/route.ts",
    "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
    "app/api/nerdkle/packet/route.ts",
    "app/api/nerdkle/receipt/route.ts",
    "scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
    "scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
    "scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
    "scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
  ];
  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of expectedHashPaths) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `RECEIVER_PROOF_AUDIT_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    receiver_handoff_lane_enforced: true,
    nerdkle_receipts_mirror_to_organism_contract: true,
    soledash_transport_acks_mirror_to_organism_contract: true,
    soledash_transport_ack_remains_partial: true,
    soledash_receiver_handoff_bridge_pending: true,
    workspace_relay_receiver_handoff_bridge_pending: true,
    universal_receiver_proof_claimed: false,
    non_proof_routes_self_label_receiver_boundary: true,
    blocker_count: receipt.blockers.length,
    coverage_statuses: matrix.map((entry) => ({
      surface_id: entry.surface_id,
      coverage_status: entry.coverage_status,
      proof_level: entry.proof_level,
    })),
    current_script_hashes_match_receipt: true,
    live_handoff_counts_match_current_index: true,
  };
}

async function verifyMackReviewDeskReadoutReceipt(currentHandoffIndex) {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Mack review desk readout receipt is not ARTIFACT");
  assertPass(receipt.validation?.markdown_written === true, "Mack review desk readout markdown not written");
  assertPass(receipt.validation?.html_written === true, "Mack review desk readout HTML not written");
  assertPass(receipt.validation?.docx_written === true, "Mack review desk readout DOCX not written");
  assertPass(receipt.validation?.mack_return_not_received_preserved === true, "Mack review desk readout lost Mack-not-received boundary");
  assertPass(receipt.validation?.external_send_not_claimed === true, "Mack review desk readout falsely claims external send");
  assertPass(receipt.validation?.canonical_next_build_packet_absent === true, "Mack review desk readout lost next-build absence boundary");
  assertPass(
    receipt.validation?.workspace_relay_receiver_handoff_bridge_pending === true,
    "Mack review desk readout lost Workspace Relay pending boundary",
  );
  assertPass(receipt.validation?.universal_receiver_proof_not_claimed === true, "Mack review desk readout falsely claims universal receiver proof");

  const readback = receipt.receiver_handoff_readback || {};
  assertPass(readback.count === currentHandoffIndex.count, "Mack review desk readout handoff count stale");
  assertPass(readback.posted_count === currentHandoffIndex.posted_count, "Mack review desk readout posted count stale");
  assertPass(readback.pending_count === currentHandoffIndex.pending_count, "Mack review desk readout pending count stale");
  assertPass(readback.returned_unposted_count === currentHandoffIndex.returned_unposted_count, "Mack review desk readout returned_unposted count stale");
  assertPass(readback.template_return_blocked_count === currentHandoffIndex.template_return_blocked_count, "Mack review desk readout template_return_blocked count stale");
  assertPass(readback.invalid_count === currentHandoffIndex.invalid_count, "Mack review desk readout invalid count stale");
  assertPass(readback.malformed_count === currentHandoffIndex.malformed_count, "Mack review desk readout malformed count stale");

  const sourceReceipts = receipt.source_receipts || [];
  assertPass(
    sourceReceipts.includes("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT_20260706.json"),
    "Mack review desk readout missing readiness source receipt path",
  );
  assertPass(
    sourceReceipts.includes("foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706.json"),
    "Mack review desk readout missing receiver audit source receipt path",
  );

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.docx",
    "scripts/foreman/build-mack-architecture-review-desk-readout.py",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `MACK_REVIEW_DESK_READOUT_HASH_STALE:${relativePath}`);
  }
  assertPass(
    !receiptHashes.has("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT_20260706.json"),
    "Mack review desk readout receipt creates readiness/readout hash cycle",
  );
  assertPass(
    !receiptHashes.has("foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706.json"),
    "Mack review desk readout receipt creates audit/readout hash cycle",
  );

  const readoutMarkdown = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md");
  assertPass(readoutMarkdown.includes("Mack has not returned a review."), "Mack review desk readout missing Mack-not-returned statement");
  assertPass(
    readoutMarkdown.includes("use it as the front door and current proof-count source"),
    "Mack review desk readout missing front-door operating note",
  );
  assertPass(readoutMarkdown.includes("Aeye input next"), "Mack review desk readout missing Aeye input next file-drawer role");
  assertPass(readoutMarkdown.includes("19 indexed"), "Mack review desk readout missing current handoff count");
  assertPass(readoutMarkdown.includes("Workspace Relay bridge"), "Mack review desk readout missing Workspace Relay bridge row");
  assertPass(readoutMarkdown.includes("Universal receiver proof is not claimed"), "Mack review desk readout missing receiver proof boundary");

  return {
    status: receipt.status,
    markdown_written: true,
    html_written: true,
    docx_written: true,
    mack_return_not_received_preserved: true,
    external_send_not_claimed: true,
    canonical_next_build_packet_absent: true,
    workspace_relay_receiver_handoff_bridge_pending: true,
    universal_receiver_proof_not_claimed: true,
    live_handoff_counts_match_current_index: true,
    generated_artifact_hashes_match_receipt: true,
    no_readiness_hash_cycle: true,
  };
}

async function verifyMackPastePacketReceipt(currentHandoffIndex) {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706_RECEIPT.json"));
  assertPass(receipt.status === "ARTIFACT", "Mack paste packet receipt is not ARTIFACT");
  assertPass(receipt.validation?.markdown_written === true, "Mack paste packet markdown not written");
  assertPass(receipt.validation?.html_written === true, "Mack paste packet HTML not written");
  assertPass(receipt.validation?.docx_written === true, "Mack paste packet DOCX not written");
  assertPass(receipt.validation?.source_handoff_ready_to_paste === true, "Mack paste packet source handoff not ready");
  assertPass(receipt.validation?.contains_readout_first_instruction === true, "Mack paste packet lost readout-first instruction");
  assertPass(receipt.validation?.contains_connection_map_paths === true, "Mack paste packet lost connection map paths");
  assertPass(receipt.validation?.contains_attack_scorecard_paths === true, "Mack paste packet lost attack scorecard paths");
  assertPass(receipt.validation?.contains_return_contract === true, "Mack paste packet lost return contract");
  assertPass(receipt.validation?.contains_scorecard_return_contract === true, "Mack paste packet lost scorecard return contract");
  assertPass(receipt.validation?.contains_scorecard_validator_command === true, "Mack paste packet lost scorecard validator command");
  assertPass(receipt.validation?.mack_return_not_received_preserved === true, "Mack paste packet lost Mack-not-received boundary");
  assertPass(receipt.validation?.canonical_next_build_packet_absent === true, "Mack paste packet lost next-build absence boundary");
  assertPass(receipt.validation?.external_send_not_claimed === true, "Mack paste packet falsely claims external send");
  assertPass(receipt.validation?.universal_receiver_proof_not_claimed === true, "Mack paste packet falsely claims universal receiver proof");
  assertPass(receipt.validation?.docx_structural_markers_present === true, "Mack paste packet DOCX structural markers missing");

  const readback = receipt.receiver_handoff_readback || {};
  assertPass(readback.count === currentHandoffIndex.count, "Mack paste packet handoff count stale");
  assertPass(readback.posted_count === currentHandoffIndex.posted_count, "Mack paste packet posted count stale");
  assertPass(readback.pending_count === currentHandoffIndex.pending_count, "Mack paste packet pending count stale");
  assertPass(readback.returned_unposted_count === currentHandoffIndex.returned_unposted_count, "Mack paste packet returned_unposted count stale");
  assertPass(
    readback.template_return_blocked_count === currentHandoffIndex.template_return_blocked_count,
    "Mack paste packet template_return_blocked count stale",
  );
  assertPass(readback.invalid_count === currentHandoffIndex.invalid_count, "Mack paste packet invalid count stale");
  assertPass(readback.malformed_count === currentHandoffIndex.malformed_count, "Mack paste packet malformed count stale");

  const sourceReceipts = receipt.source_receipts || [];
  assertPass(
    sourceReceipts.includes("foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT_20260706.json"),
    "Mack paste packet missing readiness source receipt path",
  );

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html",
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.docx",
    "foreman/handoffs/outbox/TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md",
    "scripts/foreman/build-mack-architecture-paste-packet.py",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `MACK_PASTE_PACKET_HASH_STALE:${relativePath}`);
  }

  const pasteMarkdown = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md");
  assertPass(pasteMarkdown.includes("Status: READY_TO_COPY_NOT_SENT"), "Mack paste packet missing ready-to-copy status");
  assertPass(pasteMarkdown.includes("Copy/Paste Block For Mack"), "Mack paste packet missing copy block heading");
  assertPass(pasteMarkdown.includes("MACK REVIEW RETURN"), "Mack paste packet missing return block");
  assertPass(pasteMarkdown.includes("MACK SCORECARD RETURN"), "Mack paste packet missing scorecard return block");
  assertPass(pasteMarkdown.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md"), "Mack paste packet missing connection map path");
  assertPass(pasteMarkdown.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md"), "Mack paste packet missing attack scorecard path");
  assertPass(pasteMarkdown.includes("mack-architecture-scorecard-return-validator.mjs"), "Mack paste packet missing scorecard validator command");
  assertPass(pasteMarkdown.includes("Mack has not returned a review."), "Mack paste packet missing Mack-not-returned statement");
  assertPass(pasteMarkdown.includes("Read `MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md` first."), "Mack paste packet missing readout-first read order");
  assertPass(pasteMarkdown.includes("Read `BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md` third."), "Mack paste packet missing connection map read order");
  assertPass(pasteMarkdown.includes("Read `MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md` fourth."), "Mack paste packet missing attack scorecard read order");
  assertPass(pasteMarkdown.includes("No canonical next-build packet exists."), "Mack paste packet missing next-build absence statement");

  return {
    status: receipt.status,
    markdown_written: true,
    html_written: true,
    docx_written: true,
    ready_to_copy_not_sent: true,
    mack_return_not_received_preserved: true,
    canonical_next_build_packet_absent: true,
    external_send_not_claimed: true,
    universal_receiver_proof_not_claimed: true,
    live_handoff_counts_match_current_index: true,
    generated_artifact_hashes_match_receipt: true,
  };
}

function extractMackPasteBlock(markdown) {
  const match = markdown.match(/## Copy\/Paste Block For Mack\s+```text\s+([\s\S]*?)\s+```\s+## After Mack Returns/);
  assertPass(Boolean(match), "Mack paste packet missing extractable copy block");
  return match[1].replace(/\r\n/g, "\n").trim();
}

async function verifyMackPasteBlockClipboardReceipt() {
  const receipt = JSON.parse(await readText("foreman/receipts/MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"));
  assertPass(receipt.status === "ARTIFACT", "Mack paste-block clipboard receipt is not ARTIFACT");
  assertPass(receipt.validation?.source_paste_packet_found === true, "Mack paste-block helper source packet missing");
  assertPass(receipt.validation?.source_block_markers_present === true, "Mack paste-block helper markers missing");
  assertPass(receipt.validation?.scorecard_return_block_present === true, "Mack paste-block helper scorecard return block missing");
  assertPass(receipt.validation?.clipboard_write_requires_copy_switch === true, "Mack paste-block helper lost explicit-copy gate");
  assertPass(receipt.validation?.external_send_not_claimed === true, "Mack paste-block helper falsely claims external send");
  assertPass(receipt.validation?.mack_return_not_claimed === true, "Mack paste-block helper falsely claims Mack return");

  const pasteMarkdown = await readText("foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md");
  const pasteBlock = extractMackPasteBlock(pasteMarkdown);
  const lineCount = pasteBlock.split("\n").length;
  assertPass(receipt.block_sha256?.toLowerCase() === sha256(pasteBlock).toLowerCase(), "Mack paste-block helper block hash stale");
  assertPass(receipt.block_line_count === lineCount, "Mack paste-block helper line count stale");
  assertPass(receipt.first_line === "Mack, tear this architecture apart.", "Mack paste-block helper first line changed");
  assertPass(pasteBlock.includes("MACK REVIEW RETURN"), "Mack paste-block helper source missing return block");
  assertPass(pasteBlock.includes("MACK SCORECARD RETURN"), "Mack paste-block helper source missing scorecard return block");
  assertPass(pasteBlock.includes("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md"), "Mack paste-block helper source missing connection map");
  assertPass(pasteBlock.includes("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md"), "Mack paste-block helper source missing attack scorecard");
  assertPass(pasteBlock.includes("Do not claim universal receiver proof"), "Mack paste-block helper source missing receiver proof boundary");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md",
    "scripts/foreman/Copy-MackArchitecturePasteBlock.ps1",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `MACK_PASTE_BLOCK_HELPER_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    copy_committed: Boolean(receipt.copy_committed),
    block_hash_current: true,
    block_line_count: lineCount,
    clipboard_write_requires_copy_switch: true,
    external_send_not_claimed: true,
    mack_return_not_claimed: true,
    source_hashes_current: true,
  };
}

async function verifyMackHandoffReceipts(currentHandoffIndex) {
  const handoffReceipt = JSON.parse(await readText("foreman/receipts/MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_HANDOFF_RECEIPT_20260706.json"));
  const tighteningReceipt = JSON.parse(
    await readText("foreman/receipts/MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_HANDOFF_TIGHTENING_RECEIPT_20260706.json"),
  );

  assertPass(handoffReceipt.status === "ARTIFACT", "Mack handoff receipt is not ARTIFACT");
  assertPass(tighteningReceipt.status === "ARTIFACT", "Mack handoff tightening receipt is not ARTIFACT");
  assertPass(handoffReceipt.validation?.handoff_is_ready_to_paste === true, "Mack handoff receipt lost ready-to-paste proof");
  assertPass(
    handoffReceipt.validation?.contains_readout_first_instruction === true,
    "Mack handoff receipt missing readout-first proof",
  );
  assertPass(handoffReceipt.validation?.contains_readout_paths === true, "Mack handoff receipt missing readout path proof");
  assertPass(
    handoffReceipt.validation?.contains_universal_receiver_proof_boundary === true,
    "Mack handoff receipt missing universal receiver proof boundary",
  );

  const handoffReadback = handoffReceipt.receiver_handoff_readback || {};
  assertPass(handoffReadback.count === currentHandoffIndex.count, "Mack handoff receipt count stale");
  assertPass(handoffReadback.posted_count === currentHandoffIndex.posted_count, "Mack handoff receipt posted count stale");
  assertPass(handoffReadback.pending_count === currentHandoffIndex.pending_count, "Mack handoff receipt pending count stale");
  assertPass(handoffReadback.returned_unposted_count === currentHandoffIndex.returned_unposted_count, "Mack handoff receipt returned_unposted count stale");
  assertPass(
    handoffReadback.template_return_blocked_count === currentHandoffIndex.template_return_blocked_count,
    "Mack handoff receipt template_return_blocked count stale",
  );
  assertPass(handoffReadback.invalid_count === currentHandoffIndex.invalid_count, "Mack handoff receipt invalid count stale");
  assertPass(handoffReadback.malformed_count === currentHandoffIndex.malformed_count, "Mack handoff receipt malformed count stale");
  assertPass(handoffReadback.operator_scope_visible === 1, "Mack handoff receipt operator scope count stale");
  assertPass(handoffReadback.synthetic_scope_visible === 18, "Mack handoff receipt synthetic scope count stale");

  assertPass(
    tighteningReceipt.validation?.handoff_includes_readout_first_instruction === true,
    "Mack handoff tightening receipt missing readout-first proof",
  );
  assertPass(
    tighteningReceipt.validation?.handoff_includes_current_19_6_9_3_1_counts === true,
    "Mack handoff tightening receipt missing current counts proof",
  );
  assertPass(
    tighteningReceipt.validation?.handoff_preserves_universal_receiver_proof_boundary === true,
    "Mack handoff tightening receipt missing receiver proof boundary",
  );
  assertPass(
    tighteningReceipt.validation?.readiness_verifier_enforces_handoff_readout_and_counts === true,
    "Mack handoff tightening receipt missing readiness verifier enforcement proof",
  );

  const expectedHashes = [
    {
      receipt: handoffReceipt,
      path: "foreman/handoffs/outbox/TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md",
      label: "MACK_HANDOFF_RECEIPT_HASH_STALE",
    },
    {
      receipt: handoffReceipt,
      path: "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.md",
      label: "MACK_HANDOFF_RECEIPT_HASH_STALE",
    },
    {
      receipt: tighteningReceipt,
      path: "foreman/handoffs/outbox/TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md",
      label: "MACK_HANDOFF_TIGHTENING_HASH_STALE",
    },
    {
      receipt: tighteningReceipt,
      path: "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md",
      label: "MACK_HANDOFF_TIGHTENING_HASH_STALE",
    },
    {
      receipt: tighteningReceipt,
      path: "scripts/foreman/mack-architecture-review-desk-readiness.mjs",
      label: "MACK_HANDOFF_TIGHTENING_HASH_STALE",
    },
  ];
  for (const expected of expectedHashes) {
    const receiptHashes = new Map(
      (expected.receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
    );
    const raw = await readFile(path.join(ROOT, expected.path));
    assertPass(receiptHashes.get(expected.path) === sha256(raw).toLowerCase(), `${expected.label}:${expected.path}`);
  }

  return {
    handoff_receipt_status: handoffReceipt.status,
    tightening_receipt_status: tighteningReceipt.status,
    readout_first_instruction_receipted: true,
    current_counts_receipted: true,
    universal_receiver_proof_boundary_receipted: true,
    receipt_hashes_current: true,
  };
}

async function main() {
  const artifactHashes = await hashRequiredFiles(REQUIRED_ARTIFACTS);
  const parsedReceipts = await parseRequiredReceipts();
  const sources = await sourceReadbacks();
  const connectionMap = await verifyConnectionMapReceipt();
  const attackScorecard = await verifyAttackScorecardReceipt();
  const scorecardReturn = await verifyScorecardReturnReceipts();
  const contractCanon = await verifyContractCanonReceipt();
  const eventSpine = await verifyEventSpineReceipt();
  const bootContext = await verifyBootContextRefreshReceipt();
  const clipboardImporter = await verifyClipboardImporterSmokeReceipt();
  const returnReceiver = await verifyReturnReceiverSmokeReceipt();
  const returnAcceptance = await verifyReturnAcceptanceSmokeReceipt();
  const reviewFlowState = await verifyReviewFlowStateReceipts();
  const returnDropProcessor = await verifyReturnDropProcessorReceipts();
  const reviewLaneCoordinator = await verifyReviewLaneCoordinatorReceipts();
  const returnDropWatcher = await verifyReturnDropWatcherReceipts();
  const statusRefresh = await verifyStatusRefreshReceipts();
  const sendReturnRoundTrip = await verifySendReturnRoundTripSmokeReceipt();
  const handoffIndex = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=30`);
  const receiverProof = await verifyReceiverProofEverywhereAuditReceipt(handoffIndex);
  const deskReadout = await verifyMackReviewDeskReadoutReceipt(handoffIndex);
  const pastePacket = await verifyMackPastePacketReceipt(handoffIndex);
  const pasteBlockHelper = await verifyMackPasteBlockClipboardReceipt();
  const mackHandoff = await verifyMackHandoffReceipts(handoffIndex);
  const validator = await runValidatorReadback();
  const launcher = await runLauncherDryRun();
  const launcherSmoke = await verifyLauncherSmokeReceipt();
  const healthcheck = await verifyHealthcheckReceipt();

  const canonicalNextBuildExists = existsSync(NEXT_BUILD_PACKET_PATH);
  assertPass(!canonicalNextBuildExists, "CANONICAL_NEXT_BUILD_PACKET_EXISTS_BEFORE_MACK_AND_BEN_GATES");
  assertPass(handoffIndex.count === 19, "receiver handoff count drifted from Workspace Relay bridge proof");
  assertPass(handoffIndex.posted_count === 6, "posted count drifted from Workspace Relay bridge proof");
  assertPass(handoffIndex.pending_count === 9, "pending count drifted from Workspace Relay bridge proof");
  assertPass(handoffIndex.returned_unposted_count === 3, "ready count drifted from Workspace Relay bridge proof");
  assertPass(handoffIndex.template_return_blocked_count === 1, "blocked count drifted from Workspace Relay bridge proof");
  assertPass(handoffIndex.invalid_count === 0, "invalid handoff count not zero");
  assertPass(handoffIndex.malformed_count === 0, "malformed handoff count not zero");

  const receipt = {
    schema: "MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706",
    receipt_id: "MACK_ARCHITECTURE_REVIEW_DESK_READINESS_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/mack-architecture-review-desk-readiness.mjs",
    validation: {
      required_artifacts_exist: true,
      required_receipts_parse: true,
      index_boundaries_present: true,
      connection_map_indexed: sources.index_has_connection_map,
      connection_map_receipt_current: connectionMap.file_hashes_current,
      connection_map_json_valid: connectionMap.json_manifest_valid,
      connection_map_no_mack_return_claimed: connectionMap.no_mack_return_claimed,
      connection_map_no_universal_receiver_proof_claimed: connectionMap.no_universal_receiver_proof_claimed,
      attack_scorecard_indexed: sources.index_has_attack_scorecard,
      attack_scorecard_receipt_current: attackScorecard.file_hashes_current,
      attack_scorecard_json_valid: attackScorecard.json_manifest_valid,
      attack_scorecard_unfilled_template: attackScorecard.unfilled_template,
      attack_scorecard_no_mack_review_return_claimed: attackScorecard.no_mack_review_return_claimed,
      attack_scorecard_ben_gate_required_for_conversion: attackScorecard.ben_gate_required_for_conversion,
      scorecard_return_intake_indexed: sources.index_has_scorecard_return_intake,
      scorecard_return_validator_indexed: sources.index_has_scorecard_return_validator,
      scorecard_return_waiting_for_mack: scorecardReturn.live_blocker_code === "MACK_SCORECARD_RETURN_NOT_RECEIVED",
      scorecard_return_smoke_current: scorecardReturn.current_script_hashes_match_receipt,
      contract_canon_smoke_current: contractCanon.current_contract_hashes_match_receipt,
      event_spine_smoke_current: eventSpine.current_script_hashes_match_receipt,
      event_spine_fixture_events_still_join: eventSpine.fixture_events_still_join,
      boot_context_refresh_current: bootContext.current_script_hashes_match_receipt,
      boot_context_world_state_fresh_under_12h: bootContext.world_state_fresh_under_12h,
      clipboard_importer_indexed: sources.index_has_clipboard_importer,
      clipboard_importer_smoke_current: clipboardImporter.current_script_hashes_match_receipt,
      return_receiver_wrapper_indexed: sources.index_has_return_receiver_wrapper,
      return_receiver_smoke_indexed: sources.index_has_return_receiver_smoke,
      return_receiver_smoke_current: returnReceiver.current_script_hashes_match_receipt,
      return_acceptance_wrapper_indexed: sources.index_has_return_acceptance_wrapper,
      return_acceptance_smoke_indexed: sources.index_has_return_acceptance_smoke,
      return_acceptance_smoke_current: returnAcceptance.current_script_hashes_match_receipt,
      review_flow_state_indexed: sources.index_has_review_flow_state,
      review_flow_state_smoke_indexed: sources.index_has_review_flow_state_smoke,
      review_flow_state_current: reviewFlowState.current_script_hashes_match_receipt,
      review_flow_state_waiting_for_mack: reviewFlowState.live_flow_state === "WAITING_FOR_MACK_RETURN",
      return_drop_processor_indexed: sources.index_has_return_drop_processor,
      return_drop_processor_smoke_indexed: sources.index_has_return_drop_processor_smoke,
      return_drop_processor_live_empty: returnDropProcessor.live_blocker_code === "MACK_RETURN_DROP_EMPTY",
      return_drop_processor_smoke_current: returnDropProcessor.current_script_hashes_match_receipt,
      review_lane_coordinator_indexed: sources.index_has_lane_coordinator,
      review_lane_coordinator_live_drop_empty: reviewLaneCoordinator.live_blocker_code === "MACK_RETURN_DROP_EMPTY",
      review_lane_coordinator_smoke_current: reviewLaneCoordinator.current_script_hashes_match_receipt,
      return_drop_watcher_indexed: sources.index_has_return_drop_watcher,
      return_drop_watcher_smoke_indexed: sources.index_has_return_drop_watcher_smoke,
      return_drop_watcher_live_once_drop_empty: returnDropWatcher.live_last_blocker_code === "MACK_RETURN_DROP_EMPTY",
      return_drop_watcher_smoke_current: returnDropWatcher.current_script_hashes_match_receipt,
      status_refresh_indexed: sources.index_has_status_refresh,
      status_refresh_smoke_indexed: sources.index_has_status_refresh_smoke,
      status_refresh_live_waiting_for_drop: statusRefresh.live_lane_status === "WAITING_FOR_MACK_RETURN_DROP",
      status_refresh_smoke_current: statusRefresh.current_script_hashes_match_receipt,
      send_return_roundtrip_smoke_indexed: sources.index_has_send_return_roundtrip_smoke,
      send_return_roundtrip_smoke_current: sendReturnRoundTrip.current_script_hashes_match_receipt,
      receiver_proof_coverage_audit_indexed: sources.index_has_receiver_proof_audit,
      receiver_proof_coverage_audit_current: receiverProof.current_script_hashes_match_receipt,
      receiver_proof_universal_claim_absent: receiverProof.universal_receiver_proof_claimed === false,
      mack_review_desk_readout_indexed: sources.index_has_mack_review_desk_readout,
      mack_review_desk_status_indexed: sources.index_has_mack_review_desk_status,
      mack_review_desk_readout_current: deskReadout.generated_artifact_hashes_match_receipt,
      mack_paste_packet_indexed: sources.index_has_mack_paste_packet,
      mack_paste_packet_current: pastePacket.generated_artifact_hashes_match_receipt,
      mack_paste_block_clipboard_helper_indexed: sources.index_has_mack_paste_block_clipboard_helper,
      mack_paste_block_clipboard_helper_current: pasteBlockHelper.block_hash_current,
      mack_handoff_receipts_current: mackHandoff.receipt_hashes_current,
      workspace_relay_receiver_handoff_bridge_pending: receiverProof.workspace_relay_receiver_handoff_bridge_pending,
      handoff_ready_to_paste: sources.handoff_ready_to_paste,
      intake_waiting_for_mack: sources.intake_waiting_for_mack,
      validator_reports_mack_not_received: validator.blocker_code === "MACK_RETURN_NOT_RECEIVED",
      launcher_dry_run_ready: launcher.status === "READY_TO_OPEN",
      launcher_smoke_indexed: sources.index_has_launcher_smoke,
      launcher_smoke_current: launcherSmoke.current_script_hashes_match_receipt,
      healthcheck_indexed: sources.index_has_healthcheck,
      healthcheck_receipt_valid: healthcheck.status === "ARTIFACT",
      healthcheck_typecheck_status: healthcheck.typecheck_status,
      healthcheck_no_external_send_claimed: healthcheck.no_external_send_claimed,
      healthcheck_no_clipboard_write: healthcheck.no_clipboard_write_by_healthcheck,
      healthcheck_no_canonical_next_build_packet_generated: healthcheck.no_canonical_next_build_packet_generated,
      canonical_next_build_packet_absent: !canonicalNextBuildExists,
      live_receiver_handoff_counts_match_index: true,
      no_external_send_claim: true,
      no_mack_receipt_claim: true,
      truth_boundary:
        "This readiness audit proves the local Mack review desk is assembled and waiting. It does not send anything to Mack and does not claim Mack returned a review.",
    },
    receiver_handoff_readback: {
      count: handoffIndex.count,
      posted_count: handoffIndex.posted_count,
      pending_count: handoffIndex.pending_count,
      returned_unposted_count: handoffIndex.returned_unposted_count,
      template_return_blocked_count: handoffIndex.template_return_blocked_count,
      invalid_count: handoffIndex.invalid_count,
      malformed_count: handoffIndex.malformed_count,
    },
    source_readbacks: sources,
    connection_map_readback: connectionMap,
    attack_scorecard_readback: attackScorecard,
    scorecard_return_readback: scorecardReturn,
    contract_canon_readback: contractCanon,
    event_spine_readback: eventSpine,
    boot_context_readback: bootContext,
    clipboard_importer_smoke_readback: clipboardImporter,
    return_receiver_smoke_readback: returnReceiver,
    return_acceptance_smoke_readback: returnAcceptance,
    review_flow_state_readback: reviewFlowState,
    return_drop_processor_readback: returnDropProcessor,
    review_lane_coordinator_readback: reviewLaneCoordinator,
    return_drop_watcher_readback: returnDropWatcher,
    status_refresh_readback: statusRefresh,
    send_return_roundtrip_smoke_readback: sendReturnRoundTrip,
    receiver_proof_coverage_readback: receiverProof,
    mack_review_desk_readout_readback: deskReadout,
    mack_paste_packet_readback: pastePacket,
    mack_paste_block_clipboard_helper_readback: pasteBlockHelper,
    mack_handoff_receipts_readback: mackHandoff,
    validator_readback: validator,
    launcher_dry_run_readback: {
      status: launcher.status,
      dry_run: launcher.dry_run,
      proof_links: launcher.proof_links,
    },
    launcher_smoke_readback: launcherSmoke,
    healthcheck_readback: healthcheck,
    parsed_receipts: parsedReceipts,
    file_hashes: artifactHashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external send claim",
      "no Mack receipt claim",
      "no canonical next-build packet generated",
      "no long-running watcher started by readiness",
    ],
    next_safe_action:
      "Use scripts/foreman/Get-MackArchitectureReviewFlowState.ps1 first. If Mack returned a file, put it in foreman/handoffs/inbox/mack-architecture-return-drop/ and run scripts/foreman/Watch-MackArchitectureReturnDrop.ps1 -Once or scripts/foreman/Invoke-MackArchitectureReviewLane.ps1 before any -Commit.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        validator_blocker: validator.blocker_code,
        launcher_status: launcher.status,
        return_receiver_smoke_status: returnReceiver.status,
        return_acceptance_smoke_status: returnAcceptance.status,
        review_flow_state: reviewFlowState.live_flow_state,
        return_drop_blocker: returnDropProcessor.live_blocker_code,
        review_lane_state: reviewLaneCoordinator.live_lane_state,
        return_drop_watch_state: returnDropWatcher.live_last_lane_state,
        status_refresh_state: statusRefresh.live_lane_status,
        healthcheck_status: healthcheck.status,
        healthcheck_typecheck_status: healthcheck.typecheck_status,
        connection_map_status: connectionMap.status,
        attack_scorecard_status: attackScorecard.status,
        scorecard_return_blocker: scorecardReturn.live_blocker_code,
        canonical_next_build_exists: canonicalNextBuildExists,
        counts: receipt.receiver_handoff_readback,
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
