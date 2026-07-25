#!/usr/bin/env node

import {
  VPG47_APPROVAL_PATH,
  VPG47_BRANCH,
  VPG47_CYCLE_ID,
  VPG47_J_ACTION,
  VPG47_J_PHRASE,
  VPG47_LEGACY_LABEL,
  VPG47_SOURCE_COMMIT,
  candidateManifestDigest,
  evaluateVpg47JCustody,
  sha256
} from "./vpg47-j-custody-guard-20260724.mjs";

const TREE = "1111111111111111111111111111111111111111";
const COMMIT = "2222222222222222222222222222222222222222";
const MAIN = "294f98396b122b413275a3f8c45524987de284fe";

function entry(path, sourceCycle, attributionReceipt, classification) {
  return {
    path,
    owner: "Heimerdinker@Betsy",
    sourceCycle,
    attributionReceipt,
    classification,
    ignored: false,
    generated: false,
    secretBearing: false,
    reparsePoint: false,
    mode: "100644",
    blobSha256: sha256(`index:${path}\n`),
    worktreeSha256: sha256(`worktree-crlf:${path}\r\n`)
  };
}

function sealPackagePair(pair) {
  pair.pairDigest = sha256({
    packageSha256: pair.packageSha256,
    lockSha256: pair.lockSha256,
    packageNext: pair.packageNext,
    lockNext: pair.lockNext,
    packagePostcss: pair.packagePostcss,
    lockPostcss: pair.lockPostcss,
    overrideNextPostcss: pair.overrideNextPostcss,
    lockNestedNextPostcss: pair.lockNestedNextPostcss,
    overrideNextSharp: pair.overrideNextSharp,
    lockNestedNextSharp: pair.lockNestedNextSharp
  });
}

function sealManifest(evidence) {
  evidence.candidateManifest.manifestDigest = candidateManifestDigest(evidence.candidateManifest);
  evidence.candidateManifestDigest = evidence.candidateManifest.manifestDigest;
  evidence.approval.candidateManifestDigest = evidence.candidateManifest.manifestDigest;
  evidence.approval.stagedTree = evidence.candidateManifest.stagedTree;
}

