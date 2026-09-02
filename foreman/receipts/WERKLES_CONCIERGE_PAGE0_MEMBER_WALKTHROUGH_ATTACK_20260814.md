# Werkles Concierge Page 0 + Member Walkthrough Attack Receipt

Date: 2026-08-14  
Execution context: `CODEX_LOCAL` on Betsy / Windows  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Production mutation: none

## Operator direction

Repair the gross/illegible Concierge Page 0 and prepare another full Werkles
walkthrough as an authenticated member. Machine boundary preserved:
**Betsy = Werkles; Doss = PookaKind**.

## Repairs landed locally

- Dark workshop text now defeats the global paper-ink cascade.
- Rules score and both review-state labels use high-contrast dark-surface ink.
- An empty ranked deck opens `All options`; `Best next steps (0)` is disabled;
  the detail cannot silently borrow an item from a hidden deck.
- At 900px and below, the catalog becomes a contained horizontal scroll-snap
  rail, keeping the selected explanation adjacent instead of 12 cards below.
- Mobile keyboard focus is visible, unclipped, and scrolls the active card into
  view without creating document-level horizontal overflow.

## Proof

- `test-concierge-page-zero-contrast.mjs`: PASS
- `test-concierge-page-zero-mobile-rail.mjs`: PASS
- `squibb-recommendation-navigation-smoke.mjs`: PASS
- `member-walkthrough-route-inventory-smoke.mjs`: PASS
  - 96 UI links + 8 model links
  - 17 destinations
  - no missing App Router route
- TypeScript: PASS
- Production build: PASS, 84/84 pages
- Independent desktop/mobile attack: PASS at 390px, 900px, 901px, and desktop
- Local preview: `http://127.0.0.1:3000/bellows/recommendations`

## Walkthrough state

The existing signed-in browser session successfully loaded:

`/dashboard` → `/dashboard/profile` → `/dashboard/blueprints` →
`/dashboard/intros` → `/dashboard/crucible` → `/dashboard/billing`

The authenticated walkthrough start is staged at `https://werkles.com/dashboard`.

## Findings intentionally not expanded in this repair

- The public example still exposes internal `User #0` / `test-case-0` language.
- One enabled intros action type permits an `href="#"` fallback.
- Blueprints, blueprint detail, and intros use inconsistent visible auth-boundary
  patterns compared with adjacent member routes. This is not asserted as a leak.
- Member pages still vary in header/navigation presentation; Ben's walkthrough
  should judge the experience before a broader correction slice is drafted.

## Gate preserved

The repair is local only. Werkles.com remains unchanged. Push/deploy requires
explicit Ben, Heimerdinker, and Lady Jessica signoff, and Lady Jessica alone
may execute the push/deploy.
