# Werkles VPGM — full member walkthrough review lineage

Date: 2026-08-17
Foreman: Heimerdinker@Betsy
Execution context: `CODEX_LOCAL` on Betsy/Windows
Status: `WALKTHROUGH_STAGED_AT_HOME__NO_PUSH`

## V / P

Vision packet:
`foreman/handoffs/outbox/V_HEIMERDINKER_FULL_MEMBER_WALKTHROUGH_REVIEW_LINEAGE_20260817.md`.

Pulled the current cockpit plus exact local receipts for Home, Login, Intake,
Workshop, Recommendations, Intros, and Crucible. An outgoing packet was not
counted as a review. No Codex subagent or new environment was used.

## G results

### G1 — start before the reviewed Intake

The in-app browser is staged at `http://127.0.0.1:3000/`. A full product
walkthrough starts at Home because it tests the stranger-facing promise and
vocabulary before the newer reviewed Intake. Starting at Intake is appropriate
only for a narrow matching-flow regression.

### G2 — expose review lineage instead of flattening readiness

| Stop | Local status | Review lineage |
|---|---|---|
| Home | walkable | legacy/mixed; older Lady Jessica/Maker and historic cousin influence, not current review-first sealed |
| Login | walkable local transition | actual-CBCC reviewed; not durable account auth |
| Intake | improved and critique-ready | actual Ender + Bean controlled review/build |
| Workshop | critique-ready plan/readback scaffold | partial actual-CBCC review; real room/tools/persistence absent |
| Recommendations | critique-ready options + work paths | actual-CBCC reviewed; provider directory/ranking absent |
| Intros | synthetic practice | implementation uses prior guidance; fresh post-build actual-CBCC review pending |
| Crucible | synthetic Stripe/Twilio practice | guidance-controlled; fresh post-build review pending; providers off |
| Profile | local honesty/custody inspection | reviewed architecture direction; durable account custody not complete |
| Membership | local/mock commercial surface | legacy/mixed; no live charge |

### G3 — verify the route spine

All nine ordered routes returned HTTP 200 on the current local server.

## Momentum results

1. Browser inspection of Home found a clear benefit statement and direct Intake
   action, but also a first-contact vocabulary burden: `lanes`, `Foundry Dues`,
   `Squibb/Pooka`, `Crucible`, and `Workshop` appear before an ordinary visitor
   has learned the product. That is the earliest visible review debt.
2. The route order was corrected to include Home and Login ahead of the prior
   seven-stop member path, while keeping provider and account-custody claims
   fail-closed.

## Walkthrough order

1. Home `/`
2. Login `/login?next=%2Fbellows%2Fintake`
3. Intake `/bellows/intake`
4. Workshop `/dashboard/blueprints`
5. Recommendations `/bellows/recommendations`
6. Intros `/dashboard/intros`
7. Crucible `/dashboard/crucible`
8. Profile `/dashboard/profile`
9. Membership `/membership`

## Hard stops preserved

No provider call, secret, spend, SQL/schema/RLS, production mutation, staging,
commit, push, merge, or deploy. Browser-local continuity is not called account
custody. Practice providers and Ghost Members are not called live services or
real people.

