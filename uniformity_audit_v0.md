# WONKA_WORKSTATION_UNIFORMITY_AUDIT_V0

Status: `BOOK ADVANCED`  
Books: Book I — Escape Velocity; Book V — Builder Operating System  
Created: 2026-06-20  
Author: Maker@Betsy  
Return Destination: TinkerDen Intake  
Assimilation Destination: Speaker  

## Executive Answer

Can Maker, Dink, or Swanson sit down at Spanzee tomorrow and operate without noticing a meaningful difference?

No. Spanzee is not yet a proven peer workstation.

The blocking evidence is not preference or polish. It is trust and observability: the repo already records that Betsy can see Spanzee, but Spanzee has not trusted the access yet, and FLEET_STATE says `Spanzee node not instrumented`. Without authenticated desktop control plus a local hands readback, Spanzee's Node, Git, Cursor, VS Code, Unreal, Python, repo path, launch shortcuts, and automation stack are unknown.

## Evidence Boundary

Directly verified machine in this session: `Betsy`.

Other machines are classified from repo evidence only. This audit does not claim live local state for `Doss`, `Sally`, or `Spanzee` without a current local readback.

Primary evidence:

- `LOCAL HANDS READBACK` on Betsy: branch `preview/wonka-den-safe-preview-20260618`, commit `dc68295`, repo `C:\Users\Ben Leak\Desktop\github\Werkles`, localhost port `3000` listening.
- Betsy shell checks: Node `v24.16.0`, npm `11.13.0`, Git `2.54.0.windows.1`, PowerShell `5.1.26100.8655`, VS Code `1.125.0`, Cursor `3.8.11`.
- Betsy shell checks: Python missing, `py` launcher missing, common Unreal install paths missing.
- Betsy shell checks: Perplexity Desktop path present, Perplexity Start Menu shortcut present, `soledash.cmd` present, `SoleDash.lnk` desktop shortcut missing.
- `foreman/WORKSTATION_2_0_STACK.md`: Golden Image requires Aeye layer and Thufir/Perplexity Desktop.
- `foreman/soledash/FLEET_STATE.json`: Betsy observed/live; Doss partial live but identity unproven; Sally observed/live but receipt path unknown; Spanzee unknown and not instrumented.
- `components/soledash/workbench-first-panel.tsx`: Spanzee reachable, but not authenticated, desktop not visible, input not accepted.
- `foreman/reviews/SALLY_PRE_MERGE_SNAPSHOT_2026-06-06.md`: Sally had typecheck pass and preserved local lanes on `rescue/sally-dirty-worktree-2026-06-01`.
- `foreman/ghost-forge/SALLY_FINAL_RUN_STATUS.md`: Sally ran Ghost Forge scripts from `C:\Dev\Werkles`.

## Machine Audit

### Betsy

Present:

- Node `v24.16.0`
- npm `11.13.0`
- Git `2.54.0.windows.1`
- Cursor `3.8.11`
- VS Code `1.125.0`
- PowerShell `5.1.26100.8655`
- Repo path: `C:\Users\Ben Leak\Desktop\github\Werkles`
- Localhost running on port `3000`
- TinkerDen route exists: `app/tinkerden/page.tsx`
- SoleDash route exists: `app/soledash/page.tsx`
- PowerShell helpers and automation scripts exist under `scripts/foreman/`
- npm automation scripts exist: `relay:*`, `approval:*`, `shakespeare:*`, `gd:*`, smoke tests, deploy alias guard
- Perplexity Desktop path present: `C:\Users\Ben Leak\AppData\Local\Programs\Perplexity\Perplexity.exe`
- Perplexity Start Menu shortcut present
- `soledash.cmd` present
- SoleDash desktop shortcut installer present: `scripts/foreman/install-soledash-desktop-shortcut.ps1`

Missing:

- Python command is not installed; Windows Store alias responded instead.
- `py` launcher is not installed.
- Common Unreal install paths were not present:
  - `C:\Program Files\Epic Games`
  - `C:\Program Files\Unreal Engine`
  - `C:\Program Files (x86)\Epic Games`
- Desktop `SoleDash.lnk` was not present.

Different Version:

- No peer live version data available in this audit, so no confirmed version mismatch against another machine.

