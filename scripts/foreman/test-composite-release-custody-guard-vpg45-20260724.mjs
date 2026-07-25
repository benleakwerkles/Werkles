#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateCompositeReleaseCustody,
  trustedEvidenceDigest
} from "./composite-release-custody-guard-vpg45-20260724.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg45-composite-release-custody-complete-20260724.json";
const fixture = JSON.parse(readFileSync(path.join(repoRoot, fixturePath), "utf8"));

function clone(value) {
  return structuredClone(value);
}

function refreshed(source = fixture) {
  const value = clone(source);
  value.trusted_evidence.snapshotDigest = trustedEvidenceDigest(value.trusted_evidence);
  value.request.evidenceDigest = value.trusted_evidence.snapshotDigest;
  return value;
}

function trustedMutation(mutate) {
  return (value) => {
    mutate(value);
    value.trusted_evidence.snapshotDigest = trustedEvidenceDigest(value.trusted_evidence);
    value.request.evidenceDigest = value.trusted_evidence.snapshotDigest;
  };
}

const SHA_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SHA_1 = "1111111111111111111111111111111111111111";

const cases = [
  {
    name: "complete bound synthetic release passes",
    expectedOk: true
  },
  {
    name: "missing trusted evidence stops",
    removeTrusted: true,
    expectedCode: "TRUSTED_EVIDENCE_REQUIRED"
  },
  {
    name: "null trusted evidence stops explicitly",
    trustedOverride: null,
    expectedCode: "TRUSTED_EVIDENCE_REQUIRED"
  },
  {
    name: "null request stops explicitly",
    requestOverride: null,
    expectedCode: "INVALID_REQUEST_SCHEMA"
  },
  {
    name: "wrong request evidence digest stops",
    mutate(value) {
      value.request.evidenceDigest = "0".repeat(64);
    },
    expectedCode: "EVIDENCE_DIGEST_MISMATCH"
  },
  {
    name: "post-snapshot trusted evidence drift stops",
    mutate(value) {
      value.trusted_evidence.git.branch = "codex/post-evaluation-drift";
    },
    expectedCode: "EVIDENCE_DIGEST_MISMATCH"
  },
  {
    name: "dirty worktree stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.git.dirty = true;
    }),
    expectedCode: "DIRTY_WORKTREE"
  },
  {
    name: "untracked evidence stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.git.untrackedCount = 1;
    }),
    expectedCode: "UNTRACKED_EVIDENCE"
  },
  {
    name: "wrong branch stops",
    mutate(value) {
      value.request.branch = "codex/wrong-branch";
    },
    expectedCode: "BRANCH_MISMATCH"
  },
  {
    name: "wrong HEAD stops",
    mutate(value) {
      value.request.headSha = SHA_1;
    },
    expectedCode: "HEAD_MISMATCH"
  },
  {
    name: "upstream drift stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.git.upstreamSha = SHA_1;
    }),
    expectedCode: "UPSTREAM_MISMATCH"
  },
  {
    name: "candidate deployment substitution stops",
    mutate(value) {
      value.request.candidateDeploymentId = "dpl_attackerCandidate";
    },
    expectedCode: "CANDIDATE_DEPLOYMENT_MISMATCH"
  },
  {
    name: "candidate source commit substitution stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.release.candidateSourceSha = SHA_1;
    }),
    expectedCode: "CANDIDATE_SOURCE_MISMATCH"
  },
  {
    name: "coherently malformed candidate deployment ID cannot launder equality",
    mutate: trustedMutation((value) => {
      value.request.candidateDeploymentId = "not-a-deployment";
      value.trusted_evidence.release.candidateDeploymentId = "not-a-deployment";
      value.trusted_evidence.approval.candidateDeploymentId = "not-a-deployment";
      value.trusted_evidence.harvey.candidateDeploymentId = "not-a-deployment";
    }),
    expectedCode: "CANDIDATE_DEPLOYMENT_MISMATCH"
  },
  {
    name: "Production deployment substitution stops",
    mutate(value) {
      value.request.productionDeploymentId = "dpl_attackerProduction";
    },
    expectedCode: "PRODUCTION_DEPLOYMENT_MISMATCH"
  },
  {
    name: "coherently malformed Production deployment ID cannot launder equality",
    mutate: trustedMutation((value) => {
      value.request.productionDeploymentId = "not-a-deployment";
      value.trusted_evidence.release.productionDeploymentId = "not-a-deployment";
      value.trusted_evidence.approval.productionDeploymentId = "not-a-deployment";
      value.trusted_evidence.harvey.productionDeploymentId = "not-a-deployment";
    }),
    expectedCode: "PRODUCTION_DEPLOYMENT_MISMATCH"
  },
  {
    name: "rollback deployment substitution stops",
    mutate(value) {
      value.request.rollbackDeploymentId = "dpl_attackerRollback";
    },
    expectedCode: "ROLLBACK_DEPLOYMENT_MISMATCH"
  },
  {
    name: "coherently malformed rollback deployment ID cannot launder equality",
    mutate: trustedMutation((value) => {
      value.request.rollbackDeploymentId = "not-a-deployment";
      value.trusted_evidence.rollback.deploymentId = "not-a-deployment";
      value.trusted_evidence.approval.rollbackDeploymentId = "not-a-deployment";
      value.trusted_evidence.harvey.rollbackDeploymentId = "not-a-deployment";
    }),
    expectedCode: "ROLLBACK_DEPLOYMENT_MISMATCH"
  },
  {
    name: "rollback mislabeled as coexistence stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.rollback.isCoexistence = true;
    }),
    expectedCode: "ROLLBACK_MISLABELED_AS_COEXISTENCE"
  },
  {
    name: "alias set drift stops",
    mutate(value) {
      value.request.aliases.push("www.werkles.com");
    },
    expectedCode: "ALIAS_SET_MISMATCH"
  },
  {
    name: "coherently empty Production alias set cannot launder equality",
    mutate: trustedMutation((value) => {
      value.request.aliases = [];
      value.trusted_evidence.aliases = [];
      value.trusted_evidence.approval.aliases = [];
    }),
    expectedCode: "ALIAS_SET_MISMATCH"
  },
  {
    name: "coherently empty branch cannot launder equality",
    mutate: trustedMutation((value) => {
      value.request.branch = "";
      value.trusted_evidence.git.branch = "";
      value.trusted_evidence.j.branch = "";
      value.trusted_evidence.approval.branch = "";
    }),
    expectedCode: "BRANCH_MISMATCH"
  },
  {
    name: "incomplete cycle stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.cycle.status = "P_COMPLETED";
    }),
    expectedCode: "CYCLE_INCOMPLETE"
  },
  {
    name: "wrong cycle stops",
    mutate(value) {
      value.request.cycleId = "WERKLES-FLOCK-20260724-000000-ET-BETSY-99";
    },
    expectedCode: "CYCLE_MISMATCH"
  },
  {
    name: "missing current-cycle J stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.j = null;
    }),
    expectedCode: "J_RECEIPT_MISSING"
  },
  {
    name: "stale J cycle replay stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.j.cycleId = "WERKLES-FLOCK-20260724-110445-ET-BETSY-01";
    }),
    expectedCode: "J_CYCLE_MISMATCH"
  },
  {
    name: "J branch binding drift stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.j.branch = "codex/replayed-j";
    }),
    expectedCode: "J_BINDING_MISMATCH"
  },
  {
    name: "ordinary VPG approval is not Production authority",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.approval.scope = "VPG_LOCAL_EXECUTION";
    }),
    expectedCode: "APPROVAL_SCOPE_MISMATCH"
  },
  {
    name: "wrong Production approval scope stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.approval.phrase = "APPROVE SOME OTHER RELEASE";
    }),
    expectedCode: "APPROVAL_SCOPE_MISMATCH"
  },
  {
    name: "approval replay for another candidate stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.approval.candidateDeploymentId = "dpl_replayedCandidate";
    }),
    expectedCode: "APPROVAL_BINDING_MISMATCH"
  },
  {
    name: "release integrity non-PASS stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.release.result = "STOP";
    }),
    expectedCode: "RELEASE_INTEGRITY_NOT_PASS"
  },
  {
    name: "release integrity candidate binding drift stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.release.candidateDeploymentId = "dpl_staleCandidate";
    }),
    expectedCode: "RELEASE_BINDING_MISMATCH"
  },
  {
    name: "unresolved Harvey disposition stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.harvey.state = "UNRESOLVED";
    }),
    expectedCode: "HARVEY_DISPOSITION_UNRESOLVED"
  },
  {
    name: "Harvey disposition without authority stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.harvey.authority = null;
    }),
    expectedCode: "HARVEY_AUTHORITY_MISSING"
  },
  {
    name: "Harvey candidate binding drift stops",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.harvey.candidateDeploymentId = "dpl_staleCandidate";
    }),
    expectedCode: "HARVEY_BINDING_MISMATCH"
  },
  {
    name: "independent PASS claims cannot launder missing raw bindings",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.j = { result: "PASS" };
      value.trusted_evidence.approval = { result: "PASS", authoritative: false };
      value.trusted_evidence.release = { result: "PASS" };
      value.trusted_evidence.harvey = {
        result: "PASS",
        state: "RESOLVED",
        authority: null
      };
    }),
    expectedCode: "J_RECEIPT_MISSING"
  },
  {
    name: "self-minted approval digest cannot replace authoritative record",
    mutate: trustedMutation((value) => {
      value.trusted_evidence.approval = {
        ...value.trusted_evidence.approval,
        authoritative: false
      };
    }),
    expectedCode: "APPROVAL_RECORD_NOT_AUTHORITATIVE"
  },
  {
    name: "malformed but equal HEAD strings cannot pass",
    mutate: trustedMutation((value) => {
      value.request.headSha = "not-a-sha";
      value.trusted_evidence.git.headSha = "not-a-sha";
      value.trusted_evidence.git.upstreamSha = "not-a-sha";
      value.trusted_evidence.j.headSha = "not-a-sha";
      value.trusted_evidence.release.headSha = "not-a-sha";
    }),
    expectedCode: "HEAD_MISMATCH"
  }
];

