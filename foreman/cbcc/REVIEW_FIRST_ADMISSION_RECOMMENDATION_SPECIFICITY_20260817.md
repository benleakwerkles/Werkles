# REVIEW_FIRST_ADMISSION — Recommendation specificity

Created: 2026-08-17 before any new product mutation
Foreman: Heimerdinker@Betsy
State: `REVIEW_PENDING_BUILD_BLOCKED`

```text
work_object: August 17 quarantined Intake → Recommendations candidate
member_visible_defect: The selected option's checklist is distinct by option kind but remains generic; it does not yet turn the member's own stated situation into one concise, visibly tailored starting move.
candidate_files:
  - lib/matching/recommendation-guidance.ts
  - components/squibb/recommendation-surface.tsx
  - scripts/foreman/pithy-recommendations-custody-smoke.ts
review_question: What is the smallest truthful change that makes one selected option visibly useful to this member without replaying the Intake, inventing advice, or implying professional/financial authority?
required_pre_review_receipt_id: FROM_SWANSON_RECOMMENDATION_SPECIFICITY_PRECODE_REVIEW_20260817
mutation_allowed: YES__ONE_SYNTHESIZED_REVERSIBLE_PRESENTATION_PATCH_ONLY
ben_transport_required: NO
```

## Current-source evidence

`lib/matching/recommendation-guidance.ts` supplies a fixed headline, summary,
and three next steps for each recommendation kind. The member's relevant source
answers appear only inside the collapsed `Why this appeared` disclosure in
`components/squibb/recommendation-surface.tsx`.

## Admission boundary

The initial mutation lock was satisfied by the terminal current-slice review and
the Foreman synthesis. One presentation-only product mutation is now authorized
by `foreman/reviews/RECOMMENDATION_SPECIFICITY_PRECODE_SYNTHESIS_20260817.md`.
The candidate remains `BUILDER_ONLY__REVIEW_OWED` and
`member_facing_ready: NO`.
