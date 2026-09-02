# Werkles source-bound candidate regression evidence — 2026-08-29

Candidate content digest: `e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7`

This evidence binds the completed local regression to that exact candidate digest. Any candidate byte change invalidates this binding and requires the audit, packaging dry run, regression, and independent seal to be repeated.

- 40/40 receipt-bound M2-M9 plus BVPGM M3-M13 contracts: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- Local HTTP route spine: 10/10 PASS
- Full local release smoke: 18/18 PASS
- Next production build route enumeration: 100 routes
- Match Deck → Formation → synthetic shared action → Personal Bellows → Crucible: PASS
- Formation desktop and mobile legibility/overflow walk: PASS
- Candidate packaging: 301 exact paths; 293 changed payload paths; 8 baseline-bound paths; zero contamination; zero missing; zero dependency leaks; real index untouched; zero real staged paths
- Candidate binary patch SHA-256: `ffeaaed3ecf6663a059b6bd589ddff3c79301df5dad8e0c182b8bc982563a373`

The unapplied migration `supabase/migrations/20260820073346_member_concierge_intakes.sql` remains blocked schema and outside the candidate. No provider activation, secret, payment, schema/RLS, production-data mutation, or internal relay/control-plane publication is included.

Machine-audit command:

```text
$env:WERKLES_RELEASE_DATE='20260829'; node scripts/foreman/bvpgm-release-candidate-audit.mjs --write
```
