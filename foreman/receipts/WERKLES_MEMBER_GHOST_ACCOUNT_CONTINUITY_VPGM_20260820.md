# Receipt — Member Ghost shortlist account continuity

**Execution context:** CODEX_LOCAL / Betsy  
**Vision:** `V_HEIMERDINKER_MEMBER_INTAKE_CONTINUITY_20260820.md`

## M ideas completed

1. The account shortlist loader now mounts even when the browser-cookie seed is empty. A real account result, including an empty result, replaces the browser seed; account failures clear it and fail visibly.
2. Recommendations → People now refreshes from the authenticated account Intake/profile and never presents another browser's practice count as account-owned continuity.

## Files

- `components/ghost-fleet/account-aware-ghost-member-lab.tsx`
- `components/ghost-fleet/account-aware-people-continuation.tsx`
- `app/dashboard/intros/page.tsx`
- `app/bellows/recommendations/page.tsx`
- `scripts/foreman/member-ghost-account-continuity-smoke.mjs`

## Proof

- `node scripts/foreman/member-ghost-account-continuity-smoke.mjs` — PASS
- existing location-aware Ghost ranking smoke — PASS
- `npm.cmd run typecheck` — PASS
- Browser `/dashboard/intros` — honest zero-result state in isolated session, no console errors
- Browser `/bellows/recommendations` — catalog and account-aware people continuation render, no console errors

## Limits

- Ghosts remain practice profiles; no real member or introduction is claimed.
- The rest of the legacy Intros verdict/readback remains server/browser-owner derived and needs the same account-aware refactor.
- No live database/provider/env/secret/deploy/git-gate action.
