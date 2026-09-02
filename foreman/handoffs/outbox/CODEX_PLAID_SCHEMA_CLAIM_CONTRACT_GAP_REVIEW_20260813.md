# Plaid schema review against the claim/evidence/receipt contract

Date: 2026-08-13

Author: Codex local worker (unnamed; not a CBCC seat)

Status: read-only schema preparation; **not an approval, migration, or active gate artifact**

## Scope and verdict

Reviewed:

- `foreman/plaid/PLAID_SCHEMA_DRAFT_V0.sql`
- `lib/plaid/types.ts`
- `lib/verification/claim-evidence-contract.ts`
- `lib/verification/claim-decision-engine.ts`
- `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md`

The Plaid draft should not be applied in its current form. It predates the narrow claim contract and stores a Plaid-specific proof badge rather than a subject/purpose/type/scope-bound claim with a canonical lifecycle. Its current RLS also exposes encrypted token custody columns to the owning browser and does not yet provide a safe, enforceable counterparty-read path.

The strongest design correction is to keep Plaid Item custody provider-specific while storing verification meaning in provider-neutral claim and event tables. A receipt should be assembled from one canonical append-only event stream instead of maintaining a second lifecycle that can diverge.

## Blocking schema and RLS gaps

| Severity | Current location | Gap | Required correction |
|---|---|---|---|
| Critical | SQL lines 10-47 | `plaid_items` grants owners `select` on the base row, which includes `access_token_ciphertext`, key ID, Plaid `item_id`, error codes, products, and provider metadata. Encryption at the application layer does not make browser disclosure acceptable. | Split token custody into a server-only table with no `authenticated` policy. Expose only a narrow owner connection-state view/RPC. Do not allow authenticated clients to select the token table, ciphertext, provider request IDs, or internal evidence references. |
| Critical | SQL lines 55-99 | A receipt is not bound to contract `claim_type`, `purpose`, `scope`, consent, provenance, or claim lifecycle. `provider_verified` is a broad badge and `threshold_met` can outlive the fact it describes. | Add provider-neutral claim storage and make the liquidity result the narrow claim `funds_threshold_observed`. Persist all four binding dimensions and explicit evaluation, observation, expiry, consent, and provenance. Remove `provider_verified` as an outcome. |
| Critical | SQL lines 55-99, 151-169 | There is no revocation, dispute, resolution disposition, or canonical event history. A copied receipt can remain apparently valid after revocation or dispute. | Use one append-only claim-event stream (`observed`, `disputed`, `dispute_resolved`, `revoked`). Only a resolution with `claim_restored` may restore the base evaluation; `claim_not_restored` remains inconclusive. Compute effective status at read time. |
| Critical | SQL lines 104-145 | Session receipt IDs are not constrained to the corresponding participant, purpose, type, or scope. A service bug could attach another user's receipt or a receipt for a different decision. | Replace the two loose receipt FKs with participant-bound share grants or enforce composite FKs/transactional validation covering subject, session participant, purpose, type, scope, freshness, and lifecycle. |
| Critical | SQL lines 151-169 | `liquidity_proof_disclosures` is only a log, but the planned counterparty RPC appears to treat session membership as authorization. The row does not prove the receipt belongs to `disclosed_by`, the recipient belongs to the session, or the grant is still live. | Separate authorization (`verification_share_grants`) from access audit (`verification_disclosure_accesses`). Validate grantor, grantee, claim binding, session, expiry, and revocation in one server transaction. Audit rows must not themselves authorize access. |
| High | SQL lines 40-47, 91-99, 135-145 | Admin `for all` policies create a large mutation surface, and no append-only rule protects claims, events, receipts, or disclosure audit. The safety of `public.is_admin()` is not established here. | Base verification and custody tables should be service-only by default. If admin access is necessary, use separately reviewed operations/RPCs. Confirm `is_admin()` security-definer behavior and fixed `search_path`. Deny client update/delete on evidence, event, and audit rows. |
| High | SQL lines 58, 76, 118-119, 153-154 | `on delete set null` and `on delete cascade` can silently sever provenance or erase disclosure history. `superseded_by` can form cycles and is a second lifecycle mechanism. | Use retained opaque evidence references and explicit retention states. Prefer `restrict` for immutable proof/audit relationships; where privacy deletion is required, anonymize the subject under a documented retention job. Remove `superseded_by` in favor of independent observations ordered by `observed_at`. |
| High | SQL lines 59-79 | Missing coherence checks allow null threshold with a boolean result, negative cents, expiry at/before observation, lowercase or non-ISO currency, future observation, and `created_at` before or after facts without semantics. | Add conditional and temporal checks: threshold required/nonnegative for a threshold claim; `expires_at > observed_at`; controlled uppercase currency; `recorded_at >= observed_at`; valid lifecycle chronology; disposition only on resolved disputes. |
| High | SQL lines 10-28, 175-178 | Consent is a single `consent_at` on an Item and lacks version, evidence reference, purpose, and scope. Profile `plaid_item_status` duplicates Item state and will drift (`active` versus `connected`; no `error`). | Store consent on the claim/operation with basis, captured time, version, and evidence reference (or documented not-required rationale). Derive profile summaries from source rows; do not persist a second mutable connection status. |
| High | SQL lines 18, 59-60; doctrine section 6 | `products` defaults to `assets`, while the current functional recommendation is minimum-data/ownership-first. `proof_kind = mutual` mixes evidence production with evidence sharing. | No product default in persistence; record the actual consented product set. Treat sharing/mutual exchange as session/grant context, never as an evidence kind. Add a distinct `bank_account_ownership_matched` prerequisite when required by policy. |
| High | SQL lines 73-75; types lines 41-45, 55-63 | Provider and sandbox environment are part of the counterparty-facing receipt. This leaks implementation details and makes a sandbox artifact look structurally shareable. | Keep provider/env/request IDs in restricted provenance. Production sharing must reject non-production evidence. Public output should state the narrow claim, result, scope, observation, expiry, and limitations—not provider internals. |
| Medium | SQL lines 63-68; doctrine section 4 | The band reveals more financial information than a yes/no threshold decision, while the threshold and band can disagree. Multiple currencies and included accounts are unspecified. | Decide whether V0 needs a band at all. Prefer threshold-only disclosure. Encode scope as a server-defined policy key identifying threshold, currency treatment, account inclusion, and method version; do not accept arbitrary labels. |
| Medium | SQL lines 104-124 | Session status is freely writable by service code without allowed-transition constraints or transition history. Expiration does not itself prevent a stale receipt read. | Add append-only session transitions or a guarded transition function. Authorization reads must check current time, session/grant state, and effective claim status in the same transaction. |
| Medium | SQL line 28 | Uniqueness is `(user_id, item_id)`, allowing the same provider Item to be assigned to multiple users by a faulty write. | Enforce a provider/environment Item uniqueness rule appropriate to Plaid custody, and bind creation to authenticated server-side ownership. Preserve relink history rather than reassigning Items. |

