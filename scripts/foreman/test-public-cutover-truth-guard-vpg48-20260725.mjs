#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  ALLOWED_RELEASE_ACTIONS,
  APPROVAL_LOG_PATH,
  HARVEY_INVENTORY_COUNT,
  HARVEY_INVENTORY_DIGEST,
  REQUIRED_ROUTE_MATRIX,
  VPG42_STALE_PREVIEW,
  VPG42_STALE_SOURCE,
  VPG48_BRANCH,
  VPG48_CYCLE_ID,
  VPG48_LEGACY_LABEL,
  VPG48_SOURCE_COMMIT,
  evaluatePublicCutoverTruth,
  sha256
} from "./public-cutover-truth-guard-vpg48-20260725.mjs";

const FIXTURE =
  "scripts/foreman/fixtures/vpg48-public-cutover-current-20260725.json";
const PREVIEW = "dpl_CurrentVpg48Preview123";
const PRODUCTION = "dpl_CurrentHarveyProduction123";
const PRODUCTION_SHA = "3998101aed1835e7478a83cc44bd823502676648";
const REPLACEMENT_PHRASE =
  "APPROVE WERKLES VPG48 PUBLIC CUTOVER - REPLACE HARVEY PRODUCTION";

function readFixture() {
  return JSON.parse(readFileSync(FIXTURE, "utf8"));
}

function readyControl() {
  const evidence = readFixture();
  evidence.currentPreview = {
    sourceCommit: VPG48_SOURCE_COMMIT,
    branch: VPG48_BRANCH,
    deploymentId: PREVIEW,
    state: "READY",
    target: "preview",
    provenance: {
      sourceCommit: VPG48_SOURCE_COMMIT,
      repository: "benleakwerkles/Werkles"
    },
    independentlyCollected: true
  };
  evidence.currentRouteMatrix = {
    sourceCommit: VPG48_SOURCE_COMMIT,
    deploymentId: PREVIEW,
    result: "PASS",
    unexpected5xx: 0,
    independentlyCollected: true,
    routes: structuredClone(REQUIRED_ROUTE_MATRIX)
  };
  evidence.currentRouteMatrix.digest = sha256(evidence.currentRouteMatrix.routes);
  evidence.harvey = {
    selectedMode: "REPLACE_HARVEY",
    sourceCommit: VPG48_SOURCE_COMMIT,
    inventoryCount: HARVEY_INVENTORY_COUNT,
    inventoryDigest: HARVEY_INVENTORY_DIGEST,
    preservationProven: false,
    preservedBoundaryCount: 0,
    requirementsProven: true,
    productionDeploymentId: PRODUCTION,
    operatorSelection: {
      authoritative: true,
      sourcePath: APPROVAL_LOG_PATH,
      executionAuthorized: false
    },
    independentlyCollected: true
  };
  evidence.currentProduction = {
    deploymentId: PRODUCTION,
    sourceCommit: PRODUCTION_SHA,
    state: "READY",
    target: "production",
    runtimeErrors: 0,
    independentlyCollected: true,
    aliases: [
      "werkles.com",
      "werkles1.vercel.app",
      "werkles1-werkles.vercel.app"
    ],
    aliasOwnershipConfirmed: true
  };
  evidence.currentRollback = {
    deploymentId: PRODUCTION,
    sourceCommit: PRODUCTION_SHA,
    state: "READY",
    isCoexistence: false,
    independentlyCollected: true
  };
  evidence.releaseState = {
    dirty: false,
    untrackedCount: 0,
    indexMatchesCandidate: true
  };
  evidence.productionApproval = {
    sourcePath: APPROVAL_LOG_PATH,
    matchingRowCount: 1,
    decision: "APPROVED",
    authorityProvenance: "DIRECT_OPERATOR_INSTRUCTION_DURABLE_LOG",
    phrase: REPLACEMENT_PHRASE,
    cycleId: VPG48_CYCLE_ID,
    legacyLabel: VPG48_LEGACY_LABEL,
    scope: "PRODUCTION_DEPLOY_AND_ALIAS",
    branch: VPG48_BRANCH,
    sourceCommit: VPG48_SOURCE_COMMIT,
    candidateDeploymentId: PREVIEW,
    productionDeploymentId: PRODUCTION,
    rollbackDeploymentId: PRODUCTION,
    routeMatrixDigest: evidence.currentRouteMatrix.digest,
    harveyMode: "REPLACE_HARVEY",
    aliases: structuredClone(evidence.currentProduction.aliases),
    authorizedActions: structuredClone(ALLOWED_RELEASE_ACTIONS)
  };
  evidence.authorityClaims.push({
    sourcePath: APPROVAL_LOG_PATH,
    phraseClass: "DIRECT_CURRENT_PRODUCTION_APPROVAL",
    scope: "PRODUCTION_DEPLOY_AND_ALIAS",
    authoritative: true
  });
  return evidence;
}

