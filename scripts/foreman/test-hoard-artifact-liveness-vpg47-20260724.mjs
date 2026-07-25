#!/usr/bin/env node

import { execFileSync } from "node:child_process";
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

function gitPaths(args) {
  const output = execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function check(name, condition, detail = null) {
  const item = { name, pass: Boolean(condition), detail };
  checks.push(item);
  if (!item.pass) failures.push(item);
}

const supersededSnapshots = new Set(fixture.historical_current_state_snapshots);
const currentContractFixtures = new Set([
  "scripts/foreman/fixtures/vpg43-dependency-security-candidate-20260724.json",
  "scripts/foreman/fixtures/vpg45-thufir-release-custody-adversaries-20260724.json",
  "scripts/foreman/fixtures/vpg46-matching-explanation-gate-attacks-20260724.json",
  "scripts/foreman/fixtures/vpg46-matching-generation-gate-contract-20260724.json",
  fixturePath
]);

function disposition(relativePath) {
  if (supersededSnapshots.has(relativePath)) {
    return {
      disposition: "SUPERSEDED_STATE_SNAPSHOT",
      reason: "Cycle-valid historical observation; later dirty work means it is not current authority."
    };
  }
  if (
    relativePath.startsWith("foreman/handoffs/outbox/") ||
    relativePath.startsWith("foreman/reviews/") ||
    relativePath.endsWith("foreman/VPG_SHORTHAND.md") ||
    relativePath === "foreman/VPG_SHORTHAND.md" ||
    relativePath === "foreman/gates/APPROVAL_LOG.md" ||
    relativePath === "foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl" ||
    (relativePath.startsWith("foreman/receipts/") && relativePath.endsWith(".md"))
  ) {
    return {
      disposition: "CONTROL_PACKET_OR_RECEIPT",
      reason: "Packet, gate, review, ledger, or human-readable cycle receipt."
    };
  }
  if (relativePath.startsWith("foreman/receipts/") && relativePath.endsWith(".json")) {
    return {
      disposition: "HISTORICAL_IMMUTABLE_EVIDENCE",
      reason: "Machine result, attestation, matrix, or decision evidence bound by a cycle receipt."
    };
  }
  if (
    relativePath.startsWith("scripts/foreman/fixtures/") &&
    !currentContractFixtures.has(relativePath)
  ) {
    return {
      disposition: "HISTORICAL_IMMUTABLE_EVIDENCE",
      reason: "Adversarial or historical fixture retained for reproducible cycle evidence."
    };
  }
  if (
    /(^|\/)(?:node_modules|\.next|coverage|dist|build|tmp|temp|logs?)(\/|$)/i.test(
      relativePath
    ) ||
    /\.(?:log|tmp|bak|swp)$/i.test(relativePath)
  ) {
    return {
      disposition: "EXCLUDE",
      reason: "Generated, cache, log, build, or temporary material."
    };
  }
  return {
    disposition: "CURRENT_EXECUTABLE",
    reason: "Current product, package, guard, test, or contract input."
  };
}

const tracked = gitPaths(["diff", "--name-only"]);
const untracked = gitPaths(["ls-files", "--others", "--exclude-standard"]);
const candidatePaths = [...new Set([...tracked, ...untracked])].sort();
const artifacts = candidatePaths.map((relativePath) => ({
  path: relativePath,
  git_state: untracked.includes(relativePath) ? "UNTRACKED" : "TRACKED_MODIFIED",
  sha256: sha256(relativePath),
  bytes: readFileSync(path.join(root, relativePath)).length,
  ...disposition(relativePath)
}));

check("candidate_paths_unique", artifacts.length === candidatePaths.length);
check("all_candidate_paths_classified", artifacts.every((item) => item.disposition));

const hashGroups = new Map();
for (const artifact of artifacts) {
  const paths = hashGroups.get(artifact.sha256) ?? [];
  paths.push(artifact.path);
  hashGroups.set(artifact.sha256, paths);
}
const byteDuplicateGroups = [...hashGroups.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([sha256Value, paths]) => ({ sha256: sha256Value, paths }));
check("no_byte_identical_candidate_duplicates", byteDuplicateGroups.length === 0, byteDuplicateGroups);

const secretPatterns = [
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["jwt", /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  [
    "literal_secret_assignment",
    /(?:SUPABASE_SERVICE_ROLE_KEY|VERCEL_TOKEN|GITHUB_TOKEN|STRIPE_SECRET_KEY)\s*[=:]\s*["'][A-Za-z0-9_.-]{12,}["']/i
  ]
];
const secretHits = [];
for (const artifact of artifacts) {
  const text = read(artifact.path);
  for (const [pattern, regex] of secretPatterns) {
    if (regex.test(text)) secretHits.push({ path: artifact.path, pattern });
  }
}
check("no_secret_material", secretHits.length === 0, secretHits);

const edges = [];
const harvey = fixture.harvey_smoke_edge;
for (const relativePath of [harvey.source, harvey.guard, harvey.fixture, harvey.receipt]) {
  check(`harvey_edge_path_exists_${relativePath}`, Boolean(read(relativePath).length));
}
const harveyReceipt = read(harvey.receipt);
check("harvey_receipt_describes_unnamed_smoke", harveyReceipt.includes(harvey.receipt_phrase));
check(
  "harvey_receipt_does_not_name_smoke_path",
  !harveyReceipt.includes(path.basename(harvey.source))
);
edges.push({
  source: harvey.source,
  targets: [harvey.guard, harvey.fixture, harvey.receipt],
  edge_kind: "VPG47_MANIFEST_EDGE_FOR_RECEIPT_DESCRIBED_UNNAMED_SIX_CASE_SMOKE"
});

for (const binding of fixture.opaque_machine_results) {
  const blob = read(binding.blob);
  const receipt = read(binding.receipt);
  check(`opaque_blob_lacks_cycle_${binding.blob}`, !blob.includes(binding.cycle_id));
  check(`opaque_receipt_binds_cycle_${binding.blob}`, receipt.includes(binding.cycle_id));
  check(
    `opaque_receipt_names_blob_${binding.blob}`,
    receipt.includes(path.basename(binding.blob))
  );
  edges.push({
    source: binding.blob,
    targets: [binding.receipt],
    cycle_id: binding.cycle_id,
    edge_kind: "MACHINE_RESULT_TO_CYCLE_RECEIPT"
  });
}

const ledgerRows = read("foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl")
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
for (const gap of fixture.aggregate_ledger_gaps) {
  const ledger = ledgerRows.find((row) => row.legacy_label === gap.legacy_label);
  const aggregate = read(gap.aggregate);
  check(`aggregate_gap_ledger_row_${gap.legacy_label}`, Boolean(ledger));
  const receiptPaths = [
    ...(ledger?.receipt_paths?.p ?? []),
    ...(ledger?.receipt_paths?.g ?? [])
  ];
  const omitted = receiptPaths.filter((relativePath) => !aggregate.includes(relativePath));
  check(
    `aggregate_gap_is_real_${gap.legacy_label}`,
    omitted.length === receiptPaths.length && receiptPaths.length === 4,
    omitted
  );
  for (const relativePath of receiptPaths) {
    check(
      `aggregate_gap_ledger_target_exists_${gap.legacy_label}_${relativePath}`,
      Boolean(read(relativePath).length)
    );
  }
  edges.push({
    source: gap.aggregate,
    targets: receiptPaths,
    ledger: "foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl",
    cycle_id: ledger?.cycle_id ?? null,
    edge_kind: "CANONICAL_LEDGER_EDGE_SUPPLIES_AGGREGATE_OMISSION"
  });
}

const dispositionCounts = Object.fromEntries(
  [
    "CURRENT_EXECUTABLE",
    "HISTORICAL_IMMUTABLE_EVIDENCE",
    "SUPERSEDED_STATE_SNAPSHOT",
    "CONTROL_PACKET_OR_RECEIPT",
    "EXCLUDE"
  ].map((name) => [
    name,
    artifacts.filter((artifact) => artifact.disposition === name).length
  ])
);
const candidateRoot = createHash("sha256")
  .update(
    artifacts
      .map((artifact) => `${artifact.path}\0${artifact.sha256}\0${artifact.disposition}\n`)
      .join("")
  )
  .digest("hex");
const currentAuthorityPaths = artifacts
  .filter((artifact) => artifact.disposition === "CURRENT_EXECUTABLE")
  .map((artifact) => artifact.path);

const result = {
  schema: "werkles.vpg47-ender-artifact-liveness-result/v1",
  cycle_id: fixture.cycle_id,
  seat: "Ender/Doozer@Betsy",
  idea: "SHA_BOUND_ARTIFACT_LIVENESS_SUPERSESSION_DUPLICATE_REVIEW",
  snapshot_excludes_result_and_final_receipt_created_after_this_run: true,
  tracked_modified_count: tracked.length,
  untracked_count: untracked.length,
  candidate_artifact_count: artifacts.length,
  disposition_counts: dispositionCounts,
  current_authority_path_count: currentAuthorityPaths.length,
  byte_duplicate_group_count: byteDuplicateGroups.length,
  secret_hit_count: secretHits.length,
  explicit_edge_count: edges.length,
  candidate_root_sha256: candidateRoot,
  byte_duplicate_groups: byteDuplicateGroups,
  secret_hits: secretHits,
  explicit_edges: edges,
  artifacts,
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
