# Matching Ranking + Dedupe — V/P/G Cycle 2 Receipt

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Commit at start: `a838d2c`

## Packets

- `foreman/handoffs/outbox/TO_HEIMERDINKER_MATCHING_GOLDEN_ASSERTIONS_VPG2_20260710.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_MATCHING_RANKING_DEDUPE_VPG2_20260710.md`

Both packets were created, read back, and executed locally.

## Changes

### Ranking

`lib/matching/score-paths.ts`

- Capital-seeking reads retain `verify_proof` score 65.
- Low-confidence non-capital reads retain proof-first score 55.
- Medium/high-confidence non-capital reads keep proof visible at 35, allowing directly evidenced low-risk paths to lead.
- No public or LLM feature flag changed.

### Not-match deduplication

`lib/matching/not-match.ts`

- Disqualifications are deduplicated by recommendation kind.
- Distinct overlapping reasons are combined instead of producing duplicate path entries.
- Outcome and headline counts use the deduplicated set.
- Proof-only behavior remains intact.

### Golden smoke assertions

`scripts/foreman/test-matching-shadow-smoke.Inner.mjs`

- Preserved the pre-existing automatic local/live origin selection.
- Local smoke now reads back the exact newly generated run IDs.
- It asserts expected top eligible path, training-scenario partner suppression, and unique disqualification kinds.

## Local semantic smoke

OVERALL: `PASS — 7/7`

| Scenario/check | Result | Evidence |
|---|---|---|
| Capital POST | PASS | `shadow_20260710192237_acfaf917` |
| Job POST | PASS | `shadow_20260710192237_2ed2a5cc` |
| Training POST | PASS | `shadow_20260710192237_86feedf4` |
| Capital semantic | PASS | top `verify_proof` |
| Job semantic | PASS | top `find_better_job` |
| Training semantic | PASS | top `get_training`; `find_partner` suppressed; disqualifications unique |
| Operator shadow page | PASS | HTTP 200 / expected copy present |

Machine-readable receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`

## Static check

`npm.cmd run typecheck` exit: `2`  
Matching-path error count: `0`

The only reported errors are the known out-of-lane Harvey mobile dependency gaps:

- `expo-status-bar`
- `react-native`
- `@expo/vector-icons`

No Harvey file or dependency was changed.

## Boundaries

- Production was not called.
- No deploy, push, merge, SQL, secret, production mutation, public flip, or LLM enable occurred.
- The existing persistence repair and unrelated dirty work were preserved.

## Status

`DONE_LOCAL — READY_FOR_REVIEW, NOT READY_FOR_PUBLIC_FLIP.`

Next technical step is an approved clean build/deploy lane followed by live smoke. Durable production persistence remains unresolved because serverless temporary storage is writable but ephemeral and instance-local.
