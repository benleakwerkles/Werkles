# Werkles / MaSheen Context — SoleDash OS Thread

**Date:** 2026-06-14  
**Phase:** 0 — Mule Elimination  
**Verdict:** GO SoleDash OS Reframe · NO-GO dashboard cards · NO-GO generic product until transport improves

---

## Core discovery

Ben remains the **Operator**. Ben must not remain the **bus**.

The bottleneck is **transport**, not features:

- copying · pasting · routing · opening cousin surfaces
- relaying context · repeating constraints · tracking receipts
- deciding which Aeye gets what

**SoleDash** is the command surface intended to eliminate this.

---

## Governing test (Ender)

> “Am I updating this, or is it updating me?”

| If… | Then… |
|-----|--------|
| Ben maintains SoleDash | It is Jira (system of record) |
| SoleDash updates Ben and takes his orders | It is an OS (system of state and action) |

Jira = system of record.  
OS = system of state and action.

---

## MaSheen roles (canonical)

| Cousin | Role |
|--------|------|
| Petra | Synthesis, prioritization, red team, GO / CONDITIONAL GO / NO-GO |
| Dink | Speaker, protocols, mule elimination, proposal engine, topology, gates, routing |
| Maker | Implementation, SoleDash, Bellows, buttons, command surfaces |
| Skybro | Thesis, naming, product direction, leverage, strategic pivots |
| Bean | Hostile audit, failure modes, bias, false validation, legal landmines |
| Ender | Human experience, Clippy detection, trust friction, operator usability |
| Thufir | Research radar, OSINT, market/competitor scan |

---

## Machine naming

| Name | Role |
|------|------|
| Betsy | Primary forge |
| Doss | Mobile/mirror forge |
| Sally | Archive/snapshot surface |
| ~~BLDer~~ | **Retired** → use **Doss** |

---

## SoleDash evolution

Dashboard → Proposal Surface → Button command surface → **OS Reframe v1**

Current capabilities: proposals, YEA/NAY/MORE INFO/DEFER, decision receipts, transport behind MORE INFO.

Known failures (pre-OS):

- Many cards = project board feel
- Transport leaks on card face
- Buttons write packets but still need manual cousin open
- “Needs human hands” must not hide fake gates
- Ben still interprets too much

---

## OS Reframe requirements (Maker)

- One live **frontier** — one decision Ben needs to make
- History/backlog → **instrumentation** (collapsed)
- State through **behavior**, not status labels
- Proposal cards are **not tickets**
- Buttons **execute** or expose **exact transport gap**
- Ben clicks **decisions**, not transport packets
- SoleDash **updates Ben** and **takes his orders**

Implementation: `components/soledash/sole-dash-os.tsx` · `lib/soledash/command-surface/os-view.ts`

---

## Proposal Engine priority (Skybro)

Ben’s attention is the most expensive API call. Frontier queue order:

1. Mule elimination
2. Unblockers
3. Revenue protection
4. Trust / safety
5. Master plan advancement
6. Preventing architecture corruption

---

## Open missions

| Owner | Mission |
|-------|---------|
| Dink | Transport Gap Audit v1.1 — live SoleDash cards |
| Bean | Destroy SoleDash v1.1 — actual command surface, not generic dashboards |
| Maker | SoleDash OS Reframe v1 — Ender review |
| Skybro | Proposal Engine inputs (attention = expensive API) |

---

## Phase gate

**Do not drift into product features until transport improves.**

| Phase | Focus |
|-------|--------|
| **0** | Mule Elimination ← **now** |
| 1 | Leverage Board |
| 2 | Matching |

---

## References

- `foreman/reviews/ENDER_HUMAN_EXPERIENCE_REVIEW_SOLEDASH_v1.md`
- `foreman/soledash/SOLEDASH_OS_REFRAME_v1.md`
- `foreman/soledash/MULE_ELIMINATION_MAP_v1.md`
- `foreman/HUMAN_GATES.md`
