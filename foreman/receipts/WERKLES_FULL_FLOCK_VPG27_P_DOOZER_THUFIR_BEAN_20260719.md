# VPG27 P Receipt - Doozer / Thufir / Bean

STATUS: `COMPLETED`
OWNER: `Heimerdinker@Betsy`
PULLERS: `Doozer@Betsy`, `Thufir@Betsy`, `Bean@Betsy`
SOURCE: `codex/werkles-vpg27-20260719@821317ccdfde31497e1ab7fac093ea4307e7a727`
PRODUCT_CANDIDATE: `8a8eec62515e097305e1dc55f9ff4fa31ffb4490`
PACKET: `TO_HEIMERDINKER_DOOZER_THUFIR_BEAN_WERKLES_PUBLIC_USABILITY_PROOF_VPG27_20260719`

## Pulled state

- First Weld sends the entered ZIP to `api.zippopotam.us` to resolve city, state, latitude, and longitude before saving, while current collection and privacy copy only says `ZIP-derived location`.
- The VPG26 release contract proves the onboarding page but omits the `/api/onboarding/first-weld` source route, deployment output, and safe unauthenticated action boundary.
- Authentication is checked before request-body parsing, external ZIP lookup, or Supabase mutation, so anonymous `POST /api/onboarding/first-weld` is a safe deterministic `401` candidate proof.
- Exact VPG26 candidate, provider closure, protected-Preview boundary, and Production internal-route denials remain green; Production is unchanged.

## Exactly two strongest ideas returned

1. State the exact First Weld ZIP custody truth beside collection and on the Public Test Data Notice without inventing retention, sale, or compliance claims.
2. Extend immutable release proof to require the First Weld source/output and exact-candidate anonymous `POST = 401` response, with fail-closed smoke coverage.

No files or external state were changed during P.

COMPLETED
