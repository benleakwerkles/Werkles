#!/usr/bin/env node
"use strict";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const require = createRequire(import.meta.url);
const ts = require("typescript");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

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
    assert.ok(
      Object.hasOwn(dependencies, specifier),
      `unexpected runtime dependency while exercising TypeScript: ${specifier}`
    );
    return dependencies[specifier];
  };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileFingerprint(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return sha256(fs.readFileSync(absolutePath));
}

function directoryNames(relativePath, predicate = () => true) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  return fs.readdirSync(absolutePath).filter(predicate).sort();
}

function packetOutputSnapshot() {
  return {
    index: fileFingerprint("data/squibb/recommendation-packets.jsonl"),
    packets: directoryNames("data/squibb/recommendation-packets"),
    speakerEntries: directoryNames(
      "foreman/speaker/entries",
      (name) => name.startsWith("SQUIBB_OPTIONAL_PACKET_squibb_option_")
    )
  };
}

const page = read("app/bellows/recommendations/page.tsx");
const boundarySource = read("lib/squibb/public-recommendation-session-server.ts");
const routeSource = read("app/api/bellows/recommendations/packet/route.ts");
const adapterSource = read("lib/matching/shadow-to-recommendations.ts");
const gatesSource = read("lib/matching/public-recommendation-gates.ts");

