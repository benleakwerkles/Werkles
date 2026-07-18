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
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(() => ({}), loaded.exports, loaded);
  return loaded.exports;
}

const safeReturn = loadTs(read("lib/safe-member-return.ts")).safeMemberReturnPath;
const recommendationPage = read("app/bellows/recommendations/page.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const login = read("app/login/page.tsx");
const signup = read("app/signup/page.tsx");
const callback = read("app/auth/callback/page.tsx");
const onboarding = read("app/onboarding/page.tsx");
const profile = read("app/dashboard/profile/page.tsx");

const recommendationNav = recommendationPage.slice(
  recommendationPage.indexOf('<nav className="squibb-rec-page__nav"'),
  recommendationPage.indexOf("</nav>")
);
assert.match(recommendationNav, /href="\/dashboard\/profile\?next=%2Fbellows%2Frecommendations"/);
assert.match(recommendationNav, />\s*Profile\s*</);
assert.doesNotMatch(recommendationNav, /\/bellows\/intake|Review the intake|Your profile|Edit profile/);

const signedOut = delivery.slice(
  delivery.indexOf('delivery.status === "signed_out"'),
  delivery.indexOf('delivery.status === "profile_required"')
);
assert.match(signedOut, /\/login\?next=%2Fbellows%2Frecommendations/);
assert.match(signedOut, /\/signup\?next=%2Fbellows%2Frecommendations/);
assert.match(signedOut, /You are viewing an example/);
assert.doesNotMatch(delivery.slice(delivery.indexOf('delivery.status === "profile_required"')), /\/signup\?next=/);

for (const allowed of ["/dashboard", "/dashboard/profile", "/bellows/recommendations"]) {
  assert.equal(safeReturn(allowed), allowed);
}
for (const rejected of [
  "https://example.com",
  "//example.com/path",
  "\\example.com\\path",
  "/operator",
  "/api/bellows/recommendations/personal",
  "/dashboard/../operator",
  "/dashboard?next=/operator",
  "/dashboard#operator",
  "%2Fbellows%2Frecommendations"
]) {
  assert.equal(safeReturn(rejected), "/dashboard");
}

assert.match(login, /const signupHref = `\/signup\?next=\$\{encodeURIComponent\(nextPath\)\}`/);
assert.equal(login.match(/href=\{signupHref\}/g)?.length, 3);
assert.doesNotMatch(login, /href="\/signup"/);

assert.match(signup, /safeMemberReturnPath\(new URLSearchParams\(window\.location\.search\)\.get\("next"\)\)/);
assert.match(signup, /new URL\("\/auth\/callback", window\.location\.origin\)/);
assert.match(signup, /callbackUrl\.searchParams\.set\("next", safeNextPath\)/);
assert.match(signup, /emailRedirectTo: callbackUrl\.toString\(\)/);
assert.equal(signup.match(/window\.location\.href = onboardingHref/g)?.length, 2);
assert.equal(signup.match(/\/login\?next=\$\{encodeURIComponent\(nextPath\)\}/g)?.length, 2);
assert.doesNotMatch(signup, /emailRedirectTo: `|params\.get\("next"\)\s*\|\|/);

assert.match(callback, /const safeNextPath = safeMemberReturnPath\(queryParams\.get\("next"\)\)/);
assert.match(callback, /const onboardingHref = `\/onboarding\?next=\$\{encodeURIComponent\(safeNextPath\)\}`/);
assert.equal(callback.match(/router\.replace\(onboardingHref\)/g)?.length, 2);
assert.doesNotMatch(callback, /router\.replace\("\/onboarding"\)/);

assert.match(onboarding, /const profileReturnHref = `\/dashboard\/profile\?next=\$\{encodeURIComponent\(nextPath\)\}`/);
assert.match(onboarding, /function goToProfile\(\)/);
assert.equal(onboarding.match(/goToProfile\(\);/g)?.length, 6);
assert.equal(onboarding.match(/href=\{profileReturnHref\}/g)?.length, 2);
assert.doesNotMatch(onboarding, /window\.location\.href = "\/dashboard\/profile"|href="\/dashboard\/profile"/);
assert.match(profile, /safeMemberReturnPath\(params\.get\("next"\), "\/bellows\/recommendations"\)/);
assert.doesNotMatch(profile, /router\.(?:push|replace)|window\.location\.(?:href|assign|replace)/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "recommendation_nav_is_profile_first",
        "signed_out_entry_offers_signin_and_signup",
        "exact_return_allowlist_remains_closed",
        "login_signup_links_share_one_encoded_destination",
        "signup_callback_is_same_origin_and_sanitized",
        "both_callback_success_modes_preserve_destination",
        "all_onboarding_profile_exits_share_one_safe_handoff",
        "profile_builder_keeps_manual_readiness_return"
      ]
    },
    null,
    2
  )
);
