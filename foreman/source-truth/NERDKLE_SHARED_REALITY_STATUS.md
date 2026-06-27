# Nerdkle Shared Reality Status

- Owner: Swanson@Doss
- Updated: 2026-06-27T19:31:00.000Z
- Canonical source truth: GitHub `origin/main`
- Canonical main hash: `0c727a2461f274f8990063ab9ee06b799a1890ed`
- Status: `PRESERVED CANDIDATES / PRODUCTION INPUTS MISSING`

## Preserved Review Branches

| Branch | Hash | Status | Proof | Blocker |
| --- | --- | --- | --- | --- |
| `nerdkle/nmclr-proof-body-preserve-v0-20260627` | `f14227352ce7820f9e12b135f559d706691e85da` | `PRESERVED_ONLY_NOT_CANONICAL` | recursive file hash and GitHub preservation receipt | branch-specific execution proof |
| `nerdkle/receipt-crawler-v0-20260627` | `312e0f811cf8ad46fac1774ee325ff349fcc3012` | `PRESERVED_ONLY_NOT_CANONICAL` | synthetic LiveReceipt self-test | production `circulation.db` |
| `nerdkle/nervous-system-organs-v0-20260627` | `47aa50c73c8ab0eda37d2e591cb956cca363b79d` | `PRESERVED_ONLY_NOT_CANONICAL` | Swateyes/Fleyes/Ender deterministic fixture checks | production `circulation.db`, Wormeyes `world_state.json`, production outbox |

## Local Doss Daemons

| Process | PID | Input Status | Claim Boundary |
| --- | ---: | --- | --- |
| Receipt crawler | `28396` | production DB missing | running, but no production receipt movement yet |
| Fleyes | `37892` | fixture paths | detects fixture `STALLED` / `CHURN`, not production pain |
| Ender apoptosis | `7544` | fixture paths | deletes fixture stale `dry_run`, not production cache |

## Real Inputs Required

See `foreman/source-truth/NERDKLE_PRODUCTION_INPUT_CONTRACT.json`.

Required surfaces:

- `C:\tinkarden\server\circulation.db`
- `C:\tinkarden\world_state.json`
- `C:\tinkarden\intake\speaker_queue`
- `C:\foreman\handoffs\outbox` or the declared fallback repo outbox

## Current Ruling

Nerdkle has preserved candidate organs and deterministic fixture proof.

Nerdkle does not yet have production organism proof.

No branch is canonical except `origin/main`.

No local daemon is canonical.

No fixture result is production behavior.

## Next Bird

`foreman/source-truth/NEXT_NERDKLE_PRODUCTION_INPUTS_BIRD.json`