function canonicalEvidence() {
  const entries = [
    entry(
      "package.json",
      "WERKLES-FLOCK-20260724-153458-ET-BETSY-01",
      "foreman/receipts/WERKLES_FULL_FLOCK_VPG43_G_DEPENDENCY_SECURITY_20260724.md",
      "product"
    ),
    entry(
      "package-lock.json",
      "WERKLES-FLOCK-20260724-153458-ET-BETSY-01",
      "foreman/receipts/WERKLES_FULL_FLOCK_VPG43_G_DEPENDENCY_SECURITY_20260724.md",
      "product"
    ),
    entry(
      "lib/matching/personal-recommendation-disclosure.ts",
      "WERKLES-FLOCK-20260724-224709-ET-BETSY-01",
      "foreman/receipts/WERKLES_FULL_FLOCK_VPG46_G_MATCHING_EXPLANATION_HUMAN_GATE_TRUTH_20260724.md",
      "product"
    )
  ];
  const packageLockPair = {
    packageSha256: entries[0].blobSha256,
    lockSha256: entries[1].blobSha256,
    packageNext: "^15.5.21",
    lockNext: "^15.5.21",
    packagePostcss: "^8.5.18",
    lockPostcss: "^8.5.18",
    overrideNextPostcss: "8.5.18",
    lockNestedNextPostcss: "8.5.18",
    overrideNextSharp: "0.35.0",
    lockNestedNextSharp: "0.35.0"
  };
  sealPackagePair(packageLockPair);
  const evidence = {
    schema: "werkles.vpg47-j-custody-evidence/v1",
    candidateManifest: {
      schema: "werkles.vpg47-j-candidate-manifest/v1",
      cycleId: VPG47_CYCLE_ID,
      legacyLabel: VPG47_LEGACY_LABEL,
      branch: VPG47_BRANCH,
      baseSha: VPG47_SOURCE_COMMIT,
      stagedTree: TREE,
      entries,
      manifestDigest: ""
    },
    candidateManifestDigest: "",
    index: {
      entries: entries.map(({ path, mode, blobSha256 }) => ({ path, mode, blobSha256 })),
      writeTree: TREE,
      preCheckTree: TREE,
      postCheckTree: TREE
    },
    worktree: {
      entries: entries.map(({ path, worktreeSha256 }) => ({ path, sha256: worktreeSha256 })),
      unstagedCandidatePaths: []
    },
    packageLockPair,
    secretScan: {
      status: "PASS",
      highConfidenceMatches: []
    },
    commit: {
      sha: COMMIT,
      parent: VPG47_SOURCE_COMMIT,
      tree: TREE
    },
    cycle: {
      id: VPG47_CYCLE_ID,
      legacyLabel: VPG47_LEGACY_LABEL,
      status: "COMPLETED"
    },
    operatorAuthority: {
      kind: "DIRECT_OPERATOR_INSTRUCTION",
      verified: true,
      phrase: VPG47_J_PHRASE,
      directiveDigest: sha256(VPG47_J_PHRASE)
    },
    approval: {
      sourcePath: VPG47_APPROVAL_PATH,
      matchingRowCount: 1,
      decision: "APPROVED",
      phrase: VPG47_J_PHRASE,
      cycleId: VPG47_CYCLE_ID,
      legacyLabel: VPG47_LEGACY_LABEL,
      branch: VPG47_BRANCH,
      sourceCommit: VPG47_SOURCE_COMMIT,
      action: VPG47_J_ACTION,
      directiveDigest: sha256(VPG47_J_PHRASE),
      candidateManifestDigest: "",
      stagedTree: TREE,
      productionAuthorized: false
    },
    jPacket: {
      cycleId: VPG47_CYCLE_ID,
      legacyLabel: VPG47_LEGACY_LABEL,
      branch: VPG47_BRANCH,
      sourceCommit: VPG47_SOURCE_COMMIT,
      jPhrase: VPG47_J_PHRASE,
      jAction: VPG47_J_ACTION,
      authorizedActions: [
        "STAGE_MANIFEST_PATHS",
        "COMMIT_CURRENT_BRANCH",
        "PUSH_CURRENT_BRANCH"
      ]
    },
    requestedActions: [
      "STAGE_MANIFEST_PATHS",
      "COMMIT_CURRENT_BRANCH",
      "PUSH_CURRENT_BRANCH"
    ],
    selectedAuthoritySource: VPG47_APPROVAL_PATH,
    authorityClaims: [
      {
        source: VPG47_APPROVAL_PATH,
        authoritative: true,
        actions: [
          "STAGE_MANIFEST_PATHS",
          "COMMIT_CURRENT_BRANCH",
          "PUSH_CURRENT_BRANCH"
        ]
      },
      {
        source: "foreman/reviews/GATE-werkles-vpg42-public-test-cutover-20260724.md",
        authoritative: false,
        actions: []
      },
      {
        source: "foreman/receipts/WERKLES_VPG_CYCLE_EVIDENCE_LEDGER.jsonl",
        authoritative: false,
        actions: []
      }
    ],
    gateResidue: [
      { id: "VPG42_PUBLIC_TEST_CUTOVER", status: "BLOCKED_TECHNICAL_PRECONDITIONS" },
      { id: "VPG42_PROMOTION_MANIFEST", status: "BLOCKED_TECHNICAL_PRECONDITIONS" },
      { id: "VPG43_HARVEY_DECISION", status: "DECISION_REQUIRED_FAIL_CLOSED" },
      { id: "VPG43_HARVEY_LANGUAGE", status: "ACTIVE_FAIL_CLOSED_LANGUAGE_POLICY" },
      { id: "VPG44_RELEASE", status: "COMPLETED_LOCAL / RELEASE_BLOCKED" },
      { id: "VPG45_COMPOSITE_CUSTODY", status: "COMPLETED_LOCAL_RELEASE_STOP" },
      { id: "VPG46_PRODUCT", status: "COMPLETED_NO_J_NO_RELEASE" }
    ],
    remote: {
      branch: VPG47_BRANCH,
      beforeFeature: VPG47_SOURCE_COMMIT,
      afterFeature: COMMIT,
      localHead: COMMIT,
      upstreamHead: COMMIT,
      beforeMain: MAIN,
      afterMain: MAIN,
      localMainBefore: "ec4772cf4f2ca538a13ebd5dc4af964ddbe2f82b",
      localMainAfter: "ec4772cf4f2ca538a13ebd5dc4af964ddbe2f82b"
    },
    sideEffects: {
      prCreated: false,
      merged: false,
      previewChanged: false,
      deployed: false,
      productionChanged: false,
      aliasChanged: false,
      environmentChanged: false,
      providerCalled: false,
      dataMutated: false,
      capabilityOpened: false
    }
  };
  sealManifest(evidence);
  return evidence;
}