Unknown:

- Whether Epic Launcher or Unreal exists in a nonstandard path.
- Whether browser sessions for Petra/Ender/Skybro/Bean are logged in and restorable.
- Whether all launch shortcuts are pinned exactly like Sally/Doss/Spanzee.

### Doss

Present:

- Fleet entry exists.
- Status is `PARTIAL LIVE`.
- Active work is recorded as `Doss Stability Investigation`.
- Remote path status is `REACHABLE`.

Missing:

- No confirmed current local hands readback in the available evidence.

Different Version:

- Unknown. No live Doss versions for Node, Git, Cursor, VS Code, Unreal, Python, or PowerShell helpers were available.

Unknown:

- Machine identity is unproven.
- Node version
- npm version
- Git version
- Cursor version
- VS Code version
- Unreal install state
- TinkerDen route availability
- SoleDash route availability
- Python install state
- PowerShell helper availability
- Repo path
- Launch shortcuts
- Automation scripts
- Whether Dink, Maker, or Swanson can take over without setup friction

### Sally

Present:

- Fleet entry exists.
- Status is `LIVE`.
- Evidence status is `OBSERVED`.
- Hostname recorded as `DESKTOP-SJSJMNK`.
- Historic repo work existed on Sally.
- Sally pre-merge snapshot recorded typecheck pass on 2026-06-06.
- Ghost Forge final scripts ran from `C:\Dev\Werkles`.

Missing:

- No current receipt path in `FLEET_STATE`.
- No current local hands readback in this audit.

Different Version:

- Repo path differs from Betsy evidence:
  - Betsy: `C:\Users\Ben Leak\Desktop\github\Werkles`
  - Sally evidence: `C:\Dev\Werkles`
- Branch/commit state differs in historical records:
  - Sally snapshot branch: `rescue/sally-dirty-worktree-2026-06-01`
  - Betsy current branch: `preview/wonka-den-safe-preview-20260618`

Unknown:

- Current Node version
- Current npm version
- Current Git version
- Current Cursor version
- Current VS Code version
- Current Unreal install state
- Current TinkerDen/SoleDash route availability
- Current Python install state
- Current PowerShell helper availability
- Current launch shortcuts
- Current automation script readiness
- Whether Sally currently matches Betsy after recent TinkerDen/SoleDash additions

### Spanzee

Present:

- Spanzee is represented in repo/UI as a target machine.
- UI evidence says Spanzee is reachable.
- UI copy says Spanzee hosts RustDesk server.

Missing:

- Authenticated access is missing.
- Desktop visible proof is missing.
- Input accepted proof is missing.
- Fleet instrumentation is missing.

Different Version:

- Unknown. There is no live Spanzee tool/version readback.

Unknown:

- Hostname
- Active cousin/Aeye assignment
- Node version
- npm version
- Git version
- Cursor install state/version
- VS Code install state/version
- Unreal install state/version
- TinkerDen availability
- SoleDash availability
- Python install state/version
- PowerShell helper availability
- Repo path
- Launch shortcuts
- Automation scripts
- Whether repo is cloned at all
- Whether localhost/dev server can start
- Whether Maker, Dink, or Swanson can operate there tomorrow

## Tool Parity Matrix

| Area | Betsy | Doss | Sally | Spanzee |
|---|---|---|---|---|
| Installed tools baseline | Present for Node/Git/Cursor/VS Code/PowerShell | Unknown | Historically present enough for repo work, current unknown | Unknown |
| Node | Present: `v24.16.0` | Unknown | Unknown current | Unknown |
| npm | Present: `11.13.0` | Unknown | Unknown current | Unknown |
| Git | Present: `2.54.0.windows.1` | Unknown | Unknown current | Unknown |
| Cursor | Present: `3.8.11` | Unknown | Unknown current | Unknown |
| VS Code | Present: `1.125.0` | Unknown | Unknown current | Unknown |
| Unreal | Missing at common paths | Unknown | Unknown | Unknown |
| TinkerDen | Present in repo; route exists | Unknown | Unknown current | Unknown |
| SoleDash | Present in repo; route exists | Unknown | Unknown current | Unknown |
| Python | Missing | Unknown | Unknown | Unknown |
| PowerShell helpers | Present under repo scripts | Unknown | Historically script-capable, current unknown | Unknown |
| Repo path | Present: `C:\Users\Ben Leak\Desktop\github\Werkles` | Unknown | Different: `C:\Dev\Werkles` evidence | Unknown |
| Launch shortcuts | Perplexity present; SoleDash desktop shortcut missing | Unknown | Unknown | Unknown |
| Automation scripts | Present in repo and npm scripts | Unknown | Historically used Ghost Forge scripts | Unknown |
| Fleet instrumentation | Observed/live | Hypothesis/partial live | Observed/live but no receipt path | Missing/not instrumented |
| Remote control/access | Local | Reachable but identity unproven | Local evidence historical | Reachable but not authenticated/trusted |

