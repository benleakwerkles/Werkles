# VPG27 G Receipt - Public Usability Proof

STATUS: `COMPLETED`
OWNER: `Heimerdinker@Betsy`
PRODUCT_COMMIT: `8df73dc25d90040be3b187a82cc607b56459848c`
CANDIDATE_ATTESTATION: `foreman/receipts/WERKLES_VPG27_CANDIDATE_ATTESTATION_20260719.json`

## Exactly two executed ideas

1. First Weld now states beside collection and on the Public Test Data Notice that Werkles sends the entered ZIP to Zippopotam.us to resolve city, state, latitude, and longitude before saving the profile fields.
2. Release proof now requires the First Weld source route, deployment output, and exact-candidate anonymous `POST /api/onboarding/first-weld = 401` response, with five fail-closed drift cases.

## Proof

- Release guard smoke: PASS, 39 cases; alias guard: PASS, 8 cases.
- Exact release integrity: PASS across 14 checks, 187 app paths, 373 outputs, 7 candidate HTTP boundaries, and 3 audience boundaries.
- Candidate Profile, Privacy, and Onboarding return `200`; First Weld anonymous POST returns exact `401` plus `{error: "Authentication required"}`; provider POSTs remain identical `503` + `no-store` + generic `Closed` envelopes.
- Anonymous exact Preview redirects `302` to Vercel SSO; Production internal page/API samples remain `404` + `no-store` + `noindex`.
- Doozer and Thufir/Bean read-only G reviews: PASS, no blockers.
- Production remains Ready and unchanged at `dpl_BBBNaeGfjnZJXy3FbQVmVjePVgxo`.

No Production, authenticated action, external ZIP lookup, provider, payment, SQL/schema/RLS, or RustDesk action occurred during verification.

COMPLETED
