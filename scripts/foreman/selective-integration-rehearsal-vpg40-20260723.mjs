#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CONTRACT_PATH =
  "scripts/foreman/fixtures/vpg40-selective-integration-contract-20260723.json";
export const CANDIDATE_MANIFEST_PATH =
  "foreman/receipts/WERKLES_VPG39_J_CANDIDATE_MANIFEST_20260723.json";
export const EXPECTED_PRODUCT_COMMIT =
  "a07374db431a6086da534ca723a27288f09eaf8c";

export const REQUIRED_QC_IDS = [
  "vpg8_surface",
  "vpg10_ui_cleanup",
  "vpg11_mobile_semantics",
  "vpg13_decision_path",
  "vpg14_loader_retirement",
  "vpg19_private_return",
  "vpg20_member_continuity",
  "vpg26_activation",
  "vpg26_trust_navigation",
  "vpg28_first_visit",
  "vpg31_decision_moment",
  "vpg31_public_trust",
  "vpg32_choice_to_action",
  "vpg33_clarity_recovery",
  "vpg34_compare_continuation",
  "vpg35_warmth_interaction",
  "vpg36_first_screen",
  "vpg37_action_closure",
  "vpg38_next_step",
  "tier_a_personal_delivery",
  "candidate_lint",
  "typecheck",
  "production_build",
  "release_integrity_smoke",
  "cycle_identity_smoke",
  "local_runtime_boundaries",
  "react_review"
];

export const REQUIRED_FORBIDDEN_ACTIONS = [
  "commit",
  "pull_request",
  "merge",
  "push",
  "preview_deployment",
  "production_deployment",
  "production_promotion",
  "alias_change",
  "environment_change"
];

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function candidateDigest(entries) {
  const normalized = [...entries]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => `${entry.path}\0${entry.sha256}`)
    .join("\n");
  return sha256(normalized);
}

function sameSet(left, right) {
  return (
    JSON.stringify([...left].sort()) ===
    JSON.stringify([...right].sort())
  );
}

function addReason(reasons, code, detail) {
  reasons.push({ code, detail });
}

export function validateContract(contract, manifest) {
  const reasons = [];
  if (contract.schema !== "werkles.selective-integration-rehearsal/v1") {
    addReason(reasons, "CONTRACT_SCHEMA", contract.schema);
  }
  if (manifest.schema !== "werkles.j-candidate-manifest/v1") {
    addReason(reasons, "MANIFEST_SCHEMA", manifest.schema);
  }
  if (contract.candidate_manifest !== CANDIDATE_MANIFEST_PATH) {
    addReason(reasons, "MANIFEST_PATH", contract.candidate_manifest);
  }
  if (contract.product_commit !== EXPECTED_PRODUCT_COMMIT) {
    addReason(reasons, "PRODUCT_COMMIT", contract.product_commit);
  }
  if (contract.product_parent !== manifest.base_sha) {
    addReason(reasons, "PRODUCT_PARENT", contract.product_parent);
  }
  if (contract.product_tree !== manifest.staged_tree) {
    addReason(reasons, "PRODUCT_TREE", contract.product_tree);
  }
  if (contract.expected_product_path_count !== manifest.owned_paths?.length) {
    addReason(
      reasons,
      "PRODUCT_PATH_COUNT",
      `${contract.expected_product_path_count}:${manifest.owned_paths?.length ?? "missing"}`
    );
  }
  if (contract.apply?.command !== "git" ||
      JSON.stringify(contract.apply?.args) !==
        JSON.stringify(["cherry-pick", "--no-commit", contract.product_commit])) {
    addReason(reasons, "APPLY_CONTRACT", contract.apply);
  }
  if (contract.apply?.temporary_head_must_remain !== contract.origin_main_sha ||
      contract.apply?.conflicts_allowed !== false ||
      contract.apply?.unstaged_changes_allowed !== false) {
    addReason(reasons, "APPLY_BOUNDARY", contract.apply);
  }

  const qcIds = (contract.qc_commands ?? []).map((entry) => entry.id);
  if (!sameSet(qcIds, REQUIRED_QC_IDS) || new Set(qcIds).size !== qcIds.length) {
    addReason(reasons, "QC_COMMAND_CONTRACT", qcIds);
  }
  for (const entry of contract.qc_commands ?? []) {
    if (!entry.command || !Array.isArray(entry.args) || !entry.execution) {
      addReason(reasons, "QC_COMMAND_SHAPE", entry.id);
    }
  }
  if (!sameSet(contract.forbidden_actions ?? [], REQUIRED_FORBIDDEN_ACTIONS)) {
    addReason(reasons, "FORBIDDEN_ACTION_CONTRACT", contract.forbidden_actions);
  }
  return { pass: reasons.length === 0, reasons };
}

