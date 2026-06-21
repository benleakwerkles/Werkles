# BRANCH_SALVAGE_AUDIT

TO: Swanson@Doss

DESTINATION: TinkerDen Intake

ASSIMILATION DESTINATION: Speaker

Generated: 2026-06-20T20:43:11.5355348-04:00

Scope rule observed: no merge, no delete, no cleanup before inventory. Preserve every branch until Petra issues GO.

## 1. Reality Inventory

### Doss local reality

- Machine: Doss
- Repo path: `C:\Users\BenLeak\Desktop\github\Werkles`
- Branch: `snapshot/sally-good-werkles-2026-06-12`
- Commit hash: `4adebb2dfaf2fc2dae3284f24969eebe8b7adf6f`
- Latest commit: `2026-06-15 16:48:35 -0400` / `Wire Automatica relay cards`
- Remote: `origin https://github.com/benleakwerkles/Werkles1.git`
- Git status: dirty; ahead 9 / behind 9 against `origin/snapshot/sally-good-werkles-2026-06-12`
- Local preview URLs:
  - `http://127.0.0.1:4317/` - Foreman / SoleDash control panel running and screenshot verified.
  - `http://127.0.0.1:3001/` - Next dev server running; root returns HTTP 200. `/soledash`, `/gd/command-console`, and `/gd/speaker` redirect to port 4317. `/proof/den` is 404 in this checkout.
- Screenshots captured: yes, see Screenshot Index.
- Changed files:
  - Modified: `foreman/MACHINE_TOPOLOGY.md`
  - Modified: `foreman/soledash/automatica/run_automatica_route.py`
  - Modified: `foreman/speaker/SPEAKER_CHARTER.md`
  - Modified: `scripts/foreman/foreman-control-server.mjs`
  - Deleted in working tree: five long-path GD run receipt/synthesis markdown files under `foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/`
  - Untracked: `app/soledash/`, `foreman/MULE_ELIMINATION_MAP_v1.md`, `foreman/NUGGETS_OF_WISDOM_TOP_25.md`, `foreman/machines/DOSS_SLEEP_MWB_DISCONNECT_V1.md`, `foreman/nuggets_of_wisdom_top_25.json`, `foreman/overseer/`, `foreman/soledash/ACTIVE_TASK.json`, `foreman/soledash/AUTOMATICA_APPROVALS.json`, `foreman/soledash/CRAWLER_PEARLS.json`, `foreman/soledash/FLEET_STATE.json`, `foreman/soledash/MACHINE_HEALTH.json`, `foreman/soledash/PROJECT_LOCKS.json`, `foreman/soledash/SWATTER_EVENT_STREAM.json`, `foreman/soledash/WORK_QUEUE.json`, `foreman/soledash/actions/`, `foreman/soledash/mobile/`, `foreman/soledash/receipts/`, `foreman/speaker/HYPOTHESIS_LIBRARY_v1.md`, `foreman/speaker/RECOMMENDATION_CONSTITUTION_V1.md`, `foreman/speaker/SPEAKER_DIAGNOSTIC_FLOW_v1.md`, `foreman/speaker/SPEAKER_USER_1_PROTOCOL.md`, `foreman/speaker/USER_QUALIFICATION_PROTOCOL_v1.md`, `foreman/speaker/USER_QUALIFICATION_RUBRIC_v1.md`, `foreman/wisdom/`, `return-to-work.cmd`, `scripts/foreman/doss-disable-modern-standby.ps1`, `scripts/foreman/return-to-work.ps1`, `scripts/foreman/start-soledash-mobile-readonly.ps1`, `scripts/wisdom-watcher.py`
- Obvious unique features:
  - Live Foreman / SoleDash control panel on port 4317.
  - Machine health surface with Doss GREEN, Sally DEGRADED, Betsy/Spanzee WATCH.
  - Automatica cards, including blocked Spanzee Remote Check with explicit blocker text.
  - GimpDash / Speaker routing anchors.
  - Speaker doctrine files, wisdom watcher files, project locks, work queue, crawler pearls, mobile and action receipt surfaces.
- Obvious broken areas:
  - Dirty working tree contains modified, deleted, and untracked work; no cleanup should occur before salvage.
  - Local branch is both ahead and behind its remote counterpart.
  - `/proof/den` is absent from this checkout.
  - `/soledash` depends on the Foreman server on port 4317, not standalone Next rendering.
  - Deleted GD receipt/synthesis files must be treated as danger-zone deletes until manually classified.

