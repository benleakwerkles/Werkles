#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VPG49_CYCLE_ID = "WERKLES-FLOCK-20260725-015952-ET-BETSY-01";
export const VPG49_BRANCH = "codex/werkles-vpg31-20260721";
export const VPG49_SOURCE_COMMIT = "bd24b45d3a01b51ee05c951d5f96e1bac6398686";
export const BASELINE_PACKAGE_SHA256 =
  "56570ee3dbf03ccfa371311fbfb9df13bdc5171c389c47c87c9d2f68442354fa";
export const BASELINE_LOCK_SHA256 =
  "655c4c86ef294ee940d39722b93aa5297c92c9903b01ceb6cd7eee20a4801621";
export const EVIDENCE_SCHEMA = "werkles.vpg49-dev-toolchain-containment-evidence/v1";

const EXACT_PRODUCTION_DEPENDENCIES = {
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.49.4",
  chokidar: "^5.0.0",
  next: "^15.5.21",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  "server-only": "^0.0.1",
  stripe: "^17.7.0"
};

const BASELINE_DEV_DEPENDENCIES = {
  "@types/node": "^22.15.18",
  "@types/react": "^19.0.10",
  "@types/react-dom": "^19.0.4",
  autoprefixer: "^10.4.21",
  eslint: "^9.27.0",
  "eslint-config-next": "^15.3.2",
  playwright: "^1.60.0",
  postcss: "^8.5.18",
  tailwindcss: "^3.4.17",
  typescript: "^5.8.3"
};

const EXACT_COMMANDS = {
  lint:
    "eslint --max-warnings=0 app/dashboard/profile/page.tsx components/squibb/evidence-section.tsx components/squibb/personal-recommendation-delivery.tsx components/squibb/recommendation-card.tsx components/squibb/recommendation-surface.tsx",
  typecheck: "tsc --noEmit",
  build: "next build"
};

const CURRENT_SEVERE_ROWS = [
  ["@eslint/config-array", "node_modules/@eslint/config-array"],
  ["@eslint/eslintrc", "node_modules/@eslint/eslintrc"],
  ["brace-expansion", "node_modules/brace-expansion"],
  ["eslint", "node_modules/eslint"],
  ["eslint-config-next", "node_modules/eslint-config-next"],
  ["eslint-plugin-import", "node_modules/eslint-plugin-import"],
  ["eslint-plugin-jsx-a11y", "node_modules/eslint-plugin-jsx-a11y"],
  ["eslint-plugin-react", "node_modules/eslint-plugin-react"],
  ["minimatch", "node_modules/minimatch"]
].map(([name, node]) => ({ name, severity: "high", nodes: [node] }));

const CURRENT_SEVERE_GRAPH = [
  {
    name: "@eslint/config-array",
    path: "node_modules/@eslint/config-array",
    version: "0.21.2",
    parents: [{ path: "node_modules/eslint", range: "^0.21.2" }]
  },
  {
    name: "@eslint/eslintrc",
    path: "node_modules/@eslint/eslintrc",
    version: "3.3.5",
    parents: [{ path: "node_modules/eslint", range: "^3.3.5" }]
  },
  {
    name: "brace-expansion",
    path: "node_modules/brace-expansion",
    version: "1.1.16",
    parents: [{ path: "node_modules/minimatch", range: "^1.1.7" }]
  },
  {
    name: "eslint",
    path: "node_modules/eslint",
    version: "9.39.4",
    parents: [{ path: "<root-dev>", range: "^9.27.0" }]
  },
  {
    name: "eslint-config-next",
    path: "node_modules/eslint-config-next",
    version: "15.5.18",
    parents: [{ path: "<root-dev>", range: "^15.3.2" }]
  },
  {
    name: "eslint-plugin-import",
    path: "node_modules/eslint-plugin-import",
    version: "2.32.0",
    parents: [{ path: "node_modules/eslint-config-next", range: "^2.31.0" }]
  },
  {
    name: "eslint-plugin-jsx-a11y",
    path: "node_modules/eslint-plugin-jsx-a11y",
    version: "6.10.2",
    parents: [{ path: "node_modules/eslint-config-next", range: "^6.10.0" }]
  },
  {
    name: "eslint-plugin-react",
    path: "node_modules/eslint-plugin-react",
    version: "7.37.5",
    parents: [{ path: "node_modules/eslint-config-next", range: "^7.37.0" }]
  },
  {
    name: "minimatch",
    path: "node_modules/minimatch",
    version: "3.1.5",
    parents: [
      { path: "node_modules/@eslint/config-array", range: "^3.1.5" },
      { path: "node_modules/@eslint/eslintrc", range: "^3.1.5" },
      { path: "node_modules/@typescript-eslint/typescript-estree", range: "^10.2.2" },
      { path: "node_modules/eslint", range: "^3.1.5" },
      { path: "node_modules/eslint-plugin-import", range: "^3.1.2" },
      { path: "node_modules/eslint-plugin-jsx-a11y", range: "^3.1.2" },
      { path: "node_modules/eslint-plugin-react", range: "^3.1.2" }
    ]
  }
];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(String(value ?? ""));
}

