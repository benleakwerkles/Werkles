import type { BusinessOpportunityCandidate } from "@/lib/opportunities/types";

const OBSERVED_AT = "2026-09-01T16:00:00.000Z";

const NO_SPONSORSHIP = Object.freeze({
  status: "none" as const,
  disclosure: "Werkles is not being paid to place this option in the walkthrough.",
  affectedOrdering: false as const
});

function candidate(value: BusinessOpportunityCandidate): BusinessOpportunityCandidate {
  return Object.freeze(value);
}

export const DECATUR_LANDSCAPING_WALKTHROUGH = Object.freeze([
  candidate({
    id: "fixture:decatur:home-depot-rental-117",
    category: "supplier_equipment",
    name: "The Home Depot Tool Rental — Wages Drive",
    locationLabel: "2295 Lawrenceville Highway, Decatur, GA 30033",
    sourceName: "The Home Depot",
    sourceUrl: "https://www.homedepot.com/l/Wages-Drive/GA/Decatur/30033/117/rentals",
    sourceRecordId: "store-117-rentals",
    providerStage: "walkthrough_fixture",
    observedAt: OBSERVED_AT,
    facts: [
      { label: "Published services", value: "Tool, truck, trailer, lawn-and-garden, and selected large-equipment rentals", provenance: "official_source" },
      { label: "Store note", value: "The source says inventory varies and recommends checking current availability", provenance: "official_source" }
    ],
    whyItAppeared: [
      "You are testing a landscaping business near Decatur and named equipment as an immediate need.",
      "Renting one job's equipment could test demand before you decide whether ownership makes sense."
    ],
    unknowns: [
      "Current inventory, rental price, deposit, commercial-use terms, transport cost, and equipment condition are unknown."
    ],
    sponsorship: NO_SPONSORSHIP,
    action: { label: "Open the official source", href: "https://www.homedepot.com/l/Wages-Drive/GA/Decatur/30033/117/rentals", sendsMemberData: false, createsCommitment: false }
  }),
  candidate({
    id: "fixture:decatur:coworks",
    category: "meeting_customer_place",
    name: "Decatur CoWorks",
    locationLabel: "708 Church Street, Decatur, GA 30030",
    sourceName: "Decatur CoWorks",
    sourceUrl: "https://www.decaturcoworks.com/contact",
    sourceRecordId: "decatur-coworks-contact",
    providerStage: "walkthrough_fixture",
    observedAt: OBSERVED_AT,
    facts: [
      { label: "Published location", value: "708 Church Street in Decatur", provenance: "official_source" },
      { label: "Published use", value: "Coworking and meeting space", provenance: "official_source" }
    ],
    whyItAppeared: [
      "A neutral meeting room may be useful before you lease an office or invite a new collaborator into a private space."
    ],
    unknowns: [
      "Current plans, room availability, guest rules, accessibility, noise level, and total meeting cost are unknown."
    ],
    sponsorship: NO_SPONSORSHIP,
    action: { label: "Open the official source", href: "https://www.decaturcoworks.com/contact", sendsMemberData: false, createsCommitment: false }
  }),
  candidate({
    id: "fixture:decatur:business-license",
    category: "permit_government_help",
    name: "City of Decatur business-license path",
    locationLabel: "City of Decatur jurisdiction",
    sourceName: "City of Decatur",
    sourceUrl: "https://www.decaturga.com/adminservices/page/business-license",
    sourceRecordId: "decatur-business-license",
    providerStage: "walkthrough_fixture",
    observedAt: OBSERVED_AT,
    facts: [
      { label: "Published requirement", value: "Businesses inside Decatur city limits need the appropriate occupancy approval before the occupation-tax application", provenance: "official_source" },
      { label: "Jurisdiction warning", value: "The page says not to use this application for unincorporated DeKalb County or another jurisdiction", provenance: "official_source" }
    ],
    whyItAppeared: [
      "Your stated location is Decatur, but the correct permit path depends on the exact business address and jurisdiction."
    ],
    unknowns: [
      "Your operating address, city-limit status, home-business status, NAICS classification, and required trade permits are unknown."
    ],
    sponsorship: NO_SPONSORSHIP,
    action: { label: "Open the official source", href: "https://www.decaturga.com/adminservices/page/business-license", sendsMemberData: false, createsCommitment: false }
  }),
  candidate({
    id: "fixture:dekalb:uga-sbdc",
    category: "training_trade_resource",
    name: "UGA Small Business Development Center — DeKalb",
    locationLabel: "1990 Lakeside Parkway, Suite 250, Tucker, GA 30084",
    sourceName: "University of Georgia Small Business Development Center",
    sourceUrl: "https://georgiasbdc.org/locations/dekalb/",
    sourceRecordId: "uga-sbdc-dekalb",
    providerStage: "walkthrough_fixture",
    observedAt: OBSERVED_AT,
    facts: [
      { label: "Published service area", value: "DeKalb and Rockdale counties", provenance: "official_source" },
      { label: "Published help", value: "Consulting and training for startup, operations, capital preparation, sales, and financial performance", provenance: "official_source" },
      { label: "Important boundary", value: "The SBDC says it does not provide funding", provenance: "official_source" }
    ],
    whyItAppeared: [
      "You are early enough that a local adviser could help test costs, licensing, pricing, and financing preparation before you commit."
    ],
    unknowns: [
      "Appointment availability, program fit, preparation requirements, and any training fee are unknown."
    ],
    sponsorship: NO_SPONSORSHIP,
    action: { label: "Open the official source", href: "https://georgiasbdc.org/locations/dekalb/", sendsMemberData: false, createsCommitment: false }
  }),
  candidate({
    id: "fixture:decatur:delta-community-business",
    category: "banking_public_funding",
    name: "Delta Community Credit Union — Decatur",
    locationLabel: "160 Clairemont Avenue, Decatur, GA 30030",
    sourceName: "Delta Community Credit Union",
    sourceUrl: "https://www.deltacommunitycu.com/business-banking.html",
    sourceRecordId: "delta-community-decatur-business",
    providerStage: "walkthrough_fixture",
    observedAt: OBSERVED_AT,
    facts: [
      { label: "Published local presence", value: "A Decatur branch is listed at 160 Clairemont Avenue", provenance: "official_source" },
      { label: "Published business products", value: "Business checking, savings, merchant services, and commercial lending information", provenance: "official_source" },
      { label: "Published service area", value: "The business-eligibility page includes DeKalb County and says additional requirements may apply", provenance: "official_source" }
    ],
    whyItAppeared: [
      "You named money and equipment as constraints, so a local business-account and commercial-financing conversation may be worth comparing with other institutions."
    ],
    unknowns: [
      "Membership eligibility, underwriting, rates, fees, collateral, approval, and product fit for your business are unknown."
    ],
    sponsorship: NO_SPONSORSHIP,
    action: { label: "Open the official source", href: "https://www.deltacommunitycu.com/business-banking.html", sendsMemberData: false, createsCommitment: false }
  })
] satisfies readonly BusinessOpportunityCandidate[]);