### Betsy reality

- Machine: Betsy
- Live local readback: `CAPTURE_REQUIRED`
- Best current evidence: GitHub branch `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12`
- Branch: `salvage/betsy/snapshot/sally-good-werkles-2026-06-12`
- Commit hash: `8e70a25547988b8b4820fa3c79fd85e07eddfe1a`
- Latest commit: `2026-06-15 17:40:45 -0400` / `Add SoleDash mobile field command surface for away-from-desk operator work.`
- Git status: remote branch only; no local Betsy worktree status captured.
- Changed files against `origin/snapshot/sally-good-werkles-2026-06-12`:
  - Modified: `app/soledash/layout.tsx`
  - Modified: `app/soledash/soledash.css`
  - Modified: `components/soledash/automatica-relay-grid.tsx`
  - Modified: `components/soledash/decision-surface.tsx`
  - Added: `components/soledash/mobile-field-command.tsx`
  - Added: `components/soledash/mobile-operator-strip.tsx`
- Divergence:
  - 1 commit ahead of `origin/snapshot/sally-good-werkles-2026-06-12`
  - 24 commits ahead of `origin/main`
- Local preview URL: `CAPTURE_REQUIRED`
- Screenshots captured: no Betsy-local screenshots; remote branch only.
- Obvious unique features:
  - Mobile field command surface for away-from-desk operator work.
  - Mobile operator strip.
  - Likely best salvage candidate for SoleDash mobile field mode.
- Obvious broken areas:
  - Betsy machine-local dirty state was not captured.
  - Branch must be reviewed against Doss dirty mobile files before any merge.

### Sally reality

- Machine: Sally
- Live local readback: `CAPTURE_REQUIRED`
- Current health evidence: Sally is classified DEGRADED in Doss machine-health truth; build/Cursor/terminal disabled, read-only/browser/visual audits allowed.
- Best current GitHub evidence: `origin/rescue/sally-dirty-worktree-2026-06-01`
- Branch: `rescue/sally-dirty-worktree-2026-06-01`
- Commit hash: `745dc1b2a58a15c2adaf8ddaa3a99838570c9766`
- Latest visible remote subject: `feat(foreman): operator UX reset with relay courier and crew dispatch`
- Git status: remote branch only; no fresh Sally worktree status captured.
- Last-known stale machine topology:
  - Sally Desktop clone: branch `rescue/sally-dirty-worktree-2026-06-01`, dirty, ahead of origin rescue by 27, commit prefix `8ba905b`, captured 2026-06-12.
  - Sally `C:\Dev\Werkles` clone: branch `snapshot/sally-good-werkles-2026-06-12`, clean, commit prefix `437792b`, captured 2026-06-12.
- Local preview URL: `CAPTURE_REQUIRED`
- Screenshots captured: no fresh Sally screenshots.
- Obvious unique features:
  - Possible operator UX reset / relay courier / crew dispatch work.
  - Possible dirty local-only work from Sally Desktop clone.
- Obvious broken areas:
  - Sally evidence is stale and machine is degraded.
  - Do not treat the remote rescue branch as a complete Sally salvage without local readback.

### Spanzee reality

- Machine: Spanzee
- Live local readback: `CAPTURE_REQUIRED`
- Branch: `CAPTURE_REQUIRED`
- Commit hash: `CAPTURE_REQUIRED`
- Git status: `CAPTURE_REQUIRED`
- Changed files: `CAPTURE_REQUIRED`
- Local preview URL: `CAPTURE_REQUIRED`
- Screenshots captured: no fresh Spanzee screenshots.
- Obvious unique features:
  - None proven in Git during this audit.
  - Doss SoleDash currently has a Spanzee Remote Check card, so Spanzee is part of the operational surface.
- Obvious broken areas:
  - Automatica card reports Spanzee Remote Check BLOCKED.
  - Current LAN identity/IP is unknown from Doss; prior route appears to probe an address now associated with a different desktop and no SSH/RDP listener is available there.

### GitHub reality

