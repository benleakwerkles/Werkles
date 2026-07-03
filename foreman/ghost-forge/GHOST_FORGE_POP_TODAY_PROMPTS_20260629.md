# Ghost Forge POP Today Prompt Sheet - 2026-06-29

Status: READY_BLOCKED_BY_HUMAN_GATE

This is the executable prompt sheet for the first Oddly Godly Ghost Forge / render batch. It is prepared for the five assets from the shopping list that create the fastest visible jump in the current blockout.

No provider run has been executed from this packet. The repo cockpit currently blocks Ghost Forge runs, image generation, and paid provider calls until Ben explicitly clears the gate.

## Shared Prefix

Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge.

Palette: sodium orange #FF9E47, abyss blue #1B3A6B, Goop teal-cyan #2EE6D6, firework magenta #C24BFF, dirty cream #D9CDB8, washed black #0E1116.

Global negative: No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only.

## 1. T1 #1 - Wet Asphalt, Sodium-Lit

Delivery names:

- `T_OG_ATL_WetAsphalt_SodiumLit_Albedo`
- `T_OG_ATL_WetAsphalt_SodiumLit_Height`
- `T_OG_ATL_WetAsphalt_SodiumLit_Roughness`
- `T_OG_ATL_WetAsphalt_SodiumLit_Normal`

Prompt:

```text
Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge. Seamless tileable wet asphalt surface, dark rain-soaked road, shallow puddling, oil sheen, fine gravel aggregate, faint fictional lane-paint ghosting, sodium streetlight reflections, subtle abyss-blue shadow in cracks, realistic micro-scratches and tire polish, no curb, no cars, no people, no perspective camera. Output a square seamless PBR surface texture with albedo plus height and roughness cues.
```

Negative:

```text
No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only. Avoid obvious seams, repeating stamp patterns, clean new pavement, daytime lighting, readable road text, vehicle parts, sidewalks, buildings, or camera depth.
```

## 2. T1 #6 - Goop Residue Overlay

Delivery names:

- `T_OG_ATL_GoopResidueOverlay_Color`
- `T_OG_ATL_GoopResidueOverlay_Alpha`
- `T_OG_ATL_GoopResidueOverlay_Emissive`
- `T_OG_ATL_GoopResidueOverlay_Height`

Prompt:

```text
Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge. Seamless translucent abyss-blue and teal-cyan organic residue film, wet viscous streaks, thin oily membranes, branching hand-smear shapes, embedded firework-magenta ember flecks, subtle bioluminescent rim, designed as a reusable overlay that can sit on asphalt, concrete, brick, or metal. Output square tileable overlay with alpha/opacity intent and emissive-mask intent.
```

Negative:

```text
No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only. Avoid creature faces, tentacle characters, readable symbols, hard black background baked into the asset, dry paint, candy colors, and obvious pattern seams.
```

## 3. T2 #7 - Wet Puddle Decals

Delivery names:

- `D_OG_WetPuddles_Atlas`
- `D_OG_WetPuddles_Alpha`

Prompt:

```text
Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge. Transparent decal atlas of 3 to 4 irregular wet puddles for asphalt and sidewalk projection, subtle ripple rings, oil-sheen edge, sodium-orange highlight streaks, abyss-blue shadow cores, believable rainwater shapes, isolated decals with clean alpha and no baked ground surface.
```

Negative:

```text
No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only. Avoid full background textures, rectangular patches, obvious repeated blobs, fish-eye reflections, objects reflected in the puddles, or readable signs.
```

## 4. T2 #8 - Goop Splatter And Residue Decals

Delivery names:

- `D_OG_GoopSplatterResidue_Atlas`
- `D_OG_GoopSplatterResidue_Alpha`
- `D_OG_GoopSplatterResidue_Emissive`

Prompt:

```text
Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge. Transparent decal atlas of 5 to 6 abyss-blue Goop splatters, drips, small pools, dragged hand-smears, and thin residue streaks, teal-cyan wet glow, firework-magenta ember sparks embedded in the fluid, high contrast edges for readable projection decals, isolated on alpha with no background.
```

Negative:

```text
No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only. Avoid cartoon slime, monster anatomy, readable runes, real graffiti tags, symmetrical icons, and hard rectangular backing.
```

## 5. T5 #25 - Goop Firework Burst

Delivery names:

- `FX_OG_GoopBurst_8x8_ColorAlpha`
- `FX_OG_GoopBurst_8x8_Emissive`

Prompt:

```text
Oddly Godly: wet Atlanta night, modern urban fantasy, grounded lived-in grimy realism, cinematic high-detail PBR material quality, sodium-orange streetlight warmth against abyss-blue and teal shadow, abyss-blue Goop with teal-cyan glow and firework-ember magic, grotesque horror-comedy edge. Power-of-two 8x8 VFX flipbook frame sheet showing a Goop firework burst: abyss-blue core eruption, teal-cyan liquid-energy petals, firework-magenta spark trails, ember fragments, fast explosive opening into dissipating wet luminous mist, isolated on transparent alpha, suitable for a game particle system. Keep each frame centered and evenly spaced in the grid.
```

Negative:

```text
No real brand logos, no readable real-world text, no celebrity likeness, no copied game UI or HUD, no recognizable existing-game monsters or characters, no real license plates, no watermark, no signature, no border, fictional marks only. Avoid anime character silhouettes, magic circles with readable text, UI icons, full scene backgrounds, off-grid frames, nontransparent backing, and copyrighted monster shapes.
```

## Run Gate

To actually execute this through Ghost Forge, Render, or another image provider, Ben must explicitly clear:

- image generation
- Ghost Forge / provider execution
- any paid call or account action
- final creative-direction approval for this batch
