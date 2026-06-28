# SOURCE_TRUTH_GITHUB_DECISION_PACKET

PACKET_ID: SOURCE_TRUTH_GITHUB_DECISION_PACKET_2026_06_27
OWNER: Swanson@Doss
STREAM: SPEAKER / ATLAS / SOURCE TRUTH
STATUS: BLOCKER_PACKET
CREATED_AT_UTC: 2026-06-27T21:52:44Z

## Why This Exists

The release valve can now build the branch, signed commit, and push path after operator signature validation clears, but `C:\speaker` has no configured GitHub `origin`.

Local files are not Source Truth. A local branch is not Source Truth. A chat claim is not Source Truth.

## Current Proven State

- Speaker root: `C:\speaker`
- Local branch: `main`
- Local HEAD: `44a907c Initialize Speaker repository shell`
- GitHub remote: `MISSING`
- Operator key lock: `C:\speaker\LOCKS\operator_pubkey.asc` is missing
- Release valve command exists: `node C:\speaker\bin\speakerctl.js promote-staged <action_capsule.json>`
- Readiness command exists: `node C:\speaker\bin\speakerctl.js verify-release-readiness`
- Feral readback exists: `GET http://127.0.0.1:3339/v1/system/release_valve`

## Required Operator Decision

Choose the GitHub Source Truth remote for Speaker / Atlas / Nerdkle release-valve artifacts.

The smallest acceptable decision is one exact remote URL:

```text
SPEAKER_SOURCE_TRUTH_REMOTE=<github remote url>
```

## Candidate Commands After Approval

Do not run these until Operator approves the exact GitHub remote.

```powershell
git -C C:\speaker remote add origin <GITHUB_REMOTE_URL>
git -C C:\speaker remote -v
node --no-warnings C:\speaker\bin\speakerctl.js verify-release-readiness
```

## Not Allowed Yet

- Do not push `C:\speaker` to an unnamed or guessed GitHub repo.
- Do not use the dirty Werkles worktree as the implicit Source Truth for Speaker.
- Do not create a release branch until a real operator-signature validation receipt exists.
- Do not call release-valve readiness green until `origin`, signing config, and operator key lock are all proven.

## Next Owner

Operator chooses the GitHub remote. Swanson executes only after the exact remote is approved.
