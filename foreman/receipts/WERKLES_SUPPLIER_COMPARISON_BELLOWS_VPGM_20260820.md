# Receipt — Supplier Comparison Bellows

**Execution context:** CODEX_LOCAL / Betsy  
**Vision:** `V_HEIMERDINKER_SUPPLIER_COMPARISON_BELLOWS_20260820.md`

## M ideas completed

1. Added a sixth Public Bellows lesson that teaches requirement-first supplier comparison, comparable first-year cost, service/downtime, claim freshness, and paid-placement independence.
2. Added a three-option in-browser comparison card. It calculates only entered costs, copies a working brief, ranks nobody, and saves/sends nothing.
3. Equipment recommendations now route to this lesson instead of ending at a generic planning article.

## Sources used

- Current SBA planning guidance on one-time/monthly costs and comparable vendor/service-provider expense research.
- FTC small-business scam guidance on equipment leasing, pressure, fine print, half-truths, and unsupported savings claims.

## Proof

- Supplier Comparison Bellows smoke — PASS
- Bellows lesson route smoke — PASS
- Assumption Test regression — PASS
- `npm.cmd run typecheck` — PASS
- Browser route loads, inputs work, Copy Comparison Brief confirms, no console error
- Mobile width 390/390; no horizontal overflow

## Boundaries

- No supplier/provider rank, endorsement, persistence, submission, network request, legal/financial advice, or paid-placement claim.
- No SQL, env/secret, deploy, stage, commit, or push action.
