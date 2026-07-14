import type { RecommendationKind } from "@/lib/squibb/recommendations";

import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

import { isPathDisqualified } from "@/lib/matching/not-match";

import type {

  Layer0Translation,

  NotMatchResult,

  ScoredPath,

  StructuredSignals

} from "@/lib/matching/types";



type PathRule = {

  kind: RecommendationKind;

  base: number;

  score: (s: StructuredSignals, layer0: Layer0Translation) => { points: number; reasons: string[] };

};



const RULES: PathRule[] = [

  {
    kind: "verify_proof",
    base: 35,
    score: (s, layer0) => {
      const points = s.capitalSeeking ? 30 : layer0.confidence === "low" ? 20 : 0;
      return {
        points,
        reasons: [
          s.capitalSeeking
            ? "Money or dilution paths require proof before reliance."
            : layer0.confidence === "low"
              ? "Low-confidence translation needs proof before a specific path can lead."
              : "Keep proof visible without crowding out directly evidenced low-risk paths."
        ]
      };
    }
  },
  {

    kind: "find_credit_union",

    base: 0,

    score: (s) => ({

      points: s.capitalSeeking ? 42 : 8,

      reasons: s.capitalSeeking

        ? ["Capital language detected — member-owned lending may fit before equity."]

        : ["Low capital signal — CU path is secondary."]

    })

  },

  {

    kind: "find_partner",

    base: 0,

    score: (s, layer0) => ({

      points:

        s.partnerSeeking && layer0.leverageClasses.includes("relational")

          ? 38

          : s.partnerSeeking

            ? 18

            : 6,

      reasons: s.partnerSeeking

        ? ["Partnership language detected — but proof should precede intro."]

        : ["No strong partnership signal in intake text."]

    })

  },

  {

    kind: "raise_capital",

    base: 0,

    score: (s) => ({

      points: s.capitalSeeking && s.assets.includes("Idea") ? 28 : 12,

      reasons: ["Capital seek with idea asset — structure review before dilution."]

    })

  },

  {

    kind: "get_training",

    base: 0,

    score: (s) => ({

      points: s.trainingSeeking ? 36 : s.jobSeeking ? 18 : 10,

      reasons: s.trainingSeeking

        ? ["Training or credential language detected."]

        : ["Training may close skill gap cheaper than a partner."]

    })

  },

  {

    kind: "find_better_job",

    base: 0,

    score: (s) => ({

      points: s.jobSeeking ? 40 : 8,

      reasons: s.jobSeeking ? ["Employment change language detected."] : ["Weak job-change signal."]

    })

  },

  {

    kind: "relocate",

    base: 0,

    score: (s) => ({

      points: s.relocationSignal ? 34 : 5,

      reasons: s.relocationSignal ? ["Geography or relocation mentioned."] : []

    })

  },

  {

    kind: "find_equipment",

    base: 0,

    score: (s) => ({

      points: s.goalKeywords.some((k) => ["equipment", "oven", "truck", "tool", "lease"].includes(k)) ? 32 : 6,

      reasons: ["Equipment/asset goal keywords checked."]

    })

  },

  {

    kind: "find_banker",

    base: 0,

    score: (s) => ({

      points: s.capitalSeeking && s.leverage.constrained.includes("structural") ? 26 : 10,

      reasons: ["Banking relationship path scored when capital + structural signals align."]

    })

  },

  {

    kind: "stage_intro_candidate",

    base: 0,

    score: (s) => ({

      points: s.partnerSeeking && s.assets.includes("Network") ? 14 : 4,

      reasons: ["Guarded candidate staging only after translation and proof gaps are visible."]

    })

  }

];



function confidenceFromScore(score: number): "low" | "medium" | "high" {

  if (score >= 70) return "high";

  if (score >= 45) return "medium";

  return "low";

}


function penaltyForLayer0(kind: RecommendationKind, layer0: Layer0Translation, signals: StructuredSignals): number {

  if (notMatchCapitalAsSymptom(kind, signals, layer0)) return 25;

  if (notMatchPartnerAsSymptom(kind, signals, layer0)) return 30;

  return 0;

}



function notMatchCapitalAsSymptom(

  kind: RecommendationKind,

  signals: StructuredSignals,

  layer0: Layer0Translation

): boolean {

  return (

    (kind === "raise_capital" || kind === "find_banker") &&

    signals.capitalSeeking &&

    layer0.translatedNeed.toLowerCase().includes("proof")

  );

}



function notMatchPartnerAsSymptom(

  kind: RecommendationKind,

  signals: StructuredSignals,

  layer0: Layer0Translation

): boolean {

  return (

    (kind === "find_partner" || kind === "stage_intro_candidate") &&

    signals.partnerSeeking &&

    layer0.translatedNeed.toLowerCase().includes("not co-ownership")

  );

}



export function scorePaths(

  signals: StructuredSignals,

  layer0: Layer0Translation,

  notMatch: NotMatchResult

): ScoredPath[] {

  if (notMatch.outcome === "pause") {

    return [

      {

        kind: "verify_proof",

        rank: 1,

        score: 55,

        confidenceLabel: "low",

        rationale: [notMatch.reason, "Add detail to your intake before paths are ranked."],

        evidenceStrength: "inferred"

      }

    ];

  }



  const raw = RULES.map((rule) => {

    const { points, reasons } = rule.score(signals, layer0);

    const penalty = penaltyForLayer0(rule.kind, layer0, signals);

    const blocked = isPathDisqualified(rule.kind, notMatch);

    let score = Math.max(0, Math.min(100, rule.base + points - penalty));

    if (blocked.blocked) score = Math.min(score, 15);



    return {

      kind: rule.kind,

      rank: 0,

      score,

      confidenceLabel: confidenceFromScore(score),

      rationale: blocked.blocked

        ? [...reasons, blocked.reason ?? "Disqualified by not-match layer."].filter(Boolean)

        : reasons.filter(Boolean),

      evidenceStrength: "inferred" as const,

      disqualified: blocked.blocked,

      disqualifyReason: blocked.reason

    };

  });



  return raw

    .filter((item) => item.score > 0 || item.kind === "verify_proof")

    .sort((a, b) => b.score - a.score)

    .slice(0, 6)

    .map((item, index) => ({ ...item, rank: index + 1 }));

}



export function pathsForNotMatchDisplay(notMatch: NotMatchResult): string[] {

  return notMatch.disqualified.map((d) => `${RECOMMENDATION_KIND_LABELS[d.kind]}: ${d.reason}`);

}

