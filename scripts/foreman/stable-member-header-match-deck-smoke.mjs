import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const nav = read("lib/site-nav.ts");
const header = read("components/foundry/site-header.tsx");
const layout = read("app/dashboard/layout.tsx");
const intros = read("app/dashboard/intros/page.tsx");
const api = read("app/api/ghost-fleet/intros/current/route.ts");
const lab = read("components/ghost-fleet/account-aware-ghost-member-lab.tsx");
const personalBellows = read("app/bellows/personal/page.tsx");
const profile = read("app/dashboard/profile/page.tsx");

assert.match(nav, /href: "\/dashboard\/intros", label: "Match Deck"/);
assert.doesNotMatch(nav, /href: "\/dashboard", label: "Match Deck"/);
for (const label of ["My Work", "Match Deck", "Bellows", "About Me"]) {
  assert.match(nav, new RegExp(`label: "${label}"`));
}
for (const retiredTopLevelLabel of ["Workshop", "Recommendations", "My Bellows", "Crucible", "Profile"]) {
  assert.doesNotMatch(nav, new RegExp(`label: "${retiredTopLevelLabel}"`));
}
assert.match(header, /getClientAccessToken/);
assert.match(header, /if \(localWalkthrough\)[\s\S]*setMemberMode\(true\)[\s\S]*return/);
assert.match(header, /MEMBER_NAV_PRESENTATION_KEY/);
assert.match(header, /grants no route or data/);
assert.match(header, /<nav aria-label="Primary navigation">/);
assert.match(header, /memberMode \? \([\s\S]*aria-label="Member navigation"/);
assert.match(header, /primaryNavItems\.map/);
assert.match(header, /memberNavItems\.map/);
assert.doesNotMatch(header, /const navItems = memberMode \?/);
assert.match(header, /aria-current=\{isCurrent\(item\.href\) \? "page"/);
assert.match(layout, /<LocalAwareSiteHeader \/>/);
assert.match(intros, /title: "Match Deck \| Werkles"/);
assert.match(intros, /Your Match Deck/);
assert.match(api, /needsIntake: true/);
assert.match(api, /emptyRecommendationView\(\)/);
assert.match(lab, /Complete Intake before Werkles builds your Match Deck/);
assert.match(lab, /suggest people intelligently/);
assert.match(personalBellows, /title: "My Bellows"/);
assert.doesNotMatch(personalBellows, /title: "My Bellows \| Werkles"/);
assert.match(profile, />\s*Open detailed checks\s*</);

for (const file of [
  "app/dashboard/blueprints/page.tsx",
  "app/dashboard/intros/page.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/crucible/page.tsx",
  "app/dashboard/billing/page.tsx"
]) {
  assert.doesNotMatch(read(file), /<nav className="dashboard-nav"/);
}

for (const file of [
  "app/bellows/intake/page.tsx",
  "app/bellows/recommendations/page.tsx",
  "app/bellows/personal/page.tsx"
]) {
  assert.doesNotMatch(read(file), /<nav[^>]+aria-label="(?:Werkles help|Personal Bellows navigation)"/);
}

console.log("Stable member header and Match Deck contract: PASS");
