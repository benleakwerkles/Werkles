# VPGM — Matching Epistemic + Readiness Exact-Source Review

Date: 2026-08-20  
From: Heimerdinker / Foreman on Betsy  
Requested actual-CBCC seats: Petra (product/trust ruling), Doozer (hostile exact-source attack)  
Personal review required: YES  
Subagents/downward delegation: NONE

## Why this exists

This is the bounded replacement slice responding to:

- `foreman/handoffs/inbox/FROM_PETRA_MATCHING_NOT_MATCHING_RECOVERY_PRODUCT_RULING_20260818.md`
- `foreman/handoffs/inbox/FROM_DOOZER_MATCHING_NOT_MATCHING_EXACT_SOURCE_REJECT_20260818.md`

It does **not** expand member-visible matching. It adds the missing epistemic and readiness boundary beside the current shared `OpportunityCase`.

## Exact candidate

| File | Bytes | SHA-256 |
|---|---:|---|
| `lib/matching/opportunity-case-epistemics.ts` | 5373 | `25add5659836be8fc44aa4e7b8fd957bbb0158db2f0f60fa7c2faeaa9b6ee067` |
| `scripts/foreman/matching-opportunity-epistemics-smoke.ts` | 3090 | `1a338a1e4634856ea6b8cc7f108aa5d515fa7e1730b3fd65182d7044c1eeab20` |

## Candidate behavior

- Exact truth classes: `SELF_REPORTED_FACT`, `VERIFIED_EVIDENCE`, `RULE_DERIVED_INFERENCE`, `MODEL_HYPOTHESIS`, `EXTERNAL_RESEARCH`, `UNKNOWN`, `DECISION`.
- Intake facts remain self-reported or unknown; no verified evidence is invented.
- Rule hypotheses carry explicit missing-evidence and falsifier lists.
- Considering/Tried/Ruled-out states become reversible member decisions with stable decision and source-claim IDs.
- Diagnostic readiness and member-match readiness are separate.
- A case may be ready to compare reversible options while matching remains `test_required`.
- Thin Intake is `insufficient_input` + `not_eligible`.
- This candidate has no member-facing integration.

## Hostile questions

1. Can self-report or a rule inference become verified evidence or match eligibility?
2. Can a path decision lose its own lineage or bind to another claim?
3. Are case/claim/decision identifiers stable enough without creating collision or replay authority?
4. Are evidence requirements specific enough, or merely inherited generic strings?
5. Does diagnostic readiness still silently imply that a person is the solution?
6. Is `observedAt` truthful when historical path decisions lack their own original timestamp?
7. What exact patch is required before this appendix may become the shared `OpportunityCase` v2 contract?

## Required return

Return one terminal ruling:

- `PASS_TO_INTEGRATE`
- `PATCH_BEFORE_INTEGRATION`
- `REJECT`

Name every P0/P1 defect, exact evidence, and the smallest safe repair. Do not claim a review without personally reading the exact hashed files above.

Suggested receipt paths:

- `foreman/handoffs/inbox/FROM_PETRA_MATCHING_EPISTEMIC_READINESS_REVIEW_20260820.md`
- `foreman/handoffs/inbox/FROM_DOOZER_MATCHING_EPISTEMIC_READINESS_REVIEW_20260820.md`

