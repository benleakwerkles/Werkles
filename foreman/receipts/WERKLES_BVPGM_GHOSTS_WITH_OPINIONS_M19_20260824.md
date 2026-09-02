# Werkles BVPGM — Ghosts With Opinions M19

## Result

`LOCAL_TWO_SIDED_GHOST_FORMATION_CANDIDATE_VERIFIED__FRESH_CBCC_RECEIPTS_BLOCKED__GATE_05_HOLD`

Formation now behaves like a two-sided synthetic walkthrough instead of asking
the member to impersonate the Ghost.

## Product changes

- Removed the member-facing Ghost actor switch. The signed-in member can change
  only their own Formation decisions.
- Added a deterministic fictional partner profile: work pace, follow-through,
  decision style, disagreement style, availability, contribution posture, and
  an explicitly synthetic financial scenario.
- Added a distinct Ghost position, reason, counter-question, and initial choice
  for every Formation topic.
- Replaced `Decide what crosses the line` with `Build the answer you would both
  work from` and plain instructions for using either source, writing a third
  answer, keeping material private, or leaving it unresolved.
- Kept financial simulation out of ranking and provider claims. No account
  number, exact public amount, real bank connection, or Plaid verification is
  asserted.
- Updated Formation contract fixtures and assertions to protect Ghost custody,
  point-of-use synthetic disclosure, and the no-impersonation rule.

## Verification

- `npm run typecheck` — PASS
- `npm run build` — PASS
- `npx tsx scripts/foreman/werkle-formation-contract-smoke.ts` — PASS
- `npx tsx scripts/foreman/werkle-operating-brief-contract-smoke.ts` — PASS
- Rendered Formation walkthrough at 390 x 844 — PASS
- Rendered Formation walkthrough at 1440 x 900 — PASS
- Browser console warnings/errors — none

## CBCC custody

- M19 prebuild packet and mission were created for Ender and Bean.
- A first Ender browser leg used the wrong carrier and returned an unusable
  partial/mutated proof. It was quarantined and is not counted.
- Correct carrier map: Ender = Claude desktop; Computer = Perplexity desktop;
  Bean, Skybro, and Petra = existing Chrome destinations.
- Ender's desktop CDP route did not become available on port 9348 after the
  existing app launch path was tried. No review receipt was returned.
- Bean and Skybro were visible in the existing Chrome session. Petra/ChatGPT was
  not present as an identifiable existing tab. No duplicate browser or thread
  was opened and no external response was fabricated.
- Fresh CBCC review remains owed before this local candidate may claim a
  review-first crew seal.

## Boundaries

No provider call, credentials, schema/RLS change, spend, push, deploy,
production activation, external release, Codex subagent, environment, or
foreground mouse/keyboard/clipboard control. Gate 05 remains HOLD.