const results = [];

for (const testCase of cases) {
  const value = refreshed();
  testCase.mutate?.(value);
  const request = Object.hasOwn(testCase, "requestOverride")
    ? testCase.requestOverride
    : value.request;
  const trusted = Object.hasOwn(testCase, "trustedOverride")
    ? testCase.trustedOverride
    : testCase.removeTrusted
      ? {}
      : value.trusted_evidence;
  const result = evaluateCompositeReleaseCustody(request, trusted);
  const codes = result.reasons.map((reason) => reason.code);

  assert.equal(result.ok, testCase.expectedOk ?? false, `${testCase.name}: ok mismatch`);
  if (testCase.expectedCode) {
    assert.ok(codes.includes(testCase.expectedCode), `${testCase.name}: missing ${testCase.expectedCode}`);
    assert.equal(result.result, "STOP", `${testCase.name}: expected STOP`);
  } else {
    assert.equal(result.result, "PASS", `${testCase.name}: expected PASS`);
    assert.deepEqual(codes, [], `${testCase.name}: unexpected reasons`);
  }
  results.push({
    name: testCase.name,
    result: result.result,
    expected_code: testCase.expectedCode ?? null,
    reason_codes: codes
  });
}

assert.equal(SHA_A, fixture.request.headSha, "fixture HEAD unexpectedly changed");

console.log(
  JSON.stringify(
    {
      schema: "werkles.vpg45-ender-composite-release-custody-matrix/v1",
      cycle_id: fixture.cycle_id,
      legacy_label: fixture.legacy_label,
      fixture: fixturePath,
      case_count: cases.length,
      pass_count: results.filter((entry) => entry.result === "PASS").length,
      stop_count: results.filter((entry) => entry.result === "STOP").length,
      cases: results,
      result: "PASS"
    },
    null,
    2
  )
);
