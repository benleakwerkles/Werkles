# Architecture decision: shared evidence/review bundle for funds proof

Date: 2026-08-14

Author: Codex local worker (unnamed; not a CBCC seat)

Status: design recommendation for review; **not an approval, migration, or active gate artifact**

## Decision to make

The funds-proof policy requires two independently evaluated claims for the same subject and purpose:

1. `bank_account_ownership_matched`
2. `funds_threshold_observed`

Exact subject, purpose, claim type, and reviewed scope binding prevents obvious substitution. It does not prove that the two selected claims were assembled in the same evidence/review transaction. Without another binding, a caller could combine an older ownership claim from one connection or review with a threshold claim from another and still satisfy both component requirements.

The architecture therefore needs to decide whether the pair remains loosely composed, shares an immutable evidence bundle, or becomes one composite claim.

## Options

### Option 1 — Keep independent claims with policy-only binding

The evaluator continues to select the newest exact match for each claim type using subject, purpose, and reviewed scope keys.

Advantages:

- no new contract or persistence object;
- claims retain fully independent lifecycles;
- simplest implementation and migration.

Costs and risks:

- permits cross-session claim mixing;
- cannot prove which ownership observation supported which threshold observation;
- old ownership evidence may be paired with a fresh threshold result without an explicit review decision;
- replay and race analysis must infer relationships from timestamps;
- share grants cannot name one stable evidence unit.

This is acceptable only if policy explicitly allows arbitrary independent observations within a documented time window. It is too weak as the default for a shareable funds proof.

### Option 2 — Bind both claims to one immutable evidence/review bundle

Create a provider-neutral bundle that records the subject, purpose, reviewed policy/scope version, membership of the two claims, and an append-only bundle lifecycle. The bundle represents a Werkles evidence assembly and review boundary. It does not imply that both claims came from one provider request; ownership and threshold evidence may have different sources while still being deliberately assembled under one policy review.

Advantages:

- prevents cross-session and cross-connection mixing;
- preserves both component decisions, reasons, expiries, disputes, and revocations;
- gives share grants and audit logs one immutable object to name;
- supports an explicit observation-skew rule when ownership and threshold evidence have different valid lifetimes;
- remains provider-neutral and works if providers change.

Costs:

- adds bundle lifecycle, membership constraints, and transactional sealing;
- requires deterministic rules for selecting or naming a bundle;
- introduces a second aggregate whose lifecycle must not override individual claim truth.

### Option 3 — Replace the pair with one composite funds-proof claim

Store a single claim such as `funds_proof_satisfied`, with ownership and threshold treated as internal evidence.

Advantages:

- simplest public result and sharing model;
- one claim and one lifecycle.

Costs and risks:

- recreates a broad badge rather than two narrow claims;
- loses exact component outcomes and reasons;
- makes an ownership dispute indistinguishable from threshold expiry;
- encourages provider-specific logic inside one opaque result;
- conflicts with the current fail-closed two-claim contract.

This option should be rejected.

## Recommendation

Choose **Option 2: one immutable evidence/review bundle containing two narrow claims**.

The bundle must be a binding and audit boundary, not a new trust outcome. It may be `open`, `sealed`, or `revoked`; it must never carry `verified`, `safe`, or an independent favorable evaluation. The overall decision remains a pure reduction of the two current component decisions:

- satisfied only when the bundle is sealed and both exact component decisions are satisfied;
- fail closed when the bundle is missing, open, invalid, revoked, or mismatched;
- fail closed when either component is missing, expired/stale, disputed, revoked, inconclusive, pending, or not satisfied;
- retain each component's exact classification and reason.

The bundle is new for each evidence assembly. New evidence does not mutate or “refresh” an old sealed bundle.

## Contract implications

### Proposed provider-neutral types

```ts
type EvidenceBundleState = "open" | "sealed" | "revoked";

type FundsEvidenceBundle = {
  id: string;
  subjectId: string;
  purpose: VerificationPurpose;
  policyId: string;
  scopeReviewRef: string;
  state: EvidenceBundleState;
  createdAt: string;
  sealedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  claimBindings: {
    bankAccountOwnershipClaimId: string;
    fundsThresholdClaimId: string;
  };
};
```

The concrete contract may use a membership array instead of named fields, but runtime validation must still require exactly one claim for each required role.

### Required evaluator behavior

The policy requirement should add either an exact `evidenceBundleId` or an already-authorized bundle object. It should not silently compose claims across all bundles.

For a valid decision, runtime checks must prove:

