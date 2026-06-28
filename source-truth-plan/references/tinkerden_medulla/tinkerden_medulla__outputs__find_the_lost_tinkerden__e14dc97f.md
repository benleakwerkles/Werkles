# FIND_THE_LOST_TINKERDEN

## 1. Best Matching Artifact

Best match to Ben's described operational TinkerDen:

`origin/preview/wonka-den-safe-preview-20260618`

Worktree:

`C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\wonka-den-safe-preview`

Why this is the closest match:

- WHY: `protocol/index.ts` defines rationale fields including `why_this_exists`, `why_now`, evidence, rejected alternatives, risk, test, owner, and confidence.
- NOW: `components/soledash/decision-surface-panels.tsx` exposes Operator Frontier, Machine Frontier, Queue Visibility, Top 3 Alternatives, and why the machine chose number one.
- EXECUTION: the branch includes SoleDash command/action surfaces, receipt files, safe command routing, route buttons, and Wonka Den execution components.
- Receipts visible: `ReceiptCenterPanel` says actions are file-backed from `foreman/soledash/receipts/`.
- Queue visible: `QueueVisibilityPanel` and `QueueOverridePanel` expose frontier and queue behavior.

Near miss / visual Den match:

`origin/cursor/goop-cycle-pvp-9b25`

Worktree:

`C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\goop-cycle-pvp`

This is the best Den/TinkerDen-style visual/product branch from the prior audit, but it does not best match the operational definition with receipts, queue, Top 3 moves, and operator decisions.

## 2. Screenshot Receipts

Primary operational match:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\04-preview-wonka-den-safe-preview-20260618-3203.png`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\05-preview-wonka-den-safe-preview-20260618-4406.png`

Visual Den / TinkerDen-style product lane:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\02-cursor-goop-cycle-pvp-9b25-3201.png`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\03-cursor-wonka-den-mood-reference-9b25-3202.png`

Related SoleDash / routing evidence:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\10-snapshot-sally-good-werkles-2026-06-12-3206.png`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\live_preview_health_screenshots\11-snapshot-sally-good-werkles-2026-06-12-4409.png`

## 3. Branch Location If Code Exists

Closest operational code exists:

- Branch: `origin/preview/wonka-den-safe-preview-20260618`
- Worktree: `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\wonka-den-safe-preview`
- Checked-out hash in preview worktree: `dc6829580ec1ede8c864a9a9051efb02ec874c00`
- Key files:
  - `protocol/index.ts`
  - `components/soledash/decision-surface-panels.tsx`
  - `components/soledash/command-surface.tsx`
  - `components/soledash/ambient-command-layers.tsx`
  - `components/soledash/wonka-den-room.tsx`
  - `components/soledash/wonka-den-terminal-proof.tsx`
  - `components/soledash/receipt-drawer.tsx`
  - `components/soledash/human-gate-panel.tsx`
  - `components/soledash/intent-router-panel.tsx`
  - `app/api/soledash/v1/wonka-den/run-safe-command/route.ts`
  - `lib/soledash/receipt-graph/*`

Closest Den visual code exists:

- Branch: `origin/cursor/goop-cycle-pvp-9b25`
- Worktree: `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\goop-cycle-pvp`
- Checked-out hash in preview worktree: `2ed3902888cafabe5f9b88565a13308f7508be4d`
- Key files:
  - `app/proof/den/page.tsx`
  - `app/proof/goop-cycle/page.tsx`
  - `components/foundry/den-shell.tsx`
  - `components/foundry/den-preview-scene.tsx`
  - `components/goop-cycle/*`
  - `lib/goop-cycle/*`
  - `lib/den-atmosphere.ts`

## 4. Implementation Status

TINKERDEN EXISTS AS DESIGN BUT NOT IMPLEMENTATION

More precisely:

- The exact described TinkerDen does not appear as an implemented app surface.
- No audited tree contains the exact room model `Mission Control`, `Bridge`, and `Engine Room`.
- No audited tree contains exact `Top 3 Moves`.
- No audited tree implements exactly `PROCEED`, `DEFER`, `KILL` as the primary TinkerDen operator triad.
- The operational ingredients exist across SoleDash / Decision Surface / Wonka Safe Preview.
- The visual Den ingredients exist in Goop Cycle and Wonka Den mood branches.

## 5. Confidence Score

Confidence: 0.74

Confidence is high that the exact TinkerDen definition is not implemented as a complete named surface. Confidence is moderate-high that `origin/preview/wonka-den-safe-preview-20260618` is the closest operational artifact, with `origin/cursor/goop-cycle-pvp-9b25` as the closest visual Den artifact.
