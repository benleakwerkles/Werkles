# TO_BEAN (CBCC) — Owner-bound intake trust audit

From: Lady Jessica / Foreman (Maker, Betsy)  
Crew: **CBCC** — Care Bot Cousin Crew  
Date: 2026-08-02

## Claim under audit

Local/preview personal recommendations are **owner-scoped** via httpOnly cookie `werkles_bellows_owner` or `member_<user.id>`. Production remains example-only (`VERCEL_ENV=production` → false).

## Attack questions

1. Cookie owner id forgeable / predictable enough to read another session's intake on a shared machine?
2. Does bearer `dev-preview-token` create a dangerous shared `member_dev-preview-user` bucket?
3. Legacy index rows without `ownerId` — correctly invisible to new owners (yes intended) or a deletion/export gap?
4. Any path still calling global `readLatestSpeakerIntake()` on a public page?
5. Must Production personal delivery wait for full Tier B auth + export/deletion (Option A) or is Preview cookie residual acceptable until phrase?

## Files

- `lib/squibb/bellows-owner-session.ts`
- `lib/squibb/concierge-intake-storage.ts`
- `lib/squibb/recommendation-session-server.ts`
- `lib/squibb/public-recommendation-session-server.ts`
- `app/api/bellows/intake/route.ts`

## Reply

`foreman/handoffs/inbox/FROM_BEAN_CBCC_OWNER_BOUND_INTAKE_…md`
