import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const words = (value) => value.trim().split(/\s+/).filter(Boolean).length;

const copySource = read("lib/copy.ts");
const heroBlock = read("components/foundry/hero-copy-block.tsx");
const heroStatic = read("components/foundry/hero-static.tsx");
const narrative = read("lib/narrative-arc.ts");
const css = read("app/globals.css");

const extractSingleLineString = (source, pattern, label) => {
  const match = source.match(pattern);
  assert.ok(match?.[1], `${label} must remain a single-line central string`);
  return match[1];
};

const disclaimer = extractSingleLineString(
  copySource,
  /disclaimer:\s*\n?\s*"([^"]+)"/,
  "shared disclaimer"
);
assert.ok(words(disclaimer) <= 16, "shared disclaimer must stay at or below 16 words");
assert.match(disclaimer, /Foundry Dues/i);
assert.match(disclaimer, /not guaranteed/i);
assert.match(disclaimer, /outcomes/i);

const valueFoldStart = copySource.indexOf("valueFold:");
const valueFoldEnd = copySource.indexOf("visualStory:", valueFoldStart);
assert.ok(valueFoldStart >= 0 && valueFoldEnd > valueFoldStart, "home value fold must remain centrally defined");
const valueFold = copySource.slice(valueFoldStart, valueFoldEnd);
const valueBodies = [...valueFold.matchAll(/body:\s*"([^"]+)"/g)].map((match) => match[1]);
assert.equal(valueBodies.length, 3, "home value fold must keep exactly three concise bodies");
for (const body of valueBodies) {
  assert.ok(words(body) <= 22, `value body exceeds 22 words: ${body}`);
}
assert.match(valueBodies[0], /real need/i);
assert.match(valueBodies[0], /reachable help/i);
assert.match(valueBodies[0], /itemized proof/i);
assert.match(valueBodies[1], /time/i);
assert.match(valueBodies[1], /proof/i);
assert.match(valueBodies[1], /money/i);
assert.match(valueBodies[2], /Crucible checks/i);
assert.match(valueBodies[2], /guarded intros/i);
assert.match(valueBodies[2], /published verification costs/i);
assert.match(valueBodies[2], /not a guaranteed match or outcome/i);

// Compression must not weaken the separate proof/provider or member-choice boundaries.
assert.match(copySource, /Proof and Crucible surfaces are preview placeholders until counsel and providers approve live checks/);
assert.match(copySource, /Itemized verification at the moment of reliance\. You choose the next step\./);

// The shared home opening renders one explanation and one trust line, not three repeated promises.
assert.match(heroBlock, /<p className="hero-lead">\{copy\.hero\.subhead\}<\/p>/);
assert.doesNotMatch(heroBlock, /copy\.hero\.(?:positioning|beforeState)/);
assert.match(heroStatic, /copy\.hero\.trustLine/);
assert.doesNotMatch(heroStatic, /copy\.hero\.signupPreview/);

// Shared narrative pages use human-facing copy and a comfortable reading measure.
assert.doesNotMatch(narrative, /narrative wire|Ghost Forge previews|brand approval/i);
assert.match(narrative, /From first spark to working floor—one step at a time/);
assert.match(css, /\.narrative-act-hero__lede\s*\{[^}]*max-width: 42ch;[^}]*line-height: 1\.7;[^}]*text-wrap: pretty;/s);
assert.match(css, /\.narrative-act-body p\s*\{[^}]*max-width: 68ch;[^}]*line-height: 1\.7;[^}]*text-wrap: pretty;/s);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "shared_disclaimer_brevity_and_truth",
    "home_value_fold_word_ceilings",
    "proof_and_member_choice_boundaries",
    "home_opening_single_explanation",
    "shared_narrative_human_voice",
    "shared_narrative_reading_measure"
  ]
}, null, 2));
