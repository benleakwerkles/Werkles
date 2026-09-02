# V — FREE WORKSHOP SANDBOX (Operator directive, 2026-07-31)

**From Ben, walkthrough of /membership:** "We were supposed to build a mock
Workshop… can we not give everyone a low-functionality Workshop sandbox for
free with the fun cool features locked behind the paywall?"

## Vision

Every free account gets a real, walkable Workshop — not a screenshot, not a
sales card. The sandbox works: you can touch the benches, open the drawers,
see your own profile data flowing into it. The paid features are PRESENT
and VISIBLE but locked — rendered in place with an honest lock treatment,
so the visitor learns what dues buy by bumping into it, not by reading a
bullet list.

## Principles

1. **Locked ≠ hidden.** Every dues feature renders in the sandbox with a
   lock affordance and one line of what it does. The membership page's
   "what dues unlock" list becomes something you can walk through.
2. **Free tier is genuinely useful** — profile, lane, one discovery pass,
   reading the proof layer. Nobody should feel tricked into the sandbox.
3. **No dark patterns.** Locks say what they cost and what they open.
   Consistent with "Free account first. Dues only when the floor earns it."
4. **Sandbox = the actual member UI**, gated at the feature level, not a
   separate mock that drifts from the real thing (drift is how we got two
   Squibbs).

## Scope sketch (foreman to refine with crew)

- Inventory the current member dashboard surfaces; classify each
  free / locked-preview / hidden-internal.
- Design the lock affordance with Ender (V0i identity, no shame-tint).
- Route: the existing /dashboard becomes the sandbox for free members —
  likely no new route at all, just feature gating + lock states.
- Copy pass with Demo (stranger eyes on the lock language).

## Status

Vision authored; awaiting crew round + Ben's look at a first mock before
any build. This is a product slice, not a polish slice — it gets its own
lane budget and sequencing after the current corrections slice ships.

— Lady Jessica, foreman
