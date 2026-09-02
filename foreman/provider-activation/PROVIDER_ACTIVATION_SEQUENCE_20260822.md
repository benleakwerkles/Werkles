# Werkles Provider Activation Sequence

Date: 2026-08-22  
Owner: Ben Leak  
Foreman: Heimerdinker@Betsy  
Status: credential acquisition may begin; production use remains provider-by-provider gated

## Operating rule

Acquire and vault production credentials before the final adapter is complete when the provider permits it. Do not place a production credential into the application environment, enable traffic, send a message, create a charge, run a check, or claim verification until that provider's code, webhook, custody, consent, deletion, and rollback acceptance tests pass.

Secrets go directly from the provider dashboard into 1Password/Vercel private custody. They never enter chat, source files, screenshots, or receipts.

## Activation order

### 1. Plaid — acquire Production credentials now; do not switch Werkles yet

Acquire/vault:

- `PLAID_CLIENT_ID` (team identifier; shared across environments)
- Production `PLAID_SECRET` (environment-specific)
- planned production setting `PLAID_ENV=production`

Current Werkles truth:

- Sandbox Link-token creation exists.
- The current server code hardcodes `https://sandbox.plaid.com` and rejects every environment except `sandbox`.
- Public-token exchange, encrypted Item/access-token custody, evidence retrieval, dated receipt persistence, removal confirmation, webhooks, dispute/revoke handling, schema, and RLS remain disabled.
- Therefore obtaining the Production secret is appropriate now; entering it as the active Werkles secret or setting `PLAID_ENV=production` is not yet safe.

Next engineering gate:

1. Build a production-capable server adapter that still fails closed by default.
2. Implement owner-bound encrypted Item custody and immediate removal/confirmation for the adopted one-shot policy.
3. Persist only the narrow dated claim/receipt, not raw balances, account numbers, transactions, amounts, bands, or reports.
4. Add webhooks, idempotency, expiry, revoke, dispute, deletion, and audit receipts.
5. Apply reviewed schema/RLS only after its separate approval.
6. Run Production with one consenting Operator-owned test identity and a bounded budget before member availability.

### 2. Stripe Billing — closest production-capable money path

Acquire/vault:

- least-privilege live restricted key where the SDK operations permit it, otherwise `STRIPE_SECRET_KEY`
- live `STRIPE_WEBHOOK_SECRET` for the exact Werkles endpoint
- live Foundry Dues monthly and annual price IDs

Current Werkles truth:

- Checkout, billing portal, signed webhook route, and membership state code exist.
- Test webhook setup is recorded complete.
- Live product creation was previously approved, but live product/price proof and private secret entry remain distinct gates.
- A success-page redirect never grants membership; the signed webhook must do so.

Next gate sequence:

1. Confirm/create exact live products and prices.
2. Configure the exact live webhook endpoint and events.
3. Store credentials privately.
4. Run one bounded live checkout/refund/cancel/portal test.
5. Enable member checkout only after the signed-event state transition and rollback proof pass.

### 3. Stripe Identity — use the Stripe account, but do not call a profile flag a receipt

Acquire/vault:

- covered by the Stripe live credential set

Current Werkles truth:

- Test Verification Session creation exists.
- The current durable state is insufficient for a production-grade scoped receipt lifecycle.

Before member activation:

- enable/approve the Identity application in Stripe;
- verify required Identity webhook events;
- persist purpose, provider reference, scoped result, timestamps, freshness, and revocation/redaction state;
- never retain ID or selfie files in Werkles.

### 4. Supabase — already provisioned; modernize and finish custody

Acquire/vault:

- project URL
- current publishable key for client use
- separate current secret key for server use

Current Werkles truth:

- Auth/project access exists.
- Owner-bound Intake and provider receipt schema/RLS are not fully implemented.
- The repo still names legacy anon/service-role variables; Supabase now recommends publishable/secret keys.

Before storing member/provider data:

- migrate environment names and clients without exposing the server secret;
- review Security Advisor findings;
- apply reviewed schema and least-privilege RLS under the SQL/RLS gate;
- prove cross-owner denial and deletion/export behavior.

### 5. Twilio Verify — create credentials/service now; integration comes next

Acquire/vault:

- production API Key SID and API Key Secret (preferred for production)
- Account SID where required for account scoping
- Verify Service SID

Current Werkles truth:

- A provider-neutral adapter foundation and synthetic practice exist.
- No send/check routes, rate limits, consent receipt, spend control, or persistence are connected.
- Current repo field names still assume Account SID/Auth Token; update to production API-key authentication before activation.

Before the first real SMS:

- implement consent, normalized phone custody, start/check routes, per-account/IP/number rate limits, resend cooldown, attempt ceilings, generic errors, deletion, and a hard spend cap;
- run only approved test destinations before member availability.

### 6. Checkr — staging/onboarding may begin; production checks remain policy-blocked

Acquire/vault when onboarding permits:

- staging secret API token
- staging webhook secret/configuration
- production credentials only after permissible-purpose and workflow approval

Do not create a candidate, order a report, or market a background badge until counsel approves notices, consent, disputes, pre-adverse/adverse action, retention, access, and the precise Werkles permissible purpose.

### 7. PostHog — do not obtain/activate a production key yet

Prerequisites:

- adopted event allowlist;
- no session replay by default;
- no wealth/sensitive inference;
- structural isolation from matching and Werkle records;
- accurate processor/cookie notice, consent where required, retention, access, and deletion controls.

### 8. Expo Push — do not activate yet

Prerequisites:

- an actual mobile/push client;
- revocable per-purpose member opt-in;
- token lifecycle and deletion;
- quiet hours and frequency controls;
- notification copy that never exposes sensitive Werkle details on a lock screen.

## Infrastructure that does not need another provider activation

- Next.js / React — code framework; no production key.
- Vercel — hosting project already exists; private environment changes remain a secret-entry gate.
- 1Password — custody already exists; credentials should land here first.

## Immediate queue

1. Plaid: retrieve and vault Production secret without changing `PLAID_ENV`.
2. Stripe: complete live products/prices and live webhook evidence, then vault the least-privilege live key.
3. Supabase: plan publishable/secret-key migration and finish owner-bound schema/RLS review.
4. Twilio: create the Verify service and production API key only after the existing phone-provider setup gate is approved; do not send SMS yet.
5. Checkr: begin account/staging onboarding only; retain production block.

## Human boundaries

Provider login/2FA, key reveal/create, secret entry, billing acceptance, account creation, SQL/RLS apply, live send/check/charge, and final enable/save remain Ben-controlled human gates. Mechanical navigation, field-name mapping, validation, and post-entry tests are Foreman work.
