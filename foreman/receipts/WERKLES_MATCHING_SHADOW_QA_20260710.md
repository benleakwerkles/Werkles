# Matching Shadow QA — 2026-07-10

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Commit at review start: `a838d2c`  
Site: `http://localhost:3000`  
Parent packet: `TO_HEIMERDINKER_MATCHING_SHADOW_QA_VPG_20260710`

## Mechanical smoke

- OVERALL: `PASS`
- Receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`
- Three discovery POSTs returned HTTP 200 with non-null `shadow_run_id`.
- `/operator/matching/shadow` returned HTTP 200.
- This proves the local pipeline and review route execute. It does not prove the current production deploy.
- A post-build revalidation also passed with runs `shadow_20260710181520_453a8fde`, `shadow_20260710181520_9d5d3101`, and `shadow_20260710181520_46bb2b14`. The scenario review below remains anchored to the original named runs so its evidence is stable.

## Human QA summary

OVERALL: `TUNE`

Layer 0 and not-match correctly identify the scenario structure, but the global `verify_proof` score of 65 wins all three runs. That makes the delivered top recommendation less specific than the translation immediately above it in the job and training scenarios.

## Scenario 1 — Capital + partner

- `shadow_run_id`: `shadow_20260710171419_df2a3142`
- Stated need: “I need money and a partner.”
- Layer 0 translated need: proof and sizing may be nearer than a person or check.
- Layer 0 confidence: `medium`
- Not-match: `proceed`
- Disqualified: `raise_capital`, `stage_intro_candidate`
- Top eligible paths: `verify_proof` 65; `find_credit_union` 42
- False positive: none material; proof-first is appropriate for an idea with no customers.
- False negative: `find_partner` remains eligible at 38 despite the translation saying a person may be the symptom. It did not win, but the guard is weaker than the prose.
- Missing silence: no. The intake is detailed enough to proceed.
- Verdict: `GOOD`, with a partner-guard tuning note.

## Scenario 2 — Job change

- `shadow_run_id`: `shadow_20260710171419_3c2341b9`
- Stated need: “I need a better job.”
- Layer 0 translated need: employment or role change is central.
- Layer 0 confidence: `medium`
- Not-match: `proceed`
- Disqualified: `stage_intro_candidate`
- Top eligible paths: `verify_proof` 65; `find_better_job` 40
- False positive: `verify_proof` as the top delivered path. Nothing in this intake makes proof verification more useful than an employment path.
- False negative: `find_better_job` is detected but suppressed to runner-up by the unconditional proof score.
- Missing silence: no. The engine had enough job, schedule, geography, and application-history evidence.
- Verdict: `TUNE`

## Scenario 3 — Training vs partner

- `shadow_run_id`: `shadow_20260710171419_18dd98ab`
- Stated need: “I need a partner or I need training — not sure which.”
- Layer 0 translated need: skill reps or systems may be nearer than co-ownership.
- Layer 0 confidence: `medium`
- Not-match: `proceed`
- Disqualified: `find_partner`; `stage_intro_candidate` appears twice from overlapping guards.
- Top eligible paths: `verify_proof` 65; `get_training` 36
- False positive: `verify_proof` as the top delivered path; the intake explicitly names licensing and estimating skill gaps.
- False negative: `get_training` is correctly detected but does not become the recommendation.
- Missing silence: no. The engine correctly suppressed a blind partner match.
- Verdict: `TUNE`

## False positives for Maker

1. Unconditional `verify_proof` dominance produces the same generic top path across structurally different scenarios.
2. The job scenario recommends proof verification above the directly evidenced employment path.
3. The training scenario recommends proof verification above the directly evidenced licensing/training path.
4. `stage_intro_candidate` is duplicated in the training scenario’s disqualification list.

## False negatives for Maker

1. Scenario-specific paths are detected but do not receive enough weight to win when Layer 0 confidence is medium and the evidence is direct.
2. In the capital-plus-partner scenario, the partner path is not disqualified even though Layer 0 explicitly frames the person as a possible symptom.

## Tuning target

- Make `verify_proof` conditional or reduce its base dominance when a directly evidenced, non-risky path has medium-confidence Layer 0 support.
- Preserve proof-first behavior for money, equity, introductions, and thin-evidence scenarios.
- Deduplicate not-match disqualifications by path kind and reason before delivery.
- Add golden assertions for the intended top path:
  - capital + partner → `verify_proof`
  - job change → `find_better_job`
  - training vs partner → `get_training`

## Blockers

- Production smoke still fails until the persistence fix is deployed and the operator route is present in the deployed build.
- No production QA or public-delivery claim is supported by this localhost receipt.

## Recommend public flip?

`NO — NOT YET.` Keep shadow mode. Tune scenario-specific ranking, deduplicate guards, mechanically verify the production-safe persistence patch, then rerun localhost and production smoke after an approved deploy.