export function evaluateStaticObservation(contract, manifest, observed) {
  const reasons = [...validateContract(contract, manifest).reasons];
  const expectedPaths = manifest.owned_paths.map((entry) => entry.path);
  const expectedHashes = Object.fromEntries(
    manifest.owned_paths.map((entry) => [entry.path, entry.sha256])
  );

  if (observed.machine !== "BETSY") addReason(reasons, "MACHINE", observed.machine);
  if (observed.branch !== contract.execution_branch) {
    addReason(reasons, "EXECUTION_BRANCH", observed.branch);
  }
  if (observed.head !== contract.source_commit) addReason(reasons, "SOURCE_HEAD", observed.head);
  if (observed.remoteSourceHead !== contract.source_commit) {
    addReason(reasons, "REMOTE_SOURCE_HEAD", observed.remoteSourceHead);
  }
  if (observed.originMainSha !== contract.origin_main_sha) {
    addReason(reasons, "ORIGIN_MAIN_REF", observed.originMainSha);
  }
  if (observed.productParent !== contract.product_parent) {
    addReason(reasons, "PRODUCT_PARENT_OBJECT", observed.productParent);
  }
  if (observed.productTree !== contract.product_tree) {
    addReason(reasons, "PRODUCT_TREE_OBJECT", observed.productTree);
  }
  if (!sameSet(observed.productPaths ?? [], expectedPaths)) {
    addReason(reasons, "PRODUCT_PATH_SET", observed.productPaths);
  }
  for (const [candidatePath, expectedHash] of Object.entries(expectedHashes)) {
    if (observed.productBlobHashes?.[candidatePath] !== expectedHash) {
      addReason(reasons, "PRODUCT_BLOB_HASH", candidatePath);
    }
  }
  if (observed.candidateDigest !== manifest.candidate_digest ||
      candidateDigest(manifest.owned_paths) !== manifest.candidate_digest) {
    addReason(reasons, "CANDIDATE_DIGEST", observed.candidateDigest);
  }
  if (observed.stagedPathCount !== 0) {
    addReason(reasons, "CURRENT_INDEX_NOT_EMPTY", observed.stagedPathCount);
  }
  if (observed.worktreeSnapshotUnchanged !== true) {
    addReason(reasons, "CURRENT_WORKTREE_MUTATED", observed.worktreeSnapshotUnchanged);
  }
  if (observed.persistentRefsUnchanged !== true) {
    addReason(reasons, "PERSISTENT_REFS_MUTATED", observed.persistentRefsUnchanged);
  }
  return { pass: reasons.length === 0, reasons };
}

