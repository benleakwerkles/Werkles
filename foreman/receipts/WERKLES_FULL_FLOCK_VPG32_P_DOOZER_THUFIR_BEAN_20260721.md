# VPG32 P Receipt - Doozer, Thufir, and Bean

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260721-051137-ET-BETSY-01`
LEGACY_LABEL: `VPG32`
ORDINAL_CLAIM: `NONE`
PACKET: `foreman/handoffs/outbox/TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_QC_RELEASE_CONFIDENCE_VPG32_20260721.md`
PULLED_BY: `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`

## Exactly two selected ideas

1. Add a local-only candidate attestation and read-only verifier binding base SHA, exact dirty path set, file hashes, normalized candidate digest, installed framework versions, build ID, and executed QC results.
2. Replace the deprecated interactive `next lint` script with a deterministic ESLint 9 flat-config gate over the current Next/React candidate surface, plus a fail-closed lint-gate regression.

## Verification carried with G

The final QC also runs the built candidate locally and probes recommendation/profile pages plus the closed intake, saving, and personal-route boundaries. That runtime smoke verifies these two ideas; it is not an additional product idea.

## Evidence

- Current VPG31 PASS prose is not bound to the dirty files and can survive untracked drift.
- `npm run lint` currently invokes deprecated `next lint` without configuration and cannot produce a noninteractive verdict.
- Next 15.5.18 and React/ReactDOM 19.2.6 are installed; the focused VPG31 guards, build, route guard, and release-integrity smoke otherwise pass.
- Stale VPG8/VPG17/VPG24 assertions were classified instead of being mislabeled as current product failures.

PULL COMPLETED
