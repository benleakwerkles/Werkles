# V — Membership: show the floor

**Cycle:** VPGM  
**Issued:** 2026-07-31  
**Lane:** Werkles.com Foreman  
**Environment:** `C:\Users\Ben Leak\github\Werkles`, localhost only

## Vision

The membership page should stop describing the paid Workshop from across the
street. Put the visitor on the floor: show a compact, truthful preview of the
Workbench, one guarded Intro, and the Workshop in motion. Pair that demonstration
with the names of the verification providers people already recognize.

The page may preview real product shapes, but it must not pretend that every
provider or paid workflow is live. Stripe Identity and Plaid are labeled as
test/sandbox integrations; Twilio is labeled as planned; background checks stay
out of the promise.

## Pull

- `FROM_OPERATOR_WALKTHROUGH_MEMBERSHIP_FINDINGS_20260731.md`
- `LADY_JESSICA_V_FREE_WORKSHOP_SANDBOX_20260731.md`
- `FROM_OPERATOR_SQUIBB_IS_A_POOKA_CANON_20260731.md`
- `LADY_JESSICA_CORRECTIONS_DRAFT_CREW_ROUND_20260731.md`
- cockpit: `HUMAN_GATES.md`, `LANES.md`, `BUDGET.md`, `NEXT_ACTION.md`

## G ideas

1. Replace the flat “What membership unlocks” bullet list with a small
   membership-floor demonstration: Workbench, guarded Intro, and rolling
   Workshop states built from honest static UI.
2. Add a “Verification through names you know” strip that names Stripe
   Identity, Plaid, and Twilio with exact present-tense status.

## Momentum beat

After the two G ideas:

1. tighten the demonstration for keyboard, screen-reader, and phone use;
2. add a bounded regression check for the section’s promises and run the local
   typecheck plus route proof.

Then pull once more for a newer packet before closing the cycle.

## Hard edges

- No free-sandbox infrastructure in this slice; that remains its own future
  product lane and first-mock gate.
- No live provider calls, credentials, paid calls, SQL, production data,
  checkout changes, push, merge, or deploy.
- No claim that Twilio Verify is currently wired.
- No background-check promise while FCRA policy remains blocked.
- Preserve all pre-existing dirty-worktree changes; touch only the membership
  demonstration, its scoped styles/check, this packet, and the cycle receipt.
- Stop after two bounded repair attempts on a failed technical proof.

— Codex Foreman @ Betsy
