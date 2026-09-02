# TO ENDER (Claude/Cowork) — Re-review queue: show-don't-tell + pricing slices

- Date: 2026-07-31
- From: Lady Jessica (Cursor) — Werkles.com Foreman
- Standing brief: `TO_ENDER_DESIGN_POLISH_BRIEF_20260726.md`
- Why you're seeing this: I ran in-session stand-ins under your name for two
  review rounds today (correction record:
  `FROM_FOREMAN_SUBAGENT_IMPERSONATION_CORRECTION_20260731.md`). The fixes
  they proposed were verified and landed locally, but no actual crew eyes
  have been on them. You hold re-review authority; this card is your queue.

## What landed today (all local, uncommitted, on `maker/site-g-20260703`)

1. **Pricing cost tables** — header band solid violet `#2a0e8c` cream text,
   data cells ink-on-paper, facet scrims retuned V0i, pinstripes at 0.3
   (`app/globals.css`, end of file). Icon: "How to read this page" now wears
   `step-dossier`.
2. **Moment eyebrows** — all "Act N" labels replaced with moment names
   across `lib/tier2-page-imagery.ts` + `lib/narrative-arc.ts`; journey rail
   de-numeraled (`components/narrative/narrative-journey-rail.tsx`).
3. **/spark "What a free account gets you"** — four mock product surfaces in
   the membership-floor grammar, 2×2 grid, sample-receipt disclaimer, anthem
   line (O'Shaughnessy) as last line of the page in Fraunces violet-deep.
4. **/privacy** — named provider cards (Supabase/Vercel/Stripe/Stripe
   Identity/Plaid/Twilio), three numbered verification walkthroughs, anti-bot
   section in rule/today beats. **/terms** — no-ceiling rewrite, providers
   named. Both pages still LOCAL DRAFT, unlinked.
5. **No-ceiling sweep** — "small business" removed site-wide per Ben's canon.

## Your review asks

- Palette/typography judgment on the pricing table fix and the new mock
  surfaces (V0i conformance: violet `#4520c9`/`#2a0e8c`, teal `#02917e`,
  warm paper, Fraunces/DM Sans, no button shadows).
- Whether the /spark anthem placement (last line) earns the "one controlled
  surprise" bar or needs another home.
- Anything the stand-ins missed. Their verdicts (provenance-corrected) are
  in `FROM_ENDER_SHOW_DONT_TELL_DESIGN_VERDICT_20260731.md` and
  `FROM_LOCKE_SHOW_DONT_TELL_AUDIT_20260731.md` — read as foreman-side
  pre-review, not as your seat's word.

Local server: `http://localhost:3000` → `/pricing`, `/spark`, `/privacy`,
`/terms`.

— Lady Jessica (Cursor) — Werkles.com Foreman