function renameEntry(evidence, index, newPath) {
  const oldPath = evidence.candidateManifest.entries[index].path;
  evidence.candidateManifest.entries[index].path = newPath;
  const indexEntry = evidence.index.entries.find((item) => item.path === oldPath);
  if (indexEntry) indexEntry.path = newPath;
  const worktreeEntry = evidence.worktree.entries.find((item) => item.path === oldPath);
  if (worktreeEntry) worktreeEntry.path = newPath;
}

const idea1Cases = [
  {
    id: "extra_staged_path",
    code: "EXTRA_STAGED_PATH",
    mutate: (e) => e.index.entries.push({
      path: "unattributed.txt",
      mode: "100644",
      blobSha256: sha256("extra")
    })
  },
  {
    id: "missing_staged_path",
    code: "MISSING_STAGED_PATH",
    mutate: (e) => e.index.entries.pop()
  },
  {
    id: "unattributed_owner",
    code: "UNATTRIBUTED_OWNER",
    reseal: true,
    mutate: (e) => { e.candidateManifest.entries[2].owner = "Unknown@Betsy"; }
  },
  {
    id: "unattributed_source_cycle",
    code: "UNATTRIBUTED_SOURCE_CYCLE",
    reseal: true,
    mutate: (e) => { e.candidateManifest.entries[2].sourceCycle = "WERKLES-FLOCK-STALE"; }
  },
  {
    id: "secret_filename",
    code: "FORBIDDEN_CANDIDATE_PATH",
    reseal: true,
    mutate: (e) => renameEntry(e, 2, ".env.production")
  },
  {
    id: "secret_scan_match",
    code: "SECRET_SCAN_NOT_CLEAN",
    mutate: (e) => {
      e.secretScan.status = "STOP";
      e.secretScan.highConfidenceMatches = ["redacted-match"];
    }
  },
  {
    id: "generated_artifact",
    code: "GENERATED_PATH_INCLUDED",
    reseal: true,
    mutate: (e) => { e.candidateManifest.entries[2].generated = true; }
  },
  {
    id: "ignored_artifact",
    code: "IGNORED_PATH_INCLUDED",
    reseal: true,
    mutate: (e) => { e.candidateManifest.entries[2].ignored = true; }
  },
  {
    id: "case_colliding_path",
    code: "CASE_COLLIDING_MANIFEST_PATH",
    reseal: true,
    mutate: (e) => {
      const duplicate = structuredClone(e.candidateManifest.entries[0]);
      duplicate.path = "PACKAGE.JSON";
      e.candidateManifest.entries.push(duplicate);
      e.index.entries.push({
        path: duplicate.path,
        mode: duplicate.mode,
        blobSha256: duplicate.blobSha256
      });
      e.worktree.entries.push({ path: duplicate.path, sha256: duplicate.worktreeSha256 });
    }
  },
  {
    id: "path_traversal",
    code: "NONCANONICAL_CANDIDATE_PATH",
    reseal: true,
    mutate: (e) => renameEntry(e, 2, "lib/matching/../secret.ts")
  },
  {
    id: "symlink_mode",
    code: "UNSAFE_FILE_MODE",
    reseal: true,
    mutate: (e) => {
      e.candidateManifest.entries[2].mode = "120000";
      e.index.entries[2].mode = "120000";
    }
  },
  {
    id: "submodule_mode",
    code: "UNSAFE_FILE_MODE",
    reseal: true,
    mutate: (e) => {
      e.candidateManifest.entries[2].mode = "160000";
      e.index.entries[2].mode = "160000";
    }
  },
  {
    id: "reparse_point",
    code: "REPARSE_PATH_INCLUDED",
    reseal: true,
    mutate: (e) => { e.candidateManifest.entries[2].reparsePoint = true; }
  },
  {
    id: "index_mode_differs",
    code: "INDEX_MODE_MISMATCH",
    mutate: (e) => { e.index.entries[2].mode = "100755"; }
  },
  {
    id: "crlf_worktree_hash_laundered_as_blob",
    code: "INDEX_BLOB_HASH_MISMATCH",
    reseal: true,
    mutate: (e) => {
      e.candidateManifest.entries[0].blobSha256 =
        e.candidateManifest.entries[0].worktreeSha256;
    }
  },
  {
    id: "index_worktree_divergence",
    code: "WORKTREE_HASH_MISMATCH",
    mutate: (e) => { e.worktree.entries[0].sha256 = sha256("post-stage-worktree-change"); }
  },
  {
    id: "unstaged_candidate_drift",
    code: "UNSTAGED_CANDIDATE_DRIFT",
    mutate: (e) => { e.worktree.unstagedCandidatePaths = ["package.json"]; }
  },
  {
    id: "index_toctou_tree_drift",
    code: "INDEX_TOCTOU_DRIFT",
    mutate: (e) => { e.index.postCheckTree = "3333333333333333333333333333333333333333"; }
  },
  {
    id: "package_without_lock",
    code: "PACKAGE_LOCK_PAIR_INCOMPLETE",
    reseal: true,
    mutate: (e) => {
      e.candidateManifest.entries = e.candidateManifest.entries.filter(
        (item) => item.path !== "package-lock.json"
      );
      e.index.entries = e.index.entries.filter((item) => item.path !== "package-lock.json");
      e.worktree.entries = e.worktree.entries.filter((item) => item.path !== "package-lock.json");
    }
  },
  {
    id: "package_lock_version_drift",
    code: "PACKAGE_LOCK_DRIFT",
    mutate: (e) => {
      e.packageLockPair.lockNext = "^15.3.2";
      sealPackagePair(e.packageLockPair);
    }
  },
  {
    id: "package_lock_pair_digest_tamper",
    code: "PACKAGE_LOCK_PAIR_DIGEST_MISMATCH",
    mutate: (e) => { e.packageLockPair.pairDigest = sha256("tampered-pair"); }
  },
  {
    id: "write_tree_mismatch",
    code: "WRITE_TREE_MISMATCH",
    mutate: (e) => { e.index.writeTree = "4444444444444444444444444444444444444444"; }
  },
  {
    id: "commit_tree_mismatch",
    code: "COMMIT_TREE_MISMATCH",
    mutate: (e) => { e.commit.tree = "5555555555555555555555555555555555555555"; }
  },
  {
    id: "manifest_self_digest_tamper",
    code: "MANIFEST_DIGEST_MISMATCH",
    mutate: (e) => { e.candidateManifest.manifestDigest = sha256("tampered-manifest"); }
  }
];

