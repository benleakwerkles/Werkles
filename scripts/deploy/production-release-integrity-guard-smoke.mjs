#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateProductionReleaseIntegrity } from "./production-release-integrity-guard.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const contract = JSON.parse(readFileSync(path.join(repoRoot, "deploy/production-release-contract.json"), "utf8"));
const approvedSha = "83178a95053a3a108dfa48de38f111172d25d50b";
const approvedDeploymentId = "dpl_BBBNaeGfjnZJXy3FbQVmVjePVgxo";

function completeFixture() {
  return {
    contract,
    dirty: false,
    headSha: approvedSha,
    approvedSha,
    approvedDeploymentId,
    appPathsManifest: Object.fromEntries(contract.required_app_paths.map((route) => [route, `server${route}.js`])),
    candidate: {
      id: approvedDeploymentId,
      name: contract.candidate.name,
      target: contract.candidate.target,
      readyState: contract.candidate.ready_state,
      builds: [
        {
          output: contract.required_candidate_output_routes.map((route) => ({ path: route, type: "lambda" }))
        }
      ]
    },
    provenance: {
      id: approvedDeploymentId,
      gitSource: {
        type: contract.provenance_source.type,
        repoId: 123456789,
        sha: approvedSha
      },
      meta: {
        githubCommitOrg: contract.provenance_source.github_org,
        githubCommitRepo: contract.provenance_source.github_repo
      }
    },
    candidateHttpBoundaries: {
      deployment_id: approvedDeploymentId,
      responses: contract.required_candidate_http_boundaries.map((boundary) => ({
        method: boundary.method,
        path: boundary.path,
        status: boundary.status,
        headers: boundary.headers ? { ...boundary.headers } : {},
        json: boundary.json ? { ...boundary.json } : undefined
      }))
    }
  };
}

const cases = [
  {
    name: "clean exact release passes",
    mutate() {},
    expectOk: true,
    expectReason: null
  },
  {
    name: "dirty worktree fails closed",
    mutate(input) {
      input.dirty = true;
    },
    expectOk: false,
    expectReason: "DIRTY_WORKTREE"
  },
  {
    name: "HEAD SHA mismatch fails closed",
    mutate(input) {
      input.headSha = "70a35fe53b78203e5b064e5a4743eea001702a94";
    },
    expectOk: false,
    expectReason: "HEAD_SHA_MISMATCH"
  },
  {
    name: "missing approved deployment ID fails closed",
    mutate(input) {
      input.approvedDeploymentId = "";
    },
    expectOk: false,
    expectReason: "APPROVED_DEPLOYMENT_ID_REQUIRED"
  },
  {
    name: "missing candidate deployment ID fails closed",
    mutate(input) {
      delete input.candidate.id;
    },
    expectOk: false,
    expectReason: "CANDIDATE_DEPLOYMENT_ID_REQUIRED"
  },
  {
    name: "wrong candidate deployment ID fails closed",
    mutate(input) {
      input.candidate.id = "dpl_otherCandidate";
    },
    expectOk: false,
    expectReason: "CANDIDATE_DEPLOYMENT_ID_MISMATCH"
  },
  {
    name: "missing separate provenance fails closed",
    mutate(input) {
      delete input.provenance;
    },
    expectOk: false,
    expectReason: "PROVENANCE_REQUIRED"
  },
  {
    name: "provenance deployment ID mismatch fails closed",
    mutate(input) {
      input.provenance.id = "dpl_otherProvenance";
    },
    expectOk: false,
    expectReason: "PROVENANCE_DEPLOYMENT_ID_MISMATCH"
  },
  {
    name: "provenance SHA mismatch fails closed",
    mutate(input) {
      input.provenance.gitSource.sha = "70a35fe53b78203e5b064e5a4743eea001702a94";
    },
    expectOk: false,
    expectReason: "PROVENANCE_SHA_MISMATCH"
  },
  {
    name: "provenance GitHub source mismatch fails closed",
    mutate(input) {
      input.provenance.meta.githubCommitRepo = "OtherRepo";
    },
    expectOk: false,
    expectReason: "PROVENANCE_SOURCE_MISMATCH"
  },
  {
    name: "missing exact-candidate HTTP evidence fails closed",
    mutate(input) {
      delete input.candidateHttpBoundaries;
    },
    expectOk: false,
    expectReason: "CANDIDATE_HTTP_BOUNDARIES_REQUIRED"
  },
  {
    name: "HTTP evidence deployment mismatch fails closed",
    mutate(input) {
      input.candidateHttpBoundaries.deployment_id = "dpl_otherHttpEvidence";
    },
    expectOk: false,
    expectReason: "CANDIDATE_HTTP_DEPLOYMENT_ID_MISMATCH"
  },
  {
    name: "missing provider HTTP boundary fails closed",
    mutate(input) {
      input.candidateHttpBoundaries.responses = input.candidateHttpBoundaries.responses.filter(
        (response) => response.path !== "/api/verification/funds/exchange"
      );
    },
    expectOk: false,
    expectReason: "MISSING_CANDIDATE_HTTP_BOUNDARY"
  },
  {
    name: "provider HTTP status mismatch fails closed",
    mutate(input) {
      const response = input.candidateHttpBoundaries.responses.find(
        (entry) => entry.path === "/api/verification/identity"
      );
      response.status = 200;
    },
    expectOk: false,
    expectReason: "CANDIDATE_HTTP_STATUS_MISMATCH"
  },
  {
    name: "provider HTTP no-store mismatch fails closed",
    mutate(input) {
      const response = input.candidateHttpBoundaries.responses.find(
        (entry) => entry.path === "/api/verification/funds"
      );
      response.headers["cache-control"] = "public, max-age=3600";
    },
    expectOk: false,
    expectReason: "CANDIDATE_HTTP_HEADER_MISMATCH"
  },
  {
    name: "provider HTTP JSON mismatch fails closed",
    mutate(input) {
      const response = input.candidateHttpBoundaries.responses.find(
        (entry) => entry.path === "/api/verification/funds/exchange"
      );
      response.json.state = "Open";
    },
    expectOk: false,
    expectReason: "CANDIDATE_HTTP_JSON_MISMATCH"
  },
  {
    name: "missing candidate route fails closed",
    mutate(input) {
      input.candidate.builds[0].output = input.candidate.builds[0].output.filter(
        (entry) => entry.path !== "bellows/recommendations"
      );
    },
    expectOk: false,
    expectReason: "MISSING_CANDIDATE_OUTPUT_ROUTE"
  },
  {
    name: "missing app path fails closed",
    mutate(input) {
      delete input.appPathsManifest["/bellows/intake/page"];
    },
    expectOk: false,
    expectReason: "MISSING_APP_PATH"
  },
  {
    name: "missing Profile app path fails closed",
    mutate(input) {
      delete input.appPathsManifest["/dashboard/profile/page"];
    },
    expectOk: false,
    expectReason: "MISSING_APP_PATH"
  },
  {
    name: "missing verification candidate route fails closed",
    mutate(input) {
      input.candidate.builds[0].output = input.candidate.builds[0].output.filter(
        (entry) => entry.path !== "api/verification/funds/exchange"
      );
    },
    expectOk: false,
    expectReason: "MISSING_CANDIDATE_OUTPUT_ROUTE"
  },
  {
    name: "non-READY candidate fails closed",
    mutate(input) {
      input.candidate.readyState = "BUILDING";
    },
    expectOk: false,
    expectReason: "CANDIDATE_NOT_READY"
  },
  {
    name: "wrong candidate name fails closed",
    mutate(input) {
      input.candidate.name = "other-project";
    },
    expectOk: false,
    expectReason: "CANDIDATE_NAME_MISMATCH"
  },
  {
    name: "production target cannot bypass preview proof",
    mutate(input) {
      input.candidate.target = "production";
    },
    expectOk: false,
    expectReason: "CANDIDATE_TARGET_MISMATCH"
  }
];

