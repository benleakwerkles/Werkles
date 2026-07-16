# Autonomous Matching Preview / Production Comparison — VPG9

Mode: read-only surface verification
Methods: Vercel inspect + GET only
Writes, saves, intake submissions, SQL, deploys, aliases, flags, and database mutations: `NONE`

## Preview proof

- URL: `https://werkles1-e0mx3mn0y-werkles.vercel.app/bellows/recommendations`
- Deployment id: `dpl_GDz3JHVc1uT43E3mK9Hf5WggNwtU`
- Source commit: `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d`
- Branch ref: `maker/site-g-20260703`
- State: `READY`
- HTTP: `200`
- Stored Vercel bypass used: `YES`
- Secret printed: `NO`
- Response body printed or persisted: `NO`
- Example-only label: `YES`
- Exact example/account-boundary sentence: `YES`
- Rules score: `YES`
- Exact non-probability / eligibility / outcome limit: `YES`
- Save-closed message: `YES`
- All three recommendation actions disabled in rendered HTML: `YES` (`3`)
- Empty-intake and empty-options messages: `YES`
- Latest-intake marker: `NO`
- Packet-id marker: `NO`
- Confidence label absent: `YES`

## Production proof

- URL: `https://werkles.com/bellows/recommendations`
- Deployment id: `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi`
- Source commit: `92a30814a244fd99a3df0fd334103f984431a76c` (durable go-live receipt; Vercel API SHA unavailable)
- Alias freshly confirmed: `werkles.com`
- State: `READY`
- HTTP: `200`
- Example-only label: `NO`
- Exact example/account-boundary sentence: `NO`
- Rules score: `NO`
- Exact non-probability / eligibility / outcome limit: `NO`
- Save-closed message: `NO`
- All three recommendation actions disabled in rendered HTML: `NO` (`0`)
- Empty-intake and empty-options messages: `NO`
- Latest-intake marker: `YES`
- Packet-id marker: `NO`
- Confidence label present: `YES`

Verdict: `PREVIEW_PASS / PRODUCTION_DIVERGED_AS_EXPECTED`

## Post-deploy smoke order

Run only after the production deployment is Ready:

1. GET `/bellows/recommendations`; require `200`.
2. Require the example-only label, Rules score, exact save-closed explanation, and all three recommendation action controls disabled. The text `Save this option` is expected on a disabled button and is not, by itself, active-save evidence.
3. Require the exact example/account-boundary sentence and exact non-probability / eligibility / outcome limit; require the old Confidence label to be absent.
4. Require the two empty-state messages and both latest-intake and packet-id markers absent. Report booleans only; do not print the body.
5. Only after exact deployment/source identity and steps 1–4 prove the new build, capture a body-free GET hash, POST an inert empty body to `/api/bellows/recommendations/packet`, require `403`, then require the GET hash to remain unchanged. This ordering prevents exercising the older write-capable route by mistake; the source-bound focused test must already prove the target handler has no write path.
6. GET `/operator/matching/shadow`; require production denial (`404`).
7. Confirm source flags remain public `true` and LLM translation `false`; do not change environment or storage settings.

## Rollback

Rollback target: `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi` / `https://werkles1-3z6a4fvfa-werkles.vercel.app`.

This is an availability rollback only. It reintroduces the pre-VPG8 global/latest read boundary and must not be described as privacy-safe.

Rollback immediately if the new Production deployment is not Ready, any marker check fails, the save route does not return `403`, an internal route becomes public, or public/LLM flag invariants change.

`COMPLETED — GET-ONLY PREVIEW/PRODUCTION TRUTH PROVEN AND DEPLOY SMOKE ORDER LOCKED`
