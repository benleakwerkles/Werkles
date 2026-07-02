# Sally Final Run Status
## Operator GO: Ben 2026-06-10

**Gate:** `SALLY_FINAL_ANYONE_OPERATOR_GO`  
**Script:** `scripts/foreman/ghost-forge-sally-final.ps1`

---

## Authorized runs

| # | Command | Shots | Status |
|---|---------|-------|--------|
| 1 | `.\scripts\foreman\ghost-forge-sally-final.ps1 -Run Narrative` | 5 | **COMPLETE** 5/5 · ~$1.00 |
| 2 | `.\scripts\foreman\ghost-forge-sally-final.ps1 -Run Squibb` | 4 | **COMPLETE** 4/4 · ~$0.80 |
| 3 | `.\scripts\foreman\ghost-forge-sally-final.ps1 -Run Reveals` | 3 | **COMPLETE** 3/3 · ~$0.60 |

**Total:** 12/12 shots · ~$2.40 est.

**Stock batches (free):** **COMPLETE** — 7 images in `public/assets/draft/anyone-narrative-stock/` via `pull-anyone-narrative-stock.ps1`

---

## Site wiring (Maker)

- `lib/anyone-narrative-imagery.ts` — `ANYONE_NARRATIVE_WIRE_ENABLED = true`
- Hero → `hero--anyone-narrative` (stock hero until renders land)
- `AnyoneArcStrip` — five-beat photo grid with render→stock fallback
- Resource cards + momentum + Squibb scout — image-led
- Lanes documentary → anyone stock photos
- Logs: `foreman/ghost-forge/sally-final-{Run}-run.log`
- Manifests: `foreman/ghost-forge/SALLY_FINAL_{Run}_RESULTS.json`

---

## After renders land

Re-run dev preview. `AnyoneNarrativePhoto` auto-swaps from stock to PNG on successful load.

**Squibb canonical cutout:** still manual per `MASCOT_RULES.md` — classy v2 is exploration until Ben picks a bust for cutout.

---

## Run 2 + 3 (operator)

```powershell
cd C:\Dev\Werkles
.\scripts\foreman\ghost-forge-sally-final.ps1 -Run Squibb
.\scripts\foreman\ghost-forge-sally-final.ps1 -Run Reveals
```

Est. ~$2.40 total for 12 Ideogram shots at ~$0.20 each.
