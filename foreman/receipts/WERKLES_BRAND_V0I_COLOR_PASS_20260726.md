# RECEIPT — Brand V0i wordmark live + site color pass (local)

Date: 2026-07-26  
Agent: Maker (Cursor) @ Sally — execution context `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles` @ `maker/site-g-20260703` (dirty tree, slice documented)

## What Ben picked

After iterating waves/seams/palettes across four review sheets
(`brand-erkles-options-v2`, `brand-waves-large`, `brand-w2-pushed`,
`brand-gt4-versions`), Ben picked **V0i**: original two-tone W untouched,
"erkles" in a straight purple-into-green blend
(`172deg: #6a35f2 → #4b1fd6 30% → #0aa38c 64% → #027665`).

## Changes landed (local, dev server verified)

1. `app/globals.css` — header wordmark switched from the ink-seam wave SVG to
   the V0i linear blend; W→e tuck (-3px under the W's overhang) retained.
2. `app/globals.css` — **Brand V0i color pass** appended after the contrast
   floor:
   - Primary CTAs (`.header-cta`, `.button-dark`, `.segment.is-active`,
     `.round-action.loud`): copper forge gradient → V0i violet/teal blend,
     white text, ramp bottoms at `#027665` (~5.5:1).
   - Secondary CTA (`.button-light`): deep-teal ramp with violet edge.
   - Micro-labels (`.eyebrow`, `.plan-kicker`, `.card-heading p`,
     `.narrative-journey-rail__act`): copper → `var(--werkles-violet)`.
   - Trust badges: aligned to teal tokens.
   - Prose links (unclassed, in `main`): violet at rest, teal hover;
     dark cockpit page (`squibb-rec-page`) gets seafoam.
   - `:focus-visible`: brand violet ring.
3. Draft W wave variants generated (16 PNGs) in
   `public/assets/draft/brand-rebrand/` — **drafts only, not wired**.

## Verification

- `http://127.0.0.1:3000/` — V0i wordmark, violet eyebrow, V0i CTA gradient,
  "Join the Foundry" gradient button: confirmed by screenshot.
- `/login?next=/dashboard` — Act labels violet, warm paper intact, W badge
  original: confirmed by screenshot.
- Known open item: Next dev overlay showed "1 Issue" badge on `/` (CSS-only
  change this session; likely pre-existing dev warning — flagged in push
  packet for Heimerdinker to inspect before push).

## Gates staged (nothing fired)

- `PUSH MAKER BRAND SLICE` → `TO_HEIMERDINKER_BRAND_V0I_PUSH_20260726.md`
  (phrase renamed 2026-07-26 ~05:45 ET; `PUSH BRAND V0I PUBLIC` now belongs to
  the Betsy/Codex 235-path packet in `C:\w8` and must not trigger this slice)
- Stripe soft live ladder (Ben first test) →
  `TO_OPERATOR_STRIPE_SOFT_LIVE_BEN_FIRST_TEST_20260726.md`
  (HG-3 hands in progress → `APPROVE SECRET ENTRY` → `APPROVE PAID CHECKOUT GO-LIVE`)