## Proposed target tables and columns

Names are proposals, not migration instructions.

### 1. Provider custody boundary

`provider_connections`

- `id uuid primary key`
- `subject_user_id uuid not null`
- `provider text not null`
- `provider_environment text not null`
- `provider_item_ref text not null`
- `connection_status text not null`
- `consented_products text[] not null` with no default
- `connected_at`, `last_successful_refresh_at`, `revoked_at`, `revocation_reason`
- unique `(provider, provider_environment, provider_item_ref)`

`provider_connection_secrets` (server-only)

- `connection_id uuid primary key`
- `access_token_ciphertext text not null`
- `encryption_key_id text not null`
- `rotated_at timestamptz`

No `authenticated` policy on the secrets table. The owner projection should expose only connection ID, coarse connection state, connected time, and whether reauthentication is required.

### 2. Provider-neutral claims

`verification_claims`

- `id uuid primary key`
- `subject_user_id uuid not null`
- `claim_type text not null` constrained to the contract taxonomy
- `purpose text not null` constrained to the contract taxonomy
- `scope_key text not null` referencing a server-controlled scope definition
- `evaluation text not null` in `pending`, `satisfied`, `not_satisfied`, `inconclusive`
- consent: `consent_basis`, `consent_captured_at`, `consent_version`, `consent_evidence_ref`, `consent_rationale` with conditional checks
- provenance: `source_kind`, `source_id`, `evidence_method`, `evidence_ref`; all provider internals restricted
- `observed_at timestamptz not null`
- `expires_at timestamptz not null check (expires_at > observed_at)`
- `recorded_at timestamptz not null check (recorded_at >= observed_at)`
- optional provider connection FK for custody trace, not claim meaning
- binding index `(subject_user_id, purpose, claim_type, scope_key, observed_at desc, id)`

