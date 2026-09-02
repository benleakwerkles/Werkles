# Heimerdinker BVPGM — Real Business Opportunity Layer M1

Date: 2026-09-01  
Execution context: CODEX_LOCAL on BETSY  
Canonical repo: `C:\Users\Ben Leak\github\Werkles`

## Product result

Werkles now has a production-shaped opportunity contract for non-human business help: suppliers and equipment, professional help, meeting places, commercial space, training, banking/public funding, customer channels, and permits/government help.

The first reviewable walkthrough is a Decatur landscaping case containing five source-checked paths:

1. The Home Depot Tool Rental — Wages Drive
2. Decatur CoWorks
3. City of Decatur business-license path
4. UGA SBDC — DeKalb
5. Delta Community Credit Union — Decatur/business banking

Every card separates sourced facts, Werkles reasoning, unknowns, sponsorship status, freshness, and the outbound-action boundary. The commercial-space panel explicitly refuses to invent vacancy, zoning, availability, or budget fit before a licensed current feed exists.

## Infrastructure built

- Opportunity candidate, fact, category, provider-stage, query, sponsorship, and outbound-action contracts.
- Query planner that uses deliberately supplied project/location/specifications and excludes budget from provider queries.
- Candidate safety guard rejecting unsupported promotional, eligibility, verification, zoning, vacancy, and budget-fit claims.
- Provider catalog for Google Places, SBA Lender Match, NCUA locator, Yelp (not connected), and a licensed commercial-space feed (not selected).
- Server-only Google Places adapter with a minimal field mask and `cache: no-store`.
- `POST /api/opportunities/search`, fail-closed behind `WERKLES_OPPORTUNITY_LIVE_SEARCH=enabled` and `GOOGLE_PLACES_API_KEY`.
- Source-backed walkthrough fixture and reusable opportunity-card surface.
- Ghost-walkthrough doors from Workshop, Personal Bellows, and shared Werkle formation.

## Actual CBCC state

- Skybro: packet posted to the exact existing task; a response appeared, but it was not accepted as a validated receipt. It omitted the requested execution context/evidence basis and introduced unsupported Decatur claims. Useful general product ideas were treated as advisory only.
- Bean: packet posted to the exact existing task; direct nudge posted; no terminal response observed. Status is **posted, no response**, not receipt.
- Ender, Lady Jessica, Thufir, Petra: focused packet files exist in the canonical outbox. No claim of successful delivery or response is made in this receipt.
- No Codex subagents, replacement chats, personas, or environments were created.

## Sources used

- Google Places Text Search and policy documentation
- U.S. SBA Lender Match
- NCUA Credit Union Locator
- Yelp Business Search documentation
- City of Decatur business-license guidance
- The Home Depot Wages Drive rental page
- Decatur CoWorks official contact page
- UGA SBDC DeKalb location page
- Delta Community Credit Union branch, business-banking, and eligibility pages

## Verification

- `npx --yes tsx scripts/foreman/business-opportunity-contract-smoke.ts` — PASS
- `npm run typecheck` — PASS
- Walkthrough route `GET /draft-reviews/business-opportunities` — HTTP 200
- Rendered route — five cards, meaningful content, no framework overlay, no console warnings/errors
- Dark-panel text contrast was visually checked, found overridden by global styles, repaired, and rechecked via computed color
- Disabled live search `POST /api/opportunities/search` — HTTP 503 as designed

## Boundaries still closed

- No provider key or billing was activated.
- No provider result was persisted.
- No commercial-listing marketplace was scraped.
- No named space was claimed vacant, zoned, available, or in budget.
- No result was labeled best, recommended, eligible, approved, or verified.
- No push or deploy was performed.

