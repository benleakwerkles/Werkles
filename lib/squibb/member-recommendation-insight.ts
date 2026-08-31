import type { StructuredSignals } from "@/lib/matching/types";
import { starterProfileForSignals } from "@/lib/matching/starter-profile";
import type { RecommendationKind } from "./recommendations";

export type MemberRecommendationPresentation = Readonly<{
  title: string;
  headline: string;
}>;

const DIGITAL_PRODUCT = /\b(apps?|websites?|sites?|software|platform|code|programmer|digital product)\b/i;
const READINESS_DECISION = /\b(ready|built enough|customer ready|mentor|investor|investment|funding|launch)\b/i;
const EARLY_STAGE = /\b(testing|prototype|idea|planning|starting|pre[- ]?launch)\b/i;

export function isDigitalProductReadinessCase(signals: StructuredSignals): boolean {
  const context = `${signals.intakeTextBlob} ${starterProfileForSignals(signals).stage}`;
  return DIGITAL_PRODUCT.test(context) && READINESS_DECISION.test(context) && EARLY_STAGE.test(context);
}

const DIGITAL_PRODUCT_PRESENTATION: Partial<Record<RecommendationKind, MemberRecommendationPresentation>> = {
  verify_proof: {
    title: "Test One Product with One Audience",
    headline: "Find which product creates the strongest outside behavior before polishing both."
  },
  translate_need: {
    title: "Choose Which Product Goes First",
    headline: "Separate customer-, mentor-, and investor-readiness, then build for one audience first."
  },
  raise_capital: {
    title: "Build a Proof-Backed Funding Case",
    headline: "Tie any funding ask to one milestone, one use of funds, and evidence gathered outside your own team."
  },
  find_credit_union: {
    title: "Why Borrowing Should Wait",
    headline: "Compare lenders only after the amount, use, repayment source, and proof milestone are concrete."
  }
};

export function memberRecommendationPresentation(
  kind: RecommendationKind,
  signals: StructuredSignals,
  fallback: MemberRecommendationPresentation
): MemberRecommendationPresentation {
  if (!isDigitalProductReadinessCase(signals)) return Object.freeze({ ...fallback });
  return Object.freeze({ ...(DIGITAL_PRODUCT_PRESENTATION[kind] ?? fallback) });
}
