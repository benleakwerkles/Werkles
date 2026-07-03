# Ender — Human Experience Review · SoleDash

Status: **v1 seed** for SoleDash OS Reframe  
Core test: **“Am I updating this, or is it updating me?”**

---

## Diagnosis (v1 surface)

SoleDash drifted toward **project board UX**:

- Six proposal cards read as a backlog to groom
- Status chips, lanes, and recent-receipt lists ask Ben to **maintain the board**
- Transport paths and cousin routing compete with the actual decision
- Multiple sections (“Needs you”, “On the table”, “Snoozed”, “Approved”) mimic Kanban columns without workflow value

**Verdict:** The machine was updating Ben — he was scanning tickets, not deciding once and moving on.

---

## Operating system frame

SoleDash is not Jira. It is the **Operator OS shell**:

| OS primitive | SoleDash meaning |
|--------------|------------------|
| **Frontier** | The one decision Ben makes next — singular, operable |
| **State** | Shown through what changed after action — not badge zoo |
| **Instrumentation** | History, queue depth, machine readback — collapsed, for audit only |
| **Transport gap** | Exact reason SoleDash cannot finish the loop — surfaced only when true |

---

## Design laws

1. **One live frontier** — never six equal cards fighting for attention
2. **Decisions first, transport second** — paths live behind MORE INFO or gap panel
3. **No status unless needed** — hide READY/DISPATCHED unless action blocked
4. **Behavior is state** — YEA advances frontier; NAY clears it; machine proposes next
5. **Operable or honest** — if SoleDash cannot execute, say exactly what Ben must do once
6. **Instrumentation ≠ workload** — backlog is telemetry, not a grooming surface

---

## Anti-patterns (do not ship)

- Kanban columns
- Ticket IDs and status columns as primary UI
- “6 proposals awaiting decision” as headline work
- Outbox filenames on the card face
- Operator maintaining COMMAND_STATE to feel “caught up”

---

## Success signal

Ben opens SoleDash, sees **one decision**, acts once, frontier advances — without updating the dashboard.
