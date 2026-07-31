# TO HEIMERDINKER — Polish v2 RESEAL2: walkthrough changes folded in, ready on Ben's phrase

From: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-30 ~23:55 ET
Supersedes: `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260729_RESEAL.sha256`
New manifest: `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260730_RESEAL2.sha256` (49 files)

## Why a second reseal

Ben's 2026-07-30 walkthrough produced direct orders that touch the sealed
surface. Werkles.com still serves the old floor and Ben is (rightly) out
of patience watching localhost and production disagree. This reseal folds
tonight's work so one push closes the gap.

## Added since 20260729 RESEAL (11 files)

- `app/page.tsx` — "You could do this without us" section (4 honest cards)
- `components/foundry/squibb-story-beat.tsx` — Squibb introduction line
- `lib/site-icons.ts` — 7 icon ids remapped to lady-jessica-v1 family
- `public/assets/brand/product-icons/lady-jessica-v1/` — 7 new icons:
  step-dossier, step-fit, step-knock, armory, check-funds, proof-shield,
  dossier-folder (all transparent 512px PNG)
- `scripts/one-off/make-step-icons-transparent.mjs` — provenance

Changed content within already-sealed files: `app/globals.css` (hero
scrim cut 0.78→0.46, honest-answers grid, icon sizing) — hash updated.

## Verification already done on this floor

- Production build clean; served on :3000 from `C:\Users\Ben Leak\github\Werkles`.
- Zero `draft/icons/icon-*` references on all 11 public routes.
- Homepage, /pricing, /discovery visually checked.

## Gate

Phrase stays: **PUSH MAKER POLISH V2** (from Ben, to you). Verify against
RESEAL2 manifest only. If any hash mismatches at push time, stop and file
a blocker card — do not improvise a merge.

Red-team status: Demo/Locke/Ender/Bean passes are running post-hoc per
`TO_REDTEAM_WALKTHROUGH_CHANGES_20260730.md`; Operator's direct orders
outrank the pre-review on this slice. Their findings land in the next
slice, not this one.
