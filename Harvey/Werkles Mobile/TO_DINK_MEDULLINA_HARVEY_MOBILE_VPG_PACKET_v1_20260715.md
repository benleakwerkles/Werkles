# Dink @ Medullina — Harvey Mobile V/P/G Packet

Status: `EXECUTED LOCALLY / ROOT EXECUTION OWNED`

Packet ID: `TO_DINK_MEDULLINA_HARVEY_MOBILE_VPG_PACKET_v1_20260715`

## Mission

Strengthen Harvey Mobile's SSH onboarding slice with proof-chain semantics from the latest available Dink/Flock state. Dink @ Medullina owns execution. This packet does not delegate file edits.

## Canonical execution context

```text
Repo: benleakwerkles/Werkles
Repo id: 1242158598
Branch: main
Commit: 294f98396b122b413275a3f8c45524987de284fe
Local checkout: C:\Users\medul\Documents\Codex\Projects\Werkles\Werkles Canonical
Scope: Harvey/Werkles Mobile/
Runtime: Codex Desktop
Hostname: COURTNEY
Execution owner: Dink @ Medullina
```

## P — pulled state

### Latest Dink packet

Source:

```text
foreman/messages/DINK_BETSY_RELAY_PROJECT_HANDOFF_PACKET_20260703.md
```

Rules carried forward:

- Packet creation is not delivery.
- Queued or sent is not completion.
- Receiver proof requires `RECEIVED`, then `COMPLETED` or `BLOCKER`, then status/origin readback.
- Empty inbox is not success.
- Exact receipt ids, paths, hashes, and proof boundaries must survive the handoff.

### Latest committed Flock/ThinkIt state

Sources:

```text
source-truth-plan/references/swanson_relay_build_20260629/README.md
source-truth-plan/references/swanson_relay_build_20260629/contracts/THINKIT_RELAY_MERGE_HANDOFF.md
data/thinkit/thinkit_status.md
```

Snapshot facts:

- Snapshot date: 2026-06-29.
- Transport proof chain: created -> queued/sent -> received -> completed/blocker -> origin return.
- Routable targets: 8.
- Round-trip proven targets: 8 in the merge snapshot.
- ThinkIt status reported 14/16 completed round trips and one queued thread-bridge packet.
- `Ender.Sally` was held.
- `Swanson.Doss` was local-only.
- Active code focus included Harvey state mirrors and the Doozer/reviewer momentum loop.

### Live Flock readback

Attempted read-only surfaces:

```text
http://10.1.10.8:3339/v1/relay/status?limit=200
http://10.1.10.8:3339/v1/relay/actionable_returns
http://10.1.10.8:3342/thinkit
```

Result:

```text
3339: unreachable from COURTNEY
3342: unreachable from COURTNEY
LIVE_FLOCK_STATUS: BLOCKER
PROOF_BOUNDARY: committed 2026-06-29 snapshot only
```

Do not promote the June 29 snapshot to live health.

## Current Harvey slice

The new `Access` tab currently:

- shows the canonical Ben account and Werkles repo
- accepts a machine name
- stages an in-memory local request
- states that no key, GitHub setting, dispatch, or remote is changed
- lists the planned SSH onboarding steps

Current limitation: `staged locally` is useful UX but does not yet carry a durable proof-state vocabulary or receipt.

## Ranked Dink ideas

### 1. Add an explicit proof-chain state model — strongest

Replace the broad draft/staged vocabulary with states that cannot imply delivery:

```text
DRAFT
CREATED_NOT_DISPATCHED
QUEUED_NOT_DELIVERED
RECEIVED_NOT_COMPLETED
COMPLETED_RECEIPT_PROVEN
BLOCKER_RECEIPT_PROVEN
```

For this bounded slice, Harvey may enter only `DRAFT` and `CREATED_NOT_DISPATCHED`. Later states remain visible contract vocabulary but require real bridge receipts.

Acceptance:

- UI never labels created, staged, queued, or sent as success.
- State labels and captions explain the proof boundary.
- Types prevent arbitrary status strings.

### 2. Produce a non-secret local request receipt — strongest

When the operator stages a request, create a local in-memory receipt containing:

```text
request id
machine name
GitHub account
repository
SSH alias
remote
proof state
proof boundary
```

Acceptance:

- Receipt contains no private key, token, OAuth data, or secret.
- Receipt is visible after staging.
- Receipt states `CREATED_NOT_DISPATCHED`.
- Reset removes the local receipt.

### 3. Add a canonical identity guard

Before future dispatch, compare expected account/repo/alias against the staged request and stop on mismatch.

Acceptance:

- Wrong owner or remote becomes `BLOCKER`, never auto-corrected silently.
- Guard result is receipt-ready.

### 4. Add a returned-answer panel

Reserve a compact panel for future `RECEIVED`, `COMPLETED`, and `BLOCKER` evidence from the machine agent.

Acceptance:

- Panel is explicitly empty/pending until a real receipt arrives.
- No mock terminal receipt is shown as real.

## G selection

Execute now:

1. explicit proof-chain state model
2. non-secret local request receipt

Defer:

3. canonical identity guard until real machine-agent dispatch exists
4. returned-answer panel until a receipt transport is selected

## Human gates

- no GitHub key creation
- no OAuth or login
- no remote mutation
- no push, merge, deploy, dependency install, Expo runtime, lint, or typecheck on Courtney's machine

## Required execution receipt

Return:

```text
PACKET_ID:
SELECTED_IDEAS:
FILES_CHANGED:
PROOF_STATE_ADDED:
RECEIPT_FIELDS_ADDED:
STATIC_CHECKS:
RUNTIME_CHECKS:
BLOCKERS:
PUSH_STATUS:
```

## G — execution receipt

```text
PACKET_ID: TO_DINK_MEDULLINA_HARVEY_MOBILE_VPG_PACKET_v1_20260715
SELECTED_IDEAS: explicit proof-chain state model; non-secret local request receipt
FILES_CHANGED: mobile-app/src/data/sshOnboarding.ts; mobile-app/src/screens/AccessScreen.tsx; mobile-app/README.md
PROOF_STATE_ADDED: DRAFT; CREATED_NOT_DISPATCHED; QUEUED_NOT_DELIVERED; RECEIVED_NOT_COMPLETED; COMPLETED_RECEIPT_PROVEN; BLOCKER_RECEIPT_PROVEN
REACHABLE_STATES: DRAFT; CREATED_NOT_DISPATCHED
RECEIPT_FIELDS_ADDED: requestId; createdAt; machineName; githubAccount; repository; hostAlias; remote; proofState; proofBoundary
STATIC_CHECKS: git diff --check; exhaustive proof-state presentation review; secret-field review
RUNTIME_CHECKS: deferred by Courtney-machine boundary
BLOCKERS: live Flock relay 3339/3342 unreachable; machine-agent bridge not connected
PUSH_STATUS: not pushed; Ben gate not requested
```
