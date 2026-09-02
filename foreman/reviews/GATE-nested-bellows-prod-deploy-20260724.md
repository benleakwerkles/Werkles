# Tier 1 Gate — Soft live nested Bellows on production (maker → werkles.com)

**Status:** `APPROVED AND COMPLETE 2026-07-24` — soft live nested Bellows on werkles.com  
**Prepared:** 2026-07-24  
**Prepared by:** LadyJessica@Betsy  
**Lane:** Werkles.com / G  
**Soft live meaning:** nested routes on werkles.com; intake submit stays closed; no live Stripe HG-4/HG-5  
**Receipt:** `foreman/receipts/WERKLES_NESTED_BELLOWS_SOFT_LIVE_DEPLOY_20260724.md`  
**Deploy:** `dpl_97jNhHL7o7G5PvM2cUSjbT721uVa` @ `674f3db` → https://werkles.com

## Decision

Deploy `maker/site-g-20260703` tip (currently `674f3db` or later approved tip) to production so nested Bellows routes exist on werkles.com?

**Operator phrase received and executed.**

## Proof (post-deploy)

| Check | Result |
|-------|--------|
| `https://werkles.com/bellows` | **200** |
| `https://werkles.com/bellows/intake` | **200** |
| `https://werkles.com/bellows/recommendations` | **200** |
| Deployed commit | `674f3db2dd56a8b131981fb3ea974bc018463fb9` |
| Intake submit open | **NO** |

VPG10 UI git-push alone does **not** fix prod. Opening intake submit alone does **not** fix a 404.

## Suggested approve substance (Operator chooses exact wording)

```text
APPROVE PRODUCTION DEPLOY NESTED BELLOWS FROM maker/site-g-20260703
```

## Out of scope unless separately phrased

- Open intake submit (`APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM`)
- VPG10 UI-only push
- Live Stripe HG-4/HG-5
- LLM matching flip
- FCRA

## After approve (crew)

Deploy approved maker tip → smoke nested routes → receipt. Hold intake closed until open-intake phrase.
