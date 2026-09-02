# V — Front-door details: 404, error states, share cards

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~12:29 ET  
Command context: Ben issued `VPGM` — third self-authored packet.

## Vision

When Ben starts showing Werkles to human beings, the first touch is often not
a page — it's a link in a text message, or a mistyped URL. Three surfaces
decide whether that first touch looks finished:

1. **404 / not-found** — a stranger's broken link should land somewhere warm,
   not a bare Next.js default.
2. **Error state** — if a route throws, the recovery page should sound like
   Werkles, not a stack dump.
3. **Share cards** — the title/description/preview that iMessage, Slack, and
   social show for a werkles.com link. Every page currently reports the same
   generic title.

## Scope (maker branch, no gates)

`app/not-found.tsx`, `app/error.tsx`, metadata in `app/layout.tsx` and
per-route where cheap. No new heavy assets; reuse existing brand imagery.

## Hard edges

Intake closed, no env/secrets, no push/deploy. Fixes land in the polish v2
slice; re-seal.

## Exit

Receipt + re-sealed slice.
