import type { RecommendationKind } from "@/lib/squibb/recommendations";

import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

import { LEVERAGE_LABELS } from "@/lib/matching/leverage";

import type {

  Layer0Translation,

  NotMatchResult,

  RecommendationCard,

  RecommendationCardType,

  ScoredPath,

  MatchingReadout,

  SquibbVoiceDelivery,

  StructuredSignals

} from "@/lib/matching/types";



const KIND_TO_CARD_TYPE: Record<RecommendationKind, RecommendationCardType> = {

  translate_need: "lesson",

  verify_proof: "proof_request",

  stage_intro_candidate: "person",

  find_partner: "person",

  find_equipment: "tool",

  find_banker: "lender",

  find_credit_union: "lender",

  find_better_job: "smaller_first_step",

  stay_current_job: "warning",

  relocate: "smaller_first_step",

  get_training: "lesson",

  raise_capital: "lender"

};



export function buildRecommendationCard(

  signals: StructuredSignals,

  layer0: Layer0Translation,

  notMatch: NotMatchResult,

  scoredPaths: ScoredPath[]

): RecommendationCard {

  const top = scoredPaths[0];

  const runnerUp = scoredPaths[1];



  let cardType: RecommendationCardType = "smaller_first_step";

  if (notMatch.outcome === "pause") cardType = "pause";

  else if (notMatch.outcome === "proof_only") cardType = "proof_request";

  else if (top) cardType = KIND_TO_CARD_TYPE[top.kind];



  const headline =

    notMatch.outcome === "pause"

      ? "Pause — add detail before Werkles ranks paths."

      : top

        ? RECOMMENDATION_KIND_LABELS[top.kind]

        : "Translate need";



  const whyNotAlternatives: RecommendationCard["whyNotAlternatives"] = [];



  for (const d of notMatch.disqualified.slice(0, 3)) {

    whyNotAlternatives.push({

      path: RECOMMENDATION_KIND_LABELS[d.kind],

      reason: d.reason

    });

  }



  if (runnerUp && top && runnerUp.kind !== top.kind) {

    whyNotAlternatives.push({

      path: RECOMMENDATION_KIND_LABELS[runnerUp.kind],

      reason: `Runner-up (score ${runnerUp.score}) — ${runnerUp.rationale[0] ?? "lower signal strength"}`

    });

  }



  const disqualifiedKinds = new Set(notMatch.disqualified.map((d) => d.kind));

  for (const path of scoredPaths.slice(1, 4)) {

    if (path.disqualified || disqualifiedKinds.has(path.kind)) continue;

    if (whyNotAlternatives.length >= 4) break;

    whyNotAlternatives.push({

      path: RECOMMENDATION_KIND_LABELS[path.kind],

      reason: path.rationale[0] ?? "Lower score than top path."

    });

  }



  return {

    whatYouAskedFor: layer0.statedNeed || "(not provided)",

    whatWeHeardUnderneath: layer0.translatedNeed,

    visibleReasons: layer0.visibleReasons,

    recommendation: {

      type: cardType,

      headline,

      pathKind: top?.kind ?? null

    },

    whyNotAlternatives,

    whatToDoNext: [

      layer0.smallestReversibleStep,

      top && !top.disqualified

        ? `Explore path: ${RECOMMENDATION_KIND_LABELS[top.kind]} (confidence: ${layer0.confidence}).`

        : "Complete Crucible proof checks if money or intros are on the table.",

      "Keep your original ask — this is a recommendation, not a verdict."

    ],

    whatWouldChange: [

      "If the real blocker is proof, not capital, the top path changes.",

      "If timeline is under 30 days, training and CU paths may be too slow.",

      "If you add verified traction or revenue evidence, capital paths may rise."

    ],

    userSovereigntyNote:

      "This is a recommendation, not a decision. You can accept it, reject it, modify it, or ask Werkles to inspect a different path."

  };

}

