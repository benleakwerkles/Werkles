# VPG42 Preview / Production Acceptance Card

STATUS: `COMPLETED`
CYCLE_ID: `WERKLES-FLOCK-20260724-145708-ET-BETSY-01`

## Testable now on protected Preview

Preview: `https://werkles1-hxw3gmw0b-werkles.vercel.app`

- Public entry and “See the worked example”
- Bellows recommendations with the Squibb guide
- Recommendation-bound Profile Builder fast lane
- Public Test Data Notice
- Closed boundaries: anonymous personal `401`, saving `403 Blocked`, intake `503 Closed`

The Preview is protected by Vercel Login. It is READY and testable by a Vercel-authenticated operator, but it is not public.

## Current `werkles.com`

- `/`: `200`
- `/dashboard/profile`: `200`
- `/bellows/recommendations`: `404`
- `/bellows/intake`: `404`
- `/api/bellows/recommendations/personal`: `404`
- `/harvey`: `200`
- `/api/harvey/knock`: `401 HARVEY_PRIVATE_SESSION_REQUIRED`

Production is Harvey commit `3998101aed1835e7478a83cc44bd823502676648`, not the VPG41 candidate.

## Still intentionally closed

Saving/Tier B, intake writes, anonymous personal delivery, providers/LLM, payments, schema/data mutation, and introductions remain closed.

## Launch risks

- Raw promotion replaces the current Harvey build and removes 37 Harvey app/API paths.
- Candidate and Production diverge by 10 Production-only and 95 candidate-only commits.
- Fresh `npm audit --omit=dev`: 3 high, 0 critical; fixes available.
- Candidate pages remain `noindex`, appropriate for a public test but not a discoverability launch.

COMPLETED
