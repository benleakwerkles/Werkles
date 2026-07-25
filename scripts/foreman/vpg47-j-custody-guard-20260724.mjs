#!/usr/bin/env node

import { createHash } from "node:crypto";

export const VPG47_CYCLE_ID = "WERKLES-FLOCK-20260724-234703-ET-BETSY-01";
export const VPG47_LEGACY_LABEL = "VPG47";
export const VPG47_BRANCH = "codex/werkles-vpg31-20260721";
export const VPG47_SOURCE_COMMIT = "67c38ace103ba5f1ba473b984c91e243d9120630";
export const VPG47_J_PHRASE =
  "V, P, G, J whatever LJ has horded over in her folder. Probably some human gates.";
export const VPG47_J_ACTION = "GIT_STAGE_COMMIT_PUSH_CURRENT_BRANCH_ONLY";
export const VPG47_APPROVAL_PATH = "foreman/gates/APPROVAL_LOG.md";

const EVIDENCE_SCHEMA = "werkles.vpg47-j-custody-evidence/v1";
const MANIFEST_SCHEMA = "werkles.vpg47-j-candidate-manifest/v1";
const ALLOWED_MODES = new Set(["100644", "100755"]);
const ALLOWED_OWNERS = new Set([
  "Heimerdinker@Betsy",
  "LadyJessica@Betsy",
  "Ender@Betsy",
  "Doozer@Betsy",
  "Thufir@Betsy",
  "Bean@Betsy"
]);
const ALLOWED_CLASSIFICATIONS = new Set([
  "product",
  "test",
  "guard",
  "packet",
  "receipt",
  "ledger",
  "approval"
]);
const ALLOWED_SOURCE_CYCLES = new Set([
  "WERKLES-FLOCK-20260724-145708-ET-BETSY-01",
  "WERKLES-FLOCK-20260724-153458-ET-BETSY-01",
  "WERKLES-FLOCK-20260724-185700-ET-BETSY-01",
  "WERKLES-FLOCK-20260724-221246-ET-BETSY-01",
  "WERKLES-FLOCK-20260724-224709-ET-BETSY-01",
  VPG47_CYCLE_ID
]);
const ALLOWED_J_ACTIONS = [
  "STAGE_MANIFEST_PATHS",
  "COMMIT_CURRENT_BRANCH",
  "PUSH_CURRENT_BRANCH"
];
const REQUIRED_GATE_RESIDUE = new Map([
  ["VPG42_PUBLIC_TEST_CUTOVER", "BLOCKED_TECHNICAL_PRECONDITIONS"],
  ["VPG42_PROMOTION_MANIFEST", "BLOCKED_TECHNICAL_PRECONDITIONS"],
  ["VPG43_HARVEY_DECISION", "DECISION_REQUIRED_FAIL_CLOSED"],
  ["VPG43_HARVEY_LANGUAGE", "ACTIVE_FAIL_CLOSED_LANGUAGE_POLICY"],
  ["VPG44_RELEASE", "COMPLETED_LOCAL / RELEASE_BLOCKED"],
  ["VPG45_COMPOSITE_CUSTODY", "COMPLETED_LOCAL_RELEASE_STOP"],
  ["VPG46_PRODUCT", "COMPLETED_NO_J_NO_RELEASE"]
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

export function candidateManifestDigest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return "";
  const { manifestDigest: _manifestDigest, ...body } = manifest;
  return sha256(body);
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(String(value ?? ""));
}

function isGitObjectId(value) {
  return /^[a-f0-9]{40}$/.test(String(value ?? ""));
}

function exactStringSet(value, expected) {
  if (!Array.isArray(value)) return false;
  const actual = [...new Set(value.map((entry) => String(entry)))].sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((entry, index) => entry === wanted[index]);
}

function canonicalCandidatePath(value) {
  if (typeof value !== "string" || !value) return false;
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("//") || value.endsWith("/")) return false;
  const parts = value.split("/");
  return parts.every((part) => part && part !== "." && part !== "..");
}