## Top 10 Parity Gaps

1. Spanzee authenticated control is not proven: reachable is not enough.
2. Spanzee has no fleet instrumentation.
3. Spanzee has no local hands readback.
4. Doss machine identity is unproven and awaiting `LOCAL_DOSS_WINDOWS` readback.
5. Sally has no current receipt path in `FLEET_STATE`.
6. Python is missing on Betsy, so any Python-backed helper will fail there.
7. Unreal is missing on Betsy at common paths, so game/MMORPG/Unreal work is not parity-ready there.
8. SoleDash desktop shortcut is missing on Betsy despite the installer script existing.
9. Repo paths differ between Betsy and Sally evidence, so scripts with path assumptions may break.
10. Tool versions for Doss, Sally, and Spanzee are unknown, so version drift cannot be ruled out.

## Priority Fix List

### P0 — Blocks Workstation Parity

1. Get authenticated Spanzee access: RustDesk/trust handshake must reach desktop visible + input accepted.
2. Run `LOCAL HANDS READBACK` on Spanzee and record hostname, repo path, branch, commit, working tree, localhost, port, and tool versions.
3. Instrument Spanzee in `FLEET_STATE` with observed evidence, not unknown/hypothesis.
4. Run `LOCAL_DOSS_WINDOWS` readback and resolve Doss machine identity.
5. Add current Sally receipt path/readback to `FLEET_STATE`.

### P1 — Productivity Loss

6. Install or deliberately mark Python as not required on Betsy and every peer workstation.
7. Decide whether Unreal is required for Workstation 2.0. If yes, install/verify it on Betsy first and then mirror it.
8. Normalize repo paths or document per-machine path variables so scripts do not assume `C:\Dev\Werkles` or `C:\Users\Ben Leak\Desktop\github\Werkles`.
9. Verify Cursor and VS Code versions across Doss, Sally, and Spanzee.
10. Verify TinkerDen and SoleDash can launch from each workstation on localhost.

### P2 — Convenience

11. Install the SoleDash desktop shortcut on Betsy with `scripts/foreman/install-soledash-desktop-shortcut.ps1`.
12. Create the same launcher/shortcut set on each workstation.
13. Add a machine-uniformity readback script that prints exactly the audit categories in this file.
14. Keep Perplexity/Thufir launch path checks in the workstation readback.

## Recommended Order of Correction

1. Spanzee trust/access: prove authenticated desktop visible + input accepted.
2. Spanzee local readback: capture tool versions, repo path, localhost, and shortcuts.
3. Spanzee fleet instrumentation: update `FLEET_STATE` from unknown to observed only after readback.
4. Doss identity readback: resolve the current `DOSS_HOSTNAME` hypothesis.
5. Sally current readback: refresh stale historical evidence and add receipt path.
6. Normalize repo path strategy across Betsy/Sally/Doss/Spanzee.
7. Install/decide Python across all machines.
8. Decide Unreal requirement and install/verify if needed.
9. Install missing SoleDash shortcuts and confirm launch behavior.
10. Re-run this audit with live readbacks from all four machines.

## Final Classification

Spanzee is not a true peer workstation yet.

It can become one, but the next required proof is not another UI card. The next proof is a live Spanzee readback after authenticated desktop access. Until that exists, Spanzee remains `Unknown` for workstation parity and cannot be treated as a place where Maker, Dink, or Swanson can sit down tomorrow without meaningful friction.
