import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const css = await readFile(
  path.join(repoRoot, "app/bellows/recommendations/squibb-recommendations.css"),
  "utf8"
);
const meter = await readFile(
  path.join(repoRoot, "components/squibb/confidence-meter.tsx"),
  "utf8"
);
const gates = await readFile(
  path.join(repoRoot, "components/squibb/human-gate-strip.tsx"),
  "utf8"
);

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

assert.match(meter, /className="squibb-confidence__score"/);
assert.match(gates, /className="squibb-gate__approval"/);
assert.match(gates, /squibb-gate__approval squibb-gate__approval--auto/);

assert.match(
  css,
  /\.squibb-confidence__score\s*\{[^}]*color: var\(--squibb-rec-ink\)/,
  "the visible rules score must use the route's high-contrast ink"
);
assert.match(
  css,
  /\.squibb-gate__approval\s*\{[^}]*color: var\(--squibb-rec-eyebrow\)/,
  "required-review copy must use readable warm ink"
);
assert.match(
  css,
  /\.squibb-gate__approval--auto\s*\{[^}]*color: var\(--squibb-rec-label\)/,
  "no-additional-review copy must use readable label ink"
);

for (const selector of [
  ".squibb-confidence__score",
  ".squibb-gate__approval",
  ".squibb-gate__approval--auto"
]) {
  const rule = css.match(new RegExp(`${selector.replaceAll(".", "\\.")}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  assert.doesNotMatch(
    rule,
    /--squibb-rec-(?:on-light|muted-on-light)/,
    `${selector} must not regress to dark ink on this dark recommendation surface`
  );
}

// #121412 is the lightest solid stop in Page 0's scoped dark canvas.
for (const [label, foreground] of [
  ["rules score", "#faf6eb"],
  ["review required", "#e8b878"],
  ["no additional review", "#cfc0a3"]
]) {
  assert.ok(
    contrast(foreground, "#121412") >= 4.5,
    `${label} must retain WCAG AA normal-text contrast on the Page 0 canvas`
  );
}

console.log("Concierge Page 0 contrast contract: PASS");
