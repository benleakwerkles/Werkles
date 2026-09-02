# TO_HEIMERDINKER — Brand V0i + site color pass — PUSH PREP PACKET

From: Maker (Cursor) @ Sally  
Date: 2026-07-26  
Status: **EXECUTED.** The 12-file slice landed as commit `861080c`
("publish Brand V0i color pass", 2026-07-26 05:15) on
`origin/maker/site-g-20260703`, and werkles.com's live CSS bundle now carries
the V0i gradient — pushed AND promoted. One remainder: Maker's polish pass v2
(hover/press states, appended to `app/globals.css` after the commit) is still
local. Follow-up slice: `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_20260726.md`.

## Gate phrase (Ben says it, nobody else)

```text
PUSH MAKER BRAND SLICE
```

Scope: UI/brand only. No API, schema, env, Stripe, or intake-availability changes ride along.

> **PHRASE COLLISION RESOLVED (2026-07-26 ~05:45 ET).** The Betsy/Codex crew
> independently sealed a packet answering to `PUSH BRAND V0I PUBLIC`
> (`C:\w8\foreman\handoffs\outbox\TO_HEIMERDINKER_WERKLES_BRAND_V0I_PUBLIC_GIT_J_PUSH_PREP_20260726.md`,
> 235 paths, branch `codex/werkles-vpg31-20260721`, committed locally as
> `60fcff4`, not yet pushed). That phrase now belongs to THEIR packet only.
> THIS packet (12-file brand slice, branch `maker/site-g-20260703`) answers
> only to `PUSH MAKER BRAND SLICE`. If Ben says `PUSH BRAND V0I PUBLIC`, do
> not push this slice.

## Drift lock

Verify the slice against
`TO_HEIMERDINKER_BRAND_V0I_PUSH_FILE_HASHES_20260726.sha256` (same folder)
before staging. If any hash mismatches, STOP and report — someone touched the
slice after Maker sealed it (re-sealed 2026-07-26 ~05:50 ET after the polish
pass v2: hover/press states, transitions, ghost-button branding, brand
selection color, reduced-motion guard — all appended to `app/globals.css`).

## What ships (visible on werkles.com)

1. **V0i wordmark** — header "erkles" is a straight purple-into-green blend
   (`linear-gradient(172deg, #6a35f2, #4b1fd6 30%, #0aa38c 64%, #027665)`),
   clipped to the letterforms. Original two-tone W mark unchanged, now served
   as a true-transparent PNG (board pad retired).
2. **Site color pass** — primary CTAs, secondary CTAs, micro-labels (eyebrows,
   plan kickers), trust badges, prose links, and focus rings move from copper
   to the brand violet/teal. Warm paper + copper frames stay.
3. **Contrast floor + legacy layer fix** — `styles.css` demoted to
   `@layer legacy`; barely-visible-text fixes hold sitewide.
4. **Homepage story recast** — Maria protagonist consistent across beats 1–5
   plus hero-wide image.
5. **Header cleanup** — nav documentary icons removed; responsive nav wraps to
   a second row under 820px.
6. **Polish pass v2** — CTAs lift on hover and settle on press, ghost buttons
   answer in brand violet, text selection is brand-tinted, and every
   transition respects `prefers-reduced-motion`.

## Repo and slice

- Repo: `C:\Users\Ben Leak\github\Werkles` (the clone the dev server runs from)
- Branch: `maker/site-g-20260703`
- **Working tree has ~595 changed files. Push ONLY this slice:**

```text
app/globals.css
styles.css
components/foundry/brand-mark.tsx
components/foundry/site-header.tsx
components/foundry/workshop-greeter.tsx
public/assets/werkles-w-mark-transparent.png            (new)
public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat01-wrong-need.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat02-squibb-moment.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat03-money-reveal.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat04-equipment-reveal.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-beat05-shop-open.png
public/assets/draft/anyone-narrative-v2/werkles-story-v2-hero-wide.png
```

**Exclude (do not push):**

```text
public/draft-reviews/                    (internal review sheets)
public/assets/draft/brand-rebrand/       (draft W variants, not wired)
public/assets/draft/anyone-narrative-v2/*-OLD*.png
scripts/one-off/                         (image tooling)
everything else in the dirty tree        (separate slices, separate gates)
```

## Proofs before push

1. `npm run lint` and `npm run typecheck` (or `npm run build`) green on the slice
2. Local render check: `/`, `/login`, `/bellows/intake`, `/dues` — header V0i
   wordmark, violet eyebrows, V0i-gradient CTAs, no dark-theme bleed
3. Note: Next dev overlay showed a "1 Issue" badge on `/` during the color
   pass (CSS-only change; likely pre-existing dev-only warning). Eyeball the
   overlay before pushing; stop if it's a real error.

## Rules

- Intake stays CLOSED. This push must not change `lib/squibb/concierge-intake-availability.ts` behavior.
- No env or secret changes ride along.
- Production deploy after push follows the standing Production promotion gate.