const idea2Cases = [
  {
    id: "blocked_vpg42_reserved_phrase_selected",
    code: "UNAUTHORIZED_AUTHORITY_SOURCE",
    mutate: (e) => {
      e.selectedAuthoritySource =
        "foreman/reviews/GATE-werkles-vpg42-public-test-cutover-20260724.md";
    }
  },
  {
    id: "stale_historical_approval",
    code: "APPROVAL_CYCLE_MISMATCH",
    mutate: (e) => {
      e.approval.cycleId = "WERKLES-FLOCK-20260724-110445-ET-BETSY-01";
      e.approval.legacyLabel = "VPG41";
    }
  },
  {
    id: "duplicate_approval_rows",
    code: "APPROVAL_ROW_NOT_UNIQUE",
    mutate: (e) => { e.approval.matchingRowCount = 2; }
  },
  {
    id: "forged_self_issued_operator_authority",
    code: "DIRECT_OPERATOR_AUTHORITY_REQUIRED",
    mutate: (e) => { e.operatorAuthority.kind = "SELF_ISSUED_PACKET"; }
  },
  {
    id: "receipt_claims_independent_authority",
    code: "SELF_ISSUED_AUTHORITY_CLAIM",
    mutate: (e) => {
      e.authorityClaims[2].authoritative = true;
      e.authorityClaims[2].actions = [
        "STAGE_MANIFEST_PATHS",
        "COMMIT_CURRENT_BRANCH",
        "PUSH_CURRENT_BRANCH"
      ];
    }
  },
  {
    id: "wrong_cycle",
    code: "CYCLE_IDENTITY_MISMATCH",
    mutate: (e) => { e.cycle.id = "WERKLES-FLOCK-20260724-221246-ET-BETSY-01"; }
  },
  {
    id: "wrong_legacy_label",
    code: "CYCLE_IDENTITY_MISMATCH",
    mutate: (e) => { e.cycle.legacyLabel = "VPG45"; }
  },
  {
    id: "wrong_approval_branch",
    code: "APPROVAL_BRANCH_MISMATCH",
    mutate: (e) => { e.approval.branch = "main"; }
  },
  {
    id: "wrong_approval_base",
    code: "APPROVAL_BASE_MISMATCH",
    mutate: (e) => { e.approval.sourceCommit = MAIN; }
  },
  {
    id: "wrong_approval_manifest",
    code: "APPROVAL_MANIFEST_BINDING_MISMATCH",
    mutate: (e) => { e.approval.candidateManifestDigest = sha256("stale-manifest"); }
  },
  {
    id: "wrong_approval_tree",
    code: "APPROVAL_TREE_BINDING_MISMATCH",
    mutate: (e) => { e.approval.stagedTree = "6666666666666666666666666666666666666666"; }
  },
  {
    id: "approval_phrase_substitution",
    code: "APPROVAL_PHRASE_MISMATCH",
    mutate: (e) => { e.approval.phrase = "APPROVE WERKLES PRODUCTION RELEASE"; }
  },
  {
    id: "approval_decision_substitution",
    code: "APPROVAL_DECISION_MISMATCH",
    mutate: (e) => { e.approval.decision = "RECORDED"; }
  },
  {
    id: "approval_action_widened_to_deploy",
    code: "APPROVAL_ACTION_MISMATCH",
    mutate: (e) => { e.approval.action = "GIT_PUSH_AND_PRODUCTION_DEPLOY"; }
  },
  {
    id: "packet_scope_adds_deploy",
    code: "J_PACKET_SCOPE_WIDENED",
    mutate: (e) => { e.jPacket.authorizedActions.push("PRODUCTION_DEPLOY"); }
  },
  {
    id: "packet_binding_wrong_source",
    code: "J_PACKET_BINDING_MISMATCH",
    mutate: (e) => { e.jPacket.sourceCommit = MAIN; }
  },
  {
    id: "request_scope_adds_pr",
    code: "REQUESTED_ACTION_SCOPE_WIDENED",
    mutate: (e) => { e.requestedActions.push("CREATE_PR"); }
  },
  {
    id: "request_scope_adds_main_merge",
    code: "REQUESTED_ACTION_SCOPE_WIDENED",
    mutate: (e) => { e.requestedActions.push("MERGE_MAIN"); }
  },
  {
    id: "vpg42_gate_promoted",
    code: "HUMAN_GATE_RESIDUE_CHANGED",
    mutate: (e) => { e.gateResidue[0].status = "APPROVED"; }
  },
  {
    id: "prior_stop_residue_removed",
    code: "HUMAN_GATE_RESIDUE_SET_MISMATCH",
    mutate: (e) => { e.gateResidue.pop(); }
  },
  {
    id: "feature_remote_not_equal",
    code: "FEATURE_REMOTE_EQUALITY_MISSING",
    mutate: (e) => { e.remote.afterFeature = VPG47_SOURCE_COMMIT; }
  },
  {
    id: "main_remote_changed",
    code: "MAIN_BOUNDARY_CHANGED",
    mutate: (e) => { e.remote.afterMain = COMMIT; }
  },
  {
    id: "production_authority_laundered",
    code: "PRODUCTION_AUTHORITY_LAUNDERED",
    mutate: (e) => { e.approval.productionAuthorized = true; }
  },
  {
    id: "deploy_side_effect",
    code: "FORBIDDEN_SIDE_EFFECT",
    mutate: (e) => { e.sideEffects.deployed = true; }
  },
  {
    id: "cycle_not_completed",
    code: "CYCLE_NOT_COMPLETED",
    mutate: (e) => { e.cycle.status = "P_COMPLETED"; }
  },
  {
    id: "operator_directive_digest_tamper",
    code: "DIRECT_OPERATOR_AUTHORITY_REQUIRED",
    mutate: (e) => { e.operatorAuthority.directiveDigest = sha256("forged-directive"); }
  },
  {
    id: "approval_directive_not_bound",
    code: "APPROVAL_DIRECTIVE_BINDING_MISMATCH",
    mutate: (e) => { e.approval.directiveDigest = sha256("different-directive"); }
  },
  {
    id: "packet_claims_production_authority",
    code: "AUTHORITY_CLAIM_SCOPE_WIDENED",
    mutate: (e) => {
      e.authorityClaims.push({
        source: VPG47_APPROVAL_PATH,
        authoritative: true,
        actions: [
          "STAGE_MANIFEST_PATHS",
          "COMMIT_CURRENT_BRANCH",
          "PUSH_CURRENT_BRANCH",
          "PRODUCTION_DEPLOY"
        ]
      });
    }
  }
];

