# Ender/Doozer + Cursor @ Medullina — Harvey Mobile Cloud V/P/G Packet v2

Status: EXECUTED / CLOUD RECEIPT VERIFIED
Packet ID: TO_ENDER_DOOZER_CURSOR_MEDULLINA_HARVEY_MOBILE_VPG_PACKET_v2_20260715
Generated: 2026-07-15 America/New_York

## Canonical execution context

Repository: benleakwerkles/Werkles
Branch: codex/cloud-harvey-mobile-vpg-20260715
Folder: Harvey/Werkles Mobile/
Head pulled: 15ce3a577d8b187348347a7db8743265f5a1ad76
Local source checkout: NONE
Execution owner: Dink/root @ Medullina
Reviewers: Ender/Doozer @ Medullina; Cursor @ Medullina

## P — fresh cloud pull

Both reviewers independently confirmed:

- AccessScreen blob 460f2e1fa877cb01ef6f94dcf157e4a253d96ae3.
- sshOnboarding blob 1c6049c86e1f6c21ac234fecf21778f9ccb57a78.
- The local canonical guard compares a request created from canonical literals against those same literals.
- MATCH LOCAL CHECK is therefore a self-declaration, not observed machine identity.
- SshOnboardingReturnReceipt exists as a type, but no unknown-input parser, request correlation, chronology validation, or transition decision exists.
- No current live Flock receipt exists in this scoped cloud branch. The latest committed snapshot remains dated 2026-06-29.

## Ranked ideas

1. Replace tautological MATCH with expected/not-observed/verified proof tiers.
2. Add a strict returned-receipt parser and correlator.
3. Add a legal proof-transition reducer.
4. Harden machine naming and derive the real dated key title.

## G — selected strongest ideas

### 1. Proof-tiered canonical identity guard

Acceptance:

- A locally generated request reports EXPECTED_TARGET_SAVED or NOT_OBSERVED, never verified match.
- No machine observation means canDispatch is false.
- Only a correlated non-secret machine observation may become VERIFIED_MATCH.
- Account, repository, alias, remote, machine, or request mismatch becomes MISMATCH and remains blocked.
- The UI distinguishes expected values from observed proof.

### 2. Strict returned-receipt parsing and correlation

Acceptance:

- Unknown input is parsed through an allowlist before it may render or advance state.
- Exact requestId correlation is required.
- receiptId, source, evidence summary/reference, returnedAt, and allowed proof state are validated.
- A returnedAt earlier than request creation is rejected.
- Malformed, mismatched, or unsupported evidence stays REJECTED and blocked.
- Null input stays NOT_RECEIVED.
- Structural validation is labeled as correlation, not cryptographic authenticity.
- No mock machine receipt is introduced.

## Risks and proof boundary

- Runtime shape and correlation do not prove machine authenticity.
- In-memory duplicate handling is not durable across restarts.
- No machine bridge exists, so the normal visible state remains NOT_OBSERVED and NOT_RECEIVED.
- Completion styling remains forbidden without receiver and origin-return proof.

## Boundaries

No local checkout, main merge, deployment, key creation, GitHub setting change, OAuth, remote mutation, private key, fabricated receipt, or false success claim.

## Required receipt

Return packet path/blob, selected ideas, updated domain/UI blobs, transition behavior, check status, and remaining bridge/authenticity blockers.

## G — execution receipt

Selected ideas:

1. Proof-tiered canonical identity guard.
2. Strict returned-receipt parsing and correlation.

Cloud commits and files:

- 47fa4bae37fe — mobile-app/src/data/sshOnboarding.ts
- abd55b1f92dc — mobile-app/src/screens/AccessScreen.tsx
- 1c6cc8c5d205 — mobile-app/src/screens/AccessScreen.tsx icon type correction

Implemented behavior:

- Local expected target now reports NOT_OBSERVED and canDispatch false.
- VERIFIED_MATCH requires a correlated returned machine observation.
- MISMATCH retains expected/actual field details and blocks dispatch.
- Unknown return input is allowlisted and validated for request, machine, target, chronology, proof state, bounded source/evidence reference, and origin-return confirmation.
- Null input remains NOT_RECEIVED.
- Structural correlation is explicitly not cryptographic authenticity.
- No mock return receipt or machine bridge was introduced.

Verified result:

- Workflow run: 29470906287
- Head: 1c6cc8c5d2050bd091a67bd09b93dd33184dd4b9
- Lint: SUCCESS
- Typecheck: SUCCESS
- Local source checkout: NONE
- Main merge/deploy: NOT PERFORMED

Remaining blocker:

A real approved machine-agent transport and authenticity mechanism are still absent. Expected target storage and receipt correlation do not prove a machine connection.
