import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const builder = read("lib/matching/profile-recommendation.ts");
const route = read("app/api/bellows/recommendations/personal/route.ts");
const converter = read("lib/matching/shadow-to-recommendations.ts");
const gates = read("lib/matching/public-recommendation-gates.ts");
const reasoning = read("components/squibb/reasoning-panel.tsx");

// The personal builder must keep the exact deterministic stage sequence.
const stages = [
  "signalsFromMemberProfile",
  "runLayer0",
  "evaluateNotMatch",
  "scorePaths",
  "buildMatchingReadout",
  "buildSquibbVoice",
  "shadowRunToRecommendationSession"
];
let previousStage = -1;
for (const stage of stages) {
  const calls = [...builder.matchAll(new RegExp(`\\b${stage}\\(`, "g"))];
  assert.equal(calls.length, 1, `${stage} must be called exactly once`);
  const position = calls[0].index ?? -1;
  assert.ok(position > previousStage, `${stage} must follow the prior deterministic stage`);
  previousStage = position;
}

assert.match(builder, /llmUsed: false/);
assert.match(builder, /memberCausalDraft: null/);
assert.match(builder, /receiptPath: ""/);

// Freeze the builder's dependency surface and reject provider/storage drift in
// the narrow Tier A calculation closure.
const imports = [...builder.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
assert.deepEqual(imports.sort(), [
  "@/lib/matching/deliver",
  "@/lib/matching/layer0",
  "@/lib/matching/not-match",
  "@/lib/matching/score-paths",
  "@/lib/matching/shadow-to-recommendations",
  "@/lib/matching/signals",
  "@/lib/matching/types",
  "@/lib/squibb/recommendations"
].sort());

const calculationClosure = [
  "lib/matching/profile-recommendation.ts",
  "lib/matching/deliver.ts",
  "lib/matching/layer0.ts",
  "lib/matching/not-match.ts",
  "lib/matching/score-paths.ts",
  "lib/matching/signals.ts",
  "lib/matching/shadow-to-recommendations.ts",
  "lib/matching/public-recommendation-gates.ts"
].map(read).join("\n");

assert.doesNotMatch(
  calculationClosure,
  /from\s+["'][^"']*(?:openai|anthropic|gemini|llm|shadow-pipeline|feature-flags|supabase|storage|persist)[^"']*["']/i
);
assert.doesNotMatch(calculationClosure, /\bfetch\s*\(|\.(?:insert|update|upsert|delete)\s*\(|\bwriteFile\s*\(/);
assert.doesNotMatch(calculationClosure, /getSupabaseService|SUPABASE_SERVICE|serviceRole/i);

// Ownership still comes only from validated auth; the caller cannot select it.
assert.match(route, /await requireUser\(request\)/);
assert.match(route, /\.eq\("id", auth\.user\.id\)/);
assert.doesNotMatch(route, /request\.(?:json|text|formData|body|nextUrl)/);
assert.doesNotMatch(route, /\b(?:ownerId|userId|profileId|intakeId|email)\b/);

// Delivered language describes ordinary rules, not an AI-generated result.
assert.match(builder, /Fixed written rules calculated this result from your existing saved profile/);
assert.match(builder, /No AI model generated it/);
assert.match(builder, /result itself was not saved or forwarded to a provider or external recipient/);
assert.match(converter, /id: `rules-ranked-\$\{path\.kind\}`/);
assert.match(converter, /Rules-based recommendation calculated/);
assert.match(converter, /highest-ranked path not ruled out by the current rules/);
assert.doesNotMatch(converter, /highest-ranked eligible path|another eligible path/);
assert.match(gates, /This rules-based suggestion cannot send/);
assert.match(reasoning, /isExample \? "Example interpretation" : "Werkles rules read it as"/);

for (const visibleSource of [builder, converter, gates, reasoning]) {
  assert.doesNotMatch(visibleSource, /\b(?:Automated|Autonomous)\b/);
}

console.log(JSON.stringify({
  pass: true,
  checks: [
    "deterministic_stage_order_and_single_invocation",
    "rules_builder_dependency_surface_frozen",
    "provider_persistence_and_service_role_dependencies_absent",
    "authenticated_owner_query_fixed",
    "plain_programming_not_ai_disclosure",
    "rules_only_delivered_vocabulary"
  ]
}, null, 2));
