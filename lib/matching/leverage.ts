import type { LeverageCategory, LeverageDiagnosis } from "@/lib/matching/types";

const INTRINSIC =
  /\b(stall|stuck|confiden|accountab|overwhelm|cannot do|self.?doubt|procrastin|learn|skill gap|training|endurance|alone|hold me)\b/i;
const RELATIONAL =
  /\b(partner|cofounder|investor|connection|intro|referral|customer|trust|nobody|serious|backer|mentor|distribution|network)\b/i;
const AMPLIFICATION =
  /\b(equipment|tool|software|system|process|workflow|automat|portfolio|proof|hire help|delegate|keep up|cannot keep|documentation|template)\b/i;
const STRUCTURAL =
  /\b(license|entity|llc|insurance|contract|bank|accounting|compliance|legal|bonding|permit|credit union|lender)\b/i;
const OPTIONALITY =
  /\b(runway|savings|decide now|urgent|deadline|move|relocat|fallback|no time|risk everything|month|weeks left)\b/i;

const CATEGORY_CHECKS: { category: LeverageCategory; pattern: RegExp; check: string }[] = [
  {
    category: "intrinsic",
    pattern: INTRINSIC,
    check: "Is the user missing another person, or endurance, confidence, skill, or decision support?"
  },
  {
    category: "relational",
    pattern: RELATIONAL,
    check: "Is the user missing a co-owner, or trust, introductions, customers, or a professional reviewer?"
  },
  {
    category: "amplification",
    pattern: AMPLIFICATION,
    check: "Is the user missing people, or tools, systems, equipment, repeatable process, or proof?"
  },
  {
    category: "structural",
    pattern: STRUCTURAL,
    check: "Is the user missing money or a person, or structure that makes money and people safe to use?"
  },
  {
    category: "optionality",
    pattern: OPTIONALITY,
    check: "Is the user missing the desired path, or time, runway, alternatives, and reversible tests?"
  }
];

export function diagnoseLeverage(textBlob: string, assets: string[]): LeverageDiagnosis {
  const constrained: LeverageCategory[] = [];
  const possible: LeverageCategory[] = [];
  const checks: string[] = [];

  for (const { category, pattern, check } of CATEGORY_CHECKS) {
    if (pattern.test(textBlob)) {
      constrained.push(category);
      checks.push(check);
    } else {
      possible.push(category);
    }
  }

  if (assets.includes("Network")) {
    if (!constrained.includes("relational")) constrained.push("relational");
  }
  if (assets.includes("Idea") && !assets.includes("Customers")) {
    if (!constrained.includes("amplification")) constrained.push("amplification");
  }
  if (assets.includes("Tools")) {
    if (!constrained.includes("amplification")) constrained.push("amplification");
  }

  const primary =
    constrained[0] ??
    (/\b(partner|capital|money|invest)\b/i.test(textBlob) ? "relational" : "intrinsic");

  return {
    primaryHypothesis: primary,
    constrained: [...new Set(constrained)],
    possible: [...new Set(possible.filter((c) => !constrained.includes(c)))],
    speakerChecks: checks.slice(0, 3)
  };
}

export const LEVERAGE_LABELS: Record<LeverageCategory, string> = {
  intrinsic: "Intrinsic (skill, endurance, confidence, judgment)",
  relational: "Relational (trust, customers, intros, partners)",
  amplification: "Amplification (tools, systems, equipment, proof assets)",
  structural: "Structural (entity, license, banking, compliance)",
  optionality: "Optionality (runway, timing, reversible tests)"
};
