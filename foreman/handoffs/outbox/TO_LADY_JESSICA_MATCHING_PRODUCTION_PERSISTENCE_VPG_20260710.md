# TO LADY JESSICA — Matching Production Persistence Verification V/P/G

| Field | Value |
|---|---|
| Packet | `TO_LADY_JESSICA_MATCHING_PRODUCTION_PERSISTENCE_VPG_20260710` |
| From | Heimerdinker / Direwolf Dink@Betsy under Ben's V/P/G command |
| To | Lady Jessica / Maker@Betsy |
| Lane | Werkles.com G — matching shadow infrastructure only |
| Repo | `C:\Users\Ben Leak\github\Werkles` |
| Branch | `maker/site-g-20260703` |
| Parent | `TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710` |

## Mission

Verify the existing uncommitted repair for the production failures observed by the live smoke:

- discovery POST returned HTTP 500 while trying to create `/var/task/data/discovery`
- `/operator/matching/shadow` returned HTTP 404 on production

## Existing work — preserve it

The worktree already contains changes in:

- `lib/server/writable-data-root.ts` (new)
- `lib/discovery/concierge.ts`
- `lib/matching/shadow-storage.ts`
- `lib/matching/shadow-pipeline.ts`

Do not overwrite or reimplement these blindly. Diff first. The intended behavior is:

- local development persists beneath the repo root
- Vercel/Lambda persistence uses a writable temporary root
- operator reads use the same root as shadow writes
- public matching remains OFF

## Execute

1. Run focused source/diff inspection.
2. Run `npm.cmd run typecheck`.
3. Run `npm.cmd run build` so `/operator/matching/shadow` is present in the route manifest.
4. Run a process-level writable-root check with `VERCEL=1`; verify the resolved path is under the OS temp directory, not `/var/task` or the repo.
5. Apply bounded repair only if those checks fail, then repeat the failed check once.

## Artifacts

- `foreman/receipts/WERKLES_MATCHING_PRODUCTION_PERSISTENCE_VERIFY_20260710.md`
- Build/typecheck output summarized with exact pass/fail boundaries.

## Boundaries

- No deploy, push, merge, schema work, secrets, or production data mutation.
- Do not claim the production 404 is fixed until a separately approved deploy and live smoke prove it.
- Preserve all unrelated dirty files.

## Stop condition

Stop after local mechanical verification and receipt. If deploy is the remaining step, report it as a human gate rather than performing it.
