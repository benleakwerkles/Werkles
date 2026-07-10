import type { RecommendationKind } from "@/lib/squibb/recommendations";
import type { Layer0Translation, NotMatchResult, StructuredSignals } from "@/lib/matching/types";

const PERSON_PATHS: RecommendationKind[] = ["find_partner", "stage_intro_candidate"];
const CAPITAL_PATHS: RecommendationKind[] = ["raise_capital", "find_banker", "find_credit_union"];

function isUnclearAsk(signals: StructuredSignals): boolean {
  const need = signals.statedNeed.trim();
  if (need.length < 12) return true;
  if (/^(help|idk|not sure|something|anything)$/i.test(need)) return true;
  return signals.intakeTextBlob.split(/\s+/).filter(Boolean).length < 8;
}

function isPrematureCapital(signals: StructuredSignals, layer0: Layer0Translation): boolean {
  return (
    signals.capitalSeeking &&
    !signals.assets.includes("Customers") &&
    layer0.alternativeHypotheses.some((h) => h.toLowerCase().includes("proof"))
  );
}

function isPartnerSymptom(signals: StructuredSignals, layer0: Layer0Translation): boolean {
  return (
    signals.partnerSeeking &&
    (signals.leverage.primaryHypothesis === "intrinsic" ||
      signals.leverage.primaryHypothesis === "amplification" ||
      layer0.translatedNeed.toLowerCase().includes("not co-ownership"))
  );
}

export function evaluateNotMatch(signals: StructuredSignals, layer0: Layer0Translation): NotMatchResult {
  const disqualified: NotMatchResult["disqualified"] = [];
  const warnings: string[] = [];

  if (isUnclearAsk(signals)) {
    return {
      outcome: "pause",
      headline: "Intake too thin to rank paths safely.",
      reason:
        "The ask is unclear or too short. Layer 0 requires enough context to translate symptoms into constraints.",
      disqualified: CAPITAL_PATHS.concat(PERSON_PATHS).map((kind) => ({
        kind,
        reason: "Paused until stated need and constraints are clearer."
      })),
      warnings: ["Correct answer may be silence or a proof request, not a ranked person list."],
      recommendPause: true
    };
  }

  if (isPartnerSymptom(signals, layer0)) {
    for (const kind of PERSON_PATHS) {
      disqualified.push({
        kind,
        reason:
          "Rule 6 — do not recommend a person just because partnership language appeared. Partner may be a symptom."
      });
    }
    warnings.push("Partnership paths suppressed — intrinsic or amplification leverage may be the nearer constraint.");
  }

  if (isPrematureCapital(signals, layer0)) {
    disqualified.push({
      kind: "raise_capital",
      reason: "Capital may be a symptom of missing proof — equity and dilution paths deferred."
    });
    warnings.push("Raise-capital path penalized until customer validation or revenue proof exists.");
  }

  if (signals.capitalSeeking && signals.partnerSeeking && layer0.confidence === "low") {
    return {
      outcome: "proof_only",
      headline: "Multiple high-risk paths named with low confidence — proof before people or money.",
      reason: "Capital plus partnership with thin evidence triggers Rule 7 (pause / proof request).",
      disqualified: disqualified.concat(
        ["find_partner", "stage_intro_candidate", "raise_capital"].map((kind) => ({
          kind: kind as RecommendationKind,
          reason: "Proof-only mode until evidence strengthens the read."
        }))
      ),
      warnings,
      recommendPause: false
    };
  }

  disqualified.push({
    kind: "stage_intro_candidate",
    reason: "Intro staging requires translation complete + proof gaps visible (default guard)."
  });

  const blocked = new Set(disqualified.map((d) => d.kind));
  if (blocked.has("stage_intro_candidate") === false) {
    /* always keep intro guarded unless explicitly scored high later */
  }

  return {
    outcome: disqualified.length >= 4 ? "proof_only" : "proceed",
    headline:
      disqualified.length > 0
        ? `${disqualified.length} path(s) disqualified by not-match rules.`
        : "No hard disqualifiers — path ranking may proceed.",
    reason: "Not-match layer applied after Layer 0 translation.",
    disqualified,
    warnings,
    recommendPause: false
  };
}

export function isPathDisqualified(
  kind: RecommendationKind,
  notMatch: NotMatchResult
): { blocked: boolean; reason?: string } {
  const hit = notMatch.disqualified.find((d) => d.kind === kind);
  if (!hit) return { blocked: false };
  return { blocked: true, reason: hit.reason };
}
