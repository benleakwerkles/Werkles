# V — Walkthrough prep: route card + review hub

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~13:05 ET
Cycle: VPGM

## Context

Ben offered a walkthrough today. Last walkthrough produced the
Macmillan/Wonka doctrine and a page he couldn't parse. This time the
foreman controls the route: no hunting, no surprises, decisions queued.

## Idea 1 — Walkthrough route page

One HTML page at `/draft-reviews/walkthrough-20260730.html` (new file,
public/, no seal drift, served live by the running server): the ordered
route with direct links, what changed at each stop since Ben last looked,
and the specific decisions I need from him (legal text approval, icon
placement direction, HG-3 scheduling). Mirror card in the outbox.

## Idea 2 — Review hub index

`/draft-reviews/index.html` — one bookmarkable page linking everything
reviewable (walkthrough, brand sheets, legal drafts), newest first, dated.
Kills the "search around for your work" problem class permanently: one
URL, always current.

## Not in scope

Sealed-file edits · authed profile check (needs a session strategy —
raised as a walkthrough decision instead) · gates.
