# TO_ENDER — Design polish brief (Maker + Ender lane)

From: Maker (Cursor) @ Sally  
Date: 2026-07-26  
Mandate from Ben: "Really polish the look, that's going to be all you and
Ender over here. I don't think we can leave too much design decision up to
Dinker." Design decisions live with us, not Heimerdinker.

## Current brand state (V0i, locked by Ben)

- **Wordmark:** original two-tone W (purple/teal, true-transparent PNG) +
  "erkles" in a straight purple-into-green blend:
  `linear-gradient(172deg, #6a35f2 0%, #4b1fd6 30%, #0aa38c 64%, #027665 100%)`.
- **Palette:** warm paper + copper frames stay as the workshop backdrop; the
  W's violet (`#3d16ca` / `#4520c9` / `#5b2be0`) and teal (`#0aa38c` /
  `#027665`) own all action colors.
- **Applied so far (all in `app/globals.css`, tail blocks):** V0i CTAs,
  violet micro-labels, teal trust badges, violet/teal prose links, brand
  focus ring, contrast floor, legacy `styles.css` demoted to `@layer legacy`,
  polish pass v2 (hover lift / press states, ghost-button violet hover,
  brand `::selection`, `prefers-reduced-motion` guard).

## Open design work (Ender's eye wanted)

1. **Typography rhythm.** Headline serif vs body sans is right, but section
   spacing is uneven — some sections breathe, some crowd. A vertical-rhythm
   pass (consistent section padding scale) would raise the whole page.
2. **Hero art direction.** Ben has two standing offers he hasn't fired:
   phone-width hero polish, and a front-on hero reshoot. If you have a
   stronger hero concept, draft it — Ben responds to seeing options side by
   side (serve drafts at `/draft-reviews/*.html`, embed images in chat).
3. **Card family.** Lane cards, proof cards, and dues cards each have
   slightly different radii/shadows/border tints. Unify into one card voice.
4. **Dark cockpit surfaces.** `main.squibb-rec-page` is a frozen dark theme;
   the rest of the site is warm paper. Decide whether dark surfaces are a
   deliberate "instrument panel" motif (lean in: consistent dark tokens) or
   debt (schedule a relight).
5. **Footer.** Functional but unloved. Low risk, decent payoff.
6. **Mobile.** Nav wraps under 820px now; the rest of mobile has never had a
   real pass.

## Working rules

- All polish lands in the served repo: `C:\Users\Ben Leak\github\Werkles`
  (branch `maker/site-g-20260703`) — NOT the desktop clone.
- `app/globals.css` is inside the sealed `PUSH MAKER BRAND SLICE` drift lock.
  If you touch it before the push, re-hash
  `TO_HEIMERDINKER_BRAND_V0I_PUSH_FILE_HASHES_20260726.sha256` and note the
  re-seal in the packet, or the push will (correctly) stop.
- Never make Ben hunt: embed images in chat, link everything, open the review
  page for him.
- No gates cleared on our lane: intake stays closed, no env/secret changes,
  no deploys. We polish; Ben fires phrases.
