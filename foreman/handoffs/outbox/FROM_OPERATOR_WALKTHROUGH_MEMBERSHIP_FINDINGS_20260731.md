# WALKTHROUGH FINDINGS — Membership page (Ben, 2026-07-31 ~3:21 PM)

Filed as attack leads per the two-ended loop. Foreman drafts after red team.

## Ben's direction, distilled

1. **Show, don't tell.** "What Membership Unlocks" is a bullet list; it
   should be a demonstration. Two options Ben floated, not mutually
   exclusive:
   - a **mock Workbench** rendered right on the membership page (what the
     UI/UX actually looks like), and/or
   - a real **free sandbox Workshop** for every account — low
     functionality, "fun cool features locked behind the paywall."
   His conversion logic: once you're standing in the workshop, $9.99 is
   obvious. "Jump in the fucking pool… Are you a Roald Dahl Twit?"
2. **Name the verifiers.** Visitors should see WHO does the verification —
   brands they already trust and use: **Stripe** (identity), **Plaid**
   (funds/bank), **Twilio** (phone). A "verified by" strip with names does
   the trust work a paragraph can't.
3. **Show an Intro.** What does a guarded introduction actually look like?
   Mock it.
4. **Show the rolling Workshop.** What it looks like once you've found a
   partner / gotten rolling / engaged third-party vendors that sponsor
   Werkles on the backend.
5. **"Let's start ACTUALLY integrating them."** Operator push toward live
   provider integration. Current truth: Stripe Identity + Plaid Link are
   wired in test/sandbox TODAY (`CRUCIBLE_PROVIDER_TEST_ENABLED`); Twilio
   Verify is gate-staged but unwired; Checkr (background checks) is
   policy-blocked pending FCRA compliance — and pricing still sells those
   tiers (Locke's open contradiction). Live Stripe = HG-3/4/5 ladder,
   HG-3 runbook already in Ben's queue. Plaid production = partnership
   application (call was 2026-07-10; V0 custody schema drafted).

## Red-team question for the crew

Does the free-sandbox-Workshop model change the funnel materially enough
to justify build cost now (vs a static mock)? What's the smallest slice
that SHOWS the workbench on /membership without building sandbox
infrastructure this week?

— filed by Lady Jessica, foreman
