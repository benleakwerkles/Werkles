import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const noticePath = "app/privacy/page.tsx";
assert.ok(existsSync(path.join(root, noticePath)), "app/privacy/page.tsx must own the /privacy route");

const notice = read(noticePath);
const signup = read("app/signup/page.tsx");
const profile = read("app/dashboard/profile/page.tsx");
const personalRoute = read("app/api/bellows/recommendations/personal/route.ts");
const saveRoute = read("app/api/bellows/recommendations/packet/route.ts");
const bellowsIntakeRoute = read("app/api/bellows/intake/route.ts");
const discoveryIntakeRoute = read("app/api/discovery/intake/route.ts");
const providerBoundary = read("lib/app-infra-preview.ts");

assert.match(notice, /title: "Public Test Data Notice \| Werkles"/);
assert.match(notice, /What Werkles keeps—and what it does not\./);
assert.match(notice, /profile details you choose to save are stored for your signed-in account\./);
assert.match(notice, /personal rules-based recommendation is computed from your saved profile\./);
assert.match(notice, /The result itself is not\s+saved or forwarded\./);
assert.match(
  notice,
  /Anonymous intake submission, recommendation-result saving, and Identity or Plaid actions are closed\s+during public testing\./
);
assert.match(notice, /href="\/bellows\/recommendations"/);
assert.match(notice, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(signup, /href="\/privacy">Public Test Data Notice<\/Link>/);
assert.match(profile, /href="\/privacy">Public Test Data Notice<\/Link>/);

assert.match(profile, /\.from\("profiles"\)\.upsert\(row\)/);
assert.match(personalRoute, /persisted: false, status: "personal", session/);
assert.match(saveRoute, /Personal recommendation saving is unavailable while this beta is closed\./);
assert.match(bellowsIntakeRoute, /if \(!BELLOWS_INTAKE_SUBMISSION_OPEN\)/);
assert.match(discoveryIntakeRoute, /if \(!DISCOVERY_INTAKE_SUBMISSION_OPEN\)/);
assert.match(providerBoundary, /export const PUBLIC_TEST_PROVIDER_ACTIONS_OPEN = false;/);

assert.doesNotMatch(
  notice,
  /retention period|deletion deadline|we (?:do not|never) sell|GDPR|CCPA|HIPAA|legally compliant|compliance guarantee/i,
  "notice must not invent unverified legal, retention, deletion, or sale claims"
);

console.log(
  JSON.stringify(
    {
      pass: true,
      route: "/privacy",
      checks: [
        "privacy_route_exists",
        "account_and_profile_storage_truth",
        "personal_result_non_persistence_truth",
        "anonymous_intake_and_result_saving_closed_truth",
        "identity_and_plaid_closed_truth",
        "public_example_and_account_paths_present",
        "notice_linked_beside_signup_and_profile_collection",
        "no_unverified_policy_claims"
      ]
    },
    null,
    2
  )
);
