#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  VPG48_CYCLE_ID,
  evaluateVpg48SupportedSeamCustody
} from "./vpg48-supported-seam-custody-guard-20260725.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg48-ender-supported-seam-auth-data-contract-20260725.json";
const fixture = JSON.parse(
  readFileSync(path.join(root, fixturePath), "utf8")
);

function clone(value) {
  return structuredClone(value);
}

function mutate(source, pathParts, value) {
  const next = clone(source);
  let cursor = next;
  for (const part of pathParts.slice(0, -1)) cursor = cursor[part];
  cursor[pathParts.at(-1)] = value;
  return next;
}

const baseline = fixture.custody;
const attacks = [
  {
    name: "production-environment",
    input: mutate(baseline, ["runtimeEnvironment"], "production"),
    reason: "LOCAL_TEST_ENVIRONMENT_REQUIRED"
  },
  {
    name: "non-loopback-origin",
    input: mutate(
      mutate(baseline, ["candidate", "expectedOrigin"], "https://werkles.com"),
      ["candidate", "observedOrigin"],
      "https://werkles.com"
    ),
    reason: "LOOPBACK_REQUIRED"
  },
  {
    name: "implicit-default-port",
    input: mutate(
      mutate(baseline, ["candidate", "expectedOrigin"], "http://localhost"),
      ["candidate", "observedOrigin"],
      "http://localhost"
    ),
    reason: "EXPLICIT_ISOLATED_PORT_REQUIRED"
  },
  {
    name: "port-3000-target",
    input: mutate(
      mutate(
        mutate(baseline, ["candidate", "expectedOrigin"], "http://127.0.0.1:3000"),
        ["candidate", "observedOrigin"],
        "http://127.0.0.1:3000"
      ),
      ["network", "allowedOrigins"],
      ["http://127.0.0.1:3000", "https://vpg48-local-only.supabase.co"]
    ),
    reason: "PORT_3000_FORBIDDEN"
  },
  {
    name: "observed-origin-mismatch",
    input: mutate(
      baseline,
      ["candidate", "observedOrigin"],
      "http://127.0.0.1:31249"
    ),
    reason: "OBSERVED_ORIGIN_MISMATCH"
  },
  {
    name: "pid-mismatch",
    input: mutate(baseline, ["candidate", "observedPid"], 48124),
    reason: "PID_CUSTODY_MISMATCH"
  },
  {
    name: "build-mismatch",
    input: mutate(
      baseline,
      ["candidate", "observedBuildId"],
      "different-build"
    ),
    reason: "BUILD_CUSTODY_MISMATCH"
  },
  {
    name: "live-supabase-origin",
    input: mutate(
      baseline,
      ["syntheticSupabase", "origin"],
      "https://real-project.supabase.co"
    ),
    reason: "SYNTHETIC_ORIGIN_REQUIRED"
  },
  {
    name: "non-synthetic-key",
    input: mutate(
      baseline,
      ["syntheticSupabase", "anonKey"],
      "production-looking-key"
    ),
    reason: "SYNTHETIC_ANON_KEY_REQUIRED"
  },
  {
    name: "non-synthetic-credential",
    input: mutate(
      baseline,
      ["syntheticSupabase", "nonSyntheticCredentialCount"],
      1
    ),
    reason: "NON_SYNTHETIC_CREDENTIAL_FORBIDDEN"
  },
  {
    name: "external-origin-allowlisted",
    input: mutate(baseline, ["network", "allowedOrigins"], [
      "http://127.0.0.1:31248",
      "https://vpg48-local-only.supabase.co",
      "https://example.com"
    ]),
    reason: "NETWORK_ALLOWLIST_MISMATCH"
  },
  {
    name: "network-fallthrough-continues",
    input: mutate(baseline, ["network", "fallthrough"], "continue"),
    reason: "NETWORK_FALLTHROUGH_MUST_ABORT"
  },
  {
    name: "overbroad-interception",
    input: mutate(baseline, ["network", "interceptions"], [
      {
        pattern: "**/*",
        method: "ANY",
        action: "fulfill",
        boundary: "unbounded"
      }
    ]),
    reason: "INTERCEPTION_SCOPE_MISMATCH"
  },
  {
    name: "compiled-chunk-rewrite",
    input: mutate(
      baseline,
      ["implementation", "compiledChunkRewrite"],
      true
    ),
    reason: "COMPILED_CHUNK_REWRITE_FORBIDDEN"
  },
  {
    name: "compiled-chunk-route",
    input: mutate(baseline, ["implementation", "compiledChunkRoutes"], [
      "**/_next/static/chunks/**"
    ]),
    reason: "COMPILED_CHUNK_ROUTE_FORBIDDEN"
  },
  {
    name: "minified-source-needle",
    input: mutate(baseline, ["implementation", "sourceNeedles"], [
      "if(!(0,b.J)())"
    ]),
    reason: "SOURCE_NEEDLE_FORBIDDEN"
  },
  {
    name: "product-bypass",
    input: mutate(baseline, ["implementation", "productBypass"], true),
    reason: "PRODUCT_BYPASS_FORBIDDEN"
  },
  {
    name: "product-file-modified",
    input: mutate(baseline, ["implementation", "productFilesModified"], [
      "components/squibb/personal-recommendation-delivery.tsx"
    ]),
    reason: "PRODUCT_MODIFICATION_FORBIDDEN"
  },
  {
    name: "port-3000-touched",
    input: mutate(baseline, ["port3000", "touched"], true),
    reason: "PORT_3000_CUSTODY_VIOLATION"
  },
  {
    name: "not-test-only",
    input: mutate(baseline, ["testOnly"], false),
    reason: "TEST_ONLY_REQUIRED"
  }
];

const baselineEvaluation = evaluateVpg48SupportedSeamCustody(baseline);
const attackResults = attacks.map((attack) => {
  const evaluation = evaluateVpg48SupportedSeamCustody(attack.input);
  return {
    name: attack.name,
    blocked: evaluation.allowed === false,
    expectedReason: attack.reason,
    reasonObserved: evaluation.reasons.some(
      (entry) => entry.code === attack.reason
    ),
    reasons: evaluation.reasons.map((entry) => entry.code)
  };
});
const failures = [];
if (!baselineEvaluation.allowed) {
  failures.push({
    name: "canonical-supported-seam-custody",
    reasons: baselineEvaluation.reasons
  });
}
for (const attack of attackResults) {
  if (!attack.blocked || !attack.reasonObserved) failures.push(attack);
}

const result = {
  schema: "werkles.vpg48-ender-supported-seam-custody-result/v1",
  cycleId: VPG48_CYCLE_ID,
  legacyLabel: "VPG48",
  seat: "Ender@Betsy",
  fixture: fixturePath,
  baseline: {
    allowed: baselineEvaluation.allowed,
    reasons: baselineEvaluation.reasons
  },
  attackCount: attackResults.length,
  blockedAttackCount: attackResults.filter(
    (attack) => attack.blocked && attack.reasonObserved
  ).length,
  bypassCount: attackResults.filter(
    (attack) => !attack.blocked || !attack.reasonObserved
  ).length,
  attacks: attackResults,
  failureCount: failures.length,
  failures,
  pass: failures.length === 0
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
