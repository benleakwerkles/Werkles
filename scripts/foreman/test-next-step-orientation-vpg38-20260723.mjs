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

const surface = read("components/squibb/recommendation-surface.tsx");
const card = read("components/squibb/recommendation-card.tsx");
const routeSource = read("app/api/bellows/recommendations/packet/route.ts");
const selection = loadTs(read("lib/squibb/recommendation-selection.ts"));

const dispatch = surface.slice(
  surface.indexOf('<dl className="squibb-rec-detail__dispatch">'),
  surface.indexOf("</dl>", surface.indexOf('<dl className="squibb-rec-detail__dispatch">'))
);
assert.match(dispatch, /<dt>Start with<\/dt>[\s\S]*\{selected\.suggestedAgent\}/);
assert.match(
  dispatch,
  /selected\.suggestedTool \? \([\s\S]*<dt>Helpful check or prep<\/dt>[\s\S]*\{selected\.suggestedTool\}/
);
assert.doesNotMatch(dispatch, /Suggested support|<dt>Verification<\/dt>/);

assert.match(surface, />\s*Update my profile\s*<\/Link>/);
assert.match(surface, /href="\/dashboard\/profile\?next=%2Fbellows%2Frecommendations"/);
assert.match(surface, />\s*Check proof and gaps\s*<\/button>/);
assert.match(surface, /aria-controls=\{RECOMMENDATION_EVIDENCE_ID\}[\s\S]*onClick=\{reviewProofAndGaps\}/);
assert.match(surface, /href=\{continuationAction\.href\}/);

assert.match(
  surface,
  /id=\{RECOMMENDATION_COLLECTION_ID\}[\s\S]*aria-labelledby=\{RECOMMENDATION_COLLECTION_TITLE_ID\}/
);
assert.match(
  surface,
  /<h2 id=\{RECOMMENDATION_COLLECTION_TITLE_ID\} className="squibb-rec-surface__stack-title">/
);
assert.equal((surface.match(/id=\{RECOMMENDATION_COLLECTION_TITLE_ID\}/g) || []).length, 1);
assert.equal((surface.match(/aria-labelledby=\{RECOMMENDATION_COLLECTION_TITLE_ID\}/g) || []).length, 1);
assert.match(card, /type="button"[\s\S]*aria-pressed=\{selected\}[\s\S]*aria-controls=\{detailId\}/);

const statusStart = surface.indexOf('<p className="squibb-rec-selection-status"');
const statusEnd = surface.indexOf("</p>", statusStart);
const status = surface.slice(statusStart, statusEnd);
assert.match(status, /role="status" aria-atomic="true"/);
assert.doesNotMatch(status, /aria-live/);
assert.match(status, /\{selectionAnnouncement\}/);

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
const selectSlice = surface.slice(
  surface.indexOf("function selectRecommendation"),
  surface.indexOf("function reviewProofAndGaps")
);
assert.doesNotMatch(selectSlice, /focus|scrollIntoView|scrollTo|requestAnimationFrame/);

assert.match(surface, /Saving is closed in this beta\. Nothing is sent\./);
assert.match(surface, /id="squibbRecommendationSavingStatus"[\s\S]*role="note"/);
assert.doesNotMatch(routeSource, /request\.(?:json|text|formData)|insert|update|upsert|delete|writeFile/i);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "support_and_check_labels_are_plain_language",
    "support_and_tool_values_are_unchanged",
    "profile_action_is_direct_and_keeps_exact_return_route",
    "proof_action_is_direct_and_keeps_evidence_handler",
    "continuation_destination_is_unchanged",
    "collection_uses_its_visible_dynamic_heading",
    "collection_heading_binding_is_unique",
    "cards_keep_native_pressed_and_detail_control_semantics",
    "selection_status_keeps_atomic_implicit_polite_semantics",
    "selection_matrix_is_valid_change_only",
    "selection_adds_no_focus_or_detail_scroll",
    "saving_and_write_boundaries_remain_closed"
  ]
}, null, 2));