const cases = [
  {
    id: "stale_vpg42_preview_borrowed",
    code: "CURRENT_PREVIEW_STALE_OR_MISMATCHED",
    mutate: (e) => {
      e.currentPreview.sourceCommit = VPG42_STALE_SOURCE;
      e.currentPreview.deploymentId = VPG42_STALE_PREVIEW;
      e.currentPreview.provenance.sourceCommit = VPG42_STALE_SOURCE;
    }
  },
  {
    id: "preview_not_ready",
    code: "CURRENT_PREVIEW_STALE_OR_MISMATCHED",
    mutate: (e) => { e.currentPreview.state = "BUILDING"; }
  },
  {
    id: "preview_provenance_drift",
    code: "CURRENT_PREVIEW_STALE_OR_MISMATCHED",
    mutate: (e) => { e.currentPreview.provenance.sourceCommit = VPG42_STALE_SOURCE; }
  },
  {
    id: "candidate_source_hash_drift",
    code: "CURRENT_CANDIDATE_BINDING_MISMATCH",
    mutate: (e) => { e.candidate.sourceCommit = VPG42_STALE_SOURCE; }
  },
  {
    id: "candidate_product_hash_drift",
    code: "CURRENT_CANDIDATE_BINDING_MISMATCH",
    mutate: (e) => { e.candidate.productCommit = VPG42_STALE_SOURCE; }
  },
  {
    id: "dependency_package_hash_drift",
    code: "DEPENDENCY_EVIDENCE_NOT_CURRENT",
    mutate: (e) => { e.dependency.packageSha256 = sha256("stale-package"); }
  },
  {
    id: "dependency_lock_hash_drift",
    code: "DEPENDENCY_EVIDENCE_NOT_CURRENT",
    mutate: (e) => { e.dependency.lockSha256 = sha256("stale-lock"); }
  },
  {
    id: "dependency_production_audit_reopened",
    code: "DEPENDENCY_EVIDENCE_NOT_CURRENT",
    mutate: (e) => {
      e.dependency.productionAudit.exitCode = 1;
      e.dependency.productionAudit.high = 1;
      e.dependency.productionAudit.total = 1;
    }
  },
  {
    id: "route_matrix_wrong_deployment",
    code: "CURRENT_ROUTE_MATRIX_STALE_OR_INCOMPLETE",
    mutate: (e) => { e.currentRouteMatrix.deploymentId = VPG42_STALE_PREVIEW; }
  },
  {
    id: "route_matrix_missing_route",
    code: "CURRENT_ROUTE_MATRIX_STALE_OR_INCOMPLETE",
    mutate: (e) => { e.currentRouteMatrix.routes.pop(); }
  },
  {
    id: "route_matrix_wrong_status",
    code: "CURRENT_ROUTE_MATRIX_STALE_OR_INCOMPLETE",
    mutate: (e) => { e.currentRouteMatrix.routes[5].status = 200; }
  },
  {
    id: "route_matrix_unexpected_5xx",
    code: "CURRENT_ROUTE_MATRIX_STALE_OR_INCOMPLETE",
    mutate: (e) => { e.currentRouteMatrix.unexpected5xx = 1; }
  },
  {
    id: "harvey_mode_removed",
    code: "HARVEY_MODE_UNRESOLVED",
    mutate: (e) => { e.harvey.selectedMode = null; }
  },
  {
    id: "harvey_inventory_count_drift",
    code: "HARVEY_INVENTORY_DRIFT",
    mutate: (e) => { e.harvey.inventoryCount = 36; }
  },
  {
    id: "harvey_inventory_digest_drift",
    code: "HARVEY_INVENTORY_DRIFT",
    mutate: (e) => { e.harvey.inventoryDigest = sha256("different-harvey-inventory"); }
  },
  {
    id: "harvey_false_preservation",
    code: "HARVEY_PRESERVATION_UNPROVEN",
    mutate: (e) => {
      e.harvey.selectedMode = "PRESERVE_RECONCILE";
      e.harvey.preservationProven = false;
      e.harvey.preservedBoundaryCount = 0;
    }
  },
  {
    id: "harvey_requirements_not_proven",
    code: "HARVEY_REQUIREMENTS_UNPROVEN",
    mutate: (e) => { e.harvey.requirementsProven = false; }
  },
  {
    id: "harvey_self_selected",
    code: "HARVEY_SELECTION_AUTHORITY_INVALID",
    mutate: (e) => { e.harvey.operatorSelection.authoritative = false; }
  },
  {
    id: "production_snapshot_missing",
    code: "CURRENT_PRODUCTION_BINDING_REQUIRED",
    mutate: (e) => { e.currentProduction = null; }
  },
  {
    id: "production_snapshot_not_independent",
    code: "CURRENT_PRODUCTION_BINDING_STALE",
    mutate: (e) => { e.currentProduction.independentlyCollected = false; }
  },
  {
    id: "production_runtime_errors",
    code: "CURRENT_PRODUCTION_BINDING_STALE",
    mutate: (e) => { e.currentProduction.runtimeErrors = 2; }
  },
  {
    id: "production_alias_missing",
    code: "CURRENT_ALIAS_BINDING_STALE",
    mutate: (e) => {
      e.currentProduction.aliases =
        e.currentProduction.aliases.filter((alias) => alias !== "werkles.com");
    }
  },
  {
    id: "alias_ownership_unconfirmed",
    code: "CURRENT_ALIAS_BINDING_STALE",
    mutate: (e) => { e.currentProduction.aliasOwnershipConfirmed = false; }
  },
  {
    id: "rollback_missing",
    code: "CURRENT_ROLLBACK_BINDING_REQUIRED",
    mutate: (e) => { e.currentRollback = null; }
  },
  {
    id: "rollback_points_at_candidate",
    code: "CURRENT_ROLLBACK_BINDING_STALE",
    mutate: (e) => { e.currentRollback.deploymentId = PREVIEW; }
  },
  {
    id: "rollback_source_mismatch",
    code: "CURRENT_ROLLBACK_BINDING_STALE",
    mutate: (e) => { e.currentRollback.sourceCommit = VPG48_SOURCE_COMMIT; }
  },
  {
    id: "rollback_mislabeled_coexistence",
    code: "ROLLBACK_MISLABELED_AS_COEXISTENCE",
    mutate: (e) => { e.currentRollback.isCoexistence = true; }
  },
  {
    id: "blocked_vpg42_phrase_borrowed",
    code: "APPROVAL_SOURCE_NOT_AUTHORITATIVE",
    mutate: (e) => {
      e.productionApproval.sourcePath =
        "foreman/reviews/GATE-werkles-vpg42-public-test-cutover-20260724.md";
      e.productionApproval.phrase =
        "APPROVE WERKLES VPG42 PUBLIC TEST CUTOVER - REPLACE HARVEY PRODUCTION";
    }
  },
  {
    id: "vpg43_choice_phrase_borrowed",
    code: "APPROVAL_SOURCE_NOT_AUTHORITATIVE",
    mutate: (e) => {
      e.productionApproval.sourcePath =
        "foreman/receipts/WERKLES_VPG43_HARVEY_COEXISTENCE_DECISION_CONTRACT_20260724.json";
      e.productionApproval.phrase =
        "CHOOSE WERKLES HARVEY COEXISTENCE - RECONCILE HARVEY INTO A NEW PUBLIC CANDIDATE";
    }
  },
  {
    id: "vpg47_git_j_laundered",
    code: "APPROVAL_PHRASE_NOT_CURRENT_MODE",
    mutate: (e) => {
      e.productionApproval.phrase =
        "V, P, G, J whatever LJ has horded over in her folder. Probably some human gates.";
      e.productionApproval.scope = "GIT_STAGE_COMMIT_PUSH_CURRENT_BRANCH_ONLY";
    }
  },
  {
    id: "vpg48_vpg_laundered",
    code: "APPROVAL_PHRASE_NOT_CURRENT_MODE",
    mutate: (e) => { e.productionApproval.phrase = "V, P, G"; }
  },
  {
    id: "receipt_self_issues_pass",
    code: "SELF_ISSUED_OR_BORROWED_AUTHORITY",
    mutate: (e) => {
      e.authorityClaims.push({
        sourcePath: "foreman/receipts/WERKLES_FULL_FLOCK_VPG47_20260724.md",
        scope: "PRODUCTION_DEPLOY_AND_ALIAS",
        authoritative: true
      });
    }
  },
  {
    id: "ledger_self_issues_pass",
    code: "SELF_ISSUED_OR_BORROWED_AUTHORITY",
    mutate: (e) => { e.authorityClaims[4].authoritative = true; }
  },
  {
    id: "dirty_release_state",
    code: "RELEASE_WORKTREE_NOT_CLEAN",
    mutate: (e) => { e.releaseState.dirty = true; }
  },
  {
    id: "untracked_release_state",
    code: "RELEASE_WORKTREE_NOT_CLEAN",
    mutate: (e) => { e.releaseState.untrackedCount = 1; }
  },
  {
    id: "approval_candidate_hash_drift",
    code: "APPROVAL_CANDIDATE_BINDING_MISMATCH",
    mutate: (e) => { e.productionApproval.sourceCommit = VPG42_STALE_SOURCE; }
  },
  {
    id: "approval_candidate_deployment_drift",
    code: "APPROVAL_RELEASE_BINDING_MISMATCH",
    mutate: (e) => { e.productionApproval.candidateDeploymentId = VPG42_STALE_PREVIEW; }
  },
  {
    id: "approval_production_deployment_drift",
    code: "APPROVAL_RELEASE_BINDING_MISMATCH",
    mutate: (e) => {
      e.productionApproval.productionDeploymentId = "dpl_DifferentProduction123";
    }
  },
  {
    id: "approval_route_digest_drift",
    code: "APPROVAL_RELEASE_BINDING_MISMATCH",
    mutate: (e) => { e.productionApproval.routeMatrixDigest = sha256("stale-route-matrix"); }
  },
  {
    id: "approval_alias_drift",
    code: "APPROVAL_RELEASE_BINDING_MISMATCH",
    mutate: (e) => { e.productionApproval.aliases = ["werkles.com"]; }
  },
  {
    id: "approval_row_duplicated",
    code: "APPROVAL_ROW_NOT_UNIQUE",
    mutate: (e) => { e.productionApproval.matchingRowCount = 2; }
  },
  {
    id: "production_scope_widened_to_sql",
    code: "PRODUCTION_SCOPE_WIDENED",
    mutate: (e) => { e.productionApproval.authorizedActions.push("SQL_SCHEMA_APPLY"); }
  },
  {
    id: "production_scope_widened_to_main_merge",
    code: "PRODUCTION_SCOPE_WIDENED",
    mutate: (e) => { e.productionApproval.authorizedActions.push("MERGE_MAIN"); }
  },
  {
    id: "direct_production_authority_missing",
    code: "DIRECT_PRODUCTION_AUTHORITY_REQUIRED",
    mutate: (e) => {
      e.productionApproval.authorityProvenance = "PACKET_SELF_ASSERTION";
    }
  }
];

