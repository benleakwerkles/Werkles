import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const profile = read("app/dashboard/profile/page.tsx");

assert.match(delivery, /New here: confirm your email, finish First Weld/);
assert.match(delivery, /Already a member: sign in and come straight back/);
assert.match(delivery, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /href="\/login\?next=%2Fbellows%2Frecommendations"/);

const profileForm = profile.slice(profile.indexOf('<form className="profile-grid"'), profile.indexOf("</form>"));
const recommendationFirst = profileForm.slice(
  profileForm.indexOf("{isRecommendationJourney ? ("),
  profileForm.indexOf("{!isRecommendationJourney ? displayNameField : null}")
);

assert.match(recommendationFirst, /Save changes and refresh recommendation/);
assert.match(recommendationFirst, /See current saved recommendation/);
assert.ok(
  recommendationFirst.indexOf("Save changes and refresh recommendation") <
    recommendationFirst.indexOf("See current saved recommendation"),
  "saving current edits must be the primary action before reading the saved result"
);
assert.match(profile, /if \(isRecommendationJourney && isRecommendationReady\) \{\s*window\.location\.assign\(recommendationReturnPath\);/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "account_doorway_distinguishes_new_and_returning_member_paths",
        "account_doorway_preserves_encoded_recommendation_returns",
        "ready_profile_saves_edits_before_refreshing_recommendation",
        "saved_result_remains_available_as_an_explicit_secondary_action",
        "successful_ready_save_preserves_sanitized_recommendation_return"
      ]
    },
    null,
    2
  )
);
