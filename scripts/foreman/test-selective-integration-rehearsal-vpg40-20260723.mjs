#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTRACT_PATH,
  REQUIRED_FORBIDDEN_ACTIONS,
  REQUIRED_QC_IDS,
  candidateDigest,
  evaluateRehearsalObservation,
  evaluateStaticObservation,
  validateContract
} from "./selective-integration-rehearsal-vpg40-20260723.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(readFileSync(path.join(root, CONTRACT_PATH), "utf8"));
const manifest = JSON.parse(
  readFileSync(path.join(root, contract.candidate_manifest), "utf8")
);

function hashes() {
  return Object.fromEntries(
    manifest.owned_paths.map((entry) => [entry.path, entry.sha256])
  );
}

function staticObservation() {
  return {
    machine: "BETSY",
    branch: contract.execution_branch,
    head: contract.source_commit,
    remoteSourceHead: contract.source_commit,
    originMainSha: contract.origin_main_sha,
    productParent: contract.product_parent,
    productTree: contract.product_tree,
    productPaths: manifest.owned_paths.map((entry) => entry.path),
    productBlobHashes: hashes(),
    candidateDigest: candidateDigest(manifest.owned_paths),
    stagedPathCount: 0,
    worktreeSnapshotUnchanged: true,
    persistentRefsUnchanged: true
  };
}

function rehearsalObservation() {
  return {
    applyExitCode: 0,
    conflicts: [],
    tempHead: contract.origin_main_sha,
    stagedPaths: manifest.owned_paths.map((entry) => entry.path),
    unstagedPaths: [],
    indexBlobHashes: hashes(),
    resultTree: contract.product_tree,
    qcPassed: contract.qc_commands
      .filter((entry) => entry.execution === "run_in_disposable_worktree")
      .map((entry) => entry.id),
    runtimeAttestationPass: true,
    reactAttestationPass: true,
    worktreeSnapshotUnchanged: true,
    persistentRefsUnchanged: true,
    worktreeRegistryUnchanged: true
  };
}

function hasReason(result, code) {
  return result.reasons.some((reason) => reason.code === code);
}

const checks = [];

const contractResult = validateContract(contract, manifest);
assert.equal(contractResult.pass, true);
assert.deepEqual(
  [...contract.qc_commands.map((entry) => entry.id)].sort(),
  [...REQUIRED_QC_IDS].sort()
);
assert.deepEqual(
  [...contract.forbidden_actions].sort(),
  [...REQUIRED_FORBIDDEN_ACTIONS].sort()
);
checks.push("exact_contract_contains_full_qc_and_forbidden_action_sets");

assert.equal(evaluateStaticObservation(contract, manifest, staticObservation()).pass, true);
checks.push("exact_static_ref_manifest_and_blob_observation_passes");

const wrongMain = staticObservation();
wrongMain.originMainSha = "0".repeat(40);
assert.equal(
  hasReason(evaluateStaticObservation(contract, manifest, wrongMain), "ORIGIN_MAIN_REF"),
  true
);
checks.push("origin_main_movement_fails_closed");

const extraPath = staticObservation();
extraPath.productPaths = [...extraPath.productPaths, "unowned.txt"];
assert.equal(
  hasReason(evaluateStaticObservation(contract, manifest, extraPath), "PRODUCT_PATH_SET"),
  true
);
checks.push("extra_product_path_fails_closed");

const wrongBlob = staticObservation();
wrongBlob.productBlobHashes[manifest.owned_paths[0].path] = "f".repeat(64);
assert.equal(
  hasReason(evaluateStaticObservation(contract, manifest, wrongBlob), "PRODUCT_BLOB_HASH"),
  true
);
checks.push("product_blob_mismatch_fails_closed");

const missingQc = structuredClone(contract);
missingQc.qc_commands.pop();
assert.equal(
  hasReason(validateContract(missingQc, manifest), "QC_COMMAND_CONTRACT"),
  true
);
checks.push("missing_qc_command_fails_closed");

const missingForbidden = structuredClone(contract);
missingForbidden.forbidden_actions.pop();
assert.equal(
  hasReason(validateContract(missingForbidden, manifest), "FORBIDDEN_ACTION_CONTRACT"),
  true
);
checks.push("missing_forbidden_action_fails_closed");

assert.equal(
  evaluateRehearsalObservation(contract, manifest, rehearsalObservation()).pass,
  true
);
checks.push("exact_disposable_rehearsal_observation_passes");

const conflict = rehearsalObservation();
conflict.applyExitCode = 1;
conflict.conflicts = [manifest.owned_paths[0].path];
assert.equal(
  hasReason(evaluateRehearsalObservation(contract, manifest, conflict), "APPLY_CONFLICT"),
  true
);
checks.push("cherry_pick_conflict_fails_closed");

const wrongResultTree = rehearsalObservation();
wrongResultTree.resultTree = "1".repeat(40);
assert.equal(
  hasReason(evaluateRehearsalObservation(contract, manifest, wrongResultTree), "RESULT_TREE"),
  true
);
checks.push("result_tree_mismatch_fails_closed");

const currentTreeChanged = rehearsalObservation();
currentTreeChanged.worktreeSnapshotUnchanged = false;
currentTreeChanged.persistentRefsUnchanged = false;
currentTreeChanged.worktreeRegistryUnchanged = false;
const cleanupResult = evaluateRehearsalObservation(
  contract,
  manifest,
  currentTreeChanged
);
assert.equal(hasReason(cleanupResult, "CURRENT_WORKTREE_MUTATED"), true);
assert.equal(hasReason(cleanupResult, "PERSISTENT_REFS_MUTATED"), true);
assert.equal(hasReason(cleanupResult, "WORKTREE_REGISTRY_NOT_CLEANED"), true);
checks.push("current_worktree_ref_or_registry_mutation_fails_closed");

console.log(JSON.stringify({ pass: true, checks }, null, 2));
