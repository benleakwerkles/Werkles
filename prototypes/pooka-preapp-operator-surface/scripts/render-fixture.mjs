#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileFixtureOperatorReview } from "../../../lib/harvey/pooka-preapp-action-catalog.mjs";
import { buildSyntheticDecisionPayload } from "../../../lib/harvey/pooka-preordained-approval.mjs";
import { buildNativeHandoff } from "../../../lib/harvey/pooka-preapp-native-handoff.mjs";
import { renderOperatorSurfaceHtml } from "../src/operator-surface.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "fixture");
mkdirSync(DIST, { recursive: true });

const review = compileFixtureOperatorReview();
const html = renderOperatorSurfaceHtml(review);
const decision = buildSyntheticDecisionPayload(review, { intent: "synthetic_ack" });
const handoff = buildNativeHandoff(review);

writeFileSync(join(DIST, "operator-review.html"), html);
writeFileSync(join(DIST, "compiled-review.json"), JSON.stringify(review, null, 2));
writeFileSync(join(DIST, "decision-payload.json"), JSON.stringify(decision, null, 2));
writeFileSync(join(DIST, "native-handoff.json"), JSON.stringify(handoff, null, 2));

process.stdout.write(
  JSON.stringify(
    {
      html: join(DIST, "operator-review.html"),
      review_sha256: review.review_sha256,
      catalog_sha256: review.catalog_sha256
    },
    null,
    2
  ) + "\n"
);
