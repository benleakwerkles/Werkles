# Harvey Build Companion Volume II Build Spec

Status: BUILD COMPANION SPEC V0.1
Date: 2026-07-06
Owner: Heimerdinker@Betsy
Lane: Harvey Build companion / Volume II architecture and metal

## Mandate

Instantiate the mechanical ecosystem behind Volume I without letting software components assume independent moral authority, unmonitored execution paths, or fake completion.

The system must let a verified fleet cooperate through shared operational state while preserving human sovereignty, scoped execution, programmatic containment, and receipt-backed truth.

## Builder Roster

The verified fleet named by the source text:

- Dink;
- Maker;
- Bean;
- Ender;
- Thufir;
- Skybro;
- Petra;
- Swanson.

No fleet member receives ambient authority. Every action must be scoped by an active human Intent Capsule and a machine-readable manifest.

## Non-Negotiable Guardrails

### 1. Prose vs. Manifest

If narrative documentation conflicts with machine-readable manifests, the manifest wins.

Required behavior:

- mark prose as stale;
- verify live system paths;
- patch the prose or manifest;
- write a transaction receipt.

### 2. Custody Triad

The containment rule is:

```text
Classifier decides. Operating system enforces. Receipts prove.
```

Watchers are evidence, not cages.

Dashboards are visibility, not custody.

Prompts are not containment.

### 3. Sovereignty Floor

The machine layer may rank means, risks, blockers, and available execution paths.

It may not rank human dreams, ends, taste, purpose, or moral authority.

### 4. Single-Click Gate

One click must equal one informed human decision.

Forbidden patterns:

- hidden multi-action consent;
- "approve all forever";
- irreversible mutation behind decorative button text;
- silent escalation from review to execution.

## Core Build Surfaces

### A. Intent Capsule

The Intent Capsule is the human-authorized scope object.

Minimum fields:

- `intent_id`;
- `human_operator`;
- `created_at`;
- `lane`;
- `purpose`;
- `allowed_paths`;
- `forbidden_paths`;
- `allowed_actions`;
- `forbidden_actions`;
- `fleet_roster`;
- `expiry`;
- `required_receipt_path`;
- `human_gate_required_for`;
- `stale_after_ms`.

Acceptance check:

- a missing or expired Intent Capsule blocks all fleet execution;
- a path outside `allowed_paths` returns `BREACH_DENIED`;
- a forbidden action returns `BREACH_DENIED`;
- every decision writes a receipt.

### B. Incubation Nest

The Incubation Nest is the shared local workspace where fleet members can simulate work without mutating durable source.

Required behavior:

- create bounded simulation lanes;
- isolate write paths from durable production roots;
- preserve source hashes before simulation;
- collect lane mutations as proposed patches;
- block promotion until a signed human gate clears.

Implementation candidates:

- Git worktrees;
- overlay filesystem;
- container bind mounts;
- VM snapshots;
- copy-on-write mirror directory.

Architecture rule:

```text
The nursery must behave like copy-on-write, even if the first implementation uses a simpler bounded worktree.
```

Acceptance check:

- automated lane writes cannot mutate canonical source directly;
- proposed mutations are inspectable as a diff;
- lane budget exhaustion returns `BLOCKED`;
- promotion requires human gate receipt.

### C. Phantom Lane

A Phantom Lane is a bounded, temporary mirror of the repository or selected source paths.

Minimum fields:

- `phantom_lane_id`;
- `intent_id`;
- `source_manifest_id`;
- `created_at`;
- `expires_at`;
- `budget_bytes`;
- `allowed_paths`;
- `write_root`;
- `promotion_gate`;
- `receipt_path`.

Acceptance check:

- lane cannot see paths outside its scoped manifest;
- lane writes are captured as proposed mutations;
- expired lane becomes read-only;
- unpromoted lane can be discarded without source mutation.

### D. Sensory Skin

The Sensory Skin watches file-backed reality and converts changes into state deltas.

Recommended first runtime:

- Node.js;
- Chokidar;
- JSONL event log.

Required event fields:

- `event_id`;
- `timestamp`;
- `intent_id`;
- `phantom_lane_id`;
- `source_path`;
- `event_type`;
- `before_hash`;
- `after_hash`;
- `actor`;
- `state_after`;
- `receipt_id`.

Acceptance check:

- watcher does not authorize action;
- watcher does not enforce containment;
- watcher only records evidence;
- every state delta can join to intent, lane, and receipt where applicable.

### E. Lymphatic Transport

The live coordination fabric moves messages between fleet nodes.

Recommended first runtime:

- local Redis Pub/Sub or Redis Streams for durable replay where needed.

Hard rule:

```text
Transport is not trust.
```

Every frame must be schema-validated.

Minimum frame fields:

- `frame_id`;
- `intent_id`;
- `origin_node`;
- `origin_role`;
- `target_node`;
- `target_role`;
- `lane_id`;
- `payload_type`;
- `payload_hash`;
- `payload_size_bytes`;
- `expires_at`;
- `mac`;
- `schema_version`.

