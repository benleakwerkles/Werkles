import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function loadTs(source, localRequire = (specifier) => require(specifier), jsx = false) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: jsx ? ts.JsxEmit.ReactJSX : undefined,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const recommendationTypes = loadTs(read("lib/squibb/recommendations.ts"));
const disclosure = loadTs(read("lib/matching/personal-recommendation-disclosure.ts"));
const gates = loadTs(read("lib/matching/public-recommendation-gates.ts"));
const contract = loadTs(
  read("lib/matching/personal-recommendation-contract.ts"),
  (specifier) => {
    if (specifier === "@/lib/squibb/recommendations") return recommendationTypes;
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") return disclosure;
    if (specifier === "@/lib/matching/public-recommendation-gates") return gates;
    return require(specifier);
  }
);
const safeReturn = loadTs(read("lib/safe-member-return.ts")).safeMemberReturnPath;

const example = recommendationTypes.loadSquibbRecommendationSession();
const ranked = example.ranked.map((item, index) => ({
  ...item,
  rank: index + 1,
  title: recommendationTypes.RECOMMENDATION_KIND_LABELS[item.kind],
  squibbNote:
    index === 0
      ? "This is the highest-ranked path not ruled out by the current rules."
      : "This is another path not ruled out by the current rules to compare before deciding what to do.",
  confidence: {
    ...item.confidence,
    why: "Rules-based path score from what you entered and the proof gaps recorded here. It is not a probability of success or eligibility."
  },
  humanGates: gates.publicMatchingHumanGates(item.kind),
  suggestedAgent: "Werkles human review",
  suggestedTool: undefined,
  keepOriginalPathLabel: "Keep my current approach"
}));
const personalSession = {
  version: "v1",
  statedNeed: example.statedNeed,
  operatorContext: disclosure.PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT,
  squibbIntro: disclosure.PERSONAL_RECOMMENDATION_INTRO,
  source: {
    mode: "authenticated_profile",
    label: disclosure.PERSONAL_RECOMMENDATION_SOURCE_LABEL,
    detail: disclosure.PERSONAL_RECOMMENDATION_SOURCE_DETAIL
  },
  generation: { ...disclosure.PERSONAL_RECOMMENDATION_GENERATION },
  ranked,
  catalog: structuredClone(ranked)
};
const validResponse = {
  success: true,
  persisted: false,
  status: "personal",
  session: personalSession
};
assert.equal(contract.isPersonalRecommendationResponse(validResponse), true);

function hostile(name, mutate) {
  const response = structuredClone(validResponse);
  mutate(response.session);
  return { name, response };
}

const hostileResponses = [
  hostile("rank_zero", (session) => {
    session.ranked[0].rank = 0;
  }),
  hostile("rank_fractional", (session) => {
    session.ranked[0].rank = 1.5;
  }),
  hostile("score_below_zero", (session) => {
    session.ranked[0].confidence.score = -1;
  }),
  hostile("score_above_100", (session) => {
    session.ranked[0].confidence.score = 101;
  }),
  hostile("empty_human_gates", (session) => {
    session.ranked[0].humanGates = [];
  }),
  hostile("no_approval_gate", (session) => {
    session.ranked[0].humanGates = session.ranked[0].humanGates.map((gate) => ({
      ...gate,
      benMustApprove: false,
      severity: "info"
    }));
  }),
  hostile("duplicate_ranked_id", (session) => {
    session.ranked[1].id = session.ranked[0].id;
  }),
  hostile("duplicate_catalog_id", (session) => {
    session.catalog[1].id = session.catalog[0].id;
  }),
  hostile("empty_ranked_deck", (session) => {
    session.ranked = [];
  }),
  hostile("empty_catalog", (session) => {
    session.catalog = [];
  }),
  hostile("oversized_title", (session) => {
    session.ranked[0].title = "X".repeat(100_001);
  }),
  hostile("empty_required_text", (session) => {
    session.ranked[0].headline = "";
  })
];

