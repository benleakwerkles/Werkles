import type { Layer0Translation, StructuredSignals } from "@/lib/matching/types";
import { LEVERAGE_LABELS, diagnoseLeverage } from "@/lib/matching/leverage";

type TranslationRule = {
  when: (s: StructuredSignals) => boolean;
  translated: string;
  hypotheses: string[];
  reasons: string[];
};

const TRANSLATION_RULES: TranslationRule[] = [
  {
    when: (s) => s.capitalSeeking && s.partnerSeeking,
    translated:
      "Capital and partnership are both named — the nearer bottleneck may be proof and sizing, not a person or check.",
    hypotheses: ["Missing proof leverage", "Missing structural leverage", "Relational leverage may be premature"],
    reasons: [
      "Both capital and partnership language appeared in the intake.",
      "Without verified traction, equity and lending paths carry high downside.",
      "Layer 0 widens the map before people or money moves."
    ]
  },
  {
    when: (s) => s.capitalSeeking && s.leverage.constrained.includes("amplification"),
    translated:
      "You said you need capital, but the nearer bottleneck may be customer validation or proof that strangers will pay.",
    hypotheses: ["Missing proof leverage", "Capital may follow validation", "Structural setup may be premature"],
    reasons: [
      "Capital language detected without strong proof or revenue signals.",
      "Doctrine: funding often follows proof, not the reverse.",
      "Smallest reversible test may be a paid pilot or pre-sale before dilution."
    ]
  },
  {
    when: (s) => s.partnerSeeking && s.leverage.primaryHypothesis === "intrinsic",
    translated:
      "You said you need a partner, but the nearer bottleneck may be endurance, skill reps, or systems — not co-ownership yet.",
    hypotheses: ["Missing endurance leverage", "Missing amplification leverage", "Partner may be a symptom"],
    reasons: [
      "Partnership language with intrinsic constraint signals (stalling, overwhelm, confidence).",
      "Speaker check: missing another person vs missing supervised reps or delegation.",
      "Equity and shared control should wait for evidence thresholds."
    ]
  },
  {
    when: (s) => s.partnerSeeking && !s.capitalSeeking,
    translated:
      "Partnership or operator coverage appears central — but proof and scoped labor should precede equity.",
    hypotheses: ["Relational leverage constrained", "Operator vs co-owner distinction needed"],
    reasons: [
      "Partnership or operator language detected.",
      "A paid operator or contractor may close the gap cheaper than equity.",
      "Intro paths stay guarded until translation and proof gaps are visible."
    ]
  },
  {
    when: (s) => s.capitalSeeking,
    translated: "Funding or liquidity appears named — structure and proof should be checked before lender or investor paths.",
    hypotheses: ["Structural leverage may be missing", "Proof leverage may be missing", "Capital path may be valid later"],
    reasons: ["Capital or credit language detected in intake.", "Member-owned lending may fit before equity in some cases."]
  },
  {
    when: (s) => s.jobSeeking,
    translated: "Employment or role change appears central — job search paths may fit before venture formation.",
    hypotheses: ["Optionality leverage (runway)", "Intrinsic skill leverage"],
    reasons: ["Employment-change language detected.", "Stay-vs-move decision may need timeline and constraint check."]
  },
  {
    when: (s) => s.trainingSeeking,
    translated: "Skill or credential gap appears central — training may close the gap cheaper than a partner.",
    hypotheses: ["Intrinsic leverage", "Structural leverage (license)"],
    reasons: ["Training or credential language detected.", "Credential paths are often reversible and lower risk than equity."]
  },
  {
    when: (s) => s.relocationSignal,
    translated: "Geography or relocation constraint appears central — local options should be checked before distant matches.",
    hypotheses: ["Optionality leverage", "Structural/local licensing"],
    reasons: ["Relocation or geography language detected.", "Some lender and partner paths drop when geography is fixed."]
  }
];

function confidenceFromSignals(s: StructuredSignals): "low" | "medium" | "high" {
  const wordCount = s.intakeTextBlob.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 80 && s.leverage.constrained.length >= 2) return "medium";
  if (wordCount >= 40) return "medium";
  return "low";
}

export function runLayer0(signals: StructuredSignals): Layer0Translation {
  const rule = TRANSLATION_RULES.find((r) => r.when(signals));
  const translatedNeed =
    signals.llmTranslatedBottleneck ??
    rule?.translated ??
    "The stated need should be translated before chasing a specific person, product, or vendor.";

  const hypotheses =
    rule?.hypotheses ??
    signals.leverage.constrained.map((c) => `Missing ${LEVERAGE_LABELS[c].split(" ")[0].toLowerCase()} leverage`);

  const visibleReasons =
    rule?.reasons ??
    [
      `Stated need: ${signals.statedNeed || "(not provided)"}`,
      `Primary leverage hypothesis: ${LEVERAGE_LABELS[signals.leverage.primaryHypothesis]}`,
      "Layer 0 preserves your words while widening the map — it does not override you."
    ];

  return {
    statedNeed: signals.statedNeed,
    translatedNeed,
    leverageClasses: signals.leverage.constrained,
    alternativeHypotheses: hypotheses.slice(0, 4),
    visibleReasons: visibleReasons.slice(0, 4),
    confidence: confidenceFromSignals(signals),
    preflightComplete: true,
    smallestReversibleStep: smallestStep(signals)
  };
}

function smallestStep(s: StructuredSignals): string {
  if (s.capitalSeeking && !s.assets.includes("Customers")) {
    return "Run one paid pilot or pre-sale conversation before applying for capital or equity.";
  }
  if (s.partnerSeeking) {
    return "Delegate or outsource one defined task for two weeks without equity or shared accounts.";
  }
  if (s.trainingSeeking) {
    return "Identify one credential or skill module that unlocks the next paid task — not a full program yet.";
  }
  if (s.jobSeeking) {
    return "List three reachable roles and one constraint (pay, schedule, geography) that would make a move real.";
  }
  return "Write one sentence: what would prove the bottleneck wrong in the next 14 days?";
}