const current = evaluatePublicCutoverTruth(readFixture());
const ready = evaluatePublicCutoverTruth(readyControl());
const attacks = cases.map((attack) => {
  const evidence = readyControl();
  attack.mutate(evidence);
  const evaluated = evaluatePublicCutoverTruth(evidence);
  const reasonCodes = evaluated.reasons.map((reason) => reason.code);
  const bypass = evaluated.result !== "STOP" || !reasonCodes.includes(attack.code);
  return {
    id: attack.id,
    expected_code: attack.code,
    result: evaluated.result,
    expected_code_observed: reasonCodes.includes(attack.code),
    bypass,
    reason_codes: reasonCodes
  };
});
const bypasses = attacks.filter((attack) => attack.bypass);
const currentRequiredReasons = [
  "CURRENT_READY_PREVIEW_REQUIRED",
  "CURRENT_ROUTE_MATRIX_REQUIRED",
  "HARVEY_MODE_UNRESOLVED",
  "CURRENT_PRODUCTION_BINDING_REQUIRED",
  "CURRENT_ALIAS_BINDING_REQUIRED",
  "CURRENT_ROLLBACK_BINDING_REQUIRED",
  "AUTHORITATIVE_PRODUCTION_APPROVAL_REQUIRED"
];
const currentReasonCodes = current.reasons.map((reason) => reason.code);
const currentStateCorrect =
  current.result === "STOP" &&
  current.verdict === "STOP_CURRENT_PREVIEW_HARVEY_AND_PRODUCTION_BINDINGS_REQUIRED" &&
  current.states.candidate === "SOLVED" &&
  current.states.dependency === "SOLVED" &&
  current.states.preview === "UNRESOLVED" &&
  current.states.route_matrix === "UNRESOLVED" &&
  current.states.harvey === "UNRESOLVED" &&
  current.states.production === "STALE" &&
  current.states.alias === "STALE" &&
  current.states.rollback === "STALE" &&
  current.states.approval === "UNRESOLVED" &&
  currentRequiredReasons.every((code) => currentReasonCodes.includes(code));

const output = {
  schema: "werkles.vpg48-thufir-public-cutover-guard-result/v1",
  cycle_id: VPG48_CYCLE_ID,
  legacy_label: VPG48_LEGACY_LABEL,
  exact_ideas_executed: 2,
  idea_1: {
    id: "CURRENT_EVIDENCE_CUTOVER_STATE_MACHINE",
    current_result: current.result,
    current_verdict: current.verdict,
    current_states: current.states,
    current_required_reasons_observed: currentStateCorrect,
    authorized_ready_synthetic_control: ready.result,
    raw_synthetic_control_authoritative: false
  },
  idea_2: {
    id: "STALE_EVIDENCE_AND_AUTHORITY_LAUNDERING_ADVERSARY",
    attack_count: attacks.length,
    rejected_count: attacks.filter((attack) => !attack.bypass).length,
    bypass_count: bypasses.length,
    bypass_ids: bypasses.map((attack) => attack.id),
    attacks
  },
  repair_attempts_used: 0,
  result:
    currentStateCorrect && ready.result === "PASS" && bypasses.length === 0
      ? "PASS"
      : "FAIL"
};

console.log(JSON.stringify(output, null, 2));
if (output.result !== "PASS") process.exitCode = 2;
