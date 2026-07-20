# Werkles Operator Walkthrough Status - VPG29

STATUS: `READY FOR LATER WALKTHROUGH`
CYCLE_ID: `WERKLES-FLOCK-20260720-184759-ET-BETSY-02`
LEGACY_LABEL: `VPG29`
ORDINAL_CLAIM: `NONE`
OWNER: `Heimerdinker@Betsy`

## Functioning in Production

Production is VPG22: `dpl_BBBNaeGfjnZJXy3FbQVmVjePVgxo`, Ready at `https://werkles.com`, source `83178a95053a3a108dfa48de38f111172d25d50b`.

- Public homepage, Bellows, worked recommendation example, signup, login, onboarding, member/profile shell, Discovery, Membership, Pricing, Proof, and Crucible routes respond.
- Public Matching is deterministic/rules-only. Public delivery is on; LLM translation is off.
- Personal recommendation and First Weld APIs require an authenticated account. Saving a recommendation is closed. Bellows and Discovery intake submission are closed.
- Production does not yet include `/privacy` or the VPG23-VPG29 trust, continuity, and hard provider-closure changes.

Important: Production provider actions are not proven closed. Anonymous provider calls return `401`, which proves only the auth boundary. The older VPG22 source can proceed into sandbox-provider behavior after auth and membership checks. Do not narrate this as `Closed`.

## Functioning in protected Preview

The current VPG29 candidate is `dpl_GjiACys8j1wGnefcxPQszmj3rFgw`, Ready at `https://werkles1-oexaynukt-werkles.vercel.app`, source `9ac95d3aaa7cb817862237ccb23585309f815f1c`.

- It contains the newer Public Test Data Notice, trust/navigation work, First Weld/profile continuity, personal rules-based recommendation delivery, and the VPG29 handoff fix.
- New-member copy now says account confirmation, First Weld, and one useful profile signal. Returning members are told to sign in directly.
- Recommendation-mode Profile Builder now saves current edits before refreshing; the unchanged saved result remains a secondary action.
- Provider actions are hard-closed before auth/provider calls with `503` and `state: Closed`; the matching source flag is false.

## Closed by design

- Bellows and Discovery intake submission: `503 Closed`.
- Durable recommendation saving/Tier B: `403 Blocked`.
- Identity, Plaid, and funds exchange in current Preview: `503 Closed`.
- LLM translation/provider use: off.

## Human Gates

- Promote the current candidate to Production/`werkles.com`.
- Open Tier B durable custody, delivery, or saving.
- Enable provider actions or LLM/provider calls.
- Apply SQL/schema/RLS or mutate Production data.
- Change live Stripe payment behavior. Test-mode Stripe wiring was approved earlier and is not a new gate.

Read-only verification, local builds, focused tests, protected Preview pushes, and this later walkthrough are not Human Gates.

## Later live walkthrough - seven minutes

1. Open the protected Preview homepage and identify the public-test doorway.
2. Open Bellows recommendations and review the worked example/custody notice.
3. Use the signed-out account doorway; compare the explicit new-member and returning-member paths.
4. Sign in with the test account and open recommendation-mode Profile Builder.
5. Change one useful signal, use `Save changes and refresh recommendation`, and verify the private result reflects saved data.
6. Confirm `/privacy`, closed saving, and hard-closed provider behavior.
7. Compare `https://werkles.com` only where needed to show what is still Production VPG22.

Do not open the browser until Ben says he is ready for the walkthrough.
