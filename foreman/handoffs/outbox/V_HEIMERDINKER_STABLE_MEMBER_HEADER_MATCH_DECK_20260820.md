# V — Stable member header and truthful Match Deck

Date: 2026-08-20  
Execution: CODEX_LOCAL on Betsy

## Member problem

Member pages independently assemble navigation. The label `Match deck` links
to the general dashboard even though the actual shortlist is
`/dashboard/intros`. A member can cross into Bellows and get the public header
again, making the product feel like several unrelated sites.

## Candidate

1. One auth-aware Werkles header component, with a stable member nav after a
   real or local walkthrough session is present.
2. Member `Match Deck` links exactly to `/dashboard/intros`.
3. Dashboard layout supplies the shared header to every dashboard route.
4. Remove the conflicting page-local nav rows from the core member journey.
5. Make the no-Intake Match Deck state explain that Intake is required before
   intelligent matching; do not call it a system error.

## Acceptance

- public signed-out nav remains unchanged;
- signed-in/member nav is Match Deck, Workshop, Recommendations, My Bellows,
  Profile on every shared-header route;
- current-page link has `aria-current=page`;
- no core member page links `Match Deck` to `/dashboard`;
- no-Intake is a useful empty state with an Intake action;
- mobile has no document overflow and targets remain at least 44px high.

