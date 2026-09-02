# Werkles VPGM — Match Ranking and Privacy Boundary

Date: 2026-08-21  
Execution: `CODEX_LOCAL` on Betsy / local preview  
Status: `LOCAL_CANDIDATE_PASS__COMPUTER_TWO_REPAIR_PASS__BROADER_PATCHES_REMAIN`

## Vision

Packet: `foreman/handoffs/outbox/HEIMERDINKER_V_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821.md`

The Match Deck now explains current order, deliberate actions that may change
it, signals Werkles remembers, and inputs Werkles forbids. Rank is presented as
a current ordering of useful possibilities, never a probability or human value
judgment.

## Actual CBCC pulled

- Fresh Computer/Thufir response:
  `foreman/handoffs/inbox/FROM_COMPUTER_MATCH_RANKING_PRIVACY_BOUNDARY_20260821_20260821-064303.md`
  returned `PASS_WITH_CONDITIONS`. The provider response answered the exact
  packet, but custody challenge/hash echo was not available; that limitation is
  preserved in the harvested receipt.
- Controlling prior actual receipts: Bean's Backer Equality attack,
  Ender/Doozer's matching-readiness review, and the Match Deck pre-code
  synthesis. They are prior evidence, not represented as fresh participation.
- A fresh Ender native-desktop route proof did not return usable output in one
  bounded attempt. No fresh Ender review is claimed.
- Computer's post-code attack returned `PATCH`; the bounded post-patch review
  then returned `PASS` on the two repaired drift vectors while preserving
  broader hardening items outside that two-repair packet. Both harvested files
  record the missing custody challenge/hash echo.

## G ideas executed

1. Member-visible current order and an on-page explanation of what moves a
   profile, what changes the deck, and what is forbidden.
2. A versioned narrow scorer input (`ghost-ranking-input/v1`) that excludes rich
   member metadata, capital eligibility, provider evidence, and behavioral data
   before scoring.
3. A plain-language matching boundary on `/privacy#matching-boundary`, linked
   from the Match Deck.

## Momentum ideas executed

1. Removed the three-reason truncation so every positive engine-produced reason
   reaches the selected profile's explanation.
2. Issued post-code and post-patch seal packets to Computer/Thufir. The final
   bounded receipt passes the explicit strongest-fit/variety disclosure and the
   machine-produced per-card `orderReason`; it does not erase the broader
   hardening requests from the earlier `PATCH`.

## Files changed

- `lib/ghost-fleet/match.ts`
- `lib/ghost-fleet/interaction.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `app/dashboard/intros/page.tsx`
- `app/api/ghost-fleet/intros/current/route.ts`
- `app/api/ghost-fleet/intros/preference/route.ts`
- `app/privacy/page.tsx`
- `app/globals.css`
- `scripts/foreman/ghost-member-interaction-smoke.ts`
- VPGM packets, relay manifest, harvested Computer receipt, and this receipt

## Proof

- `npx tsx scripts/foreman/ghost-member-interaction-smoke.ts` — PASS
- `npx tsx scripts/foreman/ghost-shortlist-diversity-smoke.ts` — PASS
- `npx tsx scripts/foreman/ghost-location-aware-ranking-smoke.ts` — PASS
- `npx tsx scripts/foreman/ghost-backer-equality-smoke.ts` — PASS
- `npm run typecheck` — PASS
- Browser `/dashboard/intros` — ranks 1–6 visible, explanation opens, and the
  selected card renders its machine-produced placement reason. The first walk
  had no warnings/errors; a final Chrome-extension reload emitted only the
  browser-extension message-channel-close error, not an app stack trace.
- Browser `/privacy#matching-boundary` — allowed/forbidden columns visible and
  readable, no console warnings/errors

## Hard stops preserved

No schema, tracking vendor, provider call, financial data, production data,
secret access, legal approval, git stage/commit/push, deploy, or publication.
Future stored feedback controls remain unbuilt and are not claimed.
