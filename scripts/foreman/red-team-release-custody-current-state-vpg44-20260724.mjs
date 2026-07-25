#!/usr/bin/env node

import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg44-release-custody-current-20260724.json";
const fixture = JSON.parse(readFileSync(path.join(repoRoot, fixturePath), "utf8"));

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trim();
}

function tracked(filePath) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", filePath], {
      cwd: repoRoot,
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function digestPaths(paths) {
  return createHash("sha256")
    .update(`${sortedUnique(paths).join("\n")}\n`)
    .digest("hex");
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "HEAD"]);
const upstreamHead = git(["rev-parse", fixture.candidate.upstream]);
const mainHead = git(["rev-parse", fixture.main.ref]);
const mergeBase = git(["merge-base", fixture.production.commit, head]);
const [productionOnly, candidateOnly] = git([
  "rev-list",
  "--left-right",
  "--count",
  `${fixture.production.commit}...${head}`
])
  .split(/\s+/)
  .map(Number);
const [mainOnly, mainCandidateOnly] = git([
  "rev-list",
  "--left-right",
  "--count",
  `${fixture.main.ref}...${head}`
])
  .split(/\s+/)
  .map(Number);

const committedManifest = JSON.parse(git(["show", `${head}:package.json`]));
const workingManifest = JSON.parse(
  readFileSync(path.join(repoRoot, fixture.dependency_patch.manifest_path), "utf8")
);
const trackedDirty = git(["diff", "--name-only"]).split(/\r?\n/).filter(Boolean);
const untracked = git(["ls-files", "--others", "--exclude-standard"])
  .split(/\r?\n/)
  .filter(Boolean);
const staged = git(["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean);

const harveyInput = JSON.parse(
  readFileSync(path.join(repoRoot, fixture.harvey.fixture_path), "utf8")
);
const missingHarveyPaths = git([
  "diff",
  "--name-only",
  "--diff-filter=D",
  `${fixture.production.commit}..${head}`,
  "--",
  ...harveyInput.protected_pathspecs
])
  .split(/\r?\n/)
  .filter(Boolean);
const decision = JSON.parse(
  readFileSync(path.join(repoRoot, fixture.harvey.decision_contract_path), "utf8")
);
const promotion = JSON.parse(
  readFileSync(path.join(repoRoot, fixture.gate.promotion_manifest_path), "utf8")
);
const gateText = readFileSync(path.join(repoRoot, fixture.gate.path), "utf8");

assert.equal(branch, fixture.candidate.branch);
assert.equal(head, fixture.candidate.head);
assert.equal(upstreamHead, fixture.candidate.upstream_head);
assert.equal(mainHead, fixture.main.head);
assert.equal(mergeBase, fixture.candidate_production_graph.merge_base);
assert.deepEqual(
  [productionOnly, candidateOnly],
  [
    fixture.candidate_production_graph.production_only_commits,
    fixture.candidate_production_graph.candidate_only_commits
  ]
);
assert.deepEqual(
  [mainOnly, mainCandidateOnly],
  [fixture.main.main_only_commits, fixture.main.candidate_only_commits]
);
assert.equal(
  committedManifest.dependencies.next,
  fixture.dependency_patch.committed_next_range
);
assert.equal(workingManifest.dependencies.next, fixture.dependency_patch.working_next_range);
assert.ok(trackedDirty.includes(fixture.dependency_patch.manifest_path));
assert.ok(trackedDirty.includes(fixture.dependency_patch.lock_path));
assert.equal(staged.length, 0);
assert.equal(missingHarveyPaths.length, fixture.harvey.protected_path_count);
assert.equal(digestPaths(missingHarveyPaths), fixture.harvey.inventory_sha256_lf);
assert.equal(harveyInput.rollback.is_coexistence, fixture.harvey.rollback_is_coexistence);
assert.equal(decision.selected_mode, null);
assert.equal(decision.execution_authorized, false);
assert.equal(promotion.promotion_eligible, fixture.gate.required_promotion_eligible);
assert.ok(gateText.includes(`STATUS: \`${fixture.gate.required_status}\``));

const uncommittedReleaseEvidence = [
  fixture.harvey.fixture_path,
  fixture.harvey.guard_path,
  fixture.harvey.decision_contract_path,
  fixture.gate.path,
  fixture.gate.promotion_manifest_path
].filter((filePath) => !tracked(filePath));

const stopReasons = [
  {
    code: "DEPENDENCY_PATCH_NOT_IN_CANDIDATE_COMMIT",
    detail: `${committedManifest.dependencies.next} at ${head}; working tree is ${workingManifest.dependencies.next}.`
  },
  {
    code: "DEPENDENCY_PATCH_NOT_IN_BOUND_PREVIEW",
    detail: `Preview ${fixture.candidate.deployment_id} is sourced from unchanged commit ${fixture.candidate.deployment_source}.`
  },
  {
    code: "RELEASE_EVIDENCE_UNTRACKED",
    detail: uncommittedReleaseEvidence
  },
  {
    code: "HARVEY_DISPOSITION_UNRESOLVED",
    detail: {
      missing_paths: missingHarveyPaths.length,
      selected_mode: decision.selected_mode,
      execution_authorized: decision.execution_authorized
    }
  },
  {
    code: "ROLLBACK_IS_RECOVERY_NOT_COEXISTENCE",
    detail: harveyInput.rollback.deployment_id
  },
  {
    code: "HUMAN_GATE_TECHNICALLY_BLOCKED",
    detail: fixture.gate.path
  }
];

const proof = {
  schema: "werkles.vpg44-release-custody-current-state-red-team/v1",
  cycle_id: fixture.cycle_id,
  exact_refs: {
    branch,
    head,
    upstream_head: upstreamHead,
    main_head: mainHead,
    production_commit: fixture.production.commit,
    merge_base: mergeBase,
    production_only_commits: productionOnly,
    candidate_only_commits: candidateOnly
  },
  custody: {
    tracked_dirty_paths: trackedDirty,
    staged_paths: staged,
    untracked_path_count: untracked.length,
    uncommitted_release_evidence: uncommittedReleaseEvidence,
    committed_next_range: committedManifest.dependencies.next,
    working_next_range: workingManifest.dependencies.next,
    bound_preview_source: fixture.candidate.deployment_source
  },
  harvey: {
    missing_path_count: missingHarveyPaths.length,
    inventory_sha256_lf: digestPaths(missingHarveyPaths),
    selected_mode: decision.selected_mode,
    execution_authorized: decision.execution_authorized,
    rollback_is_coexistence: harveyInput.rollback.is_coexistence
  },
  gate: {
    status: fixture.gate.required_status,
    promotion_eligible: promotion.promotion_eligible
  },
  classification: {
    result: "PROOF_GAP_STOP",
    vulnerability:
      "None in the present state because the current gate remains blocked. It becomes the authorization vulnerability proven by the composition adversary if separate PASS receipts are treated as release authority.",
    proof_gap:
      "The patched dependency and Harvey custody evidence are not committed, J-bound, or present in a newly bound Preview."
  },
  stop_reasons: stopReasons,
  verdict: fixture.expected_verdict
};

console.log(JSON.stringify(proof, null, 2));
