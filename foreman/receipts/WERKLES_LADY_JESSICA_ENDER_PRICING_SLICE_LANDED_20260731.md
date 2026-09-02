# RECEIPT — Ender pricing + narrative slice landed (local)

- Date: 2026-07-31
- Seat: Lady Jessica (Cursor @ Sally) — Werkles.com foreman
- Execution context: LOCAL_SALLY_WINDOWS
- Source: red-team of Ben's pricing walkthrough, transcript
  `fd3471f3-be2a-426b-b12c-a777a5968fa9`
  > PROVENANCE CORRECTION: this was a Cursor in-session subagent wrongly
  > carrying the Ender name, not the actual Ender seat (Claude/Cowork). See
  > `foreman/handoffs/outbox/FROM_FOREMAN_SUBAGENT_IMPERSONATION_CORRECTION_20260731.md`.

## Landed (reversible, in approved polish scope)

1. **Cost-table repair** (`app/globals.css`, appended block):
   header band now solid brand violet `#2a0e8c` with cream text at fw 750
   (was dark-brown ink on near-black, ~1.7:1 — a two-stylesheet cascade
   collision); data cells ink on elevated paper; pricing facets retuned to
   V0i violet/teal; scrim pinstripes faded to 0.3. Scoped to pricing only.
   Verified computed live: `rgb(253,248,238)` on `rgb(42,14,140)`.
2. **Icon system** (`components/pricing/pricing-table.tsx`): "How to read
   this page" swapped `nav-proof` → `step-dossier`; shield now appears once.
3. **Moment eyebrows** (`lib/tier2-page-imagery.ts`): all seven `Act N`
   eyebrows replaced with moment names ("The week before open", "The people
   arrive", "Around the plan", "Proof in formation", "On the bench",
   "A second pair of hands"). Ender had already landed the matching
   `lib/narrative-arc.ts` eyebrows/nextLabels himself.
4. **Pricing runs featured-only**: forgeBand slot removed
   (`app/pricing/page.tsx` + imagery config); the builder/operator invention
   image re-slotted into `/formation`'s gallery as "The part in hand"
   (`lib/narrative-arc.ts`).
5. **Journey rail** (`components/narrative/narrative-journey-rail.tsx`):
   dropped "Act N" numerals and internal codenames; ordered moment words
   ("The story / The room / The people / The proof / Bellows").
6. Deleted dead attribution exports (`tier2ImageryAttribution`,
   `narrativeArcAttribution`) — nothing rendered them.

## Staged for Ben-eyes gates (NOT wired)

- `public/assets/draft/werkles-crucible-shield-v1-draft.png` — inverted
  green shield / purple check (Ender flagged the prior draft never reached
  the repo; fixed).
- `public/assets/draft/werkles-tier2-forge-e05-evening-before-open-draft.png`
  — generated per Ender's brief; needs Ben verdict, then sharp compression
  pass (currently 2.4 MB) before wiring into `pricing.featured`.

## Proof

- `npm run build` green (first two attempts hit a transient Windows
  `/_document` worker flake after killing the server mid-lock; deterministic
  retry passed).
- Live checks on localhost:3000/pricing: "The week before open" present,
  "Act III" absent, `step-dossier` icon served, header colors computed
  correct, screenshot taken.

— Lady Jessica, foreman
