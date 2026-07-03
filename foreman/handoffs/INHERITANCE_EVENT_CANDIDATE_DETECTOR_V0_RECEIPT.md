# INHERITANCE_EVENT_CANDIDATE_DETECTOR_V0 Receipt

Destination: TinkerDen Intake / Speaker

## FILES

- `lib/inheritance-event-candidate-detector.ts`
- `scripts/detect-inheritance-candidates.mjs`
- `foreman/artifacts/inheritance_detector_events.sample.json`
- `foreman/artifacts/candidate_inheritance_events.json`
- `foreman/handoffs/INHERITANCE_EVENT_CANDIDATE_DETECTOR_V0_RECEIPT.md`

## SAMPLE OUTPUT

```json
[
  {
    "artifact_id": "artifact-source-alpha",
    "reader": "Dink@Sally",
    "author": "Petra@Betsy",
    "derived_artifact": "artifact-derived-beta",
    "confidence": 0.85,
    "missing_proof": [
      "read_event_proof",
      "derived_action_event_proof",
      "write_event_proof"
    ]
  }
]
```

## PASS/FAIL

PASS

- Reads `ReadEvent`, `DerivedActionEvent`, and `WriteEvent` records.
- Writes `foreman/artifacts/candidate_inheritance_events.json`.
- Emits only candidates with missing proof.
- Output fields are limited to `artifact_id`, `reader`, `author`, `derived_artifact`, `confidence`, and `missing_proof`.
- Proof-complete candidates are excluded.
- `node scripts\detect-inheritance-candidates.mjs` wrote 1 candidate to `candidate_inheritance_events.json`.
- Output shape check passed: no extra fields, no missing fields, no proof-complete candidates.
- `lib/inheritance-event-candidate-detector.ts` transpiled with no diagnostics.

## BLOCKERS

- No live TinkerDen Intake / Speaker implementation exists in this workspace to receive the file directly.
- No production event log was present locally, so the checked output was generated from the sample event file.