function versionMajor(value) {
  const match = String(value ?? "").match(/^(\d+)\./);
  return match ? Number(match[1]) : null;
}

function rangeMajor(value) {
  const match = String(value ?? "").match(/^\^(\d+)\./);
  return match ? Number(match[1]) : null;
}

function auditCountsValid(counts) {
  const fields = ["info", "low", "moderate", "high", "critical", "total"];
  if (!fields.every((field) => Number.isInteger(counts?.[field]) && counts[field] >= 0)) {
    return false;
  }
  return (
    counts.info + counts.low + counts.moderate + counts.high + counts.critical ===
    counts.total
  );
}

function addReason(reasons, code, detail = null) {
  if (!reasons.some((reason) => reason.code === code)) reasons.push({ code, detail });
}

function validateAudit(audit, kind, candidate, reasons) {
  const expectedCommand =
    kind === "full" ? "npm.cmd audit --json" : "npm.cmd audit --omit=dev --json";
  if (audit?.command !== expectedCommand) {
    addReason(reasons, `${kind.toUpperCase()}_AUDIT_COMMAND_MISMATCH`, audit?.command ?? null);
  }
  if (
    audit?.fresh !== true ||
    audit?.auditReportVersion !== 2 ||
    audit?.packageSha256 !== candidate?.packageSha256 ||
    audit?.lockSha256 !== candidate?.lockSha256
  ) {
    addReason(reasons, `${kind.toUpperCase()}_AUDIT_BINDING_INVALID`);
  }
  if (!auditCountsValid(audit?.counts)) {
    addReason(reasons, `${kind.toUpperCase()}_AUDIT_COUNTS_INVALID`, audit?.counts ?? null);
  }
  const rows = Array.isArray(audit?.vulnerabilities) ? audit.vulnerabilities : [];
  const names = rows.map((row) => row?.name);
  if (new Set(names).size !== names.length) {
    addReason(reasons, `${kind.toUpperCase()}_AUDIT_DUPLICATE_ROWS`);
  }
  if (audit?.counts?.total !== rows.length) {
    addReason(reasons, `${kind.toUpperCase()}_AUDIT_ROW_COUNT_MISMATCH`, {
      rows: rows.length,
      total: audit?.counts?.total ?? null
    });
  }
  const dependencyCounts = audit?.dependencyCounts ?? {};
  if (
    dependencyCounts.prod !== 51 ||
    dependencyCounts.dev !== 344 ||
    dependencyCounts.optional !== 67 ||
    dependencyCounts.total !== 432
  ) {
    addReason(reasons, `${kind.toUpperCase()}_DEPENDENCY_COUNTS_DRIFT`, dependencyCounts);
  }
  return rows;
}