For liquidity V0, use `claim_type = 'funds_threshold_observed'`. The scope definition should carry the threshold, currency policy, included-account rule, and method version. If account ownership must be established, create a separate `bank_account_ownership_matched` claim; do not overload the funds claim.

### 3. One canonical lifecycle stream

`verification_claim_events`

- `claim_id uuid not null`
- `sequence bigint not null`
- `event_kind text not null`
- `occurred_at timestamptz not null`
- conditional fields: `evaluation`, `evidence_ref`, `reason`, `dispute_ref`, `resolution_ref`, `resolution_disposition`
- primary key `(claim_id, sequence)`
- exactly one first `observed` event
- append-only; no authenticated insert/update/delete
- event chronology enforced transactionally
- after `revoked`, no later event
- `dispute_resolved` requires an open dispute
- only `claim_restored` resumes base evaluation; `claim_not_restored` remains inconclusive

The receipt API should project this event stream. Do not store a second JSON event list or a separate `superseded_by` lifecycle that must be reconciled.

`verification_receipts`

- `id uuid primary key`
- `claim_id uuid not null unique`
- immutable copies of `subject_user_id`, `purpose`, `claim_type`, `scope_key` protected by a composite FK or created only through a checked function
- `recorded_at timestamptz not null`

If the receipt is only a projection and needs no independent issuance identity, omit this table and return a projection keyed by claim ID.

### 4. Sharing authorization and access audit

`verification_share_grants`

- `id uuid primary key`
- `claim_id uuid not null`
- `grantor_user_id`, `grantee_user_id` (distinct)
- `session_id uuid`
- immutable `purpose`, `claim_type`, `scope_key`
- `granted_at`, `expires_at`, `revoked_at`, `revocation_reason`
- unique active grant for claim/grantee/session as appropriate

`verification_disclosure_accesses`

- append-only `grant_id`, `viewer_user_id`, `accessed_at`
- optional request/correlation ID
- no cascade deletion from claim or session

The read function must validate `auth.uid()`, grant recipient, grant/session time and state, and the claim's effective status before returning a minimal projection. It should use a fixed `search_path`, revoke default execute privileges, grant only the intended role, and never return evidence refs, connection IDs, request IDs, institution data, bands unless explicitly approved, or provider environment.

## Required TypeScript changes before implementation

`lib/plaid/types.ts` is a parallel truth system and should become a thin adapter over the generic verification contract.

1. Replace the free-standing `LiquidityProofReceipt` outcome with a specialization of `VerificationClaim` where `type` is `funds_threshold_observed`; pair it with the canonical `VerificationReceipt` projection.
2. Import the generic purpose/type/evaluation/status unions rather than duplicating them.
3. Treat PostgreSQL `bigint` cents as a decimal string or validated `bigint`, not JavaScript `number`.
4. Remove `provider_verified`. Provenance states what source and method produced evidence; evaluation states what the narrow claim concluded.
5. Remove `provider` and `providerEnv` from `LiquidityProofReceiptPublic`; sandbox evidence must be rejected before a public projection exists.
6. Replace arbitrary `string[] falsifiers` with a controlled limitations taxonomy plus safe copy mapping. Arbitrary strings are an injection and accidental-data-disclosure surface.
7. Replace `isReceiptFresh(expiresAt)` with the decision engine. Freshness alone ignores subject/purpose/type/scope mismatch, dispute, revocation, invalid claims, and inconclusive results.
8. Replace caller-supplied `thresholdLabel` with a label derived from a reviewed `scope_key`. Do not let display text define or alter evidence scope.
9. Remove a universal 30-day TTL constant. TTL belongs to the scope/method policy and must be encoded into each claim's actual `observedAt`/`expiresAt`.
10. Make `toPublicReceipt` accept an already-authorized share grant plus an effective decision, not a raw private receipt. It should be impossible to call the formatter as an authorization bypass.

