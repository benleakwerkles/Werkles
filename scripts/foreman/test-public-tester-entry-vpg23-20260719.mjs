import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const hero = read("components/foundry/hero-static.tsx");
const header = read("components/foundry/site-header.tsx");
const copy = read("lib/copy.ts");
const visualStory = read("components/foundry/visual-story-section.tsx");
const lanes = read("components/foundry/lanes-documentary-section.tsx");
const bellows = read("app/bellows/page.tsx");

assert.match(copy, /primaryCta: "See the worked example"/);
assert.doesNotMatch(copy, /Example reveal[^\n]*draft illustration/);
assert.match(hero, /className="button button-light" href="\/bellows\/recommendations"/);
assert.match(header, /className="header-cta" href="\/bellows\/recommendations"/);
assert.doesNotMatch(hero, /className="button button-light" href="\/signup"/);
assert.doesNotMatch(header, /className="header-cta" href="\/signup"/);

for (const [name, source] of [
  ["visual story", visualStory],
  ["lanes", lanes],
  ["Bellows", bellows]
]) {
  assert.doesNotMatch(source, /Attribution|attribution/, `${name} must not expose internal attribution notes`);
}
assert.doesNotMatch(lanes, /Documentary photographs|game UI|guru fog/);

const recommendationIndex = bellows.indexOf('href="/bellows/recommendations"');
const profileIndex = bellows.indexOf('href="/dashboard/profile?next=%2Fbellows%2Frecommendations"');
const intakeIndex = bellows.indexOf('href="/bellows/intake"');

assert.ok(recommendationIndex > -1, "Bellows must link to recommendations");
assert.ok(profileIndex > recommendationIndex, "Profile must follow the recommendation doorway");
assert.ok(intakeIndex > profileIndex, "Closed intake must remain secondary");
assert.match(bellows, /Recommendations first\. Your profile makes them personal\./);
assert.match(bellows, /Intake submission is temporarily closed/);
assert.match(bellows, /Review the intake \(closed\)/);
assert.match(bellows, /className="button button-ghost" href="\/bellows\/intake"/);

console.log("PASS VPG23 public tester entry and public-copy boundary (17 checks)");
