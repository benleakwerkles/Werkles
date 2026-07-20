#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CYCLE_ID_PATTERN = /^WERKLES-FLOCK-\d{8}-\d{6}-ET-[A-Z0-9_-]+-\d{2}$/;
const LEGACY_LABEL_PATTERN = /^VPG(\d+)$/;

function addReason(reasons, reason, detail) {
  reasons.push({ reason, detail });
}

function exactLabelPattern(label) {
  return new RegExp(`(?:^|[^0-9])${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9])`);
}

function artifactCarriesIdentity(text, cycleId, legacyLabel) {
  const value = String(text ?? "");
  try {
    const parsed = JSON.parse(value);
    return parsed.cycle_id === cycleId && parsed.legacy_label === legacyLabel;
  } catch {
    return value.includes(`CYCLE_ID: \`${cycleId}\``) && value.includes(`LEGACY_LABEL: \`${legacyLabel}\``);
  }
}

export function evaluateFlockCycleIdentity(input = {}) {
  const record = input.record ?? {};
  const artifacts = input.artifacts ?? {};
  const historyPaths = input.historyPaths ?? [];
  const knownCycles = input.knownCycles ?? [];
  const approvalText = String(input.approvalText ?? "");
  const reasons = [];

  if (!record.cycle_id) addReason(reasons, "MISSING_CYCLE_ID", "cycle_id is required.");
  else if (!CYCLE_ID_PATTERN.test(record.cycle_id)) {
    addReason(reasons, "INVALID_CYCLE_ID", record.cycle_id);
  }

  if (!record.legacy_label) addReason(reasons, "MISSING_LEGACY_LABEL", "legacy_label is required.");
  const labelMatch = LEGACY_LABEL_PATTERN.exec(record.legacy_label ?? "");
  if (record.legacy_label && !labelMatch) addReason(reasons, "INVALID_LEGACY_LABEL", record.legacy_label);

  if (record.ordinal_claim !== null) {
    addReason(reasons, "UNSUPPORTED_ORDINAL_CLAIM", "ordinal_claim must remain null unless a reproducible counting rule is adopted.");
  }

  if (!['fresh_cycle', 'continuation'].includes(record.kind)) {
    addReason(reasons, "INVALID_CYCLE_KIND", String(record.kind ?? "missing"));
  } else if (record.kind === "continuation" && !record.parent_cycle_id) {
    addReason(reasons, "CONTINUATION_PARENT_MISSING", "continuations require parent_cycle_id.");
  }

  for (const cycle of knownCycles) {
    if (cycle.cycle_id === record.cycle_id) {
      addReason(reasons, "CYCLE_ID_REUSED", `${record.cycle_id} already belongs to another ledger row.`);
    }
    if (cycle.legacy_label === record.legacy_label && cycle.cycle_id !== record.cycle_id) {
      addReason(reasons, "LEGACY_LABEL_REUSED", `${record.legacy_label} already belongs to ${cycle.cycle_id}.`);
    }
  }

  const packetPaths = Array.isArray(record.packet_paths) ? record.packet_paths : [];
  if (packetPaths.length !== 2 || new Set(packetPaths).size !== 2) {
    addReason(reasons, "PACKET_COUNT_MISMATCH", `Expected exactly two distinct packets, got ${packetPaths.length}.`);
  }

  const pReceipts = Array.isArray(record.receipt_paths?.p) ? record.receipt_paths.p : [];
  const gReceipts = Array.isArray(record.receipt_paths?.g) ? record.receipt_paths.g : [];
  const aggregateReceipt = record.receipt_paths?.aggregate ? [record.receipt_paths.aggregate] : [];
  if (pReceipts.length !== 2 || gReceipts.length !== 2 || aggregateReceipt.length !== 1) {
    addReason(reasons, "RECEIPT_SET_MISMATCH", "Completed fresh cycles require two P receipts, two G receipts, and one aggregate receipt.");
  }

  const requiredArtifactPaths = [...packetPaths, ...pReceipts, ...gReceipts, ...aggregateReceipt];
  if (record.release?.attestation_path) requiredArtifactPaths.push(record.release.attestation_path);

  if (record.status === "COMPLETED") {
    for (const artifactPath of requiredArtifactPaths) {
      if (!Object.hasOwn(artifacts, artifactPath)) {
        addReason(reasons, "COMPLETION_ARTIFACT_MISSING", artifactPath);
        continue;
      }
      if (!artifactCarriesIdentity(artifacts[artifactPath], record.cycle_id, record.legacy_label)) {
        addReason(reasons, "ARTIFACT_IDENTITY_MISMATCH", artifactPath);
      }
    }
  }

  if (!approvalText.includes(record.cycle_id ?? "") || !approvalText.includes(record.legacy_label ?? "")) {
    addReason(reasons, "APPROVAL_IDENTITY_MISSING", "Approval log must carry both cycle ID and legacy label.");
  }

  if (record.legacy_label) {
    const labelPattern = exactLabelPattern(record.legacy_label);
    const preexisting = historyPaths.filter((entry) => labelPattern.test(entry));
    if (preexisting.length) {
      addReason(reasons, "LEGACY_LABEL_PREEXISTED_CYCLE", preexisting.slice(0, 5).join(", "));
    }
  }

  const attestationPath = record.release?.attestation_path;
  if (record.status === "COMPLETED" && attestationPath && Object.hasOwn(artifacts, attestationPath)) {
    try {
      const attestation = JSON.parse(artifacts[attestationPath]);
      const expectedCandidate = record.release?.candidate ?? {};
      const expectedProduction = record.release?.production ?? {};
      if (
        attestation.candidate?.deployment_id !== expectedCandidate.deployment_id ||
        attestation.candidate?.source_sha !== expectedCandidate.source_sha
      ) {
        addReason(reasons, "CANDIDATE_EVIDENCE_MISMATCH", attestationPath);
      }
      if (
        attestation.production?.deployment_id !== expectedProduction.deployment_id ||
        attestation.production?.release_label !== expectedProduction.release_label ||
        attestation.production?.changed_by_cycle !== expectedProduction.changed_by_cycle
      ) {
        addReason(reasons, "PRODUCTION_EVIDENCE_MISMATCH", attestationPath);
      }
    } catch (error) {
      addReason(reasons, "ATTESTATION_INVALID_JSON", error.message);
    }
  }

  return {
    ok: reasons.length === 0,
    result: reasons.length === 0 ? "PASS" : "STOP",
    cycle_id: record.cycle_id ?? null,
    legacy_label: record.legacy_label ?? null,
    reasons
  };
}

