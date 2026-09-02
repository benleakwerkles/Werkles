import assert from "node:assert/strict";

import { shadowRunToRecommendationSession } from "../../lib/matching/shadow-to-recommendations.ts";

const session = shadowRunToRecommendationSession({
  runId: "run-key-regression",
  intakeId: "intake-key-regression",
  source: "bellows_concierge",
  mode: "shadow",
  signals: {
    statedNeed: "Help me decide what to do next.",
    intakeTextBlob: "Help me decide what to do next."
  },
  readout: {
    primaryBottleneck: "A decision is still open.",
    recommendationCard: {
      whatYouAskedFor: "Help me decide what to do next.",
      whatWeHeardUnderneath: "A decision is still open.",
      visibleReasons: []
    },
    facts: [
      {
        id: "stated-need",
        label: "Stated need",
        value: "Help me decide what to do next.",
        strength: "self_reported",
        source: "bellows_concierge"
      },
      {
        id: "assets",
        label: "Assets",
        value: "Not supplied",
        strength: "missing",
        source: "bellows_concierge"
      }
    ],
    scoredPaths: []
  },
  squibb: {
    keepOriginalPathLabel: "Keep my current approach"
  },
  createdAt: "2026-08-16T00:00:00.000Z"
} as never);

const excerpts = session.source?.fedDocument?.excerpts ?? [];
const ids = excerpts.map((excerpt) => excerpt.id);

assert.equal(new Set(ids).size, ids.length, "source-document excerpt IDs must be unique React keys");
assert.equal(ids.filter((id) => id === "stated-need").length, 1);
assert.deepEqual(ids, ["stated-need", "assets"]);

console.log("Source-document excerpt key regression: PASS");
