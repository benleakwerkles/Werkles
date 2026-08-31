import type { WerkleOperatingBriefSectionId } from "@/lib/werkle/operating-brief";

export type FormationReading = Readonly<{
  label: string;
  source: string;
  href: string;
}>;

export const FORMATION_READING_LAST_REVIEWED = "August 23, 2026";

/**
 * Small, deterministic list of public primary sources. These links orient a
 * conversation; they do not select an entity, ownership split, tax treatment,
 * financing instrument, or contract term.
 */
export const FORMATION_READING_BY_SECTION = Object.freeze({
  purpose_customer_test: Object.freeze([
    Object.freeze({
      label: "Find customers and test demand",
      source: "U.S. Small Business Administration",
      href: "https://www.sba.gov/counseling/plan-your-business/#market-research"
    })
  ]),
  roles_decisions: Object.freeze([
    Object.freeze({
      label: "Write down how the business will run",
      source: "U.S. Small Business Administration",
      href: "https://www.sba.gov/counseling/plan-your-business/#business-plan"
    })
  ]),
  contributions_financial_proof: Object.freeze([
    Object.freeze({
      label: "Compare common business structures",
      source: "U.S. Small Business Administration",
      href: "https://www.sba.gov/counseling/launch-your-business/#business-structure"
    }),
    Object.freeze({
      label: "Understand federal business tax categories",
      source: "Internal Revenue Service",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures"
    })
  ]),
  ip_confidentiality: Object.freeze([
    Object.freeze({
      label: "Protect a small business from scams and rushed requests",
      source: "Federal Trade Commission",
      href: "https://www.ftc.gov/business-guidance/resources/scams-your-small-business-guide-business-0"
    })
  ]),
  exit_unknowns: Object.freeze([
    Object.freeze({
      label: "Review what changes when owners join or leave",
      source: "U.S. Small Business Administration",
      href: "https://www.sba.gov/counseling/launch-your-business/#business-structure"
    })
  ])
} satisfies Readonly<Record<WerkleOperatingBriefSectionId, readonly FormationReading[]>>);
