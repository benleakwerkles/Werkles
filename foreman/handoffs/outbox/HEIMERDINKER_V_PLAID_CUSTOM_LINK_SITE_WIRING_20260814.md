# Heimerdinker V — Plaid custom Link site wiring

Date: 2026-08-14

Owner: Heimerdinker / Dink, Werkles.com Foreman

Execution context: `CODEX_LOCAL` on Betsy

Lane: Werkles.com / Crucible Plaid sandbox integration

Status: local implementation and review; no production authority

## Vision

Use the Plaid Link experience Ben customized instead of merely opening a generic Link session. The Plaid dashboard currently confirms that the published customization named `default` was updated. Werkles already supports the `link_customization_name` field but does not send it from the application route.

## P — current state

- `client_name` is correctly `Werkles`.
- Link requests are sandbox-only and Assets-only.
- `link_customization_name` is optional in the pure builder.
- `createPlaidLinkToken` receives an optional customization but the Funds route sends only the authenticated user ID.
- Plaid public-token exchange remains disabled; Link completion is not funds proof.
- Named Plaid reviews from Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke are still waiting.

## G idea 1 — explicit customization binding

- Canonize the currently published Plaid customization name `default` in the non-secret Link config.
- Make the Funds route/server provider use it explicitly for every sandbox Link-token request.
- Keep the builder strict and provider credentials server-only.
- Add an offline/request-body contract proving `link_customization_name: "default"` is present and no secret moves into public configuration.

## G idea 2 — truthful customized-Link experience

- Give the active Funds card one concise line explaining that Werkles' configured Plaid experience will open, still in sandbox.
- Do not claim that colors/customization imply proof, safety, production readiness, or saved connection state.
- Prove the local route and browser launch use the customized token while public-token exchange remains disabled.

## Momentum

After G:

1. attack customization fallback, renamed/deleted dashboard config, user/account data leakage, test-vs-live wording, and generic-vs-custom UI mismatch;
2. run one bounded local sandbox launch proof if authentication and existing configuration permit it;
3. re-pull named CBCC responses and write a receipt.

## Hard edges

No production Plaid, public-token exchange, Item custody, Balance/Assets retrieval, funds badge, SQL/schema/RLS, secrets, environment mutation, account/dashboard mutation, paid call, staging, commit, push, deploy, or public launch. Preserve the dirty tree. Named CBCC seats are not simulated by local workers.
