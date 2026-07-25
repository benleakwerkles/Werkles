#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VPG48_CYCLE_ID = "WERKLES-FLOCK-20260725-013031-ET-BETSY-01";
export const VPG48_LEGACY_LABEL = "VPG48";
export const VPG48_BRANCH = "codex/werkles-vpg31-20260721";
export const VPG48_SOURCE_COMMIT = "bd24b45d3a01b51ee05c951d5f96e1bac6398686";
export const VPG48_PRODUCT_COMMIT = "ba08a444632206e2676df49e175f184ab0c2c2f2";
export const VPG48_PACKAGE_SHA256 =
  "56570ee3dbf03ccfa371311fbfb9df13bdc5171c389c47c87c9d2f68442354fa";
export const VPG48_LOCK_SHA256 =
  "655c4c86ef294ee940d39722b93aa5297c92c9903b01ceb6cd7eee20a4801621";
export const VPG42_STALE_SOURCE = "67c38ace103ba5f1ba473b984c91e243d9120630";
export const VPG42_STALE_PREVIEW = "dpl_9KrWte1jcoMSDVHEXdK2MQg6QhMd";
export const HARVEY_INVENTORY_COUNT = 37;
export const HARVEY_INVENTORY_DIGEST =
  "3b746a15ed0beaebb375d08152cda25b6ed2bb2c4633cd5850d707403a4bdc46";
export const APPROVAL_LOG_PATH = "foreman/gates/APPROVAL_LOG.md";

export const REQUIRED_ROUTE_MATRIX = [
  { method: "GET", path: "/", status: 200 },
  { method: "GET", path: "/bellows", status: 200 },
  { method: "GET", path: "/bellows/recommendations", status: 200 },
  { method: "GET", path: "/dashboard/profile", status: 200 },
  { method: "GET", path: "/privacy", status: 200 },
  {
    method: "GET",
    path: "/api/bellows/recommendations/personal",
    status: 401
  },
  {
    method: "POST",
    path: "/api/bellows/recommendations/packet",
    status: 403
  },
  { method: "POST", path: "/api/bellows/intake", status: 503 }
];

export const ALLOWED_RELEASE_ACTIONS = [
  "DEPLOY_BOUND_CANDIDATE",
  "PROMOTE_BOUND_ALIAS",
  "RUN_ORDERED_SMOKE",
  "ROLLBACK_ON_FAILURE"
];

const EVIDENCE_SCHEMA = "werkles.vpg48-public-cutover-evidence/v1";
const ALLOWED_HARVEY_MODES = new Set([
  "PRESERVE_RECONCILE",
  "PRESERVE_RELOCATE",
  "REPLACE_HARVEY"
]);

