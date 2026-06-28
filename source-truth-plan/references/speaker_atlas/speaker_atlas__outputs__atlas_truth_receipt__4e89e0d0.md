# ATLAS_TRUTH_RECEIPT

Mission: ATLAS_TRUTH_RECEIPT  
Owner: Swanson@Doss  
Destination: Branch Truth / Shared Reality / branch salvage territory  
Method: Existing audit material only. No merge, delete, cleanup, fetch, or new machine capture.

## Short Answer

Atlas was intended to be an archive / asset vault / local worker box, plus a safe local preview mirror. It was not intended to be canonical truth, an active writer, a deployer, or a machine allowed to hold secrets.

Atlas was built only as a docs and script scaffold in the visible audit material. I found no proof of a live Atlas machine, a working Atlas service, a registered Atlas vault path, or a branch/worktree shadow-build controller.

Atlas was not proven to have been renamed into Branch Truth, Shared Reality, salvage map, or cockpit. The later Branch Truth / salvage / cockpit work appears to have absorbed the problem space, not renamed Atlas itself.

Overall proof level: PARTIAL  
Next action: RECOVER

## 1. What Atlas Was Intended To Do

Proof level: PROVEN  
Next action: RECOVER

Atlas role from existing scaffold:

- Archive / asset vault / local worker box.
- Repo backup target.
- Asset vault.
- Screenshot and log archive.
- Ghost Forge output archive.
- Bellows draft archive.
- Local preview mirror.
- File indexing / search.
- Non-critical background jobs.
- Optional sandbox image/video experiments.

Atlas hard boundaries:

- Not source of truth.
- Not active writer.
- Must not deploy.
- Must not push to main or shared branches.
- Must not apply SQL/RLS.
- Must not hold secrets, API keys, tokens, credentials, or `.env` files.
- Must not move money or touch billing.
- Must not run production spend-bearing Ghost Forge/Bellows.

Evidence:

- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\foreman\ATLAS_MACHINE_PLAN.md`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\foreman\MACHINE_TOPOLOGY.md`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\scripts\foreman\mirror-werkles-to-atlas.ps1`

## 2. Did Atlas Get Built?

Proof level: PARTIAL  
Next action: RECOVER

Built as:

- Doctrine / topology document.
- Atlas machine plan.
- Copy-only mirror PowerShell script scaffold.
- PR/branch entry visible in branch salvage audit.

Not proven built as:

- Live Atlas machine.
- Working Atlas service.
- Branch/worktree shadow-build controller.
- File-backed shadow-build registry.
- Running preview host.
- Canonical source of truth.

The mirror script is a concrete artifact, but it is a backup/mirror script, not a full Atlas system.

## 3. Was Atlas Renamed Into Branch Truth / Shared Reality / Salvage Map / Cockpit?

Proof level: UNPROVEN  
Next action: STOP

No existing audit material proves a rename.

The evidence shows Atlas as its own machine role and PR:

- Branch: `origin/cursor/atlas-machine-role-eeea`
- PR mention: `PR #3 - Atlas`
- Commit subject: `topology: add Atlas archive/vault machine role + mirror script scaffold`

The later Branch Truth / salvage map / cockpit receipts are adjacent territory, but the audit trail does not prove that Atlas was formally renamed into them.

## 4. Is There Working Atlas Code, A Stub, A Doctrine Doc, Or Only Conversation?

Proof level: PARTIAL  
Next action: RECOVER

Found artifacts:

- Doctrine / plan doc: PROVEN
- Machine topology doc: PROVEN
- Mirror script scaffold: PROVEN
- Working Atlas app/service: UNPROVEN
- Live Atlas vault/readback: UNPROVEN
- Conversation-only: false, because repo artifacts exist

Exact artifact paths:

- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\foreman\ATLAS_MACHINE_PLAN.md`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\foreman\MACHINE_TOPOLOGY.md`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\scripts\foreman\mirror-werkles-to-atlas.ps1`

The mirror script synopsis says it mirrors active Werkles repo artifacts into an Atlas vault. The script uses copy-only behavior and excludes known secret/build paths.

## 5. Which Files / Branches / Commits Mention Atlas?

Proof level: PROVEN  
Next action: RECOVER

### Branches

- `origin/cursor/atlas-machine-role-eeea`

### Commits

- `4964d80eaf7e2a20b8d3b34e23e2eb42d502ef00`
  - Subject: `topology: add Atlas archive/vault machine role + mirror script scaffold`
  - Date: `2026-06-01T15:44:40Z`
  - Added files:
    - `foreman/ATLAS_MACHINE_PLAN.md`
    - `foreman/MACHINE_TOPOLOGY.md`
    - `scripts/foreman/mirror-werkles-to-atlas.ps1`

- `ffb4a76bb58d04b29d4a2869daf4c03e7cfc89d5`
  - Subject: `Merge PR #3: add Atlas archive/vault machine role + mirror script scaffold`
  - Date: `2026-06-01T22:04:06Z`

