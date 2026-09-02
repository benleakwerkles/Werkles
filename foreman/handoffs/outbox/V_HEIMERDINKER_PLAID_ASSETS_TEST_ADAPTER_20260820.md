# V — Plaid Assets Test Adapter

## Vision

Prepare the server-only Plaid factory seam for Werkles's narrow Backer-lane snapshot without enabling production, retaining raw financial data, or treating Link completion as proof.

## Pull

Primary Plaid documentation checked on 2026-08-20:

- Link overview: `https://plaid.com/docs/link/`
- Assets API and webhooks: `https://plaid.com/docs/api/products/assets/`
- Webhook verification: `https://plaid.com/docs/api/webhooks/webhook-verification/`
- Item removal: `https://plaid.com/docs/api/items/`

Important facts:

- Link returns a temporary public token; exchange is a server action and does not prove funds.
- `PRODUCT_READY` means the Asset Report can be retrieved; it does not state a Werkles threshold result.
- Fast Assets contains current identity and balance information, while the Full report adds historical balance/transaction information.
- Plaid signs webhooks with a JWT whose body hash and issued-at time must be verified.
- Removing an Item does not remove an Asset Report; those are separate actions.

## Go

Create only:

- `lib/verification/adapters/plaid-adapter.ts`
- `scripts/foreman/plaid-adapter-smoke.ts`

Contract:

1. The factory export matches the static slot: `createPlaidVerificationAdapter`.
2. Test trust only; the existing acceptance gate rejects production.
3. Begin returns only a short-lived Link client token.
4. Client handoff sends the transient public token to an injected server client, which owns encrypted short-lived custody and Asset Report creation. The adapter returns only `connected` progress.
5. A verified `ASSETS / PRODUCT_READY / FAST` webhook is required before evaluation.
6. An injected server method retrieves the report, computes only `threshold_met`, `threshold_not_met`, or `inconclusive`, then confirms both Item and Asset Report removal. No raw report, account, balance, identity, or transaction data crosses the adapter boundary.
7. The adapter emits only `funds_threshold_observation`; it does not fabricate the separate account-ownership claim required by the aggregate funds policy.
8. `ERROR`, malformed, cross-environment, Full-report, mismatched report, or missing-custody paths fail closed.
9. Revoke separately confirms Item and Asset Report removal; one successful removal does not launder the other.

## Momentum

After the local candidate passes, request a Bean hostile review. Do not wire a route or production composition until durable owner-bound custody, signed-webhook verification, consent, spend controls, and transactional claim/evidence persistence are reviewed and live.

## Human gates preserved

- No credentials, SDK, environment access, provider call, Link exchange, Asset Report, schema action, production switch, questionnaire submission, spend, git stage, push, or deploy.
