import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTs(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const loaded = { exports: {} };
  new Function("exports", "module", output)(loaded.exports, loaded);
  return loaded.exports;
}

const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const card = read("components/squibb/recommendation-card.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");
const selection = loadTs(read("lib/squibb/recommendation-selection.ts"));

for (const status of ["loading", "signed_out", "reauth_required", "profile_required", "personal", "error"]) {
  assert.match(delivery, new RegExp(`status: "${status}"`));
}
const statusPredicate = delivery.slice(
  delivery.indexOf("const showDeliveryStatus"),
  delivery.indexOf("const continuationAction")
);
for (const visible of ["loading", "reauth_required", "profile_required", "error"]) {
  assert.match(statusPredicate, new RegExp(`delivery\\.status === "${visible}"`));
}
assert.doesNotMatch(statusPredicate, /signed_out|personal/);
assert.match(delivery, /\{showDeliveryStatus \? \(/);

const personalCustody = surface.slice(surface.indexOf("{isPersonal ? ("), surface.indexOf("{isExample ? ("));
assert.match(personalCustody, /Built from your saved profile/);
assert.match(personalCustody, /account was confirmed/);
assert.match(personalCustody, /not saved or sent/);
const exampleCustody = surface.slice(surface.indexOf("{isExample ? ("), surface.indexOf('<p className="eyebrow">{isPersonal ?'));
assert.match(exampleCustody, /walkthrough, not your result/);
assert.match(exampleCustody, /Nothing is saved from this example/);
assert.match(exampleCustody, /Nothing is sent/);

const context = surface.slice(
  surface.indexOf('<dl className="squibb-rec-surface__context">'),
  surface.indexOf("</dl>", surface.indexOf('<dl className="squibb-rec-surface__context">'))
);
assert.equal((context.match(/<div>/g) || []).length, 2);
for (const field of ["session.statedNeed", "session.operatorContext", "source.label", "source.detail"]) {
  assert.equal((context.match(new RegExp(field.replace(".", "\\."), "g")) || []).length, 1);
}
assert.match(context, /Example situation/);
assert.match(context, /Your situation/);
assert.match(context, /<dt>Based on<\/dt>/);
assert.match(css, /\.squibb-rec-surface__context\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.squibb-rec-surface__context,[\s\S]*grid-template-columns: 1fr/);

const descriptionSlice = card.slice(card.indexOf("const descriptionIds"), card.indexOf("return ("));
assert.match(descriptionSlice, /`squibb-rec-meta-\$\{id\}`/);
assert.match(descriptionSlice, /`squibb-rec-score-\$\{id\}`/);
assert.match(descriptionSlice, /approvalRequired \|\| blocked \? `squibb-rec-flags-\$\{id\}` : null/);
assert.doesNotMatch(descriptionSlice, /squibb-rec-summary/);
assert.match(card, /!compact \? <span id=\{`squibb-rec-summary-\$\{id\}`\}/);
assert.match(card, /type="button"[\s\S]*aria-pressed=\{selected\}[\s\S]*aria-controls=\{detailId\}/);

const options = [
  { id: "first", title: "First option" },
  { id: "second", title: "Second option" }
];
assert.deepEqual(selection.recommendationSelectionUpdate("first", "second", options), {
  id: "second",
  announcement: "Details updated for Second option."
});
assert.equal(selection.recommendationSelectionUpdate("first", "first", options), null);
assert.equal(selection.recommendationSelectionUpdate("first", "missing", options), null);
assert.match(surface, /useState\(""\)/);
assert.match(surface, /role="status" aria-atomic="true"/);
assert.doesNotMatch(surface, /role="status" aria-live=/);
assert.match(surface, /recommendationSelectionUpdate\(selected\.id, id, activeList\)/);
const selectSlice = surface.slice(surface.indexOf("function selectRecommendation"), surface.indexOf("function reviewProofAndGaps"));
assert.match(selectSlice, /if \(!update\) return/);
assert.doesNotMatch(selectSlice, /focus|scrollIntoView|scrollTo|requestAnimationFrame/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "stable_signed_out_and_personal_status_bars_are_removed",
    "custody_notes_keep_example_and_private_truth",
    "hero_context_keeps_four_values_in_two_cards",
    "hero_context_retains_one_column_mobile_fallback",
    "card_description_keeps_meta_score_and_true_only_flags",
    "visible_card_summary_and_native_selection_semantics_remain",
    "valid_changed_selection_announces_exact_detail_update",
    "same_and_unknown_selection_fail_closed",
    "card_selection_adds_no_focus_or_scroll"
  ]
}, null, 2));
