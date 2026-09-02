# Werkles source-bound candidate regression evidence — 2026-08-31

Candidate content digest: `c68727d5dac4a72dc0bce922281fcd8813fe101777317b097f73193a0e598c70`

This evidence binds the local regression to that exact candidate digest. Any
candidate byte change invalidates this binding and requires the audit,
packaging dry run, regression, and independent seal to be repeated.

- 40/40 receipt-bound M2-M9 plus BVPGM M3-M13 contracts: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- Local HTTP route spine: 10/10 PASS
- Member-product local release smoke: 10/10 PASS
- Next production build route enumeration: 100 routes
- Active Maria source sweep across `app`, `components`, and `lib`: 0 hits
- Added object assets: 3/3 present
- Homepage, Bellows, and Proof desktop render/console inspection: PASS
- Match Deck → Formation → synthetic shared action → Personal Bellows → Crucible: PASS
- Formation desktop and mobile legibility/overflow walk: PASS
- Candidate packaging: 304 exact paths; 296 changed payload paths; 8 baseline-bound paths; zero contamination; zero missing; zero dependency leaks; real index untouched; zero real staged paths
- Candidate binary patch SHA-256: `2c245d0662ec8009198785b6879143191b9ca228a0ae8b8a8dc62f03573de685`

The full local diagnostic smoke was 17/18 because the fossilized `/tinkerden`
control-plane page returns 500. That route is excluded from the member-product
candidate and remains quarantined under the PookaKind/Harvey conservation
decision. It is not being repainted or smuggled into this release.

## Route-signature matrix

| Route | Room | Visible signature | Visual relief |
|---|---|---|---|
| `/` | Home | copper header rail; warm paper | restrained van/tool/pegboard interlude |
| `/spark`, `/space` | Story | copper story wash and stable header | documentary person or real place |
| `/formation` | People | teal room rail inside the Werkles palette | partners working over a plan |
| `/proof` | Proof | violet rail and precise gallery rhythm | finished work, shop, plan details |
| `/bellows`, `/bellows/intake`, `/bellows/recommendations`, `/bellows/personal` | Bellows | copper editorial rail and warm workshop wash | Squibb, desks, tool-at-rest, selected documentary stills |
| `/dashboard/intros`, `/dashboard/werkles/formation` | People | teal room rail and social-space wash | people comparing plans and a shared workspace |
| `/dashboard/profile` | People | stable member header; About Me remains personal | one documentary profile scene |
| `/dashboard/crucible` | Proof | violet header rail; precise check hierarchy | existing Crucible visual band |
| `/dashboard/blueprints` | Work | brown/copper work rail | van at dawn |

This is deliberately selective. Not every route receives an image, and no new
image generation or spend occurred. The section signature comes from hierarchy,
rail, wash, and content rhythm—not from turning Werkles into separate mini-sites.

## Named regression set

The exact 40 `candidate_verification` paths in
`WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260831.json` were executed one by
one with `node` or `tsx`; every named path returned exit 0. This includes the
Bellows device-draft/browser contracts, copy rendered smoke, Match Deck and
Formation continuity, Crucible provider journey, privacy/data-minimization,
tech-stack catalog/ledger consistency, Personal Bellows continuity, and the
Formation desktop/mobile hostile and legibility walks.

## Exclusions and rollback

- `supabase/migrations/20260820073346_member_concierge_intakes.sql` remains
  `blocked_schema` and outside the candidate.
- No provider activation, secret, payment, schema/RLS, production-data mutation,
  internal relay publication, or new image generation is included.
- Rollback: revert the single candidate commit and re-point the production alias
  to the pre-promotion Ready deployment.
- Candidate smoke must pass before alias promotion; failure halts promotion.

Machine-audit command:

```text
$env:WERKLES_RELEASE_DATE='20260831'; node scripts/foreman/bvpgm-release-candidate-audit.mjs --write
```