function addReason(reasons, code, detail = null) {
  if (!reasons.some((reason) => reason.code === code)) reasons.push({ code, detail });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

export function sha256(value) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function isSha(value) {
  return /^[a-f0-9]{40}$/.test(String(value ?? ""));
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(String(value ?? ""));
}

function isDeploymentId(value) {
  return /^dpl_[A-Za-z0-9]+$/.test(String(value ?? ""));
}

function exactSet(value, expected) {
  if (!Array.isArray(value)) return false;
  const actual = [...new Set(value.map((entry) => String(entry)))].sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((entry, index) => entry === wanted[index]);
}

function routeKey(route) {
  return `${String(route?.method ?? "GET").toUpperCase()} ${String(route?.path ?? "")}`;
}

function expectedApprovalPhrase(mode) {
  if (mode === "PRESERVE_RECONCILE") {
    return "APPROVE WERKLES VPG48 PUBLIC CUTOVER - PRESERVE HARVEY BY RECONCILIATION";
  }
  if (mode === "PRESERVE_RELOCATE") {
    return "APPROVE WERKLES VPG48 PUBLIC CUTOVER - PRESERVE HARVEY BY RELOCATION";
  }
  if (mode === "REPLACE_HARVEY") {
    return "APPROVE WERKLES VPG48 PUBLIC CUTOVER - REPLACE HARVEY PRODUCTION";
  }
  return "";
}

function evaluateCandidate(evidence, reasons, states) {
  const candidate = evidence?.candidate ?? {};
  if (
    candidate.branch === VPG48_BRANCH &&
    candidate.sourceCommit === VPG48_SOURCE_COMMIT &&
    candidate.productCommit === VPG48_PRODUCT_COMMIT &&
    candidate.productIsAncestor === true
  ) {
    states.candidate = "SOLVED";
  } else {
    states.candidate = "STALE";
    addReason(reasons, "CURRENT_CANDIDATE_BINDING_MISMATCH", {
      branch: candidate.branch ?? null,
      sourceCommit: candidate.sourceCommit ?? null,
      productCommit: candidate.productCommit ?? null
    });
  }
}

function evaluateDependency(evidence, reasons, states) {
  const dependency = evidence?.dependency ?? {};
  const productionAudit = dependency.productionAudit ?? {};
  const solved =
    dependency.packageSha256 === VPG48_PACKAGE_SHA256 &&
    dependency.lockSha256 === VPG48_LOCK_SHA256 &&
    dependency.next === "15.5.21" &&
    dependency.nextPostcss === "8.5.18" &&
    dependency.sharp === "0.35.0" &&
    productionAudit.command === "npm audit --omit=dev" &&
    productionAudit.exitCode === 0 &&
    productionAudit.total === 0 &&
    productionAudit.high === 0 &&
    productionAudit.critical === 0 &&
    dependency.sourceCommit === VPG48_PRODUCT_COMMIT &&
    dependency.independentlyCollected === true;
  if (solved) {
    states.dependency = "SOLVED";
  } else {
    states.dependency = "STALE";
    addReason(reasons, "DEPENDENCY_EVIDENCE_NOT_CURRENT");
  }
}

function evaluatePreview(evidence, reasons, states) {
  const preview = evidence?.currentPreview;
  if (!preview) {
    states.preview = "UNRESOLVED";
    addReason(reasons, "CURRENT_READY_PREVIEW_REQUIRED");
    return;
  }
  const valid =
    preview.sourceCommit === VPG48_SOURCE_COMMIT &&
    preview.branch === VPG48_BRANCH &&
    isDeploymentId(preview.deploymentId) &&
    preview.state === "READY" &&
    preview.target === "preview" &&
    preview.provenance?.sourceCommit === VPG48_SOURCE_COMMIT &&
    preview.provenance?.repository === "benleakwerkles/Werkles" &&
    preview.independentlyCollected === true;
  if (valid) {
    states.preview = "SOLVED";
  } else {
    states.preview = "STALE";
    addReason(reasons, "CURRENT_PREVIEW_STALE_OR_MISMATCHED");
  }
}

function evaluateRouteMatrix(evidence, reasons, states) {
  const preview = evidence?.currentPreview;
  const matrix = evidence?.currentRouteMatrix;
  if (!matrix) {
    states.route_matrix = "UNRESOLVED";
    addReason(reasons, "CURRENT_ROUTE_MATRIX_REQUIRED");
    return;
  }
  const observed = new Map((Array.isArray(matrix.routes) ? matrix.routes : []).map((route) => [routeKey(route), route]));
  const failures = [];
  for (const expected of REQUIRED_ROUTE_MATRIX) {
    const actual = observed.get(routeKey(expected));
    if (!actual || actual.status !== expected.status) {
      failures.push({
        route: routeKey(expected),
        expected: expected.status,
        actual: actual?.status ?? null
      });
    }
  }
  const valid =
    preview &&
    matrix.sourceCommit === VPG48_SOURCE_COMMIT &&
    matrix.deploymentId === preview.deploymentId &&
    matrix.result === "PASS" &&
    matrix.unexpected5xx === 0 &&
    matrix.independentlyCollected === true &&
    observed.size === REQUIRED_ROUTE_MATRIX.length &&
    failures.length === 0;
  if (valid) {
    states.route_matrix = "SOLVED";
  } else {
    states.route_matrix = "STALE";
    addReason(reasons, "CURRENT_ROUTE_MATRIX_STALE_OR_INCOMPLETE", failures);
  }
}

function evaluateHarvey(evidence, reasons, states) {
  const harvey = evidence?.harvey ?? {};
  if (!harvey.selectedMode) {
    states.harvey = "UNRESOLVED";
    addReason(reasons, "HARVEY_MODE_UNRESOLVED");
    return;
  }
  const modeAllowed = ALLOWED_HARVEY_MODES.has(harvey.selectedMode);
  const inventoryValid =
    harvey.inventoryCount === HARVEY_INVENTORY_COUNT &&
    harvey.inventoryDigest === HARVEY_INVENTORY_DIGEST;
  const preservationValid =
    harvey.selectedMode === "REPLACE_HARVEY" ||
    (harvey.preservationProven === true && harvey.preservedBoundaryCount === HARVEY_INVENTORY_COUNT);
  const valid =
    modeAllowed &&
    inventoryValid &&
    preservationValid &&
    harvey.requirementsProven === true &&
    harvey.sourceCommit === VPG48_SOURCE_COMMIT &&
    isDeploymentId(harvey.productionDeploymentId) &&
    harvey.operatorSelection?.authoritative === true &&
    harvey.operatorSelection?.sourcePath === APPROVAL_LOG_PATH &&
    harvey.operatorSelection?.executionAuthorized === false &&
    harvey.independentlyCollected === true;
  if (valid) {
    states.harvey = "SOLVED";
  } else {
    states.harvey = "STALE";
    if (!modeAllowed) addReason(reasons, "HARVEY_MODE_INVALID");
    if (!inventoryValid) addReason(reasons, "HARVEY_INVENTORY_DRIFT");
    if (!preservationValid) addReason(reasons, "HARVEY_PRESERVATION_UNPROVEN");
    if (harvey.requirementsProven !== true) addReason(reasons, "HARVEY_REQUIREMENTS_UNPROVEN");
    if (
      harvey.operatorSelection?.authoritative !== true ||
      harvey.operatorSelection?.sourcePath !== APPROVAL_LOG_PATH ||
      harvey.operatorSelection?.executionAuthorized !== false
    ) {
      addReason(reasons, "HARVEY_SELECTION_AUTHORITY_INVALID");
    }
  }
}

function evaluateProduction(evidence, reasons, states) {
  const production = evidence?.currentProduction;
  if (!production) {
    states.production = "STALE";
    states.alias = "STALE";
    addReason(reasons, "CURRENT_PRODUCTION_BINDING_REQUIRED");
    addReason(reasons, "CURRENT_ALIAS_BINDING_REQUIRED");
    return;
  }
  const productionValid =
    isDeploymentId(production.deploymentId) &&
    isSha(production.sourceCommit) &&
    production.state === "READY" &&
    production.target === "production" &&
    production.runtimeErrors === 0 &&
    production.independentlyCollected === true;
  const aliasesValid =
    Array.isArray(production.aliases) &&
    production.aliases.includes("werkles.com") &&
    production.aliasOwnershipConfirmed === true;
  if (productionValid) states.production = "SOLVED";
  else {
    states.production = "STALE";
    addReason(reasons, "CURRENT_PRODUCTION_BINDING_STALE");
  }
  if (aliasesValid) states.alias = "SOLVED";
  else {
    states.alias = "STALE";
    addReason(reasons, "CURRENT_ALIAS_BINDING_STALE");
  }
}

function evaluateRollback(evidence, reasons, states) {
  const production = evidence?.currentProduction;
  const rollback = evidence?.currentRollback;
  if (!rollback) {
    states.rollback = "STALE";
    addReason(reasons, "CURRENT_ROLLBACK_BINDING_REQUIRED");
    return;
  }
  const valid =
    production &&
    isDeploymentId(rollback.deploymentId) &&
    rollback.deploymentId !== evidence?.currentPreview?.deploymentId &&
    rollback.sourceCommit === production.sourceCommit &&
    rollback.isCoexistence === false &&
    rollback.state === "READY" &&
    rollback.independentlyCollected === true;
  if (valid) {
    states.rollback = "SOLVED";
  } else {
    states.rollback = "STALE";
    if (rollback?.isCoexistence !== false) addReason(reasons, "ROLLBACK_MISLABELED_AS_COEXISTENCE");
    addReason(reasons, "CURRENT_ROLLBACK_BINDING_STALE");
  }
}

function evaluateReleaseState(evidence, reasons, states) {
  const state = evidence?.releaseState ?? {};
  if (state.dirty === false && state.untrackedCount === 0 && state.indexMatchesCandidate === true) {
    states.release_state = "SOLVED";
  } else {
    states.release_state = "UNRESOLVED";
    addReason(reasons, "RELEASE_WORKTREE_NOT_CLEAN", {
      dirty: state.dirty ?? null,
      untrackedCount: state.untrackedCount ?? null,
      indexMatchesCandidate: state.indexMatchesCandidate ?? null
    });
  }
}

function evaluateApproval(evidence, reasons, states) {
  const approval = evidence?.productionApproval;
  if (!approval) {
    states.approval = "UNRESOLVED";
    addReason(reasons, "AUTHORITATIVE_PRODUCTION_APPROVAL_REQUIRED");
    return;
  }
  const preview = evidence?.currentPreview ?? {};
  const production = evidence?.currentProduction ?? {};
  const rollback = evidence?.currentRollback ?? {};
  const harvey = evidence?.harvey ?? {};
  const matrix = evidence?.currentRouteMatrix ?? {};
  const exactPhrase = expectedApprovalPhrase(harvey.selectedMode);
  const aliases = [...new Set(Array.isArray(production.aliases) ? production.aliases : [])].sort();
  const valid =
    approval.sourcePath === APPROVAL_LOG_PATH &&
    approval.matchingRowCount === 1 &&
    approval.decision === "APPROVED" &&
    approval.authorityProvenance === "DIRECT_OPERATOR_INSTRUCTION_DURABLE_LOG" &&
    approval.phrase === exactPhrase &&
    approval.cycleId === VPG48_CYCLE_ID &&
    approval.legacyLabel === VPG48_LEGACY_LABEL &&
    approval.scope === "PRODUCTION_DEPLOY_AND_ALIAS" &&
    approval.branch === VPG48_BRANCH &&
    approval.sourceCommit === VPG48_SOURCE_COMMIT &&
    approval.candidateDeploymentId === preview.deploymentId &&
    approval.productionDeploymentId === production.deploymentId &&
    approval.rollbackDeploymentId === rollback.deploymentId &&
    approval.routeMatrixDigest === matrix.digest &&
    approval.harveyMode === harvey.selectedMode &&
    exactSet(approval.aliases, aliases) &&
    exactSet(approval.authorizedActions, ALLOWED_RELEASE_ACTIONS);
  if (valid) {
    states.approval = "SOLVED";
  } else {
    states.approval = "STALE";
    if (approval.sourcePath !== APPROVAL_LOG_PATH) addReason(reasons, "APPROVAL_SOURCE_NOT_AUTHORITATIVE");
    if (approval.matchingRowCount !== 1) addReason(reasons, "APPROVAL_ROW_NOT_UNIQUE");
    if (approval.phrase !== exactPhrase) addReason(reasons, "APPROVAL_PHRASE_NOT_CURRENT_MODE");
    if (
      approval.cycleId !== VPG48_CYCLE_ID ||
      approval.legacyLabel !== VPG48_LEGACY_LABEL ||
      approval.branch !== VPG48_BRANCH ||
      approval.sourceCommit !== VPG48_SOURCE_COMMIT
    ) {
      addReason(reasons, "APPROVAL_CANDIDATE_BINDING_MISMATCH");
    }
    if (
      approval.candidateDeploymentId !== preview.deploymentId ||
      approval.productionDeploymentId !== production.deploymentId ||
      approval.rollbackDeploymentId !== rollback.deploymentId ||
      approval.routeMatrixDigest !== matrix.digest ||
      approval.harveyMode !== harvey.selectedMode ||
      !exactSet(approval.aliases, aliases)
    ) {
      addReason(reasons, "APPROVAL_RELEASE_BINDING_MISMATCH");
    }
    if (
      approval.scope !== "PRODUCTION_DEPLOY_AND_ALIAS" ||
      !exactSet(approval.authorizedActions, ALLOWED_RELEASE_ACTIONS)
    ) {
      addReason(reasons, "PRODUCTION_SCOPE_WIDENED");
    }
    if (
      approval.decision !== "APPROVED" ||
      approval.authorityProvenance !== "DIRECT_OPERATOR_INSTRUCTION_DURABLE_LOG"
    ) {
      addReason(reasons, "DIRECT_PRODUCTION_AUTHORITY_REQUIRED");
    }
  }
}

function evaluateAuthorityClaims(evidence, reasons) {
  for (const claim of Array.isArray(evidence?.authorityClaims) ? evidence.authorityClaims : []) {
    if (claim?.authoritative === true && claim?.sourcePath !== APPROVAL_LOG_PATH) {
      addReason(reasons, "SELF_ISSUED_OR_BORROWED_AUTHORITY", claim?.sourcePath ?? null);
    }
    if (
      claim?.authoritative === true &&
      claim?.scope !== "PRODUCTION_DEPLOY_AND_ALIAS"
    ) {
      addReason(reasons, "BORROWED_SCOPE_MISMATCH", claim?.scope ?? null);
    }
  }
}

export function evaluatePublicCutoverTruth(evidence = {}) {
  const reasons = [];
  const states = {
    candidate: "UNRESOLVED",
    dependency: "UNRESOLVED",
    preview: "UNRESOLVED",
    route_matrix: "UNRESOLVED",
    harvey: "UNRESOLVED",
    production: "UNRESOLVED",
    alias: "UNRESOLVED",
    rollback: "UNRESOLVED",
    release_state: "UNRESOLVED",
    approval: "UNRESOLVED"
  };
  if (evidence?.schema !== EVIDENCE_SCHEMA) addReason(reasons, "INVALID_EVIDENCE_SCHEMA");
  if (
    evidence?.cycleId !== VPG48_CYCLE_ID ||
    evidence?.legacyLabel !== VPG48_LEGACY_LABEL
  ) {
    addReason(reasons, "CYCLE_IDENTITY_MISMATCH");
  }
  evaluateCandidate(evidence, reasons, states);
  evaluateDependency(evidence, reasons, states);
  evaluatePreview(evidence, reasons, states);
  evaluateRouteMatrix(evidence, reasons, states);
  evaluateHarvey(evidence, reasons, states);
  evaluateProduction(evidence, reasons, states);
  evaluateRollback(evidence, reasons, states);
  evaluateReleaseState(evidence, reasons, states);
  evaluateApproval(evidence, reasons, states);
  evaluateAuthorityClaims(evidence, reasons);

  const currentMissing = [
    "CURRENT_READY_PREVIEW_REQUIRED",
    "CURRENT_ROUTE_MATRIX_REQUIRED",
    "HARVEY_MODE_UNRESOLVED",
    "CURRENT_PRODUCTION_BINDING_REQUIRED",
    "CURRENT_ALIAS_BINDING_REQUIRED",
    "CURRENT_ROLLBACK_BINDING_REQUIRED",
    "AUTHORITATIVE_PRODUCTION_APPROVAL_REQUIRED"
  ].some((code) => reasons.some((reason) => reason.code === code));
  const result = reasons.length ? "STOP" : "PASS";
  return {
    ok: result === "PASS",
    result,
    verdict:
      result === "PASS"
        ? "READY_FOR_SEPARATE_AUTHORIZED_CUTOVER"
        : currentMissing
          ? "STOP_CURRENT_PREVIEW_HARVEY_AND_PRODUCTION_BINDINGS_REQUIRED"
          : "STOP_PUBLIC_CUTOVER_EVIDENCE_INVALID",
    evidenceAuthority:
      "INDEPENDENT_COLLECTION_AND_DIRECT_DURABLE_PRODUCTION_APPROVAL_REQUIRED",
    states,
    reasons
  };
}

function main() {
  try {
    const inputPath = process.argv[2];
    if (!inputPath) throw new Error("usage: public-cutover-truth-guard-vpg48-20260725.mjs <evidence.json>");
    const evidence = JSON.parse(readFileSync(path.resolve(inputPath), "utf8"));
    const result = evaluatePublicCutoverTruth(evidence);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`vpg48_public_cutover_guard_error=${error.message}`);
    process.exitCode = 2;
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) main();
