# Matching / Not-Matching — Artifact Inbox

DROP ZONE for Heimerdinger artifacts feeding the autonomous Matching/Not-Matching engine.

## Full path (for the crew dropping files)

```
C:\Users\Ben Leak\github\Werkles\artifacts\matching-inbox\
```

## Rules

- This is an **inbox**, not compiled source. Drop anything here: JSON, CSV, `.md` specs, rule tables, sample intakes, taxonomy files, weight tables, candidate rosters, sketches.
- **Do NOT** drop `.ts` files directly into `lib/matching/` — that breaks the typecheck. Put source-shaped material here and Maker (Lady Jessica) will translate it into the engine.
- Please include a short `MANIFEST.md` or top-of-file note per artifact: what it is, where it should feed (signals? scoring weights? path catalog? not-match rules?), and how confident/authoritative it is.

## Where each artifact type will land in the engine

| Artifact type | Consumed by |
|---------------|-------------|
| Signal / taxonomy definitions | `lib/matching/signals.ts`, `types.ts` |
| Path catalog + scoring weights | `lib/matching/score-paths.ts` |
| **Not-Match / disqualifier rules** | `lib/matching/score-paths.ts` (new not-match layer) |
| Speaker fact templates | `lib/matching/deliver.ts` |
| Squibb voice variants | `lib/matching/deliver.ts` |
| Candidate roster / people pool | new `lib/matching/roster.ts` (not built yet) |
| Sample intakes for shadow QA | fed through `/discovery` or `/bellows/intake` |

## Status

Engine runs in **shadow mode**. Layer 0 + not-match + path scoring built 2026-07-09.
Public flip gated on `APPROVE MATCHING AUTONOMOUS GO-LIVE`.
Awaiting shadow QA on real intakes.
