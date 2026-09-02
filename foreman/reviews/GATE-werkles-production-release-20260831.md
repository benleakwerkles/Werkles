# Tier 1 Gate — Werkles Human-Rhythm Production Release

Status: `APPROVED_BY_BEN__SIGNED_BY_HEIMERDINKER__LADY_JESSICA_SEAL_AND_EXECUTION_OWED`

## Decision

Push, candidate-deploy, smoke, and promote the exact source-bound Werkles
candidate to `werkles.com` after Lady Jessica reproduces the seal.

## Operator acceptance targets

1. The Maria narrative is gone from active application source and reachable UI.
2. Real objects and human spaces relieve dead space selectively, without a
   blanket-photo overcorrection.
3. People, Bellows, and Proof feel like distinct rooms in the same Werkles
   building and palette.
4. Main public-journey copy reads like people talk, not internal Aeye notation.

## Candidate identity

- Baseline commit: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`
- Candidate digest: `c68727d5dac4a72dc0bce922281fcd8813fe101777317b097f73193a0e598c70`
- Inventory: `foreman/releases/WERKLES_BVPGM_RELEASE_CANDIDATE_INVENTORY_20260831.json`
- Candidate files: 304
- Binary patch SHA-256: `2c245d0662ec8009198785b6879143191b9ca228a0ae8b8a8dc62f03573de685`

## Verification so far

- Candidate boundary: PASS; zero unresolved rows and zero dependency leaks.
- Named candidate contracts: 40/40 PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; 100 routes generated.
- Member routes: 10/10 PASS.
- Active Maria source sweep: 0 hits.
- Homepage, Bellows, and Proof rendered desktop checks: PASS; clean console.
- Temporary-index packaging: PASS; 304 exact paths, 296 changed payload paths,
  8 baseline-bound paths, zero contamination, zero missing, real index untouched.

## Blast radius and exclusions

No blocked migration, provider activation, live payment, secret, schema/RLS,
production-data write, LLM enablement, new image generation, or internal legacy
control-plane publication. `/tinkerden` remains a quarantined legacy diagnostic
outside this release.

## Custody and order

- Ben Leak: **APPROVED** by the current explicit BVPGM push instruction.
- Heimerdinker: **SIGNED** for the exact digest and binary-patch hash above.
- Lady Jessica: independently reproduces the exact seal and remains the sole
  stage/commit/push/deploy/promote executor.

Order: exact manifest → temporary-index proof → Lady Jessica seal → one bounded
commit → push → candidate deployment → candidate smoke → manual alias promotion
→ live smoke. A candidate-smoke failure halts before promotion.