export function evaluateRehearsalObservation(contract, manifest, observed) {
  const reasons = [];
  const expectedPaths = manifest.owned_paths.map((entry) => entry.path);
  const expectedHashes = Object.fromEntries(
    manifest.owned_paths.map((entry) => [entry.path, entry.sha256])
  );

  const applyFailed =
    observed.applyExitCode !== 0 || (observed.conflicts ?? []).length > 0;
  if (applyFailed) {
    addReason(reasons, "APPLY_CONFLICT", {
      exitCode: observed.applyExitCode,
      conflicts: observed.conflicts
    });
  }
  if (observed.tempHead !== contract.origin_main_sha) {
    addReason(reasons, "TEMP_HEAD_CHANGED", observed.tempHead);
  }
  if (!applyFailed) {
    if (!sameSet(observed.stagedPaths ?? [], expectedPaths)) {
      addReason(reasons, "RESULT_PATH_SET", observed.stagedPaths);
    }
    if ((observed.unstagedPaths ?? []).length > 0) {
      addReason(reasons, "RESULT_UNSTAGED_PATHS", observed.unstagedPaths);
    }
    for (const [candidatePath, expectedHash] of Object.entries(expectedHashes)) {
      if (observed.indexBlobHashes?.[candidatePath] !== expectedHash) {
        addReason(reasons, "RESULT_BLOB_HASH", candidatePath);
      }
    }
    if (observed.resultTree !== contract.product_tree) {
      addReason(reasons, "RESULT_TREE", observed.resultTree);
    }
    const expectedRunnableQc = contract.qc_commands
      .filter((entry) => entry.execution === "run_in_disposable_worktree")
      .map((entry) => entry.id);
    if (!sameSet(observed.qcPassed ?? [], expectedRunnableQc)) {
      addReason(reasons, "QC_RUN_CONTRACT", observed.qcPassed);
    }
  }
  if (observed.runtimeAttestationPass !== true) {
    addReason(reasons, "RUNTIME_ATTESTATION", observed.runtimeAttestationPass);
  }
  if (observed.reactAttestationPass !== true) {
    addReason(reasons, "REACT_ATTESTATION", observed.reactAttestationPass);
  }
  if (observed.worktreeSnapshotUnchanged !== true) {
    addReason(reasons, "CURRENT_WORKTREE_MUTATED", observed.worktreeSnapshotUnchanged);
  }
  if (observed.persistentRefsUnchanged !== true) {
    addReason(reasons, "PERSISTENT_REFS_MUTATED", observed.persistentRefsUnchanged);
  }
  if (observed.worktreeRegistryUnchanged !== true) {
    addReason(reasons, "WORKTREE_REGISTRY_NOT_CLEANED", observed.worktreeRegistryUnchanged);
  }
  return { pass: reasons.length === 0, reasons };
}

function git(root, args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: root, encoding });
}

function gitLines(root, args) {
  return git(root, args)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function remoteSha(root, remote, ref) {
  const fields = git(root, ["ls-remote", remote, ref]).trim().split(/\s+/);
  return fields[0] || null;
}

function snapshot(root) {
  return {
    branch: git(root, ["branch", "--show-current"]).trim(),
    head: git(root, ["rev-parse", "HEAD"]).trim(),
    status: git(root, ["status", "--porcelain=v1", "-z"]),
    refs: git(root, ["show-ref"]),
    worktrees: git(root, ["worktree", "list", "--porcelain"])
  };
}

function snapshotEqual(left, right, keys) {
  return keys.every((key) => left[key] === right[key]);
}

function observeStatic(root, contract, manifest, before) {
  const productBlobHashes = {};
  for (const entry of manifest.owned_paths) {
    productBlobHashes[entry.path] = sha256(
      git(root, ["show", `${contract.product_commit}:${entry.path}`], null)
    );
  }
  const after = snapshot(root);
  return {
    machine: process.env.COMPUTERNAME ?? os.hostname().toUpperCase(),
    branch: before.branch,
    head: before.head,
    remoteSourceHead: remoteSha(root, "origin", contract.source_remote_ref),
    originMainSha: remoteSha(root, "origin", contract.origin_main_ref),
    productParent: git(root, ["rev-parse", `${contract.product_commit}^`]).trim(),
    productTree: git(root, ["rev-parse", `${contract.product_commit}^{tree}`]).trim(),
    productPaths: gitLines(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      contract.product_commit
    ]),
    productBlobHashes,
    candidateDigest: candidateDigest(manifest.owned_paths),
    stagedPathCount: gitLines(root, ["diff", "--cached", "--name-only"]).length,
    worktreeSnapshotUnchanged: snapshotEqual(before, after, ["branch", "head", "status"]),
    persistentRefsUnchanged: snapshotEqual(before, after, ["refs"])
  };
}

function runtimeAttestationPass(contract, manifest) {
  const expected = contract.qc_commands.find(
    (entry) => entry.id === "local_runtime_boundaries"
  )?.expected;
  return (
    expected &&
    manifest.qc?.runtime &&
    Object.entries(expected).every(([key, value]) => manifest.qc.runtime[key] === value)
  );
}

function reactAttestationPass(manifest) {
  return manifest.qc?.react_review === "PASS";
}

