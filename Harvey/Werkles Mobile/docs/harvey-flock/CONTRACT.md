# Harvey Flock passive relay contract

Status: `PASSIVE_FILE_RELAY_V1`

This directory is a repo-native proof boundary for Harvey Mobile. It is not a daemon, queue, network service, delivery claim, authentication system, or substitute for receiver evidence.

## Storage boundary

- Birds live in `docs/harvey-flock/birds/`.
- Receiver-produced evidence and receipts live in `docs/harvey-flock/receipts/`.
- `STATE.json` records only committed relay state.
- All Bird and evidence file paths are repo-relative. Evidence paths must remain under `docs/harvey-flock/`.
- Secret-shaped keys, embedded credentials, absolute paths, and path traversal are rejected.

## Bird identity and expiry

Every Bird binds `bird_id`, `correlation_id`, project, sender role and instance, exact target role and instance, creation and expiry times, instruction, acceptance tests, source paths, and a canonical SHA-256 digest. The digest excludes only the `bird_sha256` field itself. A receiver must reject expired, altered, misaddressed, or project-mismatched Birds.

`target_instance_id: UNBOUND` is deliberately non-deliverable. It records a prepared handoff without pretending a specific receiver exists. Before delivery, an authorized sender must issue a new Bird with a real receiver instance and a new globally unique Bird ID.

## Receipt lifecycle

Accepted `event_type` values are:

`QUEUED`, `RECEIVER_READABLE`, `RECEIVED`, `WORKING`, `ARTIFACT_WRITTEN`, `RECEIPTED`, `BLOCKED`.

`SENT` may appear only as `transport_event` attached to an allowed notice. It is transport evidence, never delivery or completion evidence.

Notices bind the active Bird, correlation ID, project, exact receiver role and instance, strictly increasing sequence, observation time, and relay-confined evidence paths. Identical notice replay is idempotent. Reuse of a notice ID with different content is a conflict. Lower or repeated sequences under a different notice ID are rejected.

Only correlated `RECEIPTED` or `BLOCKED` notices create terminal state. Terminal state is immutable. Queued or sent is not received; received is not completed.

## Commands

From `Harvey/Werkles Mobile/`, with Node.js 20 or newer already available:

```text
node scripts/verify-harvey-flock.mjs
```

The verifier uses only Node built-ins, writes test fixtures only beneath the operating-system temporary directory, removes them before exit, and does not install packages or start a service.
