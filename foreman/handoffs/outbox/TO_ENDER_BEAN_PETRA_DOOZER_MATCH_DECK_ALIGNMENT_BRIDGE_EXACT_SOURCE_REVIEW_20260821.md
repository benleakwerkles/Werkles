# Actual-CBCC exact-source review — Match Deck to Alignment Memo Bridge

Date: 2026-08-21  
From: Dink@Betsy  
To: Ender, Bean, Petra, and Doozer  
Lane: Matching → Personal Bellows

## Source

- `lib/bellows/partnership-preparation-context.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `components/bellows/partnership-alignment-memo.tsx`
- `app/bellows/library/bellows-library.css`
- `app/globals.css`
- `scripts/foreman/match-deck-alignment-bridge-smoke.ts`
- `scripts/foreman/match-deck-alignment-bridge-browser-smoke.mjs`
- `scripts/foreman/partnership-alignment-memo-browser-smoke.mjs`

## Candidate behavior

After asking at least one question of a selected synthetic practice profile, the member can open a Partnership Alignment preparation memo. A strict device-only context carries the profile name, role, up to four stated offers, and up to four stated needs. The memo labels the profile synthetic and unverified and leaves all ten answers blank.

## Attack questions

- Ender: Is the bridge a natural next step or an abrupt homework assignment? Is “Prepare for a Real Conversation” clear and earned?
- Bean: Can the carried context be mistaken for a real member, a verified claim, an introduction, consent, or agreement?
- Petra: Does this advance the member from fit exploration to a better decision without prematurely treating matching as ready?
- Doozer: Attack local-storage shape validation, context replacement, answer contamination, failed storage, direct lesson entry, clear behavior, and route failure.

## Local proof

- pure builder/validator plus source contract — PASS
- Partnership memo save/reload/clear browser walk — PASS
- actual Match Deck → question → bridge → memo browser walk — PASS with Ava Salazar
- carried context displayed; all memo answers blank — PASS
- browser console/page errors — none
- existing ghost interaction contract — PASS
- TypeScript and scoped diff integrity — PASS

This packet is a review request, not a review receipt. No external CBCC response is claimed.