function safeRemoveTemp(tempRoot, permittedParent) {
  const expectedParent = path.resolve(permittedParent);
  const resolved = path.resolve(tempRoot);
  if (
    path.dirname(resolved).toLowerCase() !== expectedParent.toLowerCase() ||
    !path.basename(resolved).startsWith("w40r-")
  ) {
    throw new Error(`Refusing to remove non-temporary path: ${resolved}`);
  }
  rmSync(resolved, { recursive: true, force: true });
}

function worktreeRegistered(root, worktree) {
  const target = path.resolve(worktree).toLowerCase();
  return git(root, ["worktree", "list", "--porcelain"])
    .split(/\r?\n/)
    .filter((entry) => entry.startsWith("worktree "))
    .map((entry) => path.resolve(entry.slice("worktree ".length)).toLowerCase())
    .includes(target);
}

function runQcContract(worktree, root, contract) {
  const nodeModulesSource = path.join(root, "node_modules");
  const nodeModulesTarget = path.join(worktree, "node_modules");
  if (!existsSync(nodeModulesSource)) {
    return { passed: [], failure: "root node_modules is missing" };
  }
  if (!existsSync(nodeModulesTarget)) {
    symlinkSync(nodeModulesSource, nodeModulesTarget, "junction");
  }

  const passed = [];
  for (const entry of contract.qc_commands) {
    if (entry.execution !== "run_in_disposable_worktree") continue;
    const result = spawnSync(entry.command, entry.args, {
      cwd: worktree,
      encoding: "utf8",
      windowsHide: true
    });
    if (result.status !== 0) {
      return {
        passed,
        failure: entry.id,
        exitCode: result.status,
        stderr: (result.stderr ?? "").trim().slice(0, 2000)
      };
    }
    passed.push(entry.id);
  }
  return { passed, failure: null };
}

function executeRehearsal(root, contract, manifest, before) {
  const tempParent = path.parse(path.resolve(root)).root;
  const tempRoot = mkdtempSync(path.join(tempParent, "w40r-"));
  const worktree = path.join(tempRoot, "checkout");
  let added = false;
  let observation;
  let qcFailure = null;
  let applyDetail = "";
  try {
    git(root, ["worktree", "add", "--detach", worktree, contract.origin_main_sha]);
    added = true;
    const apply = spawnSync(contract.apply.command, contract.apply.args, {
      cwd: worktree,
      encoding: "utf8",
      windowsHide: true
    });
    applyDetail = `${apply.stdout ?? ""}\n${apply.stderr ?? ""}`.trim().slice(0, 4000);
    const conflicts = gitLines(worktree, ["diff", "--name-only", "--diff-filter=U"]);
    const stagedPaths = gitLines(worktree, ["diff", "--cached", "--name-only"]);
    const unstagedPaths = gitLines(worktree, ["diff", "--name-only"]);
    const indexBlobHashes = {};
    if (apply.status === 0 && conflicts.length === 0) {
      for (const entry of manifest.owned_paths) {
        indexBlobHashes[entry.path] = sha256(
          git(worktree, ["show", `:${entry.path}`], null)
        );
      }
    }
    let resultTree = null;
    if (apply.status === 0 && conflicts.length === 0) {
      resultTree = git(worktree, ["write-tree"]).trim();
    }

    let qcPassed = [];
    const structural = evaluateRehearsalObservation(contract, manifest, {
      applyExitCode: apply.status,
      conflicts,
      tempHead: git(worktree, ["rev-parse", "HEAD"]).trim(),
      stagedPaths,
      unstagedPaths,
      indexBlobHashes,
      resultTree,
      qcPassed: contract.qc_commands
        .filter((entry) => entry.execution === "run_in_disposable_worktree")
        .map((entry) => entry.id),
      runtimeAttestationPass: runtimeAttestationPass(contract, manifest),
      reactAttestationPass: reactAttestationPass(manifest),
      worktreeSnapshotUnchanged: true,
      persistentRefsUnchanged: true,
      worktreeRegistryUnchanged: true
    });
    const structuralReasons = structural.reasons.filter(
      (reason) => reason.code !== "QC_RUN_CONTRACT"
    );
    if (structuralReasons.length === 0) {
      const qc = runQcContract(worktree, root, contract);
      qcPassed = qc.passed;
      qcFailure = qc.failure;
    }
    observation = {
      applyExitCode: apply.status,
      conflicts,
      tempHead: git(worktree, ["rev-parse", "HEAD"]).trim(),
      stagedPaths,
      unstagedPaths,
      indexBlobHashes,
      resultTree,
      qcPassed,
      runtimeAttestationPass: runtimeAttestationPass(contract, manifest),
      reactAttestationPass: reactAttestationPass(manifest)
    };
  } finally {
    if (added || worktreeRegistered(root, worktree)) {
      const removal = spawnSync(
        "git",
        ["worktree", "remove", "--force", worktree],
        { cwd: root, encoding: "utf8", windowsHide: true }
      );
      if (removal.status !== 0) {
        throw new Error(`Disposable worktree cleanup failed: ${removal.stderr}`);
      }
    }
    safeRemoveTemp(tempRoot, tempParent);
  }

  const after = snapshot(root);
  observation.worktreeSnapshotUnchanged = snapshotEqual(
    before,
    after,
    ["branch", "head", "status"]
  );
  observation.persistentRefsUnchanged = snapshotEqual(before, after, ["refs"]);
  observation.worktreeRegistryUnchanged = snapshotEqual(before, after, ["worktrees"]);
  const evaluation = evaluateRehearsalObservation(contract, manifest, observation);
  if (qcFailure) addReason(evaluation.reasons, "QC_COMMAND_FAILED", qcFailure);
  evaluation.pass = evaluation.reasons.length === 0;
  return { evaluation, observation, applyDetail };
}

