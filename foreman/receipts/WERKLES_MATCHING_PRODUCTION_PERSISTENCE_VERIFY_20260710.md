# Matching Production Persistence Verification — 2026-07-10

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Commit at verification start: `a838d2c`  
Packet: `TO_LADY_JESSICA_MATCHING_PRODUCTION_PERSISTENCE_VPG_20260710`

## Result

`PARTIAL — LOCAL REPAIR MECHANICALLY PROVEN; REPO-WIDE TYPECHECK BLOCKED OUTSIDE LANE; DEPLOY NOT PERFORMED.`

## Existing repair inspected

The pre-existing dirty work was preserved:

- `lib/server/writable-data-root.ts` introduces one writable-root resolver.
- `lib/discovery/concierge.ts` routes discovery JSONL and Markdown records through that resolver.
- `lib/matching/shadow-storage.ts` routes shadow JSONL writes through the same resolver.
- `lib/matching/shadow-pipeline.ts` routes operator shadow reads through the same resolver.

No matching implementation file was rewritten during this V/P/G run.

## Vercel/Lambda writable-root proof

Command mode: process environment `VERCEL=1`, direct import of `lib/server/writable-data-root.ts`.

Observed:

```text
root: C:\Users\BENLEA~1\AppData\Local\Temp\werkles-data
probe: C:\Users\BENLEA~1\AppData\Local\Temp\werkles-data\data\discovery
underTmp: true
underRepo: false
containsVarTask: false
```

Verdict: `PASS`. The repair does not target `/var/task` in Vercel mode.

## Build and route proof

`npm.cmd run build`:

- Next.js production compilation: `PASS` (`Compiled successfully`).
- Repository-wide type validation: `FAIL`, outside matching lane.
- First blocking import: `Harvey/Werkles Mobile/mobile-app/App.tsx` cannot resolve `expo-status-bar`.
- Stable `npm.cmd run typecheck` additionally reports missing `react-native` and `@expo/vector-icons` types under `Harvey/Werkles Mobile/mobile-app/**`.
- No matching-path TypeScript error was reported.

Generated route evidence despite the later repository-wide type failure:

```text
.next/server/app-paths-manifest.json
  /operator/matching/shadow/page -> app/operator/matching/shadow/page.js

.next/server/app/operator/matching/shadow/page.js
  exists: true
```

Verdict: matching route compilation `PASS`; whole-repo build completion `BLOCKED_UNRELATED_HARVEY_DEPENDENCIES`.

## Local runtime revalidation

The build regenerated `.next` while a dev server was running, temporarily causing localhost HTTP 500 responses. The affected Next dev process was restarted without source changes.

Final smoke against `http://localhost:3000`:

- `capital_partner`: `PASS`, `shadow_20260710181520_453a8fde`
- `job_change`: `PASS`, `shadow_20260710181520_9d5d3101`
- `training_not_partner`: `PASS`, `shadow_20260710181520_46bb2b14`
- `/operator/matching/shadow`: `PASS`, HTTP 200

Receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260710.json`

## What this proves

- Local discovery intake, shadow persistence, and operator readback use a coherent path.
- Vercel-mode path resolution selects the OS temporary directory instead of the read-only deployment directory.
- The operator shadow route is present in the locally compiled route manifest.

## What this does not prove

- The current production deployment contains these uncommitted changes.
- Temporary filesystem persistence is durable across serverless invocations or instances.
- Production smoke will pass after deploy; `/tmp` is writable but ephemeral and instance-local.
- The whole repository currently passes typecheck/build.

## Remaining gates and risks

1. A durable multi-instance production store is still an architecture decision; `/tmp` removes the immediate write crash but is not durable storage.
2. Push and deploy require Ben’s explicit approval and are not performed here.
3. After an approved deploy, rerun the live smoke and verify both intake IDs and operator-page visibility. A successful POST without cross-instance operator visibility is not sufficient.
4. Harvey mobile dependency repair must be handled in its own lane; it was not touched.

## Recommendation

Keep matching in shadow mode. Accept the current repair as a local crash-prevention patch, not as final production persistence architecture. Before public flip, choose durable storage, complete a clean build in the appropriate lane, deploy with approval, and rerun live smoke.