function validateCandidate(candidate, reasons) {
  for (const field of [
    "packageSha256",
    "lockSha256",
    "observedPackageSha256",
    "observedLockSha256"
  ]) {
    if (!isSha256(candidate?.[field])) addReason(reasons, "CANDIDATE_HASH_INVALID", field);
  }
  if (
    candidate?.packageSha256 !== candidate?.observedPackageSha256 ||
    candidate?.lockSha256 !== candidate?.observedLockSha256
  ) {
    addReason(reasons, "CANDIDATE_HASH_OBSERVATION_MISMATCH");
  }
  if (!same(candidate?.root?.dependencies, EXACT_PRODUCTION_DEPENDENCIES)) {
    addReason(reasons, "PRODUCTION_ROOT_SURFACE_DRIFT");
  }
  if (!same(candidate?.lockRoot?.dependencies, candidate?.root?.dependencies)) {
    addReason(reasons, "PRODUCTION_LOCK_ROOT_DRIFT");
  }
  if (!same(candidate?.lockRoot?.devDependencies, candidate?.root?.devDependencies)) {
    addReason(reasons, "DEV_LOCK_ROOT_DRIFT");
  }
  if (candidate?.productionDependencyCount !== 51) {
    addReason(reasons, "PRODUCTION_DEPENDENCY_COUNT_DRIFT");
  }
  if (
    rangeMajor(candidate?.root?.dependencies?.next) !== 15 ||
    rangeMajor(candidate?.root?.devDependencies?.eslint) !== 9 ||
    rangeMajor(candidate?.root?.devDependencies?.["eslint-config-next"]) !== 15
  ) {
    addReason(reasons, "ROOT_MAJOR_BOUNDARY_CROSSED");
  }
  const overrides = candidate?.root?.overrides ?? {};
  if (!same(overrides, { next: { postcss: "8.5.18", sharp: "0.35.0" } })) {
    addReason(reasons, "OVERRIDE_SCOPE_UNSUPPORTED", overrides);
  }
  if (
    candidate?.installed?.nextNestedPostcss !== "8.5.18" ||
    candidate?.installed?.sharp !== "0.35.0"
  ) {
    addReason(reasons, "NEXT_OVERRIDE_RESOLUTION_DRIFT");
  }
  if (
    versionMajor(candidate?.installed?.next) !== 15 ||
    versionMajor(candidate?.installed?.eslint) !== 9 ||
    versionMajor(candidate?.installed?.eslintConfigNext) !== 15
  ) {
    addReason(reasons, "INSTALLED_MAJOR_BOUNDARY_CROSSED");
  }
  if (versionMajor(candidate?.installed?.next) !== versionMajor(candidate?.installed?.eslintConfigNext)) {
    addReason(reasons, "NEXT_CONFIG_MAJOR_MISMATCH");
  }
  const peer = String(candidate?.peerBoundary?.eslintConfigNextAcceptsEslint ?? "");
  if (!/\^9(?:\.0\.0)?/.test(peer)) {
    addReason(reasons, "ESLINT_CONFIG_PEER_REJECTS_ESLINT9", peer);
  }
  if (candidate?.peerBoundary?.typescriptMinimum !== ">=3.3.1") {
    addReason(reasons, "TYPESCRIPT_PEER_BOUNDARY_DRIFT");
  }
  if (!same(candidate?.commands, EXACT_COMMANDS)) {
    addReason(reasons, "QC_COMMAND_SCOPE_DRIFT", candidate?.commands ?? null);
  }
  if (
    candidate?.worktree?.dependencyPathsDirty !== false ||
    !Array.isArray(candidate?.worktree?.untrackedDependencyPaths) ||
    candidate.worktree.untrackedDependencyPaths.length !== 0
  ) {
    addReason(reasons, "DEPENDENCY_CANDIDATE_DIRTY");
  }
}

function validateCurrentGraph(graph, reasons) {
  if (!Array.isArray(graph) || graph.length !== CURRENT_SEVERE_GRAPH.length) {
    addReason(reasons, "CONTAINED_GRAPH_SIZE_MISMATCH");
    return;
  }
  const byName = new Map(graph.map((node) => [node?.name, node]));
  if (byName.size !== graph.length) addReason(reasons, "CONTAINED_GRAPH_DUPLICATE_NODE");
  for (const expected of CURRENT_SEVERE_GRAPH) {
    const observed = byName.get(expected.name);
    if (!observed) {
      addReason(reasons, "CONTAINED_GRAPH_NODE_MISSING", expected.name);
      continue;
    }
    if (
      observed.path !== expected.path ||
      observed.version !== expected.version ||
      !same(observed.parents, expected.parents)
    ) {
      addReason(reasons, "CONTAINED_GRAPH_EDGE_DRIFT", expected.name);
    }
    if (observed.dev !== true || observed.devOptional === true) {
      addReason(reasons, "SEVERE_NODE_NOT_DEV_ONLY", expected.name);
    }
    if (
      typeof observed.integrity !== "string" ||
      !observed.integrity.startsWith("sha512-") ||
      typeof observed.resolved !== "string" ||
      !observed.resolved.startsWith("https://registry.npmjs.org/")
    ) {
      addReason(reasons, "SEVERE_NODE_LOCK_PROVENANCE_INVALID", expected.name);
    }
  }
}

