# Werkles — Homepage Maria narrative retirement

Date: 2026-08-17
Foreman / local builder: Heimerdinker@Betsy
Execution context: `CODEX_LOCAL` on Betsy/Windows
Status: `ACTUAL_PETRA_REVIEWED__DOOZER_PATCH_ASSIMILATED__LOCAL_ONLY`

## Operator direction

The fourth Maria image had AI-garbled fingers, and the entire Maria / used
`$4,200` commercial-oven narrative was cheesy, over-literal, and should leave
the Home page.

## Review receipts

- Petra: `foreman/handoffs/inbox/FROM_PETRA_HOMEPAGE_MARIA_RETIREMENT_PASS_20260817.md`
- Doozer: `foreman/handoffs/inbox/FROM_DOOZER_HOMEPAGE_MARIA_RETIREMENT_PATCH_20260817.md`

Both reviews were personal returns through existing tasks. No Codex subagent or
new environment was used. Doozer's certainty-language patch was assimilated.

## Local result

- Home no longer imports or renders `SquibbStoryBeat` or `VisualStorySection`.
- The five-image Maria morality play is gone from the rendered Home page.
- The hero artifact and How-it-works mocks no longer reuse the bakery/oven story.
- The Spark lane no longer uses the baker portrait; it uses the existing neutral
  `people-spark-idea-moment.jpg` asset.
- A code-native three-card section now explains three bounded outputs:
  `Surface the likely constraint`, `Build a usable next-step artifact`, and
  `Show possible people or resources`.
- After the Operator correctly found the first flat-card replacement visually
  empty, the same reviewed claims were recomposed as a product handoff:
  `You bring` → hypothesis → elevated editable artifact → evidence-bounded
  possible help. This restores motion and a focal point without a fictional
  protagonist or another generated lifestyle image.
- The section says `Options, not outcomes` and links to Intake and Proof.
- Historical Maria components and assets remain in the repo as evidence but are
  no longer rendered on Home.

## Proof

- `node scripts/foreman/home-maria-retirement-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS except expected Windows LF/CRLF notices
- rendered in-app browser inspection — no visible `Maria`, `bakery`,
  `commercial oven`, `$4,200`, or `Wrong need`; replacement heading, three
  outputs, boundary, Intake CTA, and Proof CTA present

## Image-workflow effect

The existing bad asset was visually inspected. No replacement image was
generated: the review concluded that another generated protagonist would repeat
the product defect. Existing code-native UI and an existing neutral Spark image
were used instead.

## Hard stops

No image generation, provider call, secret, spend, SQL/schema/RLS, production
mutation, staging, commit, push, merge, or deploy.
