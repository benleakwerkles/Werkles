# Werkles VPGM receipt — Plaid custom Link site wiring

Date: 2026-08-14

Machine: Betsy

Execution context: `CODEX_LOCAL`

Repository: `C:\Users\Ben Leak\github\Werkles`

Branch / starting commit: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## Team status

- Heimerdinker: Foreman, integration, verification, and receipt owner.
- Lady Jessica: second in command and sole push/deploy seat; fresh Plaid experience review packet issued, return waiting.
- Ender/Doozer: fresh Plaid UX/experience review packet issued, return waiting.
- Bean: fresh hostile trust review packet issued, return waiting.
- Thufir/Locke: fresh legal/policy trust-boundary packet issued, return waiting.
- Skybro, Petra, and Computer: no active Plaid assignment in this bounded cycle.

Unnamed local workers implemented and attacked the slice without impersonating named CBCC seats.

## V and P

Created:

- `foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_CUSTOM_LINK_SITE_WIRING_20260814.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_ENDER_PLAID_CUSTOM_LINK_EXPERIENCE_REVIEW_20260814.md`
- `foreman/handoffs/outbox/TO_BEAN_THUFIR_PLAID_CUSTOM_LINK_TRUST_REVIEW_20260814.md`

Current named returns remained absent on the final pull.

Read-only Plaid Dashboard inspection confirmed the current Werkles.com Link customization is named `default`, displays `Success! default has been updated`, and previews customized Link screens. No Dashboard setting was changed.

## G — two strongest ideas executed

### 1. Explicit customization binding

- Canonical non-secret customization is exactly `default`.
- The authenticated Funds route passes it explicitly.
- The server provider requires the exact literal and rejects omission or substitution before safety checks, credentials, or fetch.
- The sandbox `/link/token/create` body now contains `link_customization_name: "default"`.
- Credentials remain inside the `server-only` provider boundary.
- No generic-Link fallback exists.

### 2. Truthful customized-Link experience

The actionable Funds card now says:

> Requests the configured Plaid sandbox experience; availability checked on open.

It does not promise that the Dashboard configuration is still available, or imply proof, safety, production, saved connection, account data, or balances. Adjacent copy now says the demo keeps no funds result or account numbers and fails closed when unavailable.

## Independent attack and repairs

The attack repaired:

1. pre-click copy guaranteeing that the configuration would open;
2. false copy claiming Werkles kept a funds result;
3. obsolete sandbox-stub and public-token-exchange/funds-status claims;
4. provider acceptance of non-string/blank Link tokens.

Public-token exchange remains disabled and the SDK boundary still discards the token supplied on Link success.

## M — Momentum

### Safe sandbox compatibility probe

Added a single-purpose probe and wrapper that:

- require exact `PLAID_ENV=sandbox`;
- use only `https://sandbox.plaid.com/link/token/create`;
- send a dummy owner plus `Werkles`, `default`, `assets`, `US`, and `en`;
- allow one POST, reject redirects, and abort its network phase after 15 seconds;
- check then discard the returned Link token;
- print only an allowlisted PASS/FAIL category;
- never print secrets, tokens, request IDs, provider payloads, or errors;
- contain no exchange, storage, account, Balance, Assets retrieval, or transaction call.

Hostile review caught and repaired a redirect credential-replay risk by setting `redirect: "error"`.

The live sandbox probe was attempted twice but did not launch: Betsy has no stored 1Password service token, and `op run` waited for credential unlock. Both attempts were terminated before the probe or Plaid fetch started. No provider call completed.

### Local rendered proof

`http://127.0.0.1:3000/dashboard/crucible` rendered the new Funds text, sandbox-only boundaries, no-result/no-account-number statement, account-selection explanation, fictional receipt warning, and active Plaid demo control. The Ghost Fleet browser session is not account-bound, so it cannot provide the authenticated member route proof.

## Proofs

PASS:

- sixteen focused Plaid/Crucible/verification contracts;
- direct production/development/missing-config fail-closed probe tests;
- PowerShell wrapper exit/output propagation proof;
- `npm.cmd run typecheck`;
- `npm.cmd run build` — Next.js production build, 84/84 static pages generated;
- rendered local Crucible content inspection.

## Custody and hard stops

No Dashboard mutation, completed provider call, public-token exchange, Item custody, Balance/Assets retrieval, funds badge, secret output, environment change, SQL/schema/RLS, production data, paid call, staging, commit, push, deploy, or public launch occurred. The dirty shared tree was preserved. Lady Jessica retains sole push/deploy custody under the three-key rule.

## Result

**COMPLETED locally.**

Specific human blocker for the final live sandbox compatibility receipt: unlock/authorize 1Password on Betsy or restore the approved noninteractive service-token path, then rerun the prepared probe. The site code is explicitly wired to `default`; persistence and live funds proof remain separately gated.
