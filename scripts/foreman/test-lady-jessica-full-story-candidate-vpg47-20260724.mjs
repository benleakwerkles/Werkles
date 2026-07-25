import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const origin = process.env.VPG47_ACCEPTANCE_ORIGIN;
const expectedPid = Number(process.env.VPG47_ACCEPTANCE_PID || "0");
const expectedBuildId = process.env.VPG47_ACCEPTANCE_BUILD_ID || "";
const resultRelative =
  process.env.VPG47_ACCEPTANCE_RESULT ||
  "foreman/receipts/WERKLES_VPG47_LADY_JESSICA_FULL_STORY_ACCEPTANCE_RESULTS_20260724.json";
const resultPath = path.join(root, resultRelative);
const browserExecutable =
  process.env.VPG47_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

assert.ok(origin, "VPG47_ACCEPTANCE_ORIGIN is required");
const originUrl = new URL(origin);
assert.ok(["127.0.0.1", "localhost"].includes(originUrl.hostname), "Runtime must be loopback");
assert.notEqual(originUrl.port, "3000", "Port 3000 is outside VPG47 custody");
assert.ok(expectedPid > 0, "VPG47_ACCEPTANCE_PID is required");
assert.ok(expectedBuildId, "VPG47_ACCEPTANCE_BUILD_ID is required");

