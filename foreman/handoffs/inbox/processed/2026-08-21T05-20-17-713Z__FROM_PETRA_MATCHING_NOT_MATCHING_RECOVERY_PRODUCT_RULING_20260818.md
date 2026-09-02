# From Petra / Comptroller — Matching Not Matching recovery product ruling

Date received: 2026-08-18  
Exact existing task: `6a3019f8-3b50-83ea-8bcb-c8dde82fb498`  
Request turn: `eb5277ee-0d67-495a-b225-07e8d2ab0b26`  
Response message: `54718dd0-40e9-4fe3-bdc7-3b41bccbb298`  
Response bytes: `7679`  
Response SHA-256: `2eca4072c5a4d1f91f5407d1bf07033923a2027a3581b5a58de6e9c92042d72f`  
Personal review: `YES`  
Subagents used: `NONE`

## Terminal ruling

`PATCH`

`MUTATION_PERMISSION: CONDITIONAL — NO further behavioral expansion yet.`

Petra reviewed the recovered theory and the described architecture. This was
not an exact-source review of the current candidate bytes.

## Architectural ruling

Keep `OpportunityCase` as the shared architectural center, but do not let it
become the decision-maker. Its proper role is a truth-preserving evidence and
candidate container shared by Workshop and Recommendations. It must not become
a deterministic oracle that silently promotes hypotheses into conclusions.

## Missing primitives

1. Claim-level provenance: source type, source identity where available,
   timestamp, and truth/confidence class for each material assertion.
2. Decision lineage: why, when, by whom or what evidence, and reversibility for
   `Considering`, `Tried`, and `Ruled out`.
3. A need ontology separate from the solution ontology.
4. Explicit evidence and falsifier requirements for each hypothesis.
5. Separate business-case readiness from member-match eligibility.
6. Stable identifiers for case revisions, claims, hypotheses, paths, and
   decisions.

## Reasoning boundaries

- Deterministic rules: validation, deduplication, path-state enforcement,
  eligibility/anti-gaming gates, known exclusions, evidence requirements, and
  fail-closed `UNKNOWN / TEST_REQUIRED / NO_MATCH` decisions.
- Research: current supplier/provider facts, prices, programs, regulations,
  market facts, and external proof. Research enters as evidence, not a winner.
- LLM reasoning: candidate claim extraction, alternative hypotheses, causal
  explanations, tradeoffs, falsifiers, and editable synthesis. These outputs
  remain inferential until supported.
- Human review: consequential or irreversible exclusions, sensitive member
  assessments, ambiguous high-downside judgments, and policy exceptions.

## Two P0 corrections

1. Add claim-level provenance and explicit epistemic types before adding more
   behavior: `SELF_REPORTED_FACT`, `VERIFIED_EVIDENCE`,
   `RULE_DERIVED_INFERENCE`, `MODEL_HYPOTHESIS`, `EXTERNAL_RESEARCH`, `UNKNOWN`,
   and `DECISION`.
2. Split diagnostic readiness from matching readiness. Layer 0 should emit a
   bounded next-intervention class plus the evidence required before entering
   member matching. Starter-profile contribution must not itself create match
   eligibility.

## Current proof boundary

This receipt authorizes no mutation by itself because it reviewed the supplied
architecture description rather than the exact source capsule. It is a current
architecture ruling to be combined with exact-candidate hostile review.

