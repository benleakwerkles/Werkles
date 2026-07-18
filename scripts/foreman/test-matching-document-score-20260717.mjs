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
const client = read("app/operator/matching/document-score/document-score-client.tsx");

const ephemeralFunction = pipeline.slice(pipeline.indexOf("export async function runEphemeralMatchingFromDocument"));
assert.match(ephemeralFunction, /signalsFromDocumentText/);
assert.match(ephemeralFunction, /runMatchingCore\(signals, false\)/);
assert.doesNotMatch(ephemeralFunction, /maybeLlmTranslate|persistShadowRun/);

assert.match(route, /persisted: false/);
assert.match(route, /"Cache-Control": "no-store"/);
assert.match(route, /kind: "uploaded_document"/);
assert.doesNotMatch(route, /supabase|insert\s*\(|update\s*\(|upsert\s*\(|delete\s*\(/i);

assert.match(audience, /"\/api\/operator"/);
assert.match(middleware, /"\/api\/operator\/:path\*"/);
assert.match(surface, /<SourceDocumentPanel source=\{source\} selectedKind=\{selected\.kind\}/);
assert.match(client, /Nothing is saved/);
assert.doesNotMatch(client, /\b(?:Automated|Autonomous)\b/);

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
assert.equal(signals.capitalSeeking, true);
assert.equal(signals.jobSeeking, false);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "operator_api_family_is_internal",
    "ephemeral_path_has_no_persistence_or_llm_step",
    "response_is_no_store_and_marks_persisted_false",
    "pasted_source_is_inspectable",
    "document_signal_adapter_uses_meaningful_line_and_scoped_negation",
    "plain_rules_language"
  ]
}, null, 2));
