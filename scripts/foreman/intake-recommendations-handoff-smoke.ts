import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildSpeakerIntakePacket } from "../../lib/squibb/concierge-intake-v0.ts";
import { buildIntakeSourceDocument } from "../../lib/squibb/intake-source-document.ts";

async function main() {
  const packet = buildSpeakerIntakePacket(
    {
      heaviest_lift: "Take a product to ATDC.",
      business_stage: "Testing it",
      already_tried: "Built two prototypes.",
      time_cost: "Re-teaching project context.",
      stuck_decision: "Whether the product is ready.",
      success_twelve_months: "A funded pilot.",
      resources_on_hand: "Two prototypes and three test customers.",
      what_you_offer: "Product design and user research.",
      constraints: "Keep the company in Atlanta."
    },
    "2026-08-16T00:00:00.000Z"
  );

  const doc = buildIntakeSourceDocument("intake-handoff", packet, ["verify_proof"]);
  assert.equal(doc.kind, "member_intake");
  assert.equal(doc.excerpts.length, 9);
  assert.equal(new Set(doc.excerpts.map((excerpt) => excerpt.id)).size, 9);
  assert.deepEqual(
    doc.excerpts.map((excerpt) => excerpt.text),
    packet.symptoms.map((symptom) => symptom.answer)
  );
  assert.ok(doc.body.includes("What have you already tried?"));

  const formSource = await readFile("components/squibb/concierge-intake-form.tsx", "utf8");
  assert.match(formSource, /window\.location\.assign\("\/bellows\/recommendations"\)/);
  assert.doesNotMatch(formSource, /router\.push\("\/bellows\/recommendations"\)/);

  const panelSource = await readFile("components/squibb/source-document-panel.tsx", "utf8");
  assert.match(panelSource, /Your Working Snapshot/);
  assert.match(panelSource, /<details className="squibb-intake-readback panel">/);
  assert.match(panelSource, /doc\.excerpts\.map/);

  console.log("Intake → Recommendations handoff/collapsed readback: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
