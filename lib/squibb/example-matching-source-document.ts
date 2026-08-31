/**
 * Real-world-style source document used for the public Autonomous Matching example.
 * This is what the rules were "fed" — shown next to conclusions so ratings are inspectable.
 */
export type MatchingSourceDocument = {
  id: string;
  title: string;
  kind: "example_fixture" | "member_intake" | "uploaded_document";
  summary: string;
  body: string;
  excerpts: Array<{
    id: string;
    label: string;
    text: string;
    feeds: string[];
  }>;
};

export const BAKERY_EQUIPMENT_SOURCE_DOCUMENT: MatchingSourceDocument = {
  id: "fixture-bakery-equipment-quote-v1",
  title: "Owner note + oven equipment quote (example)",
  kind: "example_fixture",
  summary:
    "A first-time commercial bakery owner asking for a partner and investor, with a priced oven quote already on the table.",
  body: [
    "FROM: Maya R. — first commercial bakery (example fixture)",
    "DATE: 2026-07-08",
    "",
    "I need a business partner and investor before I can buy the bakery equipment.",
    "I have a used deck oven quote from Harbor City Bakery Supply:",
    "  • Model: Dual-deck gas oven, refurbished",
    "  • Price band: $42,000–$48,000",
    "  • Seller contact: sales@harborcitysupply.example",
    "  • Listing: public business listing found for Harbor City Bakery Supply",
    "",
    "I do not have a revenue history for the bakery yet.",
    "I do not have an equipment inspection report yet.",
    "",
    "I thought I needed equity first. The quote is already in hand.",
    "Geography is fixed — I am staying in this city.",
    "Timeline: I want to move within the next few months, not tomorrow."
  ].join("\n"),
  excerpts: [
    {
      id: "ex-stated-need",
      label: "Stated ask",
      text: "I need a business partner and investor before I can buy the bakery equipment.",
      feeds: ["find_equipment", "find_partner", "raise_capital"]
    },
    {
      id: "ex-quote",
      label: "Priced asset",
      text: "Price band: $42,000–$48,000 — Dual-deck gas oven, refurbished",
      feeds: ["find_equipment", "find_credit_union", "verify_proof"]
    },
    {
      id: "ex-seller",
      label: "Seller contact",
      text: "Seller contact: sales@harborcitysupply.example · public business listing found",
      feeds: ["find_equipment", "verify_proof"]
    },
    {
      id: "ex-missing-revenue",
      label: "Missing proof",
      text: "I do not have a revenue history for the bakery yet.",
      feeds: ["find_credit_union", "raise_capital", "verify_proof"]
    },
    {
      id: "ex-missing-inspection",
      label: "Missing proof",
      text: "I do not have an equipment inspection report yet.",
      feeds: ["find_equipment", "verify_proof"]
    }
  ]
};
