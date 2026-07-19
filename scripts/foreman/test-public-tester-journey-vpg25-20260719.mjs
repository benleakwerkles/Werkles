import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const copy = read("lib/copy.ts");
const signup = read("app/signup/page.tsx");
const onboarding = read("app/onboarding/page.tsx");
const profile = read("app/dashboard/profile/page.tsx");

assert.doesNotMatch(copy, /Activation still waits on ID, face capture, phone, and proof gates/);
assert.match(copy, /signupIdle: "Create your account, confirm your email, and we'll open your first profile step\."/);
assert.match(signup, /const RECOMMENDATION_RETURN_PATH = "\/bellows\/recommendations"/);
assert.match(signup, /const safeNextPath = safeMemberReturnPath\(params\.get\("next"\)\)/);
assert.match(
  signup,
  /current === copy\.auth\.signupIdle \? recommendationSignupIdle : current/
);
assert.match(signup, /guide you back to a private recommendation/);
assert.match(signup, /complete one quick setup step, then add a goal or project detail/);
assert.match(signup, /href=\{`\/login\?next=\$\{encodeURIComponent\(nextPath\)\}`\}/);

assert.match(onboarding, /const RECOMMENDATION_RETURN_PATH = "\/bellows\/recommendations"/);
assert.match(onboarding, /const safeNextPath = safeMemberReturnPath\(params\.get\("next"\)\)/);
assert.match(
  onboarding,
  /const profileReturnHref = `\/dashboard\/profile\?next=\$\{encodeURIComponent\(nextPath\)\}`/
);
assert.match(onboarding, /const isRecommendationJourney = nextPath === RECOMMENDATION_RETURN_PATH/);

const finishFirstWeld = onboarding.slice(
  onboarding.indexOf("function finishFirstWeld()"),
  onboarding.indexOf("async function currentUser()")
);
const recommendationBranchIndex = finishFirstWeld.indexOf("if (isRecommendationJourney)");
const profileHandoffIndex = finishFirstWeld.indexOf("goToProfile();");
const branchReturnIndex = finishFirstWeld.indexOf("return;");
const genericDoorsIndex = finishFirstWeld.indexOf('setPhase("doors")');
assert.ok(recommendationBranchIndex > -1, "First Weld must recognize the recommendation journey");
assert.ok(profileHandoffIndex > recommendationBranchIndex, "recommendation journey must use the existing profile handoff");
assert.ok(branchReturnIndex > profileHandoffIndex, "recommendation handoff must stop before generic doors");
assert.ok(genericDoorsIndex > branchReturnIndex, "generic destinations must retain the doors flow");
assert.equal(onboarding.match(/finishFirstWeld\(\);/g)?.length, 2);
assert.match(onboarding, /Save and continue to profile/);
assert.match(onboarding, /add one goal or project detail in Profile Builder and return to your private recommendation/);
assert.doesNotMatch(onboarding, /window\.location\.href\s*=\s*["']\/bellows\/recommendations/);

assert.match(profile, /See my private recommendation/);
assert.match(
  profile,
  /Add one Primary goal, Blueprint narrative, or Skills sought entry to unlock your private recommendation\./
);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "signup_removes_stale_activation_gate_claim",
        "recommendation_signup_guidance_uses_sanitized_destination",
        "generic_signup_guidance_remains_available",
        "first_weld_recognizes_only_exact_recommendation_return",
        "both_first_weld_success_paths_share_one_completion_handoff",
        "recommendation_first_weld_skips_generic_doors",
        "generic_onboarding_destinations_keep_existing_doors",
        "profile_handoff_preserves_encoded_safe_return",
        "profile_builder_retains_exact_private_result_readiness"
      ]
    },
    null,
    2
  )
);
