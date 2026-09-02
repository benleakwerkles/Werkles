# Harvey Build Companion Volume II Build Backlog

Status: BUILD BACKLOG V0.1
Date: 2026-07-06
Owner: Heimerdinker@Betsy

## Rule

This backlog is the builder-facing decomposition of the Volume II companion. It is not an authorization to implement everything immediately.

Each build phase must return one of:

- `ARTIFACT`;
- `BLOCKER`;
- `SOURCE_MISSING`;
- `BREACH_DENIED`;
- `PARTIAL`.

## Phase 0 - Spec Red Team

Goal: pressure-test the build artifacts before implementation.

Artifacts:

- `HARVEY_BUILD_COMPANION_VOLUME_II_BUILD_SPEC_20260706.md`
- `HARVEY_BUILD_COMPANION_VOLUME_II_MACHINE_MANIFEST_20260706.json`
- `HARVEY_BUILD_COMPANION_VOLUME_II_STATE_MACHINE_20260706.mmd`

Acceptance:

- Skybro signs off on metaphor clarity or returns rewrite notes.
- Mack identifies feasibility failures and overclaims.
- Ben decides which claims belong in prose and which belong in appendix/spec.

Blockers:

- "hardware-backed token" is undefined.
- "cryptographic invisibility" is not mapped to OS or sandbox enforcement.
- Redis transport durability requirements are unresolved.

## Phase 1 - Intent Capsule And Scoped Source Manifest

Goal: define the scope contract before any fleet execution.

Build outputs:

- Intent Capsule JSON schema.
- Scoped Source Manifest JSON schema.
- Parser that returns `SCHEMA_INVALID` for malformed input.
- Fixture with one allowed read path, one allowed write path, and one forbidden path.

Acceptance:

- missing Intent Capsule blocks execution;
- expired Intent Capsule blocks execution;
- path outside manifest returns `BREACH_DENIED`;
- missing source returns `SOURCE_MISSING`;
- every result writes a receipt.

## Phase 2 - Phantom Lane Prototype

Goal: prove bounded simulation without canonical source mutation.

Implementation candidates:

- Git worktree first;
- overlay/container/VM later if needed.

Build outputs:

- lane initializer;
- lane budget metadata;
- proposed mutation diff export;
- lane discard command;
- promotion request artifact.

Acceptance:

- allowed write appears only inside lane;
- canonical source hash is unchanged;
- lane diff is inspectable;
- expired lane becomes blocked or read-only;
- promotion requires visible human gate.

## Phase 3 - Sensory Skin

Goal: record file-backed reality changes without confusing watcher evidence for containment.

Build outputs:

- Chokidar watcher over fixture lane;
- normalized JSONL event writer;
- event schema;
- receipt join by `intent_id`, `lane_id`, and `receipt_id`.

Acceptance:

- watcher records allowed write;
- watcher records forbidden attempt receipt;
- watcher does not authorize mutation;
- event can join to receipt.

## Phase 4 - Lymphatic Transport Spike

Goal: prove schema-validated local message frames.

Build outputs:

- Redis local topology note;
- message frame schema;
- sender fixture;
- receiver fixture;
- invalid-frame drop receipt.

Acceptance:

- unknown node is dropped;
- expired frame is dropped;
- oversize frame is dropped;
- missing MAC is dropped;
- dropped frame writes `BREACH_DENIED` or `BLOCKED`.

## Phase 5 - Brainboot Packet

Goal: prove fresh world-state initialization.

Build outputs:

- Brainboot Packet schema;
- generator from source truth, active intents, lane state, and latest receipts;
- stale source detector;
- boot injection readback fixture.

Acceptance:

- stale world-state blocks boot;
- missing source truth blocks boot;
- active blockers appear in boot packet;
- no boot packet claims cleared state when blockers exist.

## Phase 6 - Visible Gate Panel

Goal: show human-readable lane state and exact next decision.

Build outputs:

- local gate panel page or static review artifact;
- lane state readback;
- proposed diff display;
- blocker display;
- single-click decision model.

Acceptance:

- one click equals one visible decision;
- gate text names exact mutation;
- no hidden multi-action approval;
- no approval without receipt.

## Phase 7 - Promotion Gate

Goal: move proposed lane mutations into durable source only after human authorization.

Build outputs:

- promotion request artifact;
- signature/gate abstraction;
- apply path;
- rollback note;
- promotion receipt.

Acceptance:

- no promotion without human gate;
- promotion receipt includes source hashes before and after;
- denied promotion leaves source unchanged.

## First Test Scenario

Use a fixture folder only.

1. Ben creates one Intent Capsule.
2. Manifest grants one file read and one fixture output path.
3. Phantom Lane initializes.
4. Dink writes an allowed fixture output.
5. Maker attempts a forbidden adjacent write.
6. Allowed output becomes proposed mutation.
7. Forbidden write becomes `BREACH_DENIED`.
8. Ledger records both.
9. Visible Gate Panel shows the exact next human decision.

## Definition Of Done For Volume II Prototype

The prototype is done when a human can inspect one screen or artifact and answer:

- what was the intent?
- which paths were visible?
- which fleet node acted?
- what changed?
- what was blocked?
- what proof exists?
- what is the next legal human action?

## Non-Goals

- no production deployment;
- no provider account mutation;
- no secrets in logs;
- no blind automation;
- no claim of solved real-time Aeye consciousness;
- no direct mutation of durable source from simulation lanes.
