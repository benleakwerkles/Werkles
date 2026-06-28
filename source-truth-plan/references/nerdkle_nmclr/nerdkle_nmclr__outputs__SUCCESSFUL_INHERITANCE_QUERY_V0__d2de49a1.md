# SUCCESSFUL_INHERITANCE_QUERY_V0

MISSION: SUCCESSFUL_INHERITANCE_QUERY_V0  
FROM: Petra@Betsy / Fucko  
TO: Swanson@Doss  
DESTINATION REQUESTED: TinkerDen Intake, Speaker  
MODE: Query logic only. No implementation.

## OBJECTIVE

Produce the actual query logic for:

```text
READ
-> DERIVED ACTION
-> WRITE
```

The query must find inheritance events, not merely related files.

## DATA MODEL

The output record stays aligned with `SUCCESSFUL_INHERITANCE_EVENT_V0_SPEC.md`:

```json
{
  "artifact_id": "string",
  "reader": "string",
  "author": "string",
  "read_timestamp": "ISO-8601 string",
  "write_timestamp": "ISO-8601 string",
  "derived_artifact": "string",
  "evidence": "string"
}
```

Supporting query model:

```text
SourceArtifact
  artifact_id
  path_or_store
  hash
  artifact_type
  exists
  readable

ReadEvent
  read_id
  artifact_id
  reader
  read_timestamp
  read_evidence

DerivedActionEvent
  action_id
  source_read_id
  source_artifact_id
  actor
  action_timestamp
  action_type
  action_summary
  action_evidence

WriteEvent
  write_id
  source_action_id
  derived_artifact
  author
  write_timestamp
  write_evidence
  exists
  readable
```

Allowed `action_type` examples:

```text
correction
classification
routing_change
decision
spec_creation
receipt_creation
blocker_report
doctrine_candidate
change_capsule
pearl_candidate
behavior_receipt
```

Rejected `action_type` examples:

```text
copy_only
rename_only
destination_label_only
summary_without_downstream_change
semantic_match_only
chat_claim_only
```

## QUERY:

Pseudocode:

```text
successful_inheritance_events = []

for each source in SourceArtifact:
  if source.exists is not true:
    reject("source artifact missing")
  if source.readable is not true:
    reject("source artifact unreadable")

  reads = ReadEvent where ReadEvent.artifact_id == source.artifact_id

  for each read in reads:
    if read.reader is empty:
      reject("reader missing")
    if read.read_timestamp is empty:
      reject("read timestamp missing")
    if read.read_evidence is empty:
      reject("read evidence missing")

    actions =
      DerivedActionEvent where
        DerivedActionEvent.source_read_id == read.read_id
        OR (
          DerivedActionEvent.source_artifact_id == read.artifact_id
          AND DerivedActionEvent.action_evidence references read.artifact_id
        )

    for each action in actions:
      if action.action_timestamp < read.read_timestamp:
        reject("action happened before read")
      if action.action_type in rejected_action_types:
        reject("not a derived action")
      if action.action_evidence does not prove the read caused the action:
        reject("causality unproven")

      writes =
        WriteEvent where
          WriteEvent.source_action_id == action.action_id
          OR (
            WriteEvent.write_evidence references action.action_id
            AND WriteEvent.write_evidence references read.artifact_id
          )

      for each write in writes:
        if write.author is empty:
          reject("author missing")
        if write.write_timestamp <= read.read_timestamp:
          reject("write not after read")
        if write.write_timestamp < action.action_timestamp:
          reject("write before derived action")
        if write.exists is not true:
          reject("derived artifact missing")
        if write.readable is not true:
          reject("derived artifact unreadable")
        if write.write_evidence is empty:
          reject("write evidence missing")
        if evidence does not bind source.artifact_id -> action.action_id -> write.derived_artifact:
          reject("chain not bound")

        emit {
          artifact_id: source.artifact_id,
          reader: read.reader,
          author: write.author,
          read_timestamp: read.read_timestamp,
          write_timestamp: write.write_timestamp,
          derived_artifact: write.derived_artifact,
          evidence: combined evidence path or proof string
        }
```

Minimum SQL-shaped version for future use:

