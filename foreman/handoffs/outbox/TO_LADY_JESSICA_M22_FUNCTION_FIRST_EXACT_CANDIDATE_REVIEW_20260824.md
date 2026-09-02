# To Lady Jessica: M22 function-first exact-candidate review

## Review purpose

Independently review the local member walkthrough candidate from Intake through
Recommendations, Workshop, and Match Deck. This is a review request, not proof
that Lady Jessica participated or approved the work.

## Exact candidate files

- `app/bellows/intake/page.tsx`
- `app/bellows/intake/concierge-intake.css`
- `app/api/bellows/intake/route.ts`
- `components/squibb/concierge-intake-form.tsx`
- `lib/squibb/concierge-intake-v0.ts`
- `lib/squibb/member-intake-custody.ts`
- `lib/squibb/recommendation-page-state.ts`
- `components/squibb/recommendation-surface.tsx`
- `components/squibb/source-document-panel.tsx`
- `components/squibb/recommendation-work-path.tsx`
- `lib/squibb/member-facing-recommendation-summary.ts`
- `lib/matching/shadow-to-recommendations.ts`
- `app/dashboard/blueprints/page.tsx`
- `components/workshop/account-aware-workshop-state.tsx`
- `app/dashboard/intros/page.tsx`
- `app/bellows/recommendations/squibb-recommendations.css`
- `scripts/foreman/walkthrough-function-first-copy-smoke.mjs`

## What to test

1. The useful part of every page appears before long explanation.
2. Recommendations does not repeat receipt-of-answers language or expose raw
   intake labels as if they were insight.
3. Workshop shows the member's current work directly beneath the hero, before
   generic process teaching.
4. Match Deck shows candidates before its longer account/explanation panel.
5. Copy sounds like a person helping another person: no unexplained internal
   terms, diagnostic posture, or false claims about saved/account state.
6. Desktop and a 390px-wide phone viewport remain legible, navigable, and free
   of horizontal overflow.
7. The primary next step is visually and verbally obvious.

## Local proof already obtained

- `npm run typecheck`: PASS
- `node scripts/foreman/walkthrough-function-first-copy-smoke.mjs`: PASS
- `npm run build`: PASS; 100 routes generated
- Live browser desktop Workshop walk: PASS; no console errors or overflow
- Live browser 390px Intake/Recommendations/Match Deck walk: PASS; no console
  errors or horizontal overflow

## Requested return

Return `GO`, `PATCH`, or `BLOCK` with exact file/line evidence and the smallest
repair set. Do not infer production readiness, provider readiness, push
authorization, or deployment authorization from this packet.

