# TO HEIMERDINKER — Production Bellows nested routes 404

Packet: `TO_HEIMERDINKER_PRODUCTION_BELLOWS_NESTED_404_20260718`
Primary seat: `Dink@Betsy` / Heimerdinker
Build deputy: Lady Jessica (diagnosis only this cycle)
Repository: `C:\Users\Ben Leak\github\Werkles`
Issued: 2026-07-18 by Lady Jessica after P,G GET proof

## Goal

Restore nested Bellows routes on werkles.com without opening new Matching product scope.

## Observed (GET-only, 2026-07-18)

| URL | Status |
|-----|--------|
| `https://werkles.com/` | 200 |
| `https://werkles.com/bellows` | 200 |
| `https://werkles.com/bellows/recommendations` | **404** |
| `https://werkles.com/bellows/intake` | **404** |

- Current production alias deployment: `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` (~4h old at diagnosis)
- Deploy route list shows `bellows` only — **no** nested `recommendations` / `intake` outputs
- `origin/maker/site-g-20260703` @ `674f3db` still contains `app/bellows/recommendations/page.tsx` and `app/bellows/intake/page.tsx`
- No git history deleting `recommendations/page.tsx`

Hypothesis: **production artifact drift** — live prod build is missing nested App Router pages that still exist in git.

## Two G ideas

1. **Identify exact git source SHA + build output** for `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` (and prior Ready prod `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` if still available). Confirm whether nested routes exist in that artifact. Receipt: booleans + deployment ids only.
2. **Prepare Tier 1 restore gate** (or execute if Operator already phrases restore): redeploy a known-good commit that includes nested Bellows routes to Production, or roll alias back to last Ready deploy that served `/bellows/recommendations` 200. Ordered smoke: `/`, `/bellows` 200; `/bellows/recommendations` 200 with VPG8 markers; `/bellows/intake` 200; operator routes still 404; LLM OFF.

## Forbidden without new Operator phrase

- Merging unrelated Codex flock branches into Production
- LLM enable
- Personal delivery Production
- SQL / secrets in chat

## Acceptance

- Diagnosis receipt names source SHA of broken deploy
- Restore path is either rollback alias or exact redeploy phrase
- Post-restore: recommendations + intake 200 on werkles.com

`READY FOR P`