Acceptance check:

- unsigned frame is dropped;
- expired frame is dropped;
- oversize frame is dropped;
- unknown origin node is dropped;
- dropped frame writes `BREACH_DENIED` or `BLOCKED` receipt.

### F. Scoped Source Manifest

The Scoped Source Manifest defines what a fleet member can see and touch.

Minimum fields:

- `source_manifest_id`;
- `intent_id`;
- `visible_paths`;
- `read_only_paths`;
- `write_paths`;
- `forbidden_paths`;
- `secret_paths`;
- `promotion_targets`;
- `hashes`;
- `created_by`;
- `created_at`;
- `expires_at`.

Acceptance check:

- private notes, financial records, credentials, adjacent repos, and environment keys are invisible unless explicitly granted;
- a path outside scope returns `BREACH_DENIED`;
- missing source returns `SOURCE_MISSING`;
- stale hash returns `BLOCKED`.

### G. Brainboot Packet

The Brainboot Packet is the session initialization payload that counters model amnesia.

It must be generated from verified local state, not from conversational confidence.

Minimum fields:

- `brainboot_packet_id`;
- `generated_at`;
- `source_truth_hash`;
- `active_intent_ids`;
- `active_lane_ids`;
- `latest_receipts`;
- `active_blockers`;
- `stale_sources`;
- `fleet_roster`;
- `human_gates`;
- `forbidden_actions`;
- `world_state_summary`;
- `compression_notes`.

Acceptance check:

- stale world-state blocks boot;
- missing source truth blocks boot;
- boot packet lists blockers rather than smoothing them away;
- boot packet is injected before fleet execution begins.

### H. Stigmergic Gossip Ledger

The ledger is append-only evidence of reasoning, coordination, mutation, and correction.

Recommended first runtime:

- JSONL local ledger;
- optional SQLite index for query;
- optional later Postgres mirror for product-grade state.

Minimum event types:

- `INTENT_CREATED`;
- `MANIFEST_BOUND`;
- `FRAME_SENT`;
- `FRAME_DROPPED`;
- `LANE_INITIALIZED`;
- `LANE_PARTIAL`;
- `LANE_COMPLETED`;
- `LANE_BLOCKED`;
- `SOURCE_MISSING`;
- `BREACH_DENIED`;
- `HUMAN_GATE_REQUESTED`;
- `HUMAN_GATE_SIGNED`;
- `PROMOTION_REQUESTED`;
- `PROMOTION_APPROVED`;
- `PROMOTION_DENIED`.

Acceptance check:

- ledger is append-only;
- no event can overwrite prior truth;
- every mutation event references a receipt or blocker.

### I. Visible Gate Panel

The Visible Gate Panel is the human review surface.

It must display:

- active intent;
- active fleet nodes;
- lane state;
- proposed mutation diff;
- blocker reason;
- source-missing paths;
- breach-denied attempts;
- required human decision;
- exact consequences of the next click.

Acceptance check:

- no single-click action hides multiple decisions;
- no approval button mutates outside displayed scope;
- visible text names the exact gate being signed.

## Deterministic State Machine

Allowed lane states:

- `INITIALIZED`;
- `PARTIAL`;
- `COMPLETED`;
- `BLOCKED`;
- `SOURCE_MISSING`;
- `BREACH_DENIED`;
- `INTERRUPTED`;
- `SUPERSEDED`.

Invalid states are treated as `BLOCKED`.

Completion is valid only when:

- acceptance criteria are met;
- receipt exists;
- artifact or diff exists where required;
- state can be joined to intent, lane, manifest, and actor.

## Lockout Reflex

Trigger the lockout reflex when any of these occur:

- unauthorized file-write request;
- path outside scoped source manifest;
- altered token shorthand;
- unrecognized coordination pattern;
- missing source;
- stale source hash;
- invalid message frame;
- unknown fleet node;
- expired Intent Capsule;
- oversized transport payload;
- human gate required but absent.

Lockout behavior:

- freeze affected lane;
- write ledger event;
- write receipt;
- surface blocker on Visible Gate Panel;
- require human review before resuming.

## First Build Slice

Do not start with the full system.

Start with a local proof slice:

```text
Intent Capsule -> Scoped Source Manifest -> Phantom Lane -> Watcher Event -> Receipt -> Visible Gate Readback
```

First acceptance test:

1. Create an Intent Capsule for a small fixture folder.
2. Create a Scoped Source Manifest that grants one read path and one write path.
3. Initialize a Phantom Lane.
4. Attempt one allowed write and one forbidden write.
5. Verify allowed write appears as proposed mutation.
6. Verify forbidden write returns `BREACH_DENIED`.
7. Verify both attempts write ledger events and receipts.
8. Verify Visible Gate Panel can show the lane state and next human action.

## Truth Boundary

This spec is a build companion artifact. It is not an implementation receipt. It does not claim the Incubation Nest, Phantom Lane, Redis topology, cryptographic frame layer, Brainboot Packet runtime, or hardware-backed gate exists yet.
