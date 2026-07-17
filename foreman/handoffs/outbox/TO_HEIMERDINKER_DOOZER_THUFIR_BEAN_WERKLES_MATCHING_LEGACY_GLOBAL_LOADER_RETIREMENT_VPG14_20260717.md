# Flock Packet — Matching Legacy Global Loader Retirement VPG14

Status: `OPEN`
Machine: `Betsy`
Execution/push owner: Heimerdinker / Dink@Betsy
Review seats: Doozer@Betsy, Thufir@Betsy, and Bean@Betsy
Repository: `benleakwerkles/Werkles`
Starting source: `06dd1a5e5e5b18575b2c05f60c9aa1fe9661d122`

## Mission

Remove or make uncallable the unused legacy Bellows recommendation loader that still performs global/latest intake, run, and ledger reads without authenticated owner custody.

## Read-only P pull

Inspect current imports, tests, and safety reviews. Return the two strongest bounded changes that eliminate accidental reattachment of the unsafe loader while preserving the public example-only boundary. Findings only; Heimerdinker owns all edits, verification, deploys, commits, and pushes.

## G boundary

- Do not add auth, ownership, RLS, schema, flags, or member-data reads in this slice.
- Do not claim the future authenticated recommendation flow is complete.
- Keep `/bellows/recommendations` example-only and keep packet POST fail-closed at 403.
- Operator or future member delivery remains a separately gated design.
- Update tests and stale source-state references only where needed to prove the unsafe module cannot be imported by application code.
- Preview only. No Production action.

## Acceptance

- No application module can import or call the global/latest Bellows recommendation or ledger loader.
- The public helper remains free of personal/global readers regardless of matching flags.
- Direct packet POST remains 403 before JSON parsing or storage.
- Existing public and Matching regressions, typecheck, and build remain green.
