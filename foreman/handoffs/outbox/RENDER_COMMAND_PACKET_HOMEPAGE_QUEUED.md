# Render Command Packet — Homepage

Status: **ORDER APPROVED** — Ben `Render order Go--Ben` (2026-06-06)  
Ghost Forge **spend:** Gate 05 **PAUSE** until separate RESUME  
Architecture: `foreman/ghost-forge/WERKLES_HOMEPAGE_SHOT_ARCHITECTURE_v1.md`

---

## Hard stops

- No production deploy · no push to `main`
- No auth, Stripe, Supabase, SQL, secrets changes
- No new homepage strategy or business claims
- Bind prompts to approved shot lists only

---

## Approved execution order

| Step | Batch | ID | Act |
|------|-------|-----|-----|
| 1 | C | `spark-c01-kitchen-table` | Spark — hero |
| 2 | D | `space-d01-before-opening` | Space — `#space` |
| 3 | C | `spark-c02-before-the-day` | Spark — alt |
| 4 | D | `space-d02-half-built` | Space — Forge rhyme |
| 5 | A | `forge-a03-half-built-pair` | Forge — new |
| 6 | B | `foundry-b01-shop-floor` | Foundry — new |
| 7 | B | `foundry-b02-finished-product` | Foundry — new |
| 8 | C | `spark-c03-in-transit` | Spark — if budget |
| 9 | D | `space-d03-tool-at-rest` | Space — if budget |

**Reuse (no re-render):** Batch 1 — `connector-intro`, `electrician-bookkeeper`, `accountants-plumbing`, `mentor-contractor`, `operator-nurse-sue`, `backer-opportunity-packet`

**Budget cut order:** C03 → D03 → Foundry gallery alts

---

## Shot list paths

| Batch | File |
|-------|------|
| Spark C | `foreman/ghost-forge/SPARK_BATCH_C_SHOT_LIST.md` |
| Space D | `foreman/ghost-forge/SPACE_BATCH_D_SHOT_LIST.md` |
| Forge A | `foreman/ghost-forge/FORGE_BATCH_A_SHOT_LIST.md` |
| Foundry B | `foreman/ghost-forge/FOUNDRY_BATCH_B_SHOT_LIST.md` |

---

## Maker wiring (after assets land)

1. Hero ← `spark-c01-kitchen-table`
2. `#space` ← `space-d01-before-opening` (remove CSS placeholder)
3. Formation ← `forge-a03` after `space-d02` scroll rhyme
4. Ops card scrim ← Foundry B01+B02 pair

---

## Gate

| Item | Status |
|------|--------|
| Render order | **GO** — Ben approved |
| Ghost Forge API spend | **PAUSE** — resume Gate 05 separately |