- Source: `https://github.com/benleakwerkles/Werkles1.git`
- Main hash: `0c727a2461f274f8990063ab9ee06b799a1890ed`
- Key remote refs:
  - `origin/main`: `0c727a2461f274f8990063ab9ee06b799a1890ed`
  - `origin/snapshot/sally-good-werkles-2026-06-12`: `ffccad027151e3e1759209c4fc28d985d7c9ce9b`
  - `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12`: `8e70a25547988b8b4820fa3c79fd85e07eddfe1a`
  - `origin/cursor/goop-cycle-pvp-9b25`: `2ed3902888cafabe5f9b88565a13308f7508be4d`
  - `origin/cursor/wonka-den-mood-reference-9b25`: `f32084eccb950625931ba0ba62c4be127585bd7f`
  - `origin/cursor/soledash-field-mode-v1-eeea`: `f883e55eb4938f35c5ca8d082e205dc18ad9e65d`
  - `origin/rescue/sally-dirty-worktree-2026-06-01`: `745dc1b2a58a15c2adaf8ddaa3a99838570c9766`
- Git status: remote refs only; clean remote truth, no working tree.
- Local preview URL: not applicable.
- Screenshots captured: no GitHub UI screenshot; Git data captured through `git fetch`, `git ls-remote`, and local ref inspection.
- Obvious unique features:
  - `origin/snapshot/...` holds the broad SoleDash / GD / Foreman integration set.
  - `origin/salvage/betsy/...` holds mobile SoleDash field command work.
  - `origin/cursor/goop-cycle-pvp-9b25` holds the strongest Den / TinkerDen-style product branch discovered: Proof Den, Goop Cycle APIs, Den scene/shell components, mood reference docs, migration.
  - `origin/cursor/wonka-den-mood-reference-9b25` appears to be an earlier Den mood branch contained by the Goop Cycle branch.
- Obvious broken areas:
  - No remote ref alone proves machine-local dirty work.
  - Several promising branches diverge from `origin/main`; no blind merge is safe.

### Vercel production reality

- Machine/surface: Vercel production
- URL: `https://werkles.com`
- Branch: `UNVERIFIED`
- Commit hash: `UNVERIFIED`
- Git status: not available from public surface.
- Production evidence:
  - Site reachable.
  - Served by Vercel.
  - Public page shows current production home copy: `Bring your piece to The Forge.`
  - Public build id observed previously: `MZpFC8NaYto552zzHtyZ7`
- Local preview URL: not applicable.
- Screenshots captured: yes, production home.
- Obvious unique features:
  - Public stable production homepage.
  - Likely older/prod-safe Werkles experience compared with Doss/SoleDash branches.
- Obvious broken areas:
  - Production commit hash is not exposed through public page headers/assets.
  - Authenticated Vercel inspect is still required before declaring production canonical.

## 2. Screenshot Index

All screenshots are saved under `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs`.

1. `salvage_view_01_vercel_production_home.png`
   - Surface: Vercel production home
   - URL: `https://werkles.com`
   - Purpose: public production baseline

2. `salvage_view_02_doss_foreman_top.png`
   - Surface: Doss Foreman / SoleDash control panel
   - URL: `http://127.0.0.1:4317/`
   - Purpose: local operator control surface baseline

3. `salvage_view_03_doss_gimpdash_tinkerden_routing.png`
   - Surface: Doss GimpDash / Speaker routing region
   - URL: `http://127.0.0.1:4317/#gimpdash`
   - Purpose: routing evidence for TinkerDen Intake / Speaker assimilation

4. `salvage_view_04_doss_automatica_cards.png`
   - Surface: Doss Automatica card region
   - URL: `http://127.0.0.1:4317/`
   - Purpose: shows blocked Spanzee Remote Check and live Automatica card state

5. `salvage_view_05_doss_machine_health.png`
   - Surface: Doss machine health region
   - URL: `http://127.0.0.1:4317/`
   - Purpose: shows Doss GREEN and fleet health counts

## 3. Unique Feature Map

