# WERKLES_LANE_TOKEN_SYSTEM_V1

Status: **DRAFT / EXPLORATION**  
Style: Monopoly-style business tokens × workshop foundry · brass/copper on cream

## Six frozen lanes

| Lane | Role | Primary symbol | Alternate symbol |
|------|------|----------------|------------------|
| Spark | Idea / opportunity | Ember | Match |
| Builder | Builds system/product | Framing square | Blueprint block |
| Worker | Skilled craft / execution | Work glove | Work boot |
| Operator | Runs process / back office | Control dial | Clipboard |
| Backer | Capital / resources | Brass dog token | Foundation block |
| Connector | People / access | Bridge | Compass |

## Recommendation: **Primary set**

| Criterion | Primary wins |
|-----------|--------------|
| Silhouette clarity | Filled brass shapes read at 24px (square, dial, bridge, ember) |
| Monopoly token DNA | Dog token + object tokens feel like game pieces, not UI clipart |
| Lane differentiation | Six distinct object classes — no two read alike |
| Mythic-but-credible | Ember, bridge, dial carry story without fantasy crest energy |
| Workshop fit | Framing square + glove anchor craft/foundry tone |

**Alternate set** is stronger for Operator (clipboard) and Backer (foundation block) individually, but weaker as a **system** — compass and match lose legibility at 24px.

## Small-size risk notes

| Token | Set | Risk at 24px |
|-------|-----|----------------|
| Backer dog token | Primary | Needs Monopoly-token context; silhouette ok at 32px+, borderline at 24px |
| Worker glove | Primary | Thumb bump may muddy; still distinct from boot |
| Connector compass | Alternate | Thin legs — **fails** at 24px mono |
| Spark match | Alternate | Flame nub nearly lost at 24px |
| Builder blueprint block | Alternate | Grid lines collapse — use solid block only |

**Strong at 24px (both sets):** framing square, control dial, bridge, foundation block, boot, ember (solid fill).

## Assets

`public/assets/draft/lane-token-system-v1/`  
Preview: `preview-sheet.html` · `preview-sheet.svg`  
Manifest: `lib/lane-token-system-v1.ts` (`ENABLED = false`)

## Provenance

Hand-authored SVG via agent `Write`. No `GenerateImage`. No Ghost Forge.

## Flare set (draft v2)

`flare/` — more foundry character without fantasy:

| Lane | Symbol | Why |
|------|--------|-----|
| Spark | Flint strike + sparks | Opportunity ignition, not ember blob |
| Builder | T-square | Clear builder read |
| Worker | Crucible tongs + ingot | Foundry execution — not boxing glove |
| Operator | Keyring | Access/control without dial ambiguity |
| Backer | Stacked ingot | Capital metal — readable vs dog token |
| Connector | Interlocking rings | Introduction without bridge cliché |

Preview: homepage `#lane-tokens` (primary on `#lanes` cards when `LANE_TOKEN_SYSTEM_V1_ENABLED`).

## Gates

Lane-card preview wiring only · no production · no merge
