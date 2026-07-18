import type { ShadowMatchingRun } from "@/lib/matching/types";
import {
  eligiblePublicMatchingPaths,
  publicMatchingHumanGates
} from "@/lib/matching/public-recommendation-gates";
import {
  RECOMMENDATION_KIND_LABELS,
  type SquibbRecommendation,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

export function shadowRunToRecommendationSession(run: ShadowMatchingRun): SquibbRecommendationSession {
  const card = run.readout.recommendationCard;
  const eligiblePaths = eligiblePublicMatchingPaths(run.readout.scoredPaths);
  const memberEvidenceSource =
    run.source === "member_profile"
      ? "Your saved profile"
      : run.source === "operator_document"
        ? "Pasted document"
        : "Your intake";

  const ranked: SquibbRecommendation[] = eligiblePaths.map((path) => ({
    id: `rules-ranked-${path.kind}`,
    kind: path.kind,
    rank: path.rank,
    title: RECOMMENDATION_KIND_LABELS[path.kind],
    headline: publicSystemText(
      run.readout.primaryBottleneck,
      "Review this possible next step and its limits before acting."
    ),
    squibbNote:
      path.rank === 1
        ? "This is the highest-ranked eligible path from the current rules."
        : "This is another eligible path to compare before deciding what to do.",
    reasoning: {
      statedNeed: card.whatYouAskedFor,
      translatedNeed: publicSystemText(
        card.whatWeHeardUnderneath,
        "Werkles inferred a possible next step from the information you entered."
      ),
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
          ? memberEvidenceSource
          : f.strength === "verified"
            ? "Evidence supplied; verification details incomplete"
            : f.strength === "missing"
              ? "Not supplied"
              : "Werkles rules"
    })),
    humanGates: publicMatchingHumanGates(path.kind),
    suggestedAgent: "Werkles human review",
    keepOriginalPathLabel: "Keep my current approach"
  }));

  return {
    version: "v1",
    statedNeed: run.signals.statedNeed,
    operatorContext: `Rules-based recommendation calculated ${run.createdAt} from the information you provided.`,
    squibbIntro:
      "Werkles ranked these paths from what you entered. They are suggestions, not decisions, verified matches, or guaranteed outcomes.",
    source: {
      mode: run.source === "operator_document" ? "ephemeral_document" : "latest_intake",
      label: "Werkles rules-based recommendation",
      detail:
        "The recommendation itself is not a verified match, eligibility or funding decision, introduction, or guaranteed outcome. Evidence labels may be incomplete. Werkles has not sent this to anyone.",
      intakeId: run.intakeId,
      capturedAt: run.createdAt
    },
    ranked,
    catalog: ranked
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
