# Werkles BVPGM M6 — Release Mechanics

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
State: `RELEASE_MECHANICS_READY__ACTUAL_REVIEW_ROUTES_BLOCKED`

## Vision

`foreman/handoffs/outbox/WERKLES_BVPGM_RELEASE_MECHANICS_M6_V_20260823.md`

## Pull

- Sealed 278-file candidate and complete push report.
- Current Ready production deployment and rollback target.
- Existing release packets and terminal receipt tokens.
- Background routes 9335, 9348, and 9349.

Fresh state: 9335/9348 absent; 9349 is Computer's unrelated Plaid task. No
review packet was misrouted and no outgoing packet was counted as participation.

## Go

1. Added candidate packaging dry-run using an isolated temporary Git index.
   The first run correctly exposed eight byte-bound paths that normalize to the
   existing HEAD blobs. The repaired classification passes with 270 changed
   payload paths, 8 baseline dependencies, zero contamination, zero missing
   payload, binary-patch SHA-256
   `73494f8181fd0aa9fe802ae74573d96bd2a39a03a6300606ac879195fa3b039e`,
   and no real-index/staging change.
2. Added one reusable member/internal production smoke runner. The first run
   exposed an environment-contract error: internal diagnostics are open locally
   but blocked in production. The repaired runner is environment-aware.
3. Local smoke PASS: member 10/10 and diagnostic 8/8.
4. Current live baseline smoke returns the expected pre-release FAIL: member
   8/10 because Formation and Personal Bellows are absent; internal containment
   remains 8/8.
5. Prepared the closed Tier 1 Markdown and HTML gate packet with blast radius,
   limitations, exact rollback, future phrases, and the three-key order.
6. Updated Lady Jessica's packet with the two executable release tools.

## Momentum

Pulled again after both repair attempts. Terminal exact-candidate receipts
remain 0/4. The candidate digest remains unchanged; release tooling and gate
evidence do not widen the candidate.

## Hard stops

No real Git index change, commit, push, deploy, merge, alias mutation, rollback,
provider action, login, secret, schema/RLS, production mutation, spend, new
task/environment/subagent, foreground input, or approval simulation occurred.

