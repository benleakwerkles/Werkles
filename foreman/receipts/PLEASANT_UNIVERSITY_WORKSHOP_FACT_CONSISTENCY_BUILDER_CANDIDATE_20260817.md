# Pleasant University — Workshop fact consistency builder candidate

Date: 2026-08-17
Foreman/builder: Heimerdinker@Betsy
State: `BUILDER_ONLY__ACTUAL_CBCC_REVIEW_OWED`

## Review-first chain

- Vision: `foreman/handoffs/outbox/V_HEIMERDINKER_PLEASANT_UNIVERSITY_WORKSHOP_FACT_CONSISTENCY_20260817.md`
- Swanson personal pre-code review: `foreman/handoffs/inbox/FROM_SWANSON_WORKSHOP_FACT_CONSISTENCY_PRECODE_REVIEW_20260817.md`
- Foreman synthesis: `foreman/reviews/WORKSHOP_FACT_CONSISTENCY_PRECODE_SYNTHESIS_20260817.md`

All three predate the product mutation.

## Bounded mutation

The Workshop working read now derives its sentence from the already-rendered
`What is getting in the way` answer:

- no named blocker: says none was named;
- one named blocker: names that selection;
- multiple named blockers: names every semicolon-delimited selection and
  refuses to choose a primary.

No scoring, diagnosis, taxonomy, matching, persistence, custody, provider,
route, SQL, secret, push, or deploy behavior changed.

## Exact candidate hashes

```text
e2d2c59edb59421a94a689f1fd6a471f5928646d6a00e64a0abef7e8c90cf9e8  lib/owner-surfaces/owner-state.ts
1ee076472e93512210e5aa5e3b4b217e5db12aef10f80259f7bac375ac9bd523  scripts/foreman/workshop-fact-consistency-smoke.mjs
```

## Proof

- Workshop fact consistency contract: PASS
- TypeScript: PASS
- scoped whitespace: PASS
- rendered supplied multiple-blocker case: PASS
- legacy Workshop route-sequence sentinel: baseline-red on the unrelated old
  `router.push("/bellows/recommendations")` redirect expectation before it
  reaches this copy contract; not changed in this slice

## Hard stop

This candidate is not reviewed after mutation, assimilated, ready, pushed, or
deployed. A different actual cousin must personally review the exact candidate
before any readiness claim or follow-up mutation.
