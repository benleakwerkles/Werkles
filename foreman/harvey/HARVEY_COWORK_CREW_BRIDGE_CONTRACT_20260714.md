# Harvey Cowork Crew Bridge Contract

Date: 2026-07-14  
Lane: Harvey Local Integration And Fleet Activation  
Implementation context: `CODEX_LOCAL` on Doss  
Spanzee activation status: **NOT ACTIVATED**

## Outcome

Harvey now has a bounded status-projection contract for the successful Spanzee coordination pattern:

> Chat wakes the Aeye. The repo tells it what is true. Receipts prove what happened.

The implementation does not send a Cowork message, drive the Cowork UI, inspect a transcript, execute Runner, run Git, or claim that a route is live. It accepts only sanitized lifecycle events authenticated at intake as the canonical Spanzee Handeye and displays those events on Harvey. The local Harvey data directory is the trusted persistence boundary; the ledger is not presented as a portable machine signature.

The July 14 Dink/Doozer manual round-trip and its reported `8e033090` commit are historical evidence. They are not inserted into the live ledger because Doss cannot prove Spanzee-local session, workspace, audit, artifact, or receiver state.

## Endpoint

- Read-only projection: `GET /api/harvey/relay-events`
- Signed event intake: `POST /api/harvey/relay-events`
- Writer binding: `Spanzee` / `SPANZEE` / `handeye-spanzee-spanzee`
- Repository binding: `benleakwerkles/OddlyGodly2.0`
- Authentication: existing Harvey timestamped HMAC request envelope and one-use nonce
- Browser authority: none; the Harvey wall performs credential-free GET polling only
- Send authority: `SEND_DISABLED`

## Lifecycle

The only accepted normal order is:

1. `QUEUED`
2. `SESSION_FOUND`
3. `VISUALLY_CONFIRMED`
4. `AWAITING_SEND_CONFIRMATION`
5. `SENT`
6. `ACKNOWLEDGED`
7. `ARTIFACT_WRITTEN`
8. `RECEIPTED`

Any nonterminal phase may transition to `BLOCKED` with a structured blocker code. `SENT`, `ACKNOWLEDGED`, and `ARTIFACT_WRITTEN` remain nonterminal. Only `RECEIPTED` and `BLOCKED` close a delivery.

Every normal transition is sequence-bound, monotonic, identity-immutable, globally idempotent by event ID, and serialized through a cross-process file lock. A terminal ledger cannot be rewritten.

## Stored proof boundary

Harvey stores only:

- opaque hashes of the Spanzee workspace, Git common directory, worktree, session, window, visual confirmation, notice, audit messages, acknowledgements, artifacts, and receipt;
- source repository, branch, commit, Flock record offset, Bird path, artifact size, phase, sequence, and timestamps;
- canonical Spanzee machine/Handeye identity;
- structured blocker or completion proof.

Harvey rejects:

- raw transcript, reasoning, tool, clipboard, message, screenshot, session-ID, or secret fields;
- absolute, UNC, backslash, parent-traversal, or non-Bird artifact paths;
- ambiguous transports or non-Spanzee writers;
- phase skips, sequence races, identity drift, event-ID conflicts, replays, and terminal rewrites.

The Spanzee-local adapter remains responsible for realpath, exact Git top-level/common-dir/worktree, workspace, branch, HEAD, session, window, audit-offset, and artifact-change proof. Doss must never infer those facts.

## Separation of responsibility

### Oddly Godly / Spanzee owns

- `Docs/MakerHandoff/FLOCK_LOG.jsonl` and its routing contract;
- Birds under `Docs/MakerHandoff/`;
- Cowork session discovery and exact workspace binding;
- the controlled, operator-confirmed UI wake;
- audit tailing after the bound offset;
- Runner eligibility and execution;
- artifact and commit creation;
- signed lifecycle event submission.

### Harvey owns

- authenticating Spanzee lifecycle submissions;
- rejecting malformed, ambiguous, reordered, replayed, or privacy-unsafe projections;
- durable, atomic, idempotent event storage;
- showing `SENT` as in progress rather than success;
- displaying signed receipt or blocker truth without promoting a heartbeat or topology claim.

## Activation gates

The Spanzee-local adapter is a separate slice and remains gated until all are proved on Spanzee:

1. the authoritative `C:\Users\BenLeak\Projects\OddlyGodly2.0` realpath and Git identity;
2. an unambiguous live Cowork session bound to that exact workspace;
3. a targetable Flock notice contract with notice ID, target, expiry, Bird hash, and ACK correlation;
4. Runner action-to-agent validation plus collision-safe job IDs and atomic queue semantics;
5. a one-shot, short-lived operator confirmation bound to the exact session, window, workspace, message hash, and visual snapshot;
6. fixture, race, restart, session-rotation, timeout, audit-privacy, and physical Spanzee acceptance tests;
7. independent Maker, Bean, and Thufir post-implementation GO readback.

The isolated build and API receipts must bind the uncommitted Harvey overlay by manifest SHA-256, deterministic relative-path/file hashes, a single overlay SHA-256, exact isolated workspace, and test-file SHA-256. A committed HEAD alone is not sufficient evidence for this dirty-worktree slice.

No unattended send, persistent Spanzee service, push, merge, deploy, or public launch is authorized by this contract.
