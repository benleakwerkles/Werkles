# WERKLES VPGM — GHOST OWNER FLIGHT CONTAINMENT

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Branch / baseline: `maker/site-g-20260703` / `93b79d1`
Execution context: `LOCAL_SALLY_WINDOWS`
Status: LOCAL PROOF PASS; LADY JESSICA SEAL STILL REQUIRED; NO STAGING OR PUSH

## V

Packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_GHOST_FLEET_OWNER_SURFACES_SEAL_20260813.md`

Vision: isolate Ghost Fleet + owner surfaces as the first named salvage slice
and prove owner-data containment before any push consideration.

## P

Pulled current cockpit state, approval log, Lady Jessica's dirty-tree readback,
the joint disposition, and the pending Lady Jessica slice-seal request.

## G1 — dependency boundary

The candidate surface is not self-contained at the UI layer. Direct required
dependencies include owner session/intake storage plus matching shadow storage:

- `lib/squibb/bellows-owner-session.ts`
- `lib/squibb/concierge-intake-storage.ts`
- `lib/squibb/recommendation-session-server.ts`
- `lib/matching/signals.ts`
- `lib/matching/shadow-pipeline.ts`
- `lib/matching/shadow-storage.ts`
- `lib/matching/shadow-store.ts`

These require explicit inclusion/splitting decisions in Lady Jessica's seal.
Runtime intake and shadow JSONL records remain excluded.

## G2 — full owner-containment proof

Initial results:

- TypeScript: PASS.
- Surface attack: PASS `8/8`.
- Full Handeye: FAIL `1/150` because the test searched public fleet copy that
  can legitimately appear in another owner's candidate results.

The test was repaired to inject a unique private canary per owner. That exposed
a genuine second issue: the recommendation Server Component loaded the 20 most
recent cross-owner shadow runs and selected one afterward. In local Next Flight
HTML, the full async file-read payload was serialized into a script even when
the other owners were not visibly rendered.

Bounded repair:

- added intake-specific shadow-run reads for file and Supabase storage;
- personal recommendations now request only the already owner-scoped intake;
- local file lookup uses a synchronous read boundary so the full JSONL string
  cannot enter React's async Flight instrumentation;
- strengthened Handeye leak checks with private per-run canaries.

Measured proof:

- cross-owner HTML before repair: approximately `13 MB`, contained the other
  owner's private canary;
- after repair: approximately `654 KB`, other-owner canary absent, own canary
  present;
- focused Handeye: PASS `3/3`;
- full Handeye: PASS `150/150`, `14` distinct top-score outcomes;
- post-repair surface attack: PASS `8/8`;
- post-repair TypeScript: PASS.

Evidence:

- `foreman/receipts/WERKLES_GHOST_FLEET_HANDEYE_REDTEAM_2026-08-13T22-01-12-894Z.json`
- `foreman/receipts/WERKLES_GHOST_FLEET_SURFACE_ATTACK_2026-08-13T22-01-33-877Z.json`

## M

1. Re-ran type and surface regression proof after containment repair: PASS.
2. Issued Lady Jessica an addendum requiring the newly discovered dependencies
   and Flight-leak proof in her independent slice seal.

## Hard stops preserved

No files staged. No commit, push, deploy, Production flag, SQL, secret,
provider action, paid generation, or destructive cleanup. Handeye-generated
runtime records under `data/**` are test output and must not enter the slice.

