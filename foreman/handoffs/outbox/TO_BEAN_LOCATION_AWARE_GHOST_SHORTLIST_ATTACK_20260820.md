# TO BEAN — Location-aware Ghost shortlist hostile attack

Execution source: Heimerdinker, CODEX_LOCAL on Betsy  
Review only. Do not edit, deploy, push, apply schema, inspect secrets, or contact providers.

## Attack target

The new location-aware shortlist reads signed-in city/state/work preference through the request-scoped authenticated Supabase client, while the local walkthrough stores a cookie-owner-bound location preference. Geography adjusts order only after substantive matching produces an honest positive reason.

Read:

- `foreman/handoffs/outbox/V_HEIMERDINKER_LOCATION_AWARE_GHOST_MATCHING_20260820.md`
- `lib/ghost-fleet/proximity.ts`
- `lib/ghost-fleet/match.ts`
- `lib/ghost-fleet/preference-storage.ts`
- `app/api/ghost-fleet/intros/current/route.ts`
- `app/api/ghost-fleet/intros/preference/route.ts`
- `scripts/foreman/ghost-location-aware-ranking-smoke.ts`

Attack cross-user reads, forged owner cookies, malformed states/preferences, location-only match manufacture, distant-candidate suppression, diversity laundering, raw profile leakage, account/local precedence, and duplicate/replayed preference writes. Return P0/P1/P2 findings and a receipt naming the executed proofs. No receipt means no seal.

