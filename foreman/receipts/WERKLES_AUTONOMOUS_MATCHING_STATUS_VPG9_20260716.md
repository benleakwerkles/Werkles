# Werkles Autonomous Matching Status — VPG9

Status captured: `2026-07-16T15:55:26-04:00`
Machine / seat: `Betsy` / `Dink@Betsy`
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`

## Executive status

**Autonomous Matching is live, but the VPG8 containment/readability correction is not live yet.**

- Branch and remote HEAD: `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` — equal.
- VPG8 product commit: `58b8938877ae216fd308173a92e0a5da66971d0c`.
- Latest VPG8 Preview: `READY`; protected GET proves the new example-only, Rules score, and save-closed surface.
- Current Production: `READY` at the earlier public go-live deployment sourced from `92a30814a244fd99a3df0fd334103f984431a76c`.
- Production GET proves it still serves the pre-VPG8 surface.
- Public mode: `ON`.
- LLM translation: `OFF`.
- Storage mode: last verified `supabase`; unchanged by VPG8/VPG9.
- Production deploy performed in VPG9: `NO`.

## Why this matters

The production-source helper at `92a3081` calls `loadSquibbRecommendationSessionForBellows()` and `loadBellowsPacketLedger()` whenever public mode is ON. Those are global/latest reads without an authenticated member-owner boundary.

VPG8 removes those readers from the public helper and always returns an example with an empty ledger until owner binding exists. That correction is pushed and built in Preview, but production has not received it.

## Deployment evidence

| Surface | Deployment | Source | State | Created (EDT) | Proven status |
|---|---|---|---:|---|---|
| Latest branch Preview | `dpl_GDz3JHVc1uT43E3mK9Hf5WggNwtU` / `https://werkles1-e0mx3mn0y-werkles.vercel.app` | `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` | `READY` | `2026-07-16T14:12:57.690-04:00` | VPG8 markers present |
| VPG8 product Preview | `dpl_5UZkJXpat5b4ET6ZU41G23opdcS3` / `https://werkles1-h8azo7bwo-werkles.vercel.app` | `58b8938877ae216fd308173a92e0a5da66971d0c` | `READY` | `2026-07-16T14:12:17.337-04:00` | VPG8 product build Ready |
| Current Production | `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi` / `https://werkles1-3z6a4fvfa-werkles.vercel.app` / `https://werkles.com` | `92a30814a244fd99a3df0fd334103f984431a76c` (go-live receipt) | `READY` | `2026-07-16T13:39:31.813-04:00` | pre-VPG8 surface live |

Vercel's authenticated deployment API confirms both Preview source SHAs and branch ref. Fresh API inspection also confirms the Production deployment is `READY`, target=`production`, and currently owns the `werkles.com` alias. The Production source commit is recorded by `WERKLES_AUTONOMOUS_MATCHING_GO_LIVE_20260716.md`; its API record does not expose a git SHA.

## GET-only rendered comparison

No response body or credential value was printed or stored. Only booleans and body hashes were returned.

| Check | VPG8 Preview | Current Production |
|---|---:|---:|
| HTTP status | `200` | `200` |
| `Autonomous Matching example` | `true` | `false` |
| exact example / account-boundary sentence | `true` | `false` |
| `Rules score` | `true` | `false` |
| exact non-probability / eligibility / outcome limit | `true` | `false` |
| save-closed explanation | `true` | `false` |
| exact save-closed sentence | `true` | `false` |
| all three recommendation actions disabled | `true` (`3`) | `false` (`0`) |
| empty-intake and empty-options messages | `true` | `false` |
| latest-intake marker | `false` | `true` |
| packet-id marker | `false` | `false` |
| `Confidence` label | `false` | `true` |
| response SHA-256 | `7370ead63dd47c756f1969f6e4b2b0e44628a69a33da3d8fe8196912ea1d5b2f` | `fb14b22e652faaa9c524b10a74600e39fba520591255177931f8d99670dc293e` |

## Decision boundary

Recommended next step: deploy commit `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` to project `werkles/werkles1` as a clean Production build, run the bounded smoke, and retain `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi` as the availability rollback. That rollback restores service, but it also restores the pre-VPG8 privacy boundary and is not privacy-safe.

This requires the separate Tier 1 phrase:

```text
APPROVE AUTONOMOUS MATCHING VPG8 CONTAINMENT DEPLOY TO WERKLES.COM
```

Until that phrase is given: branch push is allowed; production deploy, alias change, flag change, SQL, and data mutation are not.

`COMPLETED — CURRENT MATCHING STATUS PROVEN; PRODUCTION DEPLOY REMAINS GATED`
