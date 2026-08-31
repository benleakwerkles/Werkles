import type { RecommendationKind } from "@/lib/squibb/recommendations";

import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

import { isPathDisqualified } from "@/lib/matching/not-match";
import { starterProfileForSignals } from "@/lib/matching/starter-profile";

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
    base: 20,
    score: (s, layer0) => {
      const hasDemandDecision = s.blockerKeywords.some((keyword) =>
        ["customer", "customers", "sales", "demand", "order", "orders", "preorder", "validate"].includes(keyword)
      );
      const hasCapacityDecision = s.blockerKeywords.some((keyword) =>
        ["tool", "tools", "equipment", "space", "kitchen", "oven", "capacity", "lease", "leasing"].includes(keyword)
      );
      const points = s.capitalSeeking
        ? 30
        : hasDemandDecision && hasCapacityDecision
          ? 28
          : layer0.confidence === "low"
            ? 20
            : 0;
      return {
        points,
        reasons: [
          s.capitalSeeking
            ? "Money or dilution paths require proof before reliance."
            : hasDemandDecision && hasCapacityDecision
              ? "You are weighing customer demand against a capacity commitment, so a paid-demand test should lead."
            : layer0.confidence === "low"
              ? "Low-confidence translation needs proof before a specific path can lead."
              : "Keep proof visible without crowding out directly evidenced low-risk paths."
        ]
      };
    }
  },
  {
    kind: "translate_need",
    base: 0,
    score: (s, layer0) => {
      const isDigitalReadinessDecision =
        /\b(apps?|websites?|sites?|software|platform|code|programmer)\b/i.test(s.intakeTextBlob) &&
        /\b(ready|built enough|customer ready|mentor|investor|investment|funding|launch)\b/i.test(s.intakeTextBlob) &&
        /\b(testing|prototype|idea|planning|starting|pre[- ]?launch)\b/i.test(
          `${s.intakeTextBlob} ${starterProfileForSignals(s).stage}`
        );
      const hasNamedChoice = s.blockerKeywords.some((keyword) =>
        ["choose", "whether", "decide", "decision", "before", "versus"].includes(keyword)
      );
      const points = isDigitalReadinessDecision ? 44 : hasNamedChoice ? 24 : layer0.confidence === "low" ? 16 : 0;
      return {
        points,
        reasons: isDigitalReadinessDecision
          ? ["You are deciding whether two early products are ready for different audiences; that calls for a written readiness test before more polishing."]
          : hasNamedChoice
          ? ["You named a real choice; Werkles can turn it into a written decision rule."]
          : layer0.confidence === "low"
            ? ["The next decision still needs a clearer boundary before a larger commitment."]
            : []
      };
    }
  },
  {

    kind: "find_credit_union",

    base: 0,

    score: (s) => ({

      points:
        s.capitalSeeking &&
        /\b(testing|prototype|idea|planning|starting|pre[- ]?launch)\b/i.test(starterProfileForSignals(s).stage) &&
        !s.assets.includes("Customers")
          ? 8
          : s.capitalSeeking
            ? 42
            : 0,

      reasons: s.capitalSeeking

        ? [
            /\b(testing|prototype|idea|planning|starting|pre[- ]?launch)\b/i.test(starterProfileForSignals(s).stage) &&
            !s.assets.includes("Customers")
              ? "Borrowing is premature until the use of funds and repayment evidence are concrete."
              : "Capital language detected — member-owned lending may fit before equity."
          ]

        : []

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

            : 0,

      reasons: s.partnerSeeking

        ? ["Partnership language detected — but proof should precede intro."]

        : ["No strong partnership signal in intake text."]

    })

  },

  {

    kind: "raise_capital",

    base: 0,

    score: (s) => ({

      points: s.capitalSeeking && s.assets.includes("Idea") ? 28 : s.capitalSeeking ? 18 : 0,

      reasons: s.capitalSeeking
        ? s.assets.includes("Idea")
          ? ["You named funding and a product, idea, prototype, or plan already in hand."]
          : ["You named funding, but the Intake does not yet show what is ready to fund."]
        : []

    })

  },

  {

    kind: "get_training",

    base: 0,

    score: (s) => ({

      points: s.trainingSeeking ? 36 : s.jobSeeking ? 18 : 0,

      reasons: s.trainingSeeking

        ? ["Training or credential language detected."]

        : []

    })

  },

  {

    kind: "find_better_job",

    base: 0,

    score: (s) => ({

      points: s.jobSeeking ? 40 : 0,

      reasons: s.jobSeeking ? ["You named a job, career, or role change."] : []

    })

  },

  {

    kind: "relocate",

    base: 0,

    score: (s) => ({

      points: s.relocationSignal ? 34 : 0,

      reasons: s.relocationSignal ? ["Geography or relocation mentioned."] : []

    })

  },

  {

    kind: "find_equipment",

    base: 0,

    score: (s) => ({

      points:
        s.assets.includes("Tools") ||
        [...s.goalKeywords, ...s.blockerKeywords].some((k) =>
          ["equipment", "oven", "truck", "tool", "tools", "machine", "space", "kitchen", "capacity", "lease", "leasing"].includes(k)
        )
          ? 32
          : 0,

      reasons:
        s.assets.includes("Tools") ||
        [...s.goalKeywords, ...s.blockerKeywords].some((k) =>
          ["equipment", "oven", "truck", "tool", "tools", "machine", "space", "kitchen", "capacity", "lease", "leasing"].includes(k)
        )
          ? ["Your goal, obstacle, or next decision names equipment, space, capacity, or a lease."]
          : []

    })

  },

  {

    kind: "find_banker",

    base: 0,

    score: (s) => ({

      points: s.capitalSeeking && s.leverage.constrained.includes("structural") ? 26 : s.capitalSeeking ? 14 : 0,

      reasons: s.capitalSeeking
        ? s.leverage.constrained.includes("structural")
          ? ["You named funding plus a banking, entity, lease, credit, or paperwork constraint."]
          : ["You named funding; a small-business banking conversation may help define requirements before applying."]
        : []

    })

  },

  {

    kind: "stage_intro_candidate",

    base: 0,

    score: (s) => ({

      points: s.partnerSeeking && s.assets.includes("Network") ? 14 : 0,

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

