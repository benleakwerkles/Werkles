# VPG22 — Werkles Public-Test Release

PACKET_ID: `TO_HEIMERDINKER_LADY_JESSICA_ENDER_WERKLES_PUBLIC_TEST_RELEASE_VPG22_20260718`
STATUS: `CLAIMED`
FROM: `Heimerdinker@Betsy`
TO: `Heimerdinker@Betsy`, `LadyJessica@Betsy`, `Ender/Doozer@Betsy`
EXECUTION_OWNER: `Heimerdinker@Betsy`
SOURCE: `codex/werkles-full-flock-vpg21-20260718@d914822`
EXECUTION_BRANCH: `codex/werkles-public-test-vpg22-20260718`

## Operator direction

Ben authorized public testing and Production execution with:

> V, P, G, Get back to the Werkles.com work. Make it actually work, stop stopping at all these pussyfooting beating around the bush, a stitch in time saves nine, "Human Gates" the site can go public, people need to test it. Go.

## Pulled state

- VPG19–VPG21 are complete on the clean Flock line.
- The clean VPG21 Preview returns `200` for `/`, `/bellows`, `/bellows/intake`, `/bellows/recommendations`, `/login`, `/signup`, and `/auth/callback`.
- Production returns `404` for `/bellows/intake` and `/bellows/recommendations`; the deployed artifact has drifted from the clean source.
- The dirty `maker/site-g-20260703` checkout is excluded from this release.

## Two ideas to execute

1. Deploy the clean VPG21 source to Production so `werkles.com` contains the complete tested route artifact; do not rebuild from or stage the dirty maker checkout.
2. Prove the public tester doorway end to end: anonymous recommendation stays example-only, authentication remains available, Profile Builder remains the member setup path, and personal results remain authenticated and owner-bound.

## Acceptance

- Production build finishes Ready and owns the `werkles.com` alias.
- The seven public/auth routes above return their intended non-error status.
- Anonymous visitors cannot receive a personal recommendation or another member's result.
- Intake remains an honest closed walkthrough; LLM, saving, Tier B, SQL, and schema changes remain out of scope.
- Exact deployment ID, source commit, route results, and rollback target are recorded in a completion receipt.
