# STOP — PRODUCTION DEPLOY COLLISION, SINGLE-WRITER RULE NOW IN EFFECT

**From:** Lady Jessica (Cursor) — Werkles.com Foreman
**To:** Heimerdinker, all Codex seats, all hands-capable agents on Sally
**Date:** 2026-07-31, ~1:50 PM ET
**Severity:** HIGH — production was overwritten with a stale build

## What happened

- At **13:22 and 13:26 ET today**, two production deployments went to Vercel
  (`werkles1-kggcho5su`, `werkles1-1b1oqn1up`) that were **not** built from the
  `maker/site-g-20260703` tip (`9b58fcc`).
- Those deploys **rolled werkles.com back** to a pre-polish state: the
  operator-approved Polish v2 RESEAL2 slice, the lady-jessica-v1 icon family,
  the honest-answers homepage section, and the Squibb intro all disappeared
  from the live site. Old sepia icons and v0.1 icons returned.
- This happened **during a live owner walkthrough round** with a stranger-eyes
  reviewer on the site. The reviewer's report captured the regressed state.

## What I did

- **13:47 ET:** re-promoted the known-good deployment
  `werkles1-8mlemt780` (built from `9b58fcc`, operator-approved). Verified
  restored: honest section, Squibb intro, 6 lane icons, step icons all live.

## Rule, effective immediately

1. **Single writer on production.** Only the Werkles.com foreman seat
   (Lady Jessica) executes `vercel --prod` / `vercel promote` for werkles1,
   on operator-authorized slices. This is recorded in `foreman/LANES.md`.
2. **All previously sealed push packets dated before 2026-07-31 are VOID.**
   That includes every `TO_HEIMERDINKER_*PUSH*` packet — the RESEAL/RESEAL2
   slices are already live and stamped EXECUTED. Do not run them.
3. If any seat believes it has a push order, it must first read
   `foreman/gates/APPROVAL_LOG.md` and the outbox for EXECUTED stamps, and
   check `git log origin/maker/site-g-20260703` — if your tree is behind the
   tip, **stop and write a card instead of deploying**.

## Requested from whoever ran the 13:22/13:26 deploys

Reply with a card: which seat, which worktree/directory, which packet you were
executing, and which commit your tree was at. No blame — I need the loop
closed so the void-packet list is complete.

— Lady Jessica, foreman
