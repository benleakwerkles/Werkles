import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const recommendationPage = read("app/bellows/recommendations/page.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const recommendationCss = read("app/bellows/recommendations/squibb-recommendations.css");
const profile = read("app/dashboard/profile/page.tsx");

const recommendationNav = recommendationPage.slice(
  recommendationPage.indexOf('<nav className="squibb-rec-page__nav"'),
  recommendationPage.indexOf("</nav>")
);
assert.match(recommendationNav, /href="\/bellows"/);
assert.doesNotMatch(recommendationNav, /\/dashboard\/profile|>\s*Profile\s*</);

const signedOutDelivery = delivery.slice(
  delivery.lastIndexOf('delivery.status === "signed_out" ? (')
);
const createAccountIndex = signedOutDelivery.indexOf('href="/signup?next=%2Fbellows%2Frecommendations"');
const signInIndex = signedOutDelivery.indexOf('href="/login?next=%2Fbellows%2Frecommendations"');
assert.match(signedOutDelivery, /<h2 id="personalRecommendationCtaTitle">Want one for your situation\?<\/h2>/);
assert.match(signedOutDelivery, /private rules-based\s+recommendation/);
assert.match(signedOutDelivery, /The result is not saved or forwarded\./);
assert.match(signedOutDelivery, /aria-live="polite"/);
assert.ok(createAccountIndex > -1, "signed-out recommendation must offer account creation");
assert.ok(signInIndex > createAccountIndex, "Create account must be primary and appear before Sign in");
assert.match(signedOutDelivery, /className="button button-dark"[^>]+href="\/signup\?next=/);
assert.match(signedOutDelivery, /className="button button-outline"[^>]+href="\/login\?next=/);
assert.match(recommendationCss, /\.squibb-rec-delivery-cta\s*\{/);
assert.match(delivery, /<SquibbRecommendationSurface/);

assert.match(profile, /type ProfileAuthState = "checking" \| "signed_out" \| "signed_in" \| "unavailable"/);
assert.match(profile, /useState<ProfileAuthState>\("checking"\)/);
assert.match(profile, /safeMemberReturnPath\(params\.get\("next"\), "\/bellows\/recommendations"\)/);
assert.match(profile, /const encodedRecommendationReturnPath = encodeURIComponent\(recommendationReturnPath\)/);

const profileSignedOut = profile.slice(
  profile.indexOf('profileAuthState === "signed_out" ? ('),
  profile.indexOf('profileAuthState === "signed_in" ? (')
);
const profileCreateAccountIndex = profileSignedOut.indexOf('href={`/signup?next=${encodedRecommendationReturnPath}`}');
const profileSignInIndex = profileSignedOut.indexOf('href={`/login?next=${encodedRecommendationReturnPath}`}');
assert.ok(profileCreateAccountIndex > -1, "signed-out Profile Builder must preserve the safe return for signup");
assert.ok(profileSignInIndex > profileCreateAccountIndex, "Profile Builder must keep Create account primary");
assert.doesNotMatch(profileSignedOut, /<form\b|Save profile/);

const signedInGateIndex = profile.indexOf('profileAuthState === "signed_in" ? (');
const profileFormIndex = profile.indexOf('<form className="profile-grid"');
assert.ok(signedInGateIndex > -1 && profileFormIndex > signedInGateIndex, "profile form must follow the signed-in gate");
assert.match(
  profile,
  /Add one Primary goal, Blueprint narrative, or Skills sought entry to unlock your private recommendation\./
);
assert.match(profile, /Profile saved\. Your private recommendation is ready\./);
assert.match(profile, /`Profile saved\. \$\{recommendationSignalGuidance\}`/);
assert.match(profile, /window\.location\.assign\(recommendationReturnPath\)/);
assert.doesNotMatch(profile, /router\.(?:push|replace)|window\.location\.(?:href|replace)/);

assert.match(profile, /PUBLIC_TEST_PROVIDER_ACTIONS_OPEN \? \(/);
assert.match(profile, /<button className="button button-outline" type="button" disabled>\s*ID Check — closed/);
assert.match(profile, /<button className="button button-outline" type="button" disabled>\s*Asset Check — closed/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "recommendation_nav_has_no_unconditional_profile_shortcut",
        "signed_out_recommendation_has_ordered_safe_return_actions",
        "example_recommendation_remains_visible",
        "profile_form_requires_confirmed_signed_in_state",
        "signed_out_profile_has_no_editable_form",
        "profile_auth_actions_preserve_sanitized_return",
        "profile_readiness_names_all_three_qualifying_signals",
        "profile_save_reports_ready_and_not_ready_states",
        "provider_controls_are_visibly_closed_during_public_test"
      ]
    },
    null,
    2
  )
);
