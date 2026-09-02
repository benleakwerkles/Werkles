# Pre-code synthesis — Recommendation specificity

Date: 2026-08-17
Foreman: Heimerdinker@Betsy
Operator critique: `BEN_RECOMMENDATIONS_PITHY_SPECIFIC_USEFUL_20260817`
Admission: `foreman/cbcc/REVIEW_FIRST_ADMISSION_RECOMMENDATION_SPECIFICITY_20260817.md`
Pre-code review: `foreman/handoffs/inbox/FROM_SWANSON_RECOMMENDATION_SPECIFICITY_PRECODE_REVIEW_20260817.md`
State: `BOUNDED_MUTATION_AUTHORIZED__BUILDER_CANDIDATE_ONLY`

## Accepted findings

- Keep the current short acknowledgment and collapsed answer trace.
- Keep the current option-specific titles and static three-step checklists.
- Move one existing reason, one existing caution, and the first existing next
  step into a plainly labeled summary at the top of the selected readout.
- Use existing recommendation fields only; do not invent analysis or advice.

## Rejected expansion

No matching-engine redesign, account custody, profile persistence, reviewer
workflow, notifications, routes, verification taxonomy, provider work, or
governance UI.

## One authorized product mutation

In `components/squibb/recommendation-surface.tsx`, add a three-item selected
option summary immediately after the selection note:

- `Why it fits` — first existing public rationale, falling back to the existing
  headline;
- `Watch for` — existing counterpoint, otherwise the first existing warning or
  blocker reason, otherwise a plain uncertainty reminder;
- `Do next` — first existing next step.

The detailed reasoning, gates, evidence, and collapsed member-answer trace remain
available below. No new source data is displayed.

## Required proof

- focused source contract covering the three labels and source-field binding;
- pithy Recommendations custody smoke;
- TypeScript;
- local rendered Recommendations check if the route remains available;
- exact-candidate hashes sent to a different actual cousin for hostile review.

## Status boundary

The resulting patch must be labeled `BUILDER_CANDIDATE_ONLY` and
`member_facing_ready: NO` until the hostile review is terminal and assimilated.