const contractCases = hostileResponses.map(({ name, response }) => {
  const accepted = contract.isPersonalRecommendationResponse(response);
  const classified = contract.classifyPersonalRecommendationResponse({
    status: 200,
    ok: true,
    payload: response
  });
  return {
    name,
    expected: "reject",
    accepted,
    classified_status: classified.status
  };
});
const contractBypasses = contractCases.filter(({ accepted }) => accepted);

const recommendationCard = loadTs(
  read("components/squibb/recommendation-card.tsx"),
  (specifier) => {
    if (specifier === "react/jsx-runtime") return require("react/jsx-runtime");
    if (specifier === "@/lib/squibb/recommendations") {
      return { RECOMMENDATION_KIND_LABELS: recommendationTypes.RECOMMENDATION_KIND_LABELS };
    }
    if (specifier === "@/lib/squibb/rule-support") {
      return { ruleSupportBand: (label) => `${label} support` };
    }
    return require(specifier);
  },
  true
);

const xss = `"><script>globalThis.__WERKLES_XSS__=1</script><img src=x onerror="globalThis.__WERKLES_XSS__=2">`;
const maliciousRecommendation = {
  ...structuredClone(personalSession.ranked[0]),
  id: `id-${xss}`,
  title: xss,
  headline: xss
};
const rendered = renderToStaticMarkup(
  React.createElement(recommendationCard.RecommendationCard, {
    recommendation: maliciousRecommendation,
    selected: true,
    compact: false,
    detailId: `detail-${xss}`,
    onSelect: () => {
      throw new Error("SERVER_RENDER_MUST_NOT_INVOKE_ACTION");
    }
  })
);
assert.doesNotMatch(rendered, /<script>|<img src=x|onerror="globalThis/);
assert.match(rendered, /&lt;script&gt;|&quot;&gt;&lt;script&gt;/);

const relevantClientSources = [
  "components/squibb/personal-recommendation-delivery.tsx",
  "components/squibb/recommendation-surface.tsx",
  "components/squibb/recommendation-card.tsx",
  "components/squibb/concierge-intake-form.tsx"
].map((relativePath) => [relativePath, read(relativePath)]);
for (const [relativePath, source] of relevantClientSources) {
  assert.doesNotMatch(
    source,
    /dangerouslySetInnerHTML|\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write|eval\s*\(|new Function/,
    `${relativePath} contains an unsafe rendering sink`
  );
  assert.doesNotMatch(
    source,
    /\blocalStorage\b|\bsessionStorage\b/,
    `${relativePath} unexpectedly uses browser storage`
  );
}
assert.match(
  read("components/squibb/personal-recommendation-delivery.tsx"),
  /fetch\("\/api\/bellows\/recommendations\/personal"[\s\S]*method: "GET"/
);
assert.doesNotMatch(
  read("components/squibb/personal-recommendation-delivery.tsx"),
  /method:\s*"(?:POST|PUT|PATCH|DELETE)"|body:/
);
assert.doesNotMatch(
  read("components/squibb/recommendation-surface.tsx"),
  /\bfetch\s*\(|\blocalStorage\b|\bsessionStorage\b/
);

const returnAttacks = [
  "https://attacker.example",
  "//attacker.example/path",
  "\\\\attacker.example\\path",
  "/%2f%2fattacker.example",
  "/dashboard%00/operator",
  "/dashboard?next=https://attacker.example",
  "/dashboard#javascript:alert(1)",
  "/dashboard/../operator",
  "javascript:alert(1)",
  { toString: () => "/dashboard" },
  ["dashboard"]
];
for (const attack of returnAttacks) {
  assert.equal(safeReturn(attack), "/dashboard");
}

const result = {
  pass: contractBypasses.length === 0,
  idea: "response_contract_and_rendering_attack_corpus",
  cases: {
    contract: contractCases,
    xss_rendering: {
      escaped: true,
      raw_script_or_handler_present: false,
      rendered_bytes: Buffer.byteLength(rendered)
    },
    unsafe_return_paths_rejected: returnAttacks.length,
    unsafe_render_sinks: 0,
    browser_storage_uses: 0,
    personal_client_mutating_methods: 0
  },
  proven_bypasses: contractBypasses.map(({ name }) => name)
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 2;