export const GEORGIA_MULTI_LOCATION_WALKTHROUGH_LEAD = candidate({
  id: "fixture:georgia:uga-sbdc-office-finder",
  category: "training_trade_resource",
  name: "UGA SBDC statewide office finder",
  locationLabel: "Georgia statewide",
  sourceName: "University of Georgia Small Business Development Center",
  sourceUrl: "https://georgiasbdc.org/find-your-sbdc/",
  sourceRecordId: "uga-sbdc-statewide-office-finder",
  providerStage: "walkthrough_fixture",
  observedAt: OBSERVED_AT,
  facts: [
    { label: "Published scope", value: "A statewide office finder for Georgia business owners", provenance: "official_source" },
    { label: "Published help", value: "Consulting and training related to starting, operating, financing, and growing a business", provenance: "official_source" }
  ],
  whyItAppeared: [
    "The practice Werkle spans Atlanta and Columbus, so a statewide office finder can preserve both local lanes until the participants choose an operating area."
  ],
  unknowns: [
    "The correct office, appointment timing, exact program fit, and any course fee depend on the operating area and help the participants choose. The SBDC does not provide funding."
  ],
  sponsorship: NO_SPONSORSHIP,
  action: { label: "Open the official source", href: "https://georgiasbdc.org/find-your-sbdc/", sendsMemberData: false, createsCommitment: false }
});
