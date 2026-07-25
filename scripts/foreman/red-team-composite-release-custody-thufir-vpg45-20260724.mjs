#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateCompositeReleaseCustody,
  RELEASE_CUSTODY_REQUEST_SCHEMA,
  RELEASE_CUSTODY_TRUSTED_SCHEMA,
  REQUIRED_PRODUCTION_RELEASE_PHRASE,
  REQUIRED_PRODUCTION_RELEASE_SCOPE,
  trustedEvidenceDigest
} from "./composite-release-custody-guard-vpg45-20260724.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const catalogPath =
  "scripts/foreman/fixtures/vpg45-thufir-release-custody-adversaries-20260724.json";
const approvalLogPath = "foreman/gates/APPROVAL_LOG.md";
const catalog = JSON.parse(readFileSync(path.join(repoRoot, catalogPath), "utf8"));
const approvalLog = readFileSync(path.join(repoRoot, approvalLogPath), "utf8");
const vpg45ApprovalRow = approvalLog
  .split(/\r?\n/)
  .find((line) => line.includes("WERKLES-FLOCK-20260724-221246-ET-BETSY-01"));

assert.ok(vpg45ApprovalRow, "VPG45 approval row is missing");
assert.match(vpg45ApprovalRow, /\| APPROVED \|/);
assert.match(vpg45ApprovalRow, /\| `V, P, G` \|/);
assert.match(vpg45ApprovalRow, /No J, stage, commit, push/);
assert.match(vpg45ApprovalRow, /deployment, promotion, alias, environment, Production/);
assert.equal(catalog.ideas.length, 2, "Thufir must execute exactly two ideas");
assert.equal(
  catalog.ideas.reduce((count, idea) => count + idea.cases.length, 0),
  15,
  "Thufir attack catalog unexpectedly changed"
);

const HEAD = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_SHA = "1111111111111111111111111111111111111111";
const CYCLE = "WERKLES-FLOCK-20260724-221246-ET-BETSY-01";
const OLD_J_CYCLE = "WERKLES-FLOCK-20260724-110445-ET-BETSY-01";
const BRANCH = "codex/werkles-vpg31-20260721";
const CANDIDATE = "dpl_vpg45candidate";
const PRODUCTION = "dpl_vpg45production";
const ROLLBACK = "dpl_vpg45rollback";
const HARVEY_MODE = "PRESERVE_RECONCILE";
const RECORD = {
  cycle: "b".repeat(64),
  j: "c".repeat(64),
  approval: "d".repeat(64),
  release: "e".repeat(64),
  harvey: "f".repeat(64)
};

function clone(value) {
  return structuredClone(value);
}

function selfHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function completeFixture() {
  const value = {
    request: {
      schema: RELEASE_CUSTODY_REQUEST_SCHEMA,
      branch: BRANCH,
      headSha: HEAD,
      candidateDeploymentId: CANDIDATE,
      productionDeploymentId: PRODUCTION,
      rollbackDeploymentId: ROLLBACK,
      aliases: ["werkles.com"],
      cycleId: CYCLE,
      legacyLabel: "VPG45",
      harveyMode: HARVEY_MODE,
      evidenceDigest: ""
    },
    trustedEvidence: {
      schema: RELEASE_CUSTODY_TRUSTED_SCHEMA,
      snapshotDigest: "",
      git: {
        branch: BRANCH,
        headSha: HEAD,
        upstreamSha: HEAD,
        dirty: false,
        untrackedCount: 0
      },
      aliases: ["werkles.com"],
      cycle: {
        id: CYCLE,
        legacyLabel: "VPG45",
        status: "COMPLETED",
        guardResult: "PASS",
        recordDigest: RECORD.cycle
      },
      j: {
        result: "PASS",
        cycleId: CYCLE,
        legacyLabel: "VPG45",
        branch: BRANCH,
        headSha: HEAD,
        upstreamSha: HEAD,
        remoteEqual: true,
        recordDigest: RECORD.j
      },
      approval: {
        authoritative: true,
        recordPresent: true,
        sourcePath: approvalLogPath,
        scope: REQUIRED_PRODUCTION_RELEASE_SCOPE,
        decision: "APPROVE",
        phrase: REQUIRED_PRODUCTION_RELEASE_PHRASE,
        cycleId: CYCLE,
        legacyLabel: "VPG45",
        branch: BRANCH,
        headSha: HEAD,
        candidateDeploymentId: CANDIDATE,
        productionDeploymentId: PRODUCTION,
        rollbackDeploymentId: ROLLBACK,
        aliases: ["werkles.com"],
        harveyMode: HARVEY_MODE,
        recordDigest: RECORD.approval
      },
      release: {
        result: "PASS",
        headSha: HEAD,
        candidateSourceSha: HEAD,
        candidateDeploymentId: CANDIDATE,
        productionDeploymentId: PRODUCTION,
        recordDigest: RECORD.release
      },
      harvey: {
        result: "PASS",
        state: "RESOLVED",
        authority: "HUMAN_GATE_APPROVAL_LOG",
        executionAuthorized: true,
        recordPresent: true,
        cycleId: CYCLE,
        mode: HARVEY_MODE,
        candidateDeploymentId: CANDIDATE,
        productionDeploymentId: PRODUCTION,
        rollbackDeploymentId: ROLLBACK,
        recordDigest: RECORD.harvey
      },
      rollback: {
        deploymentId: ROLLBACK,
        commit: "9".repeat(40),
        isCoexistence: false,
        purpose: "RECOVERY"
      }
    }
  };
  return refresh(value);
}

