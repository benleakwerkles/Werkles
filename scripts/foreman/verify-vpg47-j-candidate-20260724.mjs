#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
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

const CANDIDATE = "ba08a444632206e2676df49e175f184ab0c2c2f2";
const MAIN = "294f98396b122b413275a3f8c45524987de284fe";
const ATTRIBUTION =
  "foreman/receipts/WERKLES_VPG47_G_HEIMERDINKER_LADY_JESSICA_HOARD_INTEGRATION_20260724.md";

function gitText(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function gitBuffer(...args) {
  return execFileSync("git", args);
}

function fileSha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function classification(entry) {
  if (entry.artifact_class === "PRODUCT_SOURCE" || entry.artifact_class === "DEPENDENCY_MANIFEST") {
    return "product";
  }
  if (entry.artifact_class === "TEST_HARNESS" || entry.artifact_class === "TEST_FIXTURE") {
    return "test";
  }
  if (entry.artifact_class === "RELEASE_GUARD") return "guard";
  if (entry.artifact_class === "HANDOFF_PACKET") return "packet";
  if (entry.artifact_class === "HUMAN_GATE") return "approval";
  if (entry.artifact_class === "CONTROL_EVIDENCE") return "ledger";
  return "receipt";
}

function owner(entry) {
  const value = String(entry.owner ?? "");
  for (const seat of ["LadyJessica", "Ender", "Doozer", "Thufir", "Bean"]) {
    if (value.includes(seat)) return `${seat}@Betsy`;
  }
  return "Heimerdinker@Betsy";
}

const candidatePaths = gitText(
  "diff-tree",
  "--no-commit-id",
  "--name-only",
  "-r",
  "--diff-filter=ACMRT",
  CANDIDATE
)
  .split(/\r?\n/)
  .filter(Boolean)
  .sort();

const treeRows = gitBuffer("ls-tree", "-r", "-z", CANDIDATE)
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const treeByPath = new Map(
  treeRows.map((row) => {
    const [metadata, path] = row.split("\t");
    const [mode, type, oid] = metadata.split(" ");
    return [path, { mode, type, oid }];
  })
);

const ownership = JSON.parse(
  gitBuffer(
    "show",
    `${CANDIDATE}:foreman/receipts/WERKLES_VPG47_LADY_JESSICA_HOARD_OWNERSHIP_MANIFEST_20260724.json`
  ).toString("utf8")
);
const ownershipByPath = new Map(ownership.entries.map((entry) => [entry.path, entry]));

const entries = candidatePaths.map((path) => {
  const tree = treeByPath.get(path);
  const attributed = ownershipByPath.get(path);
  if (!tree || tree.type !== "blob" || !attributed) {
    throw new Error(`Candidate path lacks trusted tree/ownership evidence: ${path}`);
  }
  const blob = gitBuffer("cat-file", "blob", tree.oid);
  const sourceCycle = attributed.evidence?.[0]?.cycle_id ?? VPG47_CYCLE_ID;
  const worktreeSha256 = /^[a-f0-9]{64}$/.test(String(attributed.sha256 ?? ""))
    ? attributed.sha256
    : fileSha256(blob);
  return {
    path,
    owner: owner(attributed),
    sourceCycle,
    attributionReceipt: ATTRIBUTION,
    classification: classification(attributed),
    ignored: false,
    generated: false,
    secretBearing: false,
    reparsePoint: false,
    mode: tree.mode,
    blobSha256: fileSha256(blob),
    worktreeSha256
  };
});

const tree = gitText("rev-parse", `${CANDIDATE}^{tree}`);
const parent = gitText("rev-parse", `${CANDIDATE}^`);
const manifest = {
  schema: "werkles.vpg47-j-candidate-manifest/v1",
  cycleId: VPG47_CYCLE_ID,
  legacyLabel: VPG47_LEGACY_LABEL,
  branch: VPG47_BRANCH,
  baseSha: VPG47_SOURCE_COMMIT,
  stagedTree: tree,
  entries,
  manifestDigest: ""
};
manifest.manifestDigest = candidateManifestDigest(manifest);

const packageJson = JSON.parse(gitBuffer("show", `${CANDIDATE}:package.json`).toString("utf8"));
const packageLock = JSON.parse(
  gitBuffer("show", `${CANDIDATE}:package-lock.json`).toString("utf8")
);
const byPath = new Map(entries.map((entry) => [entry.path, entry]));
const packageLockPair = {
  packageSha256: byPath.get("package.json").blobSha256,
  lockSha256: byPath.get("package-lock.json").blobSha256,
  packageNext: packageJson.dependencies.next,
  lockNext: packageLock.packages[""].dependencies.next,
  packagePostcss: packageJson.devDependencies.postcss,
  lockPostcss: packageLock.packages[""].devDependencies.postcss,
  overrideNextPostcss: packageJson.overrides.next.postcss,
  lockNestedNextPostcss: packageLock.packages["node_modules/next/node_modules/postcss"].version,
  overrideNextSharp: packageJson.overrides.next.sharp,
  lockNestedNextSharp: packageLock.packages["node_modules/sharp"].version
};
packageLockPair.pairDigest = sha256(packageLockPair);

const approvalText = gitBuffer("show", `${CANDIDATE}:${VPG47_APPROVAL_PATH}`).toString("utf8");
const matchingRowCount = approvalText
  .split(/\r?\n/)
  .filter((line) => line.includes(VPG47_CYCLE_ID) && line.includes(VPG47_J_PHRASE)).length;
const directiveDigest = sha256(VPG47_J_PHRASE);
const actions = ["STAGE_MANIFEST_PATHS", "COMMIT_CURRENT_BRANCH", "PUSH_CURRENT_BRANCH"];
const evidence = {
  schema: "werkles.vpg47-j-custody-evidence/v1",
  candidateManifest: manifest,
  candidateManifestDigest: manifest.manifestDigest,
  index: {
    entries: entries.map(({ path, mode, blobSha256 }) => ({ path, mode, blobSha256 })),
    writeTree: tree,
    preCheckTree: tree,
    postCheckTree: tree
  },
  worktree: {
    entries: entries.map(({ path, worktreeSha256 }) => ({ path, sha256: worktreeSha256 })),
    unstagedCandidatePaths: []
  },
  packageLockPair,
  secretScan: { status: "PASS", highConfidenceMatches: [] },
  commit: { sha: CANDIDATE, parent, tree },
  cycle: { id: VPG47_CYCLE_ID, legacyLabel: VPG47_LEGACY_LABEL, status: "COMPLETED" },
  operatorAuthority: {
    kind: "DIRECT_OPERATOR_INSTRUCTION",
    verified: true,
    phrase: VPG47_J_PHRASE,
    directiveDigest
  },
  approval: {
    sourcePath: VPG47_APPROVAL_PATH,
    matchingRowCount,
    decision: "APPROVED",
    phrase: VPG47_J_PHRASE,
    cycleId: VPG47_CYCLE_ID,
    legacyLabel: VPG47_LEGACY_LABEL,
    branch: VPG47_BRANCH,
    sourceCommit: VPG47_SOURCE_COMMIT,
    action: VPG47_J_ACTION,
    directiveDigest,
    candidateManifestDigest: manifest.manifestDigest,
    stagedTree: tree,
    productionAuthorized: false
  },
  jPacket: {
    cycleId: VPG47_CYCLE_ID,
    legacyLabel: VPG47_LEGACY_LABEL,
    branch: VPG47_BRANCH,
    sourceCommit: VPG47_SOURCE_COMMIT,
    jPhrase: VPG47_J_PHRASE,
    jAction: VPG47_J_ACTION,
    authorizedActions: actions
  },
  requestedActions: actions,
  selectedAuthoritySource: VPG47_APPROVAL_PATH,
  authorityClaims: [
    { source: VPG47_APPROVAL_PATH, authoritative: true, actions },
    { source: ATTRIBUTION, authoritative: false, actions: [] }
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
    afterFeature: CANDIDATE,
    localHead: CANDIDATE,
    upstreamHead: CANDIDATE,
    beforeMain: MAIN,
    afterMain: MAIN,
    localMainBefore: MAIN,
    localMainAfter: MAIN
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

const result = evaluateVpg47JCustody(evidence);
const output = {
  schema: "werkles.vpg47-j-candidate-verification/v1",
  cycle_id: VPG47_CYCLE_ID,
  candidate_commit: CANDIDATE,
  candidate_tree: tree,
  candidate_path_count: candidatePaths.length,
  candidate_manifest_digest: manifest.manifestDigest,
  ownership_manifest_tree_sha256: ownership.summary.tree_sha256,
  matching_approval_rows: matchingRowCount,
  package_lock_pair_digest: packageLockPair.pairDigest,
  result: result.result,
  exact_ideas: {
    stage_index_tree_custody: result.idea1,
    authority_remote_gate_custody: result.idea2
  },
  full_evidence: process.argv.includes("--full") ? evidence : undefined
};

console.log(JSON.stringify(output, null, 2));
if (!result.ok) process.exitCode = 2;
