# Operator Brief — Tier-2 Two-Run Image Pass

Status: **READY FOR GATE 05 GO** (dry-runs pass)  
Date: 2026-06-07

---

## What this is

Two focused Ghost Forge runs for **second-tier pages** — not more Space shots.

| Run | Batch | Focus | Shots | Output |
|-----|-------|-------|-------|--------|
| **A** | 7 | Act III **Forge** — Werkles forming around the idea (small/large scale) | 4 | `public/assets/draft/tier2-forge-v1/` |
| **B** | 8 | **Hybrid transparent icons** — documentary prop read, between fantasy and flat geometry | 6 | `public/assets/draft/icons-hybrid-v1/` |

**Already wired on localhost:** tier-2 pages use existing v1/v2 Forge + Space (van pseudo-featured on `/membership`) + batch-6 nav icons as icon-rail fallback until batch 8 lands.

---

## Preview URLs (`:3003`)

- `/membership` — van featured + Forge band + icon rail
- `/pricing` — dual Forge + icon rail
- `/dashboard/billing` — Forge featured + icon rail
- `/dashboard/crucible` — Forge band + icon rail
- `/membership/success?preview=1` — Foundry outcome featured

---

## Run A — Batch 7 (Forge)

Shot list: `foreman/ghost-forge/FORGE_BATCH_E_TIER2_SHOT_LIST.md`

```powershell
# Dry run (no spend)
.\scripts\foreman\ghost-forge-render-batch-7-tier2-forge.ps1 -DryRun

# Live — after Gate 05 GO
.\scripts\foreman\ghost-forge-render-batch-7-tier2-forge.ps1
```

**Post-render swap** in `lib/tier2-page-imagery.ts` (`tier2ForgeBatch7Assets`):

| Shot | Page placement |
|------|----------------|
| `e01-garage-prototype-pair` | `/pricing` featured rotation |
| `e02-counter-service-launch` | `/membership` forge band |
| `e03-small-product-bench` | `/billing` featured, `/membership/success` optional |
| `e04-plan-table-tight` | `/crucible` forge band |

---

## Run B — Batch 8 (Hybrid icons)

Shot list: `foreman/ghost-forge/ICONS_BATCH_F_HYBRID_SHOT_LIST.md`

Doctrine: recognizable prop at a glance — **not** geometry quiz, **not** comic-book slides, **not** Monopoly tokens. Transparent alpha, warm metal accent only.

```powershell
# Dry run (no spend)
.\scripts\foreman\ghost-forge-render-batch-8-hybrid-icons.ps1 -DryRun

# Live — after Gate 05 GO
.\scripts\foreman\ghost-forge-render-batch-8-hybrid-icons.ps1
```

**Auto-wire:** `tier2HybridIcons` already points at batch-8 paths; `Tier2HybridIconTile` falls back to batch-6 transparent nav icons until renders exist.

---

## Gate

**Gate 05 / Operator GO** required before non-`-DryRun` runs (Ghost Forge spend).

429 hourly cap: see `foreman/ghost-forge/OPERATOR_RATE_LIMIT.md` — use `-Force` or spacing between batches; do not auto-sleep 30+ minutes.

---

## Operator phrase (optional)

> tier-2 Act III forge + hybrid transparent prop icons
