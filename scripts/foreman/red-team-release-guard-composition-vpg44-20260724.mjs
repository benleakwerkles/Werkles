#!/usr/bin/env node

import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateAliasGuard,
  REQUIRED_ALIAS_GATE
} from "../deploy/deploy-alias-guard.mjs";
import { evaluateProductionReleaseIntegrity } from "../deploy/production-release-integrity-guard.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const expectSecure = process.argv.includes("--expect-secure");
const contract = JSON.parse(
  readFileSync(path.join(repoRoot, "deploy/production-release-contract.json"), "utf8")
);

const candidateSha = "67c38ace103ba5f1ba473b984c91e243d9120630";
const candidateDeploymentId = "dpl_9KrWte1jcoMSDVHEXdK2MQg6QhMd";
const productionDeploymentId = "dpl_4Psq6XYTVxrCNSWdTebByJY8LzUn";

function completeReleaseFixture() {
  return {
    contract,
    dirty: false,
    headSha: candidateSha,
    approvedSha: candidateSha,
    approvedDeploymentId: candidateDeploymentId,
    productionDeploymentId,
    appPathsManifest: Object.fromEntries(
      contract.required_app_paths.map((route) => [route, `server${route}.js`])
    ),
    candidate: {
      id: candidateDeploymentId,
      name: contract.candidate.name,
      target: contract.candidate.target,
      readyState: contract.candidate.ready_state,
      builds: [
        {
          output: contract.required_candidate_output_routes.map((route) => ({
            path: route,
            type: "lambda"
          }))
        }
      ]
    },
    provenance: {
      id: candidateDeploymentId,
      gitSource: {
        type: contract.provenance_source.type,
        repoId: 1,
        sha: candidateSha
      },
      meta: {
        githubCommitOrg: contract.provenance_source.github_org,
        githubCommitRepo: contract.provenance_source.github_repo
      }
    },
    candidateHttpBoundaries: {
      deployment_id: candidateDeploymentId,
      responses: contract.required_candidate_http_boundaries.map((boundary) => ({
        method: boundary.method,
        path: boundary.path,
        status: boundary.status,
        headers: boundary.headers ? { ...boundary.headers } : {},
        json: boundary.json ? structuredClone(boundary.json) : undefined
      }))
    },
    audienceHttpBoundaries: {
      candidate_deployment_id: candidateDeploymentId,
      production_deployment_id: productionDeploymentId,
      responses: contract.required_audience_http_boundaries.map((boundary) => ({
        audience: boundary.audience,
        method: boundary.method,
        path: boundary.path,
        status: boundary.status,
        headers: {
          ...(boundary.headers ?? {}),
          ...Object.fromEntries(
            Object.entries(boundary.header_prefixes ?? {}).map(([name, prefix]) => [
              name,
              `${prefix}?vpg44=1`
            ])
          )
        }
      }))
    }
  };
}

function workflowEvidence() {
  const workflowRoot = path.join(repoRoot, ".github", "workflows");
  const names = readdirSync(workflowRoot).filter((name) => /\.ya?ml$/i.test(name));
  const requiredTokens = [
    "deploy:alias-guard",
    "deploy:release-guard",
    "flock:cycle-guard",
    "harvey-public-coexistence"
  ];
  const files = names.map((name) => {
    const text = readFileSync(path.join(workflowRoot, name), "utf8");
    return {
      path: `.github/workflows/${name}`,
      tokens: Object.fromEntries(requiredTokens.map((token) => [token, text.includes(token)]))
    };
  });
  return {
    files,
    has_composed_release_workflow: files.some((entry) =>
      requiredTokens.every((token) => entry.tokens[token])
    )
  };
}

const aliasResult = evaluateAliasGuard({
  deployTarget: "production",
  aliases: ["werkles.com"],
  humanGate: REQUIRED_ALIAS_GATE,
  repoRoot
});
const releaseInput = completeReleaseFixture();
const releaseResult = evaluateProductionReleaseIntegrity(releaseInput);
const workflows = workflowEvidence();

assert.equal(aliasResult.ok, false, "generic Tier 1 token unexpectedly passes alias guard");
assert.equal(releaseResult.ok, true, "control: complete release fixture did not pass");
assert.equal(workflows.has_composed_release_workflow, false, "control: a composed workflow now exists");

const missingReleaseBindings = [
  "branch",
  "cycle_id",
  "j_receipt",
  "durable_human_gate",
  "alias",
  "harvey_disposition",
  "rollback"
].filter((field) => !Object.hasOwn(releaseInput, field));

const proof = {
  schema: "werkles.vpg44-release-guard-composition-red-team/v1",
  cycle_id: "WERKLES-FLOCK-20260724-185700-ET-BETSY-01",
  exact_refs: {
    candidate_sha: candidateSha,
    candidate_deployment_id: candidateDeploymentId,
    production_deployment_id: productionDeploymentId
  },
  finding_1: {
    classification: "REMEDIATED",
    id: "GENERIC_HUMAN_GATE_BEARER_TOKEN",
    expected: "STOP_WITHOUT_DURABLE_GATE_BINDING",
    observed: aliasResult.receipt.alias_guard_result,
    detail:
      "The allowed Production alias now stops when the caller supplies only the generic TIER_1_HUMAN_GATE string; a structured digest binds cycle, candidate deployment, rollback, and aliases."
  },
  finding_2: {
    classification: "PROOF_GAP",
    id: "UNCOMPOSED_RELEASE_CUSTODY_GUARDS",
    expected: "ONE_FAIL_CLOSED_COMPOSITE_RELEASE_DECISION",
    observed: {
      alias_guard: aliasResult.receipt.alias_guard_result,
      release_guard: releaseResult.receipt.result,
      missing_release_bindings: missingReleaseBindings,
      composed_workflow: workflows.has_composed_release_workflow
    },
    detail:
      "Independent PASS receipts do not establish release authority, and no checked workflow composes alias, release, cycle, J, Harvey, and rollback custody."
  },
  failing_case: {
    command:
      "node scripts/foreman/red-team-release-guard-composition-vpg44-20260724.mjs --expect-secure",
    invariant: "aliasResult.ok && releaseResult.ok must never by itself authorize Production alias mutation",
    current_value: aliasResult.ok && releaseResult.ok,
    secure_value: false
  },
  minimal_repair_design: [
    "Add one composite release-custody evaluator that requires exact branch, HEAD, candidate deployment/source, current Production deployment, rollback, alias set, cycle, J receipt, durable Human Gate record, and Harvey disposition.",
    "Replace the generic Human Gate bearer token with a parsed, hash-bound approval artifact whose cycle, phrase, decision, candidate deployment, alias, and rollback match the composite input.",
    "Make the only Production deploy/alias entrypoint invoke the composite evaluator and stop before mutation; add negative smoke cases for token-only, stale gate, wrong branch, wrong deployment, missing J, and unresolved Harvey."
  ],
  workflow_evidence: workflows,
  result: "TOKEN_BYPASS_CLOSED_COMPOSITION_GAP_REMAINS"
};

console.log(JSON.stringify(proof, null, 2));

if (expectSecure) {
  assert.equal(
    aliasResult.ok && releaseResult.ok,
    false,
    "VPG44 release custody: token-only alias PASS plus uncomposed release PASS must not authorize Production"
  );
}
