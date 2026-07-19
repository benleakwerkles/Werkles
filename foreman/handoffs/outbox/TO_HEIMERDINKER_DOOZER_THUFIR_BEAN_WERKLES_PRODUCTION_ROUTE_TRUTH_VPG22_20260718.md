# VPG22 — Production Route and Trust Truth

PACKET_ID: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PRODUCTION_ROUTE_TRUTH_VPG22_20260718`
STATUS: `CLAIMED`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`
EXECUTION_OWNER: `Heimerdinker@Betsy`
SOURCE: `codex/werkles-full-flock-vpg21-20260718@d914822`
EXECUTION_BRANCH: `codex/werkles-public-test-vpg22-20260718`

## Operator direction

Ben explicitly authorized Production/public testing in the VPG22 command recorded in `foreman/gates/APPROVAL_LOG.md`.

## Pulled state

- Current Production deployment `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` is Ready but incomplete: the nested Bellows routes are `404` and the artifact has only 209 output items.
- Clean VPG21 deployment `dpl_EBAosA4GgvbUxDrubKcL34mRuAGa` is Ready with 366 output items and both nested routes return `200`.
- VPG19 owner binding, VPG20 recommendation continuity, and VPG21 auth single-flight/recovery are the current trust baseline.

## Two ideas to execute

1. Replace the incomplete Production artifact with a clean Production-target build from the verified VPG21 line, then compare route availability and build output against the candidate.
2. Run a fail-closed trust smoke after alias cutover: public routes stay public, operator/member-only surfaces do not become anonymous data paths, and the prior Production deployment remains the documented rollback target.

## Acceptance

- Deployment source and target are unambiguous and reproducible.
- Nested Bellows routes no longer return `404` on `werkles.com`.
- No secret values, member data, provider calls, or documents are printed or persisted by verification.
- Operator/API checks return a denial, redirect, or not-found response when anonymous.
- Receipt records checks, any residual risk, and the exact rollback command/target.
