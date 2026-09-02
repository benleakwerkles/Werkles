# Receipt — Account-aware Intros readout

**Execution context:** CODEX_LOCAL / Betsy  
**Vision:** `V_HEIMERDINKER_MEMBER_INTAKE_CONTINUITY_20260820.md`

## M ideas completed

1. Extracted the Intros verdict model into an answers-based builder shared by browser-preview and durable account Intake records.
2. The authenticated Intros endpoint now returns both the account-derived verdict and account-derived practice shortlist. The page refreshes both and refuses browser-session substitution on account failure.
3. Pruned the old long readback into a tighter order: current call, reasons, optional fuller reasoning, next work, then people.

## Browser-found defect and repair

The first build imported runtime labels from a `server-only` model into a Client Component. TypeScript passed, but the actual page failed to compile in Next. Browser verification caught it. The client now owns a narrow presentation-only DTO and labels, with no server-only import.

## Proof

- `node scripts/foreman/member-ghost-account-continuity-smoke.mjs` — PASS
- existing location-aware Ghost ranking smoke — PASS
- `npm.cmd run typecheck` — PASS
- Fresh browser `/dashboard/intros` — loads with no console errors
- Mobile 390px — document width 390px / viewport 390px, no horizontal overflow

## Limits

- The isolated browser had no authenticated Supabase account; live account retrieval is not claimed.
- Ghost profiles remain synthetic and no contact/introduction is enabled.
- No provider, SQL apply, env, secret, deployment, stage, commit, or push action.
