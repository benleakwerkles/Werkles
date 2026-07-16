# TO CURSOR + ENDER/DOOZER@MEDULLINA — HARVEY MOBILE V/P/G PACKET v3

Date: 2026-07-16  
Executor/push owner: Dink@Medullina (root)  
Canon: `benleakwerkles/Werkles` / `codex/cloud-harvey-mobile-vpg-20260715` / `Harvey/Werkles Mobile/`  
Pulled head: `317d8ce34caf9df2529ce73ed2b3589fc313ff66`

## V — Fresh handoff

Cursor and Ender/Doozer independently inspect current cloud state and return read-only recommendations. Root alone executes and pushes. Thufir and Bean are not engaged this cycle because the two pulls completed without an unresolved review gap.

## P — Respective Aeye pulls

### Cursor@Medullina

Pulled the exact head and current source blobs. Ranked: (1) monotonic Flock proof lifecycle reducer, (2) provenance-aware read-only relay evidence adapter, (3) typed Duck packet composer, (4) durable non-secret journal.

### Ender/Doozer@Medullina

Pulled the same exact head and green verification. Ranked: (1) snapshot-backed Flock evidence with staleness UI, (2) shared evidence ledger/reducer, (3) hardened Duck schema, (4) cloud unit tests.

Shared boundary: committed Flock artifacts are historical snapshots, not current relay health. Read-only live relay probes timed out after three seconds on 2026-07-16, so no live delivery or receipt claim is made.

Evidence sources:

- Flock README blob `9ab5e565b232d4da3f6803d40bd7d5601a0806c5`
- Flock manifest blob `bbda215edc3579a33a587b3358e37d31837c52e7`
- Command dashboard status blob `3a8317936ddcc741cdf3573a83f5bdf38bfaf570`
- Previous combined packet `cc3bbef85421cae9893329bfabdf574d8088b531`

## G — Execute these two

### 1. Monotonic Flock proof lifecycle reducer

Create a pure reducer that maps correlated receipts into legal proof states, rejects replayed receipt IDs, and prevents backward or post-terminal transitions. Integrate its derived state into Access without inventing receiver proof.

### 2. Provenance/staleness-aware read-only evidence adapter

Model committed Flock snapshots with source path, blob, observed time, and explicit `COMMITTED_SNAPSHOT_NOT_LIVE` truth. Show age and provenance on Dashboard without converting snapshots into route health.

## Receipt contract

Return final commit SHA, changed-file blobs, and a GitHub Actions run proving lint and typecheck at that exact head. No local checkout, main merge, deployment, key creation, or remote mutation.

Status: ROOT EXECUTION STARTED.
