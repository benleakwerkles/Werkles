# Werkles Plaid Assets Test Adapter — VPGM Receipt

- Date: 2026-08-20
- Machine: Betsy
- Executor: Heimerdinker / Codex local hands
- Status: local candidate; actual-CBCC hostile receipt pending

## Outcome

The static Plaid factory slot now has a server-only, dependency-injected test adapter candidate at the exact declared module/export seam. Production acceptance remains closed.

The adapter keeps five different facts separate:

1. Link token created — opens Plaid Link only.
2. Client handoff received — public token moves into the injected server client; adapter returns only `connected` progress.
3. Signed Assets webhook verified — proves only the authenticated webhook body and readiness/error fact.
4. FAST snapshot evaluated — emits only `threshold_met`, `threshold_not_met`, or `inconclusive` after a server-side threshold calculation.
5. Provider custody disposed — both Item and Asset Report removal must be confirmed before the favorable narrow observation returns.

Link completion, `PRODUCT_READY`, Item removal alone, or a Full Asset Report cannot satisfy the funds-threshold claim. The adapter intentionally does not fabricate the separate account-ownership claim required by the aggregate funds policy.

## Files

- `lib/verification/adapters/plaid-adapter.ts`
- `scripts/foreman/plaid-adapter-smoke.ts`
- `foreman/handoffs/outbox/V_HEIMERDINKER_PLAID_ASSETS_TEST_ADAPTER_20260820.md`

## Primary sources checked

- Plaid Link overview: `https://plaid.com/docs/link/`
- Plaid Assets API and webhooks: `https://plaid.com/docs/api/products/assets/`
- Plaid webhook verification: `https://plaid.com/docs/api/webhooks/webhook-verification/`
- Plaid Item removal: `https://plaid.com/docs/api/items/`

## Hostile corrections made locally

- Assets `ERROR` webhooks use `reportType: null`; requiring `FAST`/`FULL` there was corrected.
- An error or later Full report now triggers Item + Asset Report cleanup instead of merely throwing and leaving custody behind.
- Handoff creation cannot postdate its receipt.
- Verified webhook time must be at or before receipt and within Plaid's five-minute replay window.
- A threshold observation cannot postdate the verified webhook.
- Cross-environment, wrong-report, partial-removal, mutated-dependency, raw-token return, and production-gate attacks fail closed.

## Proof

- Plaid adapter hostile smoke: PASS
- Provider factory acceptance regression: PASS
- Provider factory slot regression: PASS
- Provider adapter port regression: PASS
- Full TypeScript: PASS
- Scoped whitespace: PASS

## Boundaries

- No Plaid SDK, credentials, environment access, provider call, Link exchange, Asset Report, raw financial data, route, schema action, production composition, spend, git stage, push, or deploy.
- The injected future server client and webhook verifier are not implemented here. They must prove encrypted short-lived custody, ES256/JWK verification, exact body hash, replay protection, threshold policy binding, disposal, and transactional persistence before any route can use this adapter.