- Best current Werkles / SoleDash foundation: `origin/snapshot/sally-good-werkles-2026-06-12`, plus Doss local dirty work that must be salvaged separately.
- Best current SoleDash mobile candidate: `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12`.
- Best current TinkerDen / Den candidate: `origin/cursor/goop-cycle-pvp-9b25`.
- Production-safe public baseline: Vercel production at `https://werkles.com`, commit unverified.
- Doss-only operational truth: live Foreman control panel, machine-health JSON, Automatica approvals/cards, work queue, project locks, crawler pearls, Speaker doctrine, wisdom watcher, return-to-work scripts.
- Sally potential salvage: rescue branch plus stale local-only evidence; requires live readback.
- Spanzee potential salvage: no repo evidence yet; only operational role and blocked remote-check state proven.

## 4. Keep / Maybe / Kill Recommendations

### Keep

- Keep every branch until Petra GO.
- Keep `origin/main` as GitHub canonical baseline.
- Keep `origin/snapshot/sally-good-werkles-2026-06-12` as the broad Werkles / SoleDash integration candidate.
- Keep Doss local dirty work intact until captured into a dedicated salvage branch or patch set.
- Keep `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12` as the strongest mobile SoleDash candidate.
- Keep `origin/cursor/goop-cycle-pvp-9b25` as the strongest Den / TinkerDen candidate.
- Keep `origin/cursor/wonka-den-mood-reference-9b25` until confirmed fully contained and obsolete.
- Keep `origin/rescue/sally-dirty-worktree-2026-06-01` until Sally local readback proves what is already saved and what is not.
- Keep the Vercel production deployment untouched until authenticated Vercel commit verification completes.

### Maybe

- Maybe consolidate `origin/cursor/soledash-field-mode-v1-eeea` after comparing it against the Betsy salvage mobile field command branch.
- Maybe retire older Den mood/reference branches after proving `origin/cursor/goop-cycle-pvp-9b25` contains their useful work.
- Maybe retire stale Sally rescue surfaces after Sally local dirty work is captured and reconciled.
- Maybe treat public Vercel as a fallback baseline only after production commit is identified.

### Kill

- Kill recommendation: none.
- There is no deletion-safe target before Petra GO.

## 5. Safe Merge Order

1. Freeze deletion and cleanup.
2. Verify Vercel production commit with authenticated Vercel access.
3. Capture Betsy, Sally, and Spanzee local worktrees directly, including branch, commit, status, changed files, and screenshots where runnable.
4. Create a protective Doss salvage branch or patch bundle for the dirty Doss worktree before any rebase, merge, reset, or cleanup.
5. Compare `origin/snapshot/sally-good-werkles-2026-06-12` against `origin/main` as the broad SoleDash/GD/Foreman integration candidate.
6. Compare `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12` against `origin/snapshot/sally-good-werkles-2026-06-12` as a focused mobile SoleDash patch.
7. Compare Doss dirty files against both `origin/snapshot/...` and Betsy salvage before choosing winners.
8. Keep `origin/cursor/goop-cycle-pvp-9b25` as a separate TinkerDen/Den lane until its product scope is explicitly approved.
9. Treat Sally rescue and Spanzee work as capture lanes, not merge lanes, until machine-local evidence is refreshed.
10. Run tests and screenshot verification on each candidate lane.
11. Ask Petra for GO.
12. Only after Petra GO, merge by smallest reviewed units.

## 6. Explicit "Do Not Delete Yet" List

- Do not delete `origin/snapshot/sally-good-werkles-2026-06-12`.
- Do not delete local Doss branch `snapshot/sally-good-werkles-2026-06-12`.
- Do not delete `origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12`.
- Do not delete `origin/cursor/goop-cycle-pvp-9b25`.
- Do not delete `origin/cursor/wonka-den-mood-reference-9b25`.
- Do not delete `origin/cursor/soledash-field-mode-v1-eeea`.
- Do not delete `origin/rescue/sally-dirty-worktree-2026-06-01`.
- Do not delete any `origin/cursor/soledash-*` research/design branch until compared.
- Do not delete Doss modified files listed in Reality Inventory.
- Do not delete Doss untracked `foreman/soledash/*`, `foreman/speaker/*`, `foreman/wisdom/*`, `foreman/overseer/*`, or `app/soledash/`.
- Do not accept the five long-path GD receipt/synthesis deletions until a human confirms those artifacts are disposable.
- Do not delete `foreman/soledash/PROJECT_LOCKS.json` or its active Wonka Den lock evidence.
- Do not delete Vercel production or change deployment settings until production commit is verified.
- Do not delete this audit's screenshot artifacts.

