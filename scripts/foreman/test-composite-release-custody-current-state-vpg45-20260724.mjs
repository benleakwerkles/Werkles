#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateCompositeReleaseCustody,
  trustedEvidenceDigest
} from "./composite-release-custody-guard-vpg45-20260724.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const cycleId = "WERKLES-FLOCK-20260724-221246-ET-BETSY-01";
const legacyLabel = "VPG45";
const fixturePath =
  "scripts/foreman/fixtures/vpg45-composite-release-custody-complete-20260724.json";
const ledgerPath = "foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl";
const approvalLogPath = "foreman/gates/APPROVAL_LOG.md";
const harveyDecisionPath =
  "foreman/receipts/WERKLES_VPG43_HARVEY_COEXISTENCE_DECISION_CONTRACT_20260724.json";
const releaseReceiptPath =
  "foreman/receipts/WERKLES_FULL_FLOCK_VPG44_G_RELEASE_CUSTODY_RED_TEAM_20260724.md";

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function currentCycleRecord() {
  return fileText(ledgerPath)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .find((record) => record.cycle_id === cycleId);
}

const base = JSON.parse(fileText(fixturePath));
const branch = git(["branch", "--show-current"]);
const headSha = git(["rev-parse", "HEAD"]);
const upstreamSha = git(["rev-parse", "@{u}"]);
const trackedDirty = git(["diff", "--name-only"]).split(/\r?\n/).filter(Boolean);
const staged = git(["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean);
const untracked = git(["ls-files", "--others", "--exclude-standard"])
  .split(/\r?\n/)
  .filter(Boolean);
const cycleRecord = currentCycleRecord();
const approvalLog = fileText(approvalLogPath);
const cycleApprovalRows = approvalLog
  .split(/\r?\n/)
  .filter((line) => line.includes(cycleId));
const productionApprovalRows = cycleApprovalRows.filter((line) =>
  line.includes("APPROVE WERKLES PRODUCTION ALIAS")
);
const jReceiptNames = readdirSync(path.join(repoRoot, "foreman/receipts")).filter(
  (name) => name.includes("VPG45") && /(?:^|_)J(?:_|\.|$)/.test(name)
);
const harvey = JSON.parse(fileText(harveyDecisionPath));
const releaseReceipt = fileText(releaseReceiptPath);

const request = {
  ...base.request,
  branch,
  headSha,
  candidateDeploymentId: harvey.candidate.deployment_id,
  productionDeploymentId: harvey.current_production.deployment_id,
  rollbackDeploymentId: harvey.rollback.deployment_id,
  aliases: [harvey.current_production.primary_alias],
  cycleId,
  legacyLabel,
  harveyMode: harvey.selected_mode,
  evidenceDigest: ""
};

const trustedEvidence = {
  ...base.trusted_evidence,
  snapshotDigest: "",
  git: {
    branch,
    headSha,
    upstreamSha,
    dirty: trackedDirty.length > 0 || untracked.length > 0,
    untrackedCount: untracked.length
  },
  aliases: [harvey.current_production.primary_alias],
  cycle: {
    id: cycleId,
    legacyLabel,
    status: cycleRecord?.status ?? "MISSING",
    guardResult: cycleRecord?.status === "COMPLETED" ? "PASS" : "STOP",
    recordDigest: cycleRecord
      ? sha256Text(JSON.stringify(cycleRecord))
      : sha256Text("VPG45_CYCLE_RECORD_MISSING")
  },
  j: null,
  approval: null,
  release: {
    result: releaseReceipt.includes("RELEASE_BLOCKED") ? "STOP" : "UNKNOWN",
    headSha,
    candidateSourceSha: harvey.candidate.commit,
    candidateDeploymentId: harvey.candidate.deployment_id,
    productionDeploymentId: harvey.current_production.deployment_id,
    recordDigest: sha256Text(releaseReceipt)
  },
  harvey: {
    result: "STOP",
    state: harvey.selected_mode === null ? "UNRESOLVED" : "RESOLVED",
    authority: harvey.operator_attestation ? "HUMAN_GATE" : null,
    executionAuthorized: harvey.execution_authorized,
    recordPresent: true,
    cycleId: harvey.cycle_id,
    mode: harvey.selected_mode,
    candidateDeploymentId: harvey.candidate.deployment_id,
    productionDeploymentId: harvey.current_production.deployment_id,
    rollbackDeploymentId: harvey.rollback.deployment_id,
    recordDigest: sha256Text(fileText(harveyDecisionPath))
  },
  rollback: {
    deploymentId: harvey.rollback.deployment_id,
    commit: harvey.rollback.commit,
    isCoexistence: harvey.rollback.is_coexistence,
    purpose: harvey.rollback.purpose
  }
};

trustedEvidence.snapshotDigest = trustedEvidenceDigest(trustedEvidence);
request.evidenceDigest = trustedEvidence.snapshotDigest;

const result = evaluateCompositeReleaseCustody(request, trustedEvidence);
const reasonCodes = result.reasons.map((reason) => reason.code);
const expectedStableStops = [
  "DIRTY_WORKTREE",
  "UNTRACKED_EVIDENCE",
  "J_RECEIPT_MISSING",
  "APPROVAL_RECORD_NOT_AUTHORITATIVE",
  "RELEASE_INTEGRITY_NOT_PASS",
  "HARVEY_DISPOSITION_UNRESOLVED",
  "HARVEY_AUTHORITY_MISSING"
];

assert.equal(result.ok, false, "current local state must not authorize release");
assert.equal(result.result, "STOP", "current local state must return STOP");
for (const code of expectedStableStops) {
  assert.ok(reasonCodes.includes(code), `current local state missing ${code}`);
}
if (!cycleRecord) {
  assert.ok(reasonCodes.includes("CYCLE_INCOMPLETE"), "missing VPG45 ledger row did not stop");
}
assert.equal(staged.length, 0, "current-state proof expected the Git index to remain empty");
assert.equal(jReceiptNames.length, 0, "current-state proof unexpectedly found a VPG45 J receipt");
assert.equal(
  productionApprovalRows.length,
  0,
  "ordinary VPG45 approval must not be Production alias authority"
);

console.log(
  JSON.stringify(
    {
      schema: "werkles.vpg45-ender-current-release-custody-attestation/v1",
      cycle_id: cycleId,
      legacy_label: legacyLabel,
      seat: "Ender@Betsy",
      execution_context: "CODEX_LOCAL on local BETSY Windows",
      network_or_provider_contact: false,
      environment_names_only: Object.keys(process.env).sort(),
      git: {
        branch,
        head_sha: headSha,
        upstream_sha: upstreamSha,
        tracked_dirty_count: trackedDirty.length,
        untracked_count: untracked.length,
        staged_count: staged.length
      },
      durable_evidence: {
        cycle_ledger_row_present: Boolean(cycleRecord),
        cycle_approval_row_count: cycleApprovalRows.length,
        production_alias_approval_row_count: productionApprovalRows.length,
        current_cycle_j_receipt_count: jReceiptNames.length,
        release_receipt: releaseReceiptPath,
        harvey_decision: harveyDecisionPath,
        snapshot_digest: trustedEvidence.snapshotDigest
      },
      requested_release: {
        candidate_deployment_id: request.candidateDeploymentId,
        production_deployment_id: request.productionDeploymentId,
        rollback_deployment_id: request.rollbackDeploymentId,
        aliases: request.aliases,
        harvey_mode: request.harveyMode
      },
      result: result.result,
      reason_codes: reasonCodes,
      reasons: result.reasons
    },
    null,
    2
  )
);
