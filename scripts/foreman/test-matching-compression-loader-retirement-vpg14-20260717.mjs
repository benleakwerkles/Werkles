/**
 * Focused source/runtime proof for VPG14 example compression and legacy-loader retirement.
 * Run: node scripts/foreman/test-matching-compression-loader-retirement-vpg14-20260717.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

function executeTypeScript(source, dependencies = {}) {
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

function sourceFiles(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relativePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [relativePath] : [];
  });
}

const legacyModule = "lib/squibb/recommendation-session-server.ts";
const legacyImport = "@/lib/squibb/recommendation-session-server";
const legacySymbols = ["loadSquibbRecommendationSessionForBellows", "loadBellowsPacketLedger"];
assert.equal(existsSync(path.join(root, legacyModule)), false, "unsafe legacy loader must be deleted");

for (const relativePath of ["app", "components", "lib"].flatMap(sourceFiles)) {
  const source = read(relativePath);
  assert.doesNotMatch(source, new RegExp(legacyImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), relativePath);
  for (const symbol of legacySymbols) assert.doesNotMatch(source, new RegExp(`\\b${symbol}\\b`), relativePath);
}

const boundarySource = read("lib/squibb/public-recommendation-session-server.ts");
const routeSource = read("app/api/bellows/recommendations/packet/route.ts");
const surface = read("components/squibb/recommendation-surface.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");

for (const forbiddenReader of [
  "readLatestSpeakerIntake",
  "readLatestSpeakerIntakeRows",
  "readLatestShadowRuns",
  "readLatestSquibbRecommendationPacketRows",
  "recommendation-session-server"
]) {
  assert.doesNotMatch(boundarySource, new RegExp(forbiddenReader));
}

const allowedBoundaryDependencies = new Set([
  "server-only",
  "@/lib/matching/feature-flags",
  "@/lib/squibb/bellows-ledger",
  "@/lib/squibb/recommendations"
]);
const boundaryDependencies = [
  ...boundarySource.matchAll(/import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["'];/g)
].map((match) => match[1]);
assert.ok(boundaryDependencies.length >= 3);
assert.ok(boundaryDependencies.every((dependency) => allowedBoundaryDependencies.has(dependency)));

const demoSession = {
  version: "v1",
  statedNeed: "Example need",
  operatorContext: "Example context",
  squibbIntro: "Example only",
  ranked: [],
  catalog: []
};
for (const publicEnabled of [false, true]) {
  const boundary = executeTypeScript(boundarySource, {
    "server-only": {},
    "@/lib/matching/feature-flags": { isMatchingPublicEnabled: () => publicEnabled },
    "@/lib/squibb/recommendations": { loadSquibbRecommendationSession: () => demoSession }
  });
  const data = await boundary.loadPublicBellowsRecommendationPageData();
  assert.equal(data.session.source.mode, "demo");
  assert.equal(data.session.source.label, publicEnabled ? "Rules-based recommendation example" : "Demo scenario");
  assert.deepEqual(data.ledger, { intakes: [], optionPackets: [] });
}

assert.doesNotMatch(routeSource, /request\.json|store|insert|upsert|writeFile/i);
let requestBodyRead = false;
const route = executeTypeScript(routeSource, {
  "next/server": {
    NextResponse: {
      json(body, init) {
        return { body, status: init?.status ?? 200 };
      }
    }
  }
});
const response = await route.POST({
  json: async () => {
    requestBodyRead = true;
    throw new Error("closed route must not read the request body");
  }
});
assert.equal(response.status, 403);
assert.equal(response.body.state, "Blocked");
assert.equal(requestBodyRead, false);

assert.doesNotMatch(surface, /squibb-rec-surface__intake-cta/);
assert.match(surface, /const hasRecordedActivity = ledger\.intakes\.length > 0 \|\| optionPackets\.length > 0/);
assert.match(surface, /const isPersonal = source\.mode === "authenticated_profile"/);
assert.match(surface, /const isEphemeralDocument = source\.mode === "ephemeral_document"/);
assert.match(surface, /!isEphemeralDocument && \(hasRecordedActivity \|\| \(!isExample && !isPersonal\)\)/);
assert.match(surface, /squibb-rec-surface__example-custody/);
assert.match(surface, /This is a walkthrough, not your result\./);
assert.match(surface, /Nothing is saved from this example\. Nothing is sent to another person or organization\./);
assert.match(surface, /Review the closed intake questions/);
assert.match(surface, /\{showActivityLedger \? \([\s\S]*squibb-rec-ledger/);
assert.match(css, /\.squibb-rec-surface__example-custody \{[\s\S]*border-bottom: 1px solid var\(--werkles-iron, #3b342a\)/);
assert.doesNotMatch(surface, /fetch\s*\(/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "legacy_global_latest_loader_deleted",
        "application_imports_cannot_reattach_legacy_loader",
        "public_helper_dependencies_remain_example_only",
        "public_flag_false_and_true_both_return_empty_example_custody",
        "packet_post_returns_403_before_body_read_or_storage",
        "example_custody_is_compact_inside_existing_hero",
        "empty_example_ledger_is_represented_once"
      ]
    },
    null,
    2
  )
);
