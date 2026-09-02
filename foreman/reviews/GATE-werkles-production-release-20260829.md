# Tier 1 Gate — Werkles Weekend Production Release

Status: `APPROVED_BY_BEN__SIGNED_BY_HEIMERDINKER__LADY_JESSICA_SEAL_AND_EXECUTION_OWED`

## Decision

Push, candidate-deploy, smoke, and promote the exact source-bound Werkles candidate to `werkles.com`.

## Candidate identity

- Baseline commit: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Candidate digest: `e9659ca736e470b0cdefa7a5e3d7e591229299fd50ed5c2f5f323b78b44220d7`
- Candidate binary patch SHA-256: `ffeaaed3ecf6663a059b6bd589ddff3c79301df5dad8e0c182b8bc982563a373`
- Exact candidate paths: `301`
- Changed payload paths: `293`
- Baseline-bound paths: `8`
- Inventory: `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260829.json`

## Confidence

`HIGH` on the bounded local candidate. TypeScript and the Next production build pass. All 40 candidate contracts pass. The rendered Match Deck → Formation → Operating Brief → Personal Bellows → Crucible walk passes, including the explicit synthetic-Ghost response boundary. The local production smoke passes 18/18 routes, with 10/10 member routes styled and free of a Next error overlay.

## Blast radius and exclusions

This release updates the public/member Werkles application and its current local practice flows. It excludes 3,773 unrelated dirty-tree paths, 273 unrelated verification paths, and the unapplied `supabase/migrations/20260820073346_member_concierge_intakes.sql` schema artifact. It does not authorize provider activation, live payments, secrets, schema/RLS, production-data writes, an LLM feature, or internal relay/control-plane publication.

## Known limits

- Intake/account persistence that depends on the blocked migration remains unavailable until its separate schema/RLS gate clears.
- Practice Werkle and Personal Bellows artifacts explicitly stored in the browser remain device-local.
- The build ran in the shared canonical tree because the Operator prohibited new environments. A temporary Git index proved the candidate boundary without changing the real index.

## Verification

- Candidate boundary: PASS; zero dependency leaks.
- Temporary-index packaging: PASS; zero contamination; real index untouched.
- Candidate contracts: 40/40 PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; 100 routes generated.
- Local release smoke: 18/18 PASS; member routes 10/10.

## Approval and custody

- Ben Leak: **APPROVED**, recorded in `foreman/gates/APPROVAL_LOG.md` from his explicit push instruction.
- Heimerdinker: **SIGNED** for the exact digest above after regression and packaging proof.
- Lady Jessica: **OWED** an independent exact-candidate review and remains the sole push/deploy executor.

## Deployment order

1. Lady Jessica independently verifies the inventory, digest, binary-patch hash, and exclusions.
2. Assemble and commit only the exact candidate manifest; verify zero staged contamination.
3. Push `maker/site-g-20260703`.
4. Create a candidate production deployment without first moving the public alias.
5. Run `werkles-production-release-smoke.mjs --internal-mode blocked` against the candidate URL.
6. Promote the passing candidate to `werkles.com` and repeat the smoke.
7. If either smoke fails, retain or restore the prior Ready production deployment.

No additional Operator confirmation is required for this exact candidate. Any digest change requires a reseal, not a new broad permission request.