function validateScope(input, reasons) {
  const scope = input?.scope ?? {};
  for (const field of [
    "thufirDependencyEdit",
    "jAuthorized",
    "productionAuthorized",
    "deployAuthorized",
    "browserAuthorized",
    "liveActionAuthorized"
  ]) {
    if (scope[field] !== false) addReason(reasons, "SCOPE_WIDENED", field);
  }
  const evidence = input?.evidenceBinding ?? {};
  if (
    evidence.source !== "INDEPENDENT_LOCAL_ADAPTER" ||
    evidence.independentlyCollected !== true ||
    evidence.rawCallerAuthoritative !== false
  ) {
    addReason(reasons, "EVIDENCE_AUTHORITY_INVALID");
  }
  if (evidence.selectedHistoricalAuthority !== null) {
    addReason(reasons, "STALE_EVIDENCE_SELECTED_AS_AUTHORITY");
  }
}

function validateClearedRepair(input, reasons) {
  const repair = input?.repair ?? {};
  const candidate = input?.candidate ?? {};
  if (
    repair.attempted !== true ||
    repair.owner !== "Heimerdinker@Betsy" ||
    repair.scope !== "DEV_TOOLCHAIN_ONLY" ||
    repair.semverMajorMigration !== false ||
    repair.forcedOverride !== false
  ) {
    addReason(reasons, "CLEARED_REPAIR_CUSTODY_INVALID");
  }
  if (
    repair.baselinePackageSha256 !== BASELINE_PACKAGE_SHA256 ||
    repair.baselineLockSha256 !== BASELINE_LOCK_SHA256 ||
    repair.candidatePackageSha256 !== candidate.packageSha256 ||
    repair.candidateLockSha256 !== candidate.lockSha256
  ) {
    addReason(reasons, "CLEARED_REPAIR_HASH_BINDING_INVALID");
  }
  if (
    candidate.packageSha256 === BASELINE_PACKAGE_SHA256 &&
    candidate.lockSha256 === BASELINE_LOCK_SHA256
  ) {
    addReason(reasons, "CLEARED_WITHOUT_BOUND_REPAIR");
  }
  const changedPaths = repair.changedPaths;
  if (
    !Array.isArray(changedPaths) ||
    changedPaths.length === 0 ||
    changedPaths.some((entry) => !["package.json", "package-lock.json"].includes(entry))
  ) {
    addReason(reasons, "CLEARED_REPAIR_PATH_SCOPE_INVALID", changedPaths ?? null);
  }
  const qc = input?.qc ?? {};
  if (
    qc.independentlyCollected !== true ||
    qc.packageSha256 !== candidate.packageSha256 ||
    qc.lockSha256 !== candidate.lockSha256 ||
    qc.lint !== "PASS" ||
    qc.typecheck !== "PASS" ||
    qc.build !== "PASS" ||
    qc.productionAudit !== "PASS" ||
    qc.directToolchainBehavior !== "PASS"
  ) {
    addReason(reasons, "CLEARED_QC_BINDING_INVALID");
  }
}

