# Werkles VPGM — actual-CBCC Intake causality build

Date: 2026-08-16  
Foreman / builder: Heimerdinker@Betsy  
Execution context: `CODEX_LOCAL` on Betsy/Windows  
Status: `LOCAL_REVIEWED_SLICE_COMPLETE__NO_PUSH`

## V / P

The implementation is controlled by two actual CBCC returns delivered through
their existing signed-in provider tasks:

- Ender UX review: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
- Bean trust review: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`
- Foreman synthesis: `foreman/reviews/INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_SYNTHESIS_20260816.md`

No outgoing packet, automated test, Codex subagent, or invented seat was counted
as cousin participation.

## G ideas executed

### G1 — One understandable conversation, two honest outputs

- Replaced the equal-weight essay wall with one page containing three named
  sections: what the member is working on, what is in the way, and what they
  already have.
- Required only a short goal, one explicit business stage, and at least one
  blocker choice.
- Added explicit `Considering`, `Tried`, and `Ruled out` status for common paths.
  These serialize into the existing attempt field so older local storage stays
  readable and past/rejected paths stay out of current-intent detection.
- Added asset choices, optional offers, constraints, and an immediate editable
  working brief. Blank profile facts display as unknown and are not invented.

### G2 — Show why the options changed

- Renamed the ranked deck to `Possible next steps based on what you wrote`.
- Added an always-visible selected-option section that quotes up to four exact
  submitted answers considered by the rules and explains that correcting and
  resubmitting can move, add, or remove options.
- Removed stale `All five answers` logic and replaced directive incomplete-state
  copy with an honest unknown-preserving explanation.
- Replaced several first-contact internal terms (`Squibb`, `Autonomous Matching`,
  `Concierge Intake`) with ordinary member-facing language.
- Protected legacy source documents from React duplicate-key warnings with a
  stable composite render key while retaining the underlying excerpt ID.

## M ideas executed

1. Added a dedicated hostile contract for negation/history/unknown preservation
   and proof that a current money blocker changes ranked paths while a ruled-out
   loan does not.
2. Performed rendered browser interaction on the local Intake without submitting
   or replacing Ben's current intake. The working brief updated from goal, stage,
   blocker, ruled-out partner path, asset, and offer controls; submit became
   enabled only after the three required inputs. Final rendered check found three
   sections, five stage choices, nine blocker choices, visible working brief, and
   zero console errors.

## Proof

- `npx.cmd tsx scripts/foreman/intake-signal-trust-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/dual-purpose-intake-matching-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/intake-recommendations-handoff-smoke.ts` — PASS
- `npx.cmd tsx scripts/foreman/recommendation-selection-ux-smoke.ts` — PASS
- `node scripts/foreman/squibb-recommendation-navigation-smoke.mjs` — PASS
- `node scripts/foreman/test-concierge-intake-legibility.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd run build` — PASS, 84/84 static pages generated
- local rendered Intake interaction — PASS; no submission, provider call, or
  production data mutation

## Hard stops preserved

- Intake custody remains browser/session-bound local walkthrough storage, not a
  durable Werkles account record.
- No schema, SQL, RLS, provider, secret, spend, push, merge, or deploy action.
- No live member introduction or professional/legal/financial advice.
- Lady Jessica remains the only push/deploy seat after all three required
  sign-offs; this receipt is not a push recommendation.

## Re-pull

No newer actual Ender or Bean receipt appeared after assimilation. Existing Lady
Jessica and Doozer packets remain optional follow-up build/seal lanes and are not
reported as completed reviews.

