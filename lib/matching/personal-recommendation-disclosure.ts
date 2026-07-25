import type { PersonalRecommendationGenerationDisclosure } from "@/lib/squibb/recommendations";

export const PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT =
  "Fixed rules ranked paths from your saved profile.";
export const PERSONAL_RECOMMENDATION_INTRO =
  "Suggestions to consider—not decisions, verified matches, or promises.";
export const PERSONAL_RECOMMENDATION_SOURCE_LABEL = "Private, in-memory calculation";
export const PERSONAL_RECOMMENDATION_SOURCE_DETAIL =
  "No AI model or provider. Nothing was saved, sent, or shared with anyone.";
export const PERSONAL_RECOMMENDATION_GENERATION_EXPLANATION =
  "Fixed rules used your saved profile in memory. No AI. No provider. Nothing was saved or sent to anyone. No introduction. No contact. No payment. No action.";

export const PERSONAL_RECOMMENDATION_GENERATION = {
  method: "fixed_written_rules",
  input: "saved_profile",
  execution: "in_memory",
  aiModelUsed: false,
  providerContacted: false,
  externalRecipientContacted: false,
  recommendationPersisted: false,
  introSent: false,
  contactMade: false,
  paymentInitiated: false,
  actionTaken: false,
  explanation: PERSONAL_RECOMMENDATION_GENERATION_EXPLANATION
} as const satisfies PersonalRecommendationGenerationDisclosure;