assert.match(page, /loadPublicBellowsRecommendationPageData/);
assert.doesNotMatch(page, /loadSquibbRecommendationSessionForBellows|loadBellowsPacketLedger/);
assert.match(page, /dynamic\s*=\s*["']force-dynamic["']/);

const demoSession = {
  version: "v1",
  statedNeed: "Example need",
  operatorContext: "Example context",
  squibbIntro: "Example only",
  ranked: [],
  catalog: []
};
const boundaryModule = executeTypeScript(boundarySource, {
  "server-only": {},
  "@/lib/matching/feature-flags": {
    isMatchingPublicEnabled: () => false
  },
  "@/lib/squibb/bellows-ledger": {},
  "@/lib/squibb/recommendations": {
    loadSquibbRecommendationSession: () => demoSession
  }
});
const closedData = await boundaryModule.loadPublicBellowsRecommendationPageData();
assert.equal(closedData.session.source.mode, "demo");
assert.deepEqual(closedData.ledger, { intakes: [], optionPackets: [] });

const routeDependencies = [];
const routeModule = executeTypeScript(routeSource, {
  "next/server": {
    NextResponse: {
      json(body, init) {
        routeDependencies.push("next/server:json");
        return { body, status: init?.status ?? 200 };
      }
    }
  }
});
const outputBefore = packetOutputSnapshot();
const forgedRequests = [
  { recommendationId: "forged", action: "pursue_path" },
  { recommendationId: "../../speaker", action: "keep_original_path" },
  { malformed: true }
];
const blockedResponses = await Promise.all(
  forgedRequests.map((body) => routeModule.POST({ json: async () => body }))
);
for (const response of blockedResponses) {
  assert.equal(response.status, 403);
  assert.equal(response.body.state, "Blocked");
}
assert.deepEqual(packetOutputSnapshot(), outputBefore, "blocked packet POST must not change any packet output");
assert.equal(routeDependencies.length, forgedRequests.length);

const gatesModule = executeTypeScript(gatesSource);
const kinds = [
  "translate_need",
  "verify_proof",
  "stage_intro_candidate",
  "find_partner",
  "find_equipment",
  "find_banker",
  "find_credit_union",
  "find_better_job",
  "stay_current_job",
  "relocate",
  "get_training",
  "raise_capital"
];
const recommendationLabels = Object.fromEntries(
  kinds.map((kind) => [kind, kind.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")])
);
const adapterModule = executeTypeScript(adapterSource, {
  "@/lib/matching/public-recommendation-gates": gatesModule,
  "@/lib/squibb/recommendations": {
    RECOMMENDATION_KIND_LABELS: recommendationLabels
  }
});

const userEvidence = "I work with Bean at Layer 0 Labs on Squibb and not-match research with Dink, Thufir, Ender, Petra, and Skybro.";
const internalSystemText = "Squibb says Dink, Thufir, Bean, Ender, Petra, and Skybro should run autonomous shadow Layer 0 not-match.";
const basePaths = [
  {
    kind: "get_training",
    rank: 3,
    score: 55,
    confidenceLabel: "medium",
    rationale: [internalSystemText],
    evidenceStrength: "self_reported"
  },
  {
    kind: "find_partner",
    rank: 1,
    score: 90,
    confidenceLabel: "high",
    rationale: ["Disqualified path must never appear"],
    evidenceStrength: "inferred",
    disqualified: true,
    disqualifyReason: "Not safe"
  },
  {
    kind: "find_equipment",
    rank: 2,
    score: 61,
    confidenceLabel: "medium",
    rationale: ["A concrete asset may make the next review narrower."],
    evidenceStrength: "inferred"
  }
];

function matchingRun(paths = basePaths) {
  return {
    runId: "run-test",
    intakeId: "intake-test",
    source: "bellows_concierge",
    mode: "shadow",
    signals: {
      statedNeed: "Help me choose a safe next step."
    },
    readout: {
      primaryBottleneck: internalSystemText,
      recommendationCard: {
        whatYouAskedFor: "Help me choose a safe next step.",
        whatWeHeardUnderneath: internalSystemText,
        visibleReasons: [internalSystemText, "The information entered supports a smaller review first."]
      },
      facts: [
        {
          id: "unknown-internal-label",
          label: internalSystemText,
          value: userEvidence,
          strength: "self_reported",
          source: "intake"
        },
        {
          id: "stated-need",
          label: "Bare verified claim",
          value: internalSystemText,
          strength: "verified",
          source: "unnamed check"
        },
        {
          id: "assets",
          label: "Missing item",
          value: "Inspection report",
          strength: "missing",
          source: "none"
        },
        {
          id: "leverage",
          label: "Inferred item",
          value: "Possible advantage",
          strength: "inferred",
          source: "rules"
        }
      ],
      scoredPaths: paths
    },
    squibb: {
      keepOriginalPathLabel: internalSystemText
    },
    createdAt: "2026-07-16T12:00:00.000Z"
  };
}

const run = matchingRun();
const originalRun = structuredClone(run);
const converted = adapterModule.shadowRunToRecommendationSession(run);
assert.deepEqual(run, originalRun, "conversion must not mutate the matching run");
assert.deepEqual(
  converted.ranked.map((item) => [item.kind, item.rank]),
  [["find_equipment", 1], ["get_training", 2]],
  "eligible paths must be sorted, filtered, and re-ranked"
);
assert.strictEqual(converted.catalog, converted.ranked);
assert.equal(converted.ranked.some((item) => item.kind === "find_partner"), false);
assert.deepEqual(
  adapterModule.shadowRunToRecommendationSession(matchingRun()),
  converted,
  "conversion must be deterministic"
);

const first = converted.ranked[0];
assert.ok(first.evidence[0].label.endsWith(userEvidence), "member evidence must round-trip without word replacement");
assert.match(first.evidence[0].label, /^Additional information: /);
assert.equal(first.evidence[0].source, "Your intake");
assert.equal(first.evidence[1].strength, "inferred", "bare verified evidence must be downgraded");
assert.equal(first.evidence[1].source, "Evidence supplied; verification details incomplete");
assert.equal(first.evidence[1].label, "What you entered: Details withheld pending human review");
assert.equal(first.evidence[2].source, "Not supplied");
assert.equal(first.keepOriginalPathLabel, "Keep my current approach");
assert.match(converted.source.detail, /recommendation itself is not a verified match/i);
assert.doesNotMatch(converted.source.detail, /No identity.*was verified/i);

const internalLanguage = /Layer 0|not-match|Squibb|autonomous|shadow|\b(?:Petra|Skybro|Dink|Thufir|Bean|Ender)\b/i;
const systemGeneratedStrings = [
  converted.operatorContext,
  converted.squibbIntro,
  converted.source.label,
  converted.source.detail,
  ...converted.ranked.flatMap((item) => [
    item.title,
    item.headline,
    item.squibbNote,
    item.reasoning.translatedNeed,
    ...item.reasoning.rationale,
    item.confidence.label,
    item.confidence.why,
    item.suggestedAgent,
    item.keepOriginalPathLabel,
    ...item.evidence.slice(1).map((evidence) => evidence.label),
    ...item.evidence.map((evidence) => evidence.source ?? ""),
    ...item.humanGates.flatMap((gate) => [gate.label, gate.reason])
  ])
];
for (const value of systemGeneratedStrings) {
  assert.doesNotMatch(value ?? "", internalLanguage, `internal language escaped through: ${value}`);
}

const empty = adapterModule.shadowRunToRecommendationSession(
  matchingRun(basePaths.map((item) => ({ ...item, disqualified: true })))
);
assert.deepEqual(empty.ranked, []);
assert.deepEqual(empty.catalog, []);

for (const kind of kinds) {
  const mapped = gatesModule.publicMatchingHumanGates(kind);
  assert.ok(mapped.some((gate) => gate.severity === "blocker"));
  assert.ok(mapped.every((gate) => gate.severity !== "info"));
}
const trainingGate = gatesModule
  .publicMatchingHumanGates("get_training")
  .find((gate) => gate.id === "matching-training-review");
assert.match(trainingGate.reason, /not verified or guaranteed/i);
for (const term of ["admission", "eligibility", "credential", "completion", "outcomes"]) {
  assert.match(trainingGate.reason, new RegExp(term, "i"));
}

if (process.argv.includes("--after-build")) {
  const appPaths = JSON.parse(read(".next/server/app-paths-manifest.json"));
  const prerender = JSON.parse(read(".next/prerender-manifest.json"));
  assert.equal(
    appPaths["/bellows/recommendations/page"],
    "app/bellows/recommendations/page.js",
    "production build must include the recommendations server page"
  );
  assert.equal(
    Object.hasOwn(prerender.routes, "/bellows/recommendations"),
    false,
    "personal recommendation boundary must not be prerendered"
  );
  assert.equal(
    fs.existsSync(path.join(root, ".next/server/app/bellows/recommendations.html")),
    false,
    "dynamic recommendations page must not emit static HTML"
  );
}

console.log("PASS matching full-flock VPG6 runtime containment and trusted-readout contracts");
