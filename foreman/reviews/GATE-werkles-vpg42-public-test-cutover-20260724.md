# Human Gate - Werkles Public Test Cutover

STATUS: `BLOCKED_CURRENT_PREVIEW_HARVEY_AND_FRESH_RELEASE_BINDINGS`
ORIGINATING_CYCLE: `WERKLES-FLOCK-20260724-145708-ET-BETSY-01`
TRUTH_REFRESH_CYCLE: `WERKLES-FLOCK-20260725-013031-ET-BETSY-01`
TARGET: `werkles.com`
CURRENT_SOURCE_HEAD: `bd24b45d3a01b51ee05c951d5f96e1bac6398686`
CURRENT_PRODUCT_COMMIT: `ba08a444632206e2676df49e175f184ab0c2c2f2`
CURRENT_CANDIDATE_DEPLOYMENT: `NONE_PROVEN`
HISTORICAL_VPG42_DEPLOYMENT: `dpl_9KrWte1jcoMSDVHEXdK2MQg6QhMd` (`STALE_FOR_CURRENT_SOURCE`)
CURRENT_ROLLBACK_BINDING: `STALE_UNVERIFIED`

## Current truth

The VPG42 dependency blocker is solved for the local current candidate: a fresh Production-only audit reports zero findings across 51 Production dependencies.

That does not open this gate. The VPG42 Preview is bound to the older `67c38ace103ba5f1ba473b984c91e243d9120630` candidate. No READY Preview, route matrix, Production alias binding, or rollback binding has been proven for the current source head.

Harvey disposition also remains unresolved. The fail-closed default is preserve Harvey. The current public candidate must not be described as coexistence unless it preserves or relocates Harvey with fresh proof.

## Historical reserved phrase

`APPROVE WERKLES VPG42 PUBLIC TEST CUTOVER - REPLACE HARVEY PRODUCTION`

This phrase is historical and not executable for the current candidate. It cannot bind a different commit, deployment, route matrix, alias state, rollback target, or Harvey decision.

## Required work before any release gate can open

- Choose and prove one Harvey disposition: preserve/reconcile, preserve/relocate, or deliberately replace.
- Build the exact current source and produce a new immutable READY Preview.
- Run the current Preview route, auth, privacy, cache, and unexpected-`5xx` matrices.
- Bind the exact candidate commit, deployment, Production alias owner, current Production deployment, and rollback deployment.
- Re-run the release-integrity and alias guards against those fresh bindings.
- Obtain a separate direct release instruction. VPG47 J and VPG48 VPG do not authorize release.

## Exclusions

No PR, merge, `main` change, Preview creation, deployment, promotion, alias, environment change, Production action, public launch, gate execution, SQL/schema/RLS/data mutation, auth expansion, saving/Tier B, intake opening, providers/LLM, payments, browser/cursor control, or machine control is authorized by this refresh.

Machine truth: `foreman/receipts/WERKLES_VPG48_PUBLIC_CUTOVER_TRUTH_20260725.json`

BLOCKER: `CURRENT_PREVIEW_HARVEY_DECISION_AND_FRESH_RELEASE_BINDINGS_REQUIRED`
