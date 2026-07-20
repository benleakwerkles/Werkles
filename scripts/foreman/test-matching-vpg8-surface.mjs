/**
 * VPG8 focused proof: public recommendations are example-only, saving stays
 * closed, and Rules score language is scoped to the recommendation surface.
 * Run: node scripts/foreman/test-matching-vpg8-surface.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

const helper = read("lib/squibb/public-recommendation-session-server.ts");
const recommendationsSource = read("lib/squibb/recommendations.ts");
const surface = read("components/squibb/recommendation-surface.tsx");
const meter = read("components/squibb/confidence-meter.tsx");
const card = read("components/squibb/recommendation-card.tsx");
const humanGateStrip = read("components/squibb/human-gate-strip.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");
const packetRoute = read("app/api/bellows/recommendations/packet/route.ts");

for (const forbiddenReader of [
  "loadSquibbRecommendationSessionForBellows",
  "loadBellowsPacketLedger",
  "readLatestSpeakerIntake",
  "readLatestShadowRuns",
  "readLatestIntakeRows",
  "readLatestOptionPacketRows"
]) {
  assert.doesNotMatch(helper, new RegExp(forbiddenReader), `public helper must not use ${forbiddenReader}`);
}
assert.match(helper, /intakes:\s*\[\]/);
assert.match(helper, /optionPackets:\s*\[\]/);
assert.match(helper, /Rules-based recommendation example/);

const transpiledHelper = ts.transpileModule(helper, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  }
}).outputText;

const transpiledRecommendations = ts.transpileModule(recommendationsSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  }
}).outputText;

const recommendationsModule = { exports: {} };
new Function("require", "module", "exports", transpiledRecommendations)(
  (id) => {
    throw new Error(`Unexpected recommendation dependency: ${id}`);
  },
  recommendationsModule,
  recommendationsModule.exports
);
const demo = recommendationsModule.exports.loadSquibbRecommendationSession();

function visibleRecommendationStrings(session) {
  const values = [session.statedNeed, session.operatorContext, session.squibbIntro];

  for (const recommendation of [...session.ranked, ...session.catalog]) {
    values.push(
      recommendation.title,
      recommendation.headline,
      recommendation.squibbNote,
      recommendation.reasoning.statedNeed,
      recommendation.reasoning.translatedNeed,
      ...recommendation.reasoning.rationale,
      recommendation.reasoning.counterpoint,
      recommendation.confidence.why,
      recommendation.suggestedAgent,
      recommendation.suggestedTool,
      recommendation.keepOriginalPathLabel
    );
    for (const evidence of recommendation.evidence) values.push(evidence.label, evidence.source);
    for (const gate of recommendation.humanGates) values.push(gate.label, gate.reason);
  }

  return values.filter(Boolean).join("\n");
}

async function loadPublicPageData(publicEnabled) {
  const module = { exports: {} };

  function requireStub(id) {
    if (id === "server-only") return {};
    if (id === "@/lib/matching/feature-flags") {
      return { isMatchingPublicEnabled: () => publicEnabled };
    }
    if (id === "@/lib/squibb/recommendations") {
      return { loadSquibbRecommendationSession: () => demo };
    }
    throw new Error(`Unexpected public-page dependency: ${id}`);
  }

  new Function("require", "module", "exports", transpiledHelper)(requireStub, module, module.exports);
  return module.exports.loadPublicBellowsRecommendationPageData();
}

for (const publicEnabled of [false, true]) {
  const data = await loadPublicPageData(publicEnabled);
  assert.deepEqual(data.ledger, { intakes: [], optionPackets: [] });
  assert.equal(data.session.source.mode, "demo");
  assert.doesNotMatch(JSON.stringify(data), /private-sentinel|latest_intake|packet_id/i);
  assert.equal(data.session.ranked.length, 3);
  assert.equal(data.session.catalog.length, 12);
  assert.equal(
    [...data.session.ranked, ...data.session.catalog].flatMap((recommendation) => recommendation.humanGates)
      .length,
    33
  );
  assert.equal(
    [...data.session.ranked, ...data.session.catalog]
      .flatMap((recommendation) => recommendation.humanGates)
      .filter((gate) => gate.benMustApprove).length,
    15
  );
  assert.doesNotMatch(
    visibleRecommendationStrings(data.session),
    /Squibb \(scout\)|Operator \+ Dink|Thufir \(research\)|Ender \(curriculum\)|Petra|Skybro|Speaker|Crucible|Layer 0|Ben (?:must|approval)|No Operator gate|preview operator profile|Bellows (?:intake|SOP)|\bdispatch\b/i
  );
}
assert.equal((await loadPublicPageData(true)).session.source.label, "Rules-based recommendation example");

assert.match(surface, /SAVE_CLOSED_BETA\s*=\s*true/);
assert.match(
  surface,
  /Saving is unavailable during this beta\. Nothing is sent to another person or organization from these controls\./
);
assert.equal(surface.match(/disabled=\{SAVE_CLOSED_BETA\}/g)?.length, 3);
assert.match(surface, /variant="rules_score"/);
assert.match(surface, /aria-describedby="squibbRecommendationSavingStatus"/);
assert.match(
  surface,
  /Nothing is saved from this example\. Nothing is sent to another person or organization\./
);
const exampleCustody = surface.slice(
  surface.indexOf("{isExample ? ("),
  surface.indexOf('<p className="eyebrow">{isPersonal ?')
);
assert.doesNotMatch(exampleCustody, /Review the closed intake questions/);
assert.doesNotMatch(surface, /Make these recommendations yours/);
assert.doesNotMatch(surface, /fetch\s*\(/);
assert.doesNotMatch(surface, /stagePacket\s*\(/);

assert.doesNotMatch(card, /confidence\.score/);
assert.doesNotMatch(card, /squibb-rec-card__confidence/);

assert.match(humanGateStrip, /Before anything moves/);
assert.match(humanGateStrip, /An authorized reviewer must approve/);
assert.match(humanGateStrip, /Review required/);
assert.match(humanGateStrip, /No additional review/);
assert.doesNotMatch(humanGateStrip, /Ben must approve|No Operator gate/);

assert.match(meter, /variant\?: "confidence" \| "rules_score"/);
assert.match(meter, /variant = "confidence"/);
assert.match(meter, /Support band: \{band\}/);
assert.match(meter, /Limited rule support/);
assert.match(meter, /Moderate rule support/);
assert.match(meter, /Stronger rule support/);
assert.match(
  meter,
  /This rules score shows how strongly the current rules support this option based on what you entered\. It is not a probability of success, a measure of eligibility, or a predicted outcome\./
);
assert.match(
  meter,
  /This rules score shows how strongly the current rules support this option based on the information in this example\. It is not a probability of success, a measure of eligibility, or a predicted outcome\./
);
assert.match(meter, />Confidence</);
assert.match(meter, /\{clamped\}%/);

for (const safeColor of ["#f4e2b1", "#c9b896", "#191817", "#2c231d"]) {
  assert.match(css, new RegExp(safeColor));
}
for (const unsafePageOverride of ["#f7ecd4", "#e2c9a0", "#b5a48c"]) {
  assert.doesNotMatch(css, new RegExp(unsafePageOverride));
}
assert.match(css, /\.squibb-rec-card[\s\S]*color: var\(--squibb-rec-on-dark\)/);
assert.match(css, /\.squibb-evidence__item[\s\S]*color: var\(--squibb-rec-on-dark\)/);
assert.match(css, /\.squibb-rec-ledger__item[\s\S]*color: var\(--squibb-rec-on-dark\)/);
assert.match(css, /\.squibb-gates__summary[\s\S]*color: #7b2929/);
assert.match(css, /\.squibb-gates__operator-note[\s\S]*color: var\(--squibb-rec-muted-on-light\)/);
assert.match(css, /\.squibb-gate__approval[\s\S]*color: var\(--squibb-rec-muted-on-light\)/);
assert.match(css, /\.squibb-rec-surface \.eyebrow[\s\S]*color: #68411f/);
assert.match(
  css,
  /\.squibb-gate--blocker[\s\S]*background: color-mix\([\s\S]*var\(--werkles-workshop-night, #191817\)/
);

assert.match(packetRoute, /status:\s*403/);
assert.doesNotMatch(packetRoute, /store|insert|upsert|saveSquibbRecommendation/i);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "public_example_only_zero_personal_readers",
        "clean_checkout_public_copy_reproduced",
        "gate_structure_and_approval_flags_preserved",
        "empty_public_ledger",
        "save_controls_disabled_and_no_client_post",
        "recommendation_only_rules_score",
        "shared_confidence_default_preserved",
        "page_scoped_canonical_dark_contrast_tokens",
        "direct_packet_post_still_403"
      ]
    },
    null,
    2
  )
);
