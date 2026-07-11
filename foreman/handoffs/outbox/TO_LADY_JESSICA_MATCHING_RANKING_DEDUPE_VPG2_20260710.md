# TO LADY JESSICA — Matching Ranking + Not-Match Dedupe V/P/G Cycle 2

Packet: `TO_LADY_JESSICA_MATCHING_RANKING_DEDUPE_VPG2_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com G, matching shadow only

## Mission

Encode the tuning list from `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_20260710.md` without weakening proof-first safety.

## Required behavior

1. `verify_proof` remains top for capital + partner with idea-only evidence.
2. Direct medium-confidence job evidence makes `find_better_job` top.
3. Direct medium-confidence training evidence makes `get_training` top.
4. Thin/unclear asks and proof-only outcomes remain proof-first.
5. Not-match output contains at most one disqualification per path kind; combine overlapping reasons rather than emitting duplicates.

## Allowed files

- `lib/matching/score-paths.ts`
- `lib/matching/not-match.ts`
- focused matching smoke/test files
- matching receipts and handoff packets

## Verification

- localhost semantic smoke passes all three golden scenarios
- no matching-path TypeScript errors
- record any unrelated whole-repo blocker separately

## Forbidden

No public/LLM flag changes, deploy, push, merge, SQL, secrets, production mutation, or Harvey edits.

## Stop

Stop after a local receipt proves ranking, dedupe, transport, and operator-page behavior.
