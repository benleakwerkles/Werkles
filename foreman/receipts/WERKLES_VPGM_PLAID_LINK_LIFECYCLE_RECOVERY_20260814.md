# Werkles VPGM receipt — Plaid Link lifecycle and recovery

Date: 2026-08-14

Machine: Betsy

Execution context: `CODEX_LOCAL`

Repository: `C:\Users\Ben Leak\github\Werkles`

Branch / starting commit: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## V and P

Created:

- `foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_LINK_LIFECYCLE_AND_RECOVERY_20260814.md`
- `foreman/handoffs/outbox/TO_CBCC_PLAID_LINK_LIFECYCLE_RECOVERY_REVIEW_20260814.md`

Pulled the Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke lifecycle return paths before work and after Momentum. All four remain waiting. Unnamed local workers did not impersonate the named seats.

## G — two strongest ideas executed

### 1. Sanitized external-Link lifecycle

Added one closed client lifecycle:

- `loading`
- `open`
- `exited`
- `failed`
- `completed-not-saved`

The Plaid SDK callbacks terminate at the launcher boundary. Observers receive only deeply frozen `{ state }` snapshots. Public tokens, raw errors, metadata, institutions, accounts, request IDs, and provider values are discarded.

The launcher now:

- reserves single-flight before the first observer callback;
- rejects malformed, premature, duplicate, and out-of-order terminal callbacks;
- sanitizes SDK accessor, script-load, create, open, callback, and timeout failures;
- times out script loading and sessions that never terminate;
- removes a failed script element so a later attempt can retry;
- settles exactly once and releases the launch lock on every terminal path.

### 2. Warm member recovery/status copy

The existing `role=status` region now distinguishes:

- loading the secure window;
- the Plaid window being open;
- the member closing it without being scolded;
- a safe interruption with an honest retry invitation;
- sandbox completion with the explicit statement that no connection or funds proof was saved.

The panel never renders thrown SDK/network error messages. Handled lifecycle copy cannot be overwritten by a later catch, and `finally` restores the Funds action after every terminal state.

## Independent attack and Momentum repairs

The attack closed:

1. spoofed create-time and out-of-order callbacks;
2. duplicate terminal transitions;
3. public-token, SDK-metadata, and raw-error leakage;
4. accessor/proxy failures escaping sanitization;
5. never-terminal sessions and unresolved promises;
6. stale failed script elements preventing retry;
7. single-flight lock/action recovery defects;
8. thrown provider details reaching member copy;
9. ambiguous completion copy that did not explicitly deny saved connection state.

## Files

- `lib/verification/external-link-lifecycle.ts`
- `components/crucible/plaid-link-launcher.ts`
- `lib/crucible-plaid-lifecycle-copy.ts`
- `components/crucible/crucible-panel.tsx`
- focused lifecycle, single-flight, copy/UI, and provider-safety contracts under `scripts/foreman/`

## Proofs

PASS:

- eighteen focused Plaid/Crucible/verification contracts;
- `npm.cmd run typecheck`;
- `npm.cmd run build` — Next.js production build, 84/84 static pages generated;
- scoped whitespace checks from both implementation slices and independent attack.

## Custody and hard stops

No 1Password retry, provider call, Dashboard mutation, public-token exchange, Item custody, Balance/Assets retrieval, funds badge, telemetry persistence, secret output, environment change, SQL/schema/RLS, production data, paid call, staging, commit, push, deploy, or public launch occurred. The dirty shared tree was preserved. Lady Jessica retains sole push/deploy custody under the three-key rule.

## Result

**COMPLETED locally.**

Specific blocker: public-token exchange and a saved bank connection remain intentionally disabled until owner-bound encrypted Item custody, revocation, idempotency, authoritative persistence, and reviewed schema/RLS exist. The separate live sandbox customization probe still requires Betsy's 1Password unlock.
