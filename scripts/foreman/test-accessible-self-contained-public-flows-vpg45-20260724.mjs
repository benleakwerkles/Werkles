#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const home = read("app/page.tsx");
const beta = read("app/beta-signup-form.tsx");
const confidence = read("components/squibb/confidence-meter.tsx");
const css = read("app/globals.css");

assert.match(home, /className="trust-state-strip" role="list" aria-label="Werkles entry paths"/);
assert.equal((home.match(/role="listitem"/g) ?? []).length >= 4, true);
assert.match(home, /className="gate-list" role="list" aria-label="Required account gate"/);
assert.doesNotMatch(home, /<div className="(?:trust-state-strip|gate-list)" aria-label=/);

assert.match(beta, /<section className="beta-form" aria-label="Public testing doorway">/);
assert.doesNotMatch(beta, /<div className="beta-form" aria-label=/);

assert.equal(
  (confidence.match(/className="squibb-confidence" role="group" aria-labelledby=/g) ?? []).length,
  2
);
assert.doesNotMatch(confidence, /className="squibb-confidence__score" aria-label=/);
assert.equal((confidence.match(/role="meter"/g) ?? []).length, 2);

const externalFontImports =
  css.match(/@import url\("https:\/\/fonts\.googleapis\.com\/[^"]+"\);/g) ?? [];
assert.equal(externalFontImports.length, 1);
assert.match(css, /font-family:\s*Fraunces,\s*Georgia,\s*(?:"Times New Roman",\s*)?serif/);
assert.match(css, /font-family:\s*"DM Sans",\s*Inter,\s*ui-sans-serif,\s*system-ui,\s*sans-serif/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "homepage_named_groups_have_list_semantics",
    "public_testing_doorway_is_a_named_section",
    "confidence_relationships_use_supported_group_role",
    "visible_score_text_has_no_prohibited_generic_aria_label",
    "meter_semantics_remain_intact",
    "external_font_dependency_is_single_and_explicit",
    "serif_and_sans_font_stacks_have_local_system_fallbacks"
  ]
}, null, 2));
