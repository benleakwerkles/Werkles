# Receipt — Location-aware Ghost matching VPGM

Date: 2026-08-20  
Execution: Heimerdinker, CODEX_LOCAL on Betsy  
State: implemented and locally proven; fresh CBCC review receipts pending

## Operator defect

The first three synthetic people were Birmingham, Richmond, and Cleveland even though the member wanted practical proximity. The ranking engine did not read Profile location or work preference. It tried to infer a single place word from free-form Intake prose, then gave an exact match only 12 points. Diversity could therefore select a farther archetype without explaining the travel cost.

## Implemented

- Added deterministic same-city / same-state / neighboring-state / farther-away bands; no invented mileage.
- Added Local Only, Open to Travel, Remote Only, and Willing to Relocate ranking behavior.
- Geography cannot manufacture a match: candidates still require a substantive positive fit reason first.
- Added an authenticated Intros refresh that reads only the signed-in member's saved Intake plus profile city/state/work preference through the request-scoped RLS client.
- Added a one-time local walkthrough location control so the Operator does not need to redo Intake; it stores against the existing walkthrough owner.
- Added visible travel-fit labels to every displayed practice profile.
- Kept substantive fit score separate from the internal logistics ordering adjustment.

## Browser proof

`/dashboard/intros` rendered one selected candidate, no horizontal overflow, 46px location controls, and an explicit location form because the current walkthrough has no location on file. Current uncorrected seed order remains Birmingham / Richmond / Cleveland until a city/state preference is entered; the page no longer pretends those are nearby.

## Automated proof

- `npx.cmd tsx scripts/foreman/ghost-location-aware-ranking-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/ghost-shortlist-diversity-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/ghost-member-interaction-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/ghost-fleet-playable-loop-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS apart from expected Windows line-ending notices

The focused contract proves Cleveland Local Only orders Cleveland, Columbus, Pittsburgh, then Birmingham; Remote Only does not invent a proximity preference; invalid state/preference values fail neutral; and location alone cannot surface an otherwise unsupported candidate.

## CBCC status

Fresh focused packets authored:

- `foreman/handoffs/outbox/TO_ENDER_LOCATION_AWARE_GHOST_SHORTLIST_REVIEW_20260820.md`
- `foreman/handoffs/outbox/TO_BEAN_LOCATION_AWARE_GHOST_SHORTLIST_ATTACK_20260820.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_LOCATION_AWARE_GHOST_SHORTLIST_BUILD_NOTICE_20260820.md`

No returned receipt is claimed. This slice is not CBCC-sealed and is not approved for push/deploy.

## Gates preserved

No subagents, new environments, schema/RLS changes, service-role profile reads, provider/network calls, secrets, production-data writes, staging, commit, push, or deploy.

