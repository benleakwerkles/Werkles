#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_LOCK_SHA256,
  BASELINE_PACKAGE_SHA256,
  evaluateDevToolchainContainment
} from "./dev-toolchain-audit-containment-guard-vpg49-20260725.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = JSON.parse(
  readFileSync(
    path.join(
      root,
      "scripts/foreman/fixtures/vpg49-dev-toolchain-audit-containment-current-20260725.json"
    ),
    "utf8"
  )
);

function clone(value) {
  return structuredClone(value);
}

function assert(condition, message, detail = null) {
  if (!condition) {
    const suffix = detail === null ? "" : `\n${JSON.stringify(detail, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

function bindAudits(evidence) {
  for (const audit of Object.values(evidence.audits)) {
    audit.packageSha256 = evidence.candidate.packageSha256;
    audit.lockSha256 = evidence.candidate.lockSha256;
  }
}

function clearedControl() {
  const evidence = clone(fixture);
  const packageSha256 = "a".repeat(64);
  const lockSha256 = "b".repeat(64);
  evidence.candidate.packageSha256 = packageSha256;
  evidence.candidate.observedPackageSha256 = packageSha256;
  evidence.candidate.lockSha256 = lockSha256;
  evidence.candidate.observedLockSha256 = lockSha256;
  evidence.candidate.installed.eslint = "9.40.0";
  evidence.candidate.installed.eslintConfigNext = "15.5.19";
  evidence.audits.full.exitCode = 0;
  evidence.audits.full.counts = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0
  };
  evidence.audits.full.vulnerabilities = [];
  evidence.audits.production.exitCode = 0;
  evidence.audits.production.counts = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0
  };
  evidence.audits.production.vulnerabilities = [];
  evidence.severeGraph = [];
  evidence.repair = {
    attempted: true,
    owner: "Heimerdinker@Betsy",
    scope: "DEV_TOOLCHAIN_ONLY",
    baselinePackageSha256: BASELINE_PACKAGE_SHA256,
    baselineLockSha256: BASELINE_LOCK_SHA256,
    candidatePackageSha256: packageSha256,
    candidateLockSha256: lockSha256,
    changedPaths: ["package-lock.json"],
    semverMajorMigration: false,
    forcedOverride: false
  };
  evidence.qc = {
    independentlyCollected: true,
    packageSha256,
    lockSha256,
    lint: "PASS",
    typecheck: "PASS",
    build: "PASS",
    productionAudit: "PASS",
    directToolchainBehavior: "PASS"
  };
  bindAudits(evidence);
  return evidence;
}

const contained = evaluateDevToolchainContainment(clone(fixture));
assert(contained.state === "CONTAINED_DEV_ONLY", "Current control must be contained", contained);
assert(contained.reasons.length === 0, "Current control must have no STOP reasons", contained);

const clearedEvidence = clearedControl();
const cleared = evaluateDevToolchainContainment(clearedEvidence);
assert(cleared.state === "CLEARED", "Compatible repaired synthetic control must clear", cleared);
assert(cleared.reasons.length === 0, "Cleared control must have no STOP reasons", cleared);

const attacks = [
  {
    id: "baseline_package_hash_drift",
    base: "contained",
    code: "PRE_EXPERIMENT_BASELINE_MISMATCH",
    mutate: (e) => {
      e.baseline.packageSha256 = "c".repeat(64);
    }
  },
  {
    id: "baseline_lock_hash_drift",
    base: "contained",
    code: "PRE_EXPERIMENT_BASELINE_MISMATCH",
    mutate: (e) => {
      e.baseline.lockSha256 = "c".repeat(64);
    }
  },
  {
    id: "candidate_package_hash_not_observed",
    base: "contained",
    code: "CANDIDATE_HASH_OBSERVATION_MISMATCH",
    mutate: (e) => {
      e.candidate.observedPackageSha256 = "c".repeat(64);
    }
  },
  {
    id: "candidate_lock_hash_not_observed",
    base: "contained",
    code: "CANDIDATE_HASH_OBSERVATION_MISMATCH",
    mutate: (e) => {
      e.candidate.observedLockSha256 = "c".repeat(64);
    }
  },
  {
    id: "contained_package_hash_drift",
    base: "contained",
    code: "CONTAINED_BASELINE_DRIFT",
    mutate: (e) => {
      e.candidate.packageSha256 = "c".repeat(64);
      e.candidate.observedPackageSha256 = e.candidate.packageSha256;
      bindAudits(e);
    }
  },
  {
    id: "contained_lock_hash_drift",
    base: "contained",
    code: "CONTAINED_BASELINE_DRIFT",
    mutate: (e) => {
      e.candidate.lockSha256 = "c".repeat(64);
      e.candidate.observedLockSha256 = e.candidate.lockSha256;
      bindAudits(e);
    }
  },
  {
    id: "production_root_dependency_added",
    base: "contained",
    code: "PRODUCTION_ROOT_SURFACE_DRIFT",
    mutate: (e) => {
      e.candidate.root.dependencies.unapproved = "1.0.0";
      e.candidate.lockRoot.dependencies.unapproved = "1.0.0";
    }
  },
  {
    id: "production_root_dependency_removed",
    base: "contained",
    code: "PRODUCTION_ROOT_SURFACE_DRIFT",
    mutate: (e) => {
      delete e.candidate.root.dependencies.stripe;
      delete e.candidate.lockRoot.dependencies.stripe;
    }
  },
  {
    id: "production_lock_root_drift",
    base: "contained",
    code: "PRODUCTION_LOCK_ROOT_DRIFT",
    mutate: (e) => {
      e.candidate.lockRoot.dependencies.next = "^15.5.20";
    }
  },
  {
    id: "dev_lock_root_drift",
    base: "contained",
    code: "DEV_LOCK_ROOT_DRIFT",
    mutate: (e) => {
      e.candidate.lockRoot.devDependencies.eslint = "^9.0.0";
    }
  },
  {
    id: "production_dependency_count_widened",
    base: "contained",
    code: "PRODUCTION_DEPENDENCY_COUNT_DRIFT",
    mutate: (e) => {
      e.candidate.productionDependencyCount = 52;
    }
  },
  {
    id: "production_audit_high_reopened",
    base: "contained",
    code: "PRODUCTION_AUDIT_NOT_ZERO",
    mutate: (e) => {
      e.audits.production.exitCode = 1;
      e.audits.production.counts.high = 1;
      e.audits.production.counts.total = 1;
      e.audits.production.vulnerabilities = [
        { name: "next", severity: "high", nodes: ["node_modules/next"] }
      ];
    }
  },
  {
    id: "production_audit_critical_reopened",
    base: "contained",
    code: "PRODUCTION_AUDIT_NOT_ZERO",
    mutate: (e) => {
      e.audits.production.exitCode = 1;
      e.audits.production.counts.critical = 1;
      e.audits.production.counts.total = 1;
      e.audits.production.vulnerabilities = [
        { name: "sharp", severity: "critical", nodes: ["node_modules/sharp"] }
      ];
    }
  },
  {
    id: "production_audit_command_substituted",
    base: "contained",
    code: "PRODUCTION_AUDIT_COMMAND_MISMATCH",
    mutate: (e) => {
      e.audits.production.command = "npm.cmd audit --json";
    }
  },
  {
    id: "full_audit_omits_dev",
    base: "contained",
    code: "FULL_AUDIT_COMMAND_MISMATCH",
    mutate: (e) => {
      e.audits.full.command = "npm.cmd audit --omit=dev --json";
    }
  },
  {
    id: "full_audit_fake_zero_exit",
    base: "contained",
    code: "FULL_AUDIT_NOT_CLEARED_OR_EXACTLY_CONTAINED",
    mutate: (e) => {
      e.audits.full.exitCode = 0;
    }
  },
  {
    id: "full_audit_row_omitted",
    base: "contained",
    code: "FULL_AUDIT_ROW_COUNT_MISMATCH",
    mutate: (e) => {
      e.audits.full.vulnerabilities.pop();
    }
  },
  {
    id: "full_audit_row_duplicated",
    base: "contained",
    code: "FULL_AUDIT_DUPLICATE_ROWS",
    mutate: (e) => {
      e.audits.full.vulnerabilities.push(clone(e.audits.full.vulnerabilities[0]));
      e.audits.full.counts.high = 10;
      e.audits.full.counts.total = 10;
    }
  },
  {
    id: "full_audit_severity_downgraded",
    base: "contained",
    code: "FULL_AUDIT_NOT_CLEARED_OR_EXACTLY_CONTAINED",
    mutate: (e) => {
      e.audits.full.vulnerabilities[0].severity = "moderate";
      e.audits.full.counts.high = 8;
      e.audits.full.counts.moderate = 1;
    }
  },
  {
    id: "full_audit_count_decremented",
    base: "contained",
    code: "FULL_AUDIT_COUNTS_INVALID",
    mutate: (e) => {
      e.audits.full.counts.high = 8;
    }
  },
  {
    id: "full_audit_critical_inserted",
    base: "contained",
    code: "FULL_AUDIT_NOT_CLEARED_OR_EXACTLY_CONTAINED",
    mutate: (e) => {
      e.audits.full.vulnerabilities[0].severity = "critical";
      e.audits.full.counts.high = 8;
      e.audits.full.counts.critical = 1;
    }
  },
  {
    id: "full_audit_node_path_omitted",
    base: "contained",
    code: "FULL_AUDIT_NOT_CLEARED_OR_EXACTLY_CONTAINED",
    mutate: (e) => {
      e.audits.full.vulnerabilities[0].nodes = [];
    }
  },
  {
    id: "severe_node_relabelled_production",
    base: "contained",
    code: "SEVERE_NODE_NOT_DEV_ONLY",
    mutate: (e) => {
      e.severeGraph[0].dev = false;
    }
  },
  {
    id: "eslint_moved_to_production_surface",
    base: "contained",
    code: "PRODUCTION_ROOT_SURFACE_DRIFT",
    mutate: (e) => {
      e.candidate.root.dependencies.eslint = e.candidate.root.devDependencies.eslint;
      e.candidate.lockRoot.dependencies.eslint = e.candidate.root.devDependencies.eslint;
      delete e.candidate.root.devDependencies.eslint;
      delete e.candidate.lockRoot.devDependencies.eslint;
    }
  },
  {
    id: "severe_graph_node_missing",
    base: "contained",
    code: "CONTAINED_GRAPH_SIZE_MISMATCH",
    mutate: (e) => {
      e.severeGraph.pop();
    }
  },
  {
    id: "severe_graph_node_duplicated",
    base: "contained",
    code: "CONTAINED_GRAPH_DUPLICATE_NODE",
    mutate: (e) => {
      e.severeGraph[1] = clone(e.severeGraph[0]);
    }
  },
  {
    id: "severe_graph_version_drift",
    base: "contained",
    code: "CONTAINED_GRAPH_EDGE_DRIFT",
    mutate: (e) => {
      e.severeGraph[0].version = "0.21.1";
    }
  },
  {
    id: "severe_graph_parent_omitted",
    base: "contained",
    code: "CONTAINED_GRAPH_EDGE_DRIFT",
    mutate: (e) => {
      e.severeGraph[8].parents.pop();
    }
  },
  {
    id: "severe_graph_parent_range_drift",
    base: "contained",
    code: "CONTAINED_GRAPH_EDGE_DRIFT",
    mutate: (e) => {
      e.severeGraph[8].parents[0].range = "*";
    }
  },
  {
    id: "severe_graph_integrity_missing",
    base: "contained",
    code: "SEVERE_NODE_LOCK_PROVENANCE_INVALID",
    mutate: (e) => {
      delete e.severeGraph[0].integrity;
    }
  },
  {
    id: "severe_graph_local_resolution",
    base: "contained",
    code: "SEVERE_NODE_LOCK_PROVENANCE_INVALID",
    mutate: (e) => {
      e.severeGraph[0].resolved = "file:../config-array";
    }
  },
  {
    id: "next_postcss_override_removed",
    base: "contained",
    code: "OVERRIDE_SCOPE_UNSUPPORTED",
    mutate: (e) => {
      delete e.candidate.root.overrides.next.postcss;
    }
  },
  {
    id: "next_sharp_override_removed",
    base: "contained",
    code: "OVERRIDE_SCOPE_UNSUPPORTED",
    mutate: (e) => {
      delete e.candidate.root.overrides.next.sharp;
    }
  },
  {
    id: "global_minimatch_override_claimed",
    base: "contained",
    code: "OVERRIDE_SCOPE_UNSUPPORTED",
    mutate: (e) => {
      e.candidate.root.overrides.minimatch = "10.2.5";
    }
  },
  {
    id: "global_brace_expansion_override_claimed",
    base: "contained",
    code: "OVERRIDE_SCOPE_UNSUPPORTED",
    mutate: (e) => {
      e.candidate.root.overrides["brace-expansion"] = "5.0.8";
    }
  },
  {
    id: "rejected_false_fix_expand_not_function",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.candidate.root.overrides.minimatch = "10.2.5";
      e.qc.directToolchainBehavior = "FAIL: expand is not a function";
    },
    also: "OVERRIDE_SCOPE_UNSUPPORTED"
  },
  {
    id: "next_override_resolution_drift",
    base: "contained",
    code: "NEXT_OVERRIDE_RESOLUTION_DRIFT",
    mutate: (e) => {
      e.candidate.installed.nextNestedPostcss = "8.4.31";
    }
  },
  {
    id: "eslint_10_major_migration",
    base: "cleared",
    code: "INSTALLED_MAJOR_BOUNDARY_CROSSED",
    mutate: (e) => {
      e.candidate.root.devDependencies.eslint = "^10.8.0";
      e.candidate.lockRoot.devDependencies.eslint = "^10.8.0";
      e.candidate.installed.eslint = "10.8.0";
    }
  },
  {
    id: "eslint_config_next_16_migration",
    base: "cleared",
    code: "INSTALLED_MAJOR_BOUNDARY_CROSSED",
    mutate: (e) => {
      e.candidate.root.devDependencies["eslint-config-next"] = "^16.2.11";
      e.candidate.lockRoot.devDependencies["eslint-config-next"] = "^16.2.11";
      e.candidate.installed.eslintConfigNext = "16.2.11";
    }
  },
  {
    id: "next_16_migration",
    base: "cleared",
    code: "ROOT_MAJOR_BOUNDARY_CROSSED",
    mutate: (e) => {
      e.candidate.root.dependencies.next = "^16.2.11";
      e.candidate.lockRoot.dependencies.next = "^16.2.11";
      e.candidate.installed.next = "16.2.11";
    }
  },
  {
    id: "eslint_peer_excludes_v9",
    base: "cleared",
    code: "ESLINT_CONFIG_PEER_REJECTS_ESLINT9",
    mutate: (e) => {
      e.candidate.peerBoundary.eslintConfigNextAcceptsEslint = "^10.0.0";
    }
  },
  {
    id: "typescript_peer_boundary_drift",
    base: "cleared",
    code: "TYPESCRIPT_PEER_BOUNDARY_DRIFT",
    mutate: (e) => {
      e.candidate.peerBoundary.typescriptMinimum = ">=6.0.0";
    }
  },
  {
    id: "lint_scope_removed",
    base: "cleared",
    code: "QC_COMMAND_SCOPE_DRIFT",
    mutate: (e) => {
      e.candidate.commands.lint = "eslint app/dashboard/profile/page.tsx";
    }
  },
  {
    id: "typecheck_scope_removed",
    base: "cleared",
    code: "QC_COMMAND_SCOPE_DRIFT",
    mutate: (e) => {
      e.candidate.commands.typecheck = "echo skipped";
    }
  },
  {
    id: "build_scope_removed",
    base: "cleared",
    code: "QC_COMMAND_SCOPE_DRIFT",
    mutate: (e) => {
      e.candidate.commands.build = "echo skipped";
    }
  },
  {
    id: "dependency_candidate_dirty",
    base: "contained",
    code: "DEPENDENCY_CANDIDATE_DIRTY",
    mutate: (e) => {
      e.candidate.worktree.dependencyPathsDirty = true;
    }
  },
  {
    id: "dependency_candidate_untracked_file",
    base: "contained",
    code: "DEPENDENCY_CANDIDATE_DIRTY",
    mutate: (e) => {
      e.candidate.worktree.untrackedDependencyPaths = ["package-lock.repaired.json"];
    }
  },
  {
    id: "cleared_repair_self_issued_by_thufir",
    base: "cleared",
    code: "CLEARED_REPAIR_CUSTODY_INVALID",
    mutate: (e) => {
      e.repair.owner = "Thufir@Betsy";
    }
  },
  {
    id: "cleared_repair_baseline_hash_drift",
    base: "cleared",
    code: "CLEARED_REPAIR_HASH_BINDING_INVALID",
    mutate: (e) => {
      e.repair.baselineLockSha256 = "c".repeat(64);
    }
  },
  {
    id: "cleared_repair_candidate_hash_drift",
    base: "cleared",
    code: "CLEARED_REPAIR_HASH_BINDING_INVALID",
    mutate: (e) => {
      e.repair.candidateLockSha256 = "c".repeat(64);
    }
  },
  {
    id: "cleared_repair_scope_widened_to_product",
    base: "cleared",
    code: "CLEARED_REPAIR_CUSTODY_INVALID",
    mutate: (e) => {
      e.repair.scope = "PRODUCT_AND_TOOLCHAIN";
    }
  },
  {
    id: "cleared_repair_force_claim",
    base: "cleared",
    code: "CLEARED_REPAIR_CUSTODY_INVALID",
    mutate: (e) => {
      e.repair.forcedOverride = true;
    }
  },
  {
    id: "cleared_repair_path_widened",
    base: "cleared",
    code: "CLEARED_REPAIR_PATH_SCOPE_INVALID",
    mutate: (e) => {
      e.repair.changedPaths.push("app/page.tsx");
    }
  },
  {
    id: "cleared_without_candidate_change",
    base: "cleared",
    code: "CLEARED_WITHOUT_BOUND_REPAIR",
    mutate: (e) => {
      e.candidate.packageSha256 = BASELINE_PACKAGE_SHA256;
      e.candidate.observedPackageSha256 = BASELINE_PACKAGE_SHA256;
      e.candidate.lockSha256 = BASELINE_LOCK_SHA256;
      e.candidate.observedLockSha256 = BASELINE_LOCK_SHA256;
      e.repair.candidatePackageSha256 = BASELINE_PACKAGE_SHA256;
      e.repair.candidateLockSha256 = BASELINE_LOCK_SHA256;
      e.qc.packageSha256 = BASELINE_PACKAGE_SHA256;
      e.qc.lockSha256 = BASELINE_LOCK_SHA256;
      bindAudits(e);
    }
  },
  {
    id: "cleared_qc_not_independent",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.qc.independentlyCollected = false;
    }
  },
  {
    id: "cleared_qc_candidate_hash_drift",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.qc.lockSha256 = "c".repeat(64);
    }
  },
  {
    id: "cleared_lint_failed",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.qc.lint = "FAIL";
    }
  },
  {
    id: "cleared_typecheck_failed",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.qc.typecheck = "FAIL";
    }
  },
  {
    id: "cleared_build_failed",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      e.qc.build = "FAIL";
    }
  },
  {
    id: "cleared_direct_toolchain_probe_missing",
    base: "cleared",
    code: "CLEARED_QC_BINDING_INVALID",
    mutate: (e) => {
      delete e.qc.directToolchainBehavior;
    }
  },
  {
    id: "raw_caller_claims_authority",
    base: "contained",
    code: "EVIDENCE_AUTHORITY_INVALID",
    mutate: (e) => {
      e.evidenceBinding.rawCallerAuthoritative = true;
    }
  },
  {
    id: "vpg43_stale_evidence_selected",
    base: "contained",
    code: "STALE_EVIDENCE_SELECTED_AS_AUTHORITY",
    mutate: (e) => {
      e.evidenceBinding.selectedHistoricalAuthority = "VPG43";
    }
  },
  {
    id: "vpg47_stale_evidence_selected",
    base: "contained",
    code: "STALE_EVIDENCE_SELECTED_AS_AUTHORITY",
    mutate: (e) => {
      e.evidenceBinding.selectedHistoricalAuthority = "VPG47";
    }
  },
  {
    id: "j_scope_laundered",
    base: "contained",
    code: "SCOPE_WIDENED",
    mutate: (e) => {
      e.scope.jAuthorized = true;
    }
  },
  {
    id: "production_scope_laundered",
    base: "contained",
    code: "SCOPE_WIDENED",
    mutate: (e) => {
      e.scope.productionAuthorized = true;
    }
  },
  {
    id: "deploy_scope_laundered",
    base: "contained",
    code: "SCOPE_WIDENED",
    mutate: (e) => {
      e.scope.deployAuthorized = true;
    }
  },
  {
    id: "thufir_dependency_edit_laundered",
    base: "contained",
    code: "SCOPE_WIDENED",
    mutate: (e) => {
      e.scope.thufirDependencyEdit = true;
    }
  }
];

const results = attacks.map((attack) => {
  const evidence = attack.base === "cleared" ? clearedControl() : clone(fixture);
  attack.mutate(evidence);
  const result = evaluateDevToolchainContainment(evidence);
  const codes = result.reasons.map((reason) => reason.code);
  const expectedObserved = codes.includes(attack.code);
  const secondaryObserved = attack.also ? codes.includes(attack.also) : true;
  const bypass = result.state !== "STOP" || !expectedObserved || !secondaryObserved;
  return {
    id: attack.id,
    base: attack.base,
    expectedCode: attack.code,
    secondaryCode: attack.also ?? null,
    state: result.state,
    expectedObserved,
    secondaryObserved,
    bypass,
    reasonCodes: codes
  };
});

const bypasses = results.filter((result) => result.bypass);
const output = {
  schema: "werkles.vpg49-thufir-dev-toolchain-containment-test-result/v1",
  cycleId: fixture.cycleId,
  exactIdeasExecuted: 2,
  idea1: {
    id: "CURRENT_DUAL_AUDIT_DEPENDENCY_PEER_BOUNDARY",
    currentControl: contained.state,
    clearedSyntheticControl: cleared.state,
    syntheticControlAuthoritative: false
  },
  idea2: {
    id: "OVERRIDE_OMISSION_SEVERITY_PRODUCTION_SCOPE_ADVERSARY",
    attackCount: results.length,
    rejectedCount: results.length - bypasses.length,
    bypassCount: bypasses.length,
    bypassIds: bypasses.map((result) => result.id),
    rejectedFalseFixCovered: results.some(
      (result) =>
        result.id === "rejected_false_fix_expand_not_function" &&
        result.state === "STOP" &&
        !result.bypass
    )
  },
  repairAttemptsUsed: 0,
  result: bypasses.length === 0 ? "PASS" : "FAIL"
};

console.log(JSON.stringify(output, null, 2));
if (bypasses.length) {
  console.error(JSON.stringify(bypasses, null, 2));
  process.exitCode = 1;
}
