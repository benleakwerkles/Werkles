import type { DiscoveryAsset, DiscoveryLane } from "@/lib/discovery/schema";

import type { RecommendationKind } from "@/lib/squibb/recommendations";

import type { EvidenceStrength } from "@/lib/squibb/recommendations";



export type MatchingIntakeSource =
  | "discovery"
  | "bellows_concierge"
  | "member_profile"
  | "operator_document";



export type LeverageCategory =

  | "intrinsic"

  | "relational"

  | "amplification"

  | "structural"

  | "optionality";



export type LeverageDiagnosis = {

  primaryHypothesis: LeverageCategory;

  constrained: LeverageCategory[];

  possible: LeverageCategory[];

  readoutChecks: string[];

};


export type StructuredSignals = {

  source: MatchingIntakeSource;

  intakeId: string;

  statedNeed: string;

  intakeTextBlob: string;

  lane: DiscoveryLane | "Unsure";

  assets: DiscoveryAsset[];

  blockerKeywords: string[];

  goalKeywords: string[];

  capitalSeeking: boolean;

  partnerSeeking: boolean;

  jobSeeking: boolean;

  trainingSeeking: boolean;

  relocationSignal: boolean;

  leverage: LeverageDiagnosis;

  llmTranslatedBottleneck: string | null;

};



export type Layer0Translation = {

  statedNeed: string;

  translatedNeed: string;

  leverageClasses: LeverageCategory[];

  alternativeHypotheses: string[];

  visibleReasons: string[];

  confidence: "low" | "medium" | "high";

  preflightComplete: boolean;

  smallestReversibleStep: string;

};



export type NotMatchOutcome = "proceed" | "pause" | "proof_only";



export type NotMatchResult = {

  outcome: NotMatchOutcome;

  headline: string;

  reason: string;

  disqualified: { kind: RecommendationKind; reason: string }[];

  warnings: string[];

  recommendPause: boolean;

};



export type RecommendationCardType =

  | "person"

  | "lender"

  | "space"

  | "tool"

  | "checklist"

  | "proof_request"

  | "lesson"

  | "smaller_first_step"

  | "warning"

  | "pause";



export type RecommendationCard = {

  whatYouAskedFor: string;

  whatWeHeardUnderneath: string;

  visibleReasons: string[];

  recommendation: {

    type: RecommendationCardType;

    headline: string;

    pathKind: RecommendationKind | null;

  };

  whyNotAlternatives: { path: string; reason: string }[];

  whatToDoNext: string[];

  whatWouldChange: string[];

  userSovereigntyNote: string;

};



export type ScoredPath = {

  kind: RecommendationKind;

  rank: number;

  score: number;

  confidenceLabel: "low" | "medium" | "high";

  rationale: string[];

  evidenceStrength: EvidenceStrength;

  disqualified?: boolean;

  disqualifyReason?: string;

};



/** One labeled fact line in a matching readout (not the Speaker causal office). */
export type MatchingReadoutFact = {

  id: string;

  label: string;

  value: string;

  strength: EvidenceStrength;

  source: string;

};



/** One-shot structured packaging of a matching run for Squibb + operator review. */
export type MatchingReadout = {

  version: "v1";

  intakeId: string;

  source: MatchingIntakeSource;

  primaryBottleneck: string;

  layer0: Layer0Translation;

  notMatch: NotMatchResult;

  recommendationCard: RecommendationCard;

  facts: MatchingReadoutFact[];

  falsifiers: string[];

  proofGaps: string[];

  scoredPaths: ScoredPath[];

  generatedAt: string;

};

export type SquibbVoiceDelivery = {

  intro: string;

  topPathNote: string;

  counterpoint: string | null;

  keepOriginalPathLabel: string;

};



export type ShadowMatchingRun = {

  runId: string;

  intakeId: string;

  source: MatchingIntakeSource;

  mode: "shadow";

  signals: StructuredSignals;

  layer0: Layer0Translation;

  notMatch: NotMatchResult;

  readout: MatchingReadout;

  squibb: SquibbVoiceDelivery;

  /** DRAFT member causal note (real Speaker job: why over time). Not org doctrine. */
  memberCausalDraft: string | null;

  llmUsed: boolean;

  createdAt: string;

  receiptPath: string;

};

