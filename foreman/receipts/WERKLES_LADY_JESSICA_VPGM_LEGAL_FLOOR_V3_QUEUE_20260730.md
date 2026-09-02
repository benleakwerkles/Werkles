# RECEIPT — VPGM: legal floor drafts + polish-v3 queue

Seat: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 midday
Execution context: LOCAL_SALLY_WINDOWS, `C:\Users\Ben Leak\github\Werkles`,
branch `maker/site-g-20260703` @ `ab7db85`, polish-v2 seal untouched

## V

`LADY_JESSICA_V_LEGAL_FLOOR_AND_V3_QUEUE_20260730.md`

## P

0/0 vs origin; no new cards in this repo or C:\w8. No Dink activity since
the seal-drift resolution.

## G1 — /privacy and /terms drafts (new files only)

- `app/privacy/page.tsx` — plain-language privacy draft: what's collected
  (auth email, profile facts, intake text, interest-list emails), use
  (run the product, nothing else), Stripe card handling when live,
  verification-data honesty (previews now, providers later, FCRA not
  offered), storage (Supabase/Vercel), export/delete route via intake.
- `app/terms/page.tsx` — plain-language terms draft: what Werkles is and
  does NOT promise, account rules, membership/billing via Stripe with
  cancel-anytime, not-a-consumer-report limits, 12-month liability cap,
  plain-change promise.
- Both marked "draft pending Operator review," dated, NOT linked from any
  page (footer wiring queued for v3 after Ben reads the text).
- Proof: `npm run build` green; both routes rendered on localhost and
  screenshotted; seal manifest untouched (new files only).

## G2 — Polish v3 queue

`LADY_JESSICA_POLISH_V3_QUEUE_20260730.md` — six queued items (footer
legal links + shared SiteFooter extraction, Bellows icon orphan, h1 clamp
gap, eyebrow color consistency, authed profile check, red-team findings
placeholder) with the do-not-start-early seal warning.

## Gates

Unchanged; none approved by me. Waiting on Ben: HG-3 hands, legal-text
review, red-team pass, then `PUSH MAKER POLISH V2`.

## M

Closing pull after this receipt.
