import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const home = read("app/page.tsx");
const doorway = read("app/beta-signup-form.tsx");
const route = read("app/api/beta/route.ts");

assert.match(home, /import BetaSignupDoorway from "\.\/beta-signup-form"/);
assert.match(home, /<BetaSignupDoorway \/>/);
assert.doesNotMatch(home, /DraftReviewBadge|BetaSignupForm/);

assert.match(doorway, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(doorway, /href="\/bellows\/recommendations"/);
assert.doesNotMatch(doorway, /<form|<input|<select|fetch\(|\/api\/beta|FormData|useState/);

assert.match(route, /export async function POST\(\)/);
assert.match(route, /\{ status: 503 \}/);
assert.match(route, /Cache-Control", "no-store"/);
assert.doesNotMatch(
  route,
  /NextRequest|request\.json|getSupabaseService|\.from\(|\.insert\(|error\.message|email|laneMap/
);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "homepage_uses_noncollecting_doorway",
        "signup_preserves_recommendation_return",
        "recommendation_example_remains_public",
        "email_lane_form_and_beta_fetch_removed",
        "beta_post_has_no_request_input",
        "beta_post_returns_generic_503_no_store",
        "beta_route_has_no_supabase_or_provider_error_path"
      ]
    },
    null,
    2
  )
);