function forbiddenCandidatePath(value) {
  const path = String(value ?? "");
  return [
    /(^|\/)\.env(?:\.|\/|$)/i,
    /(^|\/)(?:node_modules|\.next|dist|qa-screens|sandbox|\.cursor|\.vercel)(?:\/|$)/i,
    /(^|\/)(?:server|debug|error)\.(?:log|tmp)(?:$)/i,
    /(^|\/).*\.local_token$/i,
    /(?:^|\/)(?:secret|credentials?|password|private[-_]?key)(?:[._/-]|$)/i,
    /\.(?:pem|key|pfx|p12|keystore|sqlite|db|zip|tar|gz)$/i
  ].some((pattern) => pattern.test(path));
}

function indexMap(entries, reasons) {
  if (!Array.isArray(entries)) {
    addReason(reasons, "INDEX_ENTRIES_REQUIRED");
    return new Map();
  }
  const map = new Map();
  const folded = new Set();
  for (const entry of entries) {
    const path = String(entry?.path ?? "");
    if (map.has(path)) addReason(reasons, "DUPLICATE_INDEX_PATH", path);
    const lower = path.toLowerCase();
    if (folded.has(lower) && !map.has(path)) addReason(reasons, "CASE_COLLIDING_INDEX_PATH", path);
    map.set(path, entry ?? {});
    folded.add(lower);
  }
  return map;
}

