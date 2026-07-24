#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_INPUT =
  "scripts/foreman/fixtures/vpg40-integration-release-truth-current-20260723.json";

export const CURRENT_STATES = [
  "PUSHED",
  "NOT_INTEGRATED",
  "PREVIEW_UNPROVEN",
  "PRODUCTION_REPO_ATTESTED_UNCHANGED"
];

export const REQUIRED_FORBIDDEN_ACTIONS = [
  "PREVIEW_CREATE",
  "DEPLOY",
  "PROMOTE",
  "ALIAS",
  "ENV_CHANGE",
  "GATE_CHANGE",
  "PR",
  "MERGE",
  "PUSH",
  "COMMIT"
];

const VALID_PR_STATES = new Set(["NONE", "OPEN", "CLOSED", "MERGED"]);
const SHA_PATTERN = /^[0-9a-f]{40}$/;

function addReason(reasons, code, detail) {
  reasons.push({ code, detail });
}

function candidateDigest(entries) {
  const normalized = [...entries]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => `${entry.path}\0${entry.sha256}`)
    .join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}

function equalValues(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function requireExact(reasons, code, actual, expected) {
  if (actual !== expected) {
    addReason(reasons, code, `Expected ${String(expected)}, got ${String(actual)}.`);
    return false;
  }
  return true;
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

export function evaluateIntegrationReleaseTruth({
  input,
  candidateManifest,
  closureManifest,
  previewEvidence,
  productionReceipt,
  productionPointer,
  vpg39HoldReceipt,
  scopePacket,
  humanGates,
  liveGit = null
}) {
  const reasons = [];
  const states = [];

  if (input?.schema !== "werkles.integration-release-truth-input/v1") {
    addReason(reasons, "INPUT_SCHEMA", input?.schema ?? "missing");
  }
  if (candidateManifest?.schema !== "werkles.j-candidate-manifest/v1") {
    addReason(reasons, "CANDIDATE_MANIFEST_SCHEMA", candidateManifest?.schema ?? "missing");
  }
  if (closureManifest?.schema !== "werkles.j-closure-manifest/v1") {
    addReason(reasons, "CLOSURE_MANIFEST_SCHEMA", closureManifest?.schema ?? "missing");
  }

  const expected = input?.expected ?? {};
  const refs = input?.refs ?? {};
  const topology = input?.topology ?? {};

  requireExact(reasons, "CANDIDATE_BASE_MISMATCH", candidateManifest?.base_sha, expected.base_commit);
  requireExact(reasons, "CANDIDATE_BRANCH_MISMATCH", candidateManifest?.branch, input?.branch);
  requireExact(reasons, "CANDIDATE_TREE_MISMATCH", candidateManifest?.staged_tree, expected.product_tree);
  requireExact(
    reasons,
    "CANDIDATE_DIGEST_MISMATCH",
    candidateManifest?.candidate_digest,
    expected.candidate_digest
  );
  requireExact(
    reasons,
    "CANDIDATE_PATH_COUNT_MISMATCH",
    candidateManifest?.owned_paths?.length,
    expected.candidate_path_count
  );
  if (
    Array.isArray(candidateManifest?.owned_paths) &&
    candidateDigest(candidateManifest.owned_paths) !== candidateManifest.candidate_digest
  ) {
    addReason(reasons, "CANDIDATE_DIGEST_INVALID", candidateManifest.candidate_digest);
  }

  requireExact(reasons, "CLOSURE_BRANCH_MISMATCH", closureManifest?.branch, input?.branch);
  requireExact(
    reasons,
    "CLOSURE_PRODUCT_MISMATCH",
    closureManifest?.product_commit,
    expected.product_commit
  );
  requireExact(
    reasons,
    "CLOSURE_PRODUCT_TREE_MISMATCH",
    closureManifest?.product_tree,
    expected.product_tree
  );
  requireExact(
    reasons,
    "CLOSURE_REMOTE_REF_MISMATCH",
    closureManifest?.remote_ref,
    refs.remote_ref
  );
  requireExact(
    reasons,
    "CLOSURE_PATH_COUNT_MISMATCH",
    closureManifest?.owned_paths?.length,
    expected.closure_owned_path_count
  );
  if (
    Array.isArray(closureManifest?.owned_paths) &&
    candidateDigest(closureManifest.owned_paths) !== closureManifest.closure_digest
  ) {
    addReason(reasons, "CLOSURE_DIGEST_INVALID", closureManifest.closure_digest);
  }

  const pushedChecks = [
    ["LOCAL_HEAD_MISMATCH", refs.local_head, expected.closure_commit],
    ["UPSTREAM_HEAD_MISMATCH", refs.upstream_head, expected.closure_commit],
    ["REMOTE_BRANCH_HEAD_MISMATCH", refs.remote_branch_head, expected.closure_commit],
    ["CLOSURE_PARENT_MISMATCH", topology.closure_parent, expected.product_commit],
    ["PRODUCT_PARENT_MISMATCH", topology.product_parent, expected.base_commit],
    ["PRODUCT_TREE_TOPOLOGY_MISMATCH", topology.product_tree, expected.product_tree]
  ];
  let pushed = true;
  for (const [code, actual, wanted] of pushedChecks) {
    pushed = requireExact(reasons, code, actual, wanted) && pushed;
  }
  if (pushed) states.push("PUSHED");

  const prState = input?.pr_state ?? {};
  if (!VALID_PR_STATES.has(prState.state)) {
    addReason(reasons, "PR_STATE_UNSUPPORTED", prState.state ?? "missing");
  }
  if (
    prState.state === "NONE" &&
    [prState.number, prState.head_sha, prState.merge_commit_sha].some((value) => value !== null)
  ) {
    addReason(reasons, "PR_NONE_HAS_ARTIFACT", "A NONE PR state cannot carry PR or merge identifiers.");
  }
  if (topology.closure_in_origin_main && !topology.product_in_origin_main) {
    addReason(
      reasons,
      "CLOSURE_WITHOUT_PRODUCT_IN_MAIN",
      "The closure cannot be integrated while its parent product is absent."
    );
  }
  if (prState.state === "MERGED" && !topology.product_in_origin_main) {
    addReason(
      reasons,
      "MERGED_PR_NOT_IN_MAIN",
      "A merged PR assertion is unsupported while the product commit is absent from origin/main."
    );
  }
  states.push(topology.product_in_origin_main ? "INTEGRATED" : "NOT_INTEGRATED");

  if (previewEvidence?.schema !== "werkles.preview-evidence/v1") {
    addReason(reasons, "PREVIEW_SCHEMA", previewEvidence?.schema ?? "missing");
  }
  if (previewEvidence?.release_label !== "VPG39") {
    addReason(reasons, "PREVIEW_RELEASE_MISMATCH", previewEvidence?.release_label ?? "missing");
  }
  if (previewEvidence?.verification === "UNPROVEN") {
    const unsupportedPreviewFields = [
      "evidence_path",
      "deployment_id",
      "source_sha",
      "target",
      "ready_state",
      "provenance",
      "audience_evidence"
    ].filter((field) => previewEvidence[field] !== null);
    if (unsupportedPreviewFields.length) {
      addReason(
        reasons,
        "PREVIEW_UNPROVEN_HAS_RELEASE_CLAIMS",
        unsupportedPreviewFields.join(", ")
      );
    }
    states.push("PREVIEW_UNPROVEN");
  } else if (previewEvidence?.verification === "PROVEN") {
    const complete =
      typeof previewEvidence.evidence_path === "string" &&
      /^dpl_[A-Za-z0-9]+$/.test(previewEvidence.deployment_id ?? "") &&
      SHA_PATTERN.test(previewEvidence.source_sha ?? "") &&
      previewEvidence.target === "preview" &&
      previewEvidence.ready_state === "READY" &&
      previewEvidence.provenance !== null &&
      previewEvidence.audience_evidence !== null;
    if (!complete) {
      addReason(
        reasons,
        "PREVIEW_EVIDENCE_INCOMPLETE",
        "PROVEN requires deployment, source, target, ready-state, provenance, and audience evidence."
      );
    }
    states.push("PREVIEW_PROVEN");
  } else {
    addReason(reasons, "PREVIEW_STATE_UNSUPPORTED", previewEvidence?.verification ?? "missing");
  }

  const production = input?.production ?? {};
  if (production.live_verified_by_this_guard) {
    addReason(
      reasons,
      "PRODUCTION_LIVE_CONFLATION",
      "This guard consumes repository evidence and cannot claim a live Production verification."
    );
  }
  if (production.changed_by_vpg39) {
    addReason(
      reasons,
      "PRODUCTION_STATE_UNSUPPORTED",
      "VPG39 receipts attest that Production was unchanged."
    );
  }
  const productionEvidenceMatches =
    production.release_label === "VPG22" &&
    /^dpl_[A-Za-z0-9]+$/.test(production.deployment_id ?? "") &&
    includesAll(productionReceipt, ["VPG22", production.deployment_id]) &&
    includesAll(productionPointer, [
      production.deployment_id,
      "VPG22 remains the current Production release"
    ]) &&
    includesAll(vpg39HoldReceipt, ["PRODUCTION_CHANGED: `NO`", "No PR, merge, deployment"]);
  if (!productionEvidenceMatches) {
    addReason(
      reasons,
      "PRODUCTION_REPO_EVIDENCE_MISMATCH",
      "VPG22 pointer/receipt and VPG39 unchanged hold do not agree."
    );
  } else {
    states.push("PRODUCTION_REPO_ATTESTED_UNCHANGED");
  }

  if (
    !includesAll(scopePacket, [
      expected.closure_commit,
      expected.product_commit,
      "Treat branch push, PR, merge, Preview, Production deployment, promotion, and aliasing as distinct states.",
      "No PR, merge, commit, push, deployment, Production action, gate opening, Vercel environment change"
    ])
  ) {
    addReason(reasons, "SCOPE_PACKET_MISMATCH", "The VPG40 packet no longer carries its exact refs and holds.");
  }
  if (
    !includesAll(humanGates, [
      "live deploy",
      "git push or merge",
      "promotion of draft/review outputs to approved or published status"
    ])
  ) {
    addReason(reasons, "HUMAN_GATE_EVIDENCE_MISMATCH", "Human Gate authority text is incomplete.");
  }

  const forbiddenActions = input?.forbidden_actions ?? [];
  const missingForbidden = REQUIRED_FORBIDDEN_ACTIONS.filter(
    (action) => !forbiddenActions.includes(action)
  );
  if (missingForbidden.length) {
    addReason(reasons, "FORBIDDEN_SCOPE_MISSING", missingForbidden.join(", "));
  }

  if (!equalValues(states, input?.asserted_states ?? [])) {
    addReason(
      reasons,
      "STATE_ASSERTION_MISMATCH",
      `Computed ${states.join("|")}; asserted ${(input?.asserted_states ?? []).join("|")}.`
    );
  }

  if (liveGit) {
    const livePairs = [
      ["LIVE_BRANCH_MISMATCH", liveGit.branch, input.branch],
      ["LIVE_LOCAL_HEAD_MISMATCH", liveGit.local_head, refs.local_head],
      ["LIVE_UPSTREAM_HEAD_MISMATCH", liveGit.upstream_head, refs.upstream_head],
      ["LIVE_REMOTE_BRANCH_HEAD_MISMATCH", liveGit.remote_branch_head, refs.remote_branch_head],
      ["LIVE_ORIGIN_MAIN_MISMATCH", liveGit.origin_main, refs.origin_main],
      ["LIVE_CLOSURE_PARENT_MISMATCH", liveGit.closure_parent, topology.closure_parent],
      ["LIVE_PRODUCT_PARENT_MISMATCH", liveGit.product_parent, topology.product_parent],
      ["LIVE_PRODUCT_TREE_MISMATCH", liveGit.product_tree, topology.product_tree],
      [
        "LIVE_PRODUCT_IN_MAIN_MISMATCH",
        liveGit.product_in_origin_main,
        topology.product_in_origin_main
      ],
      [
        "LIVE_CLOSURE_IN_MAIN_MISMATCH",
        liveGit.closure_in_origin_main,
        topology.closure_in_origin_main
      ]
    ];
    for (const [code, actual, wanted] of livePairs) {
      requireExact(reasons, code, actual, wanted);
    }
    if (!equalValues(liveGit.candidate_paths, candidateManifest.owned_paths.map((entry) => entry.path).sort())) {
      addReason(reasons, "LIVE_CANDIDATE_PATH_SET_MISMATCH", "Git candidate diff differs from manifest.");
    }
    if (liveGit.candidate_hash_mismatches.length) {
      addReason(
        reasons,
        "LIVE_CANDIDATE_BLOB_HASH_MISMATCH",
        liveGit.candidate_hash_mismatches.join(", ")
      );
    }
    const expectedClosurePaths = [
      ...closureManifest.owned_paths.map((entry) => entry.path),
      input.evidence_paths.closure_manifest
    ].sort();
    if (!equalValues(liveGit.closure_paths, expectedClosurePaths)) {
      addReason(reasons, "LIVE_CLOSURE_PATH_SET_MISMATCH", "Git closure diff differs from manifest.");
    }
    if (liveGit.closure_hash_mismatches.length) {
      addReason(
        reasons,
        "LIVE_CLOSURE_BLOB_HASH_MISMATCH",
        liveGit.closure_hash_mismatches.join(", ")
      );
    }
  }

  return {
    ok: reasons.length === 0,
    result: reasons.length === 0 ? "PASS" : "STOP",
    states,
    evidence_scope: "LOCAL_AND_REPOSITORY_ATTESTED; PRODUCTION_NOT_LIVE_VERIFIED",
    refs: {
      branch: input?.branch ?? null,
      local_head: refs.local_head ?? null,
      upstream_head: refs.upstream_head ?? null,
      remote_branch_head: refs.remote_branch_head ?? null,
      origin_main: refs.origin_main ?? null
    },
    pr_state: prState.state ?? null,
    forbidden_actions: forbiddenActions,
    reasons
  };
}

function safeRead(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const absolute = path.resolve(root, relativePath);
  if (absolute !== resolvedRoot && !absolute.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Evidence path escapes repository root: ${relativePath}`);
  }
  return readFileSync(absolute, "utf8");
}

export function loadTruthEvidence(root, relativeInputPath = DEFAULT_INPUT) {
  const input = JSON.parse(safeRead(root, relativeInputPath));
  const evidencePaths = input.evidence_paths ?? {};
  return {
    input,
    candidateManifest: JSON.parse(safeRead(root, evidencePaths.candidate_manifest)),
    closureManifest: JSON.parse(safeRead(root, evidencePaths.closure_manifest)),
    previewEvidence: JSON.parse(safeRead(root, evidencePaths.preview)),
    productionReceipt: safeRead(root, evidencePaths.production_receipt),
    productionPointer: safeRead(root, evidencePaths.production_pointer),
    vpg39HoldReceipt: safeRead(root, evidencePaths.vpg39_hold_receipt),
    scopePacket: safeRead(root, evidencePaths.scope_packet),
    humanGates: safeRead(root, evidencePaths.human_gates)
  };
}

function git(root, args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: root, encoding });
}

function gitLines(root, args) {
  return git(root, args)
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .sort();
}

function gitBlobSha256(root, commit, filePath) {
  return createHash("sha256")
    .update(git(root, ["show", `${commit}:${filePath}`], null))
    .digest("hex");
}

function isAncestor(root, commit, target) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", commit, target], {
    cwd: root,
    stdio: "ignore"
  });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error(`git merge-base failed with status ${String(result.status)}`);
}

export function collectLiveGitEvidence(root, input, candidateManifest, closureManifest) {
  const expected = input.expected;
  const remoteLine = git(root, ["ls-remote", "origin", input.refs.remote_ref]).trim();
  const remoteBranchHead = remoteLine ? remoteLine.split(/\s+/)[0] : null;
  const candidatePaths = gitLines(root, [
    "diff",
    "--name-only",
    expected.base_commit,
    expected.product_commit
  ]);
  const closurePaths = gitLines(root, [
    "diff",
    "--name-only",
    expected.product_commit,
    expected.closure_commit
  ]);

  return {
    branch: git(root, ["branch", "--show-current"]).trim(),
    local_head: git(root, ["rev-parse", "HEAD"]).trim(),
    upstream_head: git(root, ["rev-parse", "@{u}"]).trim(),
    remote_branch_head: remoteBranchHead,
    origin_main: git(root, ["rev-parse", "origin/main"]).trim(),
    closure_parent: git(root, ["rev-parse", `${expected.closure_commit}^`]).trim(),
    product_parent: git(root, ["rev-parse", `${expected.product_commit}^`]).trim(),
    product_tree: git(root, ["rev-parse", `${expected.product_commit}^{tree}`]).trim(),
    product_in_origin_main: isAncestor(root, expected.product_commit, "origin/main"),
    closure_in_origin_main: isAncestor(root, expected.closure_commit, "origin/main"),
    candidate_paths: candidatePaths,
    candidate_hash_mismatches: candidateManifest.owned_paths
      .filter(
        (entry) =>
          gitBlobSha256(root, expected.product_commit, entry.path) !== entry.sha256
      )
      .map((entry) => entry.path),
    closure_paths: closurePaths,
    closure_hash_mismatches: closureManifest.owned_paths
      .filter(
        (entry) =>
          gitBlobSha256(root, expected.closure_commit, entry.path) !== entry.sha256
      )
      .map((entry) => entry.path)
  };
}

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, live: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") args.input = argv[++index] ?? "";
    else if (arg === "--live") args.live = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const evidence = loadTruthEvidence(root, args.input);
  const liveGit = args.live
    ? collectLiveGitEvidence(
        root,
        evidence.input,
        evidence.candidateManifest,
        evidence.closureManifest
      )
    : null;
  const result = evaluateIntegrationReleaseTruth({ ...evidence, liveGit });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
