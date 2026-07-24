import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const reasoning = read("components/squibb/reasoning-panel.tsx");
const evidence = read("components/squibb/evidence-section.tsx");
const intake = read("components/squibb/concierge-intake-form.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");

assert.match(reasoning, /<details className="squibb-reasoning squibb-rec-collapse">/);
assert.match(reasoning, /<summary className="squibb-rec-collapse__summary">Why this option<\/summary>/);
assert.match(evidence, /<details[^>]*className="squibb-evidence squibb-rec-collapse">/);
assert.match(evidence, /<summary className="squibb-rec-collapse__summary">Proof and gaps<\/summary>/);
assert.match(css, /\.squibb-rec-collapse\s*\{/);
assert.match(css, /\.squibb-rec-collapse\[open\] \.squibb-rec-collapse__summary/);

assert.doesNotMatch(intake, /formatSpeakerIntakeJson/);
assert.doesNotMatch(intake, /Speaker intake packet|Structured JSON \(Speaker feed\)|Symptom block/);
assert.match(intake, /<h2 id="intakeOutputTitle">What we heard<\/h2>/);
assert.match(intake, /<p className="concierge-intake__section-label">Your situation<\/p>/);
assert.match(intake, />\s*See an example\s*<\/Link>/);
assert.match(intake, /disabled=\{!BELLOWS_INTAKE_SUBMISSION_OPEN \|\| !canSubmit/);
assert.match(intake, /Nothing you type here is saved or sent/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "reasoning_uses_native_progressive_disclosure",
        "evidence_uses_native_progressive_disclosure",
        "disclosure_styles_preserve_visible_keyboard_summary",
        "intake_confirmation_uses_human_language",
        "intake_confirmation_hides_internal_packet_json",
        "closed_intake_and_custody_truth_remain_intact"
      ]
    },
    null,
    2
  )
);
