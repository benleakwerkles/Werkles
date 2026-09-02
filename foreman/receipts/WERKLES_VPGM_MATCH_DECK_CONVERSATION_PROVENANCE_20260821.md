# Werkles VPGM receipt — Match Deck conversation provenance

Date: 2026-08-21
Foreman: Heimerdinker@Betsy
Execution context: CODEX_LOCAL on BETSY
Branch/base: `maker/site-g-20260703` / `93b79d1`

## V

Created `foreman/handoffs/outbox/HEIMERDINKER_V_MATCH_DECK_CONVERSATION_PROVENANCE_20260821.md` around one question: what creates the four practice prompts, what the member controls, and what another member would see.

## P

- Pulled the current source path from saved Intake/profile signals through Ghost ranking, candidate interaction DTOs, deterministic prompt/answer generation, and the Personal Bellows alignment memo.
- Applied the valid prior actual Ender Intake review that member offers/assets must be deliberately collected and matching causality must be visible.
- Pulled the current CBCC inbox twice. The canonical relay is blocked by 38 unread/conflicting/stale receipts and refused a fresh dispatch. No override was used, and no outgoing packet is counted as a fresh cousin review.

## G

1. Added visible provenance to all four candidate-specific prompt buttons. Each now identifies whether it came from the candidate's stated offer, stated need, unresolved cautions, or possible role.
2. Added a plain `Why these four?` explanation distinguishing member influence from candidate influence: Intake/profile facts select and order candidates; the selected practice profile shapes the four starters.
3. Added a member-side truth boundary: no one currently sees a generated conversation about the member, and a real-introduction preview/edit control is still required before real contact opens. Clicks, reading time, balances, and hidden guesses are explicitly excluded.
4. Extended the bounded preparation context from v2 to v3 so the exact synthetic exchanges the member explored reach the private Partnership Alignment memo. They remain labeled synthetic, unverified, and never auto-fill the member's answers.

## M

- Added readable provenance styling and mobile containment checks.
- Updated malformed-context rejection to attack the live v3 boundary.
- Walked Match Deck → one candidate question → Personal Bellows preparation and Match Deck → Crucible at 390px.

## Files changed

- `lib/ghost-fleet/interaction.ts`
- `components/ghost-fleet/ghost-member-interaction-lab.tsx`
- `lib/bellows/partnership-preparation-context.ts`
- `components/bellows/partnership-alignment-memo.tsx`
- `app/globals.css`
- `app/bellows/library/bellows-library.css`
- focused source and browser contracts under `scripts/foreman/`

## Proof

- Ghost Member interaction contract: PASS
- Match Deck → Alignment context contract: PASS
- Partnership Alignment source contract: PASS
- Match Deck conversation diversity browser walk: PASS
- Match Deck → Personal Bellows browser walk: PASS
- Partnership Alignment save/reload/clear browser walk: PASS
- Match Deck → Crucible malformed-context attack: PASS
- 390px overflow and 13px provenance floor: PASS
- TypeScript: PASS

## Honest remainder

The real-member preview/editor described on the page is not live yet. Building it requires carrying the member's deliberately shared project, offer, need, and working preferences into a separate unpublished preview DTO and adding an explicit publish/contact gate. This slice does not pretend that exists.

## Hard stops preserved

No subagent or new environment, real introduction, profile publication, account/schema/provider change, secrets, payments, commit, push, deploy, or production mutation.
