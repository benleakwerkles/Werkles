# Render Batch 2 - Results

**Gate:** `RENDER_BATCH_2_OPERATOR_GO`
**Run:** `RENDER_BATCH_2_20260606-183958`
**Operator phrase:** next Render batch - icons, Spaces, Arc 3 Werkles
**Status:** 9/9 completed - draft/review only

---

## Spend

| Metric | Value |
|--------|--------|
| Shots | 9 |
| Estimated image spend | **$1.80** (~$0.20 x 9, worker estimate incl. Claude prompt gen) |
| Prior batch 1 (same day) | $1.40 |
| Combined narrative day est. | ~$3.20 (under $10 lane cap) |
| 402 errors | None |
| 429 rate limit | Hit after 5 rapid submits; resumed after hourly window cleared |

---

## Asset inventory

### Lane token icons (`public/assets/draft/icons-v1/`)

| Shot ID | File |
|---------|------|
| `icon-lane-spark-ember` | `werkles-icon-lane-spark-ember-v1.png` |
| `icon-lane-builder-square` | `werkles-icon-lane-builder-framing-square-v1.png` |
| `icon-lane-worker-glove` | `werkles-icon-lane-worker-glove-v1.png` |
| `icon-lane-operator-dial` | `werkles-icon-lane-operator-dial-v1.png` |
| `icon-lane-backer-dog` | `werkles-icon-lane-backer-dog-token-v1.png` |
| `icon-lane-connector-bridge` | `werkles-icon-lane-connector-bridge-v1.png` |

### Space + Forge extras (`public/assets/draft/homepage-narrative-v2/`)

| Shot ID | File |
|---------|------|
| `space-d03-tool-at-rest` | `werkles-homepage-narrative-space-d03-tool-at-rest.png` |
| `forge-a04-three-at-plan` | `werkles-homepage-narrative-forge-a04-three-at-plan.png` |
| `forge-a05-nearly-finished-pair` | `werkles-homepage-narrative-forge-a05-nearly-finished-pair.png` |

**Docs:** `foreman/ghost-forge/RENDER_BATCH_2_SHOT_LIST.md`
**Script:** `scripts/foreman/ghost-forge-render-batch-2.ps1`
**Log:** `foreman/ghost-forge/render-batch-2-run.log`
**JSON:** `foreman/ghost-forge/RENDER_BATCH_2_RESULTS.json`

---

## Strongest (doctrine pass - operator review)

1. **`icon-lane-builder-square` / `icon-lane-operator-dial`** - clearest Monopoly-token silhouettes; good lane-card scale candidates vs hand-authored SVG primary set.
2. **`space-d03-tool-at-rest`** - intimate Space register; pairs with D01/D02 without repeating wide-room grammar.
3. **`forge-a05-nearly-finished-pair`** - bridges half-built (A03) toward Foundry; shared task energy, low presentation risk.
4. **`forge-a04-three-at-plan`** - useful Connector/formation alt for `#lanes` when three-person beat is needed.

---

## Weakest (review before wire)

1. **`icon-lane-spark-ember`** - may read as generic gem/coal; compare to SVG ember + flare set before replacing lane tokens.
2. **`icon-lane-backer-dog`** - Monopoly dog may feel on-nose; keep as PNG exploration, not brand lock.
3. **`icon-lane-worker-glove`** - verify 24px legibility; thumb blob risk per `WERKLES_LANE_TOKEN_SYSTEM_V1.md`.
4. **Icons overall** - raster brass may fight v2 Operator Marks direction; wire only as `#lane-tokens` Ghost Forge comparison sheet, not production icons.

---

## Recommended wire targets (preview only)

| Placement | Asset |
|-----------|--------|
| `#lane-tokens` or visual-system section | 6-up icons-v1 sheet next to SVG primary/flare |
| `#space` detail / gallery crop | `space-d03-tool-at-rest` |
| Forge scroll after A03 | `forge-a05-nearly-finished-pair` |
| Formation / Connector alt | `forge-a04-three-at-plan` |
| Keep v1 hero/space | Still `homepage-narrative-v1` D01 + C01 unless Ben swaps |

**Resume partial runs:** `.\scripts\foreman\ghost-forge-render-batch-2.ps1 -ShotIds "<id>"` — fail-fast on 429; operator lift: `foreman/ghost-forge/OPERATOR_RATE_LIMIT.md`

---

## Gate posture

**PAUSE** Ghost Forge spend after this batch unless Ben opens a new phrase. Draft/review only - no prod deploy.
