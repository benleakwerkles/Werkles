#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const historicalPath =
  "foreman/receipts/WERKLES_VPG44_LADY_JESSICA_BROWSER_RED_TEAM_RESULTS_20260724.json";
const currentPath =
  "foreman/receipts/WERKLES_VPG48_LADY_JESSICA_BROWSER_ACCEPTANCE_RESULTS_20260725.json";
const harnessPath =
  "scripts/foreman/test-public-tester-browser-red-team-vpg44-20260724.mjs";

const historical = JSON.parse(readFileSync(historicalPath, "utf8"));
const current = JSON.parse(readFileSync(currentPath, "utf8"));
const harness = readFileSync(harnessPath, "utf8");
const historicalHarness = execFileSync(
  "git",
  ["show", `bd24b45d3a01b51ee05c951d5f96e1bac6398686:${harnessPath}`],
  { encoding: "utf8" }
);
const checks = [];

function check(id, condition, evidence = null) {
  checks.push({ id, passed: Boolean(condition), evidence });
  assert.ok(condition, id);
}

function labels(testCase) {
  return testCase.assertions.map((assertion) => assertion.label);
}

function normalizedCurrentCaseName(name) {
  return name.replace(/^(desktop|mobile)-/, "");
}

const currentIdea1 = current.ideas.find((idea) => idea.idea === 1);
const currentIdea2 = current.ideas.find((idea) => idea.idea === 2);

function staticCheckLabels(source) {
  return [...source.matchAll(/\bcheck\(\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]);
}

check("current verdict passes", current.summary.verdict === "PASS", current.summary);
check("current suite has zero failures", current.summary.failureCount === 0, current.summary);
check("current suite covers two viewports", current.summary.viewportCount === 2, current.viewports);
check("current suite covers fourteen cases", current.summary.caseCount === 14, current.summary);
check("current suite runs 246 assertions", current.summary.assertionCount === 246, current.summary);
check(
  "full journey retains historical case count",
  currentIdea1.cases.length === historical.idea_1.case_count,
  { historical: historical.idea_1.case_count, current: currentIdea1.cases.length }
);

const instrumentationLabels = new Set([
  "headless-only delivery instrumentation activated",
  "headless-only recovery instrumentation activated"
]);
const oldStaticLabels = new Set(staticCheckLabels(historicalHarness));
const currentStaticLabels = new Set(staticCheckLabels(harness));
const removedProductLabels = [...oldStaticLabels].filter(
  (label) => !instrumentationLabels.has(label) && !currentStaticLabels.has(label)
);
check("no historical product assertion label was removed", removedProductLabels.length === 0, removedProductLabels);

const expectedSeamLabel = new Map([
  [
    "abort-then-retry-recovery",
    "supported synthetic auth recovery seam carries GET bearer requests without compiled-chunk interception"
  ]
]);
let mappedPersonalCases = 0;
let seamAssertionCount = 0;
let bearerAssertionCount = 0;
const historicalPersonalCaseNames = new Set(
  historical.idea_2.cases.map((entry) => entry.name)
);
const currentPersonalCaseMultiplicity = new Map();

for (const currentCase of currentIdea2.cases) {
  const normalized = normalizedCurrentCaseName(currentCase.case);
  check(
    `personal case maps to historical behavior: ${currentCase.case}`,
    historicalPersonalCaseNames.has(normalized)
  );
  currentPersonalCaseMultiplicity.set(
    normalized,
    (currentPersonalCaseMultiplicity.get(normalized) ?? 0) + 1
  );
  mappedPersonalCases += 1;
  const currentLabels = labels(currentCase);
  const seamLabel =
    expectedSeamLabel.get(normalized) ??
    "supported synthetic auth seam carries GET bearer request without compiled-chunk interception";
  check(`supported seam assertion present: ${currentCase.case}`, currentLabels.includes(seamLabel));
  const seamAssertion = currentCase.assertions.find((entry) => entry.label === seamLabel);
  check(`supported seam assertion passes: ${currentCase.case}`, seamAssertion?.passed === true);
  check(
    `compiled chunk interception is zero: ${currentCase.case}`,
    seamAssertion?.evidence?.compiledChunkInterceptionCount === 0,
    seamAssertion?.evidence
  );
  check(
    `bearer credential is exact: ${currentCase.case}`,
    seamAssertion?.evidence?.bearerCredentialMatches?.every(Boolean) === true,
    seamAssertion?.evidence?.bearerCredentialMatches
  );
  seamAssertionCount += 1;
  bearerAssertionCount += seamAssertion?.evidence?.bearerCredentialMatches?.length ?? 0;
}

check("all twelve personal cases map to historical behavior", mappedPersonalCases === 12, mappedPersonalCases);
check(
  "every historical personal case runs on desktop and mobile",
  [...historicalPersonalCaseNames].every(
    (name) => currentPersonalCaseMultiplicity.get(name) === 2
  ),
  Object.fromEntries(currentPersonalCaseMultiplicity)
);
check("twelve supported seam assertions pass", seamAssertionCount === 12, seamAssertionCount);
check("fourteen bearer requests are exact", bearerAssertionCount === 14, bearerAssertionCount);
check(
  "harness no longer defines compiled chunk patching",
  !harness.includes("installPersonalDeliveryTestInstrumentation") &&
    !harness.includes("configNeedle") &&
    !harness.includes("sessionNeedle") &&
    !harness.includes("**/_next/static/chunks/app/bellows/recommendations/page-*.js")
);
check(
  "runtime is exact non-3000 build",
  current.runtimeCustody.port !== 3000 &&
    current.runtimeCustody.buildId === "8Mabi-W8b-FQcfFBl1avl" &&
    current.runtimeCustody.port3000Touched === false,
  current.runtimeCustody
);

const output = {
  schema: "werkles.vpg48-current-browser-acceptance-custody/v1",
  cycle_id: "WERKLES-FLOCK-20260725-013031-ET-BETSY-01",
  historical_assertions: historical.summary.assertion_count,
  current_assertions: current.summary.assertionCount,
  current_cases: current.summary.caseCount,
  mapped_personal_cases: mappedPersonalCases,
  supported_seam_assertions: seamAssertionCount,
  bearer_requests_verified: bearerAssertionCount,
  check_count: checks.length,
  failure_count: checks.filter((entry) => !entry.passed).length,
  result: checks.every((entry) => entry.passed) ? "PASS" : "FAIL"
};

console.log(JSON.stringify(output, null, 2));
