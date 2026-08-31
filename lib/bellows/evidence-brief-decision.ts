export type EvidenceFreshness = "current_for_decision" | "stale" | "unknown";
export type EvidenceContradiction = "none_identified" | "unresolved" | "unknown";
export type ProfessionalReview = "not_identified" | "required" | "unknown";

export type EvidenceBriefDecisionInput = Readonly<{
  fields: Readonly<Record<string, string>>;
  freshness: EvidenceFreshness;
  contradiction: EvidenceContradiction;
  professionalReview: ProfessionalReview;
}>;

export type EvidenceBriefDecision = Readonly<{
  state: "incomplete" | "contradiction" | "stale_or_unknown" | "human_review" | "ready_for_next_check";
  heading: string;
  detail: string;
  missing: readonly string[];
}>;

const REQUIRED_FIELDS = Object.freeze([
  "claim", "decision", "sources", "supported", "inference", "gap", "change", "next"
]);

export function decideEvidenceBrief(input: EvidenceBriefDecisionInput): EvidenceBriefDecision {
  const missing = REQUIRED_FIELDS.filter((field) => typeof input.fields[field] !== "string" || !input.fields[field].trim());
  if (missing.length > 0) {
    return Object.freeze({
      state: "incomplete",
      heading: "The brief still has unknowns to name.",
      detail: "Fill every section—even with ‘unknown’—before using this brief to choose a next check.",
      missing: Object.freeze([...missing])
    });
  }
  if (input.contradiction === "unresolved") {
    return Object.freeze({
      state: "contradiction",
      heading: "Resolve the contradiction before relying on the claim.",
      detail: "Do not average conflicting evidence into confidence. Name which source, scope, or date must be checked next.",
      missing: Object.freeze([])
    });
  }
  if (input.freshness !== "current_for_decision" || input.contradiction === "unknown") {
    return Object.freeze({
      state: "stale_or_unknown",
      heading: "The evidence is not current enough to rely on yet.",
      detail: "Refresh the source or establish whether a contradiction exists before moving the decision forward.",
      missing: Object.freeze([])
    });
  }
  if (input.professionalReview !== "not_identified") {
    return Object.freeze({
      state: "human_review",
      heading: "Take the brief to the qualified reviewer named in your next check.",
      detail: "Werkles can organize the evidence; it cannot replace legal, tax, accounting, lending, safety, or other professional judgment.",
      missing: Object.freeze([])
    });
  }
  return Object.freeze({
    state: "ready_for_next_check",
    heading: "The brief is ready for its next bounded check.",
    detail: "This means the sections are complete and the source is marked current—not that the claim is verified or the decision is approved.",
    missing: Object.freeze([])
  });
}

