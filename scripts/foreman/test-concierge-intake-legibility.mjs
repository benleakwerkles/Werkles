import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile("app/bellows/intake/concierge-intake.css", "utf8");

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

assert.match(
  css,
  /\.concierge-intake-page p\.concierge-intake__storage-truth\s*\{[\s\S]*?background:\s*#241b15;[\s\S]*?color:\s*#f1d4a4 !important;/,
  "The account-storage warning must beat the global paper-ink selector on its dark surface."
);
assert.ok(contrast("#f1d4a4", "#241b15") >= 4.5, "Storage warning must meet WCAG AA text contrast.");
assert.match(css, /\.concierge-intake__hint\s*\{[\s\S]*?font-size:\s*0\.9rem;/);
assert.match(css, /\.concierge-intake__count\s*\{[\s\S]*?font-size:\s*0\.8rem;[\s\S]*?opacity:\s*1;/);
assert.match(css, /\.concierge-intake__avoid\s*\{[\s\S]*?font-size:\s*0\.92rem;[\s\S]*?line-height:\s*1\.5;/);

console.log("Concierge Intake legibility contract: PASS");
