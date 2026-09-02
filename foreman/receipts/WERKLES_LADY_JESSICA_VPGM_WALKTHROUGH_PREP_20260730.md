# RECEIPT — VPGM: walkthrough prep (route card + review hub)

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~13:15 ET
Execution context: LOCAL_SALLY_WINDOWS, `C:\Users\Ben Leak\github\Werkles`,
branch `maker/site-g-20260703` @ `ab7db85`, polish-v2 seal untouched

## V

`LADY_JESSICA_V_WALKTHROUGH_PREP_20260730.md` — Ben offered a walkthrough
today; foreman preps the route so it costs him zero hunting.

## P

0/0 vs origin, no new cards. Note: a crew process rebuilt this tree and
took port 3000 at 13:00 (concurrent hands confirmed; no cards filed yet).

## G1 — Walkthrough route page

`public/draft-reviews/walkthrough-20260730.html` — seven ordered stops
with live links, what changed at each, and four flagged decisions: Story
page five-second test, icon placement standard, legal drafts approval,
HG-3 scheduling (+ authed profile F3 check if Ben signs in during the
walk).

## G2 — Review hub

`public/draft-reviews/index.html` — one bookmarkable page: current items
(walkthrough, both legal drafts) + the four brand sheets, dated.

## Technical note

Next production servers snapshot the public/ manifest at build time —
files added after a build 404. Rebuilt and bounced the port-3000 server
once (stateless `next start`; the crew's process was serving the same
tree). All routes re-verified 200.

## M

Closing pull after receipt. Gates unchanged; none approved by me.
