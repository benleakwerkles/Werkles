# Autonomous Matching Pivot — 2026-07-08

RECEIPT_ID: WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708
LANE: Werkles.com / G

## Operator direction

Remove human operator from intake → recommendation path. Wholly algorithm/Aeye hybrid matcher:

- **Speaker** — delivers plain facts
- **Squibb** — voice layer
- **Shadow first**, public flip after proof

## Built (this session)

| Layer | Path |
|-------|------|
| Speaker Charter V1 draft | `foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md` |
| Feature flags | `lib/matching/feature-flags.ts` |
| Signal extraction | `lib/matching/signals.ts` |
| Deterministic scorer | `lib/matching/score-paths.ts` |
| Speaker + Squibb delivery | `lib/matching/deliver.ts` |
| Shadow pipeline | `lib/matching/shadow-pipeline.ts` |
| Shadow storage | `data/matching/shadow-runs.jsonl` |
| Intake wiring | `/api/discovery/intake`, `/api/bellows/intake` |
| Operator review | `/operator/matching/shadow` |
| Recommendations feed | `recommendation-session-server.ts` uses latest shadow run |

## Flags

- `MATCHING_AUTONOMOUS_SHADOW` = **true** (runs on submit)
- `MATCHING_AUTONOMOUS_PUBLIC` = **false** (end users: shadow messaging)
- `MATCHING_LLM_TRANSLATE_ENABLED` = **false** (LLM slot gated)

## Gates still required

1. `RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY`
2. `APPROVE MATCHING LLM TRANSLATE` (optional, for voice/translation API)
3. `APPROVE MATCHING AUTONOMOUS GO-LIVE` (public flip)

## Not built yet

- People-to-people matching (no candidate pool)
- Crucible-verified facts in scorer weights
- LLM translation implementation
- Metered billing for inference