function refresh(value) {
  value.trustedEvidence.snapshotDigest = trustedEvidenceDigest(value.trustedEvidence);
  value.request.evidenceDigest = value.trustedEvidence.snapshotDigest;
  return value;
}

function runCase(idea, id, mutate, expectedCodes, { refreshAfter = true } = {}) {
  const value = completeFixture();
  mutate(value);
  if (refreshAfter) refresh(value);
  const evaluated = evaluateCompositeReleaseCustody(value.request, value.trustedEvidence);
  const codes = evaluated.reasons.map((reason) => reason.code);

  assert.equal(evaluated.ok, false, `${id}: unexpectedly authorized`);
  assert.equal(evaluated.result, "STOP", `${id}: did not STOP`);
  for (const code of expectedCodes) {
    assert.ok(codes.includes(code), `${id}: missing ${code}; got ${codes.join(", ")}`);
  }
  return {
    idea,
    id,
    expected_codes: expectedCodes,
    observed_codes: codes,
    result: evaluated.result
  };
}

const control = completeFixture();
const controlResult = evaluateCompositeReleaseCustody(
  control.request,
  control.trustedEvidence
);
assert.equal(controlResult.ok, true, "complete synthetic control must PASS");
assert.deepEqual(controlResult.reasons, []);

const results = [];

// Idea 1: self-issued authority and independent PASS laundering.
results.push(
  runCase(
    "SELF_ISSUED_AUTHORITY_PASS_LAUNDERING",
    "ordinary_vpg45_approval_is_not_production_authority",
    (value) => {
      value.trustedEvidence.approval.authoritative = false;
      value.trustedEvidence.approval.scope = "VPG45_LOCAL_EVIDENCE_ONLY";
      value.trustedEvidence.approval.decision = "APPROVED";
      value.trustedEvidence.approval.phrase = "V, P, G";
      value.trustedEvidence.approval.sourceRow = vpg45ApprovalRow;
    },
    ["APPROVAL_RECORD_NOT_AUTHORITATIVE"]
  )
);

results.push(
  runCase(
    "SELF_ISSUED_AUTHORITY_PASS_LAUNDERING",
    "caller_minted_unkeyed_approval_digest",
    (value) => {
      const callerApproval = {
        decision: "APPROVE",
        phrase: REQUIRED_PRODUCTION_RELEASE_PHRASE,
        cycleId: CYCLE,
        candidateDeploymentId: CANDIDATE,
        aliases: ["werkles.com"]
      };
      value.request.callerApproval = {
        ...callerApproval,
        digest: selfHash(callerApproval)
      };
      value.trustedEvidence.approval = null;
    },
    ["APPROVAL_RECORD_NOT_AUTHORITATIVE"]
  )
);

results.push(
  runCase(
    "SELF_ISSUED_AUTHORITY_PASS_LAUNDERING",
    "fabricated_harvey_authorization",
    (value) => {
      value.trustedEvidence.harvey.authority = "CALLER_ASSERTED_AUTHORIZED_REMOVALS";
      value.trustedEvidence.harvey.authorizedRemovals = Array.from(
        { length: 37 },
        (_, index) => `harvey/path-${String(index + 1).padStart(2, "0")}`
      );
    },
    ["HARVEY_AUTHORITY_MISSING"]
  )
);

results.push(
  runCase(
    "SELF_ISSUED_AUTHORITY_PASS_LAUNDERING",
    "identity_only_cycle_artifacts",
    (value) => {
      value.request.callerCycleArtifacts = [
        `CYCLE_ID: \`${CYCLE}\`\nLEGACY_LABEL: \`VPG45\``,
        `CYCLE_ID: \`${CYCLE}\`\nLEGACY_LABEL: \`VPG45\``
      ];
      value.trustedEvidence.cycle = {
        id: CYCLE,
        legacyLabel: "VPG45"
      };
    },
    ["CYCLE_INCOMPLETE"]
  )
);

