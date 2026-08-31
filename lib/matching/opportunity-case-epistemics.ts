import type { OpportunityCase, OpportunityFact } from "@/lib/matching/opportunity-case";

export const OPPORTUNITY_TRUTH_CLASSES = [
  "SELF_REPORTED_FACT",
  "VERIFIED_EVIDENCE",
  "RULE_DERIVED_INFERENCE",
  "MODEL_HYPOTHESIS",
  "EXTERNAL_RESEARCH",
  "UNKNOWN",
  "DECISION"
] as const;

export type OpportunityTruthClass = (typeof OPPORTUNITY_TRUTH_CLASSES)[number];

export type OpportunityClaim = Readonly<{
  claimId: string;
  sourceId: string;
  sourceType: "member_intake" | "werkles_rule";
  observedAt: string;
  truthClass: OpportunityTruthClass;
  statement: string;
  evidenceRequired: readonly string[];
  falsifiers: readonly string[];
}>;

export type OpportunityDecisionLineage = Readonly<{
  decisionId: string;
  pathId: string;
  state: "considering" | "tried" | "ruled_out";
  decidedBy: "member";
  decidedAt: string;
  reversible: true;
  sourceClaimIds: readonly string[];
}>;

export type OpportunityReadiness = Readonly<{
  diagnostic:
    | Readonly<{ state: "insufficient_input"; reason: string }>
    | Readonly<{ state: "ready_for_options"; reason: string }>;
  matching:
    | Readonly<{ state: "not_eligible"; reason: string }>
    | Readonly<{ state: "test_required"; reason: string }>;
}>;

export type OpportunityCaseEpistemics = Readonly<{
  version: "v1";
  caseRevisionId: string;
  intakeId: string;
  claims: readonly OpportunityClaim[];
  decisions: readonly OpportunityDecisionLineage[];
  readiness: OpportunityReadiness;
}>;

function stablePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}

function sourceClaim(caseRevisionId: string, intakeId: string, observedAt: string, fact: OpportunityFact): OpportunityClaim {
  const missing = fact.provenance === "missing";
  return Object.freeze({
    claimId: `${caseRevisionId}:claim:${fact.id}`,
    sourceId: intakeId,
    sourceType: "member_intake" as const,
    observedAt,
    truthClass: missing ? "UNKNOWN" as const : "SELF_REPORTED_FACT" as const,
    statement: missing ? `${fact.label} was not provided.` : `${fact.label}: ${fact.value}`,
    evidenceRequired: Object.freeze(missing ? [`Member answer for: ${fact.label}`] : []),
    falsifiers: Object.freeze([])
  });
}

export function buildOpportunityCaseEpistemics(
  opportunityCase: OpportunityCase,
  observedAt: string
): OpportunityCaseEpistemics {
  const instant = new Date(observedAt);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== observedAt) {
    throw new Error("Opportunity epistemics require a canonical UTC observation instant.");
  }

  const caseRevisionId = `case:${stablePart(opportunityCase.intakeId)}:revision:1`;
  const factClaims = opportunityCase.facts.map((fact) =>
    sourceClaim(caseRevisionId, opportunityCase.intakeId, observedAt, fact)
  );
  const hypothesisClaims = opportunityCase.hypotheses.map((hypothesis, index) => Object.freeze({
    claimId: `${caseRevisionId}:hypothesis:${index + 1}`,
    sourceId: "werkles:matching-rules:v1",
    sourceType: "werkles_rule" as const,
    observedAt,
    truthClass: "RULE_DERIVED_INFERENCE" as const,
    statement: hypothesis.statement,
    evidenceRequired: Object.freeze([...hypothesis.missingEvidence]),
    falsifiers: Object.freeze([...hypothesis.falsifiers])
  }));
  const decisionClaims = opportunityCase.memberPathStatuses.map((decision, index) => Object.freeze({
    claimId: `${caseRevisionId}:decision-claim:${stablePart(decision.pathId)}:${index + 1}`,
    sourceId: opportunityCase.intakeId,
    sourceType: "member_intake" as const,
    observedAt,
    truthClass: "DECISION" as const,
    statement: `The member marked ${decision.pathLabel} as ${decision.status.replace("_", " ")}.`,
    evidenceRequired: Object.freeze([]),
    falsifiers: Object.freeze([])
  }));
  const claims = Object.freeze([...factClaims, ...hypothesisClaims, ...decisionClaims]);
  const decisions = Object.freeze(opportunityCase.memberPathStatuses.map((decision, index) => Object.freeze({
    decisionId: `${caseRevisionId}:decision:${stablePart(decision.pathId)}:${index + 1}`,
    pathId: decision.pathId,
    state: decision.status,
    decidedBy: "member" as const,
    decidedAt: observedAt,
    reversible: true as const,
    sourceClaimIds: Object.freeze([decisionClaims[index].claimId])
  })));

  const diagnostic = opportunityCase.notMatch.outcome === "pause"
    ? Object.freeze({
        state: "insufficient_input" as const,
        reason: "There is not enough current information to rank a useful intervention safely."
      })
    : Object.freeze({
        state: "ready_for_options" as const,
        reason: "There is enough self-reported information to compare reversible next-step options."
      });

  const matching = opportunityCase.notMatch.outcome === "pause"
    ? Object.freeze({
        state: "not_eligible" as const,
        reason: "Matching stays closed while the diagnostic input is insufficient."
      })
    : Object.freeze({
        state: "test_required" as const,
        reason: "Self-report and rule-derived inference can shape a profile, but cannot alone establish member-match eligibility."
      });

  return Object.freeze({
    version: "v1",
    caseRevisionId,
    intakeId: opportunityCase.intakeId,
    claims,
    decisions,
    readiness: Object.freeze({ diagnostic, matching })
  });
}
