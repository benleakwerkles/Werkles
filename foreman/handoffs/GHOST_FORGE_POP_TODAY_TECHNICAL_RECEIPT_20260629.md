# Ghost Forge POP Today Technical Receipt - 2026-06-29

PACKET_ID: GHOST_FORGE_POP_TODAY_20260629

STATUS: PASS_TECHNICAL_PACK_WITH_LIMITATIONS

## Direct Answer

These images help with lookdev. They do not, by themselves, build the architecture of a city or a character in a video game.

The Render order was not useless. It was just underspecified for production game assets.

It produced:

- mood and palette
- wet asphalt direction
- Goop color/material language
- puddle/reflection ideas
- a Goop decal candidate
- a VFX concept image

It did not produce:

- city geometry
- modular architecture kits
- trim sheets
- real transparent decal atlases
- native 2K/4K material maps
- true PBR sets
- character turnarounds
- rig-ready character references
- a real 8x8 VFX flipbook

## What Codex Built After QA

Local technical pack:

```text
public/assets/draft/oddly-godly-pop-today-technical
```

Status:

```text
foreman/artifacts/ghost_forge_pop_today_technical_status.json
```

Contact sheet:

```text
foreman/artifacts/ghost_forge_pop_today_technical_contact_sheet.png
```

Game asset assessment:

```text
foreman/ghost-forge/GHOST_FORGE_VIDEO_GAME_ASSET_ASSESSMENT_20260629.md
```

Production contract draft:

```text
foreman/ghost-forge/GHOST_FORGE_PRODUCTION_ASSET_CONTRACT_V0.md
```

## Technical Pack Result

| Asset | Status | Use |
| --- | --- | --- |
| Wet asphalt | `PROTOTYPE_MATERIAL_SEED` | Prototype city ground material with synthetic albedo/height/roughness/normal |
| Goop residue overlay | `STYLE_REFERENCE_ONLY` | Signature Goop visual language, not a reusable overlay |
| Wet puddles | `CONCEPT_REFERENCE_ONLY` | Puddle shape/reflection reference, not a decal |
| Goop splatter | `DECAL_CANDIDATE_SYNTH_ALPHA` | Rough transparent decal candidate after local white-key alpha extraction |
| Goop firework burst | `VFX_CONCEPT_REFERENCE_ONLY` | VFX color/silhouette reference, not a flipbook |

## Important Honesty

No second paid Render/Replicate generation call was made for this technical pack.

The pack is derived locally from the first live Ghost Forge outputs.

The 2048 files are synthetic/upscaled, not native 2K generation.

The asphalt PBR maps are synthetic from color, not authored production maps.

The only real alpha-bearing candidate in this pass is the Goop splatter cutout candidate.

## Next Correct Render Order

For city architecture:

- modular street kit sheets
- storefront facade modules
- trim sheets with dimensions
- prop kit sheets
- top-down block layouts
- material map contracts

For character:

- full-body front/side/back orthographic sheet
- head/expression sheet
- clothing/material callout sheet
- hands/shoes/bag close-read sheet
- Goop rim/emissive mask sheet
- animation silhouette pose sheet

For Ghost Forge itself:

- enforce hard output fields outside prompt prose
- reject unsupported alpha/resolution/map/flipbook requests before spending
- return honest status tokens like `STYLE_REFERENCE_ONLY`, `FAILED_QA_CONTRACT`, or `PRODUCTION_READY`
