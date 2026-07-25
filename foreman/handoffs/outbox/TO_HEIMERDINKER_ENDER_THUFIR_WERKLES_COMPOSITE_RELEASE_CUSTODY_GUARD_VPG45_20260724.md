# VPG45 - Composite Release Custody Guard

PACKET_ID: `TO_HEIMERDINKER_ENDER_THUFIR_WERKLES_COMPOSITE_RELEASE_CUSTODY_GUARD_VPG45_20260724`
STATUS: `COMPLETED_LOCAL_RELEASE_STOP`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `Ender@Betsy`, `Thufir@Betsy`
INTEGRATION_OWNER: `Heimerdinker@Betsy`
PUSH_OWNER: `Heimerdinker@Betsy`
CYCLE_ID: `WERKLES-FLOCK-20260724-221246-ET-BETSY-01`
LEGACY_LABEL: `VPG45`
ORDINAL_CLAIM: `NONE`
SOURCE_COMMIT: `67c38ace103ba5f1ba473b984c91e243d9120630`
EXECUTION_BRANCH: `codex/werkles-vpg31-20260721`
EXECUTION_CONTEXT: `CODEX_LOCAL on local BETSY Windows`

## User story

Before any future Production deploy or alias mutation, one deterministic pre-mutation decision must bind the exact branch, HEAD, candidate and current Production deployments, rollback, aliases, cycle, J receipt, durable Human Gate approval, release-integrity evidence, and Harvey disposition. Missing or inconsistent proof must return one explicit `STOP`.

Flow: `local candidate identity + release evidence + approval/J/Harvey custody -> one composite evaluator -> PASS or exact STOP reasons`, with no live mutation in this cycle.

## P

Each addressed seat independently performs local hands readback, then pulls this packet, VPG43-VPG44 release receipts, current Flock state, all deploy/release/cycle/J/Harvey guards, approval-log shape, current dirty ownership, and environment names only.

Each seat returns exactly two strongest ideas before G. No G work is credited during P.

## G

Each addressed seat executes exactly two ideas and returns a seat receipt.

- Heimerdinker owns the smallest composite evaluator/CLI contract and integration.
- Ender owns a positive/negative adversarial smoke matrix and deterministic current-state execution.
- Thufir owns authorization/custody bypass analysis and proof that no independent sub-guard PASS can authorize mutation.

Maximum two repair attempts per failed proof.

## Bounds

- The composite guard is evidence-only and pre-mutation. It must not deploy, alias, promote, change environment, read secret values, or open a Human Gate.
- Do not create or modify a live GitHub/Vercel workflow in this cycle.
- No J, stage, commit, push, PR, merge, Preview, deployment, Production, provider/LLM, SQL/schema/RLS/data mutation, saving/Tier B, intake opening, payments, browser/cursor control, infrastructure, RustDesk, Mouse Without Borders, or machine-control action.

## Completion condition

All three seats execute exactly two ideas; token-only/stale/wrong-branch/wrong-commit/wrong-deployment/missing-J/stale-approval/unresolved-Harvey/rollback-confusion cases fail closed; one complete synthetic fixture passes; current real local state returns a truthful `STOP`; focused tests and receipts pass.
