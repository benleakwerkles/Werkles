# Werkles provider sequence — current build order

Date: 2026-08-21
Scope: current canonical repository truth; no runtime secrets inspected

## 1. Plaid production onboarding

Why first: the Plaid business-verification workflow is open now and the narrow Backer-lane use case is decided.

Current: sandbox Link-token demonstration; no production Item exchange, encrypted custody, receipts, revocation, webhooks, or durable owner-bound persistence.

Next: complete truthful business onboarding; confirm Assets versus Balance; obtain credentials without exposing them; keep production product behavior disabled until the security/privacy implementation gate passes.

## 2. Stripe Billing, then Stripe Identity

Why next: checkout, billing portal, signed webhook, and Identity test paths already exist. Stripe unlocks paid membership before optional verification purchases.

Current: test paths present; live product creation, live price IDs, live secrets, and live checkout remain separate gates. Identity currently lacks durable operation/receipt persistence.

Next: prove test checkout → signed webhook → membership state end to end; then configure live products/prices and secrets; only then enable live checkout. Keep Identity results narrow and provider-hosted.

## 3. Supabase Auth and owner-bound Postgres custody

Why now: payments and provider checks are not useful if the signed-in member cannot reliably recover Intake, Workshop, recommendations, receipts, consent, and verification state.

Current: Auth test path exists; SSR/member-session continuity is incomplete on some Intake surfaces. Database foundations exist, but member Intake and provider claim/event/grant RLS are not sealed.

Next: finish server-readable session continuity; define owner-bound rows; enable and test RLS on every exposed table; keep service-role credentials server-only; prove refresh/navigation/cross-device custody before making account-save claims.

## 4. Twilio Verify

Why after account custody: phone verification needs an owner-bound account, consent, abuse limits, cost controls, and an expiring result.

Current: adapter foundation and ghost walkthrough only; no routes, credentials, rate limits, persistence, or provider service.

Next: create a Verify service, establish send/check routes, rate and retry limits, consent copy, spend ceiling, webhook/event handling, and result expiry. Phone possession is not legal identity.

## 5. Supabase Storage

Why later: Workshop files add a new private-data surface and are not required to prove the first paid member loop.

Current: not connected.

Next: private bucket design, owner/room access policies, signed access, file-type/size limits, retention, deletion, malware handling, and restore behavior.

## 6. Transactional email provider — not selected

Why needed: account notices, consent receipts, billing notices, provider-status changes, and security alerts need reliable delivery independent of browser state.

Current: no production email provider or delivery adapter is present in the canonical dependency/runtime inventory.

Next: select one provider only after message categories, sender domains, suppression, retention, webhook verification, and unsubscribe/security-notice rules are written.

## 7. Observability and abuse protection — not selected

Why needed: production financial/identity workflows require error visibility, secret-safe logs, rate limiting, incident evidence, and bot/abuse controls.

Current: no production observability, WAF/bot, vulnerability-scanning, or incident-response provider is established by repository evidence.

Next: choose minimum viable error monitoring and rate/abuse controls; prohibit raw financial, identity, verification-code, secret, or provider payload data from logs.

## 8. Checkr — policy blocked

Why last: background screening has the largest consent, permissible-purpose, dispute, adverse-action, and retention burden and is not needed for the initial Werkles loop.

Current: adapter foundation only; no routes or production workflow.

Next: qualified legal review and provider approval before any candidate, report, or paid background-check action.
