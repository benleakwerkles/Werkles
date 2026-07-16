# Autonomous Matching VPG8 Containment — Production Deploy Receipt

Status: `PASS — VPG8 LIVE ON THE IDENTIFIED PRODUCTION DEPLOYMENT`
Completed: `2026-07-16T19:02:34-04:00`
Operator: Ben
Execution seat / machine: `Dink@Betsy` / `Betsy`
Repository: `C:\Users\Ben Leak\github\Werkles`
Vercel project / alias: `werkles/werkles1` / `werkles.com`

## Approval

Ben's exact response to the presented Tier 1 gate:

```text
Approve, but we need to really clean up the UI/UX...it's clunky and ugly.
```

Decision: approve the exact VPG8 containment deployment and bounded live smoke. UI/UX cleanup follows as a separate Preview-only slice; no second Production redesign deployment is included.

Durable approval commit: `35aa16b75030feb9026ca96885936f224af428c6`.

## Exact deployed source

- Target commit: `6cf99ed7a8b63f4e759da4557ffefa24d5a3216d`
- Product commit inside target: `58b8938877ae216fd308173a92e0a5da66971d0c`
- Clean detached worktree: `C:\w8`
- Clean target status before build: `0` tracked/untracked changes
- Focused VPG8 proof: `PASS` — nine containment/readability checks
- Local `next build`: `PASS` — 81 pages generated
- Remote Production build: `PASS` — Next.js `15.5.18`, 81 pages generated

The first longer temporary worktree path hit Windows filename-length limits and was removed before build. The local `vercel build --prod` wrapper later hit `spawn cmd.exe ENOENT`; no deployment occurred from either failed step. The exact clean source then passed direct local `next build`, and Vercel performed the Production-target remote build from that clean worktree.

## Deploy result

- Deployment id: `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi`
- Immutable URL: `https://werkles1-fz503royl-werkles.vercel.app`
- Production alias: `https://werkles.com`
- Target: `production`
- State: `READY`
- Project id: `prj_IAwxCYEv9mCNiBONFWWu99uymkoq`
- Error-log scan: `0` error records in the last hour after smoke; messages not printed

## Ordered live smoke

### Recommendation page

- GET `/bellows/recommendations`: `200`
- `Autonomous Matching example`: `true`
- exact account-boundary sentence: `true`
- `Rules score`: `true`
- exact non-probability / eligibility / outcome limit: `true`
- exact save-closed sentence: `true`
- disabled recommendation actions: `3`
- empty-intake message: `true`
- empty-options message: `true`
- latest-intake marker: `false`
- packet-id marker: `false`
- old Confidence label: `false`

Response bodies were not printed or persisted.

### Save defense

- Source-bound route test before deploy: `PASS` — no write path
- Inert empty POST `/api/bellows/recommendations/packet`: `403`
- Page SHA-256 before canary: `300467dce88b174226649a436ea50d60b4d7e5e74a1750f2763021dbfc39b175`
- Page SHA-256 after canary: `300467dce88b174226649a436ea50d60b4d7e5e74a1750f2763021dbfc39b175`
- Page unchanged: `true`
- POST response body printed: `false`

### Boundaries and flags

- GET `/operator/matching/shadow`: `404`
- `MATCHING_AUTONOMOUS_PUBLIC`: source-proven `true`
- `MATCHING_LLM_TRANSLATE_ENABLED`: source-proven `false`
- `MATCHING_STORAGE_MODE`: Production key present; Vercel pull redacted the value
- Vercel environment mutations in this run: `none`
- SQL / schema / database mutation: `none`
- secret values printed: `none`

## Rollback

Predeploy availability rollback remains:

- deployment: `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi`
- URL: `https://werkles1-3z6a4fvfa-werkles.vercel.app`

Rollback was not needed. This older deployment is availability-only and would restore the pre-VPG8 privacy boundary.

## Next slice

The recommendation UI/UX is acknowledged as clunky and visually weak. Cleanup is explicitly separated from this containment release and will be built and reviewed in Preview before any further Production approval.

`COMPLETED — VPG8 CONTAINMENT LIVE; LIVE SMOKE PASS; UI/UX CLEANUP NEXT IN PREVIEW ONLY`
