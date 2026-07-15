# Demo + Locke Harvey Plan Intake Contract — 2026-07-13

Status: `READY_FOR_BETSY_PLAN_RETURN`

This contract lets Harvey accept Betsy's writing and architecture plan without
requiring Ben to reconstruct it in chat.

## Named seats

- `Demo @ Betsy via ChatGPT Work`: long-form writing, synthesis, and narrative planning.
- `Locke @ Betsy via Codex`: architecture, implementation planning, and code construction.

The names identify roles. They do not prove a live machine route, receiver, or
completion receipt.

## Accepted return artifacts

Place one or more Markdown returns in `foreman/handoffs/inbox/` using one of
these names:

```text
FROM_DEMO_HARVEY_PLAN_<timestamp>.md
FROM_LOCKE_HARVEY_PLAN_<timestamp>.md
FROM_DEMO_LOCKE_HARVEY_GAME_PLAN_<timestamp>.md
```

Harvey scans those exact patterns and shows the latest files it can actually
read. An expected filename is not a receipt.

## Required contents

1. `IDENTITY`: cousin name, canonical machine, hostname evidence, runtime, repo,
   branch, and commit.
2. `SOURCES READ`: exact repo files, manuscripts, notes, and prior receipts used.
3. `CURRENT TRUTH`: what exists now, what is only reported, and what is unknown.
4. `PLAN`: prioritized slices with an owner, reviewer, machine, acceptance proof,
   dependencies, and stop condition for every slice.
5. `DEMO VIEW`: narrative, writing, organization, and human-use recommendations.
6. `LOCKE VIEW`: architecture, interfaces, data truth, build order, and technical
   risk recommendations.
7. `DISAGREEMENTS`: unresolved Demo/Locke differences stay visible for Ben.
8. `NEXT VPG`: the smallest `VPG VERIFY`, `VPG PREPARE`, and `VPG GO` sequence.

## Boundaries

- No secrets, password values, tokens, authentication output, or provider sign-in.
- No deploy, push, merge, spend, schema apply, or public release authority is implied.
- Do not call `SENT`, assignment, or a generated plan completion.
- Machine-local claims require machine-local evidence.
- A combined plan may recommend changes, but Ben retains creative and major
  architecture decisions.

