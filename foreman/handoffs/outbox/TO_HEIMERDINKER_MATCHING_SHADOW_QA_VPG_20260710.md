# TO HEIMERDINKER — Matching Shadow QA V/P/G

| Field | Value |
|---|---|
| Packet | `TO_HEIMERDINKER_MATCHING_SHADOW_QA_VPG_20260710` |
| From | Ben, via V/P/G command |
| To | Heimerdinker / Direwolf Dink@Betsy |
| Lane | Werkles.com G — matching shadow only |
| Repo | `C:\Users\Ben Leak\github\Werkles` |
| Branch | `maker/site-g-20260703` |
| Parent | `TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710` |

## Mission

Turn the successful localhost smoke into a human-readable shadow QA verdict. Inspect the actual persisted runs, not only HTTP status.

## Inputs

- `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`
- `data/matching/shadow-runs.jsonl`
- Run IDs:
  - `shadow_20260710171419_df2a3142`
  - `shadow_20260710171419_3c2341b9`
  - `shadow_20260710171419_18dd98ab`

## Required review

For each scenario record:

- stated need and Layer 0 translation
- not-match outcome and disqualified paths
- top two eligible paths and scores
- false positive
- false negative
- missing silence
- verdict: `GOOD`, `TUNE`, or `BROKEN`

Specifically test whether the global `verify_proof` score of 65 crowds out the scenario-specific path even when Layer 0 correctly identifies job change or training.

## Artifact

Create `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_20260710.md`.

## Boundaries

- Do not flip public or LLM flags.
- Do not deploy, push, merge, apply SQL, or mutate production data.
- Do not claim public readiness from localhost proof.
- Preserve pre-existing dirty work.

## Stop condition

Stop after the QA receipt names per-scenario verdicts, false positives/negatives, Maker tuning targets, and an explicit public-flip recommendation.

