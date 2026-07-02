# WERKLES_RENDER_BATCH_1

Status: **DRAFT / PREVIEW ONLY** — not final brand approval  
Mission: human-first homepage/gallery imagery  
Style lock: documentary realism · warm natural light · subtle copper/workshop warmth

## Batch roster

| # | ID | Scene | Recommended placement |
|---|-----|-------|----------------------|
| 1 | `spark-kitchen-table` | Spark founder at kitchen table | **Hero background** (primary) · Spark lane card |
| 2 | `operator-nurse-sue` | Nurse Sue operator in medical office | Operator lane card · `#how` step 2 |
| 3 | `electrician-bookkeeper` | Electrician + bookkeeper reviewing job profitability | Builder + Backer formation partial backdrop |
| 4 | `connector-intro` | Connector introducing two founders | Connector lane card · formation partial |
| 5 | `accountants-plumbing` | Three accountants partnering with plumbing company | Formation formed · `#people` gallery |
| 6 | `drone-crabbing-team` | Drone crabbing startup team | Spark lane alt · gallery hero candidate |
| 7 | `mentor-contractor` | Retired contractor mentoring younger builder | Builder lane card · trust band |
| 8 | `backer-opportunity-packet` | Local business backer reviewing opportunity packet | Backer lane card · beta/proof ops card scrim |

## Hero recommendation

**Primary:** `werkles-render-batch-1-spark-kitchen-table.png`  
Half-lit kitchen table, founder leaning over napkin sketch — matches Spark lane and homepage confrontation copy without stock-photo energy.

**Alternate:** `werkles-render-batch-1-connector-intro.png` if hero needs two-person formation beat.

## Global prompt prefix

Documentary photograph, heightened realism, believable small-business space, warm natural window light, subtle copper and warm paper tones, anonymous adults, protagonist energy, no text, no logos.

## Global negative

Fantasy, AI holograms, floating gears, stock-photo smiles, crypto aesthetics, glass skyscraper boardroom, corporate diversity poster, movie poster lighting, magical effects.

## Asset folder

`public/assets/draft/render-batch-1/`

## Gates

- No production deploy
- No merge to main
- Gate 05 Render spend not invoked — local preview batch

## Delivery status (2026-06-06)

| Deliverable | Status |
|-------------|--------|
| 8 image files in `public/assets/draft/render-batch-1/` | Done |
| Manifest `lib/render-batch-1-imagery.ts` | Done |
| Hero wired (`hero--render-batch-1`) | Done — Spark kitchen table |
| Lane cards + formation backdrops | Done |
| Gallery `#render-batch-1` on homepage | Done |
| Local preview | http://localhost:3000 · http://localhost:3000/#render-batch-1 |

Toggle: `RENDER_BATCH_1_ENABLED` in `lib/render-batch-1-imagery.ts`