function parseArgs(argv) {
  const args = {
    ledger: "foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] ?? "";
    if (arg === "--ledger") args.ledger = next();
    else if (arg === "--cycle-id") args.cycleId = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readLedger(ledgerPath) {
  return readFileSync(ledgerPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function collectArtifacts(repoRoot, record) {
  const paths = [
    ...(record.packet_paths ?? []),
    ...(record.receipt_paths?.p ?? []),
    ...(record.receipt_paths?.g ?? []),
    ...(record.receipt_paths?.aggregate ? [record.receipt_paths.aggregate] : []),
    ...(record.release?.attestation_path ? [record.release.attestation_path] : [])
  ];
  return Object.fromEntries(
    paths
      .filter((entry) => existsSync(path.resolve(repoRoot, entry)))
      .map((entry) => [entry, readFileSync(path.resolve(repoRoot, entry), "utf8")])
  );
}

function historyBeforeCycle(repoRoot, createdAt) {
  const args = ["log", "--all", `--before=${createdAt}`, "--name-only", "--pretty=format:"];
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.cycleId) throw new Error("--cycle-id is required.");
  const repoRoot = process.cwd();
  const ledgerPath = path.resolve(repoRoot, args.ledger);
  const records = readLedger(ledgerPath);
  const record = records.find((entry) => entry.cycle_id === args.cycleId);
  if (!record) throw new Error(`Cycle not found: ${args.cycleId}`);

  const approvalPath = path.resolve(repoRoot, record.approval_log_path);
  const result = evaluateFlockCycleIdentity({
    record,
    knownCycles: records.filter((entry) => entry !== record),
    artifacts: collectArtifacts(repoRoot, record),
    approvalText: existsSync(approvalPath) ? readFileSync(approvalPath, "utf8") : "",
    historyPaths: historyBeforeCycle(repoRoot, record.created_at)
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();

