/**
 * Focused Profile Builder clarity and imagery proof.
 * Run: node scripts/foreman/test-profile-builder-polish-20260717.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const page = read("app/dashboard/profile/page.tsx");
const options = read("lib/profile-builder-options.ts");
const css = read("app/globals.css");

assert.match(page, /<select name="location_state"/);
assert.doesNotMatch(page, /<input name="location_state"/);
assert.match(options, /\["GA", "Georgia"\]/);
assert.ok((options.match(/^  \["[A-Z]{2}", ".+"\],?$/gm) || []).length >= 56);

assert.match(page, /Account email/);
assert.match(page, /name="contact_email"/);
assert.match(page, /not shown on your public profile/);
assert.match(page, /form\.get\("contact_email"\)/);
assert.match(page, /userData\.user\.email \|\| null/);

for (const lane of ["Builder", "Operator", "Backer", "Connector", "Spark"]) {
  assert.match(options, new RegExp(`\\["${lane}",`));
}
assert.match(page, /Lanes route matching; they are not job titles/);
assert.doesNotMatch(page, /name="lane"[^>]*type="text"/);

assert.match(options, /\["full_name", "Full name"\]/);
assert.match(options, /\["first_name_only", "First name only"\]/);
assert.match(options, /\["alias", "Display name or alias"\]/);
assert.doesNotMatch(page, />\{mode\}<\/option>/);

assert.match(page, /list="primaryGoalSuggestions"/);
assert.match(page, /Pick a suggestion or write a goal in your own words/);
assert.match(options, /"Generational Family Business"/);
assert.match(options, /"Buy or take over a business"/);
assert.match(options, /"Find an operating partner"/);
assert.match(options, /"Venture Scale\/Exit"/);

assert.match(page, /werkles-render-batch-1-electrician-bookkeeper\.png/);
assert.match(page, /An electrician and a bookkeeper reviewing a business plan together/);
assert.match(css, /\.profile-builder-intro \{/);
assert.match(css, /\.profile-editor \.profile-grid \{\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.profile-builder-intro \{[\s\S]*grid-template-columns: 1fr/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "state_and_territory_picker_is_selectable",
        "account_and_preferred_contact_email_are_distinct",
        "contact_email_falls_back_to_account_email",
        "matching_lanes_stay_bounded_and_human_readable",
        "visibility_values_have_human_labels",
        "primary_goal_has_custom_fillable_suggestions",
        "existing_werkles_scene_lifts_the_profile_builder",
        "desktop_form_uses_readable_four_column_density",
        "profile_intro_stacks_on_mobile"
      ]
    },
    null,
    2
  )
);
