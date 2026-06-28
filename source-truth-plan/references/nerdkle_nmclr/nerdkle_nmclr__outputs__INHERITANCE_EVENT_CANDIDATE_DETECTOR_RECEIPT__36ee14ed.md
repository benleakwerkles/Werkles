# INHERITANCE_EVENT_CANDIDATE_DETECTOR_RECEIPT

MISSION: INHERITANCE_EVENT_CANDIDATE_DETECTOR  
FROM: Petra@Betsy / Fucko  
TO: Swanson@Doss  
DESTINATION REQUESTED: TinkerDen Intake, Speaker  
MODE: Candidate detector contract and sample output only. No promotion. No doctrine. No assimilation.

## OBJECTIVE

Convert `SUCCESSFUL_INHERITANCE_QUERY_V0` into a candidate detector.

Detector rule:

```text
ReadEvent
-> DerivedActionEvent
-> WriteEvent
-> UNVERIFIED candidate only
```

The detector does not emit proven inheritance events. It emits possible inheritance candidates with explicit missing proof.

## SCHEMA:

Output file:

```text
C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\candidate_inheritance_events.json
```

Top-level JSON shape:

```json
{
  "schema_version": "INHERITANCE_EVENT_CANDIDATE_DETECTOR_V0",
  "generated_at": "ISO-8601 string",
  "status": "UNVERIFIED_CANDIDATES_ONLY",
  "source_query": "outputs/SUCCESSFUL_INHERITANCE_QUERY_V0.md",
  "promotion_allowed": false,
  "doctrine_allowed": false,
  "assimilation_allowed": false,
  "candidate_inheritance_events": [
    {
      "artifact_id": "string",
      "reader": "string",
      "author": "string",
      "derived_artifact": "string",
      "confidence": "LOW | MEDIUM | HIGH",
      "missing_proof": ["string"]
    }
  ]
}
```

Candidate fields:

| Field | Meaning | V0 Rule |
| --- | --- | --- |
| `artifact_id` | Source artifact that may have been inherited. | Must name a durable source artifact or source id. |
| `reader` | Actor or process that appears to have read the source. | Must be specific, not anonymous. |
| `author` | Actor or process that produced the candidate derived artifact. | Uses Petra's `author` field, not `writer`. |
| `derived_artifact` | Artifact that may have been produced from the source. | Must name a durable output candidate. |
| `confidence` | Plausibility rating, not proof. | Allowed values: `LOW`, `MEDIUM`, `HIGH`. This does not change `UNVERIFIED` status. |
| `missing_proof` | Proof gaps preventing promotion. | Must be non-empty for every candidate. Empty `missing_proof` is invalid in this detector. |

Detector input assumptions:

```text
ReadEvent
  artifact_id
  reader
  read_timestamp
  read_evidence

DerivedActionEvent
  source_artifact_id
  source_read_id
  actor
  action_timestamp
  action_type
  action_evidence

WriteEvent
  source_action_id
  author
  derived_artifact
  write_timestamp
  write_evidence
```

Candidate emission logic:

```text
emit candidate when:
  artifact_id exists
  AND reader exists
  AND author exists
  AND derived_artifact exists
  AND at least one ReadEvent / DerivedActionEvent / WriteEvent relationship is plausible
  AND one or more required proofs are missing

never emit candidate when:
  source artifact is known missing
  OR derived artifact is known missing
  OR only semantic similarity exists
  OR only destination label exists
  OR only chat memory exists
  OR candidate would require promotion to be useful
```

Confidence guidance:

```text
LOW:
  weak candidate; related names or timing, but missing most hard proof.

MEDIUM:
  source and derived artifact both exist and lineage is plausible, but one or more read/action/write proofs are missing.

HIGH:
  source, read, action, and write are strongly linked, but one decisive proof is still absent.
```

All confidence levels remain `UNVERIFIED`.

## SAMPLE CANDIDATE:

From `candidate_inheritance_events.json`:

```json
{
  "artifact_id": "outputs/RECEIPT_TRUST_MODEL_AUDIT.md",
  "reader": "Swanson@Doss",
  "author": "Swanson@Doss",
  "derived_artifact": "outputs/SUCCESSFUL_INHERITANCE_EVENT_V0_SPEC.md",
  "confidence": "MEDIUM",
  "missing_proof": [
    "No separate durable ReadEvent artifact was filed for the source read.",
    "No separate durable DerivedActionEvent artifact was filed for the middle action.",
    "Write proof is local-file creation/readback only, not receiver-side TinkerDen or Speaker readback.",
    "Evidence is plausible from content lineage but not sufficient for promotion to successful inheritance."
  ]
}
```

Why this is only a candidate:

- The source and derived artifacts exist locally.
- The content lineage is plausible.
- But the actual `ReadEvent`, `DerivedActionEvent`, and receiver-side `WriteEvent` proof are not fully filed.
- Therefore it must remain `UNVERIFIED`.

## GO / CONDITIONAL GO / NO-GO

Decision: CONDITIONAL GO.

GO for:

1. Writing `candidate_inheritance_events.json`.
2. Emitting `UNVERIFIED` candidate rows only.
3. Using `missing_proof` as the blocking field.
4. Keeping candidate detection separate from successful inheritance counting.

CONDITIONAL GO for implementation only if:

1. It reads existing `ReadEvent`, `DerivedActionEvent`, and `WriteEvent` records.
2. It writes candidates only, never promoted events.
3. It refuses any candidate whose `missing_proof` is empty.
4. It reports candidate confidence as plausibility only, never truth.
5. It does not write to Speaker, TinkerDen Intake, doctrine, pearls, capsules, or behavior surfaces.

NO-GO for:

1. Promotion.
2. Doctrine.
3. Assimilation.
4. Auto-creating successful inheritance events.
5. Auto-creating Change Capsules, Pearls, Speaker entries, or behavior receipts.
6. Inferring inheritance from semantic similarity alone.
7. Calling local storage delivery.

## RECEIPT

Created artifacts:

```text
C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\candidate_inheritance_events.json
C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\INHERITANCE_EVENT_CANDIDATE_DETECTOR_RECEIPT.md
```

Proof level:

```text
LOCAL STORAGE: PROVEN
TINKERDEN INTAKE DELIVERY: UNVERIFIED
SPEAKER ASSIMILATION: UNVERIFIED
```
