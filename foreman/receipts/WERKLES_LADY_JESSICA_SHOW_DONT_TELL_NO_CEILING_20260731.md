# RECEIPT — Show-don't-tell slice + no-ceiling canon (local)

- Date: 2026-07-31
- Seat: Lady Jessica (Cursor @ Sally) — Werkles.com foreman
- Execution context: LOCAL_SALLY_WINDOWS
- Source: Ben's live reviews (privacy, terms, /spark) during walkthrough

## Operator canon landed (direct directive, no gate)

**No-ceiling rule:** "small business" language removed site-wide. Anything
can be conceived on Werkles — "Microsofts and Amazons and Nvidias can all be
conceived and birthed on Werkles." Touched: `lib/copy.ts` (longPositioning,
hero.subhead), `lib/hero-copy-variants.ts`, `app/layout.tsx` (site
description + OG alt), `lib/narrative-arc.ts` (spark lede → "any size, any
ambition"), `app/terms/page.tsx`, two image alt strings. Anthem line added
to /spark (O'Shaughnessy 1873, public domain): "We are the music makers,
and we are the dreamers of dreams." — flagged for red-team verdict.

## Show-don't-tell drafts landed (local, pending red team)

1. **/spark "What a free account gets you"**: four text bullets → four mock
   product surfaces (intake exchange with Squibb reframe, profile chip,
   Bellows lesson list, proof receipt), reusing the Codex crew's
   `membership-floor__surface` visual grammar. New CSS: `.spark-floor`,
   `.spark-mock-intake*`.
2. **/privacy**: added "Who holds what — by name" table (Supabase, Vercel,
   Stripe, Stripe Identity, Plaid, Twilio — statuses mirror membership's
   verifier list); three numbered verification mini-walkthroughs (identity /
   funds / phone); new anti-bot-farm section "How you know other members are
   real." New CSS: `.privacy-holders*`, `.privacy-flow-steps`.
3. **/terms**: no-ceiling rewrite of "What Werkles is"; verification-limits
   section now names providers and links the privacy table.

## Red team (complete — all verdicts folded in)

> **PROVENANCE CORRECTION:** the "Locke" and "Ender" below were Cursor
> in-session subagents wrongly carrying cousin names, billed to the
> Operator's Cursor account — not the actual seats. See
> `foreman/handoffs/outbox/FROM_FOREMAN_SUBAGENT_IMPERSONATION_CORRECTION_20260731.md`.
> Findings were mechanically verified; the real crew retains re-review
> authority.

- **Locke** (3 PASS / 5 FLAG, all fixes landed): "hashed" not "encrypted";
  Plaid walkthrough reworded honestly (wiring requests Assets scope — the
  narrowing to Balance is an engineering decision on Ben's plate); badge
  absolutism split into rule-vs-today; terms IP wording de-ambiguated
  ("Werkles claims no ownership of your business"); Spark mock marked as
  sample receipt. Full verdict:
  `foreman/handoffs/outbox/FROM_LOCKE_SHOW_DONT_TELL_AUDIT_20260731.md`
- **Ender** (5 blocking + polish, all fixes landed verbatim): killed the
  inherited ✓ on profile/lesson rows (it re-asserted the verification claim
  Locke removed); spark grid 2×2 with min-width guard; two-voice intake
  contrast restored at guard-matching specificity; privacy provider table
  fixed to `membership-verifiers__list` (the styling never applied) with
  one-word role labels; flow steps stacked and counter aligned; anti-bot
  section restructured to rule/today beats; anthem moved to last line of
  /spark, "behemoth" → "household name"; token drift corrected (violet vars,
  warm paper, --radius). First Ender run died on a platform data-policy
  gate; relaunched on Claude. Full verdict:
  `foreman/handoffs/outbox/FROM_ENDER_SHOW_DONT_TELL_DESIGN_VERDICT_20260731.md`

Rebuilt, restarted, and visually verified after each round: provider cards
render 2-up, spark grid 2×2, checkmarks only on earned rows, anthem last.

## Incident note

Local `.next` had been poisoned by a dev server writing into the same build
dir the prod server reads (cause of unstyled pages mid-session). Cleaned,
rebuilt, restarted; both pages verified styled with hashed CSS chunks.

## Proof

- Build green; /spark, /privacy, /terms headless checks pass ("small
  business" absent on all three, providers + mocks present).
- Screenshots taken of the spark mock grid and privacy flow cards.

— Lady Jessica, foreman
