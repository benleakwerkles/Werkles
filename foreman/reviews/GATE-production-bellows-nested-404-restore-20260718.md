# Tier 1 Gate — Restore Production Bellows Nested Routes

**Status:** `OBSOLETE — CLEARED BY LIVE PROOF 2026-07-19`  
**Prepared:** `2026-07-18`  
**Cleared:** `2026-07-19` — `foreman/receipts/WERKLES_LADY_JESSICA_PG_20260719.md` (HEAD 200 on `/bellows/recommendations` and `/bellows/intake`)  
**Prepared by:** Lady Jessica (Maker) — diagnosis; execution owner Heimerdinker/Dink@Betsy  
**Vercel project / alias:** `werkles/werkles1` / `werkles.com`  
**Packet:** `TO_HEIMERDINKER_PRODUCTION_BELLOWS_NESTED_404_20260718.md`

## Decision (historical)

Restore werkles.com nested Bellows routes by rolling the production alias back to the last known-good VPG8 containment Production deployment?

```text
APPROVE ROLLBACK WERKLES.COM TO VPG8 CONTAINMENT DEPLOY dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi
```

**Note:** That phrase was never logged in `APPROVAL_LOG.md`. Live nested routes returned **200** on 2026-07-19 without a recorded rollback approval. Do not execute this gate unless nested routes 404 again.

Alternate (only if rollback unavailable):

```text
APPROVE REDEPLOY 6cf99ed TO WERKLES.COM PRODUCTION
```

No `P, G.` / flock VPG18 / Codex branch push authorizes this Production alias mutation.

## Diagnosis (GET + Vercel inspect)

| Fact | Value |
|------|-------|
| Live prod | `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` Ready |
| Live git SHA (Vercel meta) | `d54325f3de1b359ec75e675f3d83bfa656f459a7` |
| SHA in local/maker clone? | **No** — foreign to `C:\Users\Ben Leak\github\Werkles` |
| `/bellows` | 200 |
| `/bellows/recommendations` | **404** |
| `/bellows/intake` | **404** |
| Prior good prod | `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` @ `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` |
| `6cf99ed` has recommendations page? | **Yes** |

Hypothesis: Production was aliased to a deploy built from a commit outside the maker Matching line; nested App Router pages are missing from that artifact.

## Exact action after approval (Heimerdinker)

### Preferred — alias rollback

1. Point `werkles.com` (and production aliases) to Ready deploy `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` (`werkles1-fz503royl-werkles.vercel.app`).
2. Do not rebuild unless rollback fails.
3. Run ordered smoke below.
4. Hold. Do not enable LLM, personal Production delivery, or merge Codex flock into prod.

### Alternate — redeploy `6cf99ed`

1. Production-target build from exact commit `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d` in a clean worktree.
2. Wait for Ready; then alias to werkles.com.
3. Same smoke + hold.

## Ordered live smoke

1. GET `https://werkles.com/` → 200  
2. GET `https://werkles.com/bellows` → 200  
3. GET `https://werkles.com/bellows/recommendations` → **200** with VPG8 markers (example-only, Rules score, save-closed)  
4. GET `https://werkles.com/bellows/intake` → **200**  
5. GET `https://werkles.com/operator/matching/shadow` → **404**  
6. Confirm LLM remains OFF / no new Matching flags

## Blast radius

Production alias / which Ready artifact serves werkles.com. No schema, LLM, Stripe, or personal-delivery flip.

## Rollback of this restore

If restore misbehaves: re-alias only under a new Operator phrase. Document prior broken id `dpl_CiF7eiTm8nBWPZ5BP4ioCqZqqS1V` for forensics (do not leave it on werkles.com).

## Not authorized

- Deploying `codex/werkles-full-flock-vpg18-pg-20260718` or other Codex tips to Production
- Merging foreign `d54325f` into maker
- LLM / Tier A Production / Tier B custody

`AWAITING HUMAN GATE`
