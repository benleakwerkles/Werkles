# Speaker Memory Packet Template

Copy this shape for new causal entries in `foreman/speaker/entries/`.

Filename: `DRAFT_<yyyymmdd>-<slug>.md` or `RATIFIED_<yyyymmdd>-<slug>.md`

Authority: `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`

---

## Required fields (all ten)

Every entry must answer these — do not compress into a summary alone.

| # | Field | Section heading |
|---|-------|-----------------|
| 1 | Event | `## Event` |
| 2 | Context | `## Context` |
| 3 | Decision | `## Decision` |
| 4 | Why It Happened | `## Why it happened` |
| 5 | Risk Exposed | `## Risk exposed` |
| 6 | Lesson Learned | `## Lesson learned` |
| 7 | Doctrine Changed | `## Doctrine changed` |
| 8 | Who / What Must Remember | `## Who must remember` |
| 9 | Future Warning | `## Future warning` |
| 10 | Source Artifacts / Threads | `## Source artifacts` |

---

```markdown
---
id: DRAFT_YYYYMMDD-slug-here
status: DRAFT
title: Short human title
created_at: YYYY-MM-DD
source_notes:
  - foreman/path/to/evidence.md
tags:
  - operator
  - gd-boundary
warning_triggers:
  - gd routing changes
  - relay courier
related_entries: []
---

## Event

What happened?

## Context

What was happening around it?

## Decision

What was decided?

## Why it happened

What caused the decision? Preserve causal detail — not slogans.

## Risk exposed

What danger became visible?

## Lesson learned

What should future agents remember?

## Doctrine changed

What rule or operating principle changed? Write `none` if unchanged.

## Who must remember

Which Aeyes, systems, or builders need this?

## Future warning

What failure pattern should trigger Speaker recall?

## Source artifacts

- Path or transcript reference — never rewrite without citing source.
```

---

## Status rules

| Field | Rule |
|-------|------|
| `status` | `DRAFT` \| `RATIFIED` \| `SUPERSEDED` |
| `ratified_at` | Ben only — omit until ratified |
| `ratified_by` | `Ben` when ratified |
| `superseded_by` | id of replacement entry — never delete old file |

---

## Ratification block (Ben only)

```markdown
---
ratified_at: YYYY-MM-DD
ratified_by: Ben
status: RATIFIED
---
```

Mark prior entry `SUPERSEDED` — do not delete prior text.
