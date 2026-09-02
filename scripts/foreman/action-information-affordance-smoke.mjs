import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const marker = "/* Action signature v1.";
const markerIndex = css.indexOf(marker);
assert.notEqual(markerIndex, -1, "Action signature block is missing");
const endMarker = "/* End action signature v1. */";
const endMarkerIndex = css.indexOf(endMarker, markerIndex);
assert.notEqual(endMarkerIndex, -1, "Action signature end marker is missing");
const seal = css.slice(markerIndex, endMarkerIndex + endMarker.length);

for (const required of [
  ".button::after",
  ".header-cta::after",
  ".button::before",
  ".header-cta::before",
  'content: ""',
  "border-block-start: 2px solid currentColor",
  "border-inline-end: 2px solid currentColor",
  "flex: 0 0 1px",
  "background: currentColor",
  "cursor: pointer",
  "@media (forced-colors: active)",
  "border-color: ButtonText",
  '[aria-disabled="true"]',
  "cursor: not-allowed"
]) {
  assert.equal(seal.includes(required), true, `Action signature is missing: ${required}`);
}

for (const [label, dangerous] of [
  ["bare button", /(^|\n)button::(?:before|after)\s*[,\{]/m],
  ["bare anchor", /(^|\n)a::(?:before|after)\s*[,\{]/m],
  ["card class guess", /\[class\*=["']card["']\]::(?:before|after)/],
  ["bubble class guess", /\[class\*=["']bubble["']\]::(?:before|after)/],
  ["pill class guess", /\[class\*=["']pill["']\]::(?:before|after)/],
  ["chip class guess", /\[class\*=["']chip["']\]::(?:before|after)/]
]) {
  assert.equal(dangerous.test(seal), false, `Action cue leaked into a broad/static selector: ${label}`);
}

assert.equal(/animation\s*:/.test(seal), false, "Action meaning must not depend on animation");
assert.equal(/box-shadow\s*:/.test(seal), false, "Action signature must not reintroduce blanket shadows");

console.log("Action versus information affordance contract: PASS");