results.push(
  runCase(
    "SELF_ISSUED_AUTHORITY_PASS_LAUNDERING",
    "independent_subguard_pass_laundering",
    (value) => {
      value.request.subGuardPasses = {
        alias: "PASS",
        release: "PASS",
        cycle: "PASS",
        j: "PASS",
        harvey: "PASS"
      };
      value.trustedEvidence.cycle = { id: CYCLE, legacyLabel: "VPG45" };
      value.trustedEvidence.j = { result: "PASS" };
      value.trustedEvidence.approval = { result: "PASS", authoritative: false };
      value.trustedEvidence.release = { result: "PASS" };
      value.trustedEvidence.harvey = {
        result: "PASS",
        state: "RESOLVED",
        authority: null
      };
    },
    [
      "CYCLE_INCOMPLETE",
      "J_RECEIPT_MISSING",
      "APPROVAL_RECORD_NOT_AUTHORITATIVE",
      "HARVEY_AUTHORITY_MISSING"
    ]
  )
);

// Idea 2: replay, snapshot-confusion, and post-evaluation drift.
results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "stale_vpg41_j_replay",
    (value) => {
      value.trustedEvidence.j.cycleId = OLD_J_CYCLE;
      value.trustedEvidence.j.legacyLabel = "VPG41";
    },
    ["J_CYCLE_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "wrong_branch",
    (value) => {
      value.request.branch = "codex/replayed-branch";
    },
    ["BRANCH_MISMATCH", "J_BINDING_MISMATCH", "APPROVAL_BINDING_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "wrong_head_or_upstream",
    (value) => {
      value.trustedEvidence.git.upstreamSha = OTHER_SHA;
    },
    ["UPSTREAM_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "candidate_source_mismatch",
    (value) => {
      value.trustedEvidence.release.candidateSourceSha = OTHER_SHA;
    },
    ["CANDIDATE_SOURCE_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "production_rollback_swap",
    (value) => {
      value.request.productionDeploymentId = ROLLBACK;
      value.request.rollbackDeploymentId = PRODUCTION;
    },
    ["PRODUCTION_DEPLOYMENT_MISMATCH", "ROLLBACK_DEPLOYMENT_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "alias_set_drift",
    (value) => {
      value.request.aliases.push("www.werkles.com");
    },
    ["ALIAS_SET_MISMATCH", "APPROVAL_BINDING_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "approval_replay",
    (value) => {
      value.trustedEvidence.approval.cycleId = OLD_J_CYCLE;
      value.trustedEvidence.approval.legacyLabel = "VPG41";
      value.trustedEvidence.approval.candidateDeploymentId = "dpl_replayedCandidate";
    },
    ["APPROVAL_BINDING_MISMATCH"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "unresolved_harvey",
    (value) => {
      value.trustedEvidence.harvey.result = "STOP";
      value.trustedEvidence.harvey.state = "UNRESOLVED";
      value.trustedEvidence.harvey.authority = null;
      value.trustedEvidence.harvey.executionAuthorized = false;
    },
    ["HARVEY_DISPOSITION_UNRESOLVED", "HARVEY_AUTHORITY_MISSING"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "dirty_or_untracked_release_evidence",
    (value) => {
      value.trustedEvidence.git.dirty = true;
      value.trustedEvidence.git.untrackedCount = 1;
    },
    ["DIRTY_WORKTREE", "UNTRACKED_EVIDENCE"]
  )
);

results.push(
  runCase(
    "CROSS_CYCLE_REPLAY_SNAPSHOT_TOCTOU",
    "post_evaluation_snapshot_drift",
    (value) => {
      value.trustedEvidence.git.branch = "codex/post-evaluation-drift";
    },
    ["EVIDENCE_DIGEST_MISMATCH", "BRANCH_MISMATCH"],
    { refreshAfter: false }
  )
);

assert.equal(results.length, 15);
assert.deepEqual(
  new Set(results.map((entry) => entry.idea)),
  new Set(catalog.ideas.map((idea) => idea.id))
);

console.log(
  JSON.stringify(
    {
      schema: "werkles.vpg45-thufir-release-custody-red-team/v1",
      cycle_id: CYCLE,
      legacy_label: "VPG45",
      seat: "Thufir@Betsy",
      catalog: catalogPath,
      exact_ideas_executed: 2,
      synthetic_control: controlResult.result,
      ordinary_vpg45_approval: {
        found: true,
        decision: "APPROVED",
        phrase: "V, P, G",
        explicitly_forbids_production_authority: true,
        composite_result: results[0].result
      },
      adversary_cases: results.length,
      stop_count: results.filter((entry) => entry.result === "STOP").length,
      results,
      result: "PASS"
    },
    null,
    2
  )
);