function executeCases(cases, ideaKey) {
  return cases.map((attack) => {
    const evidence = canonicalEvidence();
    attack.mutate(evidence);
    if (attack.reseal) sealManifest(evidence);
    const evaluated = evaluateVpg47JCustody(evidence);
    const target = evaluated[ideaKey];
    const reasonCodes = target.reasons.map((reason) => reason.code);
    return {
      id: attack.id,
      expected_code: attack.code,
      result: target.result,
      expected_code_observed: reasonCodes.includes(attack.code),
      bypass: target.result !== "STOP" || !reasonCodes.includes(attack.code),
      reason_codes: reasonCodes
    };
  });
}

const canonical = evaluateVpg47JCustody(canonicalEvidence());
const idea1 = executeCases(idea1Cases, "idea1");
const idea2 = executeCases(idea2Cases, "idea2");
const all = [...idea1, ...idea2];
const bypasses = all.filter((entry) => entry.bypass);
const output = {
  schema: "werkles.vpg47-thufir-j-custody-adversary-results/v1",
  cycle_id: VPG47_CYCLE_ID,
  legacy_label: VPG47_LEGACY_LABEL,
  exact_ideas_executed: 2,
  canonical_control: canonical.result,
  idea_1: {
    id: "EXACT_INCLUDE_EXCLUDE_INDEX_TREE_CUSTODY",
    attack_count: idea1.length,
    rejected_count: idea1.filter((entry) => !entry.bypass).length,
    bypass_count: idea1.filter((entry) => entry.bypass).length,
    attacks: idea1
  },
  idea_2: {
    id: "J_HUMAN_GATE_AUTHORITY_LAUNDERING",
    attack_count: idea2.length,
    rejected_count: idea2.filter((entry) => !entry.bypass).length,
    bypass_count: idea2.filter((entry) => entry.bypass).length,
    attacks: idea2
  },
  total_attack_count: all.length,
  total_rejected_count: all.filter((entry) => !entry.bypass).length,
  total_bypass_count: bypasses.length,
  bypass_ids: bypasses.map((entry) => entry.id),
  result: canonical.result === "PASS" && bypasses.length === 0 ? "PASS" : "FAIL"
};

console.log(JSON.stringify(output, null, 2));
if (output.result !== "PASS") process.exitCode = 2;
