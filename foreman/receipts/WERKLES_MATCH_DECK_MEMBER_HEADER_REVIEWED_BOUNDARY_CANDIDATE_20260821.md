# Werkles Match Deck + Member Header — reviewed-boundary candidate

Date: 2026-08-21

## Stopping point

This receipt closes the Operator-requested fifth step and intentionally starts no sixth step.

## Review boundary

- The implementation was constrained by actual prior CBCC receipts from Ender, Doozer, Petra, Bean, and Swanson.
- The fresh exact-candidate v0.3 mission was prepared but was not successfully posted to the cousin relay and therefore produced no fresh receipt.
- This is a locally verified candidate built from those genuine prior receipts. It is not represented as freshly sealed by the CBCC against this exact diff.

## Bounded implementation

- Preserved the standard public Werkles header on member pages.
- Added a stable second member row: Match Deck, Workshop, Recommendations, My Bellows, Crucible, Profile.
- Replaced raw-field and generic Match Deck questions with candidate-specific, two-sided, decision-bearing questions.
- Removed the four reported bad prompt patterns from the rendered experience.

## Verification

Passed:

- `npx tsx scripts/foreman/ghost-member-interaction-smoke.ts`
- `node scripts/foreman/stable-member-header-match-deck-smoke.mjs`
- `npx tsx scripts/foreman/site-header-local-continuity-smoke.ts`
- `npx tsx scripts/foreman/ghost-shortlist-diversity-smoke.ts`
- `npx tsc --noEmit`
- `node scripts/foreman/match-deck-conversation-diversity-browser-smoke.mjs`
- `node scripts/foreman/member-walkthrough-route-inventory-smoke.mjs`
- `node scripts/foreman/login-shared-shell-smoke.mjs`

Rendered walkthrough proof at `/dashboard/intros` confirmed:

- primary navigation and member navigation render together;
- all six member destinations render;
- the reported raw/generic prompt strings are absent;
- the selected profile receives four specific conversation questions;
- no browser console errors were present;
- both navigation tiers remain present at a 390 px viewport.

## Files in this slice

- `components/foundry/site-header.tsx`
- `lib/site-nav.ts`
- `app/globals.css`
- `lib/ghost-fleet/interaction.ts`
- `scripts/foreman/ghost-member-interaction-smoke.ts`
- `scripts/foreman/stable-member-header-match-deck-smoke.mjs`
- `scripts/foreman/site-header-local-continuity-smoke.ts`

## Gates preserved

No push, deployment, commit, schema mutation, secret change, provider production action, or external submission occurred.
