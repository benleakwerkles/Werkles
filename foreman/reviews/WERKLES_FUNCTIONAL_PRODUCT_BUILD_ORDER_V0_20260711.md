# Werkles Functional Product Build Order V0

Status: `WORKING ROADMAP`  
Audience: Ben, Heimerdinker, Lady Jessica, Medullina mobile builder

## The rule

Build one trustworthy loop end to end before expanding the platform:

`person signs in -> supplies evidence -> Werkles understands need -> recommends a path -> human accepts/rejects -> outcome is recorded -> evidence improves the next recommendation`

A feature is not complete because a screen exists. It is complete when data custody, permissions, failure behavior, user-visible proof, automated tests, and operator recovery all work.

## Current work

The active lane is Matching infrastructure. The engine, file-mode custody, operator shadow view, durable Supabase adapter, semantic smoke cases, and preview rollout plan exist. The next gated step is durable preview storage and proof; public autonomous Matching and LLM translation remain off.

## Proper work order

### 1. Product spine and safety

- One canonical identity per person or organization
- Authentication, roles, consent, audit trail, export, deletion, and recovery
- Shared vocabulary for person, organization, evidence, skill, need, offer, match, introduction, transaction, and outcome
- Preview/staging/production separation and rollback receipts

Exit proof: a test member can join, control their data, and be removed without orphaned personal data.

### 2. Evidence and verification

- Start with user claims plus provenance: who asserted what, when, and from which source
- Add verification adapters separately: identity, employment, credentials, bank/account ownership, work samples, references
- Store raw sensitive evidence minimally; store verification results and provenance where possible
- Never turn a vendor response into absolute truth. Record assurance level, freshness, scope, and failure state

Exit proof: every displayed badge or claim can answer “proved by what, when, at what confidence, and can it be revoked?”

### 3. Matching loop

- Structured intake and evidence-backed profiles
- Deterministic shadow recommendations first
- Not-match and uncertainty paths
- Human review, accept/reject/modify feedback, and outcome capture
- Durable storage, privacy policy, replayable test fixtures, and fairness/quality review

Exit proof: golden cases produce expected paths, failures are visible, and real outcomes can be traced back to inputs and engine version.

### 4. Membership and company hosting

- Define exactly what Werkles hosts: profile, company workspace, records, collaboration, introductions, and billing
- Organization creation, invitations, roles, ownership transfer, suspension, export, deletion
- Stripe test lifecycle before live money: checkout, webhook, renewal, failure, cancellation, refund, reconciliation

Exit proof: a ghost company can form its workspace, invite members, change roles, pay in test mode, cancel, export, and close cleanly.

### 5. Learning, training, and skill proof

- Learning path -> task -> submitted artifact -> rubric -> reviewer/verifier -> credential
- Skills should be evidence bundles, not self-declared tags
- Connect training outcomes back to Matching without letting course completion alone equal competence

Exit proof: a test learner completes a task, receives a reviewable credential, and the match engine can explain how that evidence affected a recommendation.

### 6. Capital and financial connections

- Separate identity/account ownership, financial health signals, funding eligibility, introductions, and actual transactions
- Plaid should be permissioned, purpose-limited evidence—not a universal financial truth source
- Add explicit consent, token lifecycle, revocation, error recovery, and data-minimization tests before real accounts

Exit proof: sandbox users can connect, revoke, reconnect, and see exactly which financial facts Werkles derived and why.

### 7. Networks and distribution

- Model relationships with roles, permissions, provenance, strength, and expiration
- Distinguish personal, business, supply, talent, capital, and distribution networks
- Measure useful outcomes, not connection counts

Exit proof: a recommendation can explain which permitted network edge helped, without exposing unrelated private relationships.

### 8. Scale infrastructure only when earned

- Supabase/Postgres is the system of record now
- Chokidar is useful for local machine/workspace packet observation; it is not a production event bus
- Add Redis when measured needs appear: shared cache, rate limiting, short-lived coordination, queues, or distributed locks
- Add MQTT when Werkles truly has device/edge clients needing lightweight pub/sub and intermittent connectivity
- For ordinary app events, prefer durable database events/outbox plus a worker before introducing multiple messaging systems

Exit proof: load and failure tests demonstrate the bottleneck that each new component solves, plus monitoring and recovery for that component.

## How ghost testers work

Ghost testers are synthetic people, companies, and failure scenarios. They should never silently mingle with production members.

Each major workflow needs:

- a happy-path ghost
- incomplete/ambiguous evidence
- duplicate identity or organization
- unauthorized access attempt
- vendor timeout/failure
- payment failure/cancellation where relevant
- deletion/export request
- retry/idempotency case

Ghosts run locally and in preview. Their expected outcomes are versioned fixtures. A smoke receipt proves the workflow ran; semantic assertions prove it did the right thing; screenshots help humans inspect what automation misses.

## What Ben can test

For every visible increment, Ben should receive a URL and a short test card containing:

1. Who to pretend to be
2. What to enter or click
3. What should happen
4. What must not happen
5. Where the proof/receipt appears
6. How to report “expected / observed / screenshot / severity”

Current Matching test: use Bellows intake with a capital-plus-partner need, a job-change need, and a training-gap need; then inspect `/operator/matching/shadow`. Confirm the recommendation is understandable, uncertainty is honest, and no result is presented publicly or as an autonomous decision.

## V, P, G with Lady Jessica

- **V:** create descriptively named mission packets for Heimerdinker and Lady Jessica and state the user-visible outcome.
- **P:** read them back from the canonical repo and report what is about to be built.
- **G:** execute the two best safe ideas, run ghost and human-testable checks, and return URLs plus receipts.

Cycle numbers may remain inside history if useful, but filenames and user-facing labels must describe the product outcome.

## Medullina mobile strategy

Build a separate mobile client, not a separate Werkles system.

Recommended repository shape once the mobile framework is chosen:

```text
werkles/
  apps/web
  apps/mobile
  packages/domain
  packages/api-client
  packages/design-tokens
  packages/test-fixtures
```

Until a monorepo migration is intentionally planned, Medullina can clone the canonical repo and work on a dedicated mobile branch or worktree. The mobile app should call the same versioned Werkles API and use the same Supabase project/environment boundaries; it must not duplicate matching logic, authorization rules, or database ownership in the client.

Start mobile with one thin vertical slice: sign in -> submit discovery intake -> view recommendation/status. Use Expo/React Native as the default evaluation candidate because the current product is TypeScript/React, but record that choice in a short architecture decision before scaffolding. Keep mobile secrets out of the app; privileged operations stay server-side.

## Immediate next sequence

1. Complete durable Matching preview proof behind the existing schema gate.
2. Give Ben a browser test card and run the Matching ghost suite on preview.
3. Capture accept/reject/modify feedback and outcome evidence.
4. Stabilize identity, organization, consent, export, and deletion contracts.
5. Scaffold the Medullina mobile client against the shared API contract.
6. Only then expand membership/company hosting, learning proof, Plaid, and networks in vertical slices.
