# Human Gate - Werkles VPG42 Public Test Cutover

STATUS: `BLOCKED_TECHNICAL_PRECONDITIONS`
CYCLE_ID: `WERKLES-FLOCK-20260724-145708-ET-BETSY-01`
TARGET: `werkles.com`
CANDIDATE: `67c38ace103ba5f1ba473b984c91e243d9120630`
CANDIDATE_DEPLOYMENT: `dpl_9KrWte1jcoMSDVHEXdK2MQg6QhMd`
ROLLBACK_DEPLOYMENT: `dpl_4Psq6XYTVxrCNSWdTebByJY8LzUn`

## Reserved approval phrase

`APPROVE WERKLES VPG42 PUBLIC TEST CUTOVER — REPLACE HARVEY PRODUCTION`

This is the next Human Gate phrase, but the gate is not open yet.

## Why it is not open

1. The candidate would replace the current Harvey Production build and remove 37 Harvey app/API paths. The phrase explicitly acknowledges that replacement; a preservation/reconciliation build is the alternative.
2. Fresh production dependency audit reports 3 high-severity findings with fixes available. Public promotion is fail-closed until the patched candidate is rebuilt and re-smoked.

## Required preflight before the phrase can execute

- Patch the production dependency findings and produce a new READY Preview.
- Re-run the exact Preview route matrix.
- Re-bind the candidate commit/deployment and rollback deployment.
- Confirm either Harvey route preservation or deliberate replacement.
- Reconfirm Production alias ownership and zero unexpected runtime errors.

## Approved action after preflight

Promote the bound READY candidate to `werkles.com`; run ordered smoke for `/`, `/bellows`, `/bellows/recommendations`, `/dashboard/profile`, `/privacy`, anonymous personal `401`, saving `403`, and intake `503`; immediately roll back on any mismatch or unexpected `5xx`.

## Exclusions

No PR, merge, `main` change, environment change, SQL/schema/RLS/data mutation, auth expansion, saving/Tier B, intake opening, providers/LLM, payments, or infrastructure change.

BLOCKER: `DEPENDENCY_PATCH_AND_HARVEY_CUTOVER_DECISION_REQUIRED`
