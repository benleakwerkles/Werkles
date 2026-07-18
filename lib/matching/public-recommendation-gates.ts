import type { ScoredPath } from "@/lib/matching/types";
import type {
  HumanGateRequirement,
  RecommendationKind
} from "@/lib/squibb/recommendations";

const REVIEW_GATE: HumanGateRequirement = {
  id: "matching-human-review",
  label: "Human review before action",
  kind: "operator_approval",
  severity: "blocker",
  reason: "This rules-based suggestion cannot send, apply, introduce, commit, purchase, or decide anything on your behalf.",
  benMustApprove: true
};

const DOMAIN_GATES = {
  translate_need: [
    {
      id: "matching-translation-review",
      label: "Confirm what Werkles heard",
      kind: "operator_approval",
      severity: "warning",
      reason: "Confirm or correct this interpretation before using it to choose a path.",
      benMustApprove: true
    }
  ],
  verify_proof: [
    {
      id: "matching-proof-review",
      label: "Evidence still needs verification",
      kind: "crucible_proof",
      severity: "warning",
      reason: "Missing evidence is not negative proof, and no fact becomes verified until its named source, scope, and date are checked.",
      benMustApprove: true
    }
  ],
  stage_intro_candidate: [
    {
      id: "matching-candidate-review",
      label: "No person or introduction verified",
      kind: "external_intro",
      severity: "blocker",
      reason: "No person's identity, fit, affiliation, availability, endorsement, or consent to an introduction has been verified.",
      benMustApprove: true
    }
  ],
  find_partner: [
    {
      id: "matching-partner-review",
      label: "No partner or introduction verified",
      kind: "external_intro",
      severity: "blocker",
      reason: "No partner, investor, affiliation, availability, endorsement, ownership fit, or introduction has been verified or initiated.",
      benMustApprove: true
    }
  ],
  find_equipment: [
    {
      id: "matching-equipment-review",
      label: "Seller and commitment review",
      kind: "financial_commitment",
      severity: "blocker",
      reason: "Verify the seller, quote, equipment condition, terms, and total cost before any deposit, purchase, or commitment.",
      benMustApprove: true
    }
  ],
  find_banker: [
    {
      id: "matching-banker-review",
      label: "No credit or funding decision",
      kind: "financial_commitment",
      severity: "blocker",
      reason: "Werkles has not verified a banker, credit eligibility, lender approval, funding terms, or transaction suitability.",
      benMustApprove: true
    }
  ],
  find_credit_union: [
    {
      id: "matching-credit-union-review",
      label: "No credit or lender approval",
      kind: "financial_commitment",
      severity: "blocker",
      reason: "Werkles has not verified a credit union, credit eligibility, lender approval, rates, terms, or outcome.",
      benMustApprove: true
    }
  ],
  find_better_job: [
    {
      id: "matching-job-review",
      label: "No employment decision",
      kind: "legal_review",
      severity: "blocker",
      reason: "No employer, opening, placement, qualification, compensation, schedule, or employment eligibility has been verified or decided.",
      benMustApprove: true
    }
  ],
  stay_current_job: [
    {
      id: "matching-stay-job-review",
      label: "Career judgment remains yours",
      kind: "operator_approval",
      severity: "blocker",
      reason: "Werkles has not verified your employment conditions, compensation, alternatives, or the outcome of staying in your current job.",
      benMustApprove: true
    }
  ],
  relocate: [
    {
      id: "matching-relocation-review",
      label: "No relocation suitability decision",
      kind: "operator_approval",
      severity: "blocker",
      reason: "Location suitability, housing, work eligibility, costs, services, and the outcome of a move have not been verified or decided.",
      benMustApprove: true
    }
  ],
  get_training: [
    {
      id: "matching-training-review",
      label: "Training claims need verification",
      kind: "legal_review",
      severity: "blocker",
      reason: "Werkles has not verified or guaranteed admission, eligibility, credential or license relevance, completion, provider claims, price, or outcomes. Check each before enrolling.",
      benMustApprove: true
    }
  ],
  raise_capital: [
    {
      id: "matching-capital-review",
      label: "No investment or funding decision",
      kind: "financial_commitment",
      severity: "blocker",
      reason: "Werkles has not verified an investor, funding eligibility, securities compliance, ownership terms, valuation, or transaction outcome.",
      benMustApprove: true
    }
  ]
} satisfies Record<RecommendationKind, HumanGateRequirement[]>;

export function eligiblePublicMatchingPaths(paths: readonly ScoredPath[]): ScoredPath[] {
  return paths
    .filter((path) => !path.disqualified)
    .map((path) => ({ ...path }))
    .sort((left, right) => left.rank - right.rank || right.score - left.score)
    .map((path, index) => ({ ...path, rank: index + 1 }));
}

export function publicMatchingHumanGates(kind: RecommendationKind): HumanGateRequirement[] {
  return [REVIEW_GATE, ...DOMAIN_GATES[kind]].map((gate) => ({ ...gate }));
}
