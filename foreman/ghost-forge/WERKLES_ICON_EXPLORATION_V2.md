# WERKLES_ICON_EXPLORATION_V2

Status: **DRAFT / RETRY** — supersedes v1 quality bar  
Prior: `WERKLES_ICON_EXPLORATION_V1.md` (rejected — crude geometry, wrong recommendation)

## Why v1 failed

| Issue | v1 problem | v2 fix |
|-------|------------|--------|
| Brand fit | Generic zigzag/network clipart | Interlocking **W** matches wordmark + design-system duochrome |
| Lane icons | Pictogram stubs | Refined from existing `style-line` copper grammar (candle, blocks, arch, hub) |
| Stroke craft | 1.75px inconsistent paths | 1.9px uniform, round joins, optical padding |
| Preview | AI `GenerateImage` PNG (non-reproducible) | HTML scale ladder only — no external image API |
| Recommendation | Network (wrong for current brand) | **Operator Marks** — violet/teal interlock + copper UI variant |

## Recommended direction: Operator Marks

- Left ribbon `#3D16CA`, right ribbon `#02917E` (design-system tokens)
- Copper mono/cream for lane UI on workshop paper
- Five-piece W experiment uses same stroke skeleton

## Assets

`public/assets/draft/icon-exploration-v2/`  
Preview: open `preview-sheet.html` (includes v1 vs v2 operator comparison)

Manifest: `lib/icon-exploration-v2.ts` (`ENABLED = false`)

## Provenance

**100% local hand-authored SVG** via agent `Write` tool. No `GenerateImage`. No Ghost Forge.

## Gates

No production deploy · no merge · no homepage wiring unless explicitly scoped
