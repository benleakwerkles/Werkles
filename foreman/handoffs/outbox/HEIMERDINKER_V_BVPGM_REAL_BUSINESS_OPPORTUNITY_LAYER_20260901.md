# Heimerdinker V — Real Business Opportunity Layer

**Checkpoint:** Turn Werkles recommendations into source-backed business opportunities that can help a member now, even when no real member match exists.
**From:** Heimerdinker@Betsy / Werkles Foreman
**Date:** 2026-09-01
**Status:** V authored; review-first before member-facing implementation.

## Product insight

Ghost members let the Operator test human matching. Werkles has not yet built the equally important non-human side of matching: real suppliers, equipment sources, professional services, meeting places, training, funding paths, business locations, trade resources, and other useful opportunities.

The product should be able to say, honestly:

> You are forming a landscaping Werkle near Decatur. Here are nearby suppliers, an official lender-discovery path, and current location searches worth reviewing. Here is why each appeared, what is still unverified, and the next question to ask.

This belongs across Bellows, Workshop, and shared Werkles, but must be one reusable system—not three copied catalogs.

## Existing seam

The current recommendation engine already has kinds such as:

- `find_equipment`
- `find_banker`
- `find_credit_union`
- `relocate`
- `get_training`
- `raise_capital`

Each solution path already names comparison criteria and currently says no provider is ranked. The new opportunity layer should fulfill that comparison contract when source evidence exists.

## Proposed product contract

### Input context

Use only context the member deliberately supplied or created:

- business/industry description;
- city, state, ZIP, and willing travel radius;
- recommendation kind and chosen next move;
- named budget ceiling or price range, when supplied;
- timing, specifications, constraints, and shared Werkle decisions;
- categories the member asks Werkles to search.

Do not infer protected traits, wealth, creditworthiness, precise live location, or unstated willingness to spend.

### Opportunity categories

1. suppliers and equipment;
2. professional services;
3. meeting places and customer venues;
4. workspace and commercial-location searches;
5. training and trade resources;
6. banking and public funding-discovery resources;
7. customers, channels, and industry marketplaces;
8. permits, licensing, and government help.

### Candidate contract

Every candidate must carry:

- stable source/provider identifier;
- category and display name;
- location or service area;
- source URL and source name;
- observed/checked time;
- facts returned by the source, kept separate from Werkles reasoning;
- why it appeared for this member or Werkle;
- unknowns and a “verify before relying” prompt;
- provider status such as live API, official directory, outbound search, or walkthrough fixture;
- sponsorship/affiliate disclosure, including explicit `none`;
- action that does not silently contact, purchase, apply, reserve, or share member data.

### Cross-surface behavior

- **Recommendations:** show a restrained preview of the opportunity categories that could fulfill the selected next move.
- **Workshop:** provide the working comparison surface; save/shortlist/reject/annotate only when custody is honest.
- **Shared Werkle:** let members discuss and assign follow-up on shared candidates without silently merging private searches or contacting anyone.
- **Personal Bellows:** teach the member how to compare the relevant candidate type and what evidence matters.

## Provider strategy

### First production-shaped adapter

Google Places Text Search can return named establishments for focused queries and location bias. It requires a key, pay-as-you-go billing, explicit field masks, Google Maps attribution, and compliance with caching/storage restrictions. Werkles must store only allowed identifiers/metadata and re-fetch display content according to policy.

### Immediately usable official paths

- SBA Lender Match: official lender-discovery handoff; never described as eligibility, approval, or a loan application.
- NCUA Credit Union Locator/custom query: official research starting point; membership eligibility and product fit still require verification.
- Source-owned search links for local businesses, commercial listings, training, and trade resources may be shown as outbound searches when Werkles lacks licensed result data. Werkles must not scrape or rehost restricted marketplace data.

### Later adapters

- Yelp Places for local businesses/services after key, commercial terms, and attribution review.
- A licensed commercial-real-estate feed for vacancies, use, price, and listing status. Search links are allowed before a feed; “just became vacant,” zoning, or budget fit must not be claimed without current evidence.

## First bounded implementation slice after review

1. Provider-neutral types, query planner, claim/freshness rules, and deterministic tests.
2. Opportunity provider catalog with `official_outbound`, `live_api_ready`, `walkthrough_fixture`, and `not_connected` stages.
3. One reusable Opportunity Finder component in three presentation modes.
4. A source-checked Decatur landscaping walkthrough fixture, clearly dated and never called live.
5. Official outbound paths plus a dormant Google Places adapter and server route that fail closed without a key.
6. No schema or account persistence in this slice; device-only shortlist only if explicitly labeled and already supported by reviewed custody patterns.

## Hard edges

- Review first; no member-facing build from this V alone.
- No scraping restricted vendors, marketplaces, reviews, or commercial listings.
- No “best,” “recommended,” “eligible,” “zoned,” “available,” “in budget,” “specializes,” or “verified” unless the cited evidence supports that exact claim.
- Sponsorship may never silently change relevance order.
- No provider contact, booking, application, purchase, or data transmission without a separate explicit member action.
- No secret entry, spend, provider activation, schema/RLS, production data, push, or deploy.
- Packet delivery is not a receipt.

## Broad rotation

1. Skybro: product value and useful categories.
2. Bean: hostile trust, claims, affiliate/sponsorship, freshness, and privacy attack.
3. Ender: three-surface experience and cognitive-load walk.
4. Lady Jessica: visual integration and comparison interaction.
5. Thufir: source/provider feasibility and licensing boundary research.
6. Petra: scope and GO/PATCH/STOP gate.

