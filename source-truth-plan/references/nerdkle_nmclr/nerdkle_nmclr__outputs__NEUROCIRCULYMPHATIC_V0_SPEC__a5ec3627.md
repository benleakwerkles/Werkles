# NEUROCIRCULYMPHATIC_V0_SPEC

TO: TinkerDen Intake / Speaker  
FROM: Swanson@Doss  
DATE: 2026-06-23  
MISSION: NEUROCIRCULYMPHATIC_V0_SPEC  
MODE: Spec only. No implementation.

## PURPOSE

Convert the organism metaphor into a small, boring V0 build sequence.

V0 does not build a nervous system. V0 builds local file-backed evidence that shows whether work moved, returned, got sampled, got verified, or went stale.

## V0 BOUNDARY

Source boundary:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\NEUROCIRCULYMPHATIC_V0_BOUNDARY.md`

Hard boundary:

- local only
- explicit paths only
- append-only JSONL
- scanners and reports before automation
- receiver-side readback before delivery claims
- no hidden daemon
- no auto-assimilation
- no MQTT
- no Redis
- no vector DB
- no Atlas expansion

## DEFINITIONS

### Nerves

Nerves are local file observations.

V0 meaning:

- A watched file changed.
- A receipt appeared.
- A Speaker draft appeared.
- A receiver-side readback artifact appeared.
- A stale candidate was observed.

Nerves do not decide, promote, merge, delete, route, or assimilate. They only report local evidence.

V0 tool:

- Chokidar or equivalent local file watcher.
- Supervised/manual run only.

### Circulation

Circulation is the movement of work through existing surfaces:

packet -> receipt -> receiver storage -> receiver readback -> possible assimilation

V0 meaning:

- The system can show where a packet or receipt currently is.
- Sender-side storage and receiver-side arrival are separate states.
- Circulation is not proven until the receiving surface can be read back.

V0 tool:

- append-only JSONL observation log plus existing receipt/intake folders.

### Lymphatic Sampling

Lymphatic sampling is periodic cleanup intelligence without cleanup action.

V0 meaning:

- Sample known receipt/intake/speaker surfaces.
- Detect invalid receipts, sender-only receipts, missing readback, stale work, duplicate artifacts, and false-delivery risk.
- Report anomalies.

Lymphatic sampling does not delete, archive, promote, or repair.

V0 tool:

- on-demand receipt scanner.

### Delivery Verification

Delivery verification proves whether bytes arrived at the destination.

V0 meaning:

- `LOCAL_STORAGE_PROVEN` means sender-side file exists.
- `DELIVERY_PROVEN` means receiver-side file/store exists.
- `RECEIPT_PROVEN` means receiver-side readback confirms the artifact.
- `ASSIMILATION_PROVEN` means downstream inheritance state changed.

V0 tool:

- explicit sender path -> receiver path verification with hash/byte/readback.

### Stale Detection

Stale detection identifies work whose expected proof did not return.

V0 meaning:

- A packet, receipt, or delivery claim is missing the next proof state.
- The detector reports the missing proof and stops.

V0 tool:

- on-demand report comparing expected receipt/readback/assimilation against observed JSONL events and known stores.

## BUILD SEQUENCE

### Step 1: Declare Explicit Surfaces

Use only known surfaces from existing audits.

Candidate V0 surfaces:

- `data/tinkerden/inbox/*.json`
- `data/tinkerden/receipts.json`
- `tinkerden/inbox/*_RECEIPT.json`
- `foreman/rat_cellar/receipts/*.json`
- `foreman/soledash/receipts/*.json`
- `foreman/speaker/entries/DRAFT_*.md`
- `foreman/reports/RECENT_REPORTS.json`

Output:

- A static allowlist.

Do not scan:

- home directory
- whole repo recursively by default
- `.git`
- `node_modules`
- `.next`
- preview worktrees
- screenshots
- archives
- Atlas vaults

### Step 2: Create the JSONL Event Contract

Each event is one fact.

Minimum fields:

```json
{
  "event_id": "string",
  "event_time": "ISO-8601",
  "event_type": "receipt_seen | receiver_readback_seen | stale_candidate_seen | delivery_verified | assimilation_seen",
  "source_path": "string",
  "observed_by": "Swanson@Doss",
  "byte_count": 0,
  "hash": "string",
  "trust_level": "LOCAL_STORAGE_PROVEN | DELIVERY_UNVERIFIED | DELIVERY_PROVEN | RECEIPT_PROVEN | ASSIMILATION_PROVEN | UNVERIFIED",
  "notes": "string"
}
```

Output:

- append-only JSONL.

Rule:

- The JSONL stream is observation evidence, not canonical truth by itself.

### Step 3: Add Nerves

Build only a supervised local watcher.

Input:

- explicit allowlist from Step 1.

Action:

- watch for file create/change events.
- calculate byte count and hash.
- append event to JSONL.

Output:

- `receipt_seen`, `speaker_draft_seen`, or `receiver_readback_seen` events.

Stop condition:

- watcher error, unknown root, recursive expansion, or path outside allowlist.

### Step 4: Add Lymphatic Sampling

Build only an on-demand scanner.

Input:

- explicit allowlist.
- JSONL event file.

Action:

- scan known surfaces.
- identify invalid receipts, sender-only receipts, missing receiver readback, and possible duplicates.

Output:

- plain report.
- optional JSON report.

Rule:

- scanner reports; it does not mutate.

### Step 5: Add Delivery Verification

Build only explicit verification.

Input:

- sender artifact path.
- receiver target path/store.

Action:

- confirm sender exists.
- confirm receiver exists.
- compare byte count/hash or exact body marker.
- read receiver-side copy.

Output:

- delivery verification receipt.

Pass:

- receiver-side readback matches intended artifact.

Fail:

- sender-only file, missing receiver file, hash mismatch, or no readback.

### Step 6: Add Stale Detection

Build only report mode.

Input:

- expected packet/receipt/delivery list.
- JSONL events.
- known stores.

Action:

- find items missing the next proof state.

Output:

- stale report with reason codes:
  - `MISSING_RECEIPT`
  - `INVALID_RECEIPT`
  - `RECEIVER_WRITE_MISSING`
  - `RECEIVER_READBACK_MISSING`
  - `ASSIMILATION_MISSING`

Rule:

- stale detector does not retry, close, delete, or escalate automatically.

### Step 7: Add Human-Readable Status

Build only a static report.

Output sections:

- observed receipts
- delivery verified
- receipt readback verified
- assimilation verified
- stale / missing proof
- false delivery candidates

Rule:

- status report must not call anything delivered unless receiver-side readback exists.

## WHAT NOT TO BUILD

Do not build:

- MQTT bus
- Redis queue
- vector database
- Atlas expansion
- cross-machine broker
- background nervous-system daemon
- recursive machine-wide watcher
- auto-delivery claims
- auto-writing to Speaker
- auto-writing to TinkerDen Intake
- auto-doctrine promotion
- auto-pearl creation
- auto-manuscript assimilation
- auto-merge
- auto-delete
- auto-cleanup
- notification loop
- replacement for Petra GO / CONDITIONAL GO / NO-GO

## GO / CONDITIONAL GO / NO-GO

GO:

- Write this spec.
- Use the V0 boundary as controlling scope.
- Build only local, supervised, file-backed observation/report tools after explicit implementation approval.

CONDITIONAL GO:

- V0 implementation is conditionally acceptable only if it stays inside the declared boundary and uses explicit known paths.
- Delivery verification may be built only as readback proof, not as auto-routing or auto-assimilation.

NO-GO:

- Any MQTT/Redis/vector/Atlas expansion.
- Any hidden daemon.
- Any auto-assimilation.
- Any destination-delivery claim from sender-side storage alone.
- Any watcher that makes Ben's whole machine an input surface.

## RECEIPT

SPEC PATH:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\NEUROCIRCULYMPHATIC_V0_SPEC.md`

V0 BOUNDARY:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\NEUROCIRCULYMPHATIC_V0_BOUNDARY.md`

DECISION:

- CONDITIONAL GO

RATIONALE:

- The V0 sequence is useful and bounded.
- It remains conditional because no implementation approval was granted, and exact receiver-side write/readback behavior must be verified during implementation.

LOCAL STORAGE:

- PROVEN

DELIVERY TO TINKERDEN INTAKE:

- UNVERIFIED

DELIVERY TO SPEAKER:

- UNVERIFIED

ASSIMILATION:

- UNVERIFIED

Reason:

- This mission requested a spec artifact only. No receiver-side write, route call, doctrine draft, or TinkerDen inbox insertion was performed.
