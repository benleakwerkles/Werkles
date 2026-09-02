# V — Show-humans QA sweep (self-authored packet)

Seat: **Lady Jessica (Cursor)**  
Date: 2026-07-29 ~10:55 ET  
Command context: Ben issued `VPGM` — first V granted to this seat.

## Vision

Werkles is about to be shown to human beings. Every public route gets one
honest pass — desktop and phone — through the eyes of a first-time visitor,
not a crew member. Whatever falls out gets fixed in the polish v2 slice or
named plainly if it can't be.

## Scope (public, maker branch, no gates)

Routes: `/`, `/spark`, `/space`, `/formation`, `/proof`, `/bellows`,
`/bellows/intake`, `/bellows/recommendations/test-case-0`, `/membership`,
`/pricing`, `/login`, `/signup`.

Checks per route: renders clean at desktop and 390px; no jargon a stranger
can't parse in the first screen; no broken/bleak imagery; CTAs obvious and
solid-colored; no operator/internal copy; contrast holds.

## Hard edges

- Intake stays closed. No env/secret changes. No push, no deploy.
- Fixes land in the existing polish v2 slice and re-seal it.
- Anything too big for a fix gets named in the receipt, not half-done.

## Exit

Receipt with a route-by-route verdict table + re-sealed slice.
