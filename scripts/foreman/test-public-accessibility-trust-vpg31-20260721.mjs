import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const profile = read("app/dashboard/profile/page.tsx");
const card = read("components/squibb/recommendation-card.tsx");

const formStart = profile.indexOf('<form className="profile-grid"');
const formEnd = profile.indexOf("</form>", formStart);
const form = profile.slice(formStart, formEnd);
const noticeIndex = form.indexOf("Public Test Data Notice");
assert.ok(formStart >= 0 && formEnd > formStart);
assert.equal((form.match(/Public Test Data Notice/g) || []).length, 1);
assert.ok(noticeIndex >= 0);
for (const marker of ["{recommendationBaseFields}", "{primaryGoalField}", "{skillsSoughtField}", "{blueprintNarrativeField}", 'type="submit"', "{!isRecommendationJourney ? displayNameField : null}", 'name="first_name"']) {
  const markerIndex = form.indexOf(marker);
  assert.ok(markerIndex > noticeIndex, `${marker} must follow the data notice`);
}

const buttonStart = card.indexOf("<button");
const buttonEnd = card.indexOf("</button>", buttonStart);
const buttonBody = card.slice(buttonStart, buttonEnd);
assert.doesNotMatch(buttonBody, /<(?:div|p|h[1-6])\b/);
for (const phrasingClass of ["squibb-rec-card__meta", "squibb-rec-card__title", "squibb-rec-card__summary", "squibb-rec-card__score", "squibb-rec-card__flags"]) {
  assert.match(buttonBody, new RegExp(`<span[^>]+className="${phrasingClass}"|<span[^>]+className=\\{[^}]*${phrasingClass}`));
}
assert.match(buttonBody, /aria-pressed=\{selected\}/);
assert.match(buttonBody, /aria-labelledby=\{`squibb-rec-title-\$\{id\}`\}/);
assert.match(buttonBody, /aria-describedby=\{descriptionIds\}/);
assert.match(buttonBody, /aria-controls=\{detailId\}/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "profile_data_notice_is_single_and_first_inside_collection_form",
    "recommendation_journey_fields_and_submit_follow_notice",
    "generic_profile_fields_follow_notice",
    "recommendation_button_contains_only_phrasing_structure",
    "recommendation_button_preserves_accessible_relationships"
  ]
}, null, 2));
