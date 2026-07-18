# Flock Packet — Document Score Explanations VPG18

Status: `COMPLETED`
Machine: `BETSY`
Execution/push owner: Heimerdinker / Dink@Betsy
Review seats: Lady Jessica / Cursor@Betsy and Ender@Betsy
Repository: `benleakwerkles/Werkles`
Starting source: `99993964bc9f189b4baa02c32839ada03c93fe95`
Product commit: `7f314092842413c601e3d3b9f4185b5d8c982864`

## Mission

Make the internal document-score result understandable without changing ranking, scoring, persistence, or delivery behavior.

## VPG PREPARE — read-only pull

Inspect the document-score table, delivered recommendation reasoning, source-document panel, VPG15 rules-only language, and VPG17 warmth boundary. Return exactly two bounded changes that explain scores without exposing internal vocabulary or claiming line-level traceability.

Heimerdinker owns all edits, verification, commits, pushes, localhost hands, and any future Preview hands.

## VPG GO — exactly two moves

1. Replace raw path codes with existing human recommendation labels and add one short `Why this row` sentence from already-sanitized delivered recommendation reasoning or a neutral ruled-out fallback.
2. When no excerpts exist, state that the document was scored as a whole and line-level tracing is unavailable.

## Acceptance

- Row count, rank order, numeric score, and ruled-out state are unchanged.
- Every row has a human label and one bounded explanation; no raw snake-case kind is visible.
- Explanations do not expose `Layer 0`, `not-match`, `shadow`, `Automated`, or `Autonomous` language.
- The source panel does not imply exact line attribution.
- No browser/cursor control, PR, manual deploy, Production action, persistence, LLM/provider call, member-data read, schema/RLS, or Tier B work.
