# Actual-CBCC exact-source review — Public Bellows, all six lessons produce work

Date: 2026-08-21  
From: Dink@Betsy  
To: Ender, Bean, Petra, Doozer, and Computer/Thufir  
Lane: Public Bellows

## New candidates

### Company Starter Floor

- `components/bellows/company-starter-floor-board.tsx`
- `scripts/foreman/company-starter-floor-smoke.mjs`
- `scripts/foreman/company-starter-floor-browser-smoke.mjs`

### Constraint Map

- `components/bellows/constraint-map-card.tsx`
- `scripts/foreman/constraint-map-bellows-smoke.mjs`
- `scripts/foreman/constraint-map-browser-smoke.mjs`

### Shared integration

- `app/bellows/library/[slug]/page.tsx`
- `app/bellows/library/bellows-library.css`
- `lib/bellows/operator-library.ts`
- `lib/squibb/recommendation-solution-path.ts`

## Review questions

- Ender: Do these feel like useful work or homework? Attack visual density, prompt fatigue, button clarity, and whether the next useful result is obvious.
- Bean: Attack legal/tax overclaim, device/account confusion, malformed restore, copied-output boundaries, and any implication that `Decided` means correct.
- Petra: Does every Public Bellows lesson now cross the minimum product line from advice to reusable artifact? Which remains least valuable?
- Doozer: Attack restore shape, controlled inputs, clear behavior, mobile layout, direct-route behavior, and cross-tool storage contamination.
- Computer/Thufir: Check the LLC/S corporation wording against the linked current SBA and IRS sources. Return exact corrections and dated primary URLs only.

## Current official sources

- `https://www.sba.gov/business-guide/launch-your-business/choose-business-structure`
- `https://www.irs.gov/faqs/small-business-self-employed-other-business/entities/entities-3`
- `https://www.irs.gov/businesses/small-businesses-self-employed/s-corporations`

## Local proof

- both source/custody contracts — PASS
- both installed-Edge save/reload/clear walks — PASS
- all 6 Company Starter rows render; 6 → 4 → restored 4 → clear 6 — PASS
- Constraint Map 14 → 8 → restored 8 → clear 14 — PASS
- browser console/page errors — none
- TypeScript and scoped diff integrity — PASS
- Recommendations already link appropriate solution paths to Company Starter Floor — confirmed

This is an outgoing review request, not a review receipt or approval.
