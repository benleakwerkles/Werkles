import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const route = read("app/api/operator/matching/document-score/route.ts");
const pipeline = read("lib/matching/shadow-pipeline.ts");
const audience = read("lib/route-audience.ts");
const middleware = read("middleware.ts");
const surface = read("components/squibb/recommendation-surface.tsx");
const sourcePanel = read("components/squibb/source-document-panel.tsx");
const converter = read("lib/matching/shadow-to-recommendations.ts");
const matchingTypes = read("lib/matching/types.ts");
const recommendationTypes = read("lib/squibb/recommendations.ts");
const client = read("app/operator/matching/document-score/document-score-client.tsx");
const documentScoreCss = read("app/operator/matching/document-score/document-score.css");

const ephemeralFunction = pipeline.slice(pipeline.indexOf("export async function runEphemeralMatchingFromDocument"));
assert.match(ephemeralFunction, /signalsFromDocumentText/);
assert.match(ephemeralFunction, /runMatchingCore\(signals, false\)/);
assert.doesNotMatch(ephemeralFunction, /maybeLlmTranslate|persistShadowRun/);

assert.match(route, /persisted: false/);
assert.match(route, /"Cache-Control": "no-store"/);
assert.match(route, /mode: "ephemeral_document"/);
assert.match(route, /contentType !== "application\/json"/);
assert.match(route, /input\.custody_confirmed !== true/);
assert.match(route, /does not persist the paste or forward it to an AI provider or external recipient/);
assert.match(route, /label: RECOMMENDATION_KIND_LABELS\[path\.kind\]/);
assert.match(route, /ruleSupportBand: path\.confidenceLabel/);
assert.match(route, /not_ruled_out_count: session\.ranked\.length/);
assert.match(route, /why: safeRowExplanation/);
assert.match(route, /disqualified \? \[path\.disqualifyReason, \.\.\.path\.rationale\] : path\.rationale/);
assert.doesNotMatch(route, /fedDocument\s*:|kind:\s*"uploaded_document"/);
assert.doesNotMatch(route, /not saved or sent anywhere/i);
assert.doesNotMatch(route, /eligible_count/);
assert.doesNotMatch(route, /confidenceLabel\s*:/);
assert.doesNotMatch(route, /supabase|insert\s*\(|update\s*\(|upsert\s*\(|delete\s*\(/i);

assert.match(audience, /"\/api\/operator"/);
assert.match(middleware, /"\/api\/operator\/:path\*"/);
assert.match(surface, /<SourceDocumentPanel source=\{source\} selectedKind=\{selected\.kind\}/);
assert.match(surface, /source\.mode === "ephemeral_document"/);
assert.match(surface, /!isEphemeralDocument && \(hasRecordedActivity/);
assert.match(matchingTypes, /"operator_document"/);
assert.match(recommendationTypes, /"ephemeral_document"/);
assert.match(converter, /run\.source === "operator_document"[\s\S]*?"Pasted document"/);
assert.match(converter, /run\.source === "operator_document" \? "ephemeral_document" : "latest_intake"/);
assert.match(sourcePanel, /scored the document as a whole/);
assert.match(sourcePanel, /line-by-line trace is not available/);
assert.match(client, /attachLocalDocument/);
assert.match(client, /kind: "uploaded_document"/);
assert.match(client, /custody_confirmed: custodyConfirmed/);
assert.match(client, /I am authorized to use this document and removed sensitive identifiers/);
assert.match(client, /disabled=\{busy \|\| body\.trim\(\)\.length < 40 \|\| !custodyConfirmed\}/);
assert.match(client, /sent to this internal Werkles endpoint/);
assert.match(client, /does not persist it or forward it to an AI provider or external/);
assert.match(client, /value\.persisted === false/);
assert.match(client, /score response failed its privacy check/);
assert.ok(client.indexOf("if (!isSuccessfulDocumentScore(result))") < client.indexOf("setSession(localSession)"));
assert.match(client, /paths not ruled out by these rules/);
assert.match(client, /They are not probabilities, accuracy[\s\S]*?eligibility decisions, verification, or predicted outcomes/);
assert.match(client, /<th scope="row" className="doc-score__path">/);
assert.match(client, /className="doc-score__why">\{row\.why\}/);
assert.match(client, /How to read it:/);
assert.match(client, /role="region"[\s\S]*?aria-label="Document score table"[\s\S]*?tabIndex=\{0\}/);
assert.match(client, /Scroll sideways to see every column/);
assert.match(client, /className="doc-score__meta" role="status" aria-live="polite"/);
assert.doesNotMatch(client, /doc-score__board" ref=\{resultsRef\} aria-live/);
assert.doesNotMatch(client, /<code>\{row\.kind\}<\/code>|\bEligible\b|eligible_count|confidenceLabel/);
assert.doesNotMatch(client, /\b(?:Automated|Autonomous)\b/);
assert.match(documentScoreCss, /\.doc-score__table-wrap:focus-visible/);
assert.match(documentScoreCss, /\.doc-score__scroll-cue \{[\s\S]*?display: none/);
assert.match(documentScoreCss, /@media \(max-width: 900px\)[\s\S]*?\.doc-score__scroll-cue \{[\s\S]*?display: block/);

const require = createRequire(import.meta.url);
const ts = require("typescript");
const signalSource = read("lib/matching/signals.ts");
const output = ts.transpileModule(signalSource, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;
const loaded = { exports: {} };
const localRequire = (specifier) => {
  if (specifier === "@/lib/matching/leverage") {
    return {
      diagnoseLeverage: () => ({
        primaryHypothesis: "structural",
        supporting: [],
        constrained: [],
        confidence: "low"
      })
    };
  }
  return {};
};
new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);

const signals = loaded.exports.signalsFromDocumentText(
  "doc_test",
  "Owner note",
  "FROM: Jordan Lee\nDATE: 2026-07-16\n\nI need a loan for a second van.\nI am not trying to hire employees."
);
assert.equal(signals.statedNeed, "I need a loan for a second van.");
assert.equal(signals.source, "operator_document");
assert.equal(signals.capitalSeeking, true);
assert.equal(signals.jobSeeking, false);

const routeOutput = ts.transpileModule(route, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

let pipelineCalls = 0;
let pipelineMode = "success";
const fakeRun = {
  runId: "run_document_test",
  intakeId: "doc_document_test",
  notMatch: { disqualified: [] },
  readout: {
    scoredPaths: [
      {
        kind: "find_equipment",
        rank: 1,
        score: 62,
        confidenceLabel: "medium",
        rationale: ["Layer 0 internal language", "Equipment goal keywords checked."],
        disqualified: false
      },
      {
        kind: "stage_intro_candidate",
        rank: 2,
        score: 12,
        confidenceLabel: "low",
        rationale: ["Guarded candidate staging requires more proof."],
        disqualified: true,
        disqualifyReason: "Rule 7 internal language"
      }
    ]
  }
};

function fakeSession() {
  const recommendation = {
    kind: "find_equipment",
    reasoning: { rationale: ["A global reason that must not replace the row rationale."] }
  };
  return {
    version: "v1",
    statedNeed: "A second van is needed.",
    operatorContext: "Rules-only test context.",
    squibbIntro: "Test intro.",
    source: { mode: "ephemeral_document", label: "Document score", detail: "Test." },
    ranked: [recommendation],
    catalog: [recommendation]
  };
}

const routeLoaded = { exports: {} };
const routeRequire = (specifier) => {
  if (specifier === "next/server") {
    return {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200, headers: init.headers ?? {} })
      }
    };
  }
  if (specifier === "@/lib/matching/shadow-pipeline") {
    return {
      runEphemeralMatchingFromDocument: async () => {
        pipelineCalls += 1;
        if (pipelineMode === "disabled") return null;
        if (pipelineMode === "throw") throw new Error("SENTINEL_PRIVATE_FAILURE");
        return fakeRun;
      },
      shadowRunSmokeSummary: () => ({ shadow_top_eligible_path: "find_equipment" })
    };
  }
  if (specifier === "@/lib/matching/shadow-to-recommendations") {
    return { shadowRunToRecommendationSession: () => fakeSession() };
  }
  if (specifier === "@/lib/squibb/recommendations") {
    return {
      RECOMMENDATION_KIND_LABELS: {
        find_equipment: "Find equipment",
        stage_intro_candidate: "Stage intro candidate"
      }
    };
  }
  return {};
};
new Function("require", "exports", "module", routeOutput)(routeRequire, routeLoaded.exports, routeLoaded);

function requestFor(payload, options = {}) {
  const contentType = options.contentType ?? "application/json; charset=utf-8";
  const serialized = JSON.stringify(payload);
  const contentLength = options.contentLength ?? Buffer.byteLength(serialized ?? "", "utf8");
  return {
    headers: {
      get(name) {
        if (name.toLowerCase() === "content-type") return contentType;
        if (name.toLowerCase() === "content-length") return String(contentLength);
        return null;
      }
    },
    async json() {
      if (options.malformed) throw new SyntaxError("SENTINEL_BAD_JSON");
      return payload;
    }
  };
}

async function expectRejectedBeforePipeline(payload, status, options = {}) {
  pipelineCalls = 0;
  pipelineMode = "success";
  const response = await routeLoaded.exports.POST(requestFor(payload, options));
  assert.equal(response.status, status);
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.equal(response.headers["X-Robots-Tag"], "noindex, nofollow, noarchive");
  assert.equal(pipelineCalls, 0);
  return response;
}

const confirmed = {
  title: "Redacted owner note",
  body: "I need a second van and equipment for the booked work already on my calendar.",
  custody_confirmed: true
};

await expectRejectedBeforePipeline(confirmed, 415, { contentType: "text/plain" });
await expectRejectedBeforePipeline(confirmed, 400, { malformed: true });
await expectRejectedBeforePipeline(null, 400);
await expectRejectedBeforePipeline([], 400);
await expectRejectedBeforePipeline({ ...confirmed, body: 42 }, 400);
await expectRejectedBeforePipeline({ ...confirmed, title: 42 }, 400);
await expectRejectedBeforePipeline({ ...confirmed, custody_confirmed: false }, 400);
await expectRejectedBeforePipeline({ ...confirmed, body: "too short" }, 400);
await expectRejectedBeforePipeline({ ...confirmed, body: "x".repeat(20_001) }, 413);
await expectRejectedBeforePipeline(confirmed, 413, { contentLength: 24_001 });

pipelineCalls = 0;
pipelineMode = "disabled";
const disabledResponse = await routeLoaded.exports.POST(requestFor(confirmed));
assert.equal(disabledResponse.status, 503);
assert.equal(pipelineCalls, 1);

pipelineCalls = 0;
pipelineMode = "throw";
const failureResponse = await routeLoaded.exports.POST(requestFor(confirmed));
assert.equal(failureResponse.status, 500);
assert.equal(pipelineCalls, 1);
assert.doesNotMatch(JSON.stringify(failureResponse.body), /SENTINEL_PRIVATE_FAILURE/);

pipelineCalls = 0;
pipelineMode = "success";
const successResponse = await routeLoaded.exports.POST(requestFor(confirmed));
assert.equal(successResponse.status, 200);
assert.equal(pipelineCalls, 1);
assert.equal(successResponse.body.success, true);
assert.equal(successResponse.body.persisted, false);
assert.equal(successResponse.body.not_ruled_out_count, 1);
assert.equal(successResponse.body.session.source.mode, "ephemeral_document");
assert.equal(successResponse.body.session.source.fedDocument, undefined);
assert.equal(successResponse.body.scoreboard[0].why, "Equipment goal keywords checked.");
assert.equal(successResponse.body.scoreboard[1].why, "Guarded candidate staging requires more proof.");
assert.doesNotMatch(JSON.stringify(successResponse.body), new RegExp(confirmed.body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.doesNotMatch(JSON.stringify(successResponse.body), /custody_confirmed/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "operator_api_family_is_internal",
    "ephemeral_path_has_no_persistence_or_llm_step",
    "response_is_no_store_and_marks_persisted_false",
    "ephemeral_document_source_never_claims_saved_intake_custody",
    "scoreboard_uses_human_labels_bounded_reasons_and_rules_filter_language",
    "score_limit_is_always_visible",
    "request_and_response_contracts_fail_closed_before_result_commit",
    "full_paste_is_not_echoed_and_private_errors_are_not_reflected",
    "authorization_and_redaction_confirmation_precedes_matching",
    "row_reasons_prefer_safe_path_specific_rationale",
    "wide_table_has_visible_reading_and_keyboard_scroll_cues",
    "source_panel_does_not_claim_line_level_trace",
    "document_signal_adapter_uses_meaningful_line_and_scoped_negation",
    "plain_rules_language"
  ]
}, null, 2));
