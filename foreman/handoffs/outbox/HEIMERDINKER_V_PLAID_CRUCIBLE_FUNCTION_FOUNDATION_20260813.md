# HEIMERDINKER V — PLAID + CRUCIBLE FUNCTION FOUNDATION

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Predecessor: `WERKLES_VPGM_PLAID_CRUCIBLE_FUNCTION_TRUTH_20260813.md`
Status: LOCAL FUNCTION BUILD; NO PROVIDER OR PRODUCTION ACTION

## Vision

Continue function-first Crucible work while named CBCC returns are pending.
Build only the provider-neutral and member-truth foundations that every later
Plaid/Identity/credential lane needs.

## G ideas

1. **Real member state:** replace static Identity/Funds card state with an
   authenticated, owner-scoped status readout using existing profile fields.
   No new schema and no provider call.
2. **Claim/evidence contract:** define provider-neutral claim, consent,
   evidence, receipt, expiry, revocation, and dispute types plus executable
   invariants. No persistence implementation or SQL.

## Crew division

- Worker A: implement real member-state readout and focused tests.
- Worker B: implement claim/evidence contract and invariant tests.
- Worker C: independently attack the prior safety slice plus both new cuts.
- Lady Jessica + Ender/Doozer: actual product/hands review remains requested in
  existing outbox packets; do not impersonate their seats.
- Heimerdinker: integrate, resolve overlap, run full proofs, update cockpit.

## Hard edges

No staging, commit, push, deploy, SQL/schema/RLS, secret access, provider call,
paid action, live flag, fabricated proof, or global “verified” badge. Existing
dirty work is preserved.

