import type { RecommendationKind } from "@/lib/squibb/recommendations";
import type {
  BusinessOpportunityCategory,
  OpportunitySearchContext,
  OpportunitySearchQuery
} from "@/lib/opportunities/types";

const KIND_CATEGORIES: Readonly<Record<RecommendationKind, readonly BusinessOpportunityCategory[]>> = Object.freeze({
  translate_need: ["permit_government_help", "professional_service"],
  verify_proof: ["professional_service", "training_trade_resource"],
  stage_intro_candidate: ["professional_service", "meeting_customer_place"],
  find_partner: ["professional_service", "meeting_customer_place"],
  find_equipment: ["supplier_equipment", "banking_public_funding"],
  find_banker: ["banking_public_funding", "professional_service"],
  find_credit_union: ["banking_public_funding"],
  find_better_job: ["training_trade_resource", "customer_channel"],
  stay_current_job: ["customer_channel", "training_trade_resource"],
  relocate: ["commercial_space", "permit_government_help", "supplier_equipment"],
  get_training: ["training_trade_resource"],
  raise_capital: ["banking_public_funding", "professional_service"]
});

const CATEGORY_TERMS: Readonly<Record<BusinessOpportunityCategory, string>> = Object.freeze({
  supplier_equipment: "suppliers equipment rental dealers",
  professional_service: "small business professional services",
  meeting_customer_place: "business meeting places coworking customer venues",
  commercial_space: "commercial space for lease",
  training_trade_resource: "trade training certification small business classes",
  banking_public_funding: "small business lenders credit unions funding resources",
  customer_channel: "local business customers trade marketplace",
  permit_government_help: "business permits licensing zoning small business assistance"
});

const CATEGORY_ALLOWED_FIELDS: Readonly<Record<BusinessOpportunityCategory, readonly string[]>> = Object.freeze({
  supplier_equipment: ["name", "address", "business status", "website", "source identifier"],
  professional_service: ["name", "address", "business status", "website", "source identifier"],
  meeting_customer_place: ["name", "address", "business status", "website", "price level", "source identifier"],
  commercial_space: ["listing name", "address", "asking terms", "stated use", "listing status", "source identifier"],
  training_trade_resource: ["program name", "provider", "location", "schedule", "price", "source identifier"],
  banking_public_funding: ["institution/resource name", "service area", "official status", "website", "source identifier"],
  customer_channel: ["channel name", "service area", "current access terms", "website", "source identifier"],
  permit_government_help: ["agency/resource name", "jurisdiction", "official website", "source identifier"]
});

function clean(value: string | null | undefined, max = 180): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function locationFrom(context: OpportunitySearchContext): string | null {
  const cityState = [clean(context.city), clean(context.state)].filter(Boolean).join(", ");
  return cityState || clean(context.zip) || null;
}

function categoryReason(category: BusinessOpportunityCategory, context: OpportunitySearchContext): string {
  const reasons: Record<BusinessOpportunityCategory, string> = {
    supplier_equipment: "Your next move involves tools, equipment, supply, or the cost of delivering the work.",
    professional_service: "A qualified local service may answer a question that Werkles should not pretend to decide.",
    meeting_customer_place: "A neutral place may help you meet a collaborator, customer, or adviser without committing to space.",
    commercial_space: "Location is part of the plan, so current listings and use constraints may change the decision.",
    training_trade_resource: "A specific skill, credential, or trade resource may unlock the next task.",
    banking_public_funding: "You named a money or banking path that requires eligibility-first research.",
    customer_channel: "A real customer or channel test may teach more than another planning pass.",
    permit_government_help: "A permit, license, zoning rule, or public resource may change what is possible next."
  };
  return `${reasons[category]} Search is limited to the member-supplied project: ${clean(context.project, 220) || "not yet specified"}.`;
}

export function planBusinessOpportunityQueries(context: OpportunitySearchContext): readonly OpportunitySearchQuery[] {
  const project = clean(context.project, 220);
  const locationLabel = locationFrom(context);
  const specs = (context.specifications ?? []).map((item) => clean(item, 100)).filter(Boolean).slice(0, 3);
  const categories = KIND_CATEGORIES[context.recommendationKind];

  return Object.freeze(categories.map((category, index) => {
    const textQuery = [project, ...specs, CATEGORY_TERMS[category], locationLabel].filter(Boolean).join(" ");
    return Object.freeze({
      id: `${context.recommendationKind}:${category}:${index + 1}`,
      category,
      textQuery,
      locationLabel,
      reason: categoryReason(category, context),
      fieldsAllowed: CATEGORY_ALLOWED_FIELDS[category]
    });
  }));
}

