import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const css = await readFile(
  path.join(repoRoot, "app/bellows/recommendations/squibb-recommendations.css"),
  "utf8"
);
const surface = await readFile(
  path.join(repoRoot, "components/squibb/recommendation-surface.tsx"),
  "utf8"
);
const card = await readFile(
  path.join(repoRoot, "components/squibb/recommendation-card.tsx"),
  "utf8"
);

const narrow = css.match(/@media \(max-width: 900px\) \{([\s\S]*)\}\s*$/)?.[1] ?? "";
assert.match(narrow, /\.squibb-rec-surface__layout\s*\{[^}]*grid-template-columns: 1fr/);
assert.match(narrow, /\.squibb-rec-surface__stack\s*\{[^}]*overflow-x: auto/);
assert.match(narrow, /scroll-snap-type: inline mandatory/);
assert.match(narrow, /overscroll-behavior-inline: contain/);
assert.match(narrow, /padding: 0\.65rem 0\.65rem 0\.85rem/);
assert.match(narrow, /scroll-padding-inline: 0\.65rem/);
assert.match(narrow, /\.squibb-rec-stack\s*\{[^}]*grid-auto-flow: column/);
assert.match(narrow, /grid-auto-columns: min\(78vw, 18rem\)/);
assert.match(narrow, /\.squibb-rec-card\s*\{[^}]*scroll-snap-align: start/);
assert.match(narrow, /scroll-snap-stop: always/);
assert.match(
  narrow,
  /\.squibb-rec-card:focus-visible\s*\{[^}]*outline: 3px solid #b9a4ff[^}]*outline-offset: 2px/,
  "keyboard focus must remain high-contrast and unclipped inside the scroll rail"
);

assert.match(surface, /<aside className="squibb-rec-surface__stack" aria-label="Recommendation cards">/);
assert.match(
  surface,
  /className="squibb-rec-surface__detail squibb-rec-surface__detail--selected panel"/
);
assert.ok(
  surface.indexOf("squibb-rec-surface__stack") < surface.indexOf("squibb-rec-surface__detail--selected panel"),
  "the horizontal card rail must remain immediately before the selected detail"
);
assert.match(card, /<button[\s\S]*className=/);
assert.match(card, /aria-pressed=\{selected\}/);

console.log("Concierge Page 0 mobile rail contract: PASS");
