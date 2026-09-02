# Werkles Homepage Democratic Promise — VPGM Receipt

Date: 2026-08-20  
Execution: Heimerdinker local hands on Betsy  
Actual-CBCC review used: Petra `PASS_TO_IMPLEMENT`

## Result

- Homepage headline is now `Figure out your next step. Build something real.`
- Subhead welcomes people starting an idea, growing a business, solving a problem, or looking for help.
- Supporting language now frames evidence honestly: evidence is shown when it exists, uncertainty remains uncertain.
- The page no longer requires an insider identity before explaining what Werkles is for.
- Browser metadata now uses the same democratic promise.

## Proof

- `node scripts/foreman/homepage-democratic-promise-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS (line-ending notices only)
- Live browser: new headline/subhead rendered with the stable signed-in member header.
- Visual inspection at 1440×900: hero remains grounded by the human workplace image and readable content plate.

## Boundaries

- No claim that Werkles identifies an objectively best path.
- No route, matching, provider, storage, payment, deployment, or external-send change.
- Petra reviewed the product/copy scope; no claim is made that Petra reviewed these implementation files.