## RLS and security proof checklist

The security/architecture review needs concrete proof of:

- no browser role can select token ciphertext or restricted provenance;
- base-table grants and every policy enumerated, including `anon`, `authenticated`, and default `public` function execution;
- owner access and counterparty access use different minimal projections;
- IDOR tests for another subject's connection, claim, receipt, session, and grant;
- a session participant cannot substitute a receipt belonging to another subject or binding;
- a grant cannot reveal a claim after expiry, dispute, revocation, session closure, or grant revocation;
- sandbox evidence cannot cross the production-sharing boundary;
- security-definer functions use fixed `search_path`, explicit qualification, checked caller identity, and narrow return columns;
- append-only enforcement for evidence events and disclosure access logs;
- retention/deletion behavior preserves required audit without retaining provider payloads or credentials longer than necessary;
- race tests cover revoke/dispute concurrent with a counterparty read.

## Adversarial abuse cases to test

The hostile-trust review should attack:

- ciphertext and internal-reference disclosure through owner selects, error payloads, logs, or RPC return types;
- receipt replay in a new session, for a new counterparty, or under a different purpose/scope;
- a newer revoked/disputed claim being bypassed by selecting an older satisfied receipt;
- threshold/band inconsistency, omitted accounts, currency conversion ambiguity, and a balance changed immediately after observation;
- attaching one participant's receipt to the other participant slot;
- self-share, collusive mutual sessions, repeated paid refreshes, and payment amount influencing evidence strength;
- disclosure-log forgery being treated as authorization;
- future timestamps, equal expiry/observation, invalid enums, null threshold with `threshold_met = true`, and event reordering;
- duplicate webhooks, out-of-order webhooks, replayed provider request IDs, and Item reassignment;
- arbitrary `falsifiers` or `thresholdLabel` leaking PII or creating misleading claims.

## Product/implementation decisions needed

The integration and UX review needs answers before migration code is drafted:

1. Is V0 disclosure threshold-only, or is a liquidity band truly necessary? Minimum-data posture favors threshold-only.
2. What exact sentence describes `funds_threshold_observed` without implying net worth, creditworthiness, investment capacity, or ongoing solvency?
3. Which accounts and currencies are included, how is conversion handled, and how is that scope communicated?
4. Is `bank_account_ownership_matched` required before a funds claim can satisfy policy?
5. What are the explicit UI states for pending, not satisfied/missing, expired, disputed, revoked, inconclusive, and satisfied? “Connected” must never mean “proof satisfied.”
6. What manual-review and dispute path exists, and what does the counterparty see while a dispute is open or not restored?
7. What TTL applies to each method/scope, and what event requires a fresh observation?
8. Does a share grant reveal only the yes/no threshold result, observation time, expiry, scope statement, and limitations? Provider/env and institution identity should remain private.
9. How are provider failure and user cancellation distinguished from a negative claim?
10. How does the paid refresh flow make clear that payment purchases processing, never a favorable result or stronger trust badge?

## Recommended next drafting order

1. Freeze the current SQL as historical draft; do not patch it incrementally into production shape.
2. Decide the scope registry and minimal counterparty projection.
3. Draft provider-neutral claim/event/grant tables and their invariants.
4. Draft the provider custody split and server-only token policies.
5. Draft owner and grantee read functions plus RLS proofs.
6. Update `lib/plaid/types.ts` as a thin adapter and add runtime boundary validation.
7. Run architecture/security, adversarial, and UX/integration reviews on the new draft before creating any migration or gate artifact.

Hard stops preserved: no SQL or types edited; no migration, schema apply, provider call, credential handling, active gate artifact, staging, commit, push, or deploy.
