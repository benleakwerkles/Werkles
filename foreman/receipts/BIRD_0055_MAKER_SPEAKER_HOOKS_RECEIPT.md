# BIRD_0055 Maker Speaker Hooks Receipt

PACKET_ID: BIRD_0055_MAKER_SPEAKER_HOOKS
TO: Maker@Betsy
STREAM: INFRASTRUCTURE / GOVERNANCE
STATUS: ARTIFACT
RECEIPT_ID: RECEIPT_BIRD_0055_MAKER_SPEAKER_HOOKS_20260627
TIMESTAMP: 2026-06-27T20:53:00Z

## Artifact

Built deterministic Speaker Git validation hooks.

Created:

- `speaker/bin/speaker-validate.sh`
- `speaker/.husky/pre-commit`

Updated:

- `.husky/pre-commit`

The active root Husky hook now runs the Speaker hook before the Swatter receipt floor.

## Validation Rules

`speaker/bin/speaker-validate.sh` loops through staged files and validates:

- `speaker/receipts/**/*.json`
  - Requires `receipt_id`, `receipt_type`, `timestamp`, `owner`, `status`, and `evidence`.
  - Validates allowed `receipt_type` and `status`.
  - Requires evidence to include `path`, `summary`, or `sha256`.
- `speaker/doctrine/**/*.md`
  - Requires YAML frontmatter.
  - Requires `doctrine_id`, `status`, `source_receipt_id`, and `hash`.
  - Rejects invalid doctrine status.

## Physical Block Proof

Temporary malformed doctrine file staged:

```text
speaker/doctrine/draft/BIRD_0055_MISSING_SOURCE_RECEIPT_PROOF.md
```

The file intentionally omitted `source_receipt_id`.

Terminal output from a real commit attempt:

```text
STAGED_FOR_PROOF:
speaker/doctrine/draft/BIRD_0055_MISSING_SOURCE_RECEIPT_PROOF.md
COMMIT_ATTEMPT_OUTPUT:
SPEAKER VALIDATION ERROR: speaker/doctrine/draft/BIRD_0055_MISSING_SOURCE_RECEIPT_PROOF.md: missing required frontmatter field 'source_receipt_id'
husky - pre-commit script failed (code 1)
```

Result: commit blocked before write.

## Cleanup

The temporary malformed proof file was unstaged and deleted after the failed commit attempt.
