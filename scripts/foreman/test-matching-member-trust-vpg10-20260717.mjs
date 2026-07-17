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
const intakeCss = read("app/bellows/intake/concierge-intake.css");
const discoveryPage = read("app/discovery/page.tsx");
const discoveryForm = read("app/discovery/discovery-intake-form.tsx");
const discoveryRoute = read("app/api/discovery/intake/route.ts");
const discoveryAvailability = read("lib/discovery/intake-availability.ts");

for (const [name, source] of Object.entries({
  recommendationPage,
  recommendationSurface,
  recommendationBoundary,
  recommendationAdapter,
  intakePage,
  intakeForm,
  intakeRoute,
  discoveryPage,
  discoveryForm,
  discoveryRoute
})) {
  assert.doesNotMatch(source, /Autonomous Matching/i, `${name} must not expose the autonomous product claim`);
}

assert.match(recommendationPage, /Werkles Recommendations/);
assert.match(recommendationSurface, /One possible next move, explained\./);
assert.match(recommendationBoundary, /Rules-based recommendation example/);
assert.match(recommendationAdapter, /Werkles rules-based recommendation/);
assert.match(availability, /BELLOWS_INTAKE_SUBMISSION_OPEN = false/);
assert.match(intakePage, /submission is temporarily closed/i);
assert.match(intakeForm, /walkthrough stays example-only and does not load anything typed here/);
assert.match(intakeForm, /Nothing you type here is saved or sent/);
assert.match(intakeForm, /No automatic contact/);
assert.doesNotMatch(intakeForm, /No matching\. No profiles\.|shadow until go-live/i);
assert.match(discoveryAvailability, /DISCOVERY_INTAKE_SUBMISSION_OPEN = false/);
assert.match(discoveryPage, /Submission is temporarily closed/);
assert.match(discoveryPage, /Nothing you type\s*here is saved or sent/);
assert.match(discoveryForm, /disabled=\{!DISCOVERY_INTAKE_SUBMISSION_OPEN/);
assert.match(discoveryForm, /Nothing should be assumed saved/);
assert.doesNotMatch(discoveryForm, /recordPath|intakeId|result\.error|result\.meaning/);
assert.doesNotMatch(discoveryRoute, /record_path:|shadow_run_id:|intake_id:/);
assert.match(intakeCss, /--intake-copy:\s*#2b2119/);
assert.match(intakeCss, /--intake-surface:\s*rgba\(255, 252, 246, 0\.94\)/);
assert.match(intakeCss, /\.concierge-intake__hero,\s*\n\.concierge-intake__form/);
assert.match(intakeCss, /textarea::placeholder/);
assert.doesNotMatch(intakeCss, /\.concierge-intake__label[\s\S]{0,180}var\(--werkles-text-primary/);

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const statusColors = Object.fromEntries(
  [...intakeCss.matchAll(/preview-note\[data-status="(saving|saved|error)"\]\s*\{\s*color:\s*(#[0-9a-f]{6})/gi)].map(
    ([, status, color]) => [status, color]
  )
);
assert.deepEqual(Object.keys(statusColors).sort(), ["error", "saved", "saving"]);
for (const [status, color] of Object.entries(statusColors)) {
  assert.ok(contrastRatio(color, "#fffdf9") >= 4.5, `${status} status must meet 4.5:1 contrast on the intake surface`);
}

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

const discoveryCounters = { json: 0, normalize: 0, storage: 0, matching: 0 };
const closedDiscoveryRoute = executeTypeScript(discoveryRoute, {
  "next/server": {
    NextResponse: {
      json(body, init) {
        return { body, status: init?.status ?? 200 };
      }
    }
  },
  "@/lib/discovery/concierge": {
    normalizeDiscoveryIntake() {
      discoveryCounters.normalize += 1;
      return {};
    },
    validateDiscoveryIntake() {
      return [];
    },
    async writeDiscoveryIntake() {
      discoveryCounters.storage += 1;
      throw new Error("storage must not run");
    }
  },
  "@/lib/discovery/intake-availability": {
    DISCOVERY_INTAKE_CLOSED_MESSAGE:
      "Discovery intake submission is temporarily closed while secure account storage is being connected.",
    DISCOVERY_INTAKE_SUBMISSION_OPEN: false
  },
  "@/lib/matching/shadow-pipeline": {
    async runShadowMatchingFromDiscovery() {
      discoveryCounters.matching += 1;
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
});
const closedDiscovery = await closedDiscoveryRoute.POST({
  async json() {
    discoveryCounters.json += 1;
    return { name: "synthetic" };
  }
});
assert.equal(closedDiscovery.status, 503);
assert.equal(closedDiscovery.body.state, "Closed");
assert.deepEqual(discoveryCounters, { json: 0, normalize: 0, storage: 0, matching: 0 });

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
        "raw_storage_errors_and_paths_not_rendered",
        "intake_surface_uses_explicit_light_contrast_tokens",
        "future_status_colors_meet_4_5_to_1_contrast",
        "discovery_route_returns_before_json_or_storage",
        "discovery_form_is_closed_and_hides_internal_ids"
      ]
    },
    null,
    2
  )
);