const failures = [];

for (const testCase of cases) {
  try {
    const input = completeFixture();
    testCase.mutate(input);
    const result = evaluateProductionReleaseIntegrity(input);
    assert.equal(result.ok, testCase.expectOk, `${testCase.name}: ok mismatch`);

    const reasonCodes = result.receipt.reasons.map((reason) => reason.code);
    if (testCase.expectReason) {
      assert.ok(reasonCodes.includes(testCase.expectReason), `${testCase.name}: missing ${testCase.expectReason}`);
      assert.equal(result.receipt.result, "STOP", `${testCase.name}: expected STOP receipt`);
    } else {
      assert.deepEqual(reasonCodes, [], `${testCase.name}: unexpected reasons`);
      assert.equal(result.receipt.result, "PASS", `${testCase.name}: expected PASS receipt`);
      assert.ok(Object.values(result.receipt.checks).every(Boolean), `${testCase.name}: an acceptance check was false`);
      assert.equal(
        result.receipt.evidence.candidate_deployment_id,
        approvedDeploymentId,
        `${testCase.name}: candidate deployment ID missing from receipt`
      );
      assert.equal(
        result.receipt.evidence.source_sha,
        approvedSha,
        `${testCase.name}: source SHA missing from receipt`
      );
      assert.equal(
        result.receipt.evidence.candidate_http_deployment_id,
        approvedDeploymentId,
        `${testCase.name}: HTTP evidence deployment ID missing from receipt`
      );
      assert.equal(
        result.receipt.evidence.candidate_http_boundary_count,
        contract.required_candidate_http_boundaries.length,
        `${testCase.name}: HTTP boundary count missing from receipt`
      );
    }

    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push(`${testCase.name}: ${error.message}`);
    console.log(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures.length) {
  console.error("PRODUCTION_RELEASE_INTEGRITY_GUARD_SMOKE: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("PRODUCTION_RELEASE_INTEGRITY_GUARD_SMOKE: PASS");
