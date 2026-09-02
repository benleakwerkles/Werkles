# TO MAKER (Heimerdinker) — Walkthrough preflight guards

**From:** Foreman (VPGM assimilation of Skybro v0.2)  
**At:** 2026-08-04  
**Lane:** Infra / ops — approved local technical proof  
**NOT:** product UX, Recommendation View, ghost matching logic

## Why

Skybro red-teamed walkthrough readiness. Cousins spot holes; Maker implements approved infra guards. Foreman must not solo-build.

## Implement (minimal, quality-first)

1. **`scripts/ops/preflight.mjs`** — assert cwd is `C:\Users\Ben Leak\github\Werkles`, `.git` exists, print HEAD. Wire as `predev` hook optional via env `WERKLES_PREFLIGHT=1` (do not break existing dev flow silently).

2. **`app/api/health/route.ts`** — return `{ status, app: 'werkles', pid, uptime, timestamp }`.

3. **`scripts/ops/check-server.mjs`** — node fetch to `/api/health`, fail if wrong app or foreign PID.

4. **`lib/config/env.ts`** — consolidate ghost fleet flag; hard `enableGhostFleetUI: false` when production.

5. **`next.config.js`** — build-time throw if `NEXT_PUBLIC_GHOST_FLEET_UI=1` in production build.

## Do NOT

- Change Intros copy, matching, or walkthrough UX (Ender/Bean cousin lanes)
- Apply SQL, deploy, push without Operator phrase
- Fix Ender desktop CDP (separate packet: `TO_HEIMERDINKER_ENDER_DESKTOP_CDP_REPAIR_20260804.md`)

## Done when

Receipt: `foreman/handoffs/inbox/FROM_MAKER_WALKTHROUGH_PREFLIGHT_GUARDS.md` with commands run and pass/fail.

## Reference

Skybro reply: `foreman/handoffs/inbox/FROM_SKYBRO_VPGM_20260804-180108.md`