1. bundle ID, subject, purpose, policy ID, and scope-review reference are nonblank and exact;
2. state is `sealed` at the evaluation instant;
3. bundle is not revoked;
4. exactly two required memberships exist and no duplicate role is present;
5. each membership resolves to the claimed immutable claim ID;
6. both claims have the bundle subject and purpose;
7. ownership claim type and scope exactly match the reviewed ownership requirement;
8. threshold claim type and scope exactly match the reviewed threshold requirement;
9. component decisions are evaluated at one supplied instant;
10. the policy's maximum allowed observation skew is satisfied;
11. no global outcome is emitted beyond `satisfied` or `fail_closed`;
12. output retains the full component decisions and a separate bundle failure reason when applicable.

Do not choose “latest claims” independently. If a workflow needs the latest bundle, select among complete sealed bundles using a reviewed rule such as `sealedAt DESC, id ASC`, then evaluate only that bundle. A share session or grant should name the exact bundle ID.

### Observation skew

Ownership and threshold evidence need not be observed at the same instant. The reviewed policy should declare `maxObservationSkewSeconds`. A bundle outside that window fails closed even if both component claims remain individually unexpired.

This policy must reflect product semantics. A fresh threshold observation paired with months-old ownership evidence may not be acceptable merely because the older claim has not reached its expiry.

### Lifecycle rule

Individual claim lifecycle remains canonical for claim truth. Bundle events govern only membership integrity and sealing:

- `bundle_created`
- `claim_attached`
- `bundle_sealed`
- `bundle_revoked`

After sealing, membership, subject, purpose, policy, and scope-review reference are immutable. A component dispute or revocation is not copied into bundle state; the evaluator reads the component's effective status and fails closed. Revoke the bundle only for aggregate integrity failures such as incorrect membership, compromised assembly, or invalid policy binding.

## Schema implications

Names below are design proposals, not migration instructions.

### `verification_evidence_bundles`

- `id uuid primary key`
- `subject_user_id uuid not null`
- `purpose text not null`
- `policy_id text not null`
- `scope_review_ref text not null`
- `state text not null check (state in ('open','sealed','revoked'))`
- `created_at timestamptz not null`
- `sealed_at timestamptz`
- `revoked_at timestamptz`
- `revocation_reason text`
- checks enforcing state/timestamp coherence
- index on `(subject_user_id, purpose, policy_id, scope_review_ref, sealed_at desc, id)`

### `verification_evidence_bundle_claims`

- `bundle_id uuid not null`
- `claim_id uuid not null`
- `claim_role text not null check (claim_role in ('bank_account_ownership','funds_threshold'))`
- `attached_at timestamptz not null`
- primary key `(bundle_id, claim_role)`
- unique `(bundle_id, claim_id)`
- preferably unique `claim_id` if a claim may belong to only one funds bundle

Cross-table subject, purpose, claim type, and scope checks cannot safely be left to application convention. Seal through one reviewed server transaction/function that locks the bundle and claims, validates every binding, inserts the seal event, and makes membership immutable.

### `verification_evidence_bundle_events`

- `bundle_id uuid not null`
- `sequence bigint not null`
- `event_kind text not null`
- `occurred_at timestamptz not null`
- conditional `claim_id`, `claim_role`, `reason`
- primary key `(bundle_id, sequence)`
- append-only

Use events as the canonical lifecycle or ensure a derived bundle snapshot is transactionally reconciled with them. Do not permit an independently mutable snapshot and event history.

### Share grants

`verification_share_grants` should bind the exact `bundle_id`, grantee, purpose, policy ID, and scope-review reference. A grant must not authorize “any current funds claim” for the subject. Counterparty reads re-evaluate the named bundle and both claims at read time; a copied favorable result cannot bypass later dispute, expiry, or revocation.

## RLS and server-boundary implications

- Base bundle, membership, claim, and event tables should be service-only; no direct browser mutation.
- Owner and counterparty surfaces receive separate minimal projections.
- Owner projection may show bundle state and component states, but not internal evidence references or provider request identifiers.
- Counterparty projection requires an active grant naming the exact bundle and returns only the reviewed scope statement, component classifications safe for disclosure, observation/expiry times, and limitations.
- A security-definer read function must use a fixed `search_path`, explicitly validate `auth.uid()`, grantee, grant state, bundle state, claim bindings, component status, and current time in one transaction.
- Default/public function execution must be revoked and granted only to the intended role.
- `bundle_id` knowledge alone never authorizes access.
- Bundle events and access audit must be append-only.
- Service-role bypass means RLS alone is insufficient: sealing and grant creation need explicit transactional invariants.
- Do not place provider tokens, request IDs, account identifiers, exact balances, or institution data in the bundle.

## Attack plan

The adversarial review should attempt all of the following:

