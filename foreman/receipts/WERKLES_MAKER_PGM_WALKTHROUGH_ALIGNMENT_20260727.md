# Receipt — Maker P, G, M — owner-walkthrough alignment cycle

Seat: Maker (Cursor) @ Sally  
Date: 2026-07-27 (~14:30–14:45 ET)  
Command: `P, G, M.` (Ben)

## P (pull)

- No pushes fired overnight: `PUSH MAKER POLISH V2` and the w8 candidate both
  still hold. Served repo local == remote at `861080c`.
- **VPG58 started on Betsy 14:20 ET** — two packets (recommendations human
  readability rebuild, member shell + workshop value rebuild), addressed to
  the Betsy seats only. Scope is `C:\w8` branch — no collision with this
  slice. Their rebuild answers Ben's "I have no idea what's going on on this
  page" verdict; Maker's cream-ink rescue stays valid for the maker branch
  until their rebuild ships.
- **Pulled the owner walkthrough feedback**
  (`C:\w8\foreman\reviews\WERKLES_OWNER_WALKTHROUGH_FEEDBACK_20260727.md`) —
  this is effectively Maker's packet: the public visual changes are the
  design lane Ben assigned to Maker + Ender.

## G (two strongest ideas from the walkthrough, public visual lane)

1. **Solid-color buttons.** Primary CTAs (`.header-cta`, `.button-dark`,
   `.segment.is-active`, `.round-action.loud`, hero primary) go solid
   `#4520c9` violet; secondary `.button-light` goes solid `#027665` teal.
   The V0i gradient now lives only in the wordmark — "the wave belongs to
   the logo, not every control."
2. **Single-accent sweep.** Footer seam flattened from the V0i gradient to a
   solid violet hairline; the stale gradient ramp in the contrast-floor
   `.button-light` block flattened too. Audit of remaining gradients: all
   others are large panel/hero washes (Keep list: overall layout and
   palette) or the wordmark itself.

Already covered by the sealed slice, confirmed against the feedback: button
shadows removed; head-on kneading-dough hero restored.

## M (two ideas, same lane)

1. **Membership wears the standard Werkles header.** `app/membership/page.tsx`
   now mounts `SiteHeader`; the reduced pill nav and misplaced act rail
   (`currentSlug="/proof"`) are gone.
2. **Operator runbook off the public sales page.** The "Before you click Pay"
   preflight panel (test card runbook) is removed from `/membership`;
   the runbook remains at `/operator/gate-knockout/test-checkout-smoke`.
   This clears the product flag raised 2026-07-26.

## Proofs

- `npm run build` green, 83/83 routes, lint + types pass (14:33 ET).
- `next start` restarted; `/membership` 200; screenshots verified: standard
  header on membership, solid violet CTAs, flat buttons, front-on hero.

## Slice state

`PUSH MAKER POLISH V2` re-sealed at ~14:40 ET, now **3 files**
(`app/globals.css`, `app/membership/page.tsx`, hero PNG). Hash manifest
regenerated. Still held on Ben's phrase.

## Closing pull

Only Betsy-addressed VPG58 activity; no Maker packets waiting.

## Deliberately not taken (walkthrough items left for packets/other seats)

- Nav stacking rework (site header vs act rail on inner pages) — IA-level,
  overlaps VPG58 member-shell rebuild.
- Public copy de-wording, taxonomy clarity (Bellows/Foundry/Workshop),
  industry-broadening imagery — content design; queued for the Ender brief.
