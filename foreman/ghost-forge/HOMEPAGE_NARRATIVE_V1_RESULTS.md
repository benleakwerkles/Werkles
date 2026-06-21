# Homepage Narrative v1 — Render Results

**Gate:** `RESUME_GATE_05_LIMITED_RENDER`  
**Run:** `HOMEPAGE_NARRATIVE_V1_20260606-173458`  
**Status:** 7/7 completed · draft/review only

---

## Spend

| Metric | Value |
|--------|--------|
| Estimated image spend | **$1.40** ($0.20 × 7 batches — worker estimate incl. Claude prompt gen) |
| Budget lane cap | $10.00/run (`foreman/BUDGET.md`) |
| 402 errors | None |
| Duration | ~3 min wall clock |

Actual provider billing may differ; check Replicate/Render dashboards if needed.

---

## Asset paths

| Shot ID | Local path |
|---------|------------|
| `spark-c01-kitchen-table` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-spark-c01-kitchen-table.png` |
| `space-d01-before-opening` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-space-d01-before-opening.png` |
| `spark-c02-before-the-day` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-spark-c02-before-the-day.png` |
| `space-d02-half-built` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-space-d02-half-built.png` |
| `forge-a03-half-built-pair` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-forge-a03-half-built-pair.png` |
| `foundry-b01-shop-floor` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-foundry-b01-shop-floor.png` |
| `foundry-b02-finished-product` | `public/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-foundry-b02-finished-product.png` |

Manifest: `foreman/ghost-forge/HOMEPAGE_NARRATIVE_V1_RESULTS.json`  
Log: `foreman/ghost-forge/homepage-narrative-v1-run.log`  
Script: `scripts/foreman/ghost-forge-homepage-narrative-batch.ps1`

---

## Strongest (doctrine pass)

1. **`spark-c01-kitchen-table`** — Archetypal Spark: household edges, notebook work, no camera eye contact, hopeful not melancholy. **Hero primary.**
2. **`space-d01-before-opening`** — Clear inhabitation (apron, mug, trays); reads paused not abandoned. **Replace `#space` placeholder.**
3. **`space-d02` + `forge-a03` pair** — Empty becoming-room → two people on plan; conversion rhyme lands without copy.
4. **`spark-c02-before-the-day`** — Quiet pre-shift operator Spark; good gallery alt.

---

## Weakest (review before wire)

1. **`foundry-b01-shop-floor`** — Single woodworker close/medium, not wide trades shop floor. Reads **Forge** more than Foundry beachhead. Consider one re-render for wider multi-station trades floor or use as gallery secondary.
2. **`foundry-b02-finished-product`** — Strong work-gravity hands shot; thin on “now it ships” outcome scale. Good ops-card scrim, weak as sole Foundry proof pair mate for b01.
3. **`forge-a03`** — Blueprint prop slightly presentation-adjacent; still passes no-eye-contact rule.

---

## Preview recommendation (local — no prod wire in this run)

| Placement | Asset |
|-----------|--------|
| Hero background | `spark-c01-kitchen-table` |
| `#space` band | `space-d01-before-opening` |
| Scroll rhyme | `space-d02` → `forge-a03` adjacent |
| Spark gallery alt | `spark-c02` |
| Ops / signup scrim pair | `foundry-b02` + retry `foundry-b01` or Batch 1 shop-adjacent asset |

Local review folder: `http://localhost:3001` (open files directly from `public/assets/draft/homepage-narrative-v1/`).

---

## Gate 05 posture

**PAUSE immediately.** Limited batch scope fulfilled; no icons, no style variants, no extra shots. Resume only on explicit new operator phrase + budget line.
