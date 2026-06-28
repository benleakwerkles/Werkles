# NEUROCIRCULYMPHATIC_V0_BOUNDARY

TO: Speaker / TinkerDen Intake  
FROM: Swanson@Doss  
DATE: 2026-06-23  
MISSION: NEUROCIRCULYMPHATIC_V0_BOUNDARY  
MODE: Boundary only. No implementation. No architecture expansion.

## GLOBAL BOUNDARY

Purpose:

- Prevent neurocirculymphatic sprawl.
- Keep V0 boring, local, file-backed, and auditable.
- Preserve the receipt trust model: local storage, delivery, receipt, and assimilation are separate proof levels.

Allowed first tools:

- filesystem paths
- JSON / JSONL
- mtimes
- byte counts
- hashes
- schema checks
- on-demand scripts
- Chokidar only as a local file watcher

Not justified for V0 or V1:

- MQTT
- Redis
- vector DB
- Atlas expansion
- daemonized nervous-system bus
- cross-machine broker
- automatic doctrine promotion
- automatic merge/delete/cleanup

## COMPONENT BOUNDARIES

COMPONENT:

Chokidar

V0:

- Local-only filesystem watcher.
- Watch only known, explicit receipt/intake surfaces.
- Start manually or under a supervised local command, not as an always-on hidden service.
- Emit file-created / file-changed facts into the JSONL event stream.
- Ignore `.git`, `node_modules`, `.next`, package caches, screenshots, generated previews, and archive folders.
- Read-only except for appending event records.

V1:

- Add debounce, restart-safe cursor, lockfile, and heartbeat.
- Add a configurable watch-root allowlist.
- Add per-surface event types such as `receipt_seen`, `speaker_draft_seen`, `delivery_readback_seen`, and `stale_candidate_seen`.
- Still local-first and file-backed.

LATER:

- Consider cross-machine fan-in only if multiple machines produce important events that cannot be reconciled by periodic file scans.
- Consider OS service only after foreground/supervised runs prove useful and bounded.

DO NOT BUILD YET:

- No permanent daemon.
- No machine-wide watcher.
- No recursive home-directory watcher.
- No network watcher.
- No automatic assimilation.
- No automatic Speaker draft creation.
- No MQTT/Redis event bridge.

---

COMPONENT:

JSONL event stream

V0:

- One append-only local JSONL file per workspace.
- Events are facts, not decisions.
- Minimum fields:
  - `event_id`
  - `event_time`
  - `event_type`
  - `source_path`
  - `observed_by`
  - `byte_count`
  - `hash`
  - `trust_level`
- Trust levels stay explicit:
  - `LOCAL_STORAGE_PROVEN`
  - `DELIVERY_UNVERIFIED`
  - `DELIVERY_PROVEN`
  - `RECEIPT_PROVEN`
  - `ASSIMILATION_PROVEN`

V1:

- Add daily rotation.
- Add monotonic sequence number.
- Add schema version.
- Add duplicate suppression by path + hash.
- Add a compact index for latest event per receipt id or source path.

LATER:

- Consider SQLite only if JSONL scans become too slow or need transactional queries.
- Consider broker only if there are multiple live consumers that must react in near real time.

DO NOT BUILD YET:

- No Redis stream.
- No MQTT topic tree.
- No Kafka-style event sourcing.
- No vector DB.
- No semantic memory as truth source.
- No event stream as canon by itself; it is observation evidence only.

---

COMPONENT:

Receipt scanner

V0:

- On-demand scanner over known receipt surfaces only.
- Use existing surfaces from prior audits:
  - `data/tinkerden/inbox/*.json`
  - `data/tinkerden/receipts.json`
  - `tinkerden/inbox/*_RECEIPT.json`
  - `foreman/rat_cellar/receipts/*.json`
  - `foreman/soledash/receipts/*.json`
  - `foreman/speaker/entries/DRAFT_*.md`
- Report:
  - found receipts
  - invalid receipts
  - sender-only receipts
  - receiver-side receipts
  - missing readback
  - missing assimilation proof
- No promotion. No mutation.

V1:

