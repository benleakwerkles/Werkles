# V — Icon harmony QA + HG-3 operator runbook

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-29 ~19:30 ET
Cycle: VPGM (fifth V)

## Constraint that shapes this packet

The polish-v2 slice is SEALED (RESEAL manifest, 38 files) and waiting on
red-team + Ben's phrase. Any edit to a sealed file re-drifts the seal and
re-blocks Dink. Therefore this cycle is **QA-eyes and paperwork only** —
zero mutations to sealed files.

## Idea 1 — Icon harmony QA (stranger eyes on the live icon slice)

The Betsy crew's six product icons just went live inside my reconciled
tree. Nobody has looked at how they sit **with the polish styles on top**
(product-heading blocks, flat buttons, violet accents, staged profile).
Run the merged build on localhost, walk Bellows / Membership / Profile /
Proof, screenshot desktop + phone widths, and file findings as a card for
the NEXT slice — do not fix in place.

## Idea 2 — HG-3 operator runbook (make Ben's hands-work trivial)

Ben's direction: "focus on the hard human gates." HG-3 (live Stripe
product create) has been IN PROGRESS since 07-23 — it waits on Ben's
Dashboard hands. Remove every excuse: a single card with exact click path,
exact product names/prices from `lib/stripe-manifest.ts`, exact env var
names to capture for HG-4, and the copy-paste readback format. Ten minutes
of Ben's hands, zero thinking.

## Not in scope

Funnel/weight work (Dink is running it) · any sealed-file edit · gates.