1. combine ownership and threshold claims from different bundle IDs;
2. attach a claim belonging to another subject;
3. attach a claim with the right subject but wrong purpose;
4. substitute a cheaper or weaker threshold scope;
5. use two ownership claims or two threshold claims while satisfying the row count;
6. attach a claim after bundle sealing;
7. change bundle subject, purpose, policy, or review reference after sealing;
8. reuse one claim in multiple bundles when policy forbids it;
9. pair a fresh threshold with ownership outside the allowed observation skew;
10. select an older satisfied bundle after a newer bundle is disputed, revoked, or inconclusive;
11. race sealing against claim dispute/revocation;
12. race counterparty read against bundle or grant revocation;
13. replay an attach or seal event and exploit duplicate/out-of-order webhooks;
14. enumerate bundle IDs or use another participant's share grant;
15. attach sandbox evidence to a production-shareable bundle;
16. use a bundle disclosure snapshot after a component expires;
17. inject arbitrary policy/scope strings that were never reviewed;
18. treat payment completion or repeated paid refreshes as stronger evidence;
19. leak evidence/provider references through owner output, counterparty output, errors, or logs;
20. create a partial bundle and cause UI or matching code to interpret `open` as satisfied.

## Review questions by seat need

These are requests for actual independent reviews; this packet does not stand in for them.

### Thufir / Locke — architecture and trust boundary

- Is bundle membership immutable and transactionally sealed?
- Is there one canonical lifecycle rather than competing snapshot/event truth?
- Can any service path bypass subject/purpose/type/scope/review binding?
- Are RLS, function grants, fixed search paths, retention, and audit locality explicit?
- Does bundle revocation remain distinct from component dispute/revocation?

### Bean — hostile trust attack

- Can unrelated but individually satisfied claims be spliced together?
- Can old or weaker-scope evidence be replayed into a new share session?
- Are race conditions fail closed at seal and read time?
- Can payment, collusion, provider errors, or partial bundles create a favorable halo?
- Can errors or projections leak financial or provider metadata?

### Lady Jessica / Doozer — product and implementation integration

- What user-visible phrase describes the bundle without creating a global “verified” badge?
- Which component states and limitations are shown to the member and counterparty?
- What exact observation skew and expiry policy is understandable to users?
- Does a refresh create a new bundle rather than silently mutating old proof?
- Can the implementation keep open, incomplete, expired, disputed, revoked, and inconclusive states visually and functionally distinct?

## Acceptance criteria for a future implementation

- two narrow claims, one explicit immutable bundle;
- same subject, purpose, policy, and reviewed scope mapping;
- exactly one required role per component;
- reviewed observation-skew rule;
- sealed bundle required;
- claim and bundle lifecycle evaluated at one instant;
- all non-satisfied component or bundle states fail closed;
- exact component outcomes/reasons retained;
- share grant names the exact bundle;
- no public provider internals or broad trust badge;
- executable mix, replay, race, and IDOR tests;
- independent architecture/security, hostile-trust, and UX/integration review before any schema or gate artifact.

Hard stops preserved: no code, SQL, schema, types, provider state, credentials, active gate artifact, staging, commit, push, or deploy changed by this packet.

## Independent attack addendum — required before implementation

The Option 2 direction survived review, but this packet is **not implementation-ready**. A later contract/schema decision must close all nine issues below:

1. **Newest-bundle laundering:** never filter to sealed/satisfied bundles and fall back to an older favorable result when a newer assembly is open, failed, disputed, or revoked. Select one newest lineage assembly across all states, then evaluate it fail closed. Exact grants still name an exact bundle.
2. **Equal-time tie laundering:** do not use bundle ID as the favorable-truth tie-breaker. Use a server-owned monotonic sequence or fail closed when newest ordering is ambiguous.
3. **Mutable-claim replay:** binding claim IDs is insufficient unless claim content is immutable or content-digested/versioned. A referenced claim's subject, purpose, type, scope, or original evaluation cannot remain silently editable after sealing.
4. **Seal/event race:** bundle sealing must serialize against claim dispute and revocation writers using one lock/version discipline or a reviewed serializable retry rule.
5. **One lifecycle canon:** choose the append-only event stream or a rigorously derived snapshot as canonical; do not leave both independently authoritative. Evaluation must reconstruct whether the bundle was sealed and unrevoked at the supplied instant.
6. **Approved policy binding:** `policy_id` and `scope_review_ref` must bind to an immutable approved registry/version digest, not caller-supplied reviewed-looking strings.
7. **Evidence trust domain:** add a provider-neutral evidence class/environment bound by policy so sandbox evidence cannot enter a production-shareable bundle.
8. **Command replay:** add unique command/idempotency IDs plus expected-state/version checks; `(bundle_id, sequence)` alone does not stop the same command replayed under a new sequence.
9. **Grant lifecycle and roles:** decide grant state, expiry, revocation, exact function ownership, and role grants. Knowledge of `bundle_id` alone never authorizes a read.

These are design blockers, not permission to create a migration. The actual architecture/security, hostile-trust, and product reviews remain required before implementation.
