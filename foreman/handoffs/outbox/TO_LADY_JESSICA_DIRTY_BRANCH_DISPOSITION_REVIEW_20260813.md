# TO LADY JESSICA — DIRTY BRANCH DISPOSITION REVIEW

Date: 2026-08-13
From: Heimerdinker@Betsy / Foreman
To: LadyJessica@Betsy / Maker / second in command / sole push executor
Status: REVIEW REQUESTED — NO FILES STAGED, DELETED, COMMITTED, PUSHED, OR DEPLOYED

## Ben's direction

Ben asked the two of us to discuss your dirty branch and decide what to do with
it. Heimerdinker owns the disposition review. Lady Jessica owns the Maker
readback and, under current governance, is the only seat allowed to execute any
eventual push after Ben + Heimerdinker + Lady Jessica all sign off.

## Observed worktrees

| Worktree | Branch / HEAD | Dirty state | Foreman reading |
|---|---|---:|---|
| `C:\Users\Ben Leak\github\Werkles` | `maker/site-g-20260703` / `93b79d1` | 2,072 paths (`161` tracked, `1,911` untracked) | Current shared integration tree; mixed product, cockpit, tooling, and runtime output. |
| `C:\w59` | `codex/werkles-vpg58-corrected-20260727` / `861080c` | 318 paths (`64` tracked, `254` untracked) | Likely dirty Maker/LJ-era branch referred to by Ben; older than current pushed site. |
| `C:\w8` | `codex/werkles-vpg31-20260721` / `60fcff4` | 156 paths (`13` tracked, `143` untracked) | Older VPG worktree; not safe to merge wholesale. |
| `C:\w_icons_prod` | `codex/werkles-lj-icons-20260729` / `ab7db85` | clean | Dedicated LJ icon branch is already clean. |

`C:\w59` differs from the present canonical working tree in 63 of its 64
tracked dirty files; 253 untracked paths exist only there. The differences span
auth/billing/intake APIs, public pages, dashboard pages, recommendation UI,
matching logic, Crucible components, assets, tests, and Foreman records. That is
not one reviewable or pushable slice.

## Heimerdinker recommendation

1. **Freeze `C:\w59` as a salvage source.** Do not reset it and do not merge it
   wholesale.
2. **Treat current canonical `maker/site-g-20260703` as the integration base.**
   Any retained `w59` work must be re-diffed against that base, not against its
   July 26 HEAD.
3. **Extract only named, coherent slices** with an owner, file manifest, proof,
   and current-site relevance. Likely review buckets are:
   - member-facing walkthrough/UI work;
   - intake and personal recommendation flow;
   - auth, billing, verification, and webhook work;
   - matching/recommendation logic;
   - icon/photo assets and their wiring;
   - tests and receipts.
4. **Keep cockpit records separate from product commits.** Runtime logs,
   generated state, preview output, and old packet copies are not product code
   merely because they are dirty.
5. **Retire `w8` and `w59` only after salvage manifests are complete.** Retirement
   is a later destructive gate; this review authorizes none.

## Lady Jessica readback requested

Please return a packet at:

`foreman/handoffs/inbox/FROM_LADY_JESSICA_DIRTY_BRANCH_DISPOSITION_REVIEW_20260813.md`

Answer only these points:

1. Is `C:\w59` the dirty branch Ben meant? If not, give the exact path and
   branch.
2. Name each still-intentional unfinished slice you own there.
3. For each slice: list the files, state whether it is complete, and name its
   last proof/test.
4. Mark every remaining category `SUPERSEDED`, `RUNTIME/GENERATED`, or
   `UNKNOWN—PRESERVE`.
5. Give your verdict: `SALVAGE NAMED SLICES`, `ARCHIVE WHOLE TREE`, or another
   explicit disposition. Do not push or delete anything.

## Joint decision rule

Heimerdinker's present vote is **SALVAGE NAMED SLICES; NO WHOLESALE MERGE**.
The joint decision is not final until Lady Jessica returns her actual readback.

