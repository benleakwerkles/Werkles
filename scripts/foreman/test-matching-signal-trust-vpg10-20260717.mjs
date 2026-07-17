/**
 * Synthetic-only signal trust regression: word families and scoped negation.
 * Run: node scripts/foreman/test-matching-signal-trust-vpg10-20260717.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(path.join(root, "lib/matching/signals.ts"), "utf8");

const output = ts.transpileModule(source, {
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

function signalsFor(text) {
  return loaded.exports.signalsFromConcierge("synthetic-intake", {
    stuck_decision: "",
    time_cost: "",
    heaviest_lift: text,
    success_twelve_months: "",
    proof_already_have: "",
    constraint_guardrail: ""
  });
}

const positiveCases = [
  ["I need financing.", "capitalSeeking"],
  ["An investment may help.", "capitalSeeking"],
  ["I am hiring for a kitchen job.", "jobSeeking"],
  ["I need training.", "trainingSeeking"],
  ["A certification would help.", "trainingSeeking"],
  ["I am relocating.", "relocationSignal"],
  ["I want a co founder.", "partnerSeeking"]
];
for (const [text, flag] of positiveCases) {
  assert.equal(signalsFor(text)[flag], true, `${flag} should recognize: ${text}`);
}

const negativeCases = [
  ["I do not want a loan.", "capitalSeeking"],
  ["I don't need an investor.", "partnerSeeking"],
  ["I do not want a partner.", "partnerSeeking"],
  ["I am not looking for a new job.", "jobSeeking"],
  ["I do not need training.", "trainingSeeking"],
  ["I do not plan to relocate.", "relocationSignal"]
];
for (const [text, flag] of negativeCases) {
  assert.equal(signalsFor(text)[flag], false, `${flag} must respect explicit negation: ${text}`);
}

const mixed = signalsFor("I do not want a loan. I need training and certification.");
assert.equal(mixed.capitalSeeking, false);
assert.equal(mixed.trainingSeeking, true);

const contrast = signalsFor("I do not want a loan, but I need an investor.");
assert.equal(contrast.capitalSeeking, true, "an affirmed intent after 'but' must remain detectable");
assert.equal(contrast.partnerSeeking, true);

assert.equal(signalsFor("I am explaining the plan.").trainingSeeking, false);
assert.equal(signalsFor("I don't not want a loan.").capitalSeeking, true, "double negative must not be flattened");

console.log(JSON.stringify({
  pass: true,
  positive_word_family_cases: positiveCases.length,
  explicit_negation_cases: negativeCases.length,
  checks: [
    "common_inflections_detected",
    "explicit_negative_intent_suppressed",
    "mixed_domain_clauses_kept_separate",
    "contrastive_affirmation_preserved",
    "unrelated_substring_control",
    "double_negative_not_flattened"
  ]
}, null, 2));