### Audit Files

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\branch_preview_index.md`
  - Lists `origin/cursor/atlas-machine-role-eeea`.
  - Classifies it as `docs/research`.

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\preview_branch_classification.tsv`
  - Full commit: `4964d80eaf7e2a20b8d3b34e23e2eb42d502ef00`.
  - Branch: `origin/cursor/atlas-machine-role-eeea`.
  - Preview kind: `docs/research`.
  - Ahead of main: `0`.
  - Behind main: `12`.

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\branch_preview_manifest.json`
  - Contains the Atlas branch and full commit.

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\audit-push-20260621-180250c\audits\branch-salvage-2026-06-21-180250\ref_inventory.tsv`
  - Lists `origin/cursor/atlas-machine-role-eeea` at full commit `4964d80eaf7e2a20b8d3b34e23e2eb42d502ef00`.

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\audit-push-20260621-180250c\audits\branch-salvage-2026-06-21-180250\all_visible_branches_from_doss.txt`
  - Lists visible remote Atlas branch.

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\audit-push-20260621-180250c\audits\branch-salvage-2026-06-21-180250\all_refs_recent_log.txt`
  - Mentions both Atlas commit and PR merge commit.

- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-build-continue\scripts\foreman\foreman-control-server.mjs`
  - Mentions `PR #3 - Atlas`, status `MERGED`, purpose `Atlas machine role`.

Additional preview worktrees with the same PR #3 Atlas mention in `scripts\foreman\foreman-control-server.mjs`:

- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\gd-status-layer`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\gimpdash-human-gates`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-field-mode`
- `C:\Users\BenLeak\Documents\Codex\wp\previews-20260621-183008\soledash-inbox-outbox-build`

## 6. What Currently Prevents Shadow Builds Across Branches / Worktrees?

Proof level: PROVEN for listed blockers from current receipts; UNPROVEN for any Atlas-specific shadow-build controller because no such controller is shown.  
Next action: RECOVER

Current blockers proven by existing audit receipts:

- Doss is the only verified live preview hub in the current branch preview layer.
- Betsy, Sally, and Spanzee local worktrees were not directly captured in the decision layer.
- Spanzee remote-control readiness remains unproven.
- Sally is degraded; read-only/browser/visual audits were allowed, but fresh Sally worktree status was not proven.
- Betsy live local readback remained `CAPTURE_REQUIRED`.
- Some Foreman previews required uncommitted preview-only port shims because the original control panel wanted port `4317`; those shims are preview evidence, not merge evidence.
- Betsy-side LAN verification was blocked by lack of a working remote command path from Doss to Betsy.
- Doss firewall and network posture made Doss a single preview-serving SPOF.
- No audit receipt proves an Atlas-owned live vault, Atlas host readback, or Atlas file-backed shadow-build registry.

Evidence:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\branch_preview_decision_layer.md`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\betsy_branch_review_cockpit_receipt.md`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\branch_salvage_audit_tinkerden_intake.md`
- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\github_audit_branch_receipt.md`

## 7. What Is The Canonical Source Of Truth Today?

Proof level: PROVEN for Branch Truth audit at time of receipt; Vercel production commit still needed authenticated verification in that receipt.  
Next action: STOP for competing canon; RECOVER for Atlas as non-canonical supporting role.

Canonical branch:

- `main`

Canonical remote:

- `origin https://github.com/benleakwerkles/Werkles1.git`

Canonical GitHub main hash from existing audit receipt:

- `0c727a2461f274f8990063ab9ee06b799a1890ed`

Best WIP candidate noted by audit, but not canonical:

- Branch: `origin/snapshot/sally-good-werkles-2026-06-12`
- Commit: `ffccad027151e3e1759209c4fc28d985d7c9ce9b`

Evidence:

- `C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\branch_truth_audit_tinkerden_intake.md`

## 8. Smallest Next Action To Prevent Another Orphan Build

Proof level: PARTIAL  
Next action: RECOVER

Smallest next action:

Create a Branch Truth / Shared Reality receipt entry for Atlas before building anything else.

That receipt entry should:

- Register Atlas as `archive / asset vault / local worker box / local preview mirror`.
- Link the exact branch `origin/cursor/atlas-machine-role-eeea`.
- Link commit `4964d80eaf7e2a20b8d3b34e23e2eb42d502ef00`.
- Link merge commit `ffb4a76bb58d04b29d4a2869daf4c03e7cfc89d5`.
- Link the three scaffold files:
  - `foreman/ATLAS_MACHINE_PLAN.md`
  - `foreman/MACHINE_TOPOLOGY.md`
  - `scripts/foreman/mirror-werkles-to-atlas.ps1`
- Mark Atlas proof as `PARTIAL`.
- Mark live Atlas host/vault/readback as `CAPTURE_REQUIRED`.
- Mark Atlas as `NON_CANONICAL`.
- Add a STOP rule: no Atlas shadow build, merge, or automation until a file-backed shadow-build registry and live Atlas vault path are proven.

Recommended status:

- RECOVER Atlas as a Branch Truth receipt/card.
- STOP new Atlas implementation until live Atlas readback exists.
- Do not MERGE Atlas-related work based on the current material alone.
- Do not BUILD a new Atlas system until the orphan-proof registry exists.

## Final Classification

Best current description:

Atlas exists as design plus scaffold, not as a proven working system.

Canonical phrase:

`ATLAS EXISTS AS DESIGN AND MIRROR SCRIPT SCAFFOLD, NOT AS PROVEN LIVE IMPLEMENTATION.`

Proof level:

PARTIAL

Next action:

RECOVER
