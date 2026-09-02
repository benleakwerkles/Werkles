# REVIEW_FIRST_ADMISSION — Recommendation causal why

Date: 2026-08-17
Foreman/student: Heimerdinker@Betsy
Instructor: Swanson/Petra
State: `PRE_CODE__MUTATION_LOCKED`

## One admitted defect

The fresh local walkthrough showed that `Why it fits` can repeat the member's
stated goal while the recommendation advice remains generic. It does not
explain why the selected option follows from the structured customer/equipment
blockers or another specific Intake fact.

## Exact bounded repair contract

Each selected recommendation readout must retain:

1. option label;
2. why it fits;
3. caution;
4. next action; and
5. at least one visible link to a specific Intake fact.

`Why it fits` must communicate the plain causal shape:
`Because you said X, this option helps by Y.`

It must not substitute a generic claim such as:

```text
I want recommendations
I want help
This is useful
This matches your goal
```

## Mutation boundary

Allowed after personal current-slice review and Foreman synthesis:

- one small change to the existing recommendation summary/readout seam;
- reuse already-derived Intake facts and existing recommendation kinds;
- focused contract and browser proof that at least one card links its option to
  a specific blocker, constraint, asset, stage, or urgency fact.

Not allowed:

- new scoring or taxonomy;
- matching-engine redesign;
- persistence or account custody;
- support bands, reviewer workflow, governance, provider work, or new routes;
- full Intake echo before results;
- push or deploy.

## Gates

```text
current_slice_precode_review: REQUIRED
foreman_synthesis_before_mutation: REQUIRED
exact_candidate_hostile_review_after_mutation: REQUIRED
next_mutation_allowed: NO
ben_transport_required: NO
```
