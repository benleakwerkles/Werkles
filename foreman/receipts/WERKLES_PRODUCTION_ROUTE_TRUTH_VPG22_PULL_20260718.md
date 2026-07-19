# VPG22 Pull Receipt — Production Route and Trust Truth

STATUS: `COMPLETED`
PULLED_BY: `Heimerdinker@Betsy`
PACKET: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PRODUCTION_ROUTE_TRUTH_VPG22_20260718`

## Latest release/trust state

- Former live deployment `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` was `Ready` but incomplete: nested Bellows routes returned `404` and the artifact exposed only 209–214 outputs.
- Clean VPG21 Preview `dpl_EBAosA4GgvbUxDrubKcL34mRuAGa` was `Ready`, exposed 366 outputs, and returned `200` for both missing routes.
- Earlier Flock review correctly warned that open unauthenticated intake persistence would be unsafe for public personal-data testing.
- Current VPG21 source resolves that release boundary: `BELLOWS_INTAKE_SUBMISSION_OPEN=false` and `DISCOVERY_INTAKE_SUBMISSION_OPEN=false`; both routes return before parsing or storage.

## Pulled recommendation

Use a clean Production-target build, then fail closed: example-only anonymous recommendation, intake writes unavailable, recommendation saving unavailable, personal delivery unauthorized when signed out, and operator Matching hidden.
