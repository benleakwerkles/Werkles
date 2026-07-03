# Ghost Forge Production Asset Contract V0

Status: DRAFT CONTRACT

Purpose: stop Ghost Forge from treating technical asset requirements as prompt flavor.

## Rule

A production asset request must declare hard output fields outside the prose prompt. If the selected provider/model cannot satisfy them, the worker should reject the request before creating a paid prediction.

## Required Fields

Each asset must define:

- `asset_id`
- `asset_kind`
- `target_width`
- `target_height`
- `alpha_required`
- `native_resolution_required`
- `map_outputs`
- `animation_grid`
- `delivery_stems`
- `qa_fail_conditions`

## Asset Kinds

### `tileable_surface_texture`

Required:

- square output
- native target resolution, normally `2048` or `4096`
- tileability check
- albedo output

Optional but preferred:

- normal
- roughness
- height
- ambient occlusion

Reject if:

- output is below target resolution
- output is not square
- obvious perspective scene instead of surface
- no albedo file is produced

### `transparent_decal_atlas`

Required:

- PNG or equivalent alpha-capable format
- real transparent pixels
- isolated decal shapes
- no baked photo background

Reject if:

- RGB-only output
- alpha is fully opaque
- background is baked into the image
- asset contains readable real-world marks

### `vfx_flipbook_frame_sheet`

Required:

- declared grid, for example `8x8`
- exactly `grid_cols * grid_rows` readable frames
- centered frames
- alpha or separately generated alpha mask
- visible temporal progression

Reject if:

- generated image is a concept sheet instead of a frame sheet
- frame count does not match grid
- alpha is absent when required
- frames are not evenly spaced

## Provider Capability Preflight

Before spending, Ghost Forge should know whether the selected model supports:

- requested resolution
- transparent background
- deterministic grid composition
- image-to-image or mask mode
- texture/material map output

If not, the worker should return `422_UNSUPPORTED_ASSET_CONTRACT` and suggest a different lane:

- lookdev reference
- local post-process
- texture-specific provider
- Unreal/material-authoring pass

## Honest Status Tokens

Allowed status values:

- `PRODUCTION_READY`
- `PROTOTYPE_MATERIAL_SEED`
- `DECAL_CANDIDATE_SYNTH_ALPHA`
- `STYLE_REFERENCE_ONLY`
- `CONCEPT_REFERENCE_ONLY`
- `VFX_CONCEPT_REFERENCE_ONLY`
- `BLOCKED_PROVIDER_CAPABILITY`
- `FAILED_QA_CONTRACT`

No run should return `PRODUCTION_READY` unless every hard output field passes.
