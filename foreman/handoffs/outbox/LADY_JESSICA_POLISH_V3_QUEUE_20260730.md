# Polish v3 — queued work for the first post-push slice

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~12:55 ET
Precondition: polish-v2 ships first (`PUSH MAKER POLISH V2` on the RESEAL
manifest, after red-team). Every item below touches a currently-SEALED
file or depends on v2 being live. Do not start early — starting early
re-drifts the seal.

## Queue (rough priority order)

1. **Footer links to /privacy and /terms** — pages exist and route as of
   2026-07-30 (new files, unlinked). After Ben reviews the draft text,
   wire footer links. Footer markup is inlined per page; consider
   extracting a shared `SiteFooter` component while at it, so future
   footer changes stop being a twelve-file hunt.
   Files: sealed pages + new component.
2. **F1 — Bellows icon orphan** — `/bellows` renders its product icon
   floating outside the hero panel; Membership/Proof put theirs in-card.
   Give Bellows the same `product-heading` placement.
   File: `app/bellows/page.tsx` (sealed).
3. **F2 — h1 clamp gap 521–700px** — homepage headline renders full-size
   and wraps six lines between the phone clamp (≤520px) and desktop.
   Extend the clamp or add a mid breakpoint.
   File: `app/globals.css` (sealed).
4. **Eyebrow color consistency** — the violet eyebrow treatment does not
   reach all pages (e.g. /privacy, /terms render the eyebrow near-black;
   homepage kicker is violet). Decide: violet everywhere or contextual.
   File: `app/globals.css` (sealed).
5. **F3 — authed profile icon + staged flow check** — needs a session;
   confirm the `product-profile` heading block sits well with the three
   staged fieldsets on desktop + phone.
6. **Red-team findings** — whatever the cousins' pass on the RESEAL slice
   produces; dedupe against items above.

## Also waiting on Ben (not crew work)

- Review /privacy and /terms draft text (then item 1 unlocks).
- HG-3 hands: `TO_OPERATOR_HG3_TEN_MINUTE_RUNBOOK_20260729.md`.
