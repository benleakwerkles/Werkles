#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURRENT_STATES,
  REQUIRED_FORBIDDEN_ACTIONS,
  evaluateIntegrationReleaseTruth,
  loadTruthEvidence
} from "./integration-release-truth-guard-vpg40-20260723.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const baseEvidence = loadTruthEvidence(root);

function clone(value) {
  return structuredClone(value);
}

function evaluate(mutator = () => {}) {
  const evidence = clone(baseEvidence);
  mutator(evidence);
  return evaluateIntegrationReleaseTruth(evidence);
}

const cases = [
  {
    name: "current VPG39 branch-only truth passes",
    mutate() {},
    ok: true,
    reasons: []
  },
  {
    name: "remote ref mismatch stops pushed claim",
    mutate(evidence) {
      evidence.input.refs.remote_branch_head = "f".repeat(40);
    },
    ok: false,
    reasons: ["REMOTE_BRANCH_HEAD_MISMATCH", "STATE_ASSERTION_MISMATCH"]
  },
  {
    name: "merged PR without main integration stops",
    mutate(evidence) {
      evidence.input.pr_state.state = "MERGED";
      evidence.input.pr_state.number = 40;
      evidence.input.pr_state.head_sha = evidence.input.expected.closure_commit;
      evidence.input.pr_state.merge_commit_sha = "e".repeat(40);
    },
    ok: false,
    reasons: ["MERGED_PR_NOT_IN_MAIN"]
  },
  {
    name: "unsupported PR state stops",
    mutate(evidence) {
      evidence.input.pr_state.state = "DEPLOYED";
    },
    ok: false,
    reasons: ["PR_STATE_UNSUPPORTED"]
  },
  {
    name: "branch push cannot stand in for Preview proof",
    mutate(evidence) {
      evidence.previewEvidence.verification = "PROVEN";
      evidence.previewEvidence.source_sha = evidence.input.expected.closure_commit;
    },
    ok: false,
    reasons: ["PREVIEW_EVIDENCE_INCOMPLETE", "STATE_ASSERTION_MISMATCH"]
  },
  {
    name: "unproven Preview cannot carry deployment claims",
    mutate(evidence) {
      evidence.previewEvidence.deployment_id = "dpl_not_proof";
    },
    ok: false,
    reasons: ["PREVIEW_UNPROVEN_HAS_RELEASE_CLAIMS"]
  },
  {
    name: "repository Production evidence cannot claim live verification",
    mutate(evidence) {
      evidence.input.production.live_verified_by_this_guard = true;
    },
    ok: false,
    reasons: ["PRODUCTION_LIVE_CONFLATION"]
  },
  {
    name: "VPG39 Production change claim conflicts with receipts",
    mutate(evidence) {
      evidence.input.production.changed_by_vpg39 = true;
    },
    ok: false,
    reasons: ["PRODUCTION_STATE_UNSUPPORTED"]
  },
  {
    name: "missing forbidden Preview creation hold stops",
    mutate(evidence) {
      evidence.input.forbidden_actions =
        evidence.input.forbidden_actions.filter((action) => action !== "PREVIEW_CREATE");
    },
    ok: false,
    reasons: ["FORBIDDEN_SCOPE_MISSING"]
  },
  {
    name: "integration assertion without main evidence stops",
    mutate(evidence) {
      evidence.input.asserted_states[1] = "INTEGRATED";
    },
    ok: false,
    reasons: ["STATE_ASSERTION_MISMATCH"]
  },
  {
    name: "candidate digest tampering stops",
    mutate(evidence) {
      evidence.candidateManifest.candidate_digest = "0".repeat(64);
    },
    ok: false,
    reasons: ["CANDIDATE_DIGEST_MISMATCH", "CANDIDATE_DIGEST_INVALID"]
  }
];

const failures = [];

for (const testCase of cases) {
  try {
    const result = evaluate(testCase.mutate);
    assert.equal(result.ok, testCase.ok, `${testCase.name}: ok mismatch`);
    const codes = result.reasons.map((reason) => reason.code);
    for (const code of testCase.reasons) {
      assert.ok(codes.includes(code), `${testCase.name}: missing ${code}`);
    }
    if (testCase.ok) {
      assert.deepEqual(result.states, CURRENT_STATES);
      assert.deepEqual(result.forbidden_actions, REQUIRED_FORBIDDEN_ACTIONS);
      assert.equal(result.result, "PASS");
      assert.equal(
        result.evidence_scope,
        "LOCAL_AND_REPOSITORY_ATTESTED; PRODUCTION_NOT_LIVE_VERIFIED"
      );
    } else {
      assert.equal(result.result, "STOP");
    }
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push(`${testCase.name}: ${error.message}`);
    console.log(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures.length) {
  console.error("VPG40_INTEGRATION_RELEASE_TRUTH_GUARD_SMOKE: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`VPG40_INTEGRATION_RELEASE_TRUTH_GUARD_SMOKE: PASS (${cases.length} cases)`);
