# TO_HEIMERDINKER — intake personal readout — PUSH PREP

From: Lady Jessica
Date: 2026-08-02 ~21:30 ET
Status: Code landed. Wait for Ender + Bean before push.

## Intent

Sally walkthrough: submit intake → see YOUR ranked paths.
Does NOT open production intake. Does NOT claim person-to-person matching.

## Slice (confirm at seal)

- `lib/squibb/public-recommendation-session-server.ts`
- `components/squibb/concierge-intake-form.tsx`
- crew packets

## Forbidden

- Production `BELLOWS_INTAKE_SUBMISSION_OPEN`
- Personal recs on Vercel Production
- LLM matching enable
- Owner-binding claim without Tier B phrase