- Add schema validation for known receipt types.
- Add hash-based change detection.
- Add `by_source_receipt` checks against Change Capsule index if present.
- Add optional Recent Reports refresh using the existing gatherer, not a new report system.

LATER:

- Cross-machine scanner only after exact machine paths are verified.
- Second-machine verification only after the local scanner is stable.

DO NOT BUILD YET:

- No semantic classifier.
- No auto-doctrine promotion.
- No auto-pearl creation.
- No source recovery crawler.
- No scanning unknown folders.
- No Atlas-backed receipt vault.

---

COMPONENT:

Stale detector

V0:

- Report-only stale check.
- Compare known outbound packets, expected receipt paths, and latest observed receipt/readback events.
- Static thresholds only.
- Output a stale report, not an action.
- Use current trust model labels:
  - local only
  - delivery unverified
  - delivery proven
  - receipt proven
  - assimilation unverified

V1:

- Add per-destination threshold config.
- Add exception labels for intentionally blocked work.
- Add stale-reason categories:
  - missing receipt
  - invalid receipt
  - receiver write missing
  - receiver readback missing
  - assimilation missing
- Add human-readable stale packet summary for Ben/Petra.

LATER:

- Consider notifications only after stale reports prove useful and low-noise.
- Consider auto-opening a Human Gate packet only after false positives are acceptably low.

DO NOT BUILD YET:

- No automatic close.
- No automatic delete.
- No automatic retry.
- No background nag loop.
- No escalation spam.
- No replacing Petra GO / NO-GO.

---

COMPONENT:

Delivery verification

V0:

- Manual or on-demand verification command.
- Verify only known sender artifact -> known receiver target.
- Require receiver-side write plus receiver-side readback before saying delivered/received.
- Record:
  - sender path
  - receiver path
  - sender hash
  - receiver hash
  - byte count
  - readback time
  - verification result
- Enforce the stricter language:
  - `LOCAL_STORAGE_PROVEN`
  - `DELIVERY_PROVEN`
  - `RECEIPT_PROVEN`
  - `ASSIMILATION_PROVEN`
  - `UNVERIFIED`

V1:

- Route-aware verification using existing destination directory records.
- Add exact receiver-store adapters only for already known surfaces:
  - TinkerDen inbox
  - TinkerDen receipts
  - Speaker DRAFT entries
  - Change Capsule index
  - Rat Cellar Pearl index
- Produce a verification receipt only after readback.

LATER:

- Second-machine verification if remote paths are proven.
- Signed or checksummed delivery packets if tamper/conflict risk becomes real.
- Cross-machine delivery registry only if local file-backed verification becomes too manual.

DO NOT BUILD YET:

- No claim of delivery from a `DESTINATION:` label.
- No auto-writing to Speaker.
- No auto-writing to TinkerDen Intake.
- No auto-assimilation.
- No Atlas delivery registry.
- No MQTT/Redis acknowledgment bus.

## EXPLICIT NO-GO LIST

Do not build yet:

- MQTT bus
- Redis queue
- vector database
- Atlas expansion
- background nervous-system daemon
- cross-machine event broker
- auto-doctrine promotion
- auto-manuscript assimilation
- auto-merge/delete/cleanup
- any watcher that turns Ben's whole machine into an input surface

## SMALL ENOUGH V0

V0 is only:

1. A local watcher or scanner over explicit paths.
2. An append-only JSONL observation log.
3. A receipt scanner that reports evidence state.
4. A stale detector that reports missing proof.
5. A delivery verifier that refuses to say delivered without receiver-side readback.

Anything beyond that is V1 or later.

## LOCAL STORAGE STATUS

LOCAL STORAGE PROVEN:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\NEUROCIRCULYMPHATIC_V0_BOUNDARY.md`

DELIVERY TO SPEAKER:

- UNVERIFIED

DELIVERY TO TINKERDEN INTAKE:

- UNVERIFIED

ASSIMILATION:

- UNVERIFIED

Reason:

- This mission requested boundary output only. No receiver-side write, route call, doctrine draft, or TinkerDen inbox insertion was performed.
