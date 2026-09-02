import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

const [
  intakePage,
  intakeForm,
  accountAwareRecommendations,
  publicRecommendations,
  recommendationSurface,
  memberPlan
] = await Promise.all([
  read("app/bellows/intake/page.tsx"),
  read("components/squibb/concierge-intake-form.tsx"),
  read("components/squibb/account-aware-recommendation-surface.tsx"),
  read("lib/squibb/public-recommendation-session-server.ts"),
  read("components/squibb/recommendation-surface.tsx"),
  read("lib/squibb/member-recommendation-plan.ts")
]);

assert.doesNotMatch(intakePage, /member_dev-preview-user/);
assert.match(intakeForm, /completed: true/);
assert.match(intakeForm, /window\.location\.assign\("\/bellows\/recommendations"\)/);
assert.doesNotMatch(intakeForm, /disabled=\{!BELLOWS_INTAKE_SUBMISSION_OPEN/);
assert.match(intakeForm, /Saved only in this browser profile/);
assert.match(intakeForm, /another browser or device will not have it/);
assert.match(accountAwareRecommendations, /sessionFromBrowserIntake/);
assert.match(accountAwareRecommendations, /mode: "browser_intake"/);
assert.match(accountAwareRecommendations, /Clearing browser data removes it/);
assert.match(publicRecommendations, /ranked: \[\]/);
assert.doesNotMatch(publicRecommendations, /BAKERY_EQUIPMENT_SOURCE_DOCUMENT/);
assert.match(recommendationSurface, /the Intake saved in this browser/);
assert.doesNotMatch(memberPlan, /bakery or no bakery|whole bakery|shop for an oven|shared kitchen/i);

console.log("Public Intake → browser Recommendations honesty contract: PASS");
