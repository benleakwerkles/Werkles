# HEIMERDINKER V — CRUCIBLE CLAIM TRUTH + MEMBER READOUT

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Predecessor: `WERKLES_VPGM_PLAID_CRUCIBLE_FUNCTION_FOUNDATION_20260813.md`
Status: LOCAL DRAFT BUILD; NO SQL, PROVIDER, PUSH, OR PRODUCTION ACTION

## Vision

Turn the new provider-neutral verification contract into something both the
product and the member can actually use without creating another fake badge.

## G ideas

1. **Claim decision engine:** implement a pure, provider-neutral evaluator that
   accepts claim requirements and evidence, rejects subject/purpose/scope
   mismatches, and reports satisfied, missing, stale, disputed, revoked, or
   inconclusive outcomes. No persistence or provider calls.
2. **Member-readable proof boundaries:** make each Crucible check say plainly
   what it can establish and what it cannot establish. Keep the surface compact
   and grounded; do not add another wall of text or a universal trust score.

## Crew division

- Worker A: claim decision engine plus executable invariants.
- Worker B: compact member-facing boundary model and Crucible card integration.
- Worker C: independent combined-tree attack for badge laundering, stale proof,
  subject/purpose confusion, inaccessible copy, and UI overload.
- Named CBCC: Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke packets remain
  open; local workers do not impersonate those seats.
- Heimerdinker: integration, conflict resolution, proofs, cockpit, and receipt.

## Hard edges

No schema/RLS apply, SQL edits, provider calls, secret access, production data,
payment, background check, staging, commit, push, deploy, global `verified` or
`safe` badge, or claim that a stored profile flag is evidence. Preserve the
dirty tree and touch only this bounded slice.
