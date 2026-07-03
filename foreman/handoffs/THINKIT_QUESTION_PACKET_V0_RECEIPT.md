# THINKIT_QUESTION_PACKET_V0 Receipt

## SCHEMA

```json
[
  {
    "question_id": "string",
    "question": "string",
    "owner": "string",
    "created_at": "ISO-8601 timestamp",
    "status": "OPEN | WORKING | ANSWERED | SUPERSEDED"
  }
]
```

Allowed statuses:

- `OPEN`
- `WORKING`
- `ANSWERED`
- `SUPERSEDED`

## SAMPLE QUESTION

```json
{
  "question_id": "thinkit-q-0001",
  "question": "What proof is required before a packet can be marked complete?",
  "owner": "Dink@Sally",
  "created_at": "2026-06-23T20:36:46.493Z",
  "status": "OPEN"
}
```

## PASS/FAIL

PASS

- Output written to `foreman/artifacts/thinkit_questions.json`.
- Shape check passed: each question has exactly `question_id`, `question`, `owner`, `created_at`, and `status`.
- Status check passed: sample uses `OPEN`, one of `OPEN`, `WORKING`, `ANSWERED`, `SUPERSEDED`.
