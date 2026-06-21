# GD_INTENT_ROUTER_V1 — Visual Narrative Test

**Run:** `GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334`  
**Status:** COMPLETE (plan only — no render, no homepage edit)

## Operator input

```text
HOMEPAGE_VISUAL_NARRATIVE
```

## Auto-routing (no cousin picking)

| Cousin | Lens |
|--------|------|
| ENDER | Homepage / signup / proof visual rhythm |
| SKYBRO | Narrative language + emotional arc |
| COMPUTER | Competitor / differentiation sanity |

## Deliverables

| # | Artifact | Path |
|---|----------|------|
| 1 | Registry entry | `foreman/gd-intent-router/mission-classes.json` → `HOMEPAGE_VISUAL_NARRATIVE` |
| 2 | Generated packets | `foreman/handoffs/outbox/TO_*_GDINTENT_HOMEPAGE_VISUAL_NARRATIVE_v1_20260606-173334.md` |
| 3 | Captured receipts (3/3) | `foreman/gd-intent-router/runs/.../receipts/` |
| 4 | Synthesis | `foreman/handoffs/outbox/FROM_GD_SYNTHESIS_HOMEPAGE_VISUAL_NARRATIVE_GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334.md` |
| 5 | Render batch order | `foreman/gd-intent-router/runs/.../RENDER_BATCH_ORDER.md` |

## Visual beats (locked for this test)

1. **Spark** — individual alone with idea/problem  
2. **Space** — empty or underused future space  
3. **Forge** — lanes meeting and assembling  
4. **Foundry** — real outcomes inside those spaces  

## Synthesis headline

**Spark hero · Space new render · Forge in UI · Foundry in proof gallery** — sequential story, not one overloaded fold.

## Gates honored

- No render · no homepage code · no merge · no deploy
- Existing crew-dispatch routing untouched

## Re-run

```bash
npm run gd:generate -- HOMEPAGE_VISUAL_NARRATIVE
npm run gd:collect -- <RUN_ID>
npm run gd:synthesize -- <RUN_ID>
```
