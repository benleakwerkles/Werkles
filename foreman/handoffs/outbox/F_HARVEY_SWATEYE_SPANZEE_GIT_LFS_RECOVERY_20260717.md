# F: Harvey Swateye — Spanzee Git LFS recovery

Packet ID: `F_HARVEY_SWATEYE_SPANZEE_GIT_LFS_RECOVERY_20260717`

Assignment ID: `SPANZEE_SWATEYE_GIT_LFS_RECOVERY`

Applies to: Dink, Maker/Cursor, Codex, or Handeye operating inside a current Werkles checkout on canonical machine `Spanzee` with hostname proof `SPANZEE`.

Read first:

- `foreman/harvey/HARVEY_SWATEYE_POLICY_V0_1_20260717.md`
- `scripts/foreman/Invoke-HarveySwateyeGitLfsRecovery.ps1`
- `.codex/rules/swateye.rules` when the receiver is Codex

## Command

Use only this fixed repository wrapper from the Werkles root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\Invoke-HarveySwateyeGitLfsRecovery.ps1 -Execute
```

Do not request or accept a persistent permission for `Stop-Process`, `Stop-Process -Name`, arbitrary PowerShell, or arbitrary process names. If the trusted project rule has just arrived, Codex must be restarted once before the project-local rule becomes active.

The wrapper may legitimately return `COMPLETED` with `stopped_count: 0`. That means no process passed every orphan proof; it is not permission to broaden the command.

## Required receipt

Return the wrapper's sanitized JSON plus this readback:

```text
PACKET_ID: F_HARVEY_SWATEYE_SPANZEE_GIT_LFS_RECOVERY_20260717
ASSIGNMENT_ID: SPANZEE_SWATEYE_GIT_LFS_RECOVERY
MACHINE: Spanzee
HOSTNAME: SPANZEE
POLICY_ID: SWATEYE_SPANZEE_GIT_LFS_ORPHAN_RECOVERY_V1
STATUS: COMPLETED | BLOCKER
INSPECTED_COUNT: <integer>
ELIGIBLE_COUNT: <integer>
STOPPED_COUNT: <integer>
BLANKET_NAME_KILL_USED: NO
SECRETS_READ_OR_PRINTED: NO
BLOCKERS: NONE | <exact codes>
NEXT_ACTION: RESUME_UNREAL_BUILD | REPAIR_SWATEYE_ROUTE | REVIEW_UNPROVEN_PROCESS
```

`SENT`, a visible prompt, an allowed toggle, or command launch is not completion.
