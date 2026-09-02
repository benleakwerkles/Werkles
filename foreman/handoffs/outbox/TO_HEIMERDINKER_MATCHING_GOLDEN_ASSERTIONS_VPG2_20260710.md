# TO HEIMERDINKER — Matching Golden Assertions V/P/G Cycle 2

Packet: `TO_HEIMERDINKER_MATCHING_GOLDEN_ASSERTIONS_VPG2_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Lane: Werkles.com G, matching shadow only

## Mission

Turn the three smoke scenarios into semantic assertions, not merely HTTP checks.

## Golden expectations

- `capital_partner` top eligible path: `verify_proof`
- `job_change` top eligible path: `find_better_job`
- `training_not_partner` top eligible path: `get_training`
- `training_not_partner` must disqualify `find_partner`
- each disqualified path kind must appear at most once
- operator shadow page must still load

## Implementation boundary

Extend the existing dirty `scripts/foreman/test-matching-shadow-smoke.Inner.mjs`; preserve its automatic local/live origin selection. The smoke may read the newly persisted run through the operator page or another local read surface, but it must return evidence in the JSON receipt.

## Stop

Stop after the localhost mule proves all transport and semantic assertions. No production call, deploy, push, merge, public flip, or LLM enable.

