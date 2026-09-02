# Receipt — Member Intake client continuity

**Execution context:** CODEX_LOCAL / Betsy  
**Vision:** `V_HEIMERDINKER_MEMBER_INTAKE_CONTINUITY_20260820.md`

## G ideas completed

1. Real Supabase sessions now take precedence over any stale local preview session in the shared client-auth helper.
2. The Intake form persists only genuinely edited drafts. A legacy/automatic browser snapshot no longer blocks restoration of the latest account-saved Intake.
3. Recommendations waits for the authenticated account readout and fails visibly if it cannot load; it no longer silently retains a demo or browser-owner result as if it belonged to the account.

## Files

- `lib/client-auth.ts`
- `components/squibb/concierge-intake-form.tsx`
- `components/squibb/account-aware-recommendation-surface.tsx`
- `scripts/foreman/member-intake-client-continuity-smoke.mjs`

## Proof

- `node scripts/foreman/member-intake-client-continuity-smoke.mjs` — PASS
- `npx.cmd tsx scripts/foreman/member-intake-account-custody-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- Browser `/bellows/intake` — existing local Intake restored, full controls present, no console error

## Preserved gates and limits

- No Supabase migration was applied and no runtime database availability is claimed.
- No credentials, environment values, provider calls, production actions, git staging, push, or deployment.
- Workshop server rendering is still browser-owner based and is the next continuity seam.
