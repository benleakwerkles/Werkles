import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { recommendationGuidance } from "../../lib/matching/recommendation-guidance.ts";

const kinds = ["verify_proof", "find_credit_union", "find_equipment"] as const;
const guidance = kinds.map(recommendationGuidance);

assert.equal(new Set(guidance.map((item) => item.headline)).size, kinds.length);
assert.equal(new Set(guidance.map((item) => item.summary)).size, kinds.length);
assert.ok(guidance.every((item) => item.nextSteps.length === 3));
assert.ok(guidance.every((item) => !/proof and sizing/i.test(`${item.headline} ${item.summary}`)));

const [sourcePanel, surface, score, gates, route, intakePage] = await Promise.all([
  readFile("components/squibb/source-document-panel.tsx", "utf8"),
  readFile("components/squibb/recommendation-surface.tsx", "utf8"),
  readFile("components/squibb/confidence-meter.tsx", "utf8"),
  readFile("components/squibb/human-gate-strip.tsx", "utf8"),
  readFile("app/api/bellows/intake/recover-local/route.ts", "utf8"),
  readFile("app/bellows/intake/page.tsx", "utf8")
]);

assert.match(sourcePanel, /<details className="squibb-intake-readback panel">/);
assert.match(sourcePanel, /Your Pooka has some ideas/);
assert.doesNotMatch(sourcePanel, /What Werkles heard from you/);
assert.match(surface, /Why Werkles showed this option/);
assert.match(surface, /What connected it to your answers/);
assert.match(surface, /Boundary/);
assert.match(surface, /<details className="squibb-rec-detail__answer-trace">/);
assert.doesNotMatch(score, /Support band:/);
assert.match(score, /Why this ranked here/);
assert.doesNotMatch(gates, /A person checks this first/);
assert.match(route, /VERCEL_ENV === "production"/);
assert.match(route, /isGhostFleetEnabled/);
assert.match(route, /member_dev-preview-user/);
assert.doesNotMatch(route, /answers|packet\.symptoms|body:/);
assert.match(intakePage, /Continue with my last local Intake/);
assert.match(intakePage, /not account saving/);

console.log("Pithy Recommendations + local Intake recovery: PASS");
