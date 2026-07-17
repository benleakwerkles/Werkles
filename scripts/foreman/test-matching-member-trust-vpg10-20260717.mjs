/**
 * Focused member-trust and Bellows fail-closed proof.
 * Run: node scripts/foreman/test-matching-member-trust-vpg10-20260717.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

function executeTypeScript(source, dependencies) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (specifier) => {
    assert.ok(Object.hasOwn(dependencies, specifier), `unexpected runtime dependency: ${specifier}`);
    return dependencies[specifier];
  };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const recommendationPage = read("app/bellows/recommendations/page.tsx");
const recommendationSurface = read("components/squibb/recommendation-surface.tsx");
const recommendationBoundary = read("lib/squibb/public-recommendation-session-server.ts");
const recommendationAdapter = read("lib/matching/shadow-to-recommendations.ts");
const intakePage = read("app/bellows/intake/page.tsx");
const intakeForm = read("components/squibb/concierge-intake-form.tsx");
const intakeRoute = read("app/api/bellows/intake/route.ts");
const availability = read("lib/squibb/concierge-intake-availability.ts");

for (const [name, source] of Object.entries({
  recommendationPage,
  recommendationSurface,
  recommendationBoundary,
  recommendationAdapter,
  intakePage,
  intakeForm,
  intakeRoute
})) {
  assert.doesNotMatch(source, /Autonomous Matching/i, `${name} must not expose the autonomous product claim`);
}

assert.match(recommendationPage, /Werkles Recommendations/);
assert.match(recommendationSurface, /One possible next move, explained\./);
assert.match(recommendationBoundary, /Rules-based recommendation example/);
assert.match(recommendationAdapter, /Werkles rules-based recommendation/);
assert.match(availability, /BELLOWS_INTAKE_SUBMISSION_OPEN = false/);
assert.match(intakePage, /submission is temporarily closed/i);
assert.match(intakePage, /walkthrough stays example-only and does not load anything typed here/);
assert.match(intakeForm, /Nothing you type here is saved or sent/);
assert.match(intakeForm, /No automatic contact/);
assert.doesNotMatch(intakeForm, /No matching\. No profiles\.|shadow until go-live/i);

const requestStart = intakeForm.indexOf("const response = await fetch");
const errorBranch = intakeForm.indexOf("if (!response.ok)");
const successCommit = intakeForm.indexOf("setSubmitted(packet)");
assert.ok(requestStart > -1 && errorBranch > requestStart && successCommit > errorBranch);
assert.match(intakeForm.slice(0, requestStart), /setSubmitted\(null\)/);
assert.doesNotMatch(intakeForm, /packetPath|speakerEntryPath|result\.meaning|error instanceof Error/);

function routeDependencies(open, counters) {
  return {
    "next/server": {
      NextResponse: {
        json(body, init) {
          return { body, status: init?.status ?? 200 };
        }
      }
    },
    "@/lib/squibb/concierge-intake-v0": {
      CONCIERGE_INTAKE_QUESTIONS: [{ id: "heaviest_lift" }],
      EMPTY_INTAKE_ANSWERS: { heaviest_lift: "" }
    },
    "@/lib/squibb/concierge-intake-availability": {
      BELLOWS_INTAKE_CLOSED_MESSAGE:
        "Intake submission is temporarily closed while secure account storage is being connected.",
      BELLOWS_INTAKE_SUBMISSION_OPEN: open
    },
    "@/lib/squibb/concierge-intake-storage": {
      async storeSpeakerIntake() {
        counters.storage += 1;
        throw new Error("PRIVATE_STORAGE_PATH_SENTINEL");
      }
    },
    "@/lib/matching/shadow-pipeline": {
      async runShadowMatchingFromConcierge() {
        counters.matching += 1;
        throw new Error("matching must not run");
      },
      shadowRunSmokeSummary() {
        return {};
      }
    },
    "@/lib/matching/feature-flags": {
      isMatchingPublicEnabled: () => true,
      matchingPublicModeLabel: () => "rules_based"
    }
  };
}

const closedCounters = { json: 0, storage: 0, matching: 0 };
const closedRoute = executeTypeScript(intakeRoute, routeDependencies(false, closedCounters));
const closed = await closedRoute.POST({
  async json() {
    closedCounters.json += 1;
    return { answers: { heaviest_lift: "synthetic" } };
  }
});
assert.equal(closed.status, 503);
assert.equal(closed.body.state, "Closed");
assert.deepEqual(closedCounters, { json: 0, storage: 0, matching: 0 });

const openCounters = { json: 0, storage: 0, matching: 0 };
const openRoute = executeTypeScript(intakeRoute, routeDependencies(true, openCounters));
const originalConsoleError = console.error;
console.error = () => {};
let failed;
try {
  failed = await openRoute.POST({
    async json() {
      openCounters.json += 1;
      return { answers: { heaviest_lift: "synthetic" } };
    }
  });
} finally {
  console.error = originalConsoleError;
}
assert.equal(failed.status, 500);
assert.equal(failed.body.state, "Failed");
assert.doesNotMatch(JSON.stringify(failed.body), /PRIVATE_STORAGE_PATH_SENTINEL/);
assert.deepEqual(openCounters, { json: 1, storage: 1, matching: 0 });

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "autonomous_claim_removed_from_member_surfaces",
        "rules_based_example_label_is_truthful",
        "intake_ui_and_route_share_closed_boundary",
        "closed_route_returns_before_json_or_storage",
        "failed_request_cannot_commit_submitted_state",
        "raw_storage_errors_and_paths_not_rendered"
      ]
    },
    null,
    2
  )
);
