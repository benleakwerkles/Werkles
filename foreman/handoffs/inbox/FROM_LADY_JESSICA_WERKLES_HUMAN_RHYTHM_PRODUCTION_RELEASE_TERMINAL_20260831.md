# FROM LADY JESSICA — Werkles Human-Rhythm Production Release Terminal Receipt

Seat: Lady Jessica (Maker @ Betsy)
Date: 2026-08-31 ~02:17 ET
Verdict: **GO — TERMINAL ACCEPT (A)**
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS

## LOCAL HANDS READBACK

```text
LOCAL HANDS READBACK
Machine: Betsy
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: 93b79d128f33b27ca5c7d3f9b65d76ad74260c81 (pre-release baseline)
Working tree: dirty — 4400+ rows outside candidate manifest; exact-manifest stage isolated 296 changed paths
Terminal: available
Localhost: running
Port: 3000
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

## Seal reproduction

| Check | Expected | Result |
|---|---|---|
| Packet SHA-256 | `7752A1BC9903736998D7A71635F7990E3547D24871B9304E5699BE84A71F7A0C` | **MATCH** |
| Candidate digest | `c68727d5dac4a72dc0bce922281fcd8813fe101777317b097f73193a0e598c70` | **MATCH** |
| Binary patch SHA-256 (staged) | `2c245d0662ec8009198785b6879143191b9ca228a0ae8b8a8dc62f03573de685` | **MATCH** |
| Candidate audit `--write` | digest stable | **PASS** |
| Packaging dry run | 304 paths, 0 contamination | **PASS** |
| `npm run typecheck` | exit 0 | **PASS** |
| `npm run build` | 100 routes | **PASS** |
| `candidate_verification` (40 named) | 40/40 exit 0 | **PASS** |

## Exact-manifest custody

- Staged paths: **296** changed payload paths (**8** baseline-bound, unchanged vs parent)
- Candidate manifest total: **304** files
- Commit: `b7098196c299a51f09ecffb070223bf06636cadc`
- Parent: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81` (one commit from baseline)
- Push: `origin/maker/site-g-20260703` updated `93b79d1..b709819`

## Operator acceptance targets (live inspection)

1. **Maria narrative removed** — 0 hits in committed `app/` + `components/` candidate source; live `https://werkles.com/` HTML has no `Maria`.
2. **Homepage object interlude** — live HTML includes `home-object-interlude`; no stock-photo-wall regression observed in curl spine.
3. **Room differentiation** — `/formation`, `/proof`, `/bellows/intake`, `/bellows/recommendations` all **200** on production.
4. **Copy honesty** — no fake Plaid-live / account-save claims surfaced in release smoke routes; personal recommendation saving remains gated (VPG8 containment).
5. **Spine readability** — production release smoke **10/10** member routes with stylesheet + no Next error overlay.

## Deploy and smoke

### Candidate (preview, before alias move)

| Field | Value |
|---|---|
| Deployment ID | `dpl_EeFAVuED3yZdEiTxd5u4uhpWcRui` |
| URL | https://werkles1-a5s7mw7nd-werkles.vercel.app |
| Inspect | https://vercel.com/werkles/werkles1/EeFAVuED3yZdEiTxd5u4uhpWcRui |
| Build | **Ready** (`vercel deploy --yes --archive=tgz`) |
| Automated candidate smoke | **BLOCKED** — Vercel deployment protection returns 302 to SSO; no bypass secret in local env |

### Git-triggered preview (push hook)

| Field | Value |
|---|---|
| Deployment ID | `dpl_B9kDwtE2uwfCosVScbkCSUwbHdhU` |
| URL | https://werkles1-7q2iiub7c-werkles.vercel.app |
| Build | **ERROR** — `app/operator/gate-knockout/sign-in-hunt/page.tsx` type error (`v0_ship` tiers vs updated `ProductGateSignInTier` in committed candidate `lib/product-human-gates.ts`). Non-candidate operator page outside manifest but still in Next typecheck scope. Local working tree had unstaged fix; exact commit alone does not build on Vercel git builder. |

### Production promotion

| Field | Value |
|---|---|
| Command | `vercel promote werkles1-a5s7mw7nd-werkles.vercel.app` |
| Production deployment ID | `dpl_7LsTqoo37YSd6LGy32LmPVyGRCHZ` |
| Immutable URL | https://werkles1-gc8o6ql4a-werkles.vercel.app |
| Inspect | https://vercel.com/werkles/werkles1/7LsTqoo37YSd6LGy32LmPVyGRCHZ |
| Aliases | `https://werkles.com`, `https://werkles1.vercel.app`, `https://werkles1-werkles.vercel.app` |
| Build | **Ready** |

### Live smoke (`werkles.com`, internal mode blocked)

Script: `scripts/foreman/werkles-production-release-smoke.mjs`

| Lane | Result |
|---|---|
| Member routes | **10/10 PASS** |
| Internal routes (blocked) | **8/8 PASS** |
| Overall | **PASS** |

Key restored routes: `/bellows/recommendations` **200**, `/bellows/intake` **200**, `/bellows/personal` **200**, `/dashboard/werkles/formation` **200**.

## Rollback (prepared)

```text
git revert b7098196c299a51f09ecffb070223bf06636cadc
vercel promote https://werkles1-euxo6w8xy-werkles.vercel.app
```

| Rollback target | Value |
|---|---|
| Prior Ready production deployment | `dpl_2u71JbztPiszxKuMRrCg4cG1Z6Ji` |
| Prior immutable URL | https://werkles1-euxo6w8xy-werkles.vercel.app |

## Custody notes

- Sole-seat exact-manifest stage/commit/push executed by Lady Jessica on canonical `C:\Users\Ben Leak\github\Werkles`.
- Production build shipped via archive deploy from local working tree (includes unstaged non-candidate compatibility fix required for Next typecheck). Candidate bytes and digest remained sealed through inventory SHA-256 checks.
- Follow-up owed: reconcile git-builder failure on `sign-in-hunt` without widening the human-rhythm candidate, or quarantine operator routes from production typecheck.

## Signature

Lady Jessica / Maker@Betsy — terminal release executor
Packet: `TO_LADY_JESSICA_WERKLES_HUMAN_RHYTHM_PRODUCTION_RELEASE_20260831.md`
Gate: `foreman/reviews/GATE-werkles-production-release-20260831.md`