function evaluateIndexCustody(input, reasons) {
  const manifest = input?.candidateManifest ?? {};
  if (manifest.schema !== MANIFEST_SCHEMA) addReason(reasons, "INVALID_MANIFEST_SCHEMA");
  if (manifest.cycleId !== VPG47_CYCLE_ID) addReason(reasons, "MANIFEST_CYCLE_MISMATCH");
  if (manifest.legacyLabel !== VPG47_LEGACY_LABEL) addReason(reasons, "MANIFEST_LABEL_MISMATCH");
  if (manifest.branch !== VPG47_BRANCH) addReason(reasons, "MANIFEST_BRANCH_MISMATCH");
  if (manifest.baseSha !== VPG47_SOURCE_COMMIT) addReason(reasons, "MANIFEST_BASE_MISMATCH");

  const observedManifestDigest = candidateManifestDigest(manifest);
  if (!isSha256(manifest.manifestDigest) || manifest.manifestDigest !== observedManifestDigest) {
    addReason(reasons, "MANIFEST_DIGEST_MISMATCH");
  }
  if (input?.candidateManifestDigest !== observedManifestDigest) {
    addReason(reasons, "EVIDENCE_MANIFEST_DIGEST_MISMATCH");
  }

  const manifestEntries = Array.isArray(manifest.entries) ? manifest.entries : [];
  if (!manifestEntries.length) addReason(reasons, "MANIFEST_ENTRIES_REQUIRED");
  const manifestMap = new Map();
  const folded = new Set();
  for (const entry of manifestEntries) {
    const path = String(entry?.path ?? "");
    if (manifestMap.has(path)) addReason(reasons, "DUPLICATE_MANIFEST_PATH", path);
    const lower = path.toLowerCase();
    if (folded.has(lower) && !manifestMap.has(path)) addReason(reasons, "CASE_COLLIDING_MANIFEST_PATH", path);
    folded.add(lower);
    manifestMap.set(path, entry ?? {});

    if (!canonicalCandidatePath(path)) addReason(reasons, "NONCANONICAL_CANDIDATE_PATH", path);
    if (forbiddenCandidatePath(path)) addReason(reasons, "FORBIDDEN_CANDIDATE_PATH", path);
    if (!ALLOWED_OWNERS.has(entry?.owner)) addReason(reasons, "UNATTRIBUTED_OWNER", path);
    if (!ALLOWED_SOURCE_CYCLES.has(entry?.sourceCycle)) addReason(reasons, "UNATTRIBUTED_SOURCE_CYCLE", path);
    if (
      typeof entry?.attributionReceipt !== "string" ||
      !entry.attributionReceipt.startsWith("foreman/receipts/")
    ) {
      addReason(reasons, "ATTRIBUTION_RECEIPT_REQUIRED", path);
    }
    if (!ALLOWED_CLASSIFICATIONS.has(entry?.classification)) {
      addReason(reasons, "INVALID_PATH_CLASSIFICATION", path);
    }
    if (entry?.ignored !== false) addReason(reasons, "IGNORED_PATH_INCLUDED", path);
    if (entry?.generated !== false) addReason(reasons, "GENERATED_PATH_INCLUDED", path);
    if (entry?.secretBearing !== false) addReason(reasons, "SECRET_BEARING_PATH_INCLUDED", path);
    if (entry?.reparsePoint !== false) addReason(reasons, "REPARSE_PATH_INCLUDED", path);
    if (!ALLOWED_MODES.has(entry?.mode)) addReason(reasons, "UNSAFE_FILE_MODE", { path, mode: entry?.mode });
    if (!isSha256(entry?.blobSha256)) addReason(reasons, "INVALID_MANIFEST_BLOB_HASH", path);
    if (!isSha256(entry?.worktreeSha256)) addReason(reasons, "INVALID_WORKTREE_HASH", path);
  }

  const observedIndex = indexMap(input?.index?.entries, reasons);
  const manifestPaths = [...manifestMap.keys()].sort();
  const indexPaths = [...observedIndex.keys()].sort();
  const extra = indexPaths.filter((path) => !manifestMap.has(path));
  const missing = manifestPaths.filter((path) => !observedIndex.has(path));
  if (extra.length) addReason(reasons, "EXTRA_STAGED_PATH", extra);
  if (missing.length) addReason(reasons, "MISSING_STAGED_PATH", missing);

  for (const path of manifestPaths) {
    const declared = manifestMap.get(path);
    const observed = observedIndex.get(path);
    if (!observed) continue;
    if (declared.mode !== observed.mode) addReason(reasons, "INDEX_MODE_MISMATCH", path);
    if (declared.blobSha256 !== observed.blobSha256) {
      addReason(reasons, "INDEX_BLOB_HASH_MISMATCH", path);
    }
  }

  const observedWorktree = new Map(
    (Array.isArray(input?.worktree?.entries) ? input.worktree.entries : []).map((entry) => [
      String(entry?.path ?? ""),
      entry ?? {}
    ])
  );
  for (const path of manifestPaths) {
    const declared = manifestMap.get(path);
    const observed = observedWorktree.get(path);
    if (!observed) {
      addReason(reasons, "WORKTREE_SNAPSHOT_PATH_MISSING", path);
      continue;
    }
    if (declared.worktreeSha256 !== observed.sha256) {
      addReason(reasons, "WORKTREE_HASH_MISMATCH", path);
    }
  }
  const unstagedCandidatePaths = input?.worktree?.unstagedCandidatePaths;
  if (!Array.isArray(unstagedCandidatePaths) || unstagedCandidatePaths.length !== 0) {
    addReason(reasons, "UNSTAGED_CANDIDATE_DRIFT", unstagedCandidatePaths ?? null);
  }

  const hasPackage = manifestMap.has("package.json");
  const hasLock = manifestMap.has("package-lock.json");
  if (hasPackage !== hasLock) addReason(reasons, "PACKAGE_LOCK_PAIR_INCOMPLETE");

  const pair = input?.packageLockPair ?? {};
  if (
    pair.packageNext !== pair.lockNext ||
    pair.packagePostcss !== pair.lockPostcss ||
    pair.overrideNextPostcss !== pair.lockNestedNextPostcss ||
    pair.overrideNextSharp !== pair.lockNestedNextSharp
  ) {
    addReason(reasons, "PACKAGE_LOCK_DRIFT");
  }
  if (!isSha256(pair.packageSha256) || !isSha256(pair.lockSha256)) {
    addReason(reasons, "PACKAGE_LOCK_HASH_REQUIRED");
  }
  const expectedPairDigest = sha256({
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
  if (pair.pairDigest !== expectedPairDigest) addReason(reasons, "PACKAGE_LOCK_PAIR_DIGEST_MISMATCH");

  const secretScan = input?.secretScan ?? {};
  if (
    secretScan.status !== "PASS" ||
    !Array.isArray(secretScan.highConfidenceMatches) ||
    secretScan.highConfidenceMatches.length !== 0
  ) {
    addReason(reasons, "SECRET_SCAN_NOT_CLEAN");
  }

  const index = input?.index ?? {};
  const commit = input?.commit ?? {};
  for (const [field, value] of [
    ["MANIFEST_STAGED_TREE_INVALID", manifest.stagedTree],
    ["INDEX_WRITE_TREE_INVALID", index.writeTree],
    ["INDEX_PRECHECK_TREE_INVALID", index.preCheckTree],
    ["INDEX_POSTCHECK_TREE_INVALID", index.postCheckTree],
    ["COMMIT_TREE_INVALID", commit.tree]
  ]) {
    if (!isGitObjectId(value)) addReason(reasons, field);
  }
  if (manifest.stagedTree !== index.writeTree) addReason(reasons, "WRITE_TREE_MISMATCH");
  if (index.preCheckTree !== index.postCheckTree) addReason(reasons, "INDEX_TOCTOU_DRIFT");
  if (index.writeTree !== index.postCheckTree) addReason(reasons, "POSTCHECK_TREE_MISMATCH");
  if (commit.tree !== index.writeTree) addReason(reasons, "COMMIT_TREE_MISMATCH");
  if (commit.parent !== VPG47_SOURCE_COMMIT) addReason(reasons, "COMMIT_PARENT_MISMATCH");
  if (!isGitObjectId(commit.sha) || commit.sha === VPG47_SOURCE_COMMIT) {
    addReason(reasons, "CANDIDATE_COMMIT_INVALID");
  }
}

function evaluateHumanGateCustody(input, reasons) {
  const manifest = input?.candidateManifest ?? {};
  const observedManifestDigest = candidateManifestDigest(manifest);
  const approval = input?.approval ?? {};
  const authority = input?.operatorAuthority ?? {};
  const packet = input?.jPacket ?? {};
  const cycle = input?.cycle ?? {};

  if (cycle.id !== VPG47_CYCLE_ID || cycle.legacyLabel !== VPG47_LEGACY_LABEL) {
    addReason(reasons, "CYCLE_IDENTITY_MISMATCH");
  }
  if (cycle.status !== "COMPLETED") addReason(reasons, "CYCLE_NOT_COMPLETED");

  if (
    authority.kind !== "DIRECT_OPERATOR_INSTRUCTION" ||
    authority.verified !== true ||
    authority.phrase !== VPG47_J_PHRASE ||
    authority.directiveDigest !== sha256(VPG47_J_PHRASE)
  ) {
    addReason(reasons, "DIRECT_OPERATOR_AUTHORITY_REQUIRED");
  }

  if (approval.sourcePath !== VPG47_APPROVAL_PATH) addReason(reasons, "APPROVAL_SOURCE_MISMATCH");
  if (approval.matchingRowCount !== 1) addReason(reasons, "APPROVAL_ROW_NOT_UNIQUE");
  if (approval.decision !== "APPROVED") addReason(reasons, "APPROVAL_DECISION_MISMATCH");
  if (approval.phrase !== VPG47_J_PHRASE) addReason(reasons, "APPROVAL_PHRASE_MISMATCH");
  if (approval.cycleId !== VPG47_CYCLE_ID || approval.legacyLabel !== VPG47_LEGACY_LABEL) {
    addReason(reasons, "APPROVAL_CYCLE_MISMATCH");
  }
  if (approval.branch !== VPG47_BRANCH) addReason(reasons, "APPROVAL_BRANCH_MISMATCH");
  if (approval.sourceCommit !== VPG47_SOURCE_COMMIT) addReason(reasons, "APPROVAL_BASE_MISMATCH");
  if (approval.action !== VPG47_J_ACTION) addReason(reasons, "APPROVAL_ACTION_MISMATCH");
  if (approval.directiveDigest !== authority.directiveDigest) {
    addReason(reasons, "APPROVAL_DIRECTIVE_BINDING_MISMATCH");
  }
  if (approval.candidateManifestDigest !== observedManifestDigest) {
    addReason(reasons, "APPROVAL_MANIFEST_BINDING_MISMATCH");
  }
  if (approval.stagedTree !== manifest.stagedTree) addReason(reasons, "APPROVAL_TREE_BINDING_MISMATCH");
  if (approval.productionAuthorized !== false) addReason(reasons, "PRODUCTION_AUTHORITY_LAUNDERED");

  if (
    packet.cycleId !== VPG47_CYCLE_ID ||
    packet.legacyLabel !== VPG47_LEGACY_LABEL ||
    packet.branch !== VPG47_BRANCH ||
    packet.sourceCommit !== VPG47_SOURCE_COMMIT ||
    packet.jPhrase !== VPG47_J_PHRASE ||
    packet.jAction !== VPG47_J_ACTION
  ) {
    addReason(reasons, "J_PACKET_BINDING_MISMATCH");
  }
  if (!exactStringSet(packet.authorizedActions, ALLOWED_J_ACTIONS)) {
    addReason(reasons, "J_PACKET_SCOPE_WIDENED");
  }
  if (!exactStringSet(input?.requestedActions, ALLOWED_J_ACTIONS)) {
    addReason(reasons, "REQUESTED_ACTION_SCOPE_WIDENED");
  }

  if (input?.selectedAuthoritySource !== VPG47_APPROVAL_PATH) {
    addReason(reasons, "UNAUTHORIZED_AUTHORITY_SOURCE");
  }
  for (const claim of Array.isArray(input?.authorityClaims) ? input.authorityClaims : []) {
    if (claim?.authoritative === true && claim?.source !== VPG47_APPROVAL_PATH) {
      addReason(reasons, "SELF_ISSUED_AUTHORITY_CLAIM", claim?.source ?? null);
    }
    if (
      claim?.authoritative === true &&
      !exactStringSet(claim?.actions, ALLOWED_J_ACTIONS)
    ) {
      addReason(reasons, "AUTHORITY_CLAIM_SCOPE_WIDENED", claim?.source ?? null);
    }
  }

  const residues = Array.isArray(input?.gateResidue) ? input.gateResidue : [];
  const observedResidues = new Map(residues.map((entry) => [entry?.id, entry?.status]));
  for (const [id, status] of REQUIRED_GATE_RESIDUE) {
    if (observedResidues.get(id) !== status) {
      addReason(reasons, "HUMAN_GATE_RESIDUE_CHANGED", { id, expected: status, observed: observedResidues.get(id) });
    }
  }
  if (residues.length !== REQUIRED_GATE_RESIDUE.size) {
    addReason(reasons, "HUMAN_GATE_RESIDUE_SET_MISMATCH");
  }

  const commit = input?.commit ?? {};
  const remote = input?.remote ?? {};
  if (
    remote.branch !== VPG47_BRANCH ||
    remote.beforeFeature !== VPG47_SOURCE_COMMIT ||
    remote.afterFeature !== commit.sha ||
    remote.localHead !== commit.sha ||
    remote.upstreamHead !== commit.sha
  ) {
    addReason(reasons, "FEATURE_REMOTE_EQUALITY_MISSING");
  }
  if (
    !isGitObjectId(remote.beforeMain) ||
    remote.afterMain !== remote.beforeMain ||
    remote.localMainAfter !== remote.localMainBefore
  ) {
    addReason(reasons, "MAIN_BOUNDARY_CHANGED");
  }

  const sideEffects = input?.sideEffects ?? {};
  for (const field of [
    "prCreated",
    "merged",
    "previewChanged",
    "deployed",
    "productionChanged",
    "aliasChanged",
    "environmentChanged",
    "providerCalled",
    "dataMutated",
    "capabilityOpened"
  ]) {
    if (sideEffects[field] !== false) addReason(reasons, "FORBIDDEN_SIDE_EFFECT", field);
  }
}

export function evaluateVpg47JCustody(input = {}) {
  const indexReasons = [];
  const authorityReasons = [];
  if (input?.schema !== EVIDENCE_SCHEMA) addReason(indexReasons, "INVALID_EVIDENCE_SCHEMA");
  evaluateIndexCustody(input, indexReasons);
  evaluateHumanGateCustody(input, authorityReasons);
  const reasons = [...indexReasons, ...authorityReasons];
  return {
    ok: reasons.length === 0,
    result: reasons.length === 0 ? "PASS" : "STOP",
    evidenceAuthority: "TRUSTED_ADAPTER_REQUIRED; RAW_CALLER_JSON_IS_NOT_AUTHORITY",
    idea1: {
      id: "EXACT_INCLUDE_EXCLUDE_INDEX_TREE_CUSTODY",
      result: indexReasons.length === 0 ? "PASS" : "STOP",
      reasons: indexReasons
    },
    idea2: {
      id: "J_HUMAN_GATE_AUTHORITY_LAUNDERING",
      result: authorityReasons.length === 0 ? "PASS" : "STOP",
      reasons: authorityReasons
    },
    reasons
  };
}
