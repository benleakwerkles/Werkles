# Matching / Not-Matching Engine Build — 2026-07-09

RECEIPT_ID: WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709
LANE: Werkles.com / G

## Built

Doctrine consumed from:
- `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
- `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md`
- `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
- `foreman/speaker/LEVERAGE_INVENTORY_FRAMEWORK_v1.md`
- `artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md`

## Pipeline (shadow mode)

```
intake → signals + leverage diagnosis
      → Layer 0 preflight (need translation)
      → not-match layer (disqualifiers, pause, proof-only)
      → path scoring (Layer 1–3 skeleton)
      → Speaker facts + 7-section recommendation card
      → Squibb voice
      → shadow-runs.jsonl + /operator/matching/shadow
```

## New / updated files

| File | Role |
|------|------|
| `lib/matching/leverage.ts` | Five leverage categories from doctrine |
| `lib/matching/layer0.ts` | Need translation preflight (always runs first) |
| `lib/matching/not-match.ts` | Disqualifiers, pause, over-match guards (Rules 6–7) |
| `lib/matching/types.ts` | Layer0, NotMatch, RecommendationCard types |
| `lib/matching/signals.ts` | Leverage diagnosis on extract |
| `lib/matching/score-paths.ts` | Scoring after Layer 0 + not-match |
| `lib/matching/deliver.ts` | Speaker facts + 7-section card |
| `lib/matching/shadow-pipeline.ts` | Wired orchestration |
| `app/operator/matching/shadow/page.tsx` | Layer 0 + not-match + card review |

## Not-match rules (v1)

- Unclear ask → **pause** (proof request only)
- Partner language + intrinsic/amplification hypothesis → suppress person paths
- Capital without customer proof → suppress raise-capital
- Capital + partnership + low confidence → **proof_only**
- Intro staging guarded by default

## Still not built

- People roster / candidate pool (Layer 3–4 with real humans)
- Crucible-verified weight multipliers
- LLM translation layer (gated)
- Layer 5 cohort builder
- Public flip (`MATCHING_AUTONOMOUS_PUBLIC`)

## Verify

Submit intakes on `/discovery` or `/bellows/intake`, review `/operator/matching/shadow`.

Typecheck: PASS (2026-07-09)
