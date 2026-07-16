import type { ShadowMatchingRun } from "@/lib/matching/types";
import {
  RECOMMENDATION_KIND_LABELS,
  type SquibbRecommendation,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

export function shadowRunToRecommendationSession(run: ShadowMatchingRun): SquibbRecommendationSession {
  const card = run.readout.recommendationCard;

  const ranked: SquibbRecommendation[] = run.readout.scoredPaths.map((path) => ({
    id: `shadow-${path.kind}`,
    kind: path.kind,
    rank: path.rank,
    title: RECOMMENDATION_KIND_LABELS[path.kind],
    headline: run.readout.primaryBottleneck,
    squibbNote:
      path.rank === 1
        ? run.squibb.topPathNote
        : path.disqualified
          ? `Not matched: ${path.disqualifyReason ?? "disqualified"}`
          : run.squibb.intro,
    reasoning: {
      statedNeed: card.whatYouAskedFor,
      translatedNeed: card.whatWeHeardUnderneath,
      rationale: [...card.visibleReasons, ...path.rationale],
      counterpoint: path.rank === 1 ? run.squibb.counterpoint ?? undefined : undefined
    },
    confidence: {
      score: path.score,
      label: path.confidenceLabel,
      why: `Layer 0 (${run.layer0.confidence}) → not-match (${run.notMatch.outcome}) → path score.`
    },
    evidence: run.readout.facts.map((f) => ({
      id: f.id,
      label: f.label,
      strength: f.strength,
      source: f.source
    })),
    humanGates: [],
    suggestedAgent: "Matching readout (facts) → Squibb (voice)",
    keepOriginalPathLabel: run.squibb.keepOriginalPathLabel
  }));

  return {
    version: "v1",
    statedNeed: run.signals.statedNeed,
    operatorContext: `Shadow run ${run.runId} · Layer 0 ${run.layer0.confidence} · not-match ${run.notMatch.outcome}`,
    squibbIntro: run.squibb.intro,
    source: {
      mode: "latest_intake",
      label: "Autonomous matching (shadow)",
      detail: `${card.recommendation.type}: ${card.recommendation.headline}`,
      intakeId: run.intakeId,
      capturedAt: run.createdAt
    },
    ranked,
    catalog: ranked
  };
}

export function recommendationCardSections(run: ShadowMatchingRun) {
  return run.readout.recommendationCard;
}
