# Ghost Forge POP Today Live Receipt - 2026-06-29

PACKET_ID: GHOST_FORGE_POP_TODAY_20260629

STATUS: LIVE_RUN_COMPLETED_WITH_QA_MISSES

## Gate Answer

The gate was the repo cockpit language that still said:

- do not run Ghost Forge
- do not generate images
- paid calls allowed: no

Ben cleared that gate for this specific run with:

```text
Why didn't you run Ghost Forge? This is something I've done in the past, and something I just gave you permission for. Go now, please. What is the gate?
```

The approval was recorded in `foreman/gates/APPROVAL_LOG.md`.

## What Ran

Runner:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File foreman\ghost-forge\run-pop-today-on-ghost-forge.ps1 -MaxWaitMinutes 35 -PollSeconds 20 -SubmitPauseSeconds 10
```

Worker:

```text
https://werkles-ghost-forge1.onrender.com
```

Health proof:

```text
HTTP 200
service: ghost-forge-worker
renderer: replicate
```

## Result

Manifest:

```text
foreman/ghost-forge/GHOST_FORGE_POP_TODAY_LIVE_RESULTS_20260629.json
```

Run ID:

```text
GHOST_FORGE_POP_TODAY_20260629-181952
```

Completion:

```text
submitted_count: 5
completed_count: 5
downloaded_count: 5
estimated_cost_usd: 1.0
```

## Batch IDs And Files

| Asset | Batch ID | Local file |
| --- | --- | --- |
| `T1_001_WET_ASPHALT_SODIUM_LIT` | `10edfc5a-d1ee-4f20-afa8-69061a455dbf` | `public/assets/draft/oddly-godly-pop-today/T_OG_ATL_WetAsphalt_SodiumLit_Albedo.png` |
| `T1_006_GOOP_RESIDUE_OVERLAY` | `980240b1-bd51-440b-8a62-25ffcbf88cad` | `public/assets/draft/oddly-godly-pop-today/T_OG_ATL_GoopResidueOverlay_Color.png` |
| `T2_007_WET_PUDDLE_DECALS` | `776052e7-3b47-43ce-8606-929f8a7a3c36` | `public/assets/draft/oddly-godly-pop-today/D_OG_WetPuddles_Atlas.png` |
| `T2_008_GOOP_SPLATTER_DECALS` | `acb4c32c-b122-4219-bae7-f9aabe89ea3e` | `public/assets/draft/oddly-godly-pop-today/D_OG_GoopSplatterResidue_Atlas.png` |
| `T5_025_GOOP_FIREWORK_BURST` | `9f09dd44-6464-4742-876c-a8a853819db4` | `public/assets/draft/oddly-godly-pop-today/FX_OG_GoopBurst_8x8_ColorAlpha.png` |

## QA Facts

All five downloaded images are `1024x1024` PNG files.

All five are `Format24bppRgb`, so none has a real alpha channel.

Contact sheet:

```text
foreman/artifacts/ghost_forge_pop_today_contact_sheet.png
```

## Honest Misses

This was a real Ghost Forge / Render run, but it is not a final Unreal-ready asset pass.

Known misses:

- The shopping list requested 2K/4K for surfaces; the worker returned 1024 square.
- The decal assets requested transparent PNG alpha; the worker returned RGB PNGs with no alpha.
- The VFX asset requested an 8x8 flipbook; the first pass visually came back closer to a 2x2 concept sheet.
- Only color/albedo-style files were produced; no separate normal, roughness, height, alpha, or emissive maps were produced.

## Next Best Move

Run a constrained second pass for technical compliance:

- force exact 2048 or 4096 output if the provider/model supports it
- route decal and VFX work through a model or post-process that can produce alpha
- split the VFX request into a true `8x8` grid requirement or use a dedicated flipbook-generation path
- generate companion maps locally or through a texture-specific pipeline
