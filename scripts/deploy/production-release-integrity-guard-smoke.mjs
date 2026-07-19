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

function completeFixture() {
  return {
    contract,
    dirty: false,
    headSha: approvedSha,
    approvedSha,
    appPathsManifest: Object.fromEntries(contract.required_app_paths.map((route) => [route, `server${route}.js`])),
    candidate: {
      name: contract.candidate.name,
      target: contract.candidate.target,
      readyState: contract.candidate.ready_state,
      builds: [
        {
          output: contract.required_candidate_output_routes.map((route) => ({ path: route, type: "lambda" }))
        }
      ]
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
