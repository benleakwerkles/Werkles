# Render Batch 3 - Results

**Gate:** `RENDER_BATCH_3_OPERATOR_GO`
**Run:** `RENDER_BATCH_3_20260606-185506` (partial - resumed separately if noted)
**Operator phrase:** restart Ghost Forge - icons narrative/human direction + more Spaces + Act Three
**Status:** **11/11 completed** (3 initial + 8 resumed 2026-06-06 ~19:24 local)

---

## Spend (partial)

| Metric | Value |
|--------|--------|
| Shots completed | 3 |
| Shots remaining | 8 |
| Estimated spend (this partial) | **$0.60** |
| 429 | Hit on `icon-v2-operator-keyring` (4th submit in window after batches 1+2 today) |

---

## Completed assets

### Narrative-human lane icons (`public/assets/draft/icons-v2/`)

| Shot ID | File |
|---------|------|
| `icon-v2-spark-flint` | `werkles-icon-v2-lane-spark-flint-strike.png` |
| `icon-v2-builder-tsquare` | `werkles-icon-v2-lane-builder-tsquare.png` |
| `icon-v2-worker-tongs` | `werkles-icon-v2-lane-worker-tongs.png` |

### Pending (429 stop)

- `icon-v2-operator-keyring`, `icon-v2-backer-ingot`, `icon-v2-connector-rings`
- `space-d04-reception-quiet`, `space-d05-van-dawn`, `space-d02-materials-staged`
- `forge-a06-builder-operator-plan`, `forge-a07-connector-intro-table`

---

## Resume

```powershell
.\scripts\foreman\ghost-forge-render-batch-3.ps1 -Force -ShotIds @(
  "icon-v2-operator-keyring","icon-v2-backer-ingot","icon-v2-connector-rings",
  "space-d04-reception-quiet","space-d05-van-dawn","space-d02-materials-staged",
  "forge-a06-builder-operator-plan","forge-a07-connector-intro-table"
)
```

If 429 persists: set `GHOST_FORGE_SKIP_RATE_LIMIT=1` on Render worker and redeploy, then re-run with `-Force`. See `foreman/ghost-forge/OPERATOR_RATE_LIMIT.md`.

**Script:** `scripts/foreman/ghost-forge-render-batch-3.ps1`
**Shot list:** `foreman/ghost-forge/RENDER_BATCH_3_SHOT_LIST.md`

---

## Direction note

Batch 3 icons use **documentary object portraits** (flare-set props on real workbench) instead of Batch 2 brass Monopoly tokens - aligned with `IMAGERY_DIRECTION.md` and narrative wire grammar.

---

## Gate posture

**PAUSE** after partial unless Ben resumes. Draft/review only.
