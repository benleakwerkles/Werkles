import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function count(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

const profile = read("app/dashboard/profile/page.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const recommendationCss = read("app/bellows/recommendations/squibb-recommendations.css");
const globals = read("app/globals.css");

const optionalTailComponent = profile.slice(
  profile.indexOf("function RecommendationOptionalProfileTail"),
  profile.indexOf("function splitTags")
);
const optionalTailCall = profile.slice(
  profile.indexOf("<RecommendationOptionalProfileTail"),
  profile.indexOf("</RecommendationOptionalProfileTail>")
);

assert.match(optionalTailComponent, /if \(!collapsed\) return <>\{children\}<\/>/);
assert.match(
  optionalTailComponent,
  /<details className="recommendation-profile-optional">[\s\S]*<summary>Add more profile details \(optional\)<\/summary>[\s\S]*\{children\}[\s\S]*<\/details>/
);
assert.doesNotMatch(optionalTailComponent, /<details[^>]*\sopen(?:=|>)/);
assert.match(profile, /<RecommendationOptionalProfileTail collapsed=\{isRecommendationJourney\}>/);
assert.match(optionalTailCall, /name="first_name"[\s\S]*name="contact_email"[\s\S]*name="lane"[\s\S]*name="visibility_mode"[\s\S]*name="skills_offered"/);
assert.doesNotMatch(optionalTailCall, /\sdisabled(?:=|>)/);
assert.doesNotMatch(profile, /Save remaining profile details/);
assert.match(profile, /Save and see my recommendation/);
assert.match(profile, /Save changes and refresh recommendation/);
assert.match(profile, /if \(isRecommendationJourney && isRecommendationReady\) \{\s*window\.location\.assign\(recommendationReturnPath\);/);
assert.match(optionalTailCall, /\{!isRecommendationJourney \? \([\s\S]*Save profile[\s\S]*See my private recommendation/);

assert.equal(count(surface, /<Image\b/g), 1);
assert.match(
  surface,
  /RENDER_BATCH_4_SQUIBB_ENABLED \? \([\s\S]*src=\{squibbBellowsAssets\.lessonCard\}[\s\S]*alt="Squibb, an owl workshop guide, pointing to a blank clipboard"[\s\S]*Squibb guides the readout\. You make the call\./
);
assert.doesNotMatch(surface, /\/assets\/draft\/squibb-bellows-v1/);
assert.match(recommendationCss, /\.squibb-rec-surface__hero-grid\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(180px, 280px\)/);
assert.match(
  recommendationCss,
  /@media \(max-width: 900px\)\s*\{[\s\S]*\.squibb-rec-surface__hero-grid\s*\{\s*grid-template-columns: 1fr/
);
assert.match(recommendationCss, /\.squibb-rec-surface__guide-image\s*\{[\s\S]*width: 100%[\s\S]*height: auto[\s\S]*aspect-ratio: 16 \/ 9[\s\S]*object-fit: cover/);
assert.match(globals, /\.recommendation-profile-optional > summary:focus-visible\s*\{[\s\S]*outline: 2px solid currentColor/);
assert.match(globals, /\.recommendation-profile-optional__grid\s*\{[\s\S]*display: grid/);

assert.match(surface, /\{rulesScore\}\/100|<ConfidenceMeter/);
assert.match(surface, /<HumanGateStrip gates=\{selected\.humanGates\}/);
assert.match(surface, /<EvidenceSection[\s\S]*items=\{selected\.evidence\}/);
assert.match(surface, /href=\{continuationAction\.href\}/);
assert.match(surface, /Saving is closed in this beta\. Nothing is sent\./);
assert.doesNotMatch(surface, /\bfetch\s*\(|localStorage|sessionStorage/);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      checks: [
        "ordinary_profile_children_render_without_disclosure",
        "recommendation_optional_tail_uses_closed_native_disclosure",
        "recommendation_optional_controls_remain_mounted_enabled_and_value_bound",
        "duplicate_lower_recommendation_submit_removed",
        "primary_recommendation_save_and_safe_return_preserved",
        "ordinary_profile_actions_preserved",
        "exactly_one_existing_feature_gated_squibb_figure",
        "guide_alt_and_guide_not_decider_caption_are_explicit",
        "guide_uses_asset_constant_not_one_off_path",
        "guide_and_optional_tail_are_responsive",
        "ranking_score_proof_gate_and_destination_rendering_preserved",
        "recommendation_surface_adds_no_request_or_browser_storage"
      ]
    },
    null,
    2
  )
);
