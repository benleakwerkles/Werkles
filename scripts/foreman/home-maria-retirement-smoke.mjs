import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, copy, lanes, css] = await Promise.all([
  readFile(new URL("../../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../lib/copy.ts", import.meta.url), "utf8"),
  readFile(new URL("../../lib/documentary-lane-imagery.ts", import.meta.url), "utf8"),
  readFile(new URL("../../app/globals.css", import.meta.url), "utf8")
]);

for (const banned of [
  "SquibbStoryBeat",
  "VisualStorySection",
  "home bakery",
  "$4,200 oven"
]) {
  assert.equal(page.includes(banned), false, `Home still renders legacy narrative marker: ${banned}`);
}

for (const required of [
  "From a messy need to a usable next move.",
  "Surface the likely constraint",
  "Build a usable next-step artifact",
  "Show possible people or resources",
  "Start here",
  "What are you trying to make happen?",
  "Bring the notes, screenshots, emails, ideas, and loose ends.",
  "Hypothesis, not verdict",
  "Editable output",
  "Evidence stays visible",
  'href="/bellows/intake"',
  'href="/proof"',
  "Options, not outcomes. Nothing is contacted, verified, approved, or sent here."
]) {
  assert.equal(page.includes(required), true, `Missing replacement contract: ${required}`);
}

for (const banned of ["You bring", "diagnose it first"]) {
  assert.equal(page.includes(banned), false, `Home output invitation still sounds like a test: ${banned}`);
}

const artifactStart = copy.indexOf("artifact: {");
const artifactEnd = copy.indexOf("foldTrust:", artifactStart);
assert.ok(artifactStart >= 0 && artifactEnd > artifactStart, "Home artifact copy block missing");
const artifact = copy.slice(artifactStart, artifactEnd);

for (const banned of ["Maria", "bakery", "oven", "$4,200"]) {
  assert.equal(artifact.includes(banned), false, `Hero artifact retains legacy story: ${banned}`);
}

for (const required of ["Decision brief", "cost, timing, and evidence", "Not a guarantee or completed verification"]) {
  assert.equal(artifact.includes(required), true, `Hero artifact missing truthful replacement: ${required}`);
}

const sparkStart = lanes.indexOf("spark: {");
const sparkEnd = lanes.indexOf("builder: {", sparkStart);
assert.ok(sparkStart >= 0 && sparkEnd > sparkStart, "Spark documentary block missing");
const spark = lanes.slice(sparkStart, sparkEnd);
for (const banned of ["Maria", "baker", "bakery", "oven"]) {
  assert.equal(spark.toLowerCase().includes(banned.toLowerCase()), false, `Spark card retains legacy story: ${banned}`);
}
assert.equal(spark.includes("people-spark-idea-moment.jpg"), true, "Spark card did not move to the neutral idea moment");

const outputCssStart = css.indexOf(".home-output {");
const outputCssEnd = css.indexOf(".verification-workflow-card", outputCssStart);
assert.ok(outputCssStart >= 0 && outputCssEnd > outputCssStart, "Home output CSS block missing");
const outputCss = css.slice(outputCssStart, outputCssEnd);
for (const tooSmall of ["font-size: 0.68rem", "font-size: 0.7rem", "font-size: 0.76rem", "font-size: 0.78rem"]) {
  assert.equal(outputCss.includes(tooSmall), false, `Home output restored illegible microtype: ${tooSmall}`);
}
for (const required of ["font-size: 0.96rem", "font-size: 0.9rem", "line-height: 1.55"]) {
  assert.equal(outputCss.includes(required), true, `Home output legibility rule missing: ${required}`);
}

const contrastSeal = css.slice(css.indexOf("/* Home output contrast seal."));
for (const required of [
  "main:not(.foundry-cockpit) .home-output__prompt strong",
  "color: #ffd084",
  "main:not(.foundry-cockpit) .home-output__prompt p:not(.eyebrow)",
  "color: #fff",
  "background: #664472"
]) {
  assert.equal(contrastSeal.includes(required), true, `Home output cascade seal missing: ${required}`);
}
assert.ok(
  contrastSeal.indexOf(".home-output__prompt strong") < contrastSeal.indexOf(".home-output__prompt p:not(.eyebrow)"),
  "Home output title/body cascade order changed unexpectedly"
);

console.log("Homepage Maria narrative retirement contract: PASS");
