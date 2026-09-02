# Werkles Tech-Stack Activation Map — Broad Rotation M9

Date: 2026-08-23  
Status: `LOCAL_ARCHITECTURE_PROOF__NO_PROVIDER_ACTIVATION`  
Source: `lib/integrations/tech-stack-activation-plan.ts`

## The approach

Werkles is not integrating providers one logo at a time. Broad rotations are
building complete member-value slices in dependency order. Each slice must
connect the member action, server authority, smallest useful receipt, expiry or
deletion, return path, and failure language before activation is considered.

| Wave | Member result | Systems | Exit proof | Closed gate |
|---|---|---|---|---|
| 1. Remember the member | One signed-in person can leave and return to their own Intake, recommendations, Match Deck, Formation work, and Personal Bellows without another account seeing it. | Supabase Auth, Postgres, Storage | Owner-bound read/write plus hostile second-account isolation. | Schema, RLS, storage policy, production auth. |
| 2. Record membership | Billing state changes only from verified Stripe events; payment never becomes a trust signal. | Stripe Billing | Test checkout, signed webhook, membership update, portal, cancellation, and replay handling. | Secrets, live prices/charges, paid checkout go-live. |
| 3. Answer one narrow question | A member may choose a dated identity, phone-possession, or minimum-funds observation when it would change a real decision. | Stripe Identity, Twilio Verify, Plaid | Separate test/sandbox start, result, minimal receipt, expiry, revoke, deletion, and failure proof for each provider. | Live checks/messages, provider spend, production Plaid, raw evidence retention. |
| 4. Screen only for an approved purpose | A role-specific background process, never a universal “safe” badge. | Checkr | Approved purpose, consent, notice, review, dispute, adverse-action, and deletion workflow before adapter wiring. | Counsel/provider approval and all real screening. |

## Current honest state

| System | What exists locally | What is still missing |
|---|---|---|
| Supabase Auth | Browser/server modules and login/signup paths. | One server-readable session across every member surface and cross-account isolation proof. |
| Supabase Postgres | Server foundation and some owner-bound custody code. | Reviewed Intake/profile/provider schema, RLS, retention, and full route continuity. |
| Supabase Storage | Planned ownership and disposal boundary only. | Bucket, adapter, upload/download routes, room grants, size limits, policy, deletion. |
| Stripe Billing | Checkout, portal, and webhook code paths; historical test proof exists. | Fresh end-to-end test replay on this candidate, private configuration, and later live-money approval. |
| Stripe Identity | Route and provider-adapter contract. | Durable scoped operation/receipt storage, expiry/redaction, webhook replay proof; current profile-flag behavior must not be treated as the finished model. |
| Plaid | Sandbox access, Link/token scaffolding, exchange route, privacy policy model, and adapter contract. | Server credential custody, final product selection, one-shot threshold proof, encrypted transient custody, removal confirmation, receipts, webhooks, schema/RLS. Production access remains under review. |
| Twilio Verify | Server adapter contract and synthetic member exercise. | Account/configuration, consent, phone routes, abuse/rate controls, spend boundary, persistence, expiry, deletion. |
| Checkr | Architectural slot and policy boundary. | The entire approved legal workflow and provider connection; intentionally blocked. |

Supporting infrastructure is treated separately: Next.js/React and Vercel run
the application; 1Password holds operator secrets; PostHog analytics and Expo
Push are not adopted. Those systems do not create member trust evidence.

## Drift found in this pull

The existing Crucible member-stage list places Stripe Billing beside account
creation and shows saved records afterward, while the activation roadmap puts
owner-bound custody before billing. That is an information-architecture
contradiction, not permission to change the member page immediately. It is in
the M9 CBCC packet for review.

Readiness also uses several different vocabularies (`test_path_present`,
`sandbox_demo`, `foundation_only`, `not_live_yet`, `planned`). The underlying
facts are mostly compatible, but the labels can drift. M9 now binds the build
order to one canonical source and tests complete provider coverage.

## Executable contract

`scripts/foreman/tech-stack-activation-plan-smoke.ts` proves:

- all eight product-provider slots appear exactly once;
- account custody is Wave 1, billing Wave 2, narrow checks Wave 3, and Checkr
  Wave 4;
- each non-blocked slot points to an existing composition module;
- every slot has a minimum-data and disposal boundary;
- every production-live claim remains false;
- each wave names an executable next proof and a stopping boundary.

No credential, provider, schema/RLS, production, spend, push, or deploy action
was taken to create this map.
