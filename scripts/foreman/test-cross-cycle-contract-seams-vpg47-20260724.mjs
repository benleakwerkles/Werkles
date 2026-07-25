#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg47-hoard-coherence-contract-20260724.json";
const fixture = readJson(fixturePath);
const failures = [];
const checks = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(path.join(root, relativePath)))
    .digest("hex");
}

function check(name, condition, detail = null) {
  const item = { name, pass: Boolean(condition), detail };
  checks.push(item);
  if (!item.pass) failures.push(item);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function runNode(testCase) {
  const result = spawnSync(process.execPath, [testCase.path], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  });
  const commandResult = {
    id: testCase.id,
    path: testCase.path,
    exit_code: result.status,
    signal: result.signal,
    stdout_tail: String(result.stdout ?? "").trim().split(/\r?\n/).slice(-3),
    stderr_tail: String(result.stderr ?? "").trim().split(/\r?\n/).slice(-3)
  };
  check(`command_${testCase.id}`, result.status === 0, commandResult);
  return commandResult;
}

function runAudit(extraArgs = []) {
  const command = process.platform === "win32"
    ? (process.env.ComSpec || "cmd.exe")
    : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm.cmd audit ${extraArgs.join(" ")} --json`]
    : ["audit", ...extraArgs, "--json"];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  });
  let audit = null;
  try {
    audit = JSON.parse(result.stdout);
  } catch (error) {
    check(`current_${extraArgs.includes("--omit=dev") ? "production" : "full"}_audit_json`, false, {
      exit_code: result.status,
      error: error.message,
      stderr: String(result.stderr ?? "").slice(-1000)
    });
    return null;
  }
  const counts = audit?.metadata?.vulnerabilities ?? {};
  return {
    exit_code: result.status,
    counts,
    vulnerabilities: audit.vulnerabilities ?? {},
    severe_packages: Object.values(audit.vulnerabilities ?? {})
      .filter((item) => item.severity === "high" || item.severity === "critical")
      .map((item) => item.name)
      .sort()
  };
}

function freshCurrentAuditTruth(lock) {
  const full = runAudit();
  const production = runAudit(["--omit=dev"]);
  check("current_full_audit_json", Boolean(full));
  check("current_production_audit_json", Boolean(production));
  if (!full || !production) return { full, production, severe_nodes_all_dev_only: false };

  const fullCounts = full.counts ?? {};
  const productionCounts = production.counts ?? {};
  check("current_full_audit_critical_zero", fullCounts.critical === 0, fullCounts);
  check("current_production_audit_high_zero", productionCounts.high === 0, productionCounts);
  check(
    "current_production_audit_critical_zero",
    productionCounts.critical === 0,
    productionCounts
  );

  const severeNodes = Object.values(full.vulnerabilities)
    .filter((item) => item.severity === "high" || item.severity === "critical")
    .flatMap((item) => item.nodes ?? []);
  const severeNodeState = [...new Set(severeNodes)].sort().map((node) => ({
    node,
    dev_only: lock.packages?.[node]?.dev === true || lock.packages?.[node]?.devOptional === true
  }));
  const severeNodesAllDevOnly = severeNodeState.every((item) => item.dev_only);
  check("current_full_audit_severe_nodes_are_dev_only", severeNodesAllDevOnly, severeNodeState);
  return {
    full: {
      exit_code: full.exit_code,
      counts: full.counts,
      severe_packages: full.severe_packages
    },
    production: {
      exit_code: production.exit_code,
      counts: production.counts,
      severe_packages: production.severe_packages
    },
    severe_nodes_all_dev_only: severeNodesAllDevOnly,
    severe_node_state: severeNodeState,
    residual_disposition:
      fullCounts.high > 0 && productionCounts.high === 0 && severeNodesAllDevOnly
        ? "DEFER_DEV_TOOLCHAIN_MAJOR_REPAIR_TO_FUTURE_DEPENDENCY_LANE"
        : "NO_DEFERRED_DEV_ONLY_HIGH_OR_NOT_PROVEN_DEV_ONLY"
  };
}

check("fixture_schema", fixture.schema === "werkles.vpg47-hoard-coherence-contract/v1");
check("fixture_cycle", fixture.cycle_id === "WERKLES-FLOCK-20260724-234703-ET-BETSY-01");

const historicalReceipt = read(fixture.historical_dependency_receipt);
const historicalHashState = [];
for (const [relativePath, historicalHash] of Object.entries(
  fixture.historical_dependency_hashes
)) {
  const currentHash = sha256(relativePath);
  const receiptCarriesHash = historicalReceipt.toLowerCase().includes(historicalHash);
  check(`historical_receipt_binds_${relativePath}`, receiptCarriesHash, historicalHash);
  historicalHashState.push({
    path: relativePath,
    historical_sha256: historicalHash,
    current_sha256: currentHash,
    relationship:
      historicalHash === currentHash
        ? "CURRENT_SOURCE_STILL_MATCHES_HISTORICAL_HASH"
        : "HISTORICAL_HASH_SUPERSEDED_BY_CURRENT_BOUNDED_CANDIDATE"
  });
}

for (const relativePath of fixture.current_source_files) {
  check(`current_source_exists_${relativePath}`, Boolean(read(relativePath).length), relativePath);
}
for (const relativePath of fixture.historical_current_state_snapshots) {
  check(`historical_snapshot_exists_${relativePath}`, Boolean(read(relativePath).length), {
    path: relativePath,
    authority: "HISTORICAL_ONLY_NOT_CURRENT_SOURCE"
  });
}

const manifest = readJson("package.json");
const lock = readJson("package-lock.json");
check("dependency_next_floor_preserved", manifest.dependencies?.next === "^15.5.21");
check(
  "dependency_next_postcss_override_preserved",
  manifest.overrides?.next?.postcss === "8.5.18"
);
check(
  "dependency_next_sharp_override_preserved",
  manifest.overrides?.next?.sharp === "0.35.0"
);
check(
  "dependency_lock_root_matches_manifest",
  canonicalJson(lock.packages?.[""]?.dependencies) === canonicalJson(manifest.dependencies)
);
check(
  "dev_dependency_lock_root_matches_manifest",
  canonicalJson(lock.packages?.[""]?.devDependencies) === canonicalJson(manifest.devDependencies)
);

const requestSource = read("lib/supabase/request.ts");
check("vpg44_bearer_is_exact_single_token", /\^Bearer \(\[\^\\s\]\+\)\$\/i/.test(requestSource));
check("vpg44_bearer_split_removed", !/header\.split\(/.test(requestSource));

const aliasGuard = read("scripts/deploy/deploy-alias-guard.mjs");
check("vpg44_alias_phrase_required", aliasGuard.includes("APPROVE WERKLES PRODUCTION ALIAS"));
check("vpg44_alias_digest_bound", aliasGuard.includes("productionAliasApprovalDigest"));
check("vpg44_generic_gate_not_sufficient", aliasGuard.includes("PRODUCTION_ALIAS_APPROVAL_INVALID"));

const home = read("app/page.tsx");
const beta = read("app/beta-signup-form.tsx");
const valueFold = read("components/foundry/home-value-fold.tsx");
const meter = read("components/squibb/confidence-meter.tsx");
check("vpg45_entry_paths_are_list_semantics", /role="list" aria-label="Werkles entry paths"/.test(home));
check("vpg45_account_gate_is_list_semantics", /role="list" aria-label="Required account gate"/.test(home));
check("vpg45_beta_doorway_is_section", /<section className="beta-form"/.test(beta));
check("vpg45_value_fold_heading_level", (valueFold.match(/<h2>/g) ?? []).length === 3);
check("vpg45_meter_group_semantics", (meter.match(/role="group"/g) ?? []).length === 2);

const profile = read("app/dashboard/profile/page.tsx");
const options = read("lib/profile-builder-options.ts");
const disclosure = read("lib/matching/personal-recommendation-disclosure.ts");
const profileBuilder = read("lib/matching/profile-recommendation.ts");
const contract = read("lib/matching/personal-recommendation-contract.ts");
const recommendationTypes = read("lib/squibb/recommendations.ts");
const surface = read("components/squibb/recommendation-surface.tsx");
check("vpg46_profile_normalizes_state", profile.includes("normalizeUsStateCode(form.get(\"location_state\"))"));
check("vpg46_profile_prevents_double_save", profile.includes("if (isSaving) return"));
check("vpg46_profile_validates_lane", profile.includes("isProfileLaneValue(lane)"));
check("vpg46_profile_validates_visibility", profile.includes("isProfileVisibilityValue(visibilityMode)"));
check("vpg46_options_export_normalizer", options.includes("export function normalizeUsStateCode"));
check("vpg46_disclosure_method", disclosure.includes('method: "fixed_written_rules"'));
check("vpg46_disclosure_ai_false", disclosure.includes("aiModelUsed: false"));
check("vpg46_profile_imports_disclosure", profileBuilder.includes("@/lib/matching/personal-recommendation-disclosure"));
check("vpg46_contract_imports_disclosure", contract.includes("@/lib/matching/personal-recommendation-disclosure"));
check("vpg46_contract_requires_generation", contract.includes("isCanonicalPersonalGeneration(value.generation)"));
check("vpg46_contract_requires_canonical_gates", contract.includes("hasCanonicalMatchingGates(item)"));
check("vpg46_generation_type_present", recommendationTypes.includes("PersonalRecommendationGenerationDisclosure"));
check("vpg46_surface_renders_generation_explanation", surface.includes("personalGeneration?.explanation"));

const commandResults = fixture.current_behavior_commands.map(runNode);
const audit = freshCurrentAuditTruth(lock);
const currentSourceHashes = Object.fromEntries(
  fixture.current_source_files.map((relativePath) => [relativePath, sha256(relativePath)])
);
const currentChangedFromHistorical = historicalHashState.filter(
  (item) => item.relationship === "HISTORICAL_HASH_SUPERSEDED_BY_CURRENT_BOUNDED_CANDIDATE"
).length;

const result = {
  schema: "werkles.vpg47-ender-cross-cycle-contract-seam-result/v1",
  cycle_id: fixture.cycle_id,
  seat: "Ender/Doozer@Betsy",
  idea: "CROSS_CYCLE_DEPENDENCY_PRODUCT_CONTRACT_SEAM_PROOF",
  historical_dependency_claim: "VPG43_RECORDED_ZERO_AT_ITS_OBSERVATION_TIME",
  current_dependency_claim:
    audit?.production?.counts?.high === 0 &&
    audit?.production?.counts?.critical === 0 &&
    audit?.severe_nodes_all_dev_only
      ? "PRODUCTION_AUDIT_ZERO_WITH_FULL_AUDIT_DEV_TOOLCHAIN_RESIDUAL_DISCLOSED"
      : "CURRENT_AUDIT_BOUNDARY_NOT_PROVEN",
  historical_hash_state: historicalHashState,
  historical_hashes_superseded_count: currentChangedFromHistorical,
  historical_snapshots_are_current_authority: false,
  current_source_hashes: currentSourceHashes,
  command_results: commandResults,
  fresh_full_audit: audit,
  check_count: checks.length,
  failure_count: failures.length,
  failures,
  result: failures.length === 0 ? "PASS" : "FAIL"
};

const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0) {
  const output = process.argv[outputIndex + 1];
  if (!output) throw new Error("--output requires a path");
  writeFileSync(path.join(root, output), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 2;