function parseArgs(argv) {
  const execute = argv.includes("--execute-rehearsal");
  const unknown = argv.filter(
    (entry) => !["--dry-run", "--execute-rehearsal"].includes(entry)
  );
  if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(", ")}`);
  if (argv.includes("--dry-run") && execute) {
    throw new Error("--dry-run and --execute-rehearsal are mutually exclusive");
  }
  return { execute };
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const contract = JSON.parse(readFileSync(path.join(root, CONTRACT_PATH), "utf8"));
  const manifest = JSON.parse(
    readFileSync(path.join(root, contract.candidate_manifest), "utf8")
  );
  const { execute } = parseArgs(process.argv.slice(2));
  const before = snapshot(root);
  const staticObserved = observeStatic(root, contract, manifest, before);
  const staticEvaluation = evaluateStaticObservation(
    contract,
    manifest,
    staticObserved
  );

  const result = {
    schema: "werkles.selective-integration-rehearsal-result/v1",
    mode: execute ? "DISPOSABLE_REHEARSAL" : "DRY_PROOF",
    pass: staticEvaluation.pass,
    source_commit: contract.source_commit,
    origin_main_sha: contract.origin_main_sha,
    product_commit: contract.product_commit,
    expected_product_paths: manifest.owned_paths.length,
    static_checks: staticEvaluation,
    rehearsal: null,
    current_worktree_changed: false,
    persistent_refs_changed: false,
    authorized_actions: [],
    forbidden_actions: contract.forbidden_actions,
    conclusion: execute
      ? "No integration authority. A rehearsal result is evidence only."
      : "Dry proof only. No disposable worktree was created and no product commit was applied."
  };

  if (execute && staticEvaluation.pass) {
    try {
      const rehearsal = executeRehearsal(root, contract, manifest, before);
      result.rehearsal = rehearsal;
      result.pass = rehearsal.evaluation.pass;
      result.current_worktree_changed =
        rehearsal.observation.worktreeSnapshotUnchanged !== true;
      result.persistent_refs_changed =
        rehearsal.observation.persistentRefsUnchanged !== true;
    } catch (error) {
      const after = snapshot(root);
      result.pass = false;
      result.rehearsal = {
        evaluation: {
          pass: false,
          reasons: [
            {
              code: "REHEARSAL_SETUP_OR_CLEANUP_FAILED",
              detail: error instanceof Error ? error.message : String(error)
            }
          ]
        }
      };
      result.current_worktree_changed = !snapshotEqual(
        before,
        after,
        ["branch", "head", "status"]
      );
      result.persistent_refs_changed = !snapshotEqual(before, after, ["refs"]);
    }
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exitCode = 1;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) main();