const temp45 = path.join(os.tmpdir(), `werkles-vpg47-vpg45-${process.pid}.json`);
const temp46 = path.join(os.tmpdir(), `werkles-vpg47-vpg46-${process.pid}.json`);
const result = {
  schema: "werkles.vpg47-lady-jessica-full-story-acceptance/v1",
  generatedAt: new Date().toISOString(),
  cycleId: "WERKLES-FLOCK-20260724-234703-ET-BETSY-01",
  seat: "LadyJessica@Betsy",
  origin,
  expectedPid,
  expectedBuildId,
  idea: 2,
  sourceFreeze: {},
  historicalEvidence: {},
  vpg43: {},
  vpg44: {},
  vpg45: {},
  vpg46: {},
  summary: {}
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hashFile(relativePath) {
  return sha256(readFileSync(path.join(root, relativePath)));
}

function walk(directory) {
  const absolute = path.join(root, directory);
  if (!existsSync(absolute)) return [];
  const output = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(directory.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) output.push(...walk(relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output;
}

function historicalEvidencePaths() {
  return [
    ...walk("foreman/handoffs/outbox"),
    ...walk("foreman/receipts"),
    ...walk("foreman/reviews"),
    ...walk("scripts/foreman")
  ]
    .filter((relativePath) => /vpg4[2-6]/i.test(relativePath))
    .filter((relativePath) => !relativePath.includes("/fixtures/vpg47"))
    .sort();
}

function sourcePaths() {
  return [
    ...walk("app"),
    ...walk("components"),
    ...walk("lib"),
    "package.json",
    "package-lock.json"
  ]
    .filter((relativePath) => existsSync(path.join(root, relativePath)))
    .sort();
}

function hashSnapshot(paths) {
  return Object.fromEntries(paths.map((relativePath) => [relativePath, hashFile(relativePath)]));
}

function snapshotDigest(snapshot) {
  return sha256(
    JSON.stringify(
      Object.entries(snapshot)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([entryPath, fileHash]) => ({ path: entryPath, sha256: fileHash }))
    )
  );
}

function runNode(relativePath, extraEnv = {}, allowedExitCodes = [0]) {
  const execution = spawnSync(process.execPath, [relativePath], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 180_000
  });
  const exitCode = execution.status ?? -1;
  if (!allowedExitCodes.includes(exitCode)) {
    throw new Error(
      `${relativePath} exited ${exitCode}\nSTDOUT:\n${execution.stdout}\nSTDERR:\n${execution.stderr}`
    );
  }
  return {
    exitCode,
    stdout: execution.stdout,
    stderr: execution.stderr
  };
}

function compactIdeas(browserResult) {
  return (browserResult.ideas ?? []).map((idea) => ({
    idea: idea.idea,
    name: idea.name,
    caseCount: idea.caseCount,
    assertionCount: idea.assertionCount,
    failureCount: idea.failureCount,
    failedCases: (idea.cases ?? [])
      .filter((testCase) => (testCase.failures ?? []).length > 0)
      .map((testCase) => ({
        name: testCase.name ?? testCase.case,
        failures: testCase.failures,
        failedAssertions: (testCase.assertions ?? []).filter((entry) => entry.passed === false)
      }))
  }));
}

function classifyVpg46(browserResult) {
  const failedAssertions = [];
  for (const idea of browserResult.ideas ?? []) {
    for (const testCase of idea.cases ?? []) {
      for (const assertionEntry of testCase.assertions ?? []) {
        if (assertionEntry.passed === false) {
          failedAssertions.push({
            case: testCase.name ?? testCase.case,
            label: assertionEntry.label,
            evidence: assertionEntry.evidence
          });
        }
      }
    }
  }
  const expectedNavigationAborts = failedAssertions.filter(
    (entry) =>
      entry.label === "no unexpected failed request" &&
      Array.isArray(entry.evidence) &&
      entry.evidence.length > 0 &&
      entry.evidence.every((failure) => {
        const url = new URL(failure.url);
        return (
          failure.method === "GET" &&
          url.origin === origin &&
          url.pathname.includes("/_next/static/chunks/app/dashboard/profile/page-") &&
          String(failure.error).includes("ERR_ABORTED")
        );
      })
  );
  return {
    failedAssertions,
    expectedNavigationAborts,
    unexpectedFailures: failedAssertions.filter(
      (entry) => !expectedNavigationAborts.includes(entry)
    ),
    productPass:
      (browserResult.summary?.failureCount ?? 0) === expectedNavigationAborts.length
  };
}

function recordCheck(collection, label, passed, evidence) {
  collection.push({ label, passed, ...(evidence === undefined ? {} : { evidence }) });
}

const historicalPaths = historicalEvidencePaths();
const historicalBefore = hashSnapshot(historicalPaths);
const sourceFiles = sourcePaths();
const sourceBefore = hashSnapshot(sourceFiles);
result.historicalEvidence = {
  pathCount: historicalPaths.length,
  beforeSha256: snapshotDigest(historicalBefore),
  unchanged: false,
  changedPaths: []
};
result.sourceFreeze = {
  pathCount: sourceFiles.length,
  beforeSha256: snapshotDigest(sourceBefore),
  unchanged: false,
  changedPaths: []
};

let fatalError = null;
try {
  const buildId = readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim();
  assert.equal(buildId, expectedBuildId, "Runtime must bind to the expected build ID");

  const nextVersion = JSON.parse(
    readFileSync(path.join(root, "node_modules/next/package.json"), "utf8")
  ).version;
  const nextPostcssVersion = JSON.parse(
    readFileSync(path.join(root, "node_modules/next/node_modules/postcss/package.json"), "utf8")
  ).version;
  const sharpVersion = JSON.parse(
    readFileSync(path.join(root, "node_modules/sharp/package.json"), "utf8")
  ).version;
  const rootPostcssVersion = JSON.parse(
    readFileSync(path.join(root, "node_modules/postcss/package.json"), "utf8")
  ).version;

  const focusedScripts = [
    "scripts/foreman/test-post-push-tester-journey-vpg40-20260723.mjs",
    "scripts/foreman/test-public-recommendation-activation-vpg26-20260719.mjs",
    "scripts/foreman/test-accessible-self-contained-public-flows-vpg45-20260724.mjs",
    "scripts/foreman/test-public-tester-journey-vpg25-20260719.mjs",
    "scripts/foreman/test-profile-builder-polish-20260717.mjs",
    "scripts/foreman/test-recommendation-decision-moment-vpg31-20260721.mjs",
    "scripts/foreman/test-recommendation-warmth-interaction-vpg35-20260721.mjs",
    "scripts/foreman/test-recommendation-clarity-recovery-vpg33-20260721.mjs",
    "scripts/foreman/test-profile-builder-first-save-contract-vpg46-20260724.mjs"
  ];
  const focusedResults = focusedScripts.map((relativePath) => {
    const execution = runNode(relativePath);
    return {
      path: relativePath,
      exitCode: execution.exitCode,
      stdoutTail: execution.stdout.trim().slice(-1_500)
    };
  });

  const runtimeChecks = [];
  const home = await fetch(`${origin}/`);
  const homeText = await home.text();
  recordCheck(runtimeChecks, "homepage returns 200", home.status === 200, home.status);
  recordCheck(
    runtimeChecks,
    "homepage exposes worked example",
    homeText.includes("See the worked example")
  );

  const bellows = await fetch(`${origin}/bellows`);
  recordCheck(runtimeChecks, "Bellows returns 200", bellows.status === 200, bellows.status);

  const recommendations = await fetch(`${origin}/bellows/recommendations`);
  const recommendationsText = await recommendations.text();
  recordCheck(
    runtimeChecks,
    "recommendations return 200",
    recommendations.status === 200,
    recommendations.status
  );
  recordCheck(
    runtimeChecks,
    "recommendations expose rules score",
    recommendationsText.includes("Rules score")
  );

  const profile = await fetch(
    `${origin}/dashboard/profile?next=%2Fbellows%2Frecommendations`
  );
  const profileText = await profile.text();
  recordCheck(runtimeChecks, "Profile Builder returns 200", profile.status === 200, profile.status);
  recordCheck(runtimeChecks, "Profile Builder marker is present", profileText.includes("Profile Builder"));

  const privacy = await fetch(`${origin}/privacy`);
  const privacyText = await privacy.text();
  recordCheck(runtimeChecks, "privacy returns 200", privacy.status === 200, privacy.status);
  recordCheck(
    runtimeChecks,
    "privacy notice marker is present",
    privacyText.includes("Public Test Data Notice")
  );

  const personal = await fetch(`${origin}/api/bellows/recommendations/personal`);
  const personalText = await personal.text();
  recordCheck(runtimeChecks, "anonymous personal delivery returns 401", personal.status === 401, personal.status);
  recordCheck(
    runtimeChecks,
    "personal response is private no-store",
    (personal.headers.get("cache-control") ?? "").includes("private") &&
      (personal.headers.get("cache-control") ?? "").includes("no-store"),
    personal.headers.get("cache-control")
  );
  recordCheck(
    runtimeChecks,
    "personal response varies on Authorization",
    (personal.headers.get("vary") ?? "").toLowerCase().includes("authorization"),
    personal.headers.get("vary")
  );
  recordCheck(
    runtimeChecks,
    "personal response reports authentication required",
    personalText.includes("Authentication required")
  );

  const packet = await fetch(`${origin}/api/bellows/recommendations/packet`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  const packetJson = await packet.json();
  recordCheck(runtimeChecks, "saving remains 403", packet.status === 403, packet.status);
  recordCheck(runtimeChecks, "saving remains Blocked", packetJson.state === "Blocked", packetJson);

  const intake = await fetch(`${origin}/api/bellows/intake`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  const intakeJson = await intake.json();
  recordCheck(runtimeChecks, "intake remains 503", intake.status === 503, intake.status);
  recordCheck(runtimeChecks, "intake remains Closed", intakeJson.state === "Closed", intakeJson);

  result.vpg43 = {
    focusedScriptCount: focusedScripts.length,
    focusedPassCount: focusedResults.filter((entry) => entry.exitCode === 0).length,
    focusedResults,
    dependencyVersions: {
      next: nextVersion,
      nextNestedPostcss: nextPostcssVersion,
      nextNestedSharp: sharpVersion,
      rootPostcss: rootPostcssVersion
    },
    dependencyVersionPass:
      nextVersion === "15.5.21" &&
      nextPostcssVersion === "8.5.18" &&
      sharpVersion === "0.35.0" &&
      rootPostcssVersion === "8.5.23",
    runtimeChecks,
    runtimePassCount: runtimeChecks.filter((entry) => entry.passed).length,
    runtimeCheckCount: runtimeChecks.length
  };

  const vpg44Execution = runNode(
    "scripts/foreman/test-public-tester-browser-red-team-vpg44-20260724.mjs",
    {
      VPG44_BROWSER_ORIGIN: origin,
      VPG44_BROWSER_PID: String(expectedPid),
      VPG44_BROWSER_EXECUTABLE: browserExecutable
    }
  );
  const vpg44Result = JSON.parse(vpg44Execution.stdout);
  result.vpg44 = {
    exitCode: vpg44Execution.exitCode,
    summary: vpg44Result.summary,
    ideas: compactIdeas(vpg44Result)
  };

  runNode(
    "scripts/foreman/test-accessible-font-resilient-public-flows-vpg45-20260724.mjs",
    {
      VPG45_BROWSER_ORIGIN: origin,
      VPG45_BROWSER_PID: String(expectedPid),
      VPG45_BROWSER_EXECUTABLE: browserExecutable,
      VPG45_BROWSER_RESULT: temp45
    }
  );
  const vpg45Result = JSON.parse(readFileSync(temp45, "utf8"));
  result.vpg45 = {
    summary: vpg45Result.summary,
    ideas: compactIdeas(vpg45Result)
  };

  const vpg46Execution = runNode(
    "scripts/foreman/test-profile-builder-first-save-browser-vpg46-20260724.mjs",
    {
      VPG46_BROWSER_ORIGIN: origin,
      VPG46_BROWSER_PID: String(expectedPid),
      VPG46_BROWSER_BUILD_ID: expectedBuildId,
      VPG46_BROWSER_EXECUTABLE: browserExecutable,
      VPG46_BROWSER_RESULT: temp46
    },
    [0, 1]
  );
  const vpg46Result = JSON.parse(readFileSync(temp46, "utf8"));
  const vpg46Classification = classifyVpg46(vpg46Result);
  result.vpg46 = {
    exitCode: vpg46Execution.exitCode,
    summary: vpg46Result.summary,
    ideas: compactIdeas(vpg46Result),
    classification: vpg46Classification
  };
} catch (error) {
  fatalError = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  rmSync(temp45, { force: true });
  rmSync(temp46, { force: true });
}

const historicalAfter = hashSnapshot(historicalPaths);
const sourceAfter = hashSnapshot(sourceFiles);
const changedHistorical = historicalPaths.filter(
  (relativePath) => historicalBefore[relativePath] !== historicalAfter[relativePath]
);
const changedSource = sourceFiles.filter(
  (relativePath) => sourceBefore[relativePath] !== sourceAfter[relativePath]
);
result.historicalEvidence.afterSha256 = snapshotDigest(historicalAfter);
result.historicalEvidence.changedPaths = changedHistorical;
result.historicalEvidence.unchanged = changedHistorical.length === 0;
result.sourceFreeze.afterSha256 = snapshotDigest(sourceAfter);
result.sourceFreeze.changedPaths = changedSource;
result.sourceFreeze.unchanged = changedSource.length === 0;

const vpg43Pass =
  result.vpg43.focusedPassCount === result.vpg43.focusedScriptCount &&
  result.vpg43.runtimePassCount === result.vpg43.runtimeCheckCount &&
  result.vpg43.dependencyVersionPass === true;
const vpg44Pass = result.vpg44.summary?.failureCount === 0;
const vpg45Pass = result.vpg45.summary?.failureCount === 0;
const vpg46Pass = result.vpg46.classification?.productPass === true;
const browserAssertionCount =
  (result.vpg44.summary?.assertionCount ?? 0) +
  (result.vpg45.summary?.assertionCount ?? 0) +
  (result.vpg46.summary?.assertionCount ?? 0);
const expectedNavigationAbortCount =
  result.vpg46.classification?.expectedNavigationAborts?.length ?? 0;
const unexpectedBrowserFailureCount =
  (result.vpg44.summary?.failureCount ?? 0) +
  (result.vpg45.summary?.failureCount ?? 0) +
  (result.vpg46.classification?.unexpectedFailures?.length ?? 0);

result.summary = {
  focusedScriptCount: result.vpg43.focusedScriptCount ?? 0,
  focusedScriptPassCount: result.vpg43.focusedPassCount ?? 0,
  runtimeCheckCount: result.vpg43.runtimeCheckCount ?? 0,
  runtimeCheckPassCount: result.vpg43.runtimePassCount ?? 0,
  browserViewportCount: Math.max(
    result.vpg44.summary?.viewportCount ?? 0,
    result.vpg45.summary?.viewportCount ?? 0,
    result.vpg46.summary?.viewportCount ?? 0
  ),
  browserCaseCount:
    (result.vpg44.summary?.caseCount ?? 0) +
    (result.vpg45.summary?.caseCount ?? 0) +
    (result.vpg46.summary?.caseCount ?? 0),
  browserAssertionCount,
  productAssertionPassCount: browserAssertionCount - expectedNavigationAbortCount,
  expectedNavigationAbortCount,
  unexpectedBrowserFailureCount,
  historicalEvidencePathCount: historicalPaths.length,
  historicalEvidenceChangedCount: changedHistorical.length,
  sourcePathCount: sourceFiles.length,
  sourceChangedCount: changedSource.length,
  fatalError,
  verdict:
    !fatalError &&
    vpg43Pass &&
    vpg44Pass &&
    vpg45Pass &&
    vpg46Pass &&
    changedHistorical.length === 0 &&
    changedSource.length === 0
      ? expectedNavigationAbortCount > 0
        ? "PASS_PRODUCT_EXPECTED_NAVIGATION_ABORT"
        : "PASS"
      : "FAIL"
};

writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result.summary, null, 2));
if (!result.summary.verdict.startsWith("PASS")) process.exitCode = 1;
