import type { ShadowMatchingRun } from "@/lib/matching/types";
import { recommendationGuidance } from "@/lib/matching/recommendation-guidance";
import { scorePaths } from "@/lib/matching/score-paths";
import {
  eligiblePublicMatchingPaths,
  publicMatchingHumanGates
} from "@/lib/matching/public-recommendation-gates";
import {
  RECOMMENDATION_KIND_LABELS,
  loadSquibbRecommendationSession,
  type SquibbRecommendation,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";
import { memberRecommendationPresentation } from "@/lib/squibb/member-recommendation-insight";
import { buildOpportunityCase } from "@/lib/matching/opportunity-case";
import { starterProfileForSignals } from "@/lib/matching/starter-profile";

export function shadowRunToRecommendationSession(run: ShadowMatchingRun): SquibbRecommendationSession {
  const starterProfile = starterProfileForSignals(run.signals);
  const card = run.readout.recommendationCard;
  // Stored shadow runs preserve the original audit record. The member-facing
  // deck applies the current deterministic rules to those same saved signals
  // so rule repairs do not force the member to re-enter an Intake.
  const currentScoredPaths = scorePaths(run.signals, run.layer0, run.notMatch);
  const eligiblePaths = eligiblePublicMatchingPaths(currentScoredPaths);
  const opportunityCase = buildOpportunityCase(run, currentScoredPaths);

  const ranked: SquibbRecommendation[] = eligiblePaths.map((path) => {
    const guidance = recommendationGuidance(path.kind);
    const presentation = memberRecommendationPresentation(path.kind, run.signals, {
      title: RECOMMENDATION_KIND_LABELS[path.kind],
      headline: guidance.headline
    });
    return ({
    id: `automated-${path.kind}`,
    kind: path.kind,
    rank: path.rank,
    title: presentation.title,
    headline: presentation.headline,
    squibbNote:
      path.rank === 1
        ? "This is the highest-ranked eligible path from the current rules."
        : "This is another eligible path to compare before deciding what to do.",
    reasoning: {
      statedNeed: card.whatYouAskedFor,
      translatedNeed: guidance.summary,
      nextSteps: guidance.nextSteps,
      rationale: [...card.visibleReasons, ...path.rationale].map((reason) =>
        publicSystemText(
          reason,
          "A system-only reason was withheld from this public readout; human review is still required."
        )
      )
    },
    confidence: {
      score: path.score,
      label: path.confidenceLabel,
      why: "Rules-based path score from what you entered and the proof gaps recorded here. It is not a probability of success or eligibility."
    },
    evidence: run.readout.facts.map((f, index) => ({
      id: `evidence-${index + 1}`,
      label: `${memberFactLabel(f.id)}: ${
        f.strength === "self_reported"
          ? f.value
          : publicSystemText(f.value, "Details withheld pending human review")
      }`,
      // A bare `verified` flag is not enough for a public claim. The matching
      // readout does not yet carry process + scope + timestamp provenance.
      strength: f.strength === "verified" ? "inferred" : f.strength,
      source:
        f.strength === "self_reported"
          ? "Your intake"
          : f.strength === "verified"
            ? "Evidence supplied; verification details incomplete"
            : f.strength === "missing"
              ? "Not supplied"
              : "Werkles rules"
    })),
    humanGates: publicMatchingHumanGates(path.kind),
    suggestedAgent: "Werkles human review",
    keepOriginalPathLabel: "Keep my current approach"
    });
  });

  return {
    version: "v1",
    statedNeed: run.signals.statedNeed,
    operatorContext: `Automated beta recommendation generated ${run.createdAt}.`,
    squibbIntro: "Start with the first idea, then compare it with the others.",
    source: {
      mode: "latest_intake",
      label: "Werkles rules applied to your answers",
      detail:
        "The recommendation itself is not a verified match, eligibility or funding decision, introduction, or guaranteed outcome. Evidence labels may be incomplete. Werkles has not sent this to anyone.",
      intakeId: run.intakeId,
      capturedAt: run.createdAt,
      starterProfile,
      opportunityCase,
      fedDocument: {
        id: run.intakeId,
        title: "Your intake (scored text)",
        kind: "member_intake",
        summary: "Plain text the matching rules scored for this run.",
        body: run.signals.intakeTextBlob || run.signals.statedNeed || "(empty intake)",
        excerpts: [
          {
            id: "stated-need",
            label: "Stated need",
            text: run.signals.statedNeed || "(not provided)",
            feeds: currentScoredPaths.map((path) => path.kind)
          },
          ...run.readout.facts
            .filter(
              (fact) =>
                fact.id !== "stated-need" &&
                (fact.strength === "self_reported" || fact.strength === "missing")
            )
            .slice(0, 6)
            .map((fact) => ({
              id: fact.id,
              label: fact.label,
              text: fact.value,
              feeds: currentScoredPaths.map((path) => path.kind)
            }))
        ]
      }
    },
    ranked,
    catalog: loadSquibbRecommendationSession().catalog
  };
}

function memberFactLabel(id: string): string {
  const labels: Record<string, string> = {
    "stated-need": "What you entered",
    "translated-need": "What Werkles inferred",
    leverage: "Working advantage hypothesis",
    "not-match": "Safety and readiness check",
    lane: "Working style",
    assets: "Assets you named",
    "top-path": "Top rules-ranked path"
  };

  return labels[id] ?? "Additional information";
}

const INTERNAL_SYSTEM_LANGUAGE =
  /Layer 0|not-match|Squibb|autonomous|shadow|\b(?:Petra|Skybro|Dink|Thufir|Bean|Ender)\b/i;

/**
 * System-authored prose is withheld rather than rewritten when it contains
 * internal vocabulary. Member-entered evidence never passes through here.
 */
function publicSystemText(value: string, fallback: string): string {
  const candidate = value.trim();
  return candidate && !INTERNAL_SYSTEM_LANGUAGE.test(candidate) ? candidate : fallback;
}

export function recommendationCardSections(run: ShadowMatchingRun) {
  return run.readout.recommendationCard;
}
