import type { CruciblePriceKey } from "@/lib/pricing";

export type CrucibleProofBoundary = {
  establishes: string;
  doesNotEstablish: string;
};

export const crucibleProofBoundaries: Record<CruciblePriceKey, CrucibleProofBoundary> = {
  identity: {
    establishes: "A provider completed its configured identity-document check.",
    doesNotEstablish: "Honesty, skill, financial capacity, or safety."
  },
  identity_reverification: {
    establishes: "A provider repeated its identity-document check on a later date.",
    doesNotEstablish: "Current address, honesty, skill, financial capacity, or safety."
  },
  phone: {
    establishes: "Someone controlled the checked phone channel at that time.",
    doesNotEstablish: "Legal identity, permanent ownership, or future reachability."
  },
  funds: {
    establishes: "With a dated provider receipt, the stated funds threshold or band at that time.",
    doesNotEstablish: "Net worth, creditworthiness, source of funds, or future capacity."
  },
  funds_reverification: {
    establishes: "With a new receipt, the stated funds threshold or band on the refresh date.",
    doesNotEstablish: "Net worth, creditworthiness, source of funds, or future capacity."
  },
  license: {
    establishes: "The named licensing record and status returned for that jurisdiction and date.",
    doesNotEstablish: "Competence, insurance, or status outside the checked record."
  },
  reference: {
    establishes: "Who supplied a reference and what they reported at that time.",
    doesNotEstablish: "That every statement is independently true or broadly endorsed."
  },
  employment: {
    establishes: "The employment facts returned within the provider's checked scope.",
    doesNotEstablish: "Performance, current ability, or every part of a work history."
  },
  background_basic: {
    establishes: "Records returned by the named basic package, sources, and date.",
    doesNotEstablish: "A complete history, personal safety, or legal clearance."
  },
  background_essential: {
    establishes: "Records returned by the named essential package, sources, and date.",
    doesNotEstablish: "A complete history, personal safety, or legal clearance."
  },
  background_complete: {
    establishes: "Records returned by the named complete package, sources, and date.",
    doesNotEstablish: "A complete history, personal safety, or legal clearance."
  },
  continuous_monitoring: {
    establishes: "Covered record changes reported after enrollment within the provider's scope.",
    doesNotEstablish: "Complete real-time awareness, personal safety, or legal clearance."
  }
};

export function proofBoundaryFor(checkKey: CruciblePriceKey): CrucibleProofBoundary {
  return crucibleProofBoundaries[checkKey];
}
