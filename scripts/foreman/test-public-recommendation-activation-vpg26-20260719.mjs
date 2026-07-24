import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

function count(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

const profile = read("app/dashboard/profile/page.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const recommendationCss = read("app/bellows/recommendations/squibb-recommendations.css");

assert.equal(count(profile, /name="primary_goal"/g), 1, "Primary goal must have one runtime input");
assert.equal(count(profile, /name="skills_sought"/g), 1, "Skills sought must have one runtime input");
assert.equal(
  count(profile, /name="blueprint_narrative"/g),
  1,
  "Blueprint narrative must have one runtime input"
);
assert.match(profile, /const \[isRecommendationJourney, setIsRecommendationJourney\] = useState\(false\)/);
assert.match(profile, /setIsRecommendationJourney\(params\.get\("next"\) === "\/bellows\/recommendations"\)/);

const profileForm = profile.slice(profile.indexOf('<form className="profile-grid"'), profile.indexOf("</form>"));
const recommendationFirst = profileForm.slice(
  profileForm.indexOf("{isRecommendationJourney ? ("),
  profileForm.indexOf("{!isRecommendationJourney ? displayNameField : null}")
);
const primaryFirstIndex = recommendationFirst.indexOf("{primaryGoalField}");
const skillsFirstIndex = recommendationFirst.indexOf("{skillsSoughtField}");
const narrativeFirstIndex = recommendationFirst.indexOf("{blueprintNarrativeField}");
assert.ok(primaryFirstIndex > -1, "recommendation mode must lead with Primary goal");
assert.ok(skillsFirstIndex > primaryFirstIndex, "Skills sought must follow Primary goal");
assert.ok(narrativeFirstIndex > skillsFirstIndex, "Blueprint narrative must follow Skills sought");
assert.match(recommendationFirst, /you can finish the rest later/);
assert.match(recommendationFirst, /Save and see my recommendation/);
assert.match(recommendationFirst, /Save changes and refresh recommendation/);
assert.match(recommendationFirst, /<Link className="button button-outline" href=\{recommendationReturnPath\}>/);
assert.match(recommendationFirst, /See current saved recommendation/);

const genericGoalIndex = profileForm.indexOf("{!isRecommendationJourney ? primaryGoalField : null}");
const skillsOfferedIndex = profileForm.indexOf('name="skills_offered"');
const genericSkillsIndex = profileForm.indexOf("{!isRecommendationJourney ? skillsSoughtField : null}");
const industryIndex = profileForm.indexOf('name="industry_tags"');
const genericNarrativeIndex = profileForm.indexOf("{!isRecommendationJourney ? blueprintNarrativeField : null}");
assert.ok(genericGoalIndex > profileForm.indexOf('name="timeline_to_launch"'));
assert.ok(genericSkillsIndex > skillsOfferedIndex);
assert.ok(genericNarrativeIndex > industryIndex);

const profileActions = profileForm.slice(profileForm.indexOf('<div className="profile-actions">'));
assert.match(profileActions, /Save remaining profile details/);
assert.match(profileActions, /<button className="button button-dark" type="submit">Save profile<\/button>/);
assert.match(profileActions, /<Link className="button button-outline" href=\{recommendationReturnPath\}>/);

assert.match(
  surface,
  /className="squibb-rec-surface__personal-custody" role="note" aria-label="Private recommendation"/
);
assert.match(surface, /<strong>Built from your saved profile\.<\/strong>/);
assert.match(
  surface,
  /<h1>\{isPersonal \? "Your private recommendation" : "One possible next move, explained\."\}<\/h1>/
);
assert.match(surface, /This private result was not saved or sent\./);
assert.match(surface, /aria-label="Private recommendation actions"/);
assert.match(surface, /href="\/dashboard\/profile\?next=%2Fbellows%2Frecommendations"/);
assert.match(surface, />\s*Update my profile\s*<\/Link>/);

const exampleCustody = surface.slice(
  surface.indexOf("{isExample ? ("),
  surface.indexOf('<p className="eyebrow">{isPersonal ?')
);
assert.match(exampleCustody, /aria-label="Example mode"/);
assert.match(exampleCustody, /This is a walkthrough, not your result\./);
assert.doesNotMatch(exampleCustody, /Review the closed intake questions/);
assert.match(surface, /aria-label="Available recommendation actions"/);
assert.doesNotMatch(surface, /Unavailable beta actions|Save this option|disabled=/);
assert.match(surface, /id="squibbRecommendationSavingStatus"[\s\S]*role="note"/);
assert.match(surface, /Check proof and gaps/);
assert.doesNotMatch(surface, /\bfetch\s*\(/);
assert.match(recommendationCss, /\.squibb-rec-surface__personal-custody\s*\{/);
assert.match(recommendationCss, /border-left: 3px solid var\(--werkles-teal-bright/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "recommendation_mode_leads_with_one_copy_of_each_matching_signal",
        "generic_profile_field_order_is_preserved",
        "save_then_refresh_is_the_primary_ready_profile_action",
        "generic_profile_actions_remain_available",
        "personal_recommendation_has_distinct_hero_and_custody",
        "personal_recommendation_states_closed_saving_truth",
        "personal_recommendation_has_live_edit_profile_return",
        "example_mode_copy_and_closed_actions_remain_clear",
        "recommendation_surface_adds_no_write_request"
      ]
    },
    null,
    2
  )
);
