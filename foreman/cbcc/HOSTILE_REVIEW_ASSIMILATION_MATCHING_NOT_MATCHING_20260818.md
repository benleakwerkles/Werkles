# Hostile review assimilation — Matching Not Matching recovery

Date: 2026-08-18  
State before assimilation: `BUILDER_ONLY__UNREVIEWED_CANDIDATE__MUTATION_LOCKED`

## Bound evidence

- Candidate ZIP SHA-256:
  `2c3d0431db60441427e82837a00e1cc4a0588218e02d682a4e68e8d5ef68b80d`
- Recovered canon manifest SHA-256:
  `cac93a5405c617e639f5eee8765525ddc705d257da2e8b3a2a9f977221889727`
- Pleasant University breach-recovery ruling SHA-256:
  `7ac8fe6a15f3feee492a48493ea9b08e0a8285c5a71a956cc57e3cf59f283fc3`
- Petra current architecture ruling SHA-256:
  `2eca4072c5a4d1f91f5407d1bf07033923a2027a3581b5a58de6e9c92042d72f`
- Doozer exact-source hostile review SHA-256:
  `96bf97afb4e367821a9ce200e98f59ddafe14f0df70b0aebbf2328370c227293`

## Timing breach

Implementation occurred before current-slice CBCC review. Late review does not
become pre-code review. The candidate is therefore evaluated as an unreviewed
proposal, not grandfathered as an accepted build.

## Assimilated rulings

### Pleasant University / Swanson

`NO_GO`. Freeze mutation, bind exact bytes, expose the timing breach, keep
candidate and canon separate, obtain current-slice architecture and hostile
reviews, assimilate them, and only then choose keep, one repair, or reject.

### Petra

`PATCH`. Keep `OpportunityCase` only as a truth-preserving evidence/candidate
container. Add claim-level epistemic provenance and separate diagnostic
readiness from matching readiness. Do not expand behavior yet.

### Doozer / Orson

`REJECT`. The exact ten-file candidate has six P0 causal/trust failures and
multiple P1 provenance, polarity, and visibility failures. The candidate must
not be promoted.

## Accepted findings

All Petra and Doozer findings are accepted. None conflicts with recovered
canon. Together they establish that the present build can:

- let historical or negative text contaminate current intent;
- forget or bypass member-declared suppression;
- allow proof-only/pause outcomes to coexist with actionable provider or
  purchase paths;
- construct different causal evaluations in Workshop and Recommendations;
- label unrelated facts as causal support for every option;
- overstate inference as self-report/profile material; and
- render generic or excluded guidance as a personalized work path.

## Rejected findings

None.

## Stale sentinel classification

`scripts/foreman/workshop-route-sequence-smoke.mjs` expects the literal source
shape `router.push("/bellows/recommendations")`. The current Intake form uses
`window.location.assign("/bellows/recommendations")` after the successful save
and `setSubmitted(packet)`. The route and save-before-navigation ordering are
unchanged. This is classified as a stale source-shape assertion, not proof of a
broken route contract. It remains unchanged during the mutation lock.

## Decision

`CURRENT_CANDIDATE: REJECTED`

`PROMOTION: FORBIDDEN`

`MEMBER_FACING_MUTATION: FORBIDDEN`

The candidate may be used only as salvage material for a replacement built in
reviewed slices.

## One bounded next slice

The only authorized next code proposal is a pure canonical intent/history and
path-state boundary:

1. stable path IDs for `Considering`, `Tried`, and `Ruled out`;
2. separate current-intent inputs from historical-attempt inputs;
3. explicit polarity-safe current intent;
4. unknown path IDs fail closed;
5. explicit suppressions survive every not-match return; and
6. hostile pure tests for negation, tried/ruled-out contamination, unknown IDs,
   and thin-Intake suppression.

This slice must not change member-facing UI, Recommendations ranking, Workshop,
profile persistence, provider behavior, SQL, or production state. After the
single repair, its exact bytes require a new personal hostile review before any
second repair or integration.

## Release state

`REJECTED__ONE_PURE_REPAIR_SLICE_AUTHORIZED__REVIEW_REQUIRED_BEFORE_INTEGRATION`
