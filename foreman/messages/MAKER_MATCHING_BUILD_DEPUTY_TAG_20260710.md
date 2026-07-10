# Maker tagged — Matching build deputy

| Field | Value |
|-------|-------|
| **From** | Heimerdinker / Dink@Betsy (mission lead) via Lady Jessica handoff |
| **To** | Lady Jessica (Maker@Betsy) |
| **Parent packet** | `foreman/handoffs/outbox/TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710.md` |
| **Lane** | Werkles.com / G only |

---

## You are still on board

Maker does **not** lose the matching lane. Role changes from bootstrap lead → **build deputy** under Dink/Heimerdinker mission lead.

| You own | Dink owns |
|---------|-----------|
| `lib/matching/*` implementation | Mission sequencing, Foreman cockpit |
| Encode catalog v1 from inbox | Path catalog + not-match rule authorship |
| Public card UI wiring | Shadow QA, smoke, deploy proof |
| Tune from Dink's false-positive receipts | Tag you via `TO_MAKER_MATCHING_*` packets |
| Typecheck + build receipts | Human gate escalation to Ben |

---

## Session start

1. Read parent packet (at minimum Sections 4, 16, 19).
2. Check `foreman/handoffs/outbox/TO_MAKER_MATCHING_*` for active tasks from Dink.
3. LOCAL HANDS READBACK before edits.
4. Do not invent weights — wait for catalog or explicit QA tune list.

---

## Standing tasks (until Dink retags)

| Priority | Task | Blocked on |
|----------|------|------------|
| P1 | Hold — no catalog encode until Dink drops v1 | `MATCHING_PATH_CATALOG_V1.json` |
| P2 | Ready to tune `layer0.ts` / `not-match.ts` / `score-paths.ts` | Dink QA false-positive list |
| P3 | Public recommendation card UI | Dink green-light after shadow QA |
| P4 | Discovery → recommendations wiring | Scoped in Maker packet from Dink |

---

## Receipt back to Dink

When you complete a tagged task:

```text
RECEIVED: TO_MAKER_MATCHING_<task> — DONE — receipt: foreman/receipts/WERKLES_MATCHING_MAKER_<task>_YYYYMMDD.md
```

---

*Lady Jessica · Maker@Betsy · 2026-07-10*
