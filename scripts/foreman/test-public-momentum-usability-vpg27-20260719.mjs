import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const profile = read("app/dashboard/profile/page.tsx");
const onboarding = read("app/onboarding/page.tsx");
const privacy = read("app/privacy/page.tsx");
const firstWeldRoute = read("app/api/onboarding/first-weld/route.ts");
const releaseContract = JSON.parse(read("deploy/production-release-contract.json"));
const releaseSmoke = read("scripts/deploy/production-release-integrity-guard-smoke.mjs");

const recommendationSurfaceIndex = delivery.indexOf("<SquibbRecommendationSurface");
const signedOutDoorwayIndex = delivery.lastIndexOf('delivery.status === "signed_out" ? (');
assert.ok(recommendationSurfaceIndex > -1, "recommendation surface must render");
assert.ok(
  signedOutDoorwayIndex > recommendationSurfaceIndex,
  "the complete example must render before the signed-out account doorway"
);
const signedOutDoorway = delivery.slice(signedOutDoorwayIndex);
assert.match(signedOutDoorway, /Want one for your situation\?/);
assert.match(signedOutDoorway, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(signedOutDoorway, /href="\/login\?next=%2Fbellows%2Frecommendations"/);

const recommendationFirst = profile.slice(
  profile.indexOf("{isRecommendationJourney ? ("),
  profile.indexOf('This form saves details to your signed-in account.')
);
const basicsIndex = recommendationFirst.indexOf("{recommendationBaseFields}");
const goalIndex = recommendationFirst.indexOf("{primaryGoalField}");
const saveIndex = recommendationFirst.indexOf("Save and see my recommendation");
assert.ok(basicsIndex > -1 && basicsIndex < goalIndex, "base fields must precede recommendation signals");
assert.ok(goalIndex < saveIndex, "recommendation signals must precede the primary submit");
assert.match(profile, /profile\.display_name \? \(\s*<input type="hidden" name="display_name"/);
assert.match(profile, /profile\.location_city \? \(\s*<input type="hidden" name="location_city"/);
assert.match(profile, /profile\.location_state \? \(\s*<input type="hidden" name="location_state"/);

const submitSuccess = profile.slice(
  profile.indexOf("const { error } = await supabase.from(\"profiles\").upsert(row);"),
  profile.indexOf('async function triggerVerification')
);
const errorStopIndex = submitSuccess.indexOf("if (error)");
const readyIndex = submitSuccess.indexOf("const isRecommendationReady");
const returnIndex = submitSuccess.indexOf("window.location.assign(recommendationReturnPath)");
assert.ok(errorStopIndex > -1 && readyIndex > errorStopIndex, "readiness must be derived only after save errors stop");
assert.ok(returnIndex > readyIndex, "navigation must happen only after successful readiness");
assert.match(submitSuccess, /if \(isRecommendationJourney && isRecommendationReady\)/);
assert.match(profile, /safeMemberReturnPath\(params\.get\("next"\), "\/bellows\/recommendations"\)/);

const disclosure = /sends the ZIP you enter to Zippopotam\.us to look up city, state, latitude,\s+and longitude/;
assert.match(onboarding, disclosure, "First Weld must disclose the external ZIP lookup before collection");
assert.match(privacy, disclosure, "the Public Test Data Notice must disclose the external ZIP lookup");
assert.match(firstWeldRoute, /https:\/\/api\.zippopotam\.us\/us\/\$\{zip\}/);
for (const field of ["city: place", "state: place", "lat: Number", "lng: Number"]) {
  assert.ok(firstWeldRoute.includes(field), `ZIP lookup route must still resolve ${field}`);
}

assert.ok(releaseContract.required_app_paths.includes("/api/onboarding/first-weld/route"));
assert.ok(releaseContract.required_candidate_output_routes.includes("api/onboarding/first-weld"));
const firstWeldBoundary = releaseContract.required_candidate_http_boundaries.find(
  (boundary) => boundary.method === "POST" && boundary.path === "/api/onboarding/first-weld"
);
assert.deepEqual(firstWeldBoundary, {
  method: "POST",
  path: "/api/onboarding/first-weld",
  status: 401,
  json: { error: "Authentication required" }
});
for (const fixtureName of [
  "missing First Weld action boundary fails closed",
  "First Weld action status mismatch fails closed",
  "First Weld action JSON mismatch fails closed",
  "missing First Weld action app path fails closed",
  "missing First Weld action candidate route fails closed"
]) {
  assert.ok(releaseSmoke.includes(fixtureName), `${fixtureName} fixture must exist`);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "public_example_precedes_warm_account_doorway",
        "account_doorway_preserves_sanitized_signup_and_login_returns",
        "recommendation_fast_path_surfaces_missing_base_fields_first",
        "recommendation_submit_names_the_actual_success_handoff",
        "successful_ready_save_uses_only_the_sanitized_return",
        "generic_profile_field_instances_remain_separate_from_recommendation_mode",
        "first_weld_discloses_external_zip_lookup_at_collection",
        "privacy_notice_matches_zip_lookup_source_truth",
        "release_contract_requires_first_weld_source_output_and_auth_boundary",
        "release_smoke_fails_closed_for_first_weld_evidence_drift"
      ]
    },
    null,
    2
  )
);
