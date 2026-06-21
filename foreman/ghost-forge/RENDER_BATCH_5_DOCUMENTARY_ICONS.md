# Render Batch 5 — Documentary Icon Alternates

Status: **DRAFT / PREVIEW ONLY**  
Mission: six **new** lane prop objects — documentary v2-alt set (distinct from Batch 3)  
Operator: queued 2026-06-06 — **Gate 05 PAUSE** — shot list + script only until spend approved  
Budget target: ~$1.20 (6 shots × ~$0.20)

## Roster (6 icons only)

| # | ID | Lane | Prop object | Avoid (Batch 3) |
|---|-----|------|-------------|------------------|
| 1 | `icon-v2b-spark-matchbook` | Spark | Matchbook or unlit candle stub | Flint striker |
| 2 | `icon-v2b-builder-chalkline` | Builder | Chalk line reel or speed square | T-square |
| 3 | `icon-v2b-worker-glove` | Worker | Leather work glove folded | Crucible tongs |
| 4 | `icon-v2b-operator-clipboard` | Operator | Clipboard with blank clip | Keyring |
| 5 | `icon-v2b-backer-envelopes` | Backer | Banded cash envelopes or labeled petty-cash box (no readable text) | Ingot stack |
| 6 | `icon-v2b-connector-cards` | Connector | Two business cards edge-over-edge, blank backs | Interlocking rings |

## Output paths

- Icons: `public/assets/draft/icons-v2-b/`

## Doctrine

Documentary object portraits — same warm realism as Batch 3 (`IMAGERY_DIRECTION.md`), placed by use not styling. No people, no hands, no readable text, no logos.

Prefix/negative: `scripts/foreman/ghost-forge-render-batch-5.ps1` (mirrors Batch 3 icon block).

## Gates

Draft/review only. No prod deploy. Spend lane: `lane-ghost-forge-batch-asset-generation`.  
**Gate 05 PAUSE** — do not render until Operator approves spend.

## Wire

`lib/render-batch-5-imagery.ts` — `RENDER_BATCH_5_WIRE_ENABLED = false` until assets land.
