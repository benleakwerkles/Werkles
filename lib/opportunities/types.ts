import type { RecommendationKind } from "@/lib/squibb/recommendations";

export const BUSINESS_OPPORTUNITY_CATEGORIES = [
  "supplier_equipment",
  "professional_service",
  "meeting_customer_place",
  "commercial_space",
  "training_trade_resource",
  "banking_public_funding",
  "customer_channel",
  "permit_government_help"
] as const;

export type BusinessOpportunityCategory = (typeof BUSINESS_OPPORTUNITY_CATEGORIES)[number];

export const OPPORTUNITY_PROVIDER_STAGES = [
  "official_outbound",
  "live_api_ready",
  "walkthrough_fixture",
  "not_connected"
] as const;

export type OpportunityProviderStage = (typeof OPPORTUNITY_PROVIDER_STAGES)[number];

export type OpportunityFact = Readonly<{
  label: string;
  value: string;
  provenance: "provider" | "official_source" | "member_supplied";
}>;

export type BusinessOpportunityCandidate = Readonly<{
  id: string;
  category: BusinessOpportunityCategory;
  name: string;
  locationLabel: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceRecordId: string | null;
  providerStage: OpportunityProviderStage;
  observedAt: string;
  facts: readonly OpportunityFact[];
  whyItAppeared: readonly string[];
  unknowns: readonly string[];
  sponsorship: Readonly<{
    status: "none" | "affiliate" | "sponsored" | "unknown";
    disclosure: string;
    affectedOrdering: false;
  }>;
  action: Readonly<{
    label: string;
    href: string;
    sendsMemberData: false;
    createsCommitment: false;
  }>;
}>;

export type OpportunitySearchContext = Readonly<{
  recommendationKind: RecommendationKind;
  project: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  travelRadiusMiles?: number | null;
  budgetText?: string | null;
  timingText?: string | null;
  specifications?: readonly string[];
}>;

export type OpportunitySearchQuery = Readonly<{
  id: string;
  category: BusinessOpportunityCategory;
  textQuery: string;
  locationLabel: string | null;
  reason: string;
  fieldsAllowed: readonly string[];
}>;

export const OPPORTUNITY_SEARCH_SCOPES = [
  "participant_local",
  "project_local",
  "shared_meeting",
  "statewide_remote"
] as const;

export type OpportunitySearchScope = (typeof OPPORTUNITY_SEARCH_SCOPES)[number];

export type OpportunityParticipantLocation = Readonly<{
  participantId: string;
  participantLabel: string;
  city: string;
  state: string;
  zip?: string | null;
  travelRadiusMiles?: number | null;
  locationUse: "shared_for_search" | "private";
}>;

export type OpportunitySearchLane = Readonly<{
  id: string;
  scope: OpportunitySearchScope;
  label: string;
  servesParticipantId: string | null;
  locationLabel: string | null;
  travelRadiusMiles: number | null;
  status: "ready" | "requires_member_choice";
  explanation: string;
  queries: readonly OpportunitySearchQuery[];
}>;
