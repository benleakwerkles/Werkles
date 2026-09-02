import type { OpportunityProviderStage } from "@/lib/opportunities/types";

export type OpportunityProviderSlot = Readonly<{
  id: string;
  name: string;
  stage: OpportunityProviderStage;
  purpose: string;
  sourceUrl: string;
  envKey: string | null;
  activationGate: string | null;
  storageBoundary: string;
  resultBoundary: string;
}>;

function slot(value: OpportunityProviderSlot): OpportunityProviderSlot {
  return Object.freeze(value);
}

export const OPPORTUNITY_PROVIDER_CATALOG = Object.freeze({
  google_places: slot({
    id: "google_places",
    name: "Google Places Text Search",
    stage: "live_api_ready",
    purpose: "Named local establishments and service-area businesses for focused member searches.",
    sourceUrl: "https://developers.google.com/maps/documentation/places/web-service/text-search",
    envKey: "GOOGLE_PLACES_API_KEY",
    activationGate: "API key, billing/spend boundary, attribution, privacy/terms, field mask, and caching-policy review.",
    storageBoundary: "Store only policy-permitted identifiers and Werkles-authored decisions; re-fetch restricted display content.",
    resultBoundary: "A place result is not evidence of suitability, availability, price fit, licensing, or recommendation."
  }),
  sba_lender_match: slot({
    id: "sba_lender_match",
    name: "U.S. Small Business Administration Lender Match",
    stage: "official_outbound",
    purpose: "Official lender-discovery path for members who deliberately choose to explore financing.",
    sourceUrl: "https://www.sba.gov/loans/lender-match/",
    envKey: null,
    activationGate: null,
    storageBoundary: "Werkles does not transmit the member's Intake or financing details to SBA.",
    resultBoundary: "The outbound path is not a loan application, eligibility decision, approval, or guarantee of a lender match."
  }),
  ncua_locator: slot({
    id: "ncua_locator",
    name: "NCUA Credit Union Locator",
    stage: "official_outbound",
    purpose: "Official starting point for researching federally insured credit unions.",
    sourceUrl: "https://mapping.ncua.gov/",
    envKey: null,
    activationGate: null,
    storageBoundary: "Werkles does not send member financial information to the locator.",
    resultBoundary: "A listing does not establish membership eligibility, business-product fit, terms, approval, or recommendation."
  }),
  yelp_places: slot({
    id: "yelp_places",
    name: "Yelp Places API",
    stage: "not_connected",
    purpose: "Potential second source for local businesses and services after commercial-use and attribution review.",
    sourceUrl: "https://docs.developer.yelp.com/reference/v3_business_search",
    envKey: "YELP_API_KEY",
    activationGate: "Provider account, key, commercial terms, attribution, allowed storage, rate limits, and spend boundary.",
    storageBoundary: "No Yelp content is cached or persisted until provider terms are reviewed and encoded.",
    resultBoundary: "Ratings and reviews are not Werkles verification and cannot silently control ordering."
  }),
  commercial_space_feed: slot({
    id: "commercial_space_feed",
    name: "Licensed commercial-space feed (not selected)",
    stage: "not_connected",
    purpose: "Current vacancy, stated use, asking price, and listing status from a licensed source.",
    sourceUrl: "https://www.reso.org/reso-web-api/",
    envKey: null,
    activationGate: "Select and contract with a lawful feed before displaying or storing listing data.",
    storageBoundary: "No marketplace listing content may be scraped, copied, or persisted without provider permission.",
    resultBoundary: "Werkles cannot claim vacancy, zoning, availability, or budget fit without current sourced evidence."
  })
} satisfies Readonly<Record<string, OpportunityProviderSlot>>);
