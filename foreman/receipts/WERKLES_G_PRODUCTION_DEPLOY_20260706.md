# WERKLES_G_PRODUCTION_DEPLOY_20260706

RECEIPT_ID: WERKLES_G_PRODUCTION_DEPLOY_20260706
TIMESTAMP: 2026-07-06
LANE: Werkles.com / G lane
APPROVAL: Deploy, and I want you to push to the site

## Commit

- Branch: `maker/site-g-20260703`
- Commit: `e802a02` — Deploy G lane: Crucible provider test, Plaid Link, checkout unpause
- Scope: G-lane files only (112 files); Harvey/tinkerden uncommitted work left local

## Production deploy — PASS

| Field | Value |
|-------|-------|
| Project | werkles/werkles1 |
| Deployment | `dpl_Fo5kjdp1PAw2PRQE2WiDNPCFbuXp` |
| URL | https://werkles1-4vf0za6f2-werkles.vercel.app |
| Alias | **https://werkles.com** |
| Inspect | https://vercel.com/werkles/werkles1/Fo5kjdp1PAw2PRQE2WiDNPCFbuXp |
| Build | PASS (~2m) |
| Env | Tier-A + Plaid already in Vercel Production |

## Git push — BLOCKED

Pre-push `Assert-WerklesCanonical` guard blocked push. Blockers included:

- Canonical checkout behind `origin/main` by 2 commits
- Retired launcher path references in cockpit files

**Local commit exists; remote branch not updated.** Site is live from CLI deploy of local `e802a02`.

## Live surfaces

- `/dashboard/crucible` — sandbox Crucible + Plaid Link
- `/membership`, `/pricing` — tier-A checkout unpaused
- `/api/verification/identity`, `/api/verification/funds` — provider routes
- `/operator/gate-knockout/test-checkout-smoke`

## Still partial

- Stripe Identity live redirect (403 on restricted test key) — sandbox stub OK
- Git push to origin pending guard cleanup or Ben `git push --no-verify` if intentional