export function buildMatchingReadout(

  signals: StructuredSignals,

  layer0: Layer0Translation,

  notMatch: NotMatchResult,

  scoredPaths: ScoredPath[]

): MatchingReadout {

  const recommendationCard = buildRecommendationCard(signals, layer0, notMatch, scoredPaths);



  const facts = [

    {

      id: "stated-need",

      label: "Stated need",

      value: signals.statedNeed || "(not provided)",

      strength: "self_reported" as const,

      source: signals.source

    },

    {

      id: "translated-need",

      label: "Translated need (Layer 0)",

      value: layer0.translatedNeed,

      strength: "inferred" as const,

      source: "layer0_preflight"

    },

    {

      id: "leverage",

      label: "Leverage hypothesis",

      value: LEVERAGE_LABELS[signals.leverage.primaryHypothesis],

      strength: "inferred" as const,

      source: "leverage_inventory_v1"

    },

    {

      id: "not-match",

      label: "Not-match outcome",

      value: `${notMatch.outcome} — ${notMatch.headline}`,

      strength: "inferred" as const,

      source: "not_match_layer"

    },

    {

      id: "lane",

      label: "Lane",

      value: signals.lane,

      strength: "self_reported" as const,

      source: "intake"

    },

    {

      id: "assets",

      label: "Assets named",

      value: signals.assets.length > 0 ? signals.assets.join(", ") : "(none checked)",

      strength: "self_reported" as const,

      source: "intake"

    },

    {

      id: "top-path",

      label: "Top scored path",

      value: scoredPaths[0]

        ? `${RECOMMENDATION_KIND_LABELS[scoredPaths[0].kind]} (${scoredPaths[0].score})${scoredPaths[0].disqualified ? " [disqualified]" : ""}`

        : "(none)",

      strength: "inferred" as const,

      source: "matching_engine_v1"

    }

  ];



  const falsifiers = [

    "If the real blocker is proof, not capital, the top path changes.",

    "If timeline is under 30 days, training and CU paths may be too slow.",

    "If geography is fixed, relocation and some lender paths drop.",

    ...layer0.alternativeHypotheses.map((h) => `Alternative hypothesis: ${h}`)

  ];



  const proofGaps = [

    "Third-party verification not attached to this intake.",

    "Funds posture not verified unless Crucible Funds check completed.",

    "Identity not verified unless Crucible Identity check completed."

  ];



  return {

    version: "v1",

    intakeId: signals.intakeId,

    source: signals.source,

    primaryBottleneck: layer0.translatedNeed,

    layer0,

    notMatch,

    recommendationCard,

    facts,

    falsifiers,

    proofGaps,

    scoredPaths,

    generatedAt: new Date().toISOString()

  };

}



export function buildSquibbVoice(readout: MatchingReadout): SquibbVoiceDelivery {

  const top = readout.scoredPaths[0];

  const topLabel = top ? RECOMMENDATION_KIND_LABELS[top.kind] : "Verify proof";

  const card = readout.recommendationCard;



  const intro =

    readout.notMatch.outcome === "pause"

      ? "Squibb: Matching needs more from you before ranking paths. I'm not sending you to a person or a lender yet."

      : "Squibb: I read what you carried in. Here's the plain-fact readout — I'm offering the path that scored highest, not a person or a guarantee.";



  const topPathNote =

    readout.notMatch.outcome === "pause"

      ? `Squibb: "${card.recommendation.headline}" — ${readout.notMatch.reason}`

      : top

        ? `Squibb: "${topLabel}" scored ${top.score}/100. ${top.rationale[0] || ""}`

        : "Squibb: Start with the smallest reversible step before shopping for solutions.";



  return {

    intro,

    topPathNote,

    counterpoint:

      readout.scoredPaths[1] && readout.scoredPaths[1].score > 30 && !readout.scoredPaths[1].disqualified

        ? `Squibb: "${RECOMMENDATION_KIND_LABELS[readout.scoredPaths[1].kind]}" is the runner-up if the top path feels wrong.`

        : card.whyNotAlternatives[0]

          ? `Squibb: We did not lead with "${card.whyNotAlternatives[0].path}" because ${card.whyNotAlternatives[0].reason.toLowerCase()}`

          : null,

    keepOriginalPathLabel: "Keep your original ask"

  };

}

