# RECEIPT — VPGM: Membership shows the floor

**Date:** 2026-07-31  
**Seat:** Codex Foreman @ Betsy  
**Lane:** Werkles.com Foreman  
**Environment:** local canonical repo and isolated localhost preview only  
**Result:** PASS — local slice complete; no push, deploy, provider call, or gate action

## Vision packet authored

`foreman/handoffs/outbox/CODEX_FOREMAN_V_MEMBERSHIP_SHOW_THE_FLOOR_20260731.md`

## Packets pulled

- `FROM_OPERATOR_WALKTHROUGH_MEMBERSHIP_FINDINGS_20260731.md`
- `LADY_JESSICA_V_FREE_WORKSHOP_SANDBOX_20260731.md`
- `FROM_OPERATOR_SQUIBB_IS_A_POOKA_CANON_20260731.md`
- `LADY_JESSICA_CORRECTIONS_DRAFT_CREW_ROUND_20260731.md`
- `FROM_ENDER_DESIGN_DIRECTOR_REVIEW_20260731.md`
- cockpit: `HUMAN_GATES.md`, `LANES.md`, `BUDGET.md`, `NEXT_ACTION.md`,
  `AI_COUSINS_PROTOCOL.md`, `CURRENT_STATE.md`

Momentum re-pull after implementation found no packet newer than this cycle's
Vision card.

## G ideas executed

1. Replaced the flat membership-unlocks list with a three-part member-floor
   preview: Workbench, Guarded Intro, and Rolling Workshop.
2. Added a provider strip naming Stripe Identity, Plaid, and Twilio with
   present-tense status. Twilio is explicitly “Planned — not connected yet.”

## M ideas executed

1. Added semantic headings/lists, responsive single-column behavior at 820px,
   and verified 390px rendering without horizontal overflow.
2. Added `scripts/foreman/test-membership-show-floor.mjs` to lock the product
   shapes, provider truth, future-sandbox boundary, background-check boundary,
   responsive rule, and local route status.

## Proof

| Check | Result |
|---|---|
| `npm.cmd run typecheck` | PASS |
| `node scripts/foreman/test-membership-show-floor.mjs` | PASS |
| `git diff --check` on scoped files | PASS (line-ending warnings only) |
| Current-source preview, temporary port 3100 | PASS; stopped after proof |
| Restored localhost, port 3000 | PASS; current source, left running |
| Desktop Chrome visual inspection | PASS |
| Mobile Chrome, 390×844 | PASS; `scrollWidth === clientWidth === 390` |
| Browser console errors | 0 |
| Next.js error overlays | 0 |

Evidence screenshots:

- `.codex-logs/membership-vpgm-desktop.png`
- `.codex-logs/membership-vpgm-mobile.png`

The pre-existing older port 3000 process exited while the temporary Next dev
preview used the same repo `.next` state. The foreman restored port 3000 as the
current-source dev server, reran the membership proof, and left it running. Port
3100 was stopped. Final browser check: membership 200, expected heading/provider
present, zero console errors, zero Next.js error overlays.

## Files touched by this cycle

- `app/membership/page.tsx`
- `app/globals.css`
- `scripts/foreman/test-membership-show-floor.mjs`
- `foreman/handoffs/outbox/CODEX_FOREMAN_V_MEMBERSHIP_SHOW_THE_FLOOR_20260731.md`
- `foreman/receipts/WERKLES_CODEX_FOREMAN_VPGM_MEMBERSHIP_SHOW_THE_FLOOR_20260731.md`
- `C:\Users\Ben Leak\Documents\Werkles\AGENTS.md` (desktop workspace router;
  prevents recurrence of the canonical-repo/VPGM context miss)

The two product files already contained unrelated uncommitted work; this cycle
preserved it. No slice seal was produced from the mixed dirty worktree.

## Hard stops preserved

- no free-sandbox infrastructure
- no live provider call or secret handling
- no background-check promise
- no SQL, production data, checkout mutation, push, merge, or deploy
- no human gate approved or simulated

— Codex Foreman @ Betsy