```sql
SELECT
  source.artifact_id,
  read.reader,
  write.author,
  read.read_timestamp,
  write.write_timestamp,
  write.derived_artifact,
  CONCAT(read.read_evidence, ' | ', action.action_evidence, ' | ', write.write_evidence) AS evidence
FROM SourceArtifact source
JOIN ReadEvent read
  ON read.artifact_id = source.artifact_id
JOIN DerivedActionEvent action
  ON (
    action.source_read_id = read.read_id
    OR (
      action.source_artifact_id = read.artifact_id
      AND action.action_evidence_references_source = TRUE
    )
  )
JOIN WriteEvent write
  ON (
    write.source_action_id = action.action_id
    OR (
      write.write_evidence_references_action = TRUE
      AND write.write_evidence_references_source = TRUE
    )
  )
WHERE source.exists = TRUE
  AND source.readable = TRUE
  AND read.reader IS NOT NULL
  AND read.read_timestamp IS NOT NULL
  AND read.read_evidence IS NOT NULL
  AND action.action_timestamp >= read.read_timestamp
  AND action.action_type NOT IN (
    'copy_only',
    'rename_only',
    'destination_label_only',
    'summary_without_downstream_change',
    'semantic_match_only',
    'chat_claim_only'
  )
  AND action.action_evidence_proves_causality = TRUE
  AND write.author IS NOT NULL
  AND write.write_timestamp > read.read_timestamp
  AND write.write_timestamp >= action.action_timestamp
  AND write.exists = TRUE
  AND write.readable = TRUE
  AND write.write_evidence IS NOT NULL
  AND write.evidence_binds_read_action_write = TRUE;
```

V0 does not require a database. The SQL shape is only a precise expression of the join logic.

## EXAMPLE EVENT

Illustrative event shape:

```json
{
  "artifact_id": "outputs/RECEIPT_TRUST_MODEL_AUDIT.md",
  "reader": "Swanson@Doss",
  "author": "Swanson@Doss",
  "read_timestamp": "2026-06-23T02:00:00-04:00",
  "write_timestamp": "2026-06-23T02:30:00-04:00",
  "derived_artifact": "outputs/SUCCESSFUL_INHERITANCE_EVENT_V0_SPEC.md",
  "evidence": "Derived spec requires receiver-side readback before delivery/assimilation claims, directly applying outputs/RECEIPT_TRUST_MODEL_AUDIT.md."
}
```

Audit note:

```text
This is an example event, not a filed successful-inheritance metric event.
A real event must include durable read evidence, action evidence, write evidence, and readback of both source and derived artifact.
```

## EDGE CASE:

Primary edge case: same actor reads and writes.

This can count only when:

1. The source artifact existed before the read.
2. The source read is evidenced.
3. The later write is evidenced.
4. The write is not a copy, rename, or destination label.
5. Evidence proves the later artifact was shaped by the source artifact.

It is weaker than cross-participant inheritance, but it still measures continuity because durable memory survived long enough to change later behavior.

Other edge cases:

| Case | V0 Treatment |
| --- | --- |
| Multiple source artifacts | Count only if evidence identifies which source caused which derived action, or emit one event per proven source. |
| Failed action after read | Count only if the failure creates a durable blocker, audit, or behavior-changing receipt. |
| Human reads, Aeye writes | Count only if the Aeye write cites the source read or human handoff as evidence. |
| Aeye reads, human writes | Count only if the human-written artifact cites the Aeye read/action chain. |
| Delivery not proven | Local write may prove derived artifact exists locally, but it does not prove TinkerDen/Speaker delivery. |
| Read timestamp missing | Do not count. Mark candidate `UNVERIFIED`. |
| Source renamed | Count only if evidence reconciles old id to new id. |

## FALSE POSITIVE:

Most dangerous false positive:

```text
READ receipt exists
WRITE receipt exists
timestamps are in the right order
but no derived action connects them
```

Why it fails:

```text
That proves exposure plus output, not inheritance.
The missing proof is the middle term: DERIVED ACTION.
```

Reject if:

1. The only connection is timestamp proximity.
2. The only connection is a similar title.
3. The only connection is a destination label.
4. The only connection is semantic similarity.
5. The only connection is "I used this" in chat.
6. The output is a copy or rename.
7. The derived artifact is not readable.
8. The evidence does not bind source -> action -> write.

## GO / CONDITIONAL GO / NO-GO

Decision: CONDITIONAL GO.

GO for:

1. Using this query logic as the V0 audit rule.
2. Manually applying the model to candidate receipts.
3. Rejecting any event that lacks the middle derived-action proof.

CONDITIONAL GO for implementation only if:

1. It reads existing file-backed receipts and action artifacts.
2. It emits candidates as `UNVERIFIED` unless all checks pass.
3. It preserves Petra's exact output fields: `artifact_id`, `reader`, `author`, `read_timestamp`, `write_timestamp`, `derived_artifact`, `evidence`.
4. It does not infer inheritance from semantic similarity.
5. It does not claim TinkerDen/Speaker delivery without receiver-side storage and readback.

NO-GO for:

1. Building a new system from this request.
2. Creating a database, vector index, watcher, Atlas expansion, MQTT bus, Redis queue, or dashboard.
3. Counting read-only or write-only receipts.
4. Counting copied artifacts.
5. Counting chat memory as proof.
6. Auto-assimilating doctrine or behavior.

## RECEIPT

Query receipt path:

```text
C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\SUCCESSFUL_INHERITANCE_QUERY_V0.md
```

Proof level:

```text
LOCAL STORAGE: PROVEN
TINKERDEN INTAKE DELIVERY: UNVERIFIED
SPEAKER ASSIMILATION: UNVERIFIED
```
