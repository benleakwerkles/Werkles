# Exact-Source Review — Match Reason + Caution Continuity

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
To: Ender, Bean, Petra, Doozer  
Response requested: exact file/line findings; no silent approval

## Review set

- `lib/ghost-fleet/interaction.ts`
- `lib/ghost-fleet/match.ts`
- `app/dashboard/intros/page.tsx`
- `app/api/ghost-fleet/intros/current/route.ts`
- `app/api/ghost-fleet/intros/preference/route.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `lib/bellows/partnership-preparation-context.ts`
- `components/bellows/partnership-alignment-memo.tsx`
- `components/workshop/ghost-werkle-preview.tsx`
- `app/globals.css`
- `scripts/foreman/match-deck-candidate-reason-continuity-browser-smoke.mjs`

## Questions

1. Are the displayed reasons truly candidate-specific and traceable to the owner-bound match result?
2. Can any language be mistaken for verification, endorsement, safety, eligibility, or predicted success?
3. Does carrying reasons/cautions into the memo and practice Werkle improve preparation without auto-answering the member's work?
4. Is schema-v2 local context strict and bounded enough to reject malformed or oversized input?
5. Does the chooser remain readable and clearly interactive at 390px?

## Local proof

- interaction DTO exact keys, frozen arrays, leak exclusions — PASS
- Ava / Imani / Bo: 3 profiles, 2+ kinds of help, 2+ distinct reason readouts — PASS
- each candidate has at least one reason and one caution — PASS
- raw scores/percentages absent — PASS
- Match Deck → Alignment Memo with reasons/cautions — PASS
- Match Deck → practice Werkle with reasons/cautions — PASS
- 390px horizontal containment — PASS
- browser console/page errors — none
- TypeScript — PASS

## Hard edges

No ranking-weight change, score disclosure, real member, introduction, contact, profile/account mutation, provider, schema, secret, payment, commit, push, or deploy.