export function evaluateDevToolchainContainment(input = {}) {
  const reasons = [];
  if (input.schema !== EVIDENCE_SCHEMA) addReason(reasons, "EVIDENCE_SCHEMA_MISMATCH");
  if (input.cycleId !== VPG49_CYCLE_ID) addReason(reasons, "CYCLE_IDENTITY_MISMATCH");
  if (input.branch !== VPG49_BRANCH || input.sourceCommit !== VPG49_SOURCE_COMMIT) {
    addReason(reasons, "SOURCE_BINDING_MISMATCH");
  }
  if (
    input?.baseline?.packageSha256 !== BASELINE_PACKAGE_SHA256 ||
    input?.baseline?.lockSha256 !== BASELINE_LOCK_SHA256
  ) {
    addReason(reasons, "PRE_EXPERIMENT_BASELINE_MISMATCH");
  }

  const candidate = input?.candidate ?? {};
  validateCandidate(candidate, reasons);
  validateScope(input, reasons);
  const fullRows = validateAudit(input?.audits?.full, "full", candidate, reasons);
  const productionRows = validateAudit(input?.audits?.production, "production", candidate, reasons);

  if (
    input?.audits?.production?.exitCode !== 0 ||
    input?.audits?.production?.counts?.total !== 0 ||
    productionRows.length !== 0
  ) {
    addReason(reasons, "PRODUCTION_AUDIT_NOT_ZERO");
  }

  const exactContainedRows = same(
    [...fullRows].sort((a, b) => String(a?.name).localeCompare(String(b?.name))),
    CURRENT_SEVERE_ROWS
  );
  const fullCounts = input?.audits?.full?.counts ?? {};
  const containedShape =
    input?.audits?.full?.exitCode === 1 &&
    fullCounts.info === 0 &&
    fullCounts.low === 0 &&
    fullCounts.moderate === 0 &&
    fullCounts.high === 9 &&
    fullCounts.critical === 0 &&
    fullCounts.total === 9 &&
    exactContainedRows;
  const clearedShape =
    input?.audits?.full?.exitCode === 0 &&
    fullCounts.info === 0 &&
    fullCounts.low === 0 &&
    fullCounts.moderate === 0 &&
    fullCounts.high === 0 &&
    fullCounts.critical === 0 &&
    fullCounts.total === 0 &&
    fullRows.length === 0;

  let proposedState = "STOP";
  if (containedShape) {
    proposedState = "CONTAINED_DEV_ONLY";
    if (
      candidate.packageSha256 !== BASELINE_PACKAGE_SHA256 ||
      candidate.lockSha256 !== BASELINE_LOCK_SHA256 ||
      !same(candidate.root.devDependencies, BASELINE_DEV_DEPENDENCIES)
    ) {
      addReason(reasons, "CONTAINED_BASELINE_DRIFT");
    }
    if (input?.repair?.attempted !== false) addReason(reasons, "CONTAINED_REPAIR_CLAIM_INVALID");
    validateCurrentGraph(input?.severeGraph, reasons);
  } else if (clearedShape) {
    proposedState = "CLEARED";
    if (Array.isArray(input?.severeGraph) && input.severeGraph.length !== 0) {
      addReason(reasons, "CLEARED_SEVERE_GRAPH_NOT_EMPTY");
    }
    validateClearedRepair(input, reasons);
  } else {
    addReason(reasons, "FULL_AUDIT_NOT_CLEARED_OR_EXACTLY_CONTAINED");
  }

  const state = reasons.length === 0 ? proposedState : "STOP";
  return {
    schema: "werkles.vpg49-dev-toolchain-containment-result/v1",
    cycleId: VPG49_CYCLE_ID,
    state,
    ok: state !== "STOP",
    reasons,
    evidenceAuthority:
      "TRUSTED_ADAPTER_REQUIRED; RAW_CALLER_JSON_AND_SYNTHETIC_CONTROLS_ARE_NOT_RELEASE_AUTHORITY",
    productionState:
      input?.audits?.production?.counts?.total === 0 ? "ZERO_FINDINGS_OBSERVED" : "NOT_ZERO",
    fullState:
      state === "CLEARED"
        ? "ZERO_FINDINGS_OBSERVED"
        : state === "CONTAINED_DEV_ONLY"
          ? "NINE_HIGH_DEV_ONLY_CONTAINED"
          : "UNACCEPTABLE_OR_UNPROVEN"
  };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const fixturePath =
    process.argv[2] ||
    "scripts/foreman/fixtures/vpg49-dev-toolchain-audit-containment-current-20260725.json";
  const input = JSON.parse(readFileSync(path.join(root, fixturePath), "utf8"));
  const result = evaluateDevToolchainContainment(input);
  console.log(JSON.stringify({ ...result, fixture: fixturePath }, null, 2));
  process.exitCode = result.state === "STOP" ? 1 : 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
